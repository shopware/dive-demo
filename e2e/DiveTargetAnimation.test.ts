import { test, expect } from '@playwright/test';
import { setupErrorSuppression } from './helper/setupErrorSuppression';
import { navigateToExample } from './helper/navigateToExample';

test('shows model with preset controls', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToExample(page, '/target-animation');

    await expect(page.locator('.controlPanel')).toBeVisible();
    await expect(page).toHaveScreenshot('dive-target-animation-loaded.png');
});

test('all preset buttons are visible', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToExample(page, '/target-animation');

    const cameraLabel = page.locator('.controlPanel-label', { hasText: 'Camera' });
    await expect(cameraLabel).toBeVisible();

    const presetButtons = cameraLabel.locator('..').locator('.controlPanel-buttons button');
    await expect(presetButtons).toHaveCount(5);

    await expect(presetButtons.nth(0)).toHaveText('Initial');
    await expect(presetButtons.nth(1)).toHaveText('Hero');
    await expect(presetButtons.nth(2)).toHaveText('Low');
    await expect(presetButtons.nth(3)).toHaveText('Top-down');
    await expect(presetButtons.nth(4)).toHaveText('Back');
});

test('initial preset is active by default', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToExample(page, '/target-animation');

    const cameraLabel = page.locator('.controlPanel-label', { hasText: 'Camera' });
    const presetButtons = cameraLabel.locator('..').locator('.controlPanel-buttons button');

    await expect(presetButtons.nth(0)).toHaveClass(/active/);
});

test('clicking preset changes active state and animates camera', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToExample(page, '/target-animation');

    const cameraLabel = page.locator('.controlPanel-label', { hasText: 'Camera' });
    const presetButtons = cameraLabel.locator('..').locator('.controlPanel-buttons button');

    await presetButtons.nth(1).click();
    await expect(presetButtons.nth(1)).toHaveClass(/active/);
    await expect(presetButtons.nth(0)).not.toHaveClass(/active/);

    // animation duration is 800ms; wait for it to settle
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('dive-target-animation-hero-preset.png');
});

test('clicking multiple presets in sequence', async ({ page }) => {
    setupErrorSuppression(page);
    await navigateToExample(page, '/target-animation');

    const cameraLabel = page.locator('.controlPanel-label', { hasText: 'Camera' });
    const presetButtons = cameraLabel.locator('..').locator('.controlPanel-buttons button');

    await presetButtons.nth(3).click();
    await expect(presetButtons.nth(3)).toHaveClass(/active/);
    await page.waitForTimeout(1000);

    await presetButtons.nth(4).click();
    await expect(presetButtons.nth(4)).toHaveClass(/active/);
    await expect(presetButtons.nth(3)).not.toHaveClass(/active/);
    await page.waitForTimeout(1000);

    await presetButtons.nth(0).click();
    await expect(presetButtons.nth(0)).toHaveClass(/active/);
    await expect(presetButtons.nth(4)).not.toHaveClass(/active/);
    await page.waitForTimeout(1000);
});
