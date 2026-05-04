import { test, expect } from '@playwright/test';

test('loads target-animation preset controls', async ({ page }) => {
    await page.goto('/target-animation', { waitUntil: 'domcontentloaded', timeout: 60000 });

    await expect(page.locator('div.canvasWrapper > canvas')).toBeVisible({ timeout: 60000 });

    const presets = page.locator('.controlPanel-buttons--center button');
    await expect(presets).toHaveText(['Initial', 'Hero', 'Low', 'Top-down', 'Back'], { timeout: 60000 });
    await expect(presets.nth(0)).toHaveClass(/active/);
});

test('preset click updates the active state', async ({ page }) => {
    await page.goto('/target-animation', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const presets = page.locator('.controlPanel-buttons--center button');
    await expect(presets.nth(1)).toBeEnabled({ timeout: 60000 });

    await presets.nth(1).click();
    await expect(presets.nth(1)).toHaveClass(/active/);
    await expect(presets.nth(0)).not.toHaveClass(/active/);
});
