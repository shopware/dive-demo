import { test, expect } from './helpers/diveCleanup';

test('loads focus-object controls', async ({ page }) => {
    await page.goto('/focus-object', { waitUntil: 'domcontentloaded', timeout: 60000 });

    await expect(page.locator('div.canvasWrapper > canvas')).toBeVisible({ timeout: 60000 });
    await expect(page.getByRole('button', { name: 'Sofa' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Chair' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Suzanne' })).toBeVisible();
    await expect(page.locator('.infoPanel')).toContainText('Dimensions');
});
