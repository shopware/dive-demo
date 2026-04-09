import { test, expect } from '@playwright/test';
import { setupErrorSuppression } from './helper/setupErrorSuppression';
import { navigateToExample } from './helper/navigateToExample';

test('shows canvas', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToExample(page, '/switch-canvas', {
        waitForCanvasVisible: false,
        waitForRenderedCanvas: false,
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
    });

    const button0 = page.getByTestId('switch-canvas-button-0');
    const button1 = page.getByTestId('switch-canvas-button-1');
    const panel0 = page.getByTestId('switch-canvas-panel-0');
    const panel1 = page.getByTestId('switch-canvas-panel-1');

    await expect(button1).toBeEnabled();
    await button1.click({ force: true });

    await expect(button1).toBeDisabled();
    await expect(button0).toBeEnabled();
    await expect(panel0.locator('.overlay')).toBeVisible();
    await expect(panel1.locator('.overlay')).not.toBeVisible();
});
