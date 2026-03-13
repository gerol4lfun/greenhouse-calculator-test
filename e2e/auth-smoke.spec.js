// @ts-check
/**
 * Auth-smoke: проверка реального входа после auth-hotfix (RPC authenticate_user).
 * Запускается БЕЗ storageState — тестирует полный flow логина.
 */
const { test, expect } = require('@playwright/test');

test.describe('auth-smoke', () => {
  test('реальный вход через форму → калькулятор виден', async ({ page }) => {
    const login = process.env.TEST_LOGIN;
    const password = process.env.TEST_PASSWORD;
    if (!login || !password) {
      test.skip();
      return;
    }

    await page.goto('/');
    await expect(page.locator('#auth-container')).toBeVisible();

    await page.locator('#login').fill(login);
    await page.locator('#password').fill(password);
    await page.locator('button:has-text("Войти")').click();

    await expect(page.locator('#auth-container')).toHaveClass(/hidden/);
    await expect(page.locator('#calculator-container')).toBeVisible();
  });
});
