// @ts-check
/**
 * LIVE staging: legacy active order date-only edit (real PATCH, no intercept).
 * BASE_URL=https://gerol4lfun.github.io/greenhouse-calculator-test/
 *
 * Default order from legacy active smoke docs:
 * - orderId: 121033f7-72f3-48b3-a833-d52444f5424e
 * - phone:   79276687505
 */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const {
  appUrlWithQuery,
  getEditOrderSnapshot,
  changeEditOrderDeliveryDate,
  loginIfNeeded,
  waitForEditOrderReady,
} = require('./helpers');

function parseRubDigits(text) {
  if (!text || typeof text !== 'string') return null;
  const d = text.replace(/[\s\u00A0]/g, '').replace(/[^\d]/g, '');
  return d ? parseInt(d, 10) : null;
}

async function readEditModalMoney(page) {
  const totalEl = page.locator('#edit-order-composition-total');
  const delEl = page.locator('.edit-order-composition-item:has-text("Доставка") .edit-order-composition-item__price');
  const rawTotal = ((await totalEl.textContent()) || '').trim();
  const rawDelivery = ((await delEl.textContent().catch(() => '')) || '').trim();
  return {
    total: parseRubDigits(rawTotal),
    delivery: parseRubDigits(rawDelivery),
    rawTotal,
    rawDelivery,
  };
}

async function openEditOrderByIdLive(page, orderId) {
  var login = process.env.TEST_LOGIN || 'admin';
  var password = process.env.TEST_PASSWORD || '';
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await loginIfNeeded(page, login, password);
  await waitForEditOrderReady(page, 30_000);

  const url = appUrlWithQuery('id=' + encodeURIComponent(orderId));
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const auth = page.locator('#auth-container');
  if (await auth.isVisible().catch(() => false)) {
    await page.evaluate(
      ({ login, password }) => {
        var l = document.getElementById('login');
        var p = document.getElementById('password');
        if (l) l.value = login;
        if (p) p.value = password;
        if (typeof window.authenticate === 'function') {
          window.authenticate();
          return;
        }
        var btn = document.querySelector('#auth-container button');
        if (btn) btn.click();
      },
      { login: login, password: password }
    );
    await page.waitForSelector('#auth-container', { state: 'hidden', timeout: 30_000 }).catch(() => {});
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  }
  await page.locator('#edit-order-modal-body[data-step="2"]').waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('.edit-order-composition-item').first().waitFor({ state: 'visible', timeout: 20_000 });
}

test.use({ storageState: path.join(__dirname, '.auth/user.json') });

test('staging legacy: existing order date-only edit keeps delivery/total', async ({ page }) => {
  test.setTimeout(240_000);
  const base = process.env.BASE_URL || '';
  if (!base.includes('gerol4lfun.github.io/greenhouse-calculator-test')) {
    test.skip(true, 'BASE_URL must be https://gerol4lfun.github.io/greenhouse-calculator-test/');
  }

  const orderCandidates = (process.env.STAGING_LEGACY_ORDER_IDS ||
    '121033f7-72f3-48b3-a833-d52444f5424e,e939569d-083e-4bcd-b368-04917729632e')
    .split(',')
    .map((s) => String(s || '').trim())
    .filter(Boolean);
  const facts = {
    baseUrl: base,
    ranAt: new Date().toISOString(),
    scenario: 'legacy-date-only-live',
    order: { candidates: orderCandidates, selectedOrderId: null },
    attempts: [],
  };

  let orderId = null;
  let before = null;
  let beforeMoney = null;
  let afterPick = null;
  for (const candidate of orderCandidates) {
    try {
      await openEditOrderByIdLive(page, candidate);
      const candBefore = await getEditOrderSnapshot(page);
      const candBeforeMoney = await readEditModalMoney(page);
      expect(candBefore.delivery_date_display).toBeTruthy();
      expect(candBefore.line_items_count).toBeGreaterThan(0);

      await changeEditOrderDeliveryDate(page, 1);
      const candAfterPick = await getEditOrderSnapshot(page);
      const changed = !!candAfterPick.delivery_date_display && candAfterPick.delivery_date_display !== candBefore.delivery_date_display;
      facts.attempts.push({
        orderId: candidate,
        beforeDate: candBefore.delivery_date_display,
        afterPickDate: candAfterPick.delivery_date_display,
        changed: changed,
      });
      if (changed) {
        orderId = candidate;
        before = candBefore;
        beforeMoney = candBeforeMoney;
        afterPick = candAfterPick;
        facts.order.selectedOrderId = candidate;
        break;
      }
    } catch (e) {
      facts.attempts.push({
        orderId: candidate,
        openFailed: true,
        error: e && e.message ? String(e.message).slice(0, 300) : String(e),
      });
      continue;
    }
  }
  if (!orderId || !before || !beforeMoney || !afterPick) {
    test.skip(true, 'Legacy date-only: no alternate available date found on candidate orders.');
  }
  facts.before = before;
  facts.beforeMoney = beforeMoney;
  facts.afterPick = afterPick;

  const patchPromise = page.waitForResponse(
    (r) => r.request().method() === 'PATCH' && r.url().includes('/rest/v1/orders') && r.url().includes(orderId),
    { timeout: 60_000 }
  );

  await page.locator('#edit-order-save-btn').click();
  const patchRes = await patchPromise;
  const hint = page.locator('#edit-order-form-hint');
  await hint.filter({ hasText: /изменены|Данные/i }).waitFor({ state: 'visible', timeout: 25_000 });

  let patchPayload = null;
  try {
    const raw = patchRes.request().postData();
    patchPayload = raw ? JSON.parse(raw) : null;
  } catch (_) {}
  facts.patch = {
    status: patchRes.status(),
    keys: patchPayload ? Object.keys(patchPayload).sort() : [],
    payload: patchPayload,
  };

  await openEditOrderByIdLive(page, orderId);
  const afterSaved = await getEditOrderSnapshot(page);
  const afterMoney = await readEditModalMoney(page);
  facts.afterSaved = afterSaved;
  facts.afterMoney = afterMoney;

  const outPath = path.join(__dirname, '.last-staging-legacy-date-only-live.json');
  fs.writeFileSync(outPath, JSON.stringify(facts, null, 2), 'utf8');
  test.info().attach('facts', { body: JSON.stringify(facts, null, 2), contentType: 'application/json' });

  expect(patchRes.status()).toBeGreaterThanOrEqual(200);
  expect(patchRes.status()).toBeLessThan(300);
  expect(afterSaved.delivery_date_display).toBe(afterPick.delivery_date_display);
  expect(afterMoney.delivery).toBe(beforeMoney.delivery);
  expect(afterMoney.total).toBe(beforeMoney.total);
});
