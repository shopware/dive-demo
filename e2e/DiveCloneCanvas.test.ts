import { test, expect } from '@playwright/test';

test('shows cloned canvas', async ({ page }) => {
    await page.goto('/clone-canvas', { waitUntil: 'load' });
    // Wait for Vue app to mount and canvases to be created
    await page.waitForSelector('div.canvasWrapper', { state: 'attached' });

    // Check that both canvases are visible and wait for them to render
    const canvasWrappers = page.locator('div.canvasWrapper');
    await expect(canvasWrappers).toHaveCount(2);

    // Get the first canvas wrapper's canvas
    const originalCanvas = canvasWrappers.first().locator('canvas');
    await expect(originalCanvas).toBeVisible();

    // Get the last canvas wrapper's canvas
    const clonedCanvas = canvasWrappers.last().locator('canvas');
    await expect(clonedCanvas).toBeVisible();

    // Wait for the 3D models to fully load and render
    await page.waitForTimeout(2000);

    // Take visual snapshots to ensure both render correctly
    await expect(originalCanvas).toHaveScreenshot('dive-clone-canvas-original.png');
    await expect(clonedCanvas).toHaveScreenshot('dive-clone-canvas-clone.png');
});

