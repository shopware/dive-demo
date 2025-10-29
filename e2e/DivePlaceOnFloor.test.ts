import { test, expect } from '@playwright/test';

test('shows model', async ({ page }) => {
    await page.goto('/place-on-floor', { waitUntil: 'networkidle' });
    // Wait for Vue app to mount and canvas to be created
    await page.waitForSelector('div.canvasWrapper', { state: 'attached' });
    await expect(page.locator('div.canvasWrapper')).toBeVisible();

    const canvas = page.locator('div.canvasWrapper > canvas');
    await expect(canvas).toBeVisible();

    // Check for the specific "Place on floor" button
    const placeButton = page.locator('button').filter({ hasText: 'Place on floor' });
    await expect(placeButton).toBeVisible();

    // Wait for the 3D model to fully load and render
    await page.waitForTimeout(2000);

    // Take visual snapshot to ensure model renders correctly
    await expect(canvas).toHaveScreenshot('dive-place-on-floor-model-visible.png');
});

test('click button', async ({ page }) => {
    await page.goto('/place-on-floor', { waitUntil: 'networkidle' });
    // Wait for Vue app to mount and canvas to be created
    await page.waitForSelector('div.canvasWrapper', { state: 'attached' });
    const canvas = page.locator('div.canvasWrapper > canvas');
    await expect(canvas).toBeVisible();

    const button = page.locator('button').filter({ hasText: 'Place on floor' });
    await expect(button).toBeVisible();

    // Test that the button click doesn't crash the app
    await button.click();
    await page.waitForTimeout(1000);

    // Just verify the canvas is still visible
    await expect(canvas).toBeVisible();
});

