// @ts-check
/**
 * Native existing-order edit: line_items_v2 snapshot-merge (add/delete/FIFO duplicate).
 * GET /orders — fixture rows (no live read dependency for scenario data).
 * PATCH /orders — intercepted, stub 200 — no DB write.
 *
 * KNOWN CURRENT BEHAVIOR (scenario 3): two identical material lines use FIFO matching
 * (first unused atOpen slot in index order via findFirstUnusedNativeAtOpenMatch_).
 * Not a product guarantee to change without explicit spec — this test only round-trips locked totals.
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const { openEditOrderById } = require('./helpers');

const ID_ADD = 'e2e3add0-0000-4000-8000-000000000001';
const ID_DEL = 'e2e3del0-0000-4000-8000-000000000002';
const ID_FIFO = 'e2e3ffo0-0000-4000-8000-000000000003';
/** «Каталог вырос»: снимок с заниженными locked; не тронутая позиция остаётся 501, пересчитанные > 502. */
const ID_PRICE_RISE = 'e2e4prc0-0000-4000-8000-000000000004';

/** Single-line native edit: assembly / bracing / ground-hooks only (locked merge path). */
const ID_ASM_ONLY = 'e2e5asm0-0000-4000-8000-000000000010';
const ID_BRACE_ONLY = 'e2e5brc0-0000-4000-8000-000000000011';
const ID_HOOKS_ONLY = 'e2e5ghk0-0000-4000-8000-000000000012';
/** Two lines: foundation edit on line 0, line 1 must not drift. */
const ID_ON_WOOD_TWO = 'e2e5wd0-0000-4000-8000-000000000013';
/** Three lines → delete one, edit another; third line_id absent; first untouched locked. */
const ID_MIX3_EDIT = 'e2e5mx3-0000-4000-8000-000000000014';
/** FIFO duplicate pair + bracing on first line only; second snapshot locked preserved. */
const ID_DUP_BRACING = 'e2e5dpb-0000-4000-8000-000000000015';

const MODEL = 'ТЕПЛИЦА БОЯРСКАЯ 2.5М';
const FRAME = '20х20';
const PC = 'Без поликарбоната';

function isOrdersPatch(req) {
  return req.method() === 'PATCH' && req.url().includes('/rest/v1/orders');
}

function baseOrder(id, phone) {
  return {
    id,
    deleted_at: null,
    status: 'new',
    created_at: '2026-03-20T12:00:00Z',
    client_phone: phone,
    client_name: 'E2E Native Merge',
    delivery_date: '25.03.2026',
    delivery_address: 'Московская обл., г. Подольск, ул. Ленина, д. 1',
    city: 'Москва',
    warehouse_city_key: 'Москва',
    commercial_offer: 'e2e native merge',
    comment: '',
    source: 'Строй Мир',
    manager: 'Юлия',
    gift: '',
    extras: '',
    assembly: '',
    arc_step: '1',
    quantity: 1,
    unit_price: 100,
  };
}

/** @param {{ locked: number, length: number, line_id: string }} gh */
function ghV2Line(locked, len, line_id) {
  return {
    line_id,
    kind: 'greenhouse',
    display_name: 'GH ' + len + 'm',
    quantity: 1,
    unit_price_locked: locked,
    line_total_locked: locked,
    pricing_source: 'catalog',
    parent_line_id: null,
    sku_or_code: null,
    config: {
      model: MODEL,
      width: 2.5,
      length: len,
      frame: FRAME,
      polycarbonate: PC,
      form: 'Арочная',
    },
    meta: null,
  };
}

function deliveryV2(amt) {
  return {
    line_id: 'delivery-e2e',
    kind: 'delivery',
    display_name: 'Доставка',
    quantity: 1,
    unit_price_locked: amt,
    line_total_locked: amt,
    pricing_source: 'calculated',
    parent_line_id: null,
    config: null,
    meta: null,
  };
}

function mockAddOneOldLocked() {
  const o = baseOrder(ID_ADD, '79000000091');
  const dc = 500;
  const OLD_LOCKED = 88888;
  const li = [
    {
      model: MODEL,
      width: '2.5',
      length: '4',
      frame: FRAME,
      arc_step: '1',
      polycarbonate: PC,
      item_total: OLD_LOCKED,
      form: 'Арочная',
      extras: '',
      assembly: '',
      city: 'Москва',
    },
  ];
  o.line_items = JSON.stringify(li);
  o.line_items_v2 = [ghV2Line(OLD_LOCKED, 4, 'gh-marker-old'), deliveryV2(dc)];
  o.delivery_cost = dc;
  o.total = OLD_LOCKED + dc;
  o.model = MODEL;
  o.width = '2.5';
  o.length = '4';
  o.frame = FRAME;
  o.polycarbonate = PC;
  return o;
}

