// @ts-check
/**
 * LIVE staging: composition-edit на УЖЕ существующем native-заказе (POST /orders не вызывается).
 * BASE_URL=https://gerol4lfun.github.io/greenhouse-calculator-test/
 *
 * Заказ для add-second: STAGING_EXISTING_ORDER_PHONE или STAGING_EXISTING_ORDER_ID (по умолчанию clean id d8357800-b2c9-4cff-a0a5-0a4f5068d3ff).
 * Single-line: STAGING_SINGLELINE_ORDER_ID (по умолчанию 9aac35ca-9d2e-4291-a6aa-e89528278687). v2-only: greenhouse в line_items_v2 может быть 1 при пустом line_items.
 * Two-line edit второй строки: STAGING_EXISTING_ORDER_ID (baseline двухстрочный d8357800-b2c9-4cff-a0a5-0a4f5068d3ff) — assembly/hooks + одно главное «Сохранить» (flush панели внутри app).
 */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const {
  loginIfNeeded,
  waitForEditOrderReady,
  openEditOrderByPhoneAndGetOrderId,
  appUrlWithQuery,
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
  const total = parseRubDigits(rawTotal);
  const delivery = parseRubDigits(rawDelivery);
  let itemPart = null;
  if (total != null && delivery != null) itemPart = Math.max(0, total - delivery);
  return { total, delivery, itemPart, rawTotal, rawDelivery };
}

/** Цены по строкам теплиц (data-index), без строки «Доставка». */
async function readGreenhouseLinePrices(page) {
  const rows = page.locator('.edit-order-composition-item[data-index]');
  const n = await rows.count();
  const out = [];
  for (let i = 0; i < n; i++) {
    const row = rows.nth(i);
    const text = ((await row.locator('.edit-order-composition-item__text').first().textContent()) || '').trim();
    if (/доставка/i.test(text)) continue;
    const priceEl = row.locator('.edit-order-composition-item__price').first();
    const raw = ((await priceEl.textContent()) || '').trim();
    out.push({ index: i, titleSnippet: text.slice(0, 80), rub: parseRubDigits(raw), raw });
  }
  return out;
}

async function fillAddPanelNonFirstLengthThenConfirm(page) {
  await page.waitForFunction(
    () =>
      document.getElementById('edit-order-add-form') &&
      document.querySelectorAll('#edit-order-add-form option[value]:not([value=""])').length > 0,
    { timeout: 20000 }
  );
  const formSel = page.locator('#edit-order-add-form');
  for (const o of await formSel.locator('option').all()) {
    const v = await o.getAttribute('value');
    if (v && v.trim()) {
      await formSel.selectOption(v);
      break;
    }
  }
  async function selectFirstNonEmpty(id) {
    const sel = page.locator(`#${id}`);
    await page
      .waitForFunction(
        (i) => document.querySelectorAll(`#${i} option[value]:not([value=""])`).length > 0,
        id,
        { timeout: 10000 }
      )
      .catch(() => {});
    for (const o of await sel.locator('option').all()) {
      const v = await o.getAttribute('value');
      if (v && v.trim()) {
        await sel.selectOption(v);
        return;
      }
    }
  }
  await selectFirstNonEmpty('edit-order-add-width');
  const lenSel = page.locator('#edit-order-add-length');
  await page
    .waitForFunction(
      () => document.querySelectorAll('#edit-order-add-length option[value]:not([value=""])').length >= 1,
      { timeout: 10000 }
    )
    .catch(() => {});
  const lenOpts = await lenSel.locator('option[value]:not([value=""])').all();
  if (lenOpts.length >= 2) {
    const v = await lenOpts[1].getAttribute('value');
    await lenSel.selectOption(v);
  } else {
    const wSel = page.locator('#edit-order-add-width');
    const wOpts = await wSel.locator('option[value]:not([value=""])').all();
    if (wOpts.length >= 2) {
      const v2 = await wOpts[1].getAttribute('value');
      await wSel.selectOption(v2);
    }
  }
  await selectFirstNonEmpty('edit-order-add-frame');
  await selectFirstNonEmpty('edit-order-add-polycarbonate');
  await page.locator('#edit-order-add-calc-btn').click().catch(() => {});
  await page.locator('#edit-order-add-confirm-btn:not(.hidden)').waitFor({ state: 'visible', timeout: 25000 });
  await page.locator('#edit-order-add-confirm-btn').click();
  await page.locator('#edit-order-add-item-panel').waitFor({ state: 'hidden', timeout: 12000 }).catch(() => {});
}

