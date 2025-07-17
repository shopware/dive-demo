import { test, expect } from '@playwright/test';

test('shows model', async ({ page }) => {
    await page.goto('/ar', { waitUntil: 'networkidle' });
    await expect(page.locator('div.app-container')).toBeVisible();
    await expect(page.locator('div.sidebar')).toBeVisible();
    await expect(page.locator('div.content')).toBeVisible();

    await expect(page.locator('div.canvasWrapper > canvas')).toBeVisible();
    await expect(page.locator('div.canvasWrapper > canvas')).toHaveScreenshot('dive-ar-model-visible.png');
});
