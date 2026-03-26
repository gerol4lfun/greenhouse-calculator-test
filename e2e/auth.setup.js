// @ts-check
/**
 * Auth setup: логин и сохранение storageState для тестов с авторизацией.
 * Запускается через globalSetup или как зависимый project.
 * Требует: TEST_LOGIN, TEST_PASSWORD в .env
 */
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const STORAGE_STATE_PATH = path.join(__dirname, '.auth', 'user.json');

async function globalSetup() {
  const login = process.env.TEST_LOGIN;
  const password = process.env.TEST_PASSWORD;
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';

  if (!login || !password) {
    console.warn('AUTH SETUP: TEST_LOGIN/TEST_PASSWORD не заданы. Создаём пустой storageState.');
    const dir = path.dirname(STORAGE_STATE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORAGE_STATE_PATH, JSON.stringify({ cookies: [], origins: [] }), 'utf8');
    return;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(60_000);

  try {
    // GitHub Pages: не ждать 'load' (долго/висит на ресурсах), достаточно domcontentloaded.
    // Абсолютный baseURL — не page.goto('/') и не './' (у path-based Pages иначе может уйти на origin root).
    console.log('AUTH SETUP baseURL =', baseURL);
    await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    console.log('AUTH SETUP page.url after goto =', page.url());

    const calculator = page.locator('#calculator-container');
    const auth = page.locator('#auth-container');

    const firstShown = await Promise.race([
      calculator.waitFor({ state: 'visible', timeout: 15_000 }).then(() => 'calculator'),
      auth.waitFor({ state: 'visible', timeout: 15_000 }).then(() => 'auth'),
    ]);

    if (firstShown === 'calculator') {
      console.log('AUTH SETUP: Уже авторизован (#calculator-container виден).');
    } else {
      await page.locator('#login').fill(login);
      await page.locator('#password').fill(password);
      await page.locator('button:has-text("Войти")').click();
      await calculator.waitFor({ state: 'visible', timeout: 15_000 });
    }

    await context.storageState({ path: STORAGE_STATE_PATH });
    console.log('AUTH SETUP: storageState сохранён в', STORAGE_STATE_PATH);
  } catch (e) {
    const msg = e && typeof e === 'object' && 'message' in e ? /** @type {Error} */ (e).message : String(e);
    console.error('AUTH SETUP: Ошибка при загрузке страницы или логине:', msg);
    try {
      const shotDir = path.join(__dirname, 'test-results');
      if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive: true });
      const shotPath = path.join(shotDir, 'auth-setup-fail.png');
      await page.screenshot({ path: shotPath, fullPage: true });
      console.error('AUTH SETUP: screenshot сохранён:', shotPath);
    } catch (shotErr) {
      console.error('AUTH SETUP: не удалось сделать screenshot:', shotErr && shotErr.message ? shotErr.message : shotErr);
    }
    throw e;
  } finally {
    await browser.close();
  }
}

module.exports = globalSetup;
