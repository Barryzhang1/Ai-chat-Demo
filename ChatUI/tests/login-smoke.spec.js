const { test, expect } = require('@playwright/test');

const TEST_USER_NAME = 'SmokeUser';

test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});

test('login and auth smoke flow', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('register-name-input').locator('input').fill(TEST_USER_NAME);
  await page.getByTestId('register-submit').click();

  await expect(page).toHaveURL(/\/role-select$/);
  await expect(page.getByTestId('role-user')).toBeVisible();
  await expect(page.getByTestId('role-logout')).toBeVisible();

  await page.getByTestId('role-logout').click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/role-select');
  await expect(page).toHaveURL(/\/$/);
});
