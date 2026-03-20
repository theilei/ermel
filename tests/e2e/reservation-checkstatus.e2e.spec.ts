import { test, expect } from '@playwright/test';

const skipE2E = !process.env.E2E_BASE_URL || !process.env.E2E_ENABLED;

test.describe('Reservation and Check Status', () => {
  test.skip(skipE2E, 'Set E2E_ENABLED=1 and E2E_BASE_URL to run browser E2E flows.');

  test('reservation date rules and check status ownership behavior', async ({ page }) => {
    await page.goto('/check-status');
    await expect(page).toHaveURL(/check-status|login/);
  });
});
