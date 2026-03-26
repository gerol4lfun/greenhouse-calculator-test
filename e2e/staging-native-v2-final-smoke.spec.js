// @ts-check
/**
 * LIVE staging: один composition-edit на УЖЕ существующем clean native-заказе (только PATCH).
 * BASE_URL=https://gerol4lfun.github.io/greenhouse-calculator-test/
 * STAGING_EXISTING_ORDER_ID=6500280d-0e93-4750-b34d-0b602ba34da3 (phone 79000000006)
 */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { loginIfNeeded, waitForEditOrderReady, appUrlWithQuery } = require('./helpers');

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

function analyzePatch(patch) {
  const dc = Number(patch.delivery_cost);
  const v2 = parseV2(patch.line_items_v2);
  const li = parseLineItems(patch.line_items);
  const ghV2 = v2 ? v2.filter((l) => l && String(l.kind || '').toLowerCase() === 'greenhouse').length : 0;
  const del = v2 ? v2.find((l) => l && String(l.kind || '').toLowerCase() === 'delivery') : null;
  const delLocked = del != null && del.line_total_locked != null ? Number(del.line_total_locked) : null;
  const hasV2 = patch.line_items_v2 != null && (typeof patch.line_items_v2 === 'object' || String(patch.line_items_v2).length > 0);
  return {
    hasLineItemsV2: hasV2,
    delivery_cost: dc,
    line_items_count: li.length,
    greenhouse_count_v2: ghV2,
    delivery_line_locked: delLocked,
    delivery_matches:
      delLocked != null && !isNaN(dc) && !isNaN(delLocked) ? Math.abs(delLocked - dc) < 0.51 : null,
    counts_match: li.length >= 2 ? ghV2 === li.length : null,
  };
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

test.describe.configure({ mode: 'serial' });

test('staging: native v2 final smoke — clean order (PATCH facts)', async ({ page }) => {
  test.setTimeout(300_000);
  const base = process.env.BASE_URL || '';
  if (!base.includes('gerol4lfun.github.io/greenhouse-calculator-test')) {
    test.skip(true, 'BASE_URL must be staging greenhouse-calculator-test');
  }
  const orderId = (process.env.STAGING_EXISTING_ORDER_ID || '6500280d-0e93-4750-b34d-0b602ba34da3').trim();

  /** @type {object[]} */
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

  await page.goto(appUrlWithQuery('id=' + encodeURIComponent(orderId)));
  await page.locator('#edit-order-modal-body[data-step="2"]').waitFor({ state: 'visible', timeout: 25000 });
  await page.locator('.edit-order-composition-item[data-index]').first().waitFor({ state: 'visible', timeout: 20000 });

  const ghRows = page.locator('.edit-order-composition-item[data-index]');
  const n = await ghRows.count();
  /** @type {'add_second_greenhouse' | 'edit_second_line_minimal'} */
  let scenario;

  if (n < 2) {
    scenario = 'add_second_greenhouse';
    await page.locator('#edit-order-add-item-btn').click();
    await page.locator('#edit-order-add-item-panel:not(.hidden)').waitFor({ state: 'visible', timeout: 15000 });
    await fillAddPanelNonFirstLengthThenConfirm(page);
    await expect(page.locator('#edit-order-composition-list .edit-order-composition-item[data-index]')).toHaveCount(n + 1, {
      timeout: 15000,
    });
    // confirmAdd уже кликает #edit-order-save-btn — ждём успех первого PATCH, второй клик не делаем (иначе второй PATCH часто без line_items_v2).
    await page
      .locator('#edit-order-form-hint')
      .filter({ hasText: /изменены|Данные|изменен/i })
      .waitFor({ state: 'visible', timeout: 90000 })
      .catch(async () => {
        await page.locator('text=/Данные по заказу изменены/i').waitFor({ state: 'visible', timeout: 5000 });
      });
  } else {
    scenario = 'edit_second_line_minimal';
    await ghRows.nth(1).locator('.edit-order-composition-item__btn--edit').click();
    await page.locator('#edit-order-add-item-panel:not(.hidden)').waitFor({ state: 'visible', timeout: 25000 });
    await page.locator('#edit-order-save-position-btn').waitFor({ state: 'visible', timeout: 25000 });

    const bracing = page.locator('#edit-order-add-bracing');
    await bracing.waitFor({ state: 'visible', timeout: 10000 });
    const wasDisabled = await bracing.isDisabled();
    if (wasDisabled) {
      await page.locator('#edit-order-add-drip-irrigation-mech-qty').selectOption('1');
    } else {
      await bracing.click();
    }

    await page.locator('#edit-order-add-calc-btn').click();
    await page.locator('#edit-order-add-breakdown:not(.hidden)').waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
    await page.locator('#edit-order-save-position-btn').click();
    await page.locator('#edit-order-add-item-panel').waitFor({ state: 'hidden', timeout: 20000 });
  }

  if (scenario === 'edit_second_line_minimal') {
    await page.locator('#edit-order-save-btn').click();
    await page
      .locator('#edit-order-form-hint')
      .filter({ hasText: /изменены|Данные|изменен/i })
      .waitFor({ state: 'visible', timeout: 90000 })
      .catch(async () => {
        await page.locator('text=/Данные по заказу изменены/i').waitFor({ state: 'visible', timeout: 5000 });
      });
  }

  function pickCompositionPatch(payloads) {
    const withV2 = payloads.filter((p) => p && p.line_items_v2 != null);
    if (withV2.length) return withV2[withV2.length - 1];
    const withMultiLi = payloads.filter((p) => {
      const li = parseLineItems(p.line_items);
      return li.length >= 2;
    });
    if (withMultiLi.length) return withMultiLi[withMultiLi.length - 1];
    return payloads.length ? payloads[payloads.length - 1] : null;
  }

  const compositionPatch = pickCompositionPatch(patchPayloads);
  const analysis = compositionPatch ? analyzePatch(compositionPatch) : null;

  const out = {
    stagingUrl: base,
    orderId,
    phoneNote: '79000000006',
    scenario,
    compositionLinesBefore: n,
    patchPayloadsCount: patchPayloads.length,
    compositionPatchAnalysis: analysis,
    compositionPatchKeys: compositionPatch ? Object.keys(compositionPatch).sort() : [],
  };

  fs.writeFileSync(path.join(__dirname, '.last-staging-native-v2-final-smoke.json'), JSON.stringify(out, null, 2), 'utf8');
  test.info().attach('facts', { body: JSON.stringify(out, null, 2), contentType: 'application/json' });

  expect(patchPayloads.length).toBeGreaterThan(0);
  expect(compositionPatch && compositionPatch.line_items_v2 != null).toBeTruthy();
  expect(analysis && analysis.delivery_matches === true).toBeTruthy();
  expect(analysis && analysis.counts_match === true).toBeTruthy();
});