/** Как staging-native-v2-final-smoke: взять PATCH с line_items_v2, иначе с полезным line_items. */
function pickCompositionPatch(payloads) {
  const withV2 = payloads.filter((p) => p && p.line_items_v2 != null);
  if (withV2.length) return withV2[withV2.length - 1];
  const withLi = payloads.filter((p) => p && p.line_items != null);
  if (withLi.length) return withLi[withLi.length - 1];
  return payloads.length ? payloads[payloads.length - 1] : null;
}

function parseLineItems(line_items) {
  if (line_items == null) return [];
  try {
    const a = typeof line_items === 'string' ? JSON.parse(line_items) : line_items;
    return Array.isArray(a) ? a : [];
  } catch (_) {
    return [];
  }
}

function parseV2(line_items_v2) {
  if (line_items_v2 == null) return null;
  try {
    const a = typeof line_items_v2 === 'string' ? JSON.parse(line_items_v2) : line_items_v2;
    return Array.isArray(a) ? a : null;
  } catch (_) {
    return null;
  }
}

/** Число позиций kind=greenhouse в line_items_v2 (staging native v2-only). */
function greenhouseV2CountFromOrderRow(row) {
  const v2 = parseV2(row && row.line_items_v2);
  return v2 ? v2.filter((l) => l && String(l.kind || '').toLowerCase() === 'greenhouse').length : 0;
}

/**
 * Первый GET /rest/v1/orders с телом по id (Supabase).
 * @param {import('@playwright/test').Page} page
 * @param {string} orderId
 */
function waitForOrderRowGet(page, orderId) {
  return new Promise((resolve) => {
    /** @param {import('@playwright/test').Response} response */
    async function onResponse(response) {
      try {
        if (response.request().method() !== 'GET') return;
        const u = response.url();
        if (!u.includes('/rest/v1/orders') || !u.includes(orderId)) return;
        const json = await response.json().catch(() => null);
        const row = Array.isArray(json) ? json[0] : json;
        if (row && row.id === orderId) {
          clearTimeout(t);
          page.off('response', onResponse);
          resolve(row);
        }
      } catch (_) {}
    }
    page.on('response', onResponse);
    const t = setTimeout(() => {
      page.off('response', onResponse);
      resolve(null);
    }, 25000);
  });
}

test.describe.configure({ mode: 'serial' });

test('staging: existing native order — add second line (no new order POST)', async ({ page }) => {
  test.setTimeout(300_000);
  const base = process.env.BASE_URL || '';
  if (!base.includes('gerol4lfun.github.io/greenhouse-calculator-test')) {
    test.skip(true, 'BASE_URL must be https://gerol4lfun.github.io/greenhouse-calculator-test/');
  }
  const phone = (process.env.STAGING_EXISTING_ORDER_PHONE || '79000000013').trim();
  const orderIdEnv = (process.env.STAGING_EXISTING_ORDER_ID || 'd8357800-b2c9-4cff-a0a5-0a4f5068d3ff').trim();

  /** @type {unknown[]} */
  const patchPayloads = [];
  page.on('request', (req) => {
    try {
      if (req.method() !== 'PATCH' || !req.url().includes('/rest/v1/orders')) return;
      const pd = req.postData();
      if (pd) patchPayloads.push(JSON.parse(pd));
    } catch (_) {}
  });

  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await loginIfNeeded(page, process.env.TEST_LOGIN, process.env.TEST_PASSWORD);
  await page.locator('#calculator-container').waitFor({ state: 'visible', timeout: 45000 });
  await waitForEditOrderReady(page);

  let orderId = null;
  if (orderIdEnv) {
    await page.goto(appUrlWithQuery('id=' + encodeURIComponent(orderIdEnv)));
    await page.locator('#edit-order-modal-body[data-step="2"]').waitFor({ state: 'visible', timeout: 25000 });
    await page.locator('.edit-order-composition-item').first().waitFor({ state: 'visible', timeout: 15000 });
    orderId = orderIdEnv;
  } else {
    orderId = await openEditOrderByPhoneAndGetOrderId(page, phone);
  }

  const beforeMoney = await readEditModalMoney(page);
  const linesBefore = await readGreenhouseLinePrices(page);

  await page.locator('#edit-order-add-item-btn').click();
  await page.locator('#edit-order-add-item-panel:not(.hidden)').waitFor({ state: 'visible', timeout: 15000 });
  await fillAddPanelNonFirstLengthThenConfirm(page);

  await expect(page.locator('#edit-order-composition-list .edit-order-composition-item[data-index]')).toHaveCount(
    linesBefore.length + 1,
    { timeout: 15000 }
  );

  await page.locator('#edit-order-form-hint').filter({ hasText: /изменены|Данные|сохранен/i }).waitFor({
    state: 'visible',
    timeout: 90000,
  });

  const afterMoney = await readEditModalMoney(page);
  const linesAfter = await readGreenhouseLinePrices(page);

  const out = {
    stagingUrl: base,
    phone: orderIdEnv ? null : phone,
    orderId,
    scenario: 'add_second_greenhouse_line',
    beforeMoney,
    afterMoney,
    linesBefore,
    linesAfter,
    patchPayloadsCount: patchPayloads.length,
    lastPatchKeys:
      patchPayloads.length > 0 ? Object.keys(/** @type {object} */ (patchPayloads[patchPayloads.length - 1])).sort() : [],
    lastPatchLineItemsV2Sample:
      patchPayloads.length > 0 ? (patchPayloads[patchPayloads.length - 1].line_items_v2 ? 'present' : 'absent') : 'n/a',
  };

  fs.writeFileSync(path.join(__dirname, '.last-staging-native-composition-smoke.json'), JSON.stringify(out, null, 2), 'utf8');
  test.info().attach('facts', { body: JSON.stringify(out, null, 2), contentType: 'application/json' });

  expect(linesAfter.length).toBeGreaterThanOrEqual(linesBefore.length);
  if (linesBefore.length >= 1 && linesAfter.length >= 2) {
    expect(linesAfter[0].rub).toBe(linesBefore[0].rub);
  }
  if (beforeMoney.delivery != null && afterMoney.delivery != null) {
    expect(afterMoney.delivery).toBe(beforeMoney.delivery);
  }
});

