// @ts-check
/**
 * Канонический suite для НОВЫХ заказов: реальный UI + расчёт доставки на GitHub Pages,
 * перехват POST /orders без записи в БД (stub response).
 */
const { test, expect } = require('@playwright/test');
const {
  ADDRESS_FIXTURES,
  TEST_COMMENT,
  testPhone,
  loginIfNeeded,
  waitForSelectOptions,
  selectFirstOption,
  calculateGreenhouse,
  fillAndSubmitOrderForm,
} = require('./helpers');

/** Перехват POST insert в orders: сохранить тело, вернуть stub (без реальной записи). */
async function interceptOrdersInsertNoWrite(page, capturedRef) {
  await page.route('**/rest/v1/orders*', async (route) => {
    const req = route.request();
    if (req.method() !== 'POST') {
      await route.continue();
      return;
    }
    const postData = req.postData();
    try {
      if (postData) {
        const parsed = JSON.parse(postData);
        capturedRef.payload = Array.isArray(parsed) ? parsed[0] : parsed;
      }
    } catch (_) {
      capturedRef.payload = null;
    }
    // PostgREST insert: 201 + representation
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      headers: { 'content-range': '0-0/*' },
      body: JSON.stringify([{ id: '00000000-0000-0000-0000-00000000e2e1', client_phone: capturedRef.payload?.client_phone || null }]),
    });
  });
}

async function openOrderFormWithDeliveryFixture(page, fixture) {
  // baseURL с path (GitHub Pages): goto('/') резолвится в origin root — использовать относительный './'
  await page.goto('./');
  await loginIfNeeded(page, process.env.TEST_LOGIN, process.env.TEST_PASSWORD);
  const fullAddress = [fixture.part1, fixture.part2, fixture.part3].filter(Boolean).join(', ');
  await waitForSelectOptions(page, 'city', 20000);
  await selectFirstOption(page, 'city');
  await page.locator('#address').fill(fullAddress);
  await page.locator('button:has-text("Рассчитать доставку")').click();
  await expect(page.locator('#result')).toContainText(/руб|Стоимость доставки/i, { timeout: 25000 });

  const card = page.locator('#order-card');
  const collapse = page.locator('#order-collapse');
  const open = await collapse.evaluate((el) => el.classList.contains('open'));
  if (!open) {
    await card.click();
    await page.waitForSelector('#order-collapse.open', { timeout: 5000 });
  }
  await page.waitForSelector('#order-delivery-date-display', { state: 'visible', timeout: 10000 });
  await page.locator('#order-address-part1').fill(fixture.part1);
  await page.locator('#order-address-part2').fill(fixture.part2);
  await page.locator('#order-address-part3').fill(fixture.part3);
}

