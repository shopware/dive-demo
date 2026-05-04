import { test, expect } from '@playwright/test';

test('loads STEP loader controls', async ({ page }) => {
    await page.goto('/step-loader', { waitUntil: 'domcontentloaded', timeout: 60000 });

    await expect(page.locator('div.canvasWrapper > canvas')).toBeVisible();
    await expect(page.getByText('occt-import-js')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upload STEP / IGES' })).toBeVisible();
    await expect(page.getByLabel('Wireframe')).toBeVisible();
});
