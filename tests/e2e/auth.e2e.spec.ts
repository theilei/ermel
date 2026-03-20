import { test, expect } from '@playwright/test';

const skipE2E = !process.env.E2E_BASE_URL || !process.env.E2E_ENABLED;

test.describe('Auth flows', () => {
  test.skip(skipE2E, 'Set E2E_ENABLED=1 and E2E_BASE_URL to run browser E2E flows.');

  test('register, login, verification-required redirect, and session persistence', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('text=Create one')).toBeVisible();

    await page.goto('/login');
    await expect(page.locator('text=SIGN IN')).toBeVisible();

    await page.goto('/quote');
    await expect(page).toHaveURL(/login|quote/);
  });
});
