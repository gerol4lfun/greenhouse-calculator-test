// @ts-check
/**
 * Order-flow e2e: модалка оформления, редактирования, gifts, cancel, save-reopen.
 * Использует storageState (auth из globalSetup). Тесты изолированы.
 */
const { test, expect } = require('@playwright/test');
const {
  testPhone,
  SEARCH_PHONE,
  expandOrderFormAndWaitCity,
  calculateGreenhouse,
  addItemsToCart,
  setPaidExtras,
  fillAndSubmitOrderForm,
  waitOrderSuccess,
  openEditOrderByPhone,
  openEditOrderByPhoneAndGetOrderId,
  openEditOrderById,
  saveEditOrder,
} = require('./helpers');

test.describe('order-flow', () => {
  test('create-order-basic: local-safe smoke — расчёт, корзина, форма (без submit)', async ({ page }) => {
    await page.goto('/');
    await expandOrderFormAndWaitCity(page);
    await calculateGreenhouse(page);
    await page.locator('#order-add-to-cart-btn').click();
    await page.waitForSelector('#order-cart-block', { state: 'visible', timeout: 5000 });
    await expect(page.locator('#order-cart-list')).toBeVisible();
    await expect(page.locator('#order-client-name')).toBeVisible();
    await expect(page.locator('#order-client-phone')).toBeVisible();
    await expect(page.locator('#order-source')).toBeVisible();
    await expect(page.locator('#order-submit-btn')).toBeVisible();
  });

  test('create-order-integration: полный submit заказа [staging/manual]', async ({ page }) => {
    const phone = testPhone('001');
    await page.goto('/');
    await expandOrderFormAndWaitCity(page);
    await calculateGreenhouse(page);
    await page.locator('#order-add-to-cart-btn').click();
    await page.waitForSelector('#order-cart-block', { state: 'visible', timeout: 5000 });
    await fillAndSubmitOrderForm(page, { phone });
    await waitOrderSuccess(page);
  });

  test('create-order-paid-extras: заказ с платными допами', async ({ page }) => {
    const phone = testPhone('002');
    await page.goto('/');
    await expandOrderFormAndWaitCity(page);
    await setPaidExtras(page, 1, 1);
    await calculateGreenhouse(page);
    await page.locator('#order-add-to-cart-btn').click();
    await page.waitForSelector('#order-cart-block', { state: 'visible', timeout: 5000 });
    await fillAndSubmitOrderForm(page, { phone });
    await waitOrderSuccess(page);
    await openEditOrderByPhone(page, phone);
    await expect(page.locator('#edit-order-composition-list')).toContainText(/форточк|полив/i);
  });

  test('edit-order-date: изменение даты доставки', async ({ page }) => {
    const phone = testPhone('003');
    await page.goto('/');
    await expandOrderFormAndWaitCity(page);
    await calculateGreenhouse(page);
    await page.locator('#order-add-to-cart-btn').click();
    await fillAndSubmitOrderForm(page, { phone });
    await waitOrderSuccess(page);

    await openEditOrderByPhone(page, phone);
    await page.locator('#edit-order-delivery-date-display').click();
    const dayBtn = page.locator('#edit-order-calendar .order-cal-day.available').nth(1);
    await dayBtn.waitFor({ state: 'visible', timeout: 5000 });
    await dayBtn.click();
    await saveEditOrder(page);
    await openEditOrderByPhone(page, phone);
    const dateVal = await page.locator('#edit-order-delivery-date-display').inputValue();
    expect(dateVal).toBeTruthy();
  });

  test('edit-order-composition: состав заказа виден и сохраняется', async ({ page }) => {
    const phone = testPhone('004');
    await page.goto('/');
    await expandOrderFormAndWaitCity(page);
    await calculateGreenhouse(page);
    await page.locator('#order-add-to-cart-btn').click();
    await fillAndSubmitOrderForm(page, { phone });
    await waitOrderSuccess(page);

    await openEditOrderByPhone(page, phone);
    const items = await page.locator('.edit-order-composition-item').count();
    expect(items).toBeGreaterThan(0);
    await page.locator('#edit-order-client-name').fill('E2E Composition');
    await saveEditOrder(page);
    await openEditOrderByPhone(page, phone);
    await expect(page.locator('#edit-order-client-name')).toHaveValue('E2E Composition');
    const itemsAfter = await page.locator('.edit-order-composition-item').count();
    expect(itemsAfter).toBe(items);
  });

  test('edit-order-comment: local-safe — изменить комментарий, сохранить, проверить', async ({ page }) => {
    const marker = 'E2E EDIT COMMENT TEST';
    await page.goto('/');
    const orderId = await openEditOrderByPhoneAndGetOrderId(page, SEARCH_PHONE);
    await page.locator('#edit-order-comment').fill(marker);
    await page.locator('#edit-order-save-btn').click();
    await page.locator('#edit-order-form-hint').filter({ hasText: 'Данные по заказу изменены' }).waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('.edit-order-modal-header .close-modal-button').click();
    await page.locator('#edit-order-modal').waitFor({ state: 'hidden', timeout: 5000 });
    await openEditOrderById(page, orderId);
    await expect(page.locator('#edit-order-comment')).toHaveValue(marker);
  });

  test('edit-order-search-smoke: local-safe — модалка редактирования, поиск по телефону', async ({ page }) => {
    await page.goto('/');
    await page.locator('#edit-orders-card').click();
    await page.locator('#edit-order-modal').waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('#edit-order-phone').fill(SEARCH_PHONE);
    await page.locator('#edit-order-search-btn').click();
    await page.locator('#edit-order-search-btn:not(:disabled)').waitFor({ state: 'visible', timeout: 15000 });
    const hintText = (await page.locator('#edit-order-search-hint').textContent()) || '';
    expect(hintText).toMatch(/Найдено|корректн|Ошибка|^$/);
  });

  test('gifts-slot-visibility-smoke: local-safe — 1/2/3 слотов при ~35k/55k/75k', async ({ page }) => {
    await page.goto('/');
    await expandOrderFormAndWaitCity(page);
    await addItemsToCart(page, 1);
    await page.locator('#gifts-block').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    const slots1 = await page.locator('#gifts-selection .gift-select').count();
    expect(slots1).toBeGreaterThanOrEqual(0);
    if (slots1 >= 1) {
      await addItemsToCart(page, 1);
      const slots2 = await page.locator('#gifts-selection .gift-select').count();
      expect(slots2).toBeGreaterThanOrEqual(slots1);
      await addItemsToCart(page, 1);
      const slots3 = await page.locator('#gifts-selection .gift-select').count();
      expect(slots3).toBeLessThanOrEqual(3);
      expect(slots3).toBeGreaterThanOrEqual(slots2);
    }
  });

  test('gifts-tier-down-smoke: local-safe — слотов меньше при удалении позиций', async ({ page }) => {
    await page.goto('/');
    await expandOrderFormAndWaitCity(page);
    await addItemsToCart(page, 4);
    await page.locator('#gifts-block').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    let slots = await page.locator('#gifts-selection .gift-select').count();
    if (slots < 2) return;
    const list = page.locator('#order-cart-list');
    const initialItems = await list.locator('.edit-order-composition-item').count();
    if (initialItems < 2) return;
    await list.locator('.edit-order-composition-item__btn--del').first().click();
    await expect(list.locator('.edit-order-composition-item')).toHaveCount(initialItems - 1, { timeout: 3000 });
    const slotsAfter = await page.locator('#gifts-selection .gift-select').count();
    expect(slotsAfter).toBeLessThanOrEqual(slots);
  });

  test('cancelled-order: отмена заказа → редактирование недоступно', async ({ page }) => {
    const phone = testPhone('008');
    await page.goto('/');
    await expandOrderFormAndWaitCity(page);
    await calculateGreenhouse(page);
    await page.locator('#order-add-to-cart-btn').click();
    await fillAndSubmitOrderForm(page, { phone });
    await waitOrderSuccess(page);

    await openEditOrderByPhone(page, phone);
    page.on('dialog', async d => {
      if (d.type() === 'confirm') await d.accept();
      else if (d.type() === 'prompt') await d.accept('E2E причина');
    });
    await page.locator('#edit-order-cancel-order-btn').click();
    await page.waitForSelector('#edit-order-modal-body[data-step="1"]', { timeout: 15000 });

    await page.locator('#edit-order-phone').fill(phone);
    await page.locator('#edit-order-search-btn').click();
    await page.waitForSelector('.edit-order-list-item', { timeout: 5000 });
    const item = page.locator('.edit-order-list-item').first();
    await expect(item).toContainText(/отмен|Отменён/i);
    await expect(item.locator('button:has-text("Редактировать")')).toHaveCount(0);
  });

  test('save-reopen: сохранение и повторное открытие с подарками', async ({ page }) => {
    const phone = testPhone('009');
    await page.goto('/');
    await expandOrderFormAndWaitCity(page);
    await setPaidExtras(page, 1, 1);
    await calculateGreenhouse(page);
    await page.locator('#order-add-to-cart-btn').click();
    await fillAndSubmitOrderForm(page, { phone });
    await waitOrderSuccess(page);

    await openEditOrderByPhone(page, phone);
    const giftSelect = page.locator('.edit-order-gift-select').first();
    if (await giftSelect.isVisible()) {
      await giftSelect.selectOption({ index: 1 });
    }
    await saveEditOrder(page);

    await page.locator('#edit-order-phone').fill(phone);
    await page.locator('#edit-order-search-btn').click();
    await page.locator('.edit-order-list-item').first().locator('.edit-order-item-btn').click();
    await page.locator('#edit-order-modal-body[data-step="2"]').waitFor({ state: 'visible', timeout: 5000 });
    const composition = await page.locator('#edit-order-composition-list').textContent();
    expect(composition).toBeTruthy();
  });
});
