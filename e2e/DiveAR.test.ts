import { test, expect } from '@playwright/test';

test('shows model', async ({ page }) => {
    await page.goto('/ar');
    await expect(page.locator('div.app-container')).toBeVisible();
    await expect(page.locator('div.sidebar')).toBeVisible();
    await expect(page.locator('div.content')).toBeVisible();

    const canvas = page.locator('div.canvasWrapper > canvas');
    await expect(canvas).toBeVisible();

    // Wait for the 3D model to fully load and render
    await page.waitForTimeout(2000);

    // Take visual snapshot to ensure model renders correctly
    await expect(canvas).toHaveScreenshot('dive-ar-model-visible.png');
});
