import { test, expect } from '@playwright/test';

test('shows model', async ({ page }) => {
    await page.goto('/focus-object', { waitUntil: 'networkidle' });
    // Wait for Vue app to mount and canvas to be created
    await page.waitForSelector('div.canvasWrapper', { state: 'attached' });
    await expect(page.locator('div.canvasWrapper')).toBeVisible();

    const canvas = page.locator('div.canvasWrapper > canvas');
    await expect(canvas).toBeVisible();

    // Check for the specific object buttons (exclude navigation buttons)
    const objectButtons = page.locator('div.buttonWrapper > button');
    await expect(objectButtons).toHaveCount(3); // Sofa, Chair, Suzanne
    await expect(page.locator('button').filter({ hasText: 'Chair' })).toBeVisible();

    // Wait for the 3D model to fully load and render
    await page.waitForTimeout(2000);

    // Take visual snapshot to ensure model renders correctly
    await expect(canvas).toHaveScreenshot('dive-focus-object-model-visible.png');
});

test('switch to different object', async ({ page }) => {
    await page.goto('/focus-object', { waitUntil: 'networkidle' });
    // Wait for Vue app to mount and canvas to be created
    await page.waitForSelector('div.canvasWrapper', { state: 'attached' });
    const canvas = page.locator('div.canvasWrapper > canvas');
    await expect(canvas).toBeVisible();

    const chairButton = page.locator('button').filter({ hasText: 'Chair' });
    await expect(chairButton).toBeVisible();

    // Test that switching objects doesn't crash the app
    await chairButton.click();
    await page.waitForTimeout(2000);

    // Just verify the canvas is still visible
    await expect(canvas).toBeVisible();
});

