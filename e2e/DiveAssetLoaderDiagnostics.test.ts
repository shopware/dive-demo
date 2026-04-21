import { expect, test } from '@playwright/test'
import { setupErrorSuppression } from './helper/setupErrorSuppression'

test.describe('asset loader diagnostics', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium-only CI diagnostic')

  test('chunk diagnostic resolves', async ({ page }) => {
    setupErrorSuppression(page)

    await page.goto('/asset-loader-diagnostics?mode=chunk', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    })

    await expect(page.getByTestId('asset-loader-diagnostics-page')).toBeVisible()
    await expect(page.getByTestId('asset-loader-diagnostics-chunk-state')).toHaveAttribute('data-state', 'success', {
      timeout: 30000
    })
  })

  test('parse diagnostic resolves', async ({ page }) => {
    setupErrorSuppression(page)

    await page.goto('/asset-loader-diagnostics?mode=parse', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    })

    await expect(page.getByTestId('asset-loader-diagnostics-page')).toBeVisible()
    await expect(page.getByTestId('asset-loader-diagnostics-parse-state')).toHaveAttribute('data-state', 'success', {
      timeout: 30000
    })
  })
})
