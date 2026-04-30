import { test, expect, type Page } from '@playwright/test';
import { setupErrorSuppression } from './helper/setupErrorSuppression';
import { navigateToExample } from './helper/navigateToExample';

const CLIP_READY_TIMEOUT_MS = 150000;
const CLIP_TEST_TIMEOUT_MS = 180000;

test.describe.configure({ timeout: CLIP_TEST_TIMEOUT_MS });

async function navigateToClipAnimation(page: Page) {
    setupErrorSuppression(page);
    await navigateToExample(page, '/clip-animation', {
        waitForRenderedCanvas: false,
        readySelector: '[data-testid="clip-animation-page"]',
        timeoutMs: CLIP_READY_TIMEOUT_MS,
    });
}

test('shows model with animation controls', async ({ page }) => {
    await navigateToClipAnimation(page);

    const controlPanel = page.locator('.controlPanel:not(.controlPanel--top)');
    await expect(controlPanel).toBeVisible({ timeout: 30000 });

    const stopButton = page.locator('.controlPanel-buttons--center button').nth(1);
    await stopButton.click();

    await page.waitForFunction(() =>
        new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );

    await expect(page).toHaveScreenshot('dive-clip-animation-loaded.png');
});

test('clip buttons appear after model loads', async ({ page }) => {
    await navigateToClipAnimation(page);

    const clipsLabel = page.locator('.controlPanel-label', { hasText: 'Clips' });
    await expect(clipsLabel).toBeVisible();

    const clipButtons = clipsLabel.locator('..').locator('.controlPanel-buttons button');
    await expect(clipButtons).not.toHaveCount(0, { timeout: 30000 });

    const firstClip = clipButtons.first();
    await expect(firstClip).toHaveClass(/active/);
});

test('play/pause and stop controls work', async ({ page }) => {
    await navigateToClipAnimation(page);

    const playPauseButton = page.locator('.controlPanel-buttons--center button').first();
    const stopButton = page.locator('.controlPanel-buttons--center button').nth(1);

    await expect(playPauseButton).toBeVisible();
    await expect(stopButton).toBeVisible();
    await expect(playPauseButton).toHaveText('⏸');

    await playPauseButton.click();
    await expect(playPauseButton).toHaveText('▶');

    await playPauseButton.click();
    await expect(playPauseButton).toHaveText('⏸');

    await stopButton.click();
    await expect(playPauseButton).toHaveText('▶');
});

test('loop mode buttons work', async ({ page }) => {
    await navigateToClipAnimation(page);

    const loopLabel = page.locator('.controlPanel-label', { hasText: 'Loop' });
    await expect(loopLabel).toBeVisible();

    const loopButtons = loopLabel.locator('..').locator('.controlPanel-buttons button');
    await expect(loopButtons).toHaveCount(3);

    await expect(loopButtons.nth(0)).toHaveText('once');
    await expect(loopButtons.nth(1)).toHaveText('repeat');
    await expect(loopButtons.nth(2)).toHaveText('pingpong');

    await expect(loopButtons.nth(1)).toHaveClass(/active/);

    await loopButtons.nth(0).click();
    await expect(loopButtons.nth(0)).toHaveClass(/active/);
    await expect(loopButtons.nth(1)).not.toHaveClass(/active/);

    await loopButtons.nth(2).click();
    await expect(loopButtons.nth(2)).toHaveClass(/active/);
    await expect(loopButtons.nth(0)).not.toHaveClass(/active/);
});

test('upload and export buttons are visible', async ({ page }) => {
    await navigateToClipAnimation(page);

    await expect(page.locator('button', { hasText: 'Upload File' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Export' })).toBeVisible();
});

test('export dropdown opens and closes', async ({ page }) => {
    await navigateToClipAnimation(page);

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
    await navigateToClipAnimation(page);

    const exportButton = page.locator('button', { hasText: 'Export' });
    const exportMenu = page.locator('.export-menu');

    await exportButton.click();
    await expect(exportMenu).toBeVisible();

    await page.locator('.export-option', { hasText: '.glb' }).click();
    await expect(exportMenu).not.toBeVisible();
});

test('switching clips changes active state', async ({ page }) => {
    await navigateToClipAnimation(page);

    const clipsLabel = page.locator('.controlPanel-label', { hasText: 'Clips' });
    const clipButtons = clipsLabel.locator('..').locator('.controlPanel-buttons button');
    await expect(clipButtons).not.toHaveCount(0, { timeout: 30000 });

    const count = await clipButtons.count();
    if (count > 1) {
        await clipButtons.nth(1).click();
        await expect(clipButtons.nth(1)).toHaveClass(/active/);
        await expect(clipButtons.nth(0)).not.toHaveClass(/active/);
    }
});
