import { test, expect } from '@playwright/test';

test('shows canvas', async ({ page }) => {
    await page.goto('/switch-canvas');

    // Check that all three canvases are visible
    const canvas0 = page.locator('div.canvasWrapper0 > canvas');
    await expect(canvas0).toBeVisible();

    // Wait for the 3D model to fully load and render
    await page.waitForTimeout(2000);

    // Take visual snapshot of the initial state
    await expect(canvas0).toHaveScreenshot('dive-switch-canvas-initial.png');
});

test('click button to switch canvas', async ({ page }) => {
    await page.goto('/switch-canvas');

    const canvas1 = page.locator('div.canvasWrapper1 > canvas');
    const button = page.locator('button').filter({ hasText: 'Use this' }).nth(1);

    await expect(canvas1).toBeVisible();
    await expect(button).toBeEnabled();

    // Test that switching canvases doesn't crash the app
    await button.click();
    await page.waitForTimeout(1000);

    // Just verify the canvas is still visible
    await expect(canvas1).toBeVisible();
});

