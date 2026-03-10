import { test, expect } from '@playwright/test';
import { setupErrorSuppression } from './helper/setupErrorSuppression';
import { navigateToExample } from './helper/navigateToExample';

test('shows canvas', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToExample(page, '/switch-canvas');
    await expect(page).toHaveScreenshot('dive-switch-canvas-initial.png');
});

test('click button to switch canvas', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToExample(page, '/switch-canvas');

    const button = page.locator('button').filter({ hasText: 'Use this' }).nth(1);
    await expect(button).toBeEnabled();

    await button.click();

    await page.waitForFunction(() =>
        new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );

    await expect(page.locator('div.canvasWrapper1 > canvas')).toBeVisible();
});
