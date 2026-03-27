// @ts-check
/**
 * Canonical suite: existing-order edit, delivery date only.
 * No add-item panel, no #edit-order-save-position-btn. PATCH intercepted — no live DB write.
 * Test data from e2e (not invented):
 * - KNOWN_PHONES: edit-order-delivery-probe.spec.js
 * - d4a0d4f1…: fallback-verify-id-only.spec.js (VERIFY_SINGLE_ID / hosted green id-only)
 * - ced4fafd…, 1efaa9ef…: edit-order-delivery-probe.spec.js (KNOWN_ORDER_ID, AUDITED_ORDER_ID)
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const {
  appRootUrl,
  loginIfNeeded,
  waitForEditOrderReady,
  openEditOrderByPhoneAndGetOrderId,
  openEditOrderById,
  getEditOrderSnapshot,
  changeEditOrderDeliveryDate,
} = require('./helpers');

/** Same list as edit-order-delivery-probe.spec.js */
const KNOWN_PHONES = ['79633031245', '70000000019', '79000000018'];

const FIXTURE_ORDER_IDS = [
  process.env.TEST_ORDER_ID,
  'd4a0d4f1-9c64-4a2d-8f93-2d6be9004cda',
  'ced4fafd-1602-4aae-874d-70f0f97150e3',
  '1efaa9ef-e65e-4017-b5b2-6aae72346d82',
].filter(Boolean);

