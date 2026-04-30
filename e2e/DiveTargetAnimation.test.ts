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

    return waitForDiveDebugEvent(
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
    const readyEvent = await navigateToTargetAnimation(page);

    expect(readyEvent.text).toContain('controlsReady: true');
    expect(readyEvent.text).toContain('activeIndex: 0');
});

test('all preset buttons are visible', async ({ page }) => {
    const readyEvent = await navigateToTargetAnimation(page);

    expect(readyEvent.text).toContain(
        'presetLabelList: Initial|Hero|Low|Top-down|Back',
    );
});

test('initial preset is active by default', async ({ page }) => {
    const readyEvent = await navigateToTargetAnimation(page);

    expect(readyEvent.text).toContain('activePresetLabel: Initial');
});

test('preset click changes active state and animates camera', async ({ page }) => {
    setupErrorSuppression(page);
    const presetStartedAt = Date.now();

    await navigateToExample(page, '/target-animation?targetPresetClick=1', {
        waitForCanvasVisible: false,
        waitForRenderedCanvas: false,
        readySelector: '[data-testid="target-animation-page"]',
    });

    const activationEvent = await waitForDiveDebugEvent(
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

    const animationEvent = await waitForDiveDebugEvent(
        page,
        [
            {
                scope: 'DiveTargetAnimation',
                stage: 'animator-from-targets-call-start',
            },
        ],
        {
            timeoutMs: 30000,
            sinceMs: presetStartedAt,
            description: 'TargetAnimation preset animation start',
        },
    );

    expect(activationEvent.text).toContain('presetLabel: Hero');
    expect(animationEvent.text).toContain('presetIndex: 1');
});

test('activating multiple presets in sequence', async ({ page }) => {
    setupErrorSuppression(page);
    const sequenceStartedAt = Date.now();

    await navigateToExample(page, '/target-animation?targetPresetSequence=3,4,0', {
        waitForCanvasVisible: false,
        waitForRenderedCanvas: false,
        readySelector: '[data-testid="target-animation-page"]',
    });

    const sequenceEvent = await waitForDiveDebugEvent(
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

    expect(sequenceEvent.text).toContain('finalActiveIndex: 0');
});