test('staging: existing native single-line — assembly (or hooks) + UI + PATCH', async ({ page }) => {
  test.setTimeout(300_000);
  const base = process.env.BASE_URL || '';
  if (!base.includes('gerol4lfun.github.io/greenhouse-calculator-test')) {
    test.skip(true, 'BASE_URL must be https://gerol4lfun.github.io/greenhouse-calculator-test/');
  }
  const orderId = (process.env.STAGING_SINGLELINE_ORDER_ID || '9aac35ca-9d2e-4291-a6aa-e89528278687').trim();

  /** @type {unknown[]} */
  const patchPayloads = [];
  page.on('request', (req) => {
    try {
      if (req.method() !== 'PATCH' || !req.url().includes('/rest/v1/orders')) return;
      const pd = req.postData();
      if (pd) patchPayloads.push(JSON.parse(pd));
    } catch (_) {}
  });

  await page.goto('./');
  await page.locator('#calculator-container').waitFor({ state: 'visible', timeout: 45000 });
  await loginIfNeeded(page, process.env.TEST_LOGIN, process.env.TEST_PASSWORD);
  await waitForEditOrderReady(page);

  const rowPromise = waitForOrderRowGet(page, orderId);
  await page.goto(appUrlWithQuery('id=' + encodeURIComponent(orderId)));
  await page.locator('#edit-order-modal-body[data-step="2"]').waitFor({ state: 'visible', timeout: 25000 });
  const orderRow = await rowPromise;
  const v2Gh = orderRow ? greenhouseV2CountFromOrderRow(orderRow) : 0;
  const domGreenhouseLines = await readGreenhouseLinePrices(page);
  const legacyLi = orderRow ? parseLineItems(orderRow.line_items).length : 0;

  if (v2Gh !== 1 && domGreenhouseLines.length !== 1) {
    test.skip(
      true,
      `Need single greenhouse line: line_items_v2 greenhouse=${v2Gh}, DOM greenhouse rows=${domGreenhouseLines.length}, legacy line_items len=${legacyLi}.`
    );
  }

  await page.locator('.edit-order-composition-item__btn--edit').first().waitFor({ state: 'visible', timeout: 20000 });

  const beforeMoney = await readEditModalMoney(page);
  expect(beforeMoney.delivery, 'delivery sane').toBeGreaterThan(0);
  expect(beforeMoney.total, 'total above delivery').toBeGreaterThan(beforeMoney.delivery);

  await page.locator('.edit-order-composition-item__btn--edit').first().click();
  await page.locator('#edit-order-add-item-panel:not(.hidden)').waitFor({ state: 'visible', timeout: 20000 });
  await page.locator('#edit-order-add-price').filter({ hasText: /₽/ }).waitFor({ state: 'visible', timeout: 20000 });

  const asm = page.locator('#edit-order-add-assembly');
  const hooks = page.locator('#edit-order-add-ground-hooks');
  await asm.waitFor({ state: 'visible', timeout: 10000 });
  const asmDisabled = await asm.isDisabled();
  if (!asmDisabled) {
    if (await asm.isChecked()) await asm.uncheck();
    await asm.check();
  } else {
    await hooks.check().catch(() => {});
  }

  await page.locator('#edit-order-add-calc-btn').click();
  await page.locator('#edit-order-save-btn').click();
  await page
    .locator('#edit-order-form-hint')
    .filter({ hasText: /изменены|Данные|сохранен/i })
    .waitFor({ state: 'visible', timeout: 90000 });

  const afterMoney = await readEditModalMoney(page);
  expect(afterMoney.delivery).toBe(beforeMoney.delivery);
  expect(afterMoney.total).toBeGreaterThan(afterMoney.delivery);

  expect(patchPayloads.length).toBeGreaterThan(0);
  const pl = pickCompositionPatch(patchPayloads);
  expect(pl).toBeTruthy();
  const dc = Number(/** @type {any} */ (pl).delivery_cost);
  const tot = Number(/** @type {any} */ (pl).total);
  expect(tot).toBeGreaterThan(dc);
  expect(tot).toBeGreaterThan(0);

  const out = {
    stagingUrl: base,
    orderId,
    scenario: 'single_line_assembly_or_hooks',
    beforeMoney,
    afterMoney,
    patchPayloadsCount: patchPayloads.length,
    pickedPatchKeys: pl ? Object.keys(/** @type {object} */ (pl)).sort() : [],
  };
  fs.writeFileSync(path.join(__dirname, '.last-staging-native-singleline-assembly.json'), JSON.stringify(out, null, 2), 'utf8');
  test.info().attach('assembly-facts', { body: JSON.stringify(out, null, 2), contentType: 'application/json' });
});

