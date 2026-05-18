import { test, expect } from './helpers/diveCleanup';
import type { Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const switchCanvasModelPath = fileURLToPath(new URL('../public/suzanne.glb', import.meta.url));
const switchCanvasTimeout = 90000;

const isExpectedGpuNoise = (message: string) =>
    message.includes("Cannot read properties of null (reading 'getSupportedExtensions')") ||
    message.includes("Cannot read properties of null (reading '0')") ||
    message.includes('THREE.THREE.WebGLProgram: Shader Error') ||
    message.includes('THREE.THREE.WebGPURenderer: WebGL Device Lost');

const waitForInitialQuickView = async (page: Page) => {
    await expect(page.locator('.page')).toHaveAttribute('data-quick-view-ready', 'true', {
        timeout: switchCanvasTimeout,
    });
};

test.beforeEach(async ({ page }) => {
    await page.route('**/sofa_B.glb', async (route) => {
        await route.fulfill({ path: switchCanvasModelPath, contentType: 'model/gltf-binary' });
    });
});

test('loads switch-canvas panels', async ({ page }) => {
    await page.goto('/switch-canvas?skipQuickView=1', { waitUntil: 'domcontentloaded', timeout: 60000 });

    await expect(page.locator('.canvasWrapper0')).toBeVisible();
    await expect(page.locator('.canvasWrapper1')).toBeVisible();
    await expect(page.locator('.canvasWrapper2')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Use this' })).toHaveCount(3);
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
    await page.goto('/switch-canvas', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const canvas0 = page.locator('.canvasWrapper0');
    const canvas1 = page.locator('.canvasWrapper1');
    const useCanvas0 = canvas0.getByRole('button', { name: 'Use this' });
    const useCanvas1 = canvas1.getByRole('button', { name: 'Use this' });

    await waitForInitialQuickView(page);
    await expect(useCanvas1).toBeEnabled({ timeout: switchCanvasTimeout });
    await expect(useCanvas0).toBeDisabled({ timeout: switchCanvasTimeout });

    await useCanvas1.click();

    await expect(canvas1.locator('.overlay')).toHaveCount(0, { timeout: switchCanvasTimeout });
    await expect(canvas0.locator('.overlay')).toBeVisible({ timeout: switchCanvasTimeout });
    await expect(useCanvas1).toBeDisabled({ timeout: switchCanvasTimeout });
    await expect(useCanvas0).toBeEnabled({ timeout: switchCanvasTimeout });

    await useCanvas0.click();

    await expect(canvas0.locator('.overlay')).toHaveCount(0, { timeout: switchCanvasTimeout });
    await expect(canvas1.locator('.overlay')).toBeVisible({ timeout: switchCanvasTimeout });
    await expect(useCanvas0).toBeDisabled({ timeout: switchCanvasTimeout });
    await expect(useCanvas1).toBeEnabled({ timeout: switchCanvasTimeout });

    expect(pageErrors.filter((message) => !isExpectedGpuNoise(message))).toEqual([]);
    expect(consoleErrors.filter((message) => !isExpectedGpuNoise(message))).toEqual([]);
});
