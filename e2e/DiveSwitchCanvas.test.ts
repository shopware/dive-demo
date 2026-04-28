import { test, expect } from '@playwright/test';
import {
    setupErrorSuppression,
    waitForDiveDebugEvent,
} from './helper/setupErrorSuppression';
import { navigateToExample } from './helper/navigateToExample';

test('shows canvas', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToExample(page, '/switch-canvas', {
        waitForCanvasVisible: false,
        waitForRenderedCanvas: false,
        readySelector: '[data-testid="switch-canvas-page"]',
    });
    await expect(page.getByTestId('switch-canvas-panel-0')).toBeVisible();
    await expect(page.getByTestId('switch-canvas-button-1')).toBeEnabled();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('dive-switch-canvas-initial.png');
});

test('click button to switch canvas', async ({ page }) => {
    setupErrorSuppression(page);
    const switchStartedAt = Date.now();

    await navigateToExample(page, '/switch-canvas?switchCanvasTo=1', {
        waitForCanvasVisible: false,
        waitForRenderedCanvas: false,
        readySelector: '[data-testid="switch-canvas-page"]',
    });

    await waitForDiveDebugEvent(
        page,
        [{ scope: 'DiveSwitchCanvas', stage: 'orbit-controller-dom-updated' }],
        {
            timeoutMs: 30000,
            sinceMs: switchStartedAt,
            description: 'SwitchCanvas canvas switch',
        },
    );
});

test('keeps switch buttons visible in compact viewport', async ({ page }) => {
    setupErrorSuppression(page);
    await page.setViewportSize({ width: 360, height: 300 });
    await navigateToExample(page, '/switch-canvas', {
        waitForCanvasVisible: false,
        waitForRenderedCanvas: false,
        readySelector: '[data-testid="switch-canvas-page"]',
    });

    const viewport = page.viewportSize();
    if (!viewport) {
        throw new Error('Missing viewport size');
    }

    for (const index of [0, 1, 2]) {
        const button = page.getByTestId(`switch-canvas-button-${index}`);
        await expect(button).toBeVisible();

        const box = await button.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.y).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
        expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    }
});
