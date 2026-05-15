import { test, expect } from './helpers/diveCleanup';

test.describe.configure({ timeout: 120000 });

test('loads clip-animation controls', async ({ page }) => {
    await page.goto('/clip-animation', { waitUntil: 'domcontentloaded', timeout: 60000 });

    await expect(page.locator('div.canvasWrapper > canvas')).toBeVisible({ timeout: 60000 });
    await expect(page.locator('button', { hasText: 'Upload File' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Export' })).toBeVisible();

    const clipsGroup = page.locator('.controlPanel-group').filter({
        has: page.locator('.controlPanel-label', { hasText: 'Clips' }),
    });
    const clipButtons = clipsGroup.locator('.controlPanel-buttons button');

    await expect(clipsGroup).toBeVisible({ timeout: 110000 });
    await expect(clipButtons.first()).toBeVisible({ timeout: 110000 });
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
