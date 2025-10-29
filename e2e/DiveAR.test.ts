import { test, expect } from '@playwright/test';

test('shows model', async ({ page }) => {
    // Add error listener to catch JavaScript errors
    page.on('pageerror', error => {
        console.error('Page error:', error.message);
    });

    page.on('response', response => {
        if (response.status() >= 400) {
            console.error(`Response error: ${response.url()} - ${response.status()}`);
        }
    });

    // Navigate and wait for load
    const response = await page.goto('/ar', { waitUntil: 'load', timeout: 60000 });

    // Debug: Check response status
    console.log(`Page response status: ${response?.status()}`);
    console.log(`Page URL: ${page.url()}`);

    // Debug: Check page content
    const bodyContent = await page.content();
    console.log(`Page content length: ${bodyContent.length}`);
    console.log(`Has #app?: ${bodyContent.includes('id="app"')}`);
    console.log(`Has <div id="app">?: ${bodyContent.includes('<div id="app">')}`);

    // Try to get the title
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Wait for Vue to mount by checking for the root element
    try {
        await page.waitForSelector('#app', { state: 'attached', timeout: 30000 });
        console.log('Found #app element');
    } catch (e) {
        console.error('Failed to find #app element');
        // Take a screenshot for debugging
        await page.screenshot({ path: 'debug-no-app.png', fullPage: true });
        throw e;
    }

    // Wait for the route-specific canvas content
    const canvas = page.locator('div.canvasWrapper > canvas');
    await expect(canvas).toBeVisible({ timeout: 30000 });

    // Wait for the 3D model to fully load and render
    await page.waitForTimeout(2000);

    // Take visual snapshot to ensure model renders correctly
    await expect(canvas).toHaveScreenshot('dive-ar-model-visible.png');
});
