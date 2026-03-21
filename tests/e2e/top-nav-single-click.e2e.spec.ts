import { expect, test } from '@playwright/test';

test.describe('Top nav single-click behavior', () => {
  test('Projects and Services scroll on first click', async ({ page }) => {
    await page.goto('/');

    const beforeProjects = await page.evaluate(() => window.scrollY);
    await page.getByRole('button', { name: 'Projects' }).click();
    await page.waitForTimeout(350);
    const afterProjects = await page.evaluate(() => window.scrollY);
    expect(afterProjects).toBeGreaterThan(beforeProjects + 80);

    await page.getByRole('button', { name: 'Services' }).click();
    await page.waitForTimeout(350);
    const afterServices = await page.evaluate(() => window.scrollY);
    expect(Math.abs(afterServices - afterProjects)).toBeGreaterThan(80);
  });

  test('About navigates on first click', async ({ page }) => {
    await page.goto('/');
    const headerNav = page.locator('header').first();
    await headerNav.getByRole('link', { name: 'About' }).first().click();
    await expect(page).toHaveURL(/\/about$/);
  });

  test('Logo and Products work on first click', async ({ page }) => {
    await page.goto('/about');

    await page.getByRole('link', { name: /ERMEL/i }).click();
    await expect(page).toHaveURL(/\/$/);

    const headerNav = page.locator('header').first();
    await headerNav.getByRole('button', { name: 'Products' }).first().click();
    await headerNav.getByRole('link', { name: 'Glass' }).first().click();
    await expect(page).toHaveURL(/\/products\/glass$/);
  });
});