function mockDeleteTwoLines() {
  const o = baseOrder(ID_DEL, '79000000092');
  const dc = 500;
  const o1 = 60001;
  const o2 = 60002;
  o.line_items = JSON.stringify([
    {
      model: MODEL,
      width: '2.5',
      length: '4',
      frame: FRAME,
      arc_step: '1',
      polycarbonate: PC,
      item_total: o1,
      form: 'Арочная',
      extras: '',
      assembly: '',
      city: 'Москва',
    },
    {
      model: MODEL,
      width: '2.5',
      length: '6',
      frame: FRAME,
      arc_step: '1',
      polycarbonate: PC,
      item_total: o2,
      form: 'Арочная',
      extras: '',
      assembly: '',
      city: 'Москва',
    },
  ]);
  o.line_items_v2 = [ghV2Line(o1, 4, 'gh-keep'), ghV2Line(o2, 6, 'gh-drop'), deliveryV2(dc)];
  o.delivery_cost = dc;
  o.total = o1 + o2 + dc;
  o.model = MODEL;
  o.width = '2.5';
  o.length = '4';
  o.frame = FRAME;
  o.polycarbonate = PC;
  return o;
}

function mockFifoDuplicate() {
  const o = baseOrder(ID_FIFO, '79000000093');
  const dc = 400;
  const a = 70001;
  const b = 70002;
  const row = {
    model: MODEL,
    width: '2.5',
    length: '4',
    frame: FRAME,
    arc_step: '1',
    polycarbonate: PC,
    form: 'Арочная',
    extras: '',
    assembly: '',
    city: 'Москва',
  };
  o.line_items = JSON.stringify([
    Object.assign({}, row, { item_total: a }),
    Object.assign({}, row, { item_total: b }),
  ]);
  o.line_items_v2 = [ghV2Line(a, 4, 'gh-dup-a'), ghV2Line(b, 4, 'gh-dup-b'), deliveryV2(dc)];
  o.delivery_cost = dc;
  o.total = a + b + dc;
  o.model = MODEL;
  o.width = '2.5';
  o.length = '4';
  o.frame = FRAME;
  o.polycarbonate = PC;
  return o;
}

/** Два GH в снимке: искусственно низкие locked (имитация цен на момент заказа). Текущий каталог при пересчёте >> этих значений. */
function mockCatalogPriceRiseBaseline() {
  const o = baseOrder(ID_PRICE_RISE, '79000000094');
  const dc = 300;
  const SNAP_UNTOUCHED = 501;
  const SNAP_CHANGED_LINE_OLD = 502;
  o.line_items = JSON.stringify([
    {
      model: MODEL,
      width: '2.5',
      length: '4',
      frame: FRAME,
      arc_step: '1',
      polycarbonate: PC,
      item_total: SNAP_UNTOUCHED,
      form: 'Арочная',
      extras: '',
      assembly: '',
      city: 'Москва',
    },
    {
      model: MODEL,
      width: '2.5',
      length: '6',
      frame: FRAME,
      arc_step: '1',
      polycarbonate: PC,
      item_total: SNAP_CHANGED_LINE_OLD,
      form: 'Арочная',
      extras: '',
      assembly: '',
      city: 'Москва',
    },
  ]);
  o.line_items_v2 = [
    ghV2Line(SNAP_UNTOUCHED, 4, 'gh-snap-untouched'),
    ghV2Line(SNAP_CHANGED_LINE_OLD, 6, 'gh-snap-change-me'),
    deliveryV2(dc),
  ];
  o.delivery_cost = dc;
  o.total = SNAP_UNTOUCHED + SNAP_CHANGED_LINE_OLD + dc;
  o.model = MODEL;
  o.width = '2.5';
  o.length = '4';
  o.frame = FRAME;
  o.polycarbonate = PC;
  return o;
}

function mockSingleLineBaseline(id, phone, locked, dc, lineId = 'gh-single') {
  const o = baseOrder(id, phone);
  o.line_items = JSON.stringify([
    {
      model: MODEL,
      width: '2.5',
      length: '4',
      frame: FRAME,
      arc_step: '1',
      polycarbonate: PC,
      item_total: locked,
      form: 'Арочная',
      extras: '',
      assembly: '',
      city: 'Москва',
    },
  ]);
  o.line_items_v2 = [ghV2Line(locked, 4, lineId), deliveryV2(dc)];
  o.delivery_cost = dc;
  o.total = locked + dc;
  o.model = MODEL;
  o.width = '2.5';
  o.length = '4';
  o.frame = FRAME;
  o.polycarbonate = PC;
  return o;
}

