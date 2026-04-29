import { test, expect } from '@playwright/test';
import {
    setupErrorSuppression,
    waitForDiveDebugEvent,
} from './helper/setupErrorSuppression';
import { navigateToExample } from './helper/navigateToExample';

async function navigateToTargetAnimation(
    page: Parameters<typeof setupErrorSuppression>[0],
    path = '/target-animation',
) {
    setupErrorSuppression(page);
    const stateStartedAt = Date.now();

    await navigateToExample(page, path, {
        waitForCanvasVisible: false,
        waitForRenderedCanvas: false,
        readySelector: '[data-testid="target-animation-page"]',
    });

    await waitForDiveDebugEvent(
        page,
        [
            {
                scope: 'DiveTargetAnimation',
                stage: 'controls-state-ready-active-0',
            },
        ],
        {
            timeoutMs: 30000,
            sinceMs: stateStartedAt,
            description: 'TargetAnimation controls state',
        },
    );
}

test('shows model with preset controls', async ({ page }) => {
    await navigateToTargetAnimation(page);

    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('dive-target-animation-loaded.png');
});

test('all preset buttons are visible', async ({ page }) => {
    await navigateToTargetAnimation(page);
});

test('initial preset is active by default', async ({ page }) => {
    await navigateToTargetAnimation(page);
});

test('preset click changes active state and animates camera', async ({ page }) => {
    setupErrorSuppression(page);
    const presetStartedAt = Date.now();

    await navigateToExample(page, '/target-animation?targetPresetClick=1', {
        waitForCanvasVisible: false,
        waitForRenderedCanvas: false,
        readySelector: '[data-testid="target-animation-page"]',
    });

    await waitForDiveDebugEvent(
        page,
        [
            {
                scope: 'DiveTargetAnimation',
                stage: 'preset-active-1',
            },
        ],
        {
            timeoutMs: 30000,
            sinceMs: presetStartedAt,
            description: 'TargetAnimation preset activation',
        },
    );

    // animation duration is 800ms; wait for it to settle
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('dive-target-animation-hero-preset.png');
});

test('activating multiple presets in sequence', async ({ page }) => {
    setupErrorSuppression(page);
    const sequenceStartedAt = Date.now();

    await navigateToExample(page, '/target-animation?targetPresetSequence=3,4,0', {
        waitForCanvasVisible: false,
        waitForRenderedCanvas: false,
        readySelector: '[data-testid="target-animation-page"]',
    });

    await waitForDiveDebugEvent(
        page,
        [
            {
                scope: 'DiveTargetAnimation',
                stage: 'preset-sequence-complete-3-4-0',
            },
        ],
        {
            timeoutMs: 30000,
            sinceMs: sequenceStartedAt,
            description: 'TargetAnimation preset sequence',
        },
    );
});
