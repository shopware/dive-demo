import { test, expect } from './helpers/diveCleanup';

test.use({ colorScheme: 'light' });

test('loads orientation display', async ({ page }) => {
    await page.goto('/orientation-display', { waitUntil: 'domcontentloaded', timeout: 60000 });

    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.content')).toBeVisible();
    await expect(page.locator('div.canvasWrapper')).toHaveCount(1);
    await expect(page.locator('div.canvasWrapper > canvas')).toBeVisible({ timeout: 60000 });
});
