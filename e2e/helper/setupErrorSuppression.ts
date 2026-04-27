import type { Page, ConsoleMessage } from '@playwright/test';

const diagnosticsEnabled =
    process.env.PLAYWRIGHT_DIAGNOSTICS === '1' ||
    process.env.CI === 'true';

const interestingUrlPattern =
    /\.(glb|gltf|hdr|js|css|wasm|ttf)(\?|$)|\/(clip-animation|hdr-environment|target-animation|switch-canvas|place-on-floor|ar)(\?|$)/i;

const requestStartedAt = new WeakMap<object, number>();

function formatUrl(url: string): string {
    try {
        const parsed = new URL(url);
        return `${parsed.pathname}${parsed.search}`;
    } catch {
        return url;
    }
}

function isSuppressedMessage(text: string): boolean {
    return (
        text.includes('Unexpected usage') ||
        text.includes('Unexpected token') ||
        text.includes('loadForeignModule') ||
        text.includes('tsMode') ||
        text.includes('/assets/index-') ||
        text.includes('/assets/tsMode-')
    );
}

function isSuppressedPageError(error: Error): boolean {
    return (
        error.message.includes('Unexpected usage') ||
        error.message.includes('Unexpected token') ||
        error.message.includes('loadForeignModule') ||
        error.message.includes('Failed to export') ||
        error.message.includes('Failed to parse array buffer') ||
        Boolean(error.stack?.includes('tsMode')) ||
        Boolean(error.stack?.includes('monaco'))
    );
}

export async function dumpPageDiagnostics(
    page: Page,
    label: string,
    selector?: string,
) {
    if (!diagnosticsEnabled) {
        return;
    }

    try {
        const diagnostics = await page.evaluate((readySelector) => {
            const readyElement = readySelector
                ? document.querySelector(readySelector)
                : null;

            const canvases = Array.from(document.querySelectorAll('canvas')).map(
                (canvas) => {
                    const rect = canvas.getBoundingClientRect();
                    const style = window.getComputedStyle(canvas);

                    return {
                        testId: canvas.dataset.testid ?? null,
                        width: canvas.width,
                        height: canvas.height,
                        clientWidth: canvas.clientWidth,
                        clientHeight: canvas.clientHeight,
                        rectWidth: Math.round(rect.width),
                        rectHeight: Math.round(rect.height),
                        display: style.display,
                        visibility: style.visibility,
                        parentTag: canvas.parentElement?.tagName ?? null,
                        parentTestId: canvas.parentElement?.dataset.testid ?? null,
                    };
                },
            );

            const debugWindow = window as Window & {
                __DIVE_DEMO_DEBUG_EVENTS__?: unknown[];
            };

            return {
                href: window.location.href,
                readySelector,
                readyElement:
                    readyElement instanceof HTMLElement
                        ? {
                            outerHTML: readyElement.outerHTML.slice(0, 1000),
                            dataset: { ...readyElement.dataset },
                        }
                        : null,
                canvases,
                debugEvents:
                    debugWindow.__DIVE_DEMO_DEBUG_EVENTS__?.slice(-80) ?? [],
            };
        }, selector ?? null);

        console.log(
            `[DiveE2E] diagnostics ${label}: ${JSON.stringify(diagnostics)}`,
        );
    } catch (error) {
        console.warn(
            `[DiveE2E] diagnostics ${label} failed: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

export function setupErrorSuppression(page: Page) {
    page.on('pageerror', (error: Error) => {
        if (isSuppressedPageError(error)) {
            return;
        }
        console.error('[DiveE2E] pageerror:', error.message);
    });

    page.on('console', (msg: ConsoleMessage) => {
        const text = msg.text();
        const type = msg.type();

        if (type === 'error' && isSuppressedMessage(text)) {
            return;
        }

        if (text.startsWith('[DiveDebug]')) {
            console.log(`[DiveE2E][browser:${type}] ${text}`);
            return;
        }

        if (type === 'error' || type === 'warning') {
            console.warn(`[DiveE2E][browser:${type}] ${text}`);
        }
    });

    if (!diagnosticsEnabled) {
        return;
    }

    page.on('request', (request) => {
        requestStartedAt.set(request, Date.now());

        if (interestingUrlPattern.test(request.url())) {
            console.log(
                `[DiveE2E] request ${request.method()} ${formatUrl(request.url())}`,
            );
        }
    });

    page.on('requestfinished', async (request) => {
        if (!interestingUrlPattern.test(request.url())) {
            return;
        }

        const startedAt = requestStartedAt.get(request);
        const elapsedMs = startedAt ? Date.now() - startedAt : null;
        const response = await request.response();

        console.log(
            `[DiveE2E] request-finished ${request.method()} ${formatUrl(
                request.url(),
            )} status=${response?.status() ?? 'unknown'} elapsedMs=${
                elapsedMs ?? 'unknown'
            }`,
        );
    });

    page.on('requestfailed', (request) => {
        console.warn(
            `[DiveE2E] request-failed ${request.method()} ${formatUrl(
                request.url(),
            )} error=${request.failure()?.errorText ?? 'unknown'}`,
        );
    });

    page.on('crash', () => {
        console.error(`[DiveE2E] page-crash ${page.url()}`);
    });
}
