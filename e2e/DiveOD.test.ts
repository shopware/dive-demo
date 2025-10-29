import { test, expect } from '@playwright/test';

test('shows orientation display', async ({ page }) => {
    await page.goto('/orientation-display', { waitUntil: 'load' });
    // Wait for Vue app to mount and canvases to be created
    await page.waitForSelector('div.canvasWrapper', { state: 'attached' });

    // Check that the canvas with axes is visible
    const canvas0 = page.locator('div.canvasWrapper').first().locator('canvas');
    await expect(canvas0).toBeVisible();

    // Check that the canvas with orientation display is visible
    const canvas1 = page.locator('div.canvasWrapper').last().locator('canvas');
    await expect(canvas1).toBeVisible();

    // Wait for the 3D models to fully load and render
    await page.waitForTimeout(2000);

    // Take visual snapshots to ensure both render correctly
    await expect(canvas0).toHaveScreenshot('dive-od-with-axes.png');
    await expect(canvas1).toHaveScreenshot('dive-od-orientation-display.png');
});