test.describe('new-order-native-integrity (intercept POST, no DB write)', () => {
  test('A: single-item native — delivery, payload shape, price lock fields', async ({ page }) => {
    const captured = { payload: null };
    await interceptOrdersInsertNoWrite(page, captured);

    const fixture = ADDRESS_FIXTURES.mskNear;
    const phone = testPhone(String(Date.now() % 100));
    await openOrderFormWithDeliveryFixture(page, fixture);

    await calculateGreenhouse(page);
    await page.locator('#order-add-to-cart-btn').click();
    await page.waitForSelector('#order-cart-block', { state: 'visible', timeout: 10000 });

    await fillAndSubmitOrderForm(page, { phone, comment: TEST_COMMENT + ' native-single' });

    await expect(page.locator('#order-result')).toContainText(/готово|оформлен|ура/i, { timeout: 20000 });

    const p = captured.payload;
    expect(p, 'POST body captured').toBeTruthy();

    // Native single: нет массива line_items в теле (ключ не задаётся), есть v2-снимок
    expect(p.line_items == null || p.line_items === undefined, 'single native: line_items не должен быть JSON-массивом').toBeTruthy();

    expect(Array.isArray(p.line_items_v2) && p.line_items_v2.length > 0, 'line_items_v2 — непустой массив').toBeTruthy();
    const ghLines = p.line_items_v2.filter((L) => L && String(L.kind).toLowerCase() === 'greenhouse');
    expect(ghLines.length, 'ровно одна строка greenhouse в v2').toBe(1);
    expect(ghLines[0].line_total_locked != null && Number(ghLines[0].line_total_locked) > 0, 'greenhouse line_total_locked').toBeTruthy();

    expect(p.unit_price != null && !Number.isNaN(Number(p.unit_price)) && Number(p.unit_price) > 0, 'unit_price').toBeTruthy();
    expect(p.total != null && Number(p.total) > 0, 'total').toBeTruthy();
    expect(p.delivery_cost != null && Number(p.delivery_cost) >= 0, 'delivery_cost').toBeTruthy();
    expect(Number(p.delivery_cost) > 0, 'доставка должна быть > 0 после расчёта по fixture').toBeTruthy();

    expect(typeof p.price_snapshot_at === 'string' && p.price_snapshot_at.length > 10, 'price_snapshot_at ISO').toBeTruthy();
    expect(p.pricing_snapshot_version === '1.0', 'pricing_snapshot_version').toBeTruthy();

    expect(p.model && String(p.model).trim(), 'flat model (native не только legacy)').toBeTruthy();
  });

  test('B: multi-item — 3 одинаковые теплицы, только 2 с доп. форточкой (частичные допы, без схлопывания)', async ({ page }) => {
    const captured = { payload: null };
    await interceptOrdersInsertNoWrite(page, captured);

    const fixture = ADDRESS_FIXTURES.mskNear;
    const phone = testPhone(String((Date.now() + 1) % 100));
    await openOrderFormWithDeliveryFixture(page, fixture);

    // Полный calculateGreenhouse только один раз — иначе повторный вызов сбрасывает доп. товары (selectFirstOption по city/form/…).
    await calculateGreenhouse(page);
    const recalcBtn = page.locator('button:has-text("Рассчитать стоимость теплицы")');

    // 2 позиции с «Доп. форточка» ×1 (одинаковый lastCalculation — два клика «В заказ»)
    await page.locator('#additional-window-qty').selectOption('1');
    await recalcBtn.click();
    await page.waitForSelector('#order-add-to-cart-btn:not([disabled])', { timeout: 10000 });
    await page.locator('#order-add-to-cart-btn').click();
    await page.waitForSelector('#order-add-to-cart-btn:not([disabled])', { timeout: 10000 });
    await page.locator('#order-add-to-cart-btn').click();
    await page.waitForSelector('#order-add-to-cart-btn:not([disabled])', { timeout: 10000 });

    // 3-я — без форточки
    await page.locator('#additional-window-qty').selectOption('0');
    await recalcBtn.click();
    await page.locator('#order-add-to-cart-btn').click();
    await page.waitForSelector('#order-cart-block', { state: 'visible', timeout: 10000 });

    await fillAndSubmitOrderForm(page, { phone, comment: TEST_COMMENT + ' native-multi-partial-window' });

    await expect(page.locator('#order-result')).toContainText(/готово|оформлен|ура/i, { timeout: 20000 });

    const p = captured.payload;
    expect(p, 'POST body captured').toBeTruthy();

    expect(p.line_items, 'multi native: line_items JSON string').toBeTruthy();
    const items = typeof p.line_items === 'string' ? JSON.parse(p.line_items) : p.line_items;
    expect(Array.isArray(items) && items.length === 3, 'ровно 3 позиции в line_items').toBeTruthy();

    expect(p.total != null && Number(p.total) > 0, 'total').toBeTruthy();
    expect(p.delivery_cost != null && Number(p.delivery_cost) > 0, 'delivery_cost').toBeTruthy();

    // Источник истины по частичным допам — line_items_v2 (снимок); line_items.options на GH Pages может быть урезан в старой сборке
    expect(Array.isArray(p.line_items_v2) && p.line_items_v2.length > 0, 'line_items_v2 присутствует').toBeTruthy();
    const ghV2 = p.line_items_v2.filter((L) => L && String(L.kind).toLowerCase() === 'greenhouse');
    expect(ghV2.length, 'три теплицы в line_items_v2').toBe(3);
    const addonV2 = p.line_items_v2.filter((L) => L && String(L.kind).toLowerCase() === 'addon');
    if (addonV2.length >= 2) {
      const windowV2 = addonV2.filter(
        (L) =>
          /форточк/i.test(String(L.display_name || '')) ||
          /doors-windows-window/i.test(String(L.sku_or_code || '')) ||
          /additional-window/i.test(String(L.sku_or_code || ''))
      );
      expect(windowV2.length, 'при наличии addon в v2 — 2 строки доп. форточки').toBe(2);
    }

    // Частичный доп: 2 позиции с форточкой дороже третьей (≈1490 к позиции без)
    const totals = items.map((r) => Number(r.item_total)).filter((n) => !Number.isNaN(n));
    expect(totals.length, 'item_total по строкам').toBe(3);
    const sorted = [...totals].sort((a, b) => a - b);
    expect(sorted[2] - sorted[0], 'разброс item_total: две позиции с допом дороже одной без').toBeGreaterThan(1000);

    const payloadStr = JSON.stringify(p);
    const n1490 = (payloadStr.match(/1490/g) || []).length;
    expect(n1490 >= 2, 'в payload не менее 2 вхождений цены 1490 (доп. форточка)').toBeTruthy();

    expect(typeof p.price_snapshot_at === 'string', 'price_snapshot_at').toBeTruthy();
    expect(p.pricing_snapshot_version === '1.0', 'pricing_snapshot_version').toBeTruthy();
  });

  test('C: multi-item — 3 одинаковые теплицы, 2 с капельным поливом авт., 1 без (частичные допы)', async ({ page }) => {
    const captured = { payload: null };
    await interceptOrdersInsertNoWrite(page, captured);

    const fixture = ADDRESS_FIXTURES.mskNear;
    const phone = testPhone(String((Date.now() + 2) % 100));
    await openOrderFormWithDeliveryFixture(page, fixture);

    await calculateGreenhouse(page);
    const recalcBtn = page.locator('button:has-text("Рассчитать стоимость теплицы")');

    // 2 позиции с «Капельный полив авт.» ×1 — без повторного calculateGreenhouse (сброс допов)
    await page.locator('#drip-irrigation-auto-qty').selectOption('1');
    await recalcBtn.click();
    await page.waitForSelector('#order-add-to-cart-btn:not([disabled])', { timeout: 10000 });
    await page.locator('#order-add-to-cart-btn').click();
    await page.waitForSelector('#order-add-to-cart-btn:not([disabled])', { timeout: 10000 });
    await page.locator('#order-add-to-cart-btn').click();
    await page.waitForSelector('#order-add-to-cart-btn:not([disabled])', { timeout: 10000 });

    await page.locator('#drip-irrigation-auto-qty').selectOption('0');
    await recalcBtn.click();
    await page.waitForSelector('#order-add-to-cart-btn:not([disabled])', { timeout: 10000 });
    await page.locator('#order-add-to-cart-btn').click();
    await page.waitForSelector('#order-cart-block', { state: 'visible', timeout: 10000 });

    await fillAndSubmitOrderForm(page, { phone, comment: TEST_COMMENT + ' native-multi-partial-drip-auto' });

    await expect(page.locator('#order-result')).toContainText(/готово|оформлен|ура/i, { timeout: 20000 });

    const p = captured.payload;
    expect(p, 'POST body captured').toBeTruthy();
    expect(p.line_items, 'multi native: line_items').toBeTruthy();
    const items = typeof p.line_items === 'string' ? JSON.parse(p.line_items) : p.line_items;
    expect(Array.isArray(items) && items.length === 3, 'ровно 3 позиции').toBeTruthy();

    expect(Array.isArray(p.line_items_v2) && p.line_items_v2.length > 0, 'line_items_v2').toBeTruthy();
    const ghV2 = p.line_items_v2.filter((L) => L && String(L.kind).toLowerCase() === 'greenhouse');
    expect(ghV2.length, 'три теплицы в line_items_v2').toBe(3);

    const addonV2 = p.line_items_v2.filter((L) => L && String(L.kind).toLowerCase() === 'addon');
    if (addonV2.length >= 2) {
      const dripAutoV2 = addonV2.filter(
        (L) =>
          (/капельн/i.test(String(L.display_name || '')) && /авт|автоматическ/i.test(String(L.display_name || ''))) ||
          /drip-irrigation-auto/i.test(String(L.sku_or_code || ''))
      );
      expect(dripAutoV2.length, 'при addon в v2 — 2 строки капельного полива авт.').toBe(2);
    }

    const totals = items.map((r) => Number(r.item_total)).filter((n) => !Number.isNaN(n));
    expect(totals.length, 'item_total по строкам').toBe(3);
    const sorted = [...totals].sort((a, b) => a - b);
    expect(sorted[2] - sorted[0], 'две позиции с автополивом дороже одной без').toBeGreaterThan(3500);

    const payloadStr = JSON.stringify(p);
    const n4490 = (payloadStr.match(/4490/g) || []).length;
    expect(n4490 >= 2, 'в payload ≥2 вхождений 4490 (цена капельного полива авт.)').toBeTruthy();

    expect(typeof p.price_snapshot_at === 'string', 'price_snapshot_at').toBeTruthy();
    expect(p.pricing_snapshot_version === '1.0', 'pricing_snapshot_version').toBeTruthy();
  });
});
