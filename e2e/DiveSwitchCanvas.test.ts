import { test, expect, type Page, type ConsoleMessage } from '@playwright/test';

function setupErrorSuppression(page: Page) {
    page.on('pageerror', (error: Error) => {
        if (error.message.includes('Unexpected usage') ||
            error.message.includes('Unexpected token') ||
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
            text.includes('Unexpected token') ||
            text.includes('loadForeignModule') ||
            text.includes('tsMode') ||
            text.includes('/assets/index-') ||
            text.includes('/assets/tsMode-'))) {
            return;
        }
    });
}

test('shows canvas', async ({ page }) => {
    setupErrorSuppression(page);

    await page.goto('/', { waitUntil: 'load', timeout: 60000 });
    await page.waitForSelector('#app', { state: 'attached', timeout: 30000 });
    await page.waitForSelector('nav a', { state: 'attached', timeout: 10000 });

    const switchLink = page.locator('nav a').filter({ hasText: 'switch-canvas' });
    await switchLink.click({ timeout: 30000 });
    await page.waitForURL('**/switch-canvas', { timeout: 30000 });

    const canvas0 = page.locator('div.canvasWrapper0 > canvas');
    await expect(canvas0).toBeVisible({ timeout: 30000 });

    await page.waitForFunction(
        () => {
            const canvas = document.querySelector('div.canvasWrapper0 > canvas') as HTMLCanvasElement;
            return canvas && canvas.width > 0 && canvas.height > 0;
        },
        { timeout: 30000 }
    );

    await page.waitForTimeout(5000);
    await expect(page).toHaveScreenshot('dive-switch-canvas-initial.png');
});

test('click button to switch canvas', async ({ page }) => {
    setupErrorSuppression(page);

    await page.goto('/', { waitUntil: 'load', timeout: 60000 });
    await page.waitForSelector('#app', { state: 'attached', timeout: 30000 });
    await page.waitForSelector('nav a', { state: 'attached', timeout: 10000 });

    const switchLink = page.locator('nav a').filter({ hasText: 'switch-canvas' });
    await switchLink.click({ timeout: 30000 });
    await page.waitForURL('**/switch-canvas', { timeout: 30000 });

    const canvas1 = page.locator('div.canvasWrapper1 > canvas');
    const button = page.locator('button').filter({ hasText: 'Use this' }).nth(1);

    await expect(canvas1).toBeVisible({ timeout: 30000 });
    await expect(button).toBeEnabled();

    await button.click();
    await page.waitForTimeout(2000);
    await expect(canvas1).toBeVisible();
});

