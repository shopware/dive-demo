import { test, expect } from '@playwright/test';

const ROUTE = '/';

test('shows model', async ({ page }) => {
    await page.goto(ROUTE);
    await expect(page.locator('div.app-container')).toBeVisible();
    await expect(page.locator('div.sidebar')).toBeVisible();
    await expect(page.locator('div.content')).toBeVisible();

    await expect(page.locator('div.canvasWrapper > canvas')).toBeVisible();
    await expect(page.locator('div.canvasWrapper > canvas')).toHaveScreenshot('dive-quick-view-model-visible.png');
});

test('click', async ({ page }) => {
    await page.goto(ROUTE);
    const canvas = page.locator('div.canvasWrapper > canvas');
    await expect(canvas).toBeVisible();
    const boundingBox = await canvas.boundingBox();
    if (!boundingBox) {
        throw new Error('Bounding box not found');
    }
    const center = {
        x: boundingBox.x + boundingBox.width / 2,
        y: boundingBox.y + boundingBox.height / 2,
    };

    await page.mouse.move(center.x, center.y);
    await page.mouse.down();
    await page.mouse.move(center.x + 100, center.y + 100, { steps: 100 });
    await page.mouse.up();
    await page.waitForTimeout(1000);
    await expect(page.locator('div.canvasWrapper > canvas')).toHaveScreenshot('dive-move-camera.png');
});
