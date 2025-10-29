import { test, expect } from '@playwright/test';

test('shows model', async ({ page }) => {
    // Add error listener to catch JavaScript errors
    page.on('pageerror', error => {
        console.error('Page error:', error.message);
    });

    // Navigate to root first (this will always work)
    await page.goto('/', { waitUntil: 'load', timeout: 60000 });

    // Wait for Vue to mount and app to be ready
    await page.waitForSelector('#app', { state: 'attached', timeout: 30000 });

    // Wait for navigation links to be ready
    await page.waitForSelector('nav a', { state: 'attached', timeout: 10000 });

    // Click on the "ar" navigation link (client-side navigation)
    // This uses Vue Router which avoids the 404 issue
    const arLink = page.locator('nav a').filter({ hasText: 'ar' });
    await arLink.click({ timeout: 10000 });

    // Wait for navigation to complete
    await page.waitForURL('**/ar', { timeout: 10000 });

    // Wait for the route-specific canvas content
    const canvas = page.locator('div.canvasWrapper > canvas');
    await expect(canvas).toBeVisible({ timeout: 30000 });

    // Wait for canvas to have actual dimensions (not just be in DOM)
    await page.waitForFunction(
        () => {
            const canvas = document.querySelector('div.canvasWrapper > canvas') as HTMLCanvasElement;
            return canvas && canvas.width > 0 && canvas.height > 0;
        },
        { timeout: 30000 }
    );

    // Wait for 3D model to load and render
    // Use a longer fixed wait since canvas continuously renders
    await page.waitForTimeout(5000);

    // Screenshot the entire page (including sidebar, controls, etc.)
    await expect(page).toHaveScreenshot('dive-ar-model-visible.png');
});
