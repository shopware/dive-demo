import { test, expect } from '@playwright/test';

test('loads AR controls', async ({ page }) => {
    await page.goto('/ar', { waitUntil: 'domcontentloaded', timeout: 60000 });

    await expect(page.locator('div.canvasWrapper > canvas')).toBeVisible({ timeout: 60000 });
    await expect(page.locator('.controlPanel.controlPanel--top')).toBeVisible();
    await expect(page.locator('.controlPanel-label', { hasText: 'Placement' })).toBeVisible();
    await expect(page.locator('.controlPanel-label', { hasText: 'Scale' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'AR', exact: true })).toBeVisible();
});
