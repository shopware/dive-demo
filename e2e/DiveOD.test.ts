import { test, expect } from '@playwright/test';
import { setupErrorSuppression } from './helper/setupErrorSuppression';
import { navigateToExample } from './helper/navigateToExample';

test.use({ colorScheme: 'light' });

test('shows orientation display', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToExample(page, '/orientation-display', {
        readySelector: '[data-testid="od-page"]',
    });

    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.content')).toBeVisible();
    await expect(page.locator('div.canvasWrapper')).toHaveCount(1);
    await expect(page.locator('div.canvasWrapper > canvas')).toBeVisible();
    await expect(page).toHaveScreenshot('dive-od-with-axes.png');
});
