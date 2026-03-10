import { test, expect } from '@playwright/test';
import { setupErrorSuppression } from './helper/setupErrorSuppression';
import { navigateToExample } from './helper/navigateToExample';

test('shows model', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToExample(page, '/ar');
    await expect(page).toHaveScreenshot('dive-ar-model-visible.png');
});
