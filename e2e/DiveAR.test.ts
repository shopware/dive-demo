import { test, expect } from '@playwright/test';

test('shows model', async ({ page }) => {
    // Add error listener to catch JavaScript errors
    page.on('pageerror', error => {
        console.error('Page error:', error.message);
    });

    await page.goto('/ar', { waitUntil: 'load', timeout: 60000 });

    // Wait for Vue to mount - check for the root element first
    await page.waitForSelector('#app', { state: 'attached', timeout: 30000 });

    // Wait for Vue app structure to be ready
    await page.waitForSelector('div.app-container, div.canvasWrapper', {
        state: 'attached',
        timeout: 30000
    });

    // Wait for the route-specific canvas content
    const canvas = page.locator('div.canvasWrapper > canvas');
    await expect(canvas).toBeVisible({ timeout: 30000 });

    // Wait for the 3D model to fully load and render
    await page.waitForTimeout(2000);

    // Take visual snapshot to ensure model renders correctly
    await expect(canvas).toHaveScreenshot('dive-ar-model-visible.png');
});
