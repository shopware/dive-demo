import { test, expect } from '@playwright/test';
import { setupErrorSuppression } from './helper/setupErrorSuppression';
import { navigateToExample } from './helper/navigateToExample';

test('shows model', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToExample(page, '/ar', {
        waitForCanvasVisible: false,
        waitForRenderedCanvas: false,
        readySelector: '[data-testid="ar-page"]',
    });
    const controlPanel = page.getByTestId('ar-control-panel');
    await expect(controlPanel).toBeVisible();
    await expect(controlPanel.locator('.controlPanel-label', { hasText: 'Placement' })).toBeVisible();
    await expect(controlPanel.locator('.controlPanel-label', { hasText: 'Scale' })).toBeVisible();
    await expect(page.getByTestId('ar-launch')).toBeVisible();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('dive-ar-model-visible.png');
});
