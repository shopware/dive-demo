import { test, expect } from '@playwright/test';
import { setupErrorSuppression } from './helper/setupErrorSuppression';
import { navigateToExample } from './helper/navigateToExample';

test('shows model', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToExample(page, '/');
    await expect(page).toHaveScreenshot('dive-quick-view-model-visible.png');
});

test('click', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToExample(page, '/');

    const canvas = page.locator('div.canvasWrapper > canvas');
    const boundingBox = await canvas.boundingBox();
    if (!boundingBox) throw new Error('Bounding box not found');

    const center = {
        x: boundingBox.x + boundingBox.width / 2,
        y: boundingBox.y + boundingBox.height / 2,
    };

    await page.mouse.move(center.x, center.y);
    await page.mouse.down();
    await page.mouse.move(center.x + 100, center.y + 100, { steps: 10 });
    await page.mouse.up();

    await page.waitForFunction(() =>
        new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );

    await expect(page).toHaveScreenshot('dive-move-camera.png');
});

test('upload and export buttons are visible', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToExample(page, '/');

    await expect(page.locator('button', { hasText: 'Upload File' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Export' })).toBeVisible();
});

test('export dropdown opens and closes', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToExample(page, '/');

    const canvas = page.locator('div.canvasWrapper > canvas');
    const exportButton = page.locator('button', { hasText: 'Export' });
    const exportMenu = page.locator('.export-menu');

    await expect(exportMenu).not.toBeVisible();

    await exportButton.click();
    await expect(exportMenu).toBeVisible();

    const options = exportMenu.locator('.export-option');
    await expect(options).toHaveCount(3);
    await expect(options.nth(0)).toHaveText('.glb');
    await expect(options.nth(1)).toHaveText('.gltf');
    await expect(options.nth(2)).toHaveText('.usdz');

    await canvas.click({ position: { x: 10, y: 10 } });
    await expect(exportMenu).not.toBeVisible();
});

test('export option click closes dropdown', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToExample(page, '/');

    const exportButton = page.locator('button', { hasText: 'Export' });
    const exportMenu = page.locator('.export-menu');

    await exportButton.click();
    await expect(exportMenu).toBeVisible();

    await page.locator('.export-option', { hasText: '.glb' }).click();
    await expect(exportMenu).not.toBeVisible();
});
