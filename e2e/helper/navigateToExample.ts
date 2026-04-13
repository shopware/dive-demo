import type { Page } from '@playwright/test';
import { expect, type Locator } from '@playwright/test';

type NavigateToExampleOptions = {
    filePattern?: string | RegExp;
    timeoutMs?: number;
    waitForAssetResponse?: boolean;
    assetResponseTimeoutMs?: number;
    waitForCanvasVisible?: boolean;
    waitForRenderedCanvas?: boolean;
};

async function waitForAnimationFrames(page: Page, frames = 2): Promise<void> {
    // Some CI runs keep the page's main thread busy long enough that a
    // page.evaluate(requestAnimationFrame(...)) roundtrip never resolves
    // before the test timeout. A short Node-side delay gives the demo a
    // chance to settle without depending on page responsiveness.
    await page.waitForTimeout(Math.max(frames, 1) * 16);
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

    await waitForAnimationFrames(canvas.page(), 4);
    await canvas.page().waitForTimeout(750);
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
    } = options ?? {};

    const matcher = (url: string) =>
        typeof filePattern === 'string'
            ? url.includes(filePattern)
            : filePattern.test(url);

    await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60000 });

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
        await waitForRenderedCanvas(canvas, timeoutMs);
    }

    if (waitForCanvasVisible || shouldWaitForRenderedCanvas) {
        await waitForAnimationFrames(page, 2);
    }
}
