import { test, expect } from '@playwright/test';
import {
    setupErrorSuppression,
    waitForDiveDebugEvent,
} from './helper/setupErrorSuppression';
import { navigateToExample } from './helper/navigateToExample';

async function navigateToSwitchCanvas(
    page: Parameters<typeof setupErrorSuppression>[0],
    path = '/switch-canvas',
) {
    setupErrorSuppression(page);
    const readyStartedAt = Date.now();

    await navigateToExample(page, path, {
        waitForCanvasVisible: false,
        waitForRenderedCanvas: false,
        readySelector: '[data-testid="switch-canvas-page"]',
    });

    return waitForDiveDebugEvent(
        page,
        [{ scope: 'DiveSwitchCanvas', stage: 'initialize-complete' }],
        {
            timeoutMs: 30000,
            sinceMs: readyStartedAt,
            description: 'SwitchCanvas initial state',
        },
    );
}

test('shows canvas', async ({ page }) => {
    const readyEvent = await navigateToSwitchCanvas(page);

    expect(readyEvent.text).toContain('ready: true');
    expect(readyEvent.text).toContain('activeCanvas: 0');
    expect(readyEvent.text).toContain('activeCanvasTestId: switch-canvas-0');
    expect(readyEvent.text).toContain('canvasCount: 3');
    await expect(page.getByTestId('switch-canvas-panel-0')).toBeVisible();
    await expect(page.getByTestId('switch-canvas-button-1')).toBeEnabled();
});

test('click button to switch canvas', async ({ page }) => {
    setupErrorSuppression(page);
    const switchStartedAt = Date.now();

    await navigateToExample(page, '/switch-canvas?switchCanvasTo=1', {
        waitForCanvasVisible: false,
        waitForRenderedCanvas: false,
        readySelector: '[data-testid="switch-canvas-page"]',
    });

    const switchEvent = await waitForDiveDebugEvent(
        page,
        [{ scope: 'DiveSwitchCanvas', stage: 'orbit-controller-dom-updated' }],
        {
            timeoutMs: 30000,
            sinceMs: switchStartedAt,
            description: 'SwitchCanvas canvas switch',
        },
    );

    expect(switchEvent.text).toContain('index: 1');
});

test('keeps switch buttons visible in compact viewport', async ({ page }) => {
    setupErrorSuppression(page);
    const layoutStartedAt = Date.now();

    await page.setViewportSize({ width: 360, height: 300 });
    await navigateToExample(page, '/switch-canvas', {
        waitForCanvasVisible: false,
        waitForRenderedCanvas: false,
        readySelector: '[data-testid="switch-canvas-page"]',
    });

    const layoutEvent = await waitForDiveDebugEvent(
        page,
        [
            {
                scope: 'DiveSwitchCanvas',
                stage: 'compact-buttons-layout-valid',
            },
        ],
        {
            timeoutMs: 30000,
            sinceMs: layoutStartedAt,
            description: 'SwitchCanvas compact button layout',
        },
    );

    expect(layoutEvent.text).toContain('viewportWidth: 360');
    expect(layoutEvent.text).toContain('viewportHeight: 300');
});
