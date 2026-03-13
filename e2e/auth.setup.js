// @ts-check
/**
 * Auth setup: логин и сохранение storageState для тестов с авторизацией.
 * Запускается через globalSetup или как зависимый project.
 * Требует: TEST_LOGIN, TEST_PASSWORD в .env
 */
const { chromium } = require('@playwright/test');
const path = require('path');

const STORAGE_STATE_PATH = path.join(__dirname, '.auth', 'user.json');

async function globalSetup() {
  const login = process.env.TEST_LOGIN;
  const password = process.env.TEST_PASSWORD;
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';

  if (!login || !password) {
    console.warn('AUTH SETUP: TEST_LOGIN/TEST_PASSWORD не заданы. Создаём пустой storageState.');
    const fs = require('fs');
    const dir = path.dirname(STORAGE_STATE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORAGE_STATE_PATH, JSON.stringify({ cookies: [], origins: [] }), 'utf8');
    return;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  try {
    await page.goto('/');
    const authVisible = await page.locator('#auth-container').isVisible();
    if (!authVisible) {
      console.log('AUTH SETUP: Уже авторизован (auth-container скрыт).');
    } else {
      await page.locator('#login').fill(login);
      await page.locator('#password').fill(password);
      await page.locator('button:has-text("Войти")').click();
      await page.waitForSelector('#calculator-container', { state: 'visible', timeout: 15000 });
    }
    await context.storageState({ path: STORAGE_STATE_PATH });
    console.log('AUTH SETUP: storageState сохранён в', STORAGE_STATE_PATH);
  } catch (e) {
    console.error('AUTH SETUP: Ошибка:', e?.message || e);
    throw e;
  } finally {
    await browser.close();
  }
}

module.exports = globalSetup;
