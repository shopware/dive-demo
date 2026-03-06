import { test, expect } from '@playwright/test';
import { setupErrorSuppression } from './helper/setupErrorSuppression';
import { navigateToExample } from './helper/navigateToExample';

test('shows model', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToExample(page, '/focus-object');
    await expect(page).toHaveScreenshot('dive-focus-object-model-visible.png');
});

test('switch to different object', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToExample(page, '/focus-object');

    const chairButton = page.locator('button').filter({ hasText: 'Chair' });
    await expect(chairButton).toBeVisible();

    const responsePromise = page.waitForResponse(
        (resp) => resp.url().includes('hay_chair.glb') && resp.status() === 200,
    );

    await chairButton.click();
    await responsePromise;

    await page.waitForFunction(() =>
        new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );

    await expect(page.locator('div.canvasWrapper > canvas')).toBeVisible();
});
