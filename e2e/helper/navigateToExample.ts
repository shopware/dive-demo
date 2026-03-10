import type { Page } from '@playwright/test';

/**
 * Navigates to a demo page and waits for the 3D model to be fully loaded
 * by listening for the model file's network response, then waiting for
 * the renderer to produce a frame and Vue's reactivity to settle.
 *
 * No explicit timeout on waitForResponse — the test-level timeout
 * (configured per-environment in playwright.config.ts) controls the
 * overall deadline so we don't race against page.goto on slow CI runners.
 */
export async function navigateToExample(
    page: Page,
    path: string,
    options?: { filePattern?: string | RegExp },
) {
    const {
        filePattern = /\.(glb|gltf|step|stp|iges|igs)(\?|$)/i,
    } = options ?? {};

    const matcher = (url: string) =>
        typeof filePattern === 'string'
            ? url.includes(filePattern)
            : filePattern.test(url);

    const responsePromise = page.waitForResponse(
        (resp) => matcher(resp.url()) && resp.ok(),
    );

    await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await responsePromise;

    await page.waitForFunction(() =>
        new Promise((resolve) =>
            requestAnimationFrame(() =>
                requestAnimationFrame(() => setTimeout(resolve, 100)),
            ),
        ),
    );
}
