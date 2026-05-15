import { expect, test as base, type Page } from '@playwright/test';

async function cleanupDivePage(page: Page) {
    if (page.isClosed()) {
        return;
    }

    await page
        .evaluate(async () => {
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

            const timeout = new Promise<void>((resolve) => {
                window.setTimeout(resolve, 5_000);
            });

            await Promise.race([
                Promise.allSettled(
                    instances.map((instance) => instance.disposeAsync?.()),
                ),
                timeout,
            ]);
        })
        .catch(() => {});

    if (!page.isClosed()) {
        await page
            .goto('about:blank', {
                timeout: 10_000,
                waitUntil: 'domcontentloaded',
            })
            .catch(() => {});
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
