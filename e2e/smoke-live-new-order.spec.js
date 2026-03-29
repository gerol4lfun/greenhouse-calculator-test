// @ts-check
/**
 * Один живой заказ: реальный POST /orders, без route intercept.
 * По умолчанию отключён (test.skip): не пишет в боевую БД. Проект smoke-live-new-order убран из playwright.config.
 */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const {
  ADDRESS_FIXTURES,
  testPhone,
  loginIfNeeded,
  waitForSelectOptions,
  selectFirstOption,
  calculateGreenhouse,
} = require('./helpers');

test.describe.configure({ mode: 'serial' });

test('smoke: live single-item new order (real POST, no intercept)', async ({ page }) => {
  test.skip(process.env.LIVE_SMOKE_ALLOWED !== '1', 'Kill switch: LIVE_SMOKE_ALLOWED=1 required for live POST /rest/v1/orders (Smoke Live)');
  test.setTimeout(120_000);
  const marker = `SMOKE_LIVE_NEW_ORDER_2026_03_25_${Date.now()}`;
  const phone = (process.env.LIVE_TEST_PHONE || '').trim() || testPhone(String(Date.now() % 100));

  await page.goto('./');
  await loginIfNeeded(page, process.env.TEST_LOGIN, process.env.TEST_PASSWORD);

  const fixture = ADDRESS_FIXTURES.mskNear;
  const fullAddress = [fixture.part1, fixture.part2, fixture.part3].filter(Boolean).join(', ');
  await waitForSelectOptions(page, 'city', 20000);
  await selectFirstOption(page, 'city');
  await page.locator('#address').fill(fullAddress);
  await page.locator('button:has-text("Рассчитать доставку")').click();
  await expect(page.locator('#result')).toContainText(/руб|Стоимость доставки/i, { timeout: 25000 });

  const card = page.locator('#order-card');
  const collapse = page.locator('#order-collapse');
  if (!(await collapse.evaluate((el) => el.classList.contains('open')))) {
    await card.click();
    await page.waitForSelector('#order-collapse.open', { timeout: 5000 });
  }
  await page.waitForSelector('#order-delivery-date-display', { state: 'visible', timeout: 10000 });

  await calculateGreenhouse(page);
  await page.locator('#order-add-to-cart-btn').click();
  await page.waitForSelector('#order-cart-block', { state: 'visible', timeout: 10000 });

  const addr = fixture;
  await page.locator('#order-client-name').fill('Smoke Live');
  await page.locator('#order-client-phone').fill(phone);
  await page.locator('#order-source').selectOption({ index: 1 });
  await page.locator('#order-manager').selectOption({ index: 1 });
  await page.locator('#order-address-part1').fill(addr.part1);
  await page.locator('#order-address-part2').fill(addr.part2);
  await page.locator('#order-address-part3').fill(addr.part3);
  await page.locator('#order-comment').fill(marker);
  await page.locator('#order-delivery-date-display').click();
  const dayBtn = page.locator('#order-calendar .order-cal-day.available').first();
  await dayBtn.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
  if (await dayBtn.isVisible()) await dayBtn.click();

  const postPromise = page.waitForResponse(
    (r) => r.request().method() === 'POST' && r.url().includes('/rest/v1/orders'),
    { timeout: 60_000 }
  );
  await page.locator('#order-submit-btn').click();
  const insertRes = await postPromise;
  let requestPayload = null;
  try {
    const pd = insertRes.request().postData();
    if (pd) requestPayload = JSON.parse(pd);
  } catch (_) {}
  const ordersPost = {
    status: insertRes.status(),
    url: insertRes.url(),
    responseBody: await insertRes.text(),
  };

  // Реальный POST может идти дольше ответа UI → ждём успех явно
  await expect(page.locator('#order-result')).toContainText(/готово|оформлен|ура/i, { timeout: 60_000 });

  expect(ordersPost.status, 'POST /orders status').toBeGreaterThanOrEqual(200);
  expect(ordersPost.status, 'POST /orders success').toBeLessThan(300);

  /** PostgREST может вернуть тело как [{...}], пустую строку (return=minimal), либо обёртку — разбираем всё. */
  function parseInsertedRow(body) {
    if (!body || !String(body).trim()) return null;
    try {
      const j = JSON.parse(body);
      if (Array.isArray(j) && j[0] && j[0].id) return j[0];
      if (j && j.data !== undefined) {
        var d = j.data;
        if (Array.isArray(d) && d[0] && d[0].id) return d[0];
        if (d && d.id) return d;
      }
      if (j && j.id) return j;
    } catch (_) {}
    return null;
  }
  const inserted = parseInsertedRow(ordersPost.responseBody);

  const row = await page.evaluate(async (ph) => {
    const c = typeof window !== 'undefined' ? window.supabaseClient : null;
    if (!c) return { data: null, error: null };
    const { data, error } = await c
      .from('orders')
      .select(
        'id,created_at,comment,total,delivery_cost,delivery_date,line_items,line_items_v2,price_snapshot_at,pricing_snapshot_version'
      )
      .eq('client_phone', ph)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return { data, error: error ? error.message : null };
  }, phone);

  if (!inserted || !inserted.id) {
    test.info().attach('note', {
      body: 'POST 2xx + UI success, но тело ответа без id (часто return=minimal). Проверьте заказ в Supabase по телефону/комментарию.',
      contentType: 'text/plain',
    });
  }

  test.info().attach('orders-post-meta', {
    body: JSON.stringify(
      {
        status: ordersPost.status,
        url: ordersPost.url,
        responseBody: (ordersPost.responseBody || '').slice(0, 4000),
        parsedInsert: inserted || null,
      },
      null,
      2
    ),
    contentType: 'application/json',
  });
  if (row.data) {
    test.info().attach('order-row-supabase', { body: JSON.stringify(row.data, null, 2), contentType: 'application/json' });
  }

  const payloadForShape =
    requestPayload && Array.isArray(requestPayload) && requestPayload[0] ? requestPayload[0] : requestPayload;
  const payloadShape = payloadForShape && typeof payloadForShape === 'object'
    ? {
        has_line_items: Object.prototype.hasOwnProperty.call(payloadForShape, 'line_items'),
        has_line_items_v2: Object.prototype.hasOwnProperty.call(payloadForShape, 'line_items_v2'),
        has_price_snapshot_at: Object.prototype.hasOwnProperty.call(payloadForShape, 'price_snapshot_at'),
        has_pricing_snapshot_version: Object.prototype.hasOwnProperty.call(payloadForShape, 'pricing_snapshot_version'),
      }
    : null;

  fs.writeFileSync(
    path.join(__dirname, '.last-smoke-live-order.json'),
    JSON.stringify(
      {
        pageUrl: page.url(),
        baseUrlEnv: process.env.BASE_URL || null,
        marker,
        phone,
        fullAddress,
        fixtureId: fixture.id,
        ordersPost,
        requestPayload,
        parsedInsert: inserted || null,
        supabaseRow: row.data || null,
        supabaseError: row.error || null,
        payloadShape,
      },
      null,
      2
    ),
    'utf8'
  );
});