function mockOnWoodTwoLines() {
  const o = baseOrder(ID_ON_WOOD_TWO, '79000000095');
  const dc = 450;
  const L0 = 62001;
  const L1 = 62002;
  o.line_items = JSON.stringify([
    {
      model: MODEL,
      width: '2.5',
      length: '4',
      frame: FRAME,
      arc_step: '1',
      polycarbonate: PC,
      item_total: L0,
      form: 'Арочная',
      extras: '',
      assembly: '',
      city: 'Москва',
    },
    {
      model: MODEL,
      width: '2.5',
      length: '6',
      frame: FRAME,
      arc_step: '1',
      polycarbonate: PC,
      item_total: L1,
      form: 'Арочная',
      extras: '',
      assembly: '',
      city: 'Москва',
    },
  ]);
  o.line_items_v2 = [ghV2Line(L0, 4, 'gh-ow-a'), ghV2Line(L1, 6, 'gh-ow-b'), deliveryV2(dc)];
  o.delivery_cost = dc;
  o.total = L0 + L1 + dc;
  o.model = MODEL;
  o.width = '2.5';
  o.length = '4';
  o.frame = FRAME;
  o.polycarbonate = PC;
  return o;
}

function mockThreeLinesForMix() {
  const o = baseOrder(ID_MIX3_EDIT, '79000000096');
  const dc = 350;
  const a = 81001;
  const b = 81002;
  const c = 81003;
  o.line_items = JSON.stringify([
    {
      model: MODEL,
      width: '2.5',
      length: '4',
      frame: FRAME,
      arc_step: '1',
      polycarbonate: PC,
      item_total: a,
      form: 'Арочная',
      extras: '',
      assembly: '',
      city: 'Москва',
    },
    {
      model: MODEL,
      width: '2.5',
      length: '6',
      frame: FRAME,
      arc_step: '1',
      polycarbonate: PC,
      item_total: b,
      form: 'Арочная',
      extras: '',
      assembly: '',
      city: 'Москва',
    },
    {
      model: MODEL,
      width: '2.5',
      length: '8',
      frame: FRAME,
      arc_step: '1',
      polycarbonate: PC,
      item_total: c,
      form: 'Арочная',
      extras: '',
      assembly: '',
      city: 'Москва',
    },
  ]);
  o.line_items_v2 = [
    ghV2Line(a, 4, 'gh-mix-a'),
    ghV2Line(b, 6, 'gh-mix-b'),
    ghV2Line(c, 8, 'gh-mix-c'),
    deliveryV2(dc),
  ];
  o.delivery_cost = dc;
  o.total = a + b + c + dc;
  o.model = MODEL;
  o.width = '2.5';
  o.length = '4';
  o.frame = FRAME;
  o.polycarbonate = PC;
  return o;
}

function mockFifoDuplicateForBracing() {
  const o = baseOrder(ID_DUP_BRACING, '79000000097');
  const dc = 400;
  const a = 70011;
  const b = 70012;
  const row = {
    model: MODEL,
    width: '2.5',
    length: '4',
    frame: FRAME,
    arc_step: '1',
    polycarbonate: PC,
    form: 'Арочная',
    extras: '',
    assembly: '',
    city: 'Москва',
  };
  o.line_items = JSON.stringify([
    Object.assign({}, row, { item_total: a }),
    Object.assign({}, row, { item_total: b }),
  ]);
  o.line_items_v2 = [ghV2Line(a, 4, 'gh-dup-a'), ghV2Line(b, 4, 'gh-dup-b'), deliveryV2(dc)];
  o.delivery_cost = dc;
  o.total = a + b + dc;
  o.model = MODEL;
  o.width = '2.5';
  o.length = '4';
  o.frame = FRAME;
  o.polycarbonate = PC;
  return o;
}

/** @param {unknown} pl */
function parseLineItemsFromPayload(pl) {
  if (!pl || pl.line_items == null) return null;
  const li = pl.line_items;
  if (Array.isArray(li)) return li;
  if (typeof li === 'string') {
    try {
      const p = JSON.parse(li);
      return Array.isArray(p) ? p : null;
    } catch (_) {
      return null;
    }
  }
  return null;
}

