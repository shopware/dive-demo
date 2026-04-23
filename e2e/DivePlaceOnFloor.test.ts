import { test, expect } from '@playwright/test';
import { setupErrorSuppression } from './helper/setupErrorSuppression';
import { navigateToExample } from './helper/navigateToExample';

test('shows model', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToExample(page, '/place-on-floor', {
        readySelector: '[data-testid="place-on-floor-page"]',
    });
    await expect(page).toHaveScreenshot('dive-place-on-floor-model-visible.png');
});

test('click button', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToExample(page, '/place-on-floor', {
        readySelector: '[data-testid="place-on-floor-page"]',
    });

    const button = page.getByRole('button', { name: 'Place on floor', exact: true });
    await button.click();

    await page.waitForFunction(() =>
        new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );

    await expect(page.locator('div.canvasWrapper > canvas')).toBeVisible();
});
