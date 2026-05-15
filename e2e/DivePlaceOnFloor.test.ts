import { test, expect } from './helpers/diveCleanup';

test('loads place-on-floor controls', async ({ page }) => {
    await page.goto('/place-on-floor', { waitUntil: 'domcontentloaded', timeout: 60000 });

    await expect(page.locator('div.canvasWrapper > canvas')).toBeVisible({ timeout: 60000 });

    const button = page.getByRole('button', { name: 'Place on floor', exact: true });
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.locator('div.canvasWrapper > canvas')).toBeVisible();
});
