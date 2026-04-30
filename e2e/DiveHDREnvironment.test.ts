import { test, expect, type Page } from '@playwright/test';
import { setupErrorSuppression } from './helper/setupErrorSuppression';
import { navigateToExample } from './helper/navigateToExample';

const HDR_READY_TIMEOUT_MS = 120000;
const HDR_TEST_PATH = '/hdr-environment?skipHDRLoad=1';

test.describe('HDR environment demo', () => {
    test.describe.configure({ timeout: 150000 });

    async function prepareHDRTestPage(page: Page) {
        setupErrorSuppression(page);

        // These tests assert the control UI, not HDR texture decoding.
        await page.route(/\.hdr(?:\?|$)/, (route) => route.abort('failed'));
    }

    async function waitForHDRControls(page: Page) {
        const infoBadge = page.getByTestId('hdr-info-badge');
        const controlPanel = page.getByTestId('hdr-control-panel');
        const sliderValue = page.getByTestId('hdr-slider-value');

        await expect(controlPanel).toBeVisible();
        await expect(infoBadge).toBeVisible();
        await expect(page.getByTestId('hdr-select')).toBeVisible();
        await expect(page.getByTestId('hdr-rotation')).toBeVisible();
        await expect(page.getByTestId('hdr-background')).toBeVisible();
        await expect
            .poll(async () => (await sliderValue.textContent())?.trim() ?? '')
            .toBe('0°');
    }

    test('shows hdr environment controls', async ({ page }) => {
        await prepareHDRTestPage(page);
        await navigateToExample(page, HDR_TEST_PATH, {
            waitForAssetResponse: false,
            waitForRenderedCanvas: false,
            readySelector: '[data-testid="hdr-environment-page"]',
            timeoutMs: HDR_READY_TIMEOUT_MS,
        });
        await waitForHDRControls(page);

        await expect(page.getByTestId('hdr-select')).toBeVisible();
        await expect(page.getByTestId('hdr-rotation')).toBeVisible();
        await expect(page.getByTestId('hdr-background')).toBeChecked();
        await expect(page.getByTestId('hdr-slider-value')).toHaveText('0°');
        await expect(page.getByTestId('hdr-info-badge')).toContainText('Blocky Studio');
    });

    test('hdr preset dropdown lists all environments', async ({ page }) => {
        await prepareHDRTestPage(page);
        await navigateToExample(page, HDR_TEST_PATH, {
            waitForAssetResponse: false,
            waitForRenderedCanvas: false,
            readySelector: '[data-testid="hdr-environment-page"]',
            timeoutMs: HDR_READY_TIMEOUT_MS,
        });
        await waitForHDRControls(page);

        const hdrPreset = page.getByTestId('hdr-select');
        const options = hdrPreset.locator('option');

        await expect(options).toHaveCount(5);
        await expect
            .poll(async () =>
                options.evaluateAll((elements) =>
                    elements.map((element) => (element.textContent ?? '').trim()),
                ),
            )
            .toEqual([
                'Blocky Studio',
                'Brown Photostudio',
                'Hornkoppe Spring',
                'Qwantani Sunset',
                'Studio Small',
            ]);
        await expect(hdrPreset).toHaveValue('blocky_photo_studio_1k.hdr');
    });

    test('changing hdr preset updates selection state', async ({ page }) => {
        await prepareHDRTestPage(page);
        await navigateToExample(page, HDR_TEST_PATH, {
            waitForAssetResponse: false,
            waitForRenderedCanvas: false,
            readySelector: '[data-testid="hdr-environment-page"]',
            timeoutMs: HDR_READY_TIMEOUT_MS,
        });
        await waitForHDRControls(page);

        const hdrPreset = page.getByTestId('hdr-select');
        const infoBadge = page.getByTestId('hdr-info-badge');

        await hdrPreset.selectOption('qwantani_sunset_puresky_1k.hdr');

        await expect(hdrPreset).toHaveValue('qwantani_sunset_puresky_1k.hdr');
        await expect(infoBadge).toContainText('Qwantani Sunset');
    });

    test('rotation slider and background toggle react to input', async ({ page }) => {
        await prepareHDRTestPage(page);
        await navigateToExample(page, HDR_TEST_PATH, {
            waitForAssetResponse: false,
            waitForRenderedCanvas: false,
            readySelector: '[data-testid="hdr-environment-page"]',
            timeoutMs: HDR_READY_TIMEOUT_MS,
        });
        await waitForHDRControls(page);

        const rotationSlider = page.getByTestId('hdr-rotation');
        const interactionResult = await rotationSlider.evaluate(async (element, value) => {
            const input = element as HTMLInputElement;
            const root = document;
            const sliderValue = root.querySelector('[data-testid="hdr-slider-value"]') as HTMLElement | null;
            const backgroundCheckbox = root.querySelector(
                '[data-testid="hdr-background"]',
            ) as HTMLInputElement | null;

            input.value = String(value);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            await Promise.resolve();

            const sliderText = sliderValue?.textContent?.trim() ?? '';

            if (!backgroundCheckbox) {
                return {
                    rotationValue: input.value,
                    sliderText,
                    toggledOff: null,
                    toggledOn: null,
                };
            }

            backgroundCheckbox.click();
            await Promise.resolve();
            const toggledOff = backgroundCheckbox.checked;
            backgroundCheckbox.click();
            await Promise.resolve();
            const toggledOn = backgroundCheckbox.checked;

            return {
                rotationValue: input.value,
                sliderText,
                toggledOff,
                toggledOn,
            };
        }, 90);

        expect(interactionResult).toEqual({
            rotationValue: '90',
            sliderText: '90°',
            toggledOff: false,
            toggledOn: true,
        });
    });
});