async function openOrderByFixtureIdFirst(page) {
  for (const orderId of FIXTURE_ORDER_IDS) {
    try {
      await page.goto(appRootUrl(), { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
      await loginIfNeeded(page, process.env.TEST_LOGIN, process.env.TEST_PASSWORD);
      await waitForEditOrderReady(page);
      await openEditOrderById(page, orderId);
      await page.locator('.edit-order-composition-item').first().waitFor({ state: 'visible', timeout: 8000 });
      return orderId;
    } catch (_) {}
  }
  for (const phone of KNOWN_PHONES) {
    try {
      await page.goto(appRootUrl(), { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
      await loginIfNeeded(page, process.env.TEST_LOGIN, process.env.TEST_PASSWORD);
      await waitForEditOrderReady(page);
      const orderId = await openEditOrderByPhoneAndGetOrderId(page, phone);
      return orderId;
    } catch (_) {}
  }
  throw new Error('Could not open any order. Set TEST_ORDER_ID or ensure fixture orders exist on staging.');
}

/** @returns {{ orderId: string, phone: string }} */
async function openOrderByPhoneOnly(page) {
  for (const phone of KNOWN_PHONES) {
    try {
      await page.goto(appRootUrl(), { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
      await loginIfNeeded(page, process.env.TEST_LOGIN, process.env.TEST_PASSWORD);
      await waitForEditOrderReady(page);
      const orderId = await openEditOrderByPhoneAndGetOrderId(page, phone);
      return { orderId, phone };
    } catch (_) {}
  }
  throw new Error('Could not open any known order from ' + KNOWN_PHONES.join(', '));
}

function isOrdersPatch(req) {
  return req.method() === 'PATCH' && req.url().includes('/rest/v1/orders');
}

async function setupPatchIntercept(page, captured) {
  await page.route('**/rest/v1/orders*', async (route) => {
    const req = route.request();
    if (!isOrdersPatch(req)) return route.continue();
    let payload = null;
    try {
      const postData = req.postData();
      if (postData) payload = JSON.parse(postData);
    } catch (_) {}
    const orderId = req.url().match(/[?&]id=eq\.([a-f0-9-]+)/i)?.[1] || null;
    captured.push({ order_id: orderId, payload: payload || null });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [{}], error: null }),
    });
  });
}

function parseLineItemsLength(pl) {
  if (pl.line_items == null) return null;
  try {
    const raw = typeof pl.line_items === 'string' ? JSON.parse(pl.line_items) : pl.line_items;
    return Array.isArray(raw) ? raw.length : null;
  } catch (_) {
    return null;
  }
}


function parseUiTotalDigits(s) {
  if (!s || typeof s !== 'string') return null;
  const digits = String(s).replace(/[\s\u00A0]/g, '').replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : null;
}

async function extrasFingerprint(page) {
  try {
    const el = page.locator('.edit-order-composition-item__extras').first();
    if (await el.isVisible()) return ((await el.textContent()) || '').trim().slice(0, 300);
  } catch (_) {}
  return null;
}

async function assertAddPanelClosed(page) {
  await expect(page.locator('#edit-order-add-item-panel')).toBeHidden();
}

test.describe('existing-order-date-only', () => {
  test.use({ storageState: path.join(__dirname, '.auth/user.json') });

  test('PATCH: fixture or deep-link order — only delivery_date changes, composition stable', async ({ page }) => {
    const captured = [];
    await setupPatchIntercept(page, captured);
    const orderId = await openOrderByFixtureIdFirst(page);
    console.log('[existing-order-date-only] opened orderId (fixture path)=', orderId);

    await assertAddPanelClosed(page);

    const before = await getEditOrderSnapshot(page);
    const extrasBefore = await extrasFingerprint(page);
    expect(before.delivery_date_display).toBeTruthy();
    expect(before.line_items_count != null && before.line_items_count > 0).toBeTruthy();

    await changeEditOrderDeliveryDate(page, 1);
    const afterPick = await getEditOrderSnapshot(page);
    expect(afterPick.delivery_date_display).toBeTruthy();
    expect(afterPick.delivery_date_display).not.toBe(before.delivery_date_display);

    await assertAddPanelClosed(page);
    expect(afterPick.total_display).toBe(before.total_display);
    expect(afterPick.gift_display).toBe(before.gift_display);
    expect(afterPick.line_items_count).toBe(before.line_items_count);

    await page.locator('#edit-order-save-btn').click();
    await page.locator('#edit-order-form-hint').filter({ hasText: /изменены|Данные/ }).waitFor({ state: 'visible', timeout: 15000 });

    expect(captured.length).toBeGreaterThan(0);
    const pl = captured[captured.length - 1].payload;
    expect(pl).toBeTruthy();
    expect(pl.delivery_date).toBeTruthy();
    expect(String(pl.delivery_date)).not.toBe(String(before.delivery_date_display));

    const liLen = parseLineItemsLength(pl);
    expect(liLen).toBe(before.line_items_count);

    expect(pl.total != null).toBeTruthy();
    const payloadTotalDigits = parseUiTotalDigits(String(pl.total));
    const uiTotalDigits = parseUiTotalDigits(before.total_display || '');
    if (uiTotalDigits != null && payloadTotalDigits != null) {
      expect(Math.abs(payloadTotalDigits - uiTotalDigits)).toBeLessThanOrEqual(1);
    }

    if (before.gift_display != null && pl.gift !== undefined) {
      expect(String(pl.gift)).toBe(before.gift_display);
    }

    if (pl.extras != null && extrasBefore) {
      const ex = typeof pl.extras === 'string' ? pl.extras : JSON.stringify(pl.extras);
      expect(ex.length).toBeGreaterThan(0);
    }

    if (before.address_part1 && pl.delivery_address != null) {
      expect(String(pl.delivery_address).slice(0, 30)).toContain(before.address_part1.slice(0, 20));
    }
  });

  test('PATCH: phone-search order — only delivery_date changes, composition stable', async ({ page }) => {
    const captured = [];
    await setupPatchIntercept(page, captured);
    const { orderId, phone } = await openOrderByPhoneOnly(page);
    console.log('[existing-order-date-only] opened orderId (phone path)=', orderId, 'phone=', phone);

    await assertAddPanelClosed(page);

    const before = await getEditOrderSnapshot(page);
    const extrasBefore = await extrasFingerprint(page);
    expect(before.delivery_date_display).toBeTruthy();

    await changeEditOrderDeliveryDate(page, 1);
    const afterPick = await getEditOrderSnapshot(page);
    expect(afterPick.delivery_date_display).not.toBe(before.delivery_date_display);

    await assertAddPanelClosed(page);

    await page.locator('#edit-order-save-btn').click();
    await page.locator('#edit-order-form-hint').filter({ hasText: /изменены|Данные/ }).waitFor({ state: 'visible', timeout: 15000 });

    expect(captured.length).toBeGreaterThan(0);
    const pl = captured[captured.length - 1].payload;
    expect(pl.delivery_date).toBeTruthy();

    const liLen = parseLineItemsLength(pl);
    expect(liLen).toBe(before.line_items_count);

    expect(pl.total != null).toBeTruthy();
    const payloadTotalDigits = parseUiTotalDigits(String(pl.total));
    const uiTotalDigits = parseUiTotalDigits(before.total_display || '');
    if (uiTotalDigits != null && payloadTotalDigits != null) {
      expect(Math.abs(payloadTotalDigits - uiTotalDigits)).toBeLessThanOrEqual(1);
    }

    if (before.gift_display != null && pl.gift !== undefined) {
      expect(String(pl.gift)).toBe(before.gift_display);
    }

    if (pl.extras != null && extrasBefore) {
      const ex = typeof pl.extras === 'string' ? pl.extras : JSON.stringify(pl.extras);
      expect(ex.length).toBeGreaterThan(0);
    }
  });
});
