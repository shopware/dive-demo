import { test, expect } from '@playwright/test';

// Helper function to suppress Monaco Editor errors
function setupErrorSuppression(page: any) {
    page.on('pageerror', error => {
        if (error.message.includes('Unexpected usage') ||
            error.message.includes('loadForeignModule') ||
            error.stack?.includes('tsMode') ||
            error.stack?.includes('monaco')) {
            return;
        }
        console.error('Page error:', error.message);
    });

    page.on('console', msg => {
        const text = msg.text();
        if (msg.type() === 'error' && (
            text.includes('Unexpected usage') ||
            text.includes('loadForeignModule') ||
            text.includes('tsMode') ||
            text.includes('/assets/index-') ||
            text.includes('/assets/tsMode-'))) {
            return;
        }
    });
}

test('shows model', async ({ page }) => {
    setupErrorSuppression(page);

    // Navigate to root
    await page.goto('/', { waitUntil: 'load', timeout: 60000 });
    await page.waitForSelector('#app', { state: 'attached', timeout: 30000 });

    const canvas = page.locator('div.canvasWrapper > canvas');
    await expect(canvas).toBeVisible({ timeout: 30000 });

    // Wait for canvas to have actual dimensions
    await page.waitForFunction(
        () => {
            const canvas = document.querySelector('div.canvasWrapper > canvas') as HTMLCanvasElement;
            return canvas && canvas.width > 0 && canvas.height > 0;
        },
        { timeout: 30000 }
    );

    // Wait for 3D model to load and render
    await page.waitForTimeout(5000);

    // Screenshot the entire page
    await expect(page).toHaveScreenshot('dive-quick-view-model-visible.png');
});

test('click', async ({ page }) => {
    setupErrorSuppression(page);

    await page.goto('/', { waitUntil: 'load', timeout: 60000 });
    await page.waitForSelector('#app', { state: 'attached', timeout: 30000 });

    const canvas = page.locator('div.canvasWrapper > canvas');
    await expect(canvas).toBeVisible({ timeout: 30000 });

    const boundingBox = await canvas.boundingBox();
    if (!boundingBox) {
        throw new Error('Bounding box not found');
    }
    const center = {
        x: boundingBox.x + boundingBox.width / 2,
        y: boundingBox.y + boundingBox.height / 2,
    };

    await page.mouse.move(center.x, center.y);
    await page.mouse.down();
    await page.mouse.move(center.x + 100, center.y + 100, { steps: 100 });
    await page.mouse.up();
    await page.waitForTimeout(5000);
    await expect(page).toHaveScreenshot('dive-move-camera.png');
});
