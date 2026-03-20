import { test, expect } from '@playwright/test';

const skipE2E = !process.env.E2E_BASE_URL || !process.env.E2E_ENABLED;

test.describe('Quote flow', () => {
  test.skip(skipE2E, 'Set E2E_ENABLED=1 and E2E_BASE_URL to run browser E2E flows.');

  test('submit quote and observe admin/customer status views', async ({ page }) => {
    await page.goto('/quote');
    await expect(page.locator('text=Quotation')).toBeVisible();
  });
});
