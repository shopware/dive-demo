import { test, expect } from '@playwright/test';
import { setupErrorSuppression } from './helper/setupErrorSuppression';
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
    await navigateToExample(page, '/switch-canvas', {
        waitForCanvasVisible: false,
        waitForRenderedCanvas: false,
        readySelector: '[data-testid="switch-canvas-page"]',
    });

    const button0 = page.getByTestId('switch-canvas-button-0');
    const button1 = page.getByTestId('switch-canvas-button-1');
    const switchCanvasPage = page.getByTestId('switch-canvas-page');

    await expect(switchCanvasPage).toHaveAttribute('data-active-canvas', '0');
    await expect(button1).toBeEnabled();
    await button1.click();

    await expect(switchCanvasPage).toHaveAttribute('data-active-canvas', '1');
    await expect(button0).toBeEnabled();
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