/**
 * Как staging-native-v2-final-smoke: не брать «последний captured» — после confirm может уйти второй PATCH без v2.
 * Дополнительно: последний PATCH с непустым v2 иногда содержит GH с line_total_locked=0 — брать последний с осмысленными locked.
 * @param {{ payload: unknown }[]} captured
 */
function pickCompositionPatch(captured) {
  const payloads = captured.map((c) => c && c.payload).filter(Boolean);
  if (!payloads.length) return null;

  function lineItemsV2Array(p) {
    const v2 = p.line_items_v2;
    if (v2 == null) return null;
    if (Array.isArray(v2)) return v2;
    if (typeof v2 === 'string') {
      try {
        const a = JSON.parse(v2);
        return Array.isArray(a) ? a : null;
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  function hasPositiveGreenhouseLocked(arr) {
    if (!arr || !arr.length) return false;
    const ghs = arr.filter((L) => L && String(L.kind).toLowerCase() === 'greenhouse');
    return ghs.some((g) => Number(g.line_total_locked) > 0);
  }

  const withV2Good = payloads.filter((p) => hasPositiveGreenhouseLocked(lineItemsV2Array(p)));
  if (withV2Good.length) return withV2Good[withV2Good.length - 1];

  const withV2 = payloads.filter((p) => {
    const arr = lineItemsV2Array(p);
    return arr != null && arr.length > 0;
  });
  if (withV2.length) return withV2[withV2.length - 1];
  const withMultiLi = payloads.filter((p) => {
    const li = parseLineItemsFromPayload(p);
    return li != null && li.length >= 2;
  });
  if (withMultiLi.length) return withMultiLi[withMultiLi.length - 1];
  return payloads[payloads.length - 1];
}

/**
 * @param {unknown} pl
 * @param {{ ghCount: number, deliveryCost: number, lineItemsRows?: number }} exp
 * lineItemsRows: если задано — ожидаем столько строк в line_items (multi-line JSON); single-line touched часто line_items=null — не передавать.
 */
function assertNativePatchPayloadInvariants(pl, exp) {
  expect(pl).toBeTruthy();
  expect(Array.isArray(pl.line_items_v2)).toBe(true);
  expect(pl.line_items_v2.length).toBeGreaterThan(0);
  const ghs = pl.line_items_v2.filter((L) => L && String(L.kind).toLowerCase() === 'greenhouse');
  expect(ghs.length).toBe(exp.ghCount);
  const del = pl.line_items_v2.find((L) => L && String(L.kind).toLowerCase() === 'delivery');
  expect(del).toBeTruthy();
  expect(Number(del.line_total_locked)).toBe(exp.deliveryCost);
  expect(Number(pl.delivery_cost)).toBe(exp.deliveryCost);
  if (exp.lineItemsRows != null) {
    const rows = parseLineItemsFromPayload(pl);
    expect(rows != null && rows.length === exp.lineItemsRows).toBe(true);
  }
  const nonDel = pl.line_items_v2.filter((L) => L && String(L.kind).toLowerCase() !== 'delivery');
  expect(nonDel.length).toBeGreaterThan(0);
}

/** GH по длине в config (не по fixture line_id). */
function greenhouseV2ByBillingLength(ghs, len) {
  return ghs.find((g) => g && g.config != null && Number(g.config.length) === len);
}

/** GET mocks by order id + PATCH capture (no DB write). */
async function routeGetMocksAndPatchIntercept(page, captured, idToRow) {
  await page.route('**/rest/v1/orders*', async (route) => {
    const req = route.request();
    const u = req.url();
    if (isOrdersPatch(req)) {
      let payload = null;
      try {
        const postData = req.postData();
        if (postData) payload = JSON.parse(postData);
      } catch (_) {}
      const orderId = u.match(/[?&]id=eq\.([a-f0-9-]+)/i)?.[1] || null;
      captured.push({ order_id: orderId, payload: payload || null });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{}], error: null }),
      });
      return;
    }
    if (req.method() === 'GET') {
      for (const [id, row] of Object.entries(idToRow)) {
        if (u.includes(id)) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: { 'content-range': '0-0/*' },
            body: JSON.stringify([row]),
          });
          return;
        }
      }
    }
    await route.continue();
  });
}

/** Same deep-link path as existing-order-date-only / helpers.openEditOrderById: ?id= opens modal + startEditOrder from DOMContentLoaded init (scripts.js). */
async function openNativeOrder(page, orderId) {
  await openEditOrderById(page, orderId);
  await page.locator('.edit-order-composition-item[data-index]').first().waitFor({ state: 'visible', timeout: 12000 });
}

