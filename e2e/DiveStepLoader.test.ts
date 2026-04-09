import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import { setupErrorSuppression } from './helper/setupErrorSuppression';

const STEP_MODEL_TIMEOUT_MS = 150000;
const STEP_FIXTURE_PATH = path.resolve(
    process.cwd(),
    'public/D100.step',
);

test.describe.configure({ timeout: 210000 });

async function waitForStepModel(page: Page): Promise<'loaded' | 'error'> {
    const timing = page.locator('.timing');
    const error = page.locator('.error');
    const deadline = Date.now() + STEP_MODEL_TIMEOUT_MS;

    while (Date.now() < deadline) {
        if (await timing.isVisible().catch(() => false)) {
            return 'loaded';
        }

        if (await error.isVisible().catch(() => false)) {
            return 'error';
        }

        await page.waitForTimeout(250);
    }

    const lastError = (await error.textContent().catch(() => null))?.trim();
    throw new Error(
        lastError
            ? `STEP model did not finish loading before timeout. Last error: ${lastError}`
            : `STEP model did not reach a loaded or error state within ${STEP_MODEL_TIMEOUT_MS}ms`,
    );
}

async function loadStepFixture(page: Page): Promise<void> {
    await page.goto('/step-loader?autoload=0', { waitUntil: 'domcontentloaded', timeout: 60000 });

    await page.locator('input[type="file"]').setInputFiles(STEP_FIXTURE_PATH);

    const result = await waitForStepModel(page);

    if (result === 'error') {
        const message = (await page.locator('.error').textContent())?.trim() ?? 'Unknown STEP loading error';
        throw new Error(`STEP demo failed to load fixture: ${message}`);
    }
}

test('shows STEP model', async ({ page }) => {
    setupErrorSuppression(page);

    await loadStepFixture(page);

    await expect(page).toHaveScreenshot('dive-step-loader-model-visible.png');
});

test('wireframe toggle', async ({ page }) => {
    setupErrorSuppression(page);

    await loadStepFixture(page);

    const wireframeCheckbox = page.locator('input[type="checkbox"]');
    await expect(wireframeCheckbox).toBeEnabled();

    await wireframeCheckbox.check();
    await page.waitForFunction(() =>
        new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );
    await expect(page).toHaveScreenshot('dive-step-loader-wireframe.png');

    await wireframeCheckbox.uncheck();
    await page.waitForFunction(() =>
        new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );
    await expect(page).toHaveScreenshot('dive-step-loader-wireframe-off.png');
});
