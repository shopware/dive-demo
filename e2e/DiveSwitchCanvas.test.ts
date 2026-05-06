import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const switchCanvasModelPath = fileURLToPath(new URL('../public/suzanne.glb', import.meta.url));

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

test('switches from canvas 0 to canvas 1 and back with use-this buttons', async ({ page }) => {
    test.setTimeout(180000);

    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') {
            consoleErrors.push(message.text());
        }
    });
    await page.route('**/sofa_B.glb', async (route) => {
        await route.fulfill({ path: switchCanvasModelPath, contentType: 'model/gltf-binary' });
    });

    await page.goto('/switch-canvas', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const canvas0 = page.locator('.canvasWrapper0');
    const canvas1 = page.locator('.canvasWrapper1');
    const useCanvas0 = canvas0.getByRole('button', { name: 'Use this' });
    const useCanvas1 = canvas1.getByRole('button', { name: 'Use this' });

    await expect(useCanvas1).toBeEnabled({ timeout: 60000 });
    await expect(useCanvas0).toBeDisabled();

    await useCanvas1.click();

    await expect(useCanvas1).toBeDisabled();
    await expect(useCanvas0).toBeEnabled();
    await expect(canvas1.locator('.overlay')).toHaveCount(0);
    await expect(canvas0.locator('.overlay')).toBeVisible();

    await useCanvas0.click();

    await expect(useCanvas0).toBeDisabled();
    await expect(useCanvas1).toBeEnabled();
    await expect(canvas0.locator('.overlay')).toHaveCount(0);
    await expect(canvas1.locator('.overlay')).toBeVisible();

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
});
