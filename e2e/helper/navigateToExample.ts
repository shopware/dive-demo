import type { Page } from '@playwright/test';

/**
 * Navigates to a demo page and waits for the 3D model to be fully loaded
 * by listening for the model file's network response, then waiting for
 * the renderer to produce a frame and Vue's reactivity to settle.
 */
export async function navigateToExample(
    page: Page,
    path: string,
    options?: { filePattern?: string | RegExp; timeout?: number },
) {
    const {
        filePattern = /\.(glb|gltf|step|stp|iges|igs)(\?|$)/i,
        timeout = 30000,
    } = options ?? {};

    const matcher = (url: string) =>
        typeof filePattern === 'string'
            ? url.includes(filePattern)
            : filePattern.test(url);

    const responsePromise = page.waitForResponse(
        (resp) => matcher(resp.url()) && resp.ok(),
        { timeout },
    );

    await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await responsePromise;

    // wait for parse + render + Vue reactivity settle
    await page.waitForFunction(
        () =>
            new Promise((resolve) =>
                requestAnimationFrame(() =>
                    requestAnimationFrame(() => setTimeout(resolve, 100)),
                ),
            ),
    );
}
