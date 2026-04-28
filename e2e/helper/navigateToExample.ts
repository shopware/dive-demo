import type { Page } from '@playwright/test';
import { expect, type Locator } from '@playwright/test';
import {
    dumpPageDiagnostics,
    ensureDiveDebugEventRecorder,
    waitForDiveDebugEvent,
    type DiveDebugEventMatcher,
} from './setupErrorSuppression';

type NavigateToExampleOptions = {
    filePattern?: string | RegExp;
    timeoutMs?: number;
    waitForAssetResponse?: boolean;
    assetResponseTimeoutMs?: number;
    waitForCanvasVisible?: boolean;
    waitForRenderedCanvas?: boolean;
    readySelector?: string;
};

const readyEventsBySelector = new Map<string, DiveDebugEventMatcher[]>([
    [
        '[data-testid="quick-view-page"]',
        [{ scope: 'DiveQuickView', stage: 'ready-true' }],
    ],
    [
        '[data-testid="switch-canvas-page"]',
        [{ scope: 'DiveSwitchCanvas', stage: 'initialize-complete' }],
    ],
    [
        '[data-testid="target-animation-page"]',
        [{ scope: 'DiveTargetAnimation', stage: 'controls-ready' }],
    ],
    ['[data-testid="ar-page"]', [{ scope: 'DiveAR', stage: 'ready-true' }]],
    [
        '[data-testid="place-on-floor-page"]',
        [{ scope: 'DivePlaceOnFloor', stage: 'ready-true' }],
    ],
    [
        '[data-testid="clip-animation-page"]',
        [{ scope: 'DiveClipAnimation', stage: 'ready-true' }],
    ],
    [
        '[data-testid="hdr-environment-page"]',
        [{ scope: 'DiveHDREnvironment', stage: 'ready-true' }],
    ],
    [
        '[data-testid="focus-object-page"]',
        [{ scope: 'DiveFocusObject', stage: 'ready-true' }],
    ],
    ['[data-testid="od-page"]', [{ scope: 'DiveOD', stage: 'ready-true' }]],
]);

function withDiveDebugParam(path: string): string {
    const parsed = new URL(path, 'https://dive-e2e.local');
    parsed.searchParams.set('diveDebug', '1');

    if (/^https?:\/\//i.test(path)) {
        return parsed.toString();
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

async function waitForSettlingDelay(frames = 2): Promise<void> {
    // Some CI runs keep the page's main thread busy long enough that a
    // page.evaluate(requestAnimationFrame(...)) roundtrip never resolves
    // before the test timeout. A short Node-side delay gives the demo a
    // chance to settle without depending on page responsiveness.
    await new Promise<void>((resolve) => {
        setTimeout(resolve, Math.max(frames, 1) * 16);
    });
}

async function waitForRenderedCanvas(
    canvas: Locator,
    timeoutMs: number,
): Promise<void> {
    await expect
        .poll(
            async () =>
                canvas
                    .evaluate((element) => {
                        if (!(element instanceof HTMLCanvasElement)) {
                            return false;
                        }

                        const rect = element.getBoundingClientRect();
                        const style = window.getComputedStyle(element);

                        return (
                            rect.width >= 1 &&
                            rect.height >= 1 &&
                            element.width >= 1 &&
                            element.height >= 1 &&
                            style.display !== 'none' &&
                            style.visibility !== 'hidden'
                        );
                    })
                    .catch(() => false),
            { timeout: timeoutMs },
        )
        .toBe(true);

    await waitForSettlingDelay(4);
    await canvas.page().waitForTimeout(750);
}

async function waitForReadySignal(
    page: Page,
    readySelector: string,
    timeoutMs: number,
    sinceMs: number,
    settleAfterReady: boolean,
): Promise<void> {
    const readyEvents = readyEventsBySelector.get(readySelector);
    if (!readyEvents) {
        throw new Error(
            `No DiveDebug ready event is configured for ${readySelector}. ` +
                'Add an explicit selector-to-event mapping before using this helper.',
        );
    }

    await waitForDiveDebugEvent(page, readyEvents, {
        timeoutMs,
        sinceMs,
        description: `${readySelector} ready event`,
    });

    if (settleAfterReady) {
        await waitForSettlingDelay(2);
    }
}

/**
 * Navigates to a demo page and waits for the 3D model to be fully loaded
 * by listening for the model file's network response, then waiting for
 * the renderer to produce a frame and Vue's reactivity to settle.
 *
 * No explicit timeout on waitForResponse — the test-level timeout
 * (configured per-environment in playwright.config.ts) controls the
 * overall deadline so we don't race against page.goto on slow CI runners.
 */
export async function navigateToExample(
    page: Page,
    path: string,
    options?: NavigateToExampleOptions,
) {
    const {
        filePattern = /\.(glb|gltf|step|stp|iges|igs)(\?|$)/i,
        timeoutMs = 60000,
        waitForAssetResponse = true,
        assetResponseTimeoutMs = 15000,
        waitForCanvasVisible = true,
        waitForRenderedCanvas: shouldWaitForRenderedCanvas = true,
        readySelector,
    } = options ?? {};

    ensureDiveDebugEventRecorder(page);

    const matcher = (url: string) =>
        typeof filePattern === 'string'
            ? url.includes(filePattern)
            : filePattern.test(url);

    const navigationStartedAt = Date.now();
    await page.goto(
        readySelector ? withDiveDebugParam(path) : path,
        { waitUntil: 'domcontentloaded', timeout: 60000 },
    );

    if (waitForAssetResponse) {
        await page
            .waitForResponse((resp) => matcher(resp.url()) && resp.ok(), {
                timeout: assetResponseTimeoutMs,
            })
            .catch(() => null);
    }

    const canvas = page.locator('canvas').first();

    if (waitForCanvasVisible) {
        await expect(canvas).toBeVisible({ timeout: timeoutMs });
    }

    if (shouldWaitForRenderedCanvas) {
        try {
            await waitForRenderedCanvas(canvas, timeoutMs);
        } catch (error) {
            await dumpPageDiagnostics(page, `${path}:rendered-canvas-timeout`);
            throw error;
        }
    }

    if (waitForCanvasVisible || shouldWaitForRenderedCanvas) {
        await waitForSettlingDelay(2);
    }

    if (readySelector) {
        try {
            await waitForReadySignal(
                page,
                readySelector,
                timeoutMs,
                navigationStartedAt,
                waitForCanvasVisible || shouldWaitForRenderedCanvas,
            );
        } catch (error) {
            await dumpPageDiagnostics(
                page,
                `${path}:ready-timeout`,
                readySelector,
            );
            throw error;
        }
    }
}
