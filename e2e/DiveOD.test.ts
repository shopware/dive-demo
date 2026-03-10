import { test, expect } from '@playwright/test';
import { setupErrorSuppression } from './helper/setupErrorSuppression';
import { navigateToExample } from './helper/navigateToExample';

test('shows orientation display', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToExample(page, '/orientation-display');

    const canvasWrappers = page.locator('div.canvasWrapper');
    await expect(canvasWrappers).toHaveCount(2);

    await expect(page).toHaveScreenshot('dive-od-with-axes.png');
});