/** Second non-empty length (or second width) so new line differs materially from length-4 baseline. */
async function fillAddPanelNonFirstLengthThenConfirm(page) {
  await page.waitForFunction(
    () =>
      document.getElementById('edit-order-add-form') &&
      document.querySelectorAll('#edit-order-add-form option[value]:not([value=""])').length > 0,
    { timeout: 15000 }
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
        { timeout: 8000 }
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
      { timeout: 8000 }
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
  await page.locator('#edit-order-add-confirm-btn:not(.hidden)').waitFor({ state: 'visible', timeout: 20000 });
  await page.locator('#edit-order-add-confirm-btn').click();
  await page.locator('#edit-order-add-item-panel').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
}

/** Вторая позиция: меняем материал (Доп. форточка 0↔1) — тот же стабильный путь, что edit-order paid-extra. */
async function editSecondLineExtraWindowToggleThenSavePosition(page) {
  await page.locator('.edit-order-composition-item__btn--edit').nth(1).click();
  await page.locator('#edit-order-add-item-panel:not(.hidden)').waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForFunction(
    () => document.getElementById('edit-order-add-form') && document.getElementById('edit-order-add-form').value,
    { timeout: 10000 }
  );
  const qty = page.locator('#edit-order-add-additional-window-qty');
  await qty.waitFor({ state: 'visible', timeout: 8000 });
  const before = await qty.inputValue();
  if (before === '0') await qty.selectOption('1');
  else await qty.selectOption('0');
  await page.locator('#edit-order-add-calc-btn').click();
  await page.locator('#edit-order-save-position-btn:not(.hidden)').waitFor({ state: 'visible', timeout: 20000 });
  await page.locator('#edit-order-save-position-btn').click();
  await page.locator('#edit-order-add-item-panel').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
}

/**
 * Первая позиция: переключить один чекбокс (сборка / брус / штыри / фундамент), сохранить позицию (триггерит главное сохранение + PATCH).
 * Single-line: locked merge path — calc не обязателен. Multi-line: save вызывает runEditOrderAddPanelCalculation внутри.
 */
async function editFirstLineCheckboxThenSave(page, checkboxId) {
  await page.locator('.edit-order-composition-item__btn--edit').first().click();
  await page.locator('#edit-order-add-item-panel:not(.hidden)').waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForFunction(
    () => document.getElementById('edit-order-add-form') && document.getElementById('edit-order-add-form').value,
    { timeout: 10000 }
  );
  const cb = page.locator(`#${checkboxId}`);
  await cb.waitFor({ state: 'visible', timeout: 8000 });
  if (!(await cb.isChecked())) await cb.check();
  else await cb.uncheck();
  await page.locator('#edit-order-add-calc-btn').click().catch(() => {});
  await page.locator('#edit-order-save-position-btn:not(.hidden)').waitFor({ state: 'visible', timeout: 20000 });
  await page.locator('#edit-order-save-position-btn').click();
  await page.locator('#edit-order-form-hint').filter({ hasText: /изменены|Данные/ }).waitFor({ state: 'visible', timeout: 20000 });
  await page.locator('#edit-order-add-item-panel').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
}

test.describe('native-order-v2-merge (PATCH intercepted)', () => {
  test.use({ storageState: path.join(__dirname, '.auth/user.json') });

  test('add line: old GH keeps line_total_locked 88888; new GH is catalog-priced (≠88888)', async ({ page }) => {
    const captured = [];
    await routeGetMocksAndPatchIntercept(page, captured, { [ID_ADD]: mockAddOneOldLocked() });
    await openNativeOrder(page, ID_ADD);

    await page.locator('#edit-order-add-item-btn').click();
    await page.locator('#edit-order-add-item-panel:not(.hidden)').waitFor({ state: 'visible', timeout: 10000 });
    await fillAddPanelNonFirstLengthThenConfirm(page);
    // «Добавить в заказ» вызывает главное сохранение — PATCH уже ушёл; остаёмся на шаге 2.
    await expect(page.locator('#edit-order-composition-list .edit-order-composition-item[data-index]')).toHaveCount(2, { timeout: 5000 });
    await page.locator('#edit-order-form-hint').filter({ hasText: /изменены|Данные/ }).waitFor({ state: 'visible', timeout: 20000 });

    expect(captured.length).toBeGreaterThan(0);
    const pl = pickCompositionPatch(captured);
    expect(pl).toBeTruthy();
    expect(Array.isArray(pl.line_items_v2)).toBeTruthy();
    const ghs = pl.line_items_v2.filter((L) => L && String(L.kind).toLowerCase() === 'greenhouse');
    expect(ghs.length).toBe(2);
    const locked = ghs.map((g) => Number(g.line_total_locked));
    expect(locked.filter((x) => x === 88888).length).toBe(1);
    expect(locked.some((x) => x !== 88888)).toBe(true);
  });

  test('delete line: remaining GH keeps 60001; gh-drop absent from line_items_v2', async ({ page }) => {
    const captured = [];
    await routeGetMocksAndPatchIntercept(page, captured, { [ID_DEL]: mockDeleteTwoLines() });
    await openNativeOrder(page, ID_DEL);

    await page.locator('.edit-order-composition-item__btn--del').nth(1).click();
    await expect(page.locator('#edit-order-composition-list .edit-order-composition-item[data-index]')).toHaveCount(1, {
      timeout: 5000,
    });

    await page.locator('#edit-order-save-btn').click();
    await page.locator('#edit-order-form-hint').filter({ hasText: /изменены|Данные/ }).waitFor({ state: 'visible', timeout: 20000 });

    const pl = pickCompositionPatch(captured);
    expect(pl).toBeTruthy();
    expect(Array.isArray(pl.line_items_v2)).toBeTruthy();
    const ghs = pl.line_items_v2.filter((L) => L && String(L.kind).toLowerCase() === 'greenhouse');
    expect(ghs.length).toBe(1);
    expect(Number(ghs[0].line_total_locked)).toBe(60001);
    expect(ghs.some((L) => Number(L.line_total_locked) === 60002)).toBe(false);
  });

  test('FIFO duplicate materials: two identical lines round-trip locked 70001 & 70002 (known FIFO behavior)', async ({ page }) => {
    const captured = [];
    await routeGetMocksAndPatchIntercept(page, captured, { [ID_FIFO]: mockFifoDuplicate() });
    await openNativeOrder(page, ID_FIFO);

    // No-op save would stay on metadata-only path (no line_items_v2). Touch composition: add a third line, then remove it — back to 2× duplicate materials; merge still applies FIFO vs atOpen.
    const nBefore = await page.locator('#edit-order-composition-list .edit-order-composition-item[data-index]').count();
    expect(nBefore).toBe(2);
    await page.locator('#edit-order-add-item-btn').click();
    await page.locator('#edit-order-add-item-panel:not(.hidden)').waitFor({ state: 'visible', timeout: 10000 });
    await fillAddPanelNonFirstLengthThenConfirm(page);
    await expect(page.locator('#edit-order-composition-list .edit-order-composition-item[data-index]')).toHaveCount(3, { timeout: 5000 });
    await page.locator('.edit-order-composition-item__btn--del').nth(2).click();
    await expect(page.locator('#edit-order-composition-list .edit-order-composition-item[data-index]')).toHaveCount(2, { timeout: 5000 });

    await page.locator('#edit-order-save-btn').click();
    await page.locator('#edit-order-form-hint').filter({ hasText: /изменены|Данные/ }).waitFor({ state: 'visible', timeout: 20000 });

    const pl = pickCompositionPatch(captured);
    expect(pl).toBeTruthy();
    expect(Array.isArray(pl.line_items_v2)).toBeTruthy();
    const ghs = pl.line_items_v2.filter((L) => L && String(L.kind).toLowerCase() === 'greenhouse');
    expect(ghs.length).toBe(2);
    const totals = ghs.map((g) => Number(g.line_total_locked)).sort((a, b) => a - b);
    expect(totals).toEqual([70001, 70002]);
  });

  test('catalog price rise: untouched line keeps snap 501; changed + new line repriced above old 502', async ({ page }) => {
    const SNAP_UNTOUCHED = 501;
    const SNAP_CHANGED_LINE_OLD = 502;
    const captured = [];
    await routeGetMocksAndPatchIntercept(page, captured, { [ID_PRICE_RISE]: mockCatalogPriceRiseBaseline() });
    await openNativeOrder(page, ID_PRICE_RISE);

    await editSecondLineExtraWindowToggleThenSavePosition(page);

    await page.locator('#edit-order-add-item-btn').click();
    await page.locator('#edit-order-add-item-panel:not(.hidden)').waitFor({ state: 'visible', timeout: 10000 });
    await fillAddPanelNonFirstLengthThenConfirm(page);
    await expect(page.locator('#edit-order-composition-list .edit-order-composition-item[data-index]')).toHaveCount(3, { timeout: 5000 });
    await page.locator('#edit-order-form-hint').filter({ hasText: /изменены|Данные/ }).waitFor({ state: 'visible', timeout: 20000 });

    expect(captured.length).toBeGreaterThan(0);
    const pl = pickCompositionPatch(captured);
    expect(pl).toBeTruthy();
    expect(Array.isArray(pl.line_items_v2)).toBeTruthy();
    const ghs = pl.line_items_v2.filter((L) => L && String(L.kind).toLowerCase() === 'greenhouse');
    expect(ghs.length).toBe(3);

    const with501 = ghs.filter((g) => Number(g.line_total_locked) === SNAP_UNTOUCHED && Number(g.unit_price_locked) === SNAP_UNTOUCHED);
    expect(with501.length).toBe(1);

    expect(ghs.some((g) => Number(g.line_total_locked) === SNAP_CHANGED_LINE_OLD)).toBe(false);

    const repriced = ghs.filter((g) => Number(g.line_total_locked) !== SNAP_UNTOUCHED);
    expect(repriced.length).toBe(2);
    for (const g of repriced) {
      expect(Number(g.line_total_locked)).toBeGreaterThan(SNAP_CHANGED_LINE_OLD);
      expect(Number(g.unit_price_locked)).toBeGreaterThan(SNAP_CHANGED_LINE_OLD);
    }
  });

  test('assembly-only on one native line: PATCH has line_items + v2; GH count 1; delivery locked', async ({ page }) => {
    const dc = 500;
    const baseLocked = 92000;
    const captured = [];
    await routeGetMocksAndPatchIntercept(page, captured, { [ID_ASM_ONLY]: mockSingleLineBaseline(ID_ASM_ONLY, '79000000101', baseLocked, dc) });
    await openNativeOrder(page, ID_ASM_ONLY);
    await editFirstLineCheckboxThenSave(page, 'edit-order-add-assembly');
    expect(captured.length).toBeGreaterThan(0);
    const pl = pickCompositionPatch(captured);
    expect(pl).toBeTruthy();
    assertNativePatchPayloadInvariants(pl, { ghCount: 1, deliveryCost: dc });
    const ghs = pl.line_items_v2.filter((L) => L && String(L.kind).toLowerCase() === 'greenhouse');
    expect(Number(ghs[0].line_total_locked)).not.toBe(baseLocked);
  });

  test('bracing-only on one native line: PATCH cohesive; single GH repriced vs snapshot', async ({ page }) => {
    const dc = 480;
    const baseLocked = 92100;
    const captured = [];
    await routeGetMocksAndPatchIntercept(page, captured, { [ID_BRACE_ONLY]: mockSingleLineBaseline(ID_BRACE_ONLY, '79000000102', baseLocked, dc) });
    await openNativeOrder(page, ID_BRACE_ONLY);
    await editFirstLineCheckboxThenSave(page, 'edit-order-add-bracing');
    const pl = pickCompositionPatch(captured);
    expect(pl).toBeTruthy();
    assertNativePatchPayloadInvariants(pl, { ghCount: 1, deliveryCost: dc });
    const ghs = pl.line_items_v2.filter((L) => L && String(L.kind).toLowerCase() === 'greenhouse');
    expect(Number(ghs[0].line_total_locked)).not.toBe(baseLocked);
  });

  test('ground-hooks-only on one native line: PATCH cohesive; single GH repriced', async ({ page }) => {
    const dc = 490;
    const baseLocked = 92200;
    const captured = [];
    await routeGetMocksAndPatchIntercept(page, captured, { [ID_HOOKS_ONLY]: mockSingleLineBaseline(ID_HOOKS_ONLY, '79000000103', baseLocked, dc) });
    await openNativeOrder(page, ID_HOOKS_ONLY);
    await editFirstLineCheckboxThenSave(page, 'edit-order-add-ground-hooks');
    const pl = pickCompositionPatch(captured);
    expect(pl).toBeTruthy();
    assertNativePatchPayloadInvariants(pl, { ghCount: 1, deliveryCost: dc });
    const ghs = pl.line_items_v2.filter((L) => L && String(L.kind).toLowerCase() === 'greenhouse');
    expect(Number(ghs[0].line_total_locked)).not.toBe(baseLocked);
  });

  test('on-wood on first line: second line keeps gh-ow-b locked total; not delivery-only', async ({ page }) => {
    const captured = [];
    await routeGetMocksAndPatchIntercept(page, captured, { [ID_ON_WOOD_TWO]: mockOnWoodTwoLines() });
    await openNativeOrder(page, ID_ON_WOOD_TWO);
    await editFirstLineCheckboxThenSave(page, 'edit-order-add-on-wood');
    const pl = pickCompositionPatch(captured);
    expect(pl).toBeTruthy();
    assertNativePatchPayloadInvariants(pl, { ghCount: 2, deliveryCost: 450, lineItemsRows: 2 });
    const ghs = pl.line_items_v2.filter((L) => L && String(L.kind).toLowerCase() === 'greenhouse');
    const gh6 = greenhouseV2ByBillingLength(ghs, 6);
    const gh4 = greenhouseV2ByBillingLength(ghs, 4);
    expect(gh6).toBeTruthy();
    expect(Number(gh6.line_total_locked)).toBe(62002);
    expect(Number(gh6.unit_price_locked)).toBe(62002);
    expect(gh4).toBeTruthy();
    expect(Number(gh4.line_total_locked)).not.toBe(62001);
  });

  test('mixed 3-line: delete third, assembly on second; first line snap locked; removed line_id gone', async ({ page }) => {
    const SNAP_A = 81001;
    const captured = [];
    await routeGetMocksAndPatchIntercept(page, captured, { [ID_MIX3_EDIT]: mockThreeLinesForMix() });
    await openNativeOrder(page, ID_MIX3_EDIT);
    await page.locator('.edit-order-composition-item__btn--del').nth(2).click();
    await expect(page.locator('#edit-order-composition-list .edit-order-composition-item[data-index]')).toHaveCount(2, {
      timeout: 5000,
    });
    await page.locator('.edit-order-composition-item__btn--edit').nth(1).click();
    await page.locator('#edit-order-add-item-panel:not(.hidden)').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForFunction(
      () => document.getElementById('edit-order-add-form') && document.getElementById('edit-order-add-form').value,
      { timeout: 10000 }
    );
    const asm = page.locator('#edit-order-add-assembly');
    await asm.waitFor({ state: 'visible', timeout: 8000 });
    if (!(await asm.isChecked())) await asm.check();
    else await asm.uncheck();
    await page.locator('#edit-order-save-position-btn:not(.hidden)').waitFor({ state: 'visible', timeout: 20000 });
    await page.locator('#edit-order-save-position-btn').click();
    await page.locator('#edit-order-form-hint').filter({ hasText: /изменены|Данные/ }).waitFor({ state: 'visible', timeout: 20000 });

    const pl = pickCompositionPatch(captured);
    expect(pl).toBeTruthy();
    assertNativePatchPayloadInvariants(pl, { ghCount: 2, deliveryCost: 350, lineItemsRows: 2 });
    const ghs = pl.line_items_v2.filter((L) => L && String(L.kind).toLowerCase() === 'greenhouse');
    expect(ghs.some((g) => g.config && Number(g.config.length) === 8)).toBe(false);
    const rowA = greenhouseV2ByBillingLength(ghs, 4);
    const rowB = greenhouseV2ByBillingLength(ghs, 6);
    expect(rowA).toBeTruthy();
    expect(Number(rowA.line_total_locked)).toBe(SNAP_A);
    expect(Number(rowA.unit_price_locked)).toBe(SNAP_A);
    expect(rowB).toBeTruthy();
    expect(Number(rowB.line_total_locked)).not.toBe(81002);
  });

  test('duplicate identical lines + bracing on first: untouched duplicate keeps snapshot 70012; two GH + delivery', async ({ page }) => {
    const captured = [];
    await routeGetMocksAndPatchIntercept(page, captured, { [ID_DUP_BRACING]: mockFifoDuplicateForBracing() });
    await openNativeOrder(page, ID_DUP_BRACING);
    await editFirstLineCheckboxThenSave(page, 'edit-order-add-bracing');
    const pl = pickCompositionPatch(captured);
    expect(pl).toBeTruthy();
    assertNativePatchPayloadInvariants(pl, { ghCount: 2, deliveryCost: 400, lineItemsRows: 2 });
    const ghs = pl.line_items_v2.filter((L) => L && String(L.kind).toLowerCase() === 'greenhouse');
    const locks = ghs.map((g) => Number(g.line_total_locked));
    expect(locks.filter((x) => x === 70012).length).toBe(1);
    expect(locks.some((x) => x !== 70011)).toBe(true);
  });
});
