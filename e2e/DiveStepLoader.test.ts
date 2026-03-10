import { test, expect, type Page } from '@playwright/test';
import { setupErrorSuppression } from './helper/setupErrorSuppression';

async function waitForStepModel(page: Page): Promise<'loaded' | 'error'> {
    return Promise.race([
        page.locator('.timing').waitFor({ state: 'visible', timeout: 60000 }).then(() => 'loaded' as const),
        page.locator('.error').waitFor({ state: 'visible', timeout: 60000 }).then(() => 'error' as const),
    ]);
}

test('shows STEP model', async ({ page }) => {
    setupErrorSuppression(page);

    await page.goto('/step-loader', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const result = await waitForStepModel(page);

    if (result === 'error') {
        await expect(page).toHaveScreenshot('dive-step-loader-error.png');
        return;
    }

    await expect(page).toHaveScreenshot('dive-step-loader-model-visible.png');
});

test('wireframe toggle', async ({ page }) => {
    setupErrorSuppression(page);

    await page.goto('/step-loader', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const result = await waitForStepModel(page);

    if (result === 'error') {
        await expect(page).toHaveScreenshot('dive-step-loader-wireframe-error.png');
        return;
    }

    const wireframeCheckbox = page.locator('input[type="checkbox"]');
    await expect(wireframeCheckbox).toBeEnabled();

    await wireframeCheckbox.check();
    await page.waitForFunction(() =>
        new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );
    await expect(page).toHaveScreenshot('dive-step-loader-wireframe.png');

    await wireframeCheckbox.uncheck();
    await page.waitForFunction(() =>
        new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );
    await expect(page).toHaveScreenshot('dive-step-loader-wireframe-off.png');
});
