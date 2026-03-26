// @ts-check
/**
 * Native vs legacy: UI gates + legacy PATCH = delivery_date only (GET замокан, PATCH перехвачен).
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const { waitForEditOrderReady, openEditOrderById } = require('./helpers');

const NATIVE_ID = 'e2e1a1a1-1a1a-4a1a-8a1a-1a1a1a1a1a1a';
const LEGACY_ID = 'e2e2b2b2-2b2b-4b2b-8b2b-2b2b2b2b2b2b';

function baseOrder(id, phone) {
  return {
    id,
    deleted_at: null,
    status: 'new',
    created_at: '2026-03-20T12:00:00Z',
    client_phone: phone,
    client_name: 'E2E Gate',
    delivery_date: '25.03.2026',
    delivery_address: 'Московская обл., г. Подольск, ул. Ленина, д. 1',
    city: 'Москва',
    warehouse_city_key: 'Москва',
    commercial_offer: 'test',
    comment: '',
    source: 'Строй Мир',
    manager: 'Юлия',
    gift: '',
    extras: '',
    assembly: '',
    polycarbonate: 'Без поликарбоната',
    arc_step: '1',
    unit_price: 13990,
    quantity: 1,
    model: 'ТЕПЛИЦА БОЯРСКАЯ 2.5М',
    width: '2.5',
    length: '4',
    frame: '20х20',
    delivery_cost: 1300,
    total: 15290,
  };
}

function mockNative() {
  var o = baseOrder(NATIVE_ID, '79000000001');
  o.line_items = null;
  o.line_items_v2 = [
    {
      line_id: 'greenhouse-1',
      kind: 'greenhouse',
      display_name: 'Т 2.5x4',
      quantity: 1,
      unit_price_locked: 13990,
      line_total_locked: 13990,
      pricing_source: 'catalog',
      parent_line_id: null,
      config: { model: o.model, width: 2.5, length: 4, frame: o.frame, polycarbonate: o.polycarbonate, form: 'Арочная' },
      meta: null,
    },
    {
      line_id: 'delivery-2',
      kind: 'delivery',
      display_name: 'Доставка',
      quantity: 1,
      unit_price_locked: 1300,
      line_total_locked: 1300,
      pricing_source: 'calculated',
      parent_line_id: null,
      config: null,
      meta: null,
    },
  ];
  return o;
}

function mockLegacy() {
  var o = baseOrder(LEGACY_ID, '79000000002');
  o.line_items = null;
  o.line_items_v2 = null;
  o.delivery_cost = 500;
  o.total = 5000;
  return o;
}

/** @param {import('@playwright/test').Page} page */
async function routeOrdersMocks(page) {
  await page.route('**/rest/v1/orders*', async (route) => {
    const req = route.request();
    const u = req.url();
    if (req.method() === 'PATCH') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      return;
    }
    if (req.method() !== 'GET') {
      await route.continue();
      return;
    }
    function fulfillFor(id, row) {
      if (!u.includes(id)) return false;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'content-range': '0-0/*' },
        body: JSON.stringify([row]),
      });
      return true;
    }
    if (fulfillFor(NATIVE_ID, mockNative())) return;
    if (fulfillFor(LEGACY_ID, mockLegacy())) return;
    await route.continue();
  });
}

test.describe('native-legacy-edit-gates', () => {
  test.use({ storageState: path.join(__dirname, '.auth/user.json') });

  test('native (line_items_v2): баннер скрыт, поля не disabled, полный состав доступен', async ({ page }) => {
    await routeOrdersMocks(page);
    await page.goto('./');
    await waitForEditOrderReady(page);
    await openEditOrderById(page, NATIVE_ID);

    await expect(page.locator('#edit-order-legacy-date-only-notice')).toBeHidden();
    await expect(page.locator('#edit-order-client-name')).not.toBeDisabled();
    await expect(page.locator('#edit-order-add-item-btn')).not.toBeDisabled();
  });

  test('legacy (нет line_items_v2): баннер виден, имя disabled, нет кнопок Изменить/Удалить у позиций', async ({ page }) => {
    await routeOrdersMocks(page);
    await page.goto('./');
    await waitForEditOrderReady(page);
    await openEditOrderById(page, LEGACY_ID);

    await expect(page.locator('#edit-order-legacy-date-only-notice')).toBeVisible();
    await expect(page.locator('#edit-order-client-name')).toBeDisabled();
    await expect(page.locator('#edit-order-add-item-btn')).toBeDisabled();
    await expect(page.locator('.edit-order-composition-item__btn--edit')).toHaveCount(0);
    await expect(page.locator('.edit-order-composition-item__btn--del')).toHaveCount(0);
  });

  test('legacy: «Сохранить изменения» шлёт PATCH только с delivery_date', async ({ page }) => {
    /** @type {Array<Record<string, unknown>|null>} */
    const captured = [];
    // Один route, тот же glob что в native-order-v2-merge (`**/rest/v1/orders*`); capture только в handler, без waitForRequest.
    await page.route('**/rest/v1/orders*', async (route) => {
      const req = route.request();
      const u = req.url();
      if (req.method() === 'PATCH' && u.includes('/rest/v1/orders')) {
        let payload = null;
        try {
          const pd = req.postData();
          if (pd) payload = JSON.parse(pd);
        } catch (_) {}
        captured.push(payload);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [{}], error: null }),
        });
        return;
      }
      if (req.method() !== 'GET') {
        await route.continue();
        return;
      }
      if (u.includes(LEGACY_ID)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'content-range': '0-0/*' },
          body: JSON.stringify([mockLegacy()]),
        });
        return;
      }
      await route.continue();
    });

    await page.goto('./');
    await waitForEditOrderReady(page);
    await openEditOrderById(page, LEGACY_ID);

    await page.locator('#edit-order-save-btn').click();
    await expect.poll(() => captured.length, { timeout: 20000 }).toBeGreaterThan(0);

    const body = captured[0];
    expect(body, 'PATCH JSON body').toBeTruthy();
    const keys = Object.keys(/** @type {Record<string, unknown>} */ (body)).sort();
    expect(keys, 'legacy save: только delivery_date в теле PATCH').toEqual(['delivery_date']);
    expect(String(/** @type {Record<string, unknown>} */ (body).delivery_date || '').length).toBeGreaterThan(0);
  });
});
