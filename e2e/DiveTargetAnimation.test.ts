import { test, expect } from './helpers/diveCleanup';
import { fileURLToPath } from 'node:url';

const targetAnimationModelPath = fileURLToPath(new URL('../public/suzanne.glb', import.meta.url));

test('loads target-animation preset controls', async ({ page }) => {
    await page.goto('/target-animation', { waitUntil: 'domcontentloaded', timeout: 60000 });

    await expect(page.locator('div.canvasWrapper > canvas')).toBeVisible({ timeout: 60000 });

    const presets = page.locator('.controlPanel-buttons--center button');
    await expect(presets).toHaveText(['Initial', 'Hero', 'Low', 'Top-down', 'Back'], { timeout: 60000 });
    await expect(presets.nth(0)).toHaveClass(/active/);
});

test('preset click updates the active state', async ({ page }) => {
    await page.route('**/sofa_B.glb', async (route) => {
        await route.fulfill({ path: targetAnimationModelPath, contentType: 'model/gltf-binary' });
    });

    await page.goto('/target-animation', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const presets = page.locator('.controlPanel-buttons--center button');
    await expect(presets.nth(1)).toBeEnabled({ timeout: 60000 });

    await presets.nth(1).click();
    await expect(presets.nth(1)).toHaveClass(/active/);
    await expect(presets.nth(0)).not.toHaveClass(/active/);
});
