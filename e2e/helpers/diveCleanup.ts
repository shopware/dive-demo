import { expect, test as base, type Page } from '@playwright/test';

async function withCleanupTimeout<T>(promise: Promise<T>, timeoutMs: number) {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
        await Promise.race([
            promise.catch(() => undefined),
            new Promise<void>((resolve) => {
                timeout = setTimeout(resolve, timeoutMs);
            }),
        ]);
    } finally {
        if (timeout) {
            clearTimeout(timeout);
        }
    }
}

async function cleanupDivePage(page: Page) {
    if (page.isClosed()) {
        return;
    }

    await withCleanupTimeout(
        page.evaluate(async () => {
            const diveGlobal = (window as typeof window & {
                DIVE?: {
                    instances?: Array<{
                        disposeAsync?: () => Promise<void>;
                    }>;
                };
            }).DIVE;
            const instances = Array.isArray(diveGlobal?.instances)
                ? [...diveGlobal.instances]
                : [];

            await Promise.allSettled(
                instances.map((instance) => instance.disposeAsync?.()),
            );
        }),
        5_000,
    );

    if (!page.isClosed()) {
        await withCleanupTimeout(
            page.goto('about:blank', {
                timeout: 10_000,
                waitUntil: 'domcontentloaded',
            }),
            5_000,
        );
    }
}

const test = base.extend<{ cleanupDive: void }>({
    cleanupDive: [
        async ({ page }, use) => {
            await use();
            await cleanupDivePage(page);
        },
        { auto: true },
    ],
});

export { expect, test };
