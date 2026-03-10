import type { Page, ConsoleMessage } from '@playwright/test';

export function setupErrorSuppression(page: Page) {
    page.on('pageerror', (error: Error) => {
        if (error.message.includes('Unexpected usage') ||
            error.message.includes('Unexpected token') ||
            error.message.includes('loadForeignModule') ||
            error.message.includes('Failed to export') ||
            error.message.includes('Failed to parse array buffer') ||
            error.stack?.includes('tsMode') ||
            error.stack?.includes('monaco')) {
            return;
        }
        console.error('Page error:', error.message);
    });

    page.on('console', (msg: ConsoleMessage) => {
        const text = msg.text();
        if (msg.type() === 'error' && (
            text.includes('Unexpected usage') ||
            text.includes('Unexpected token') ||
            text.includes('loadForeignModule') ||
            text.includes('tsMode') ||
            text.includes('/assets/index-') ||
            text.includes('/assets/tsMode-'))) {
            return;
        }
    });
}
