import { test, expect, type Page, type ConsoleMessage } from '@playwright/test';

function setupErrorSuppression(page: Page) {
    page.on('pageerror', (error: Error) => {
        if (error.message.includes('Unexpected usage') ||
            error.message.includes('loadForeignModule') ||
            error.stack?.includes('tsMode') ||
            error.stack?.includes('monaco')) {
            return;
        }
        console.error('Page error:', error.message);
    });

    page.on('console', (msg: ConsoleMessage) => {
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

    await page.goto('/', { waitUntil: 'load', timeout: 60000 });
    await page.waitForSelector('#app', { state: 'attached', timeout: 30000 });
    await page.waitForSelector('nav a', { state: 'attached', timeout: 10000 });

    const placeLink = page.locator('nav a').filter({ hasText: 'place-on-floor' });
    await placeLink.click({ timeout: 10000 });
    await page.waitForURL('**/place-on-floor', { timeout: 10000 });

    const canvas = page.locator('div.canvasWrapper > canvas');
    await expect(canvas).toBeVisible({ timeout: 30000 });

    await page.waitForFunction(
        () => {
            const canvas = document.querySelector('div.canvasWrapper > canvas') as HTMLCanvasElement;
            return canvas && canvas.width > 0 && canvas.height > 0;
        },
        { timeout: 30000 }
    );

    await page.waitForTimeout(5000);
    await expect(page).toHaveScreenshot('dive-place-on-floor-model-visible.png');
});

test('click button', async ({ page }) => {
    setupErrorSuppression(page);

    await page.goto('/', { waitUntil: 'load', timeout: 60000 });
    await page.waitForSelector('#app', { state: 'attached', timeout: 30000 });
    await page.waitForSelector('nav a', { state: 'attached', timeout: 10000 });

    const placeLink = page.locator('nav a').filter({ hasText: 'place-on-floor' });
    await placeLink.click({ timeout: 10000 });
    await page.waitForURL('**/place-on-floor', { timeout: 10000 });

    const canvas = page.locator('div.canvasWrapper > canvas');
    await expect(canvas).toBeVisible({ timeout: 30000 });

    const button = page.locator('button').filter({ hasText: 'Place on floor' });
    await expect(button).toBeVisible();

    await button.click();
    await page.waitForTimeout(2000);
    await expect(canvas).toBeVisible();
});

