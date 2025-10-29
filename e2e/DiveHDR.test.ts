import { test, expect } from '@playwright/test';

test('shows HDR comparison', async ({ page }) => {
    await page.goto('/hdr');

    // Check that the classic canvas is visible
    const classicCanvas = page.locator('div.canvasWrapper').first().locator('canvas');
    await expect(classicCanvas).toBeVisible();

    // Check that the HDR canvas is visible
    const hdrCanvas = page.locator('div.canvasWrapper').last().locator('canvas');
    await expect(hdrCanvas).toBeVisible();

    // Wait for the 3D models to fully load and render
    await page.waitForTimeout(2000);

    // Take visual snapshots to ensure both render correctly
    await expect(classicCanvas).toHaveScreenshot('dive-hdr-classic.png');
    await expect(hdrCanvas).toHaveScreenshot('dive-hdr-hdr.png');
});

test('change HDR texture', async ({ page }) => {
    await page.goto('/hdr');

    const hdrCanvas = page.locator('div.canvasWrapper').last().locator('canvas');
    await expect(hdrCanvas).toBeVisible();

    const select = page.locator('select');
    await expect(select).toBeVisible();

    // Test that changing HDR texture doesn't crash the app
    await select.selectOption('studio_small_09_1k.hdr');

    await page.waitForTimeout(2000);

    // Just verify the canvas is still visible
    await expect(hdrCanvas).toBeVisible();
});

