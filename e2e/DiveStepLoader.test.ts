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

async function navigateToStepLoader(page: Page) {
    await page.goto('/', { waitUntil: 'load', timeout: 60000 });
    await page.waitForSelector('#app', { state: 'attached', timeout: 30000 });
    await page.waitForSelector('nav a', { state: 'attached', timeout: 10000 });

    const stepLink = page.locator('nav a').filter({ hasText: 'STEP loader' });
    await stepLink.click({ timeout: 30000 });
    await page.waitForURL('**/step-loader', { timeout: 30000 });
}

async function waitForModelLoaded(page: Page) {
    // Wait for canvas to be visible and have dimensions
    const canvas = page.locator('div.canvasWrapper > canvas');
    await expect(canvas).toBeVisible({ timeout: 30000 });

    await page.waitForFunction(
        () => {
            const canvas = document.querySelector('div.canvasWrapper > canvas') as HTMLCanvasElement;
            return canvas && canvas.width > 0 && canvas.height > 0;
        },
        { timeout: 30000 }
    );

    // Wait for the timing indicator which signals loading is complete
    await expect(page.locator('.timing')).toBeVisible({ timeout: 60000 });

    // Give the renderer a moment to stabilise
    await page.waitForTimeout(5000);
}

test('shows STEP model', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToStepLoader(page);
    await waitForModelLoaded(page);

    await expect(page).toHaveScreenshot('dive-step-loader-model-visible.png');
});

test('wireframe toggle', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToStepLoader(page);
    await waitForModelLoaded(page);

    const wireframeCheckbox = page.locator('input[type="checkbox"]');
    await expect(wireframeCheckbox).toBeEnabled();

    // Enable wireframe
    await wireframeCheckbox.check();
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('dive-step-loader-wireframe.png');

    // Disable wireframe again
    await wireframeCheckbox.uncheck();
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('dive-step-loader-wireframe-off.png');
});
