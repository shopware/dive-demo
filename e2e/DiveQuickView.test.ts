import { test, expect } from '@playwright/test';

test('loads the quick view controls', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    await expect(page.locator('div.canvasWrapper > canvas')).toBeVisible({ timeout: 60000 });
    await expect(page.locator('button', { hasText: 'Upload File' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Export' })).toBeVisible();
});

test('export dropdown opens and closes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const canvas = page.locator('div.canvasWrapper > canvas');
    const exportButton = page.locator('button', { hasText: 'Export' });
    const exportMenu = page.locator('.export-menu');

    await expect(exportMenu).toBeHidden();

    await exportButton.click();
    await expect(exportMenu).toBeVisible();
    await expect(exportMenu.locator('.export-option')).toHaveText(['.glb', '.gltf', '.usdz']);

    await canvas.click({ position: { x: 10, y: 10 } });
    await expect(exportMenu).toBeHidden();
});
