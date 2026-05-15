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

            await Promise.allSettled(
                instances.map((instance) => instance.disposeAsync?.()),
            );
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
