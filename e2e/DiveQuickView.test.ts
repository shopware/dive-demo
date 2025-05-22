import { test, expect } from '@playwright/test';

test('shows model', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('div.app-container')).toBeVisible();
    await expect(page.locator('div.sidebar')).toBeVisible();
    await expect(page.locator('div.content')).toBeVisible();

    await expect(page.locator('div.canvasWrapper > canvas')).toBeVisible();
    await expect(page.locator('div.canvasWrapper > canvas')).toHaveScreenshot('dive-quick-view-model-visible.png');
});
