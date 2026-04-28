import type { Page, ConsoleMessage } from '@playwright/test';

export type DiveDebugEventMatcher = {
    scope: string;
    stage: string;
};

type DiveDebugConsoleEvent = DiveDebugEventMatcher & {
    text: string;
    type: string;
    wallTimeMs: number;
};

type DiveDebugWaiter = {
    matchers: DiveDebugEventMatcher[];
    timer: ReturnType<typeof setTimeout>;
    resolve: (event: DiveDebugConsoleEvent) => void;
    sinceMs?: number;
};

type DiveDebugState = {
    events: DiveDebugConsoleEvent[];
    waiters: DiveDebugWaiter[];
};

const diagnosticsEnabled =
    process.env.PLAYWRIGHT_DIAGNOSTICS === '1' ||
    process.env.CI === 'true';

const interestingUrlPattern =
    /\.(glb|gltf|hdr|js|css|wasm|ttf)(\?|$)|\/(clip-animation|hdr-environment|target-animation|switch-canvas|place-on-floor|ar)(\?|$)/i;

const requestStartedAt = new WeakMap<object, number>();
const diveDebugStates = new WeakMap<Page, DiveDebugState>();
const maxDiveDebugEvents = 300;

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

function parseDiveDebugConsoleEvent(
    text: string,
    type: string,
): DiveDebugConsoleEvent | null {
    const diveDebugMatch = text.match(/^\[DiveDebug\]\s+(\S+)\s+(\S+)/);
    if (diveDebugMatch) {
        return {
            scope: diveDebugMatch[1],
            stage: diveDebugMatch[2],
            text,
            type,
            wallTimeMs: Date.now(),
        };
    }

    const legacyDiveDebugMatch = text.match(/^\[(Dive(?!Debug\b)\S+)\]\s+(\S+)/);
    if (legacyDiveDebugMatch) {
        return {
            scope: legacyDiveDebugMatch[1],
            stage: legacyDiveDebugMatch[2],
            text,
            type,
            wallTimeMs: Date.now(),
        };
    }

    return null;
}

function matchesDiveDebugEvent(
    event: DiveDebugConsoleEvent,
    matchers: DiveDebugEventMatcher[],
    sinceMs?: number,
): boolean {
    if (sinceMs && event.wallTimeMs < sinceMs) {
        return false;
    }

    return matchers.some(
        (matcher) =>
            matcher.scope === event.scope &&
            matcher.stage === event.stage,
    );
}

function formatDiveDebugMatcher(matcher: DiveDebugEventMatcher): string {
    return `${matcher.scope}:${matcher.stage}`;
}

function formatRecentDiveDebugEvents(events: DiveDebugConsoleEvent[]): string {
    if (events.length === 0) {
        return 'none';
    }

    return events
        .slice(-20)
        .map((event) => `${event.scope}:${event.stage}`)
        .join(', ');
}

function removeDiveDebugWaiter(
    state: DiveDebugState,
    waiter: DiveDebugWaiter,
) {
    const index = state.waiters.indexOf(waiter);
    if (index >= 0) {
        state.waiters.splice(index, 1);
    }
}

function resolveMatchingDiveDebugWaiters(
    state: DiveDebugState,
    event: DiveDebugConsoleEvent,
) {
    for (const waiter of [...state.waiters]) {
        if (!matchesDiveDebugEvent(event, waiter.matchers, waiter.sinceMs)) {
            continue;
        }

        clearTimeout(waiter.timer);
        removeDiveDebugWaiter(state, waiter);
        waiter.resolve(event);
    }
}

export function ensureDiveDebugEventRecorder(page: Page): DiveDebugState {
    const existingState = diveDebugStates.get(page);
    if (existingState) {
        return existingState;
    }

    const state: DiveDebugState = {
        events: [],
        waiters: [],
    };
    diveDebugStates.set(page, state);

    page.on('console', (msg: ConsoleMessage) => {
        const event = parseDiveDebugConsoleEvent(msg.text(), msg.type());
        if (!event) {
            return;
        }

        state.events.push(event);
        if (state.events.length > maxDiveDebugEvents) {
            state.events.splice(0, state.events.length - maxDiveDebugEvents);
        }

        resolveMatchingDiveDebugWaiters(state, event);
    });

    return state;
}

export async function waitForDiveDebugEvent(
    page: Page,
    matchers: DiveDebugEventMatcher[],
    options: {
        timeoutMs: number;
        description: string;
        sinceMs?: number;
    },
): Promise<DiveDebugConsoleEvent> {
    const state = ensureDiveDebugEventRecorder(page);
    const existingEvent = state.events.find((event) =>
        matchesDiveDebugEvent(event, matchers, options.sinceMs),
    );

    if (existingEvent) {
        return existingEvent;
    }

    return await new Promise<DiveDebugConsoleEvent>((resolve, reject) => {
        const waiter: DiveDebugWaiter = {
            matchers,
            sinceMs: options.sinceMs,
            resolve,
            timer: setTimeout(() => {
                removeDiveDebugWaiter(state, waiter);
                const expected = matchers.map(formatDiveDebugMatcher).join(', ');
                reject(
                    new Error(
                        `Timed out after ${options.timeoutMs}ms waiting for ${options.description}. ` +
                            `Expected one of: ${expected}. Recent debug events: ${formatRecentDiveDebugEvents(state.events)}`,
                    ),
                );
            }, options.timeoutMs),
        };

        state.waiters.push(waiter);
    });
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
    ensureDiveDebugEventRecorder(page);

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