test('staging: two-line — edit second line assembly (or hooks) + main save + PATCH', async ({ page }) => {
  test.setTimeout(300_000);
  const TW = {
    calculator: 45_000,
    modalStep2: 25_000,
    addPanel: 25_000,
    panelHide: 20_000,
    formHint: 90_000,
  };

  const base = process.env.BASE_URL || '';
  if (!base.includes('gerol4lfun.github.io/greenhouse-calculator-test')) {
    test.skip(true, 'BASE_URL must be https://gerol4lfun.github.io/greenhouse-calculator-test/');
  }
  const orderId = (process.env.STAGING_EXISTING_ORDER_ID || 'd8357800-b2c9-4cff-a0a5-0a4f5068d3ff').trim();

  const dbg = (msg) => console.log(`[two-line DEBUG] ${msg}`);
  const failShot = path.join(__dirname, 'test-results', 'twoline-fail.png');

  /** @type {unknown[]} */
  const patchPayloads = [];
  page.on('request', (req) => {
    try {
      if (req.method() !== 'PATCH' || !req.url().includes('/rest/v1/orders')) return;
      const pd = req.postData();
      if (pd) {
        patchPayloads.push(JSON.parse(pd));
        dbg(`PATCH captured (count=${patchPayloads.length})`);
      }
    } catch (_) {}
  });

  async function attachDomFacts(tag) {
    try {
      const money = await readEditModalMoney(page);
      const lines = await readGreenhouseLinePrices(page);
      const payload = { tag, url: page.url(), money, lines };
      await test.info().attach(`twoline-dom-${tag}`, { body: JSON.stringify(payload, null, 2), contentType: 'application/json' });
    } catch (e) {
      await test.info().attach(`twoline-dom-${tag}-error`, { body: String(/** @type {Error} */ (e).message), contentType: 'text/plain' });
    }
  }

  try {
    dbg('before: load calculator shell');
    await page.goto('./');
    dbg('before: login + edit-order ready');
    await loginIfNeeded(page, process.env.TEST_LOGIN, process.env.TEST_PASSWORD);
    await page.locator('#calculator-container').waitFor({ state: 'visible', timeout: TW.calculator });
    dbg('after: calculator visible');
    await waitForEditOrderReady(page);
    dbg('after: login / edit-order ready');

    dbg('before: open order by id (GET snapshot + goto)');
    const rowPromise = waitForOrderRowGet(page, orderId);
    await page.goto(appUrlWithQuery('id=' + encodeURIComponent(orderId)));
    await page.locator('#edit-order-modal-body[data-step="2"]').waitFor({ state: 'visible', timeout: TW.modalStep2 });
    const orderRow = await rowPromise;
    dbg('after: opened order (modal step 2)');

    const v2Gh = orderRow ? greenhouseV2CountFromOrderRow(orderRow) : 0;
    const domLines = await readGreenhouseLinePrices(page);
    dbg(`after: greenhouse lines check v2Gh=${v2Gh} domGreenhouseRows=${domLines.length}`);

    if (v2Gh !== 2 && domLines.length !== 2) {
      test.skip(true, `Need 2 greenhouse lines: line_items_v2 greenhouse=${v2Gh}, DOM greenhouse rows=${domLines.length}`);
    }
    dbg('detected 2 greenhouse lines (gating ok)');

    const beforeMoney = await readEditModalMoney(page);
    dbg(`beforeMoney UI: ${JSON.stringify(beforeMoney)}`);
    expect(beforeMoney.delivery, 'delivery sane').toBeGreaterThan(0);
    expect(beforeMoney.total, 'total above delivery').toBeGreaterThan(beforeMoney.delivery);

    const line1RubBefore = domLines[0].rub;
    const line2RubBefore = domLines[1].rub;
    expect(line1RubBefore, 'line 1 price visible').not.toBeNull();
    expect(line2RubBefore, 'line 2 price visible').not.toBeNull();

    dbg(`before: click second line edit (domLines[1].index=${domLines[1].index})`);
    const ghRows = page.locator('.edit-order-composition-item[data-index]');
    await ghRows.nth(domLines[1].index).locator('.edit-order-composition-item__btn--edit').click();
    dbg('after: clicked second line edit');

    dbg(`before: wait #edit-order-add-item-panel visible (${TW.addPanel}ms)`);
    await page.locator('#edit-order-add-item-panel:not(.hidden)').waitFor({ state: 'visible', timeout: TW.addPanel });
    dbg('after: opened add/edit panel for second line');

    await page.locator('#edit-order-add-price').filter({ hasText: /₽/ }).waitFor({ state: 'visible', timeout: 20_000 });
    const priceBeforeTxt = ((await page.locator('#edit-order-add-price').textContent()) || '').trim();
    dbg(`price before: ${priceBeforeTxt}`);

    dbg('assembly toggled');
    const asm = page.locator('#edit-order-add-assembly');
    const hooks = page.locator('#edit-order-add-ground-hooks');
    await asm.waitFor({ state: 'visible', timeout: 10_000 });
    const asmDisabled = await asm.isDisabled();
    if (!asmDisabled) {
      if (await asm.isChecked()) await asm.uncheck();
      await asm.check();
      dbg('assembly path: #edit-order-add-assembly');
    } else {
      await hooks.check().catch(() => {});
      dbg('assembly path: hooks (assembly disabled)');
    }

    dbg('calc clicked');
    await page.locator('#edit-order-add-calc-btn').click();

    await page
      .waitForFunction(
        (before) => {
          const el = document.getElementById('edit-order-add-price');
          const now = el ? el.textContent || '' : '';
          return now && now !== before && now.includes('₽');
        },
        priceBeforeTxt,
        { timeout: 12_000 }
      )
      .catch(() => {});
    await page.locator('#edit-order-add-breakdown:not(.hidden)').waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});

    let priceAfterTxt = ((await page.locator('#edit-order-add-price').textContent()) || '').trim();
    dbg(`price after: ${priceAfterTxt}`);

    if (priceAfterTxt === priceBeforeTxt) {
      dbg('price unchanged after assembly — hooks + calc retry');
      await hooks.check().catch(() => {});
      dbg('calc clicked (retry)');
      await page.locator('#edit-order-add-calc-btn').click();
      await page
        .waitForFunction(
          (before) => {
            const el = document.getElementById('edit-order-add-price');
            const now = el ? el.textContent || '' : '';
            return now && now !== before && now.includes('₽');
          },
          priceAfterTxt,
          { timeout: 12_000 }
        )
        .catch(() => {});
      priceAfterTxt = ((await page.locator('#edit-order-add-price').textContent()) || '').trim();
      dbg(`price after retry: ${priceAfterTxt}`);
    }

    // Заказ на staging мог уже быть сохранён со сборкой (повторный прогон): uncheck→check не меняет цену. Retry мог включить крюки — снять опции и пересчитать.
    if (priceAfterTxt === priceBeforeTxt && !asmDisabled) {
      dbg('price still flat — uncheck assembly + hooks then calc to force net delta vs list');
      await asm.uncheck();
      await hooks.uncheck().catch(() => {});
      await page.locator('#edit-order-add-calc-btn').click();
      await page
        .waitForFunction(
          (before) => {
            const el = document.getElementById('edit-order-add-price');
            const now = el ? el.textContent || '' : '';
            return now && now !== before && now.includes('₽');
          },
          priceAfterTxt,
          { timeout: 15_000 }
        )
        .catch(() => {});
      priceAfterTxt = ((await page.locator('#edit-order-add-price').textContent()) || '').trim();
      dbg(`price after options cleared: ${priceAfterTxt}`);
    }

    const priceChanged = priceAfterTxt !== priceBeforeTxt;
    const breakdownShown = await page.locator('#edit-order-add-breakdown:not(.hidden)').isVisible().catch(() => false);
    if (!priceChanged && !breakdownShown) {
      throw new Error('two-line: no price/breakdown change after calc — cannot assert line 2 edit');
    }

    dbg('before: #edit-order-save-btn (flush panel + PATCH in one step)');
    await page.locator('#edit-order-save-btn').click();
    dbg('after: main save clicked');

    dbg(`before: wait #edit-order-form-hint (${TW.formHint}ms)`);
    await page
      .locator('#edit-order-form-hint')
      .filter({ hasText: /изменены|Данные|сохранен/i })
      .waitFor({ state: 'visible', timeout: TW.formHint });
    dbg('after: hint visible');

    dbg('before: final UI money + lines');
    const afterMoney = await readEditModalMoney(page);
    const linesAfter = await readGreenhouseLinePrices(page);
    dbg(`after: final UI money ${JSON.stringify(afterMoney)} lines=${linesAfter.length}`);

    expect(linesAfter.length, 'composition still 2 greenhouse rows').toBe(2);
    expect(linesAfter[0].rub, 'line 1 price unchanged').toBe(line1RubBefore);
    expect(linesAfter[1].rub, 'line 2 price changed').not.toBe(line2RubBefore);
    expect(afterMoney.delivery).toBe(beforeMoney.delivery);
    expect(afterMoney.total).toBeGreaterThan(afterMoney.delivery);

    expect(patchPayloads.length).toBeGreaterThan(0);
    const pl = pickCompositionPatch(patchPayloads);
    expect(pl).toBeTruthy();
    const dc = Number(/** @type {any} */ (pl).delivery_cost);
    const tot = Number(/** @type {any} */ (pl).total);
    expect(tot).toBeGreaterThan(dc);
    expect(tot).toBeGreaterThan(0);
    const hasComposition =
      (/** @type {any} */ (pl).line_items_v2 != null && String(/** @type {any} */ (pl).line_items_v2).length > 0) ||
      (parseLineItems(/** @type {any} */ (pl).line_items).length > 0);
    expect(hasComposition, 'PATCH keeps composition payload').toBeTruthy();

    const out = {
      stagingUrl: base,
      orderId,
      scenario: 'two_line_edit_second_assembly',
      beforeMoney,
      afterMoney,
      line1RubBefore,
      line2RubBefore,
      line1RubAfter: linesAfter[0].rub,
      line2RubAfter: linesAfter[1].rub,
      patchPayloadsCount: patchPayloads.length,
      pickedPatchKeys: pl ? Object.keys(/** @type {object} */ (pl)).sort() : [],
    };
    fs.writeFileSync(path.join(__dirname, '.last-staging-native-twoline-second-edit.json'), JSON.stringify(out, null, 2), 'utf8');
    test.info().attach('twoline-facts', { body: JSON.stringify(out, null, 2), contentType: 'application/json' });
    dbg('two-line scenario finished OK');
  } catch (e) {
    dbg(`FAIL: ${/** @type {Error} */ (e).message}`);
    await attachDomFacts('on-failure');
    await fs.promises.mkdir(path.dirname(failShot), { recursive: true });
    try {
      await page.screenshot({ path: failShot, fullPage: true });
      await test.info().attach('twoline-fail-screenshot', { path: failShot, contentType: 'image/png' });
    } catch (_) {}
    throw e;
  }
});
