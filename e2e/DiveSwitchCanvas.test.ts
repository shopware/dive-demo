import { test, expect } from '@playwright/test';

test('loads switch-canvas panels', async ({ page }) => {
    await page.goto('/switch-canvas', { waitUntil: 'domcontentloaded', timeout: 60000 });

    await expect(page.locator('.canvasWrapper0')).toBeVisible();
    await expect(page.locator('.canvasWrapper1')).toBeVisible();
    await expect(page.locator('.canvasWrapper2')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Use this' })).toHaveCount(3);
});

test('keeps switch buttons visible in compact viewport', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 300 });
    await page.goto('/switch-canvas', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const buttons = page.getByRole('button', { name: 'Use this' });
    await expect(buttons).toHaveCount(3);

    const buttonLayout = await buttons.evaluateAll((elements) =>
        elements.map((button) => {
            const rect = button.getBoundingClientRect();
            const style = window.getComputedStyle(button);

            return {
                visible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none',
                x: rect.x,
                y: rect.y,
                right: rect.right,
                bottom: rect.bottom,
            };
        }),
    );

    expect(buttonLayout).toHaveLength(3);
    expect(buttonLayout.every((button) =>
        button.visible &&
        button.x >= -1 &&
        button.y >= -1 &&
        button.right <= 361 &&
        button.bottom <= 301,
    )).toBe(true);
});
