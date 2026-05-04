import { test, expect } from '@playwright/test';

test.describe.configure({ timeout: 120000 });

test('loads clip-animation controls', async ({ page }) => {
    await page.goto('/clip-animation', { waitUntil: 'domcontentloaded', timeout: 60000 });

    await expect(page.locator('div.canvasWrapper > canvas')).toBeVisible({ timeout: 60000 });
    await expect(page.locator('button', { hasText: 'Upload File' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Export' })).toBeVisible();

    const clipsLabel = page.locator('.controlPanel-label', { hasText: 'Clips' });
    await expect(clipsLabel).toBeVisible({ timeout: 110000 });
    await expect(clipsLabel.locator('..').locator('.controlPanel-buttons button')).not.toHaveCount(0);
});

test('clip playback controls update state', async ({ page }) => {
    await page.goto('/clip-animation', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const playPauseButton = page.locator('.controlPanel-buttons--center button').first();
    const stopButton = page.locator('.controlPanel-buttons--center button').nth(1);

    await expect(playPauseButton).toBeEnabled({ timeout: 110000 });
    await expect(stopButton).toBeEnabled();

    await playPauseButton.click();
    await expect(playPauseButton).toHaveText('▶');

    await playPauseButton.click();
    await expect(playPauseButton).toHaveText('⏸');

    await stopButton.click();
    await expect(playPauseButton).toHaveText('▶');
});
