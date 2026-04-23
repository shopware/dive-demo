import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import { setupErrorSuppression } from './helper/setupErrorSuppression';

const STEP_MODEL_TIMEOUT_MS = 210000;
const STEP_MODEL_PATH = path.resolve(process.cwd(), 'public/D100.step');

test.describe.configure({ timeout: 300000 });

async function waitForStepModel(page: Page): Promise<'loaded' | 'error'> {
    const timing = page.locator('.timing');
    const error = page.locator('.error');
    let status: 'pending' | 'loaded' | 'error' = 'pending';

    await expect
        .poll(
            async () => {
                if (await timing.isVisible().catch(() => false)) {
                    status = 'loaded';
                    return status;
                }

                if (await error.isVisible().catch(() => false)) {
                    status = 'error';
                    return status;
                }

                return 'pending';
            },
            {
                timeout: STEP_MODEL_TIMEOUT_MS,
                intervals: [250],
            },
        )
        .not.toBe('pending');

    if (status !== 'pending') {
        return status;
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

    await page.locator('input[type="file"]').setInputFiles(STEP_MODEL_PATH);

    const result = await waitForStepModel(page);

    if (result === 'error') {
        const message = (await page.locator('.error').textContent())?.trim() ?? 'Unknown STEP loading error';
        throw new Error(`STEP demo failed to load fixture: ${message}`);
    }

    await expect(page.getByTestId('step-loader-page')).toHaveAttribute('data-ready', 'true', {
        timeout: STEP_MODEL_TIMEOUT_MS,
    });
}

test('shows STEP model and wireframe toggle', async ({ page }) => {
    setupErrorSuppression(page);

    await loadStepFixture(page);

    await expect(page).toHaveScreenshot('dive-step-loader-model-visible.png');

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
