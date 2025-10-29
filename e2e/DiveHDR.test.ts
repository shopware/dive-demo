import { test, expect } from '@playwright/test';

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

test('shows HDR comparison', async ({ page }) => {
    setupErrorSuppression(page);

    await page.goto('/', { waitUntil: 'load', timeout: 60000 });
    await page.waitForSelector('#app', { state: 'attached', timeout: 30000 });
    await page.waitForSelector('nav a', { state: 'attached', timeout: 10000 });

    const hdrLink = page.locator('nav a').filter({ hasText: 'hdr' });
    await hdrLink.click({ timeout: 10000 });
    await page.waitForURL('**/hdr', { timeout: 10000 });

    const canvasWrappers = page.locator('div.canvasWrapper');
    await expect(canvasWrappers).toHaveCount(2, { timeout: 30000 });

    await page.waitForFunction(
        () => {
            const canvases = document.querySelectorAll('div.canvasWrapper canvas') as NodeListOf<HTMLCanvasElement>;
            return Array.from(canvases).every(c => c && c.width > 0 && c.height > 0);
        },
        { timeout: 30000 }
    );

    await page.waitForTimeout(5000);
    await expect(page).toHaveScreenshot('dive-hdr-classic.png');
});

test('change HDR texture', async ({ page }) => {
    setupErrorSuppression(page);

    await page.goto('/', { waitUntil: 'load', timeout: 60000 });
    await page.waitForSelector('#app', { state: 'attached', timeout: 30000 });
    await page.waitForSelector('nav a', { state: 'attached', timeout: 10000 });

    const hdrLink = page.locator('nav a').filter({ hasText: 'hdr' });
    await hdrLink.click({ timeout: 10000 });
    await page.waitForURL('**/hdr', { timeout: 10000 });

    const hdrCanvas = page.locator('div.canvasWrapper').last().locator('canvas');
    await expect(hdrCanvas).toBeVisible({ timeout: 30000 });

    const select = page.locator('select');
    await expect(select).toBeVisible();

    await select.selectOption('studio_small_09_1k.hdr');
    await page.waitForTimeout(2000);
    await expect(hdrCanvas).toBeVisible();
});

