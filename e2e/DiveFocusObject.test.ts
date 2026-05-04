import { test, expect } from '@playwright/test';

test('loads focus-object controls', async ({ page }) => {
    await page.goto('/focus-object', { waitUntil: 'domcontentloaded', timeout: 60000 });

    await expect(page.locator('div.canvasWrapper > canvas')).toBeVisible({ timeout: 60000 });
    await expect(page.getByRole('button', { name: 'Sofa' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Chair' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Suzanne' })).toBeVisible();
    await expect(page.locator('.infoPanel')).toContainText('Dimensions');
});

test('switches to another object', async ({ page }) => {
    await page.goto('/focus-object', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const dimensions = page.locator('.infoPanel-dimensions');
    await expect.poll(async () => dimensions.innerText(), { timeout: 30000 }).not.toContain('0 m');
    const initialDimensions = await dimensions.innerText();

    await page.getByRole('button', { name: 'Chair' }).click();
    await expect.poll(async () => dimensions.innerText(), { timeout: 30000 }).not.toBe(initialDimensions);

    await expect(page.locator('div.canvasWrapper > canvas')).toBeVisible();
    await expect(page.locator('.infoPanel')).toContainText('Dimensions');
});
