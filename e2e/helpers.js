// @ts-check
/**
 * Хелперы для e2e order-flow тестов.
 * Используют устойчивые локаторы (id), без sleep где возможно.
 */

const TEST_COMMENT = 'ТЕСТОВЫЙ ЗАКАЗ АВТОСИНКА — НЕ ПЕРЕНОСИТЬ!!!';

/** Телефон для поиска уже существующего тестового заказа (не случайный). */
const SEARCH_PHONE = '78883339999';

/**
 * Тестовый телефон для создания заказа (11 цифр, не боевой).
 */
function testPhone(suffix = '001') {
  return '790000000' + String(suffix).padStart(2, '0').slice(-2);
}

/**
 * Логин на странице (если auth виден).
 */
async function loginIfNeeded(page, login, password) {
  const auth = page.locator('#auth-container');
  if (!(await auth.isVisible())) return;
  await page.locator('#login').fill(login);
  await page.locator('#password').fill(password);
  await page.locator('button:has-text("Войти")').click();
  await page.waitForSelector('#auth-container.hidden', { timeout: 15000 });
}

/**
 * Дождаться, что у select есть хотя бы одна option с непустым value.
 * Безопасно для option (не требует visible).
 */
async function waitForSelectOptions(page, selectId, timeout = 10000) {
  await page.waitForFunction(
    (id) => document.querySelectorAll(`#${id} option[value]:not([value=""])`).length > 0,
    selectId,
    { timeout }
  );
}

/**
 * Выбрать первый доступный option в select (не пустой value).
 */
async function selectFirstOption(page, selectId) {
  const sel = page.locator(`#${selectId}`);
  await sel.waitFor({ state: 'visible', timeout: 10000 });
  const opts = await sel.locator('option').all();
  for (const opt of opts) {
    const v = await opt.getAttribute('value');
    if (v && v.trim()) {
      await sel.selectOption(v);
      return v;
    }
  }
  throw new Error(`selectFirstOption: нет опций в #${selectId}`);
}

/**
 * Развернуть форму заказа и дождаться загрузки города.
 * Город должен быть выбран до раскрытия, чтобы календарь дат подтянулся.
 */
async function expandOrderFormAndWaitCity(page) {
  await waitForSelectOptions(page, 'city', 15000);
  await selectFirstOption(page, 'city');
  const card = page.locator('#order-card');
  const collapse = page.locator('#order-collapse');
  const hasOpen = await collapse.evaluate(el => el.classList.contains('open'));
  if (!hasOpen) {
    await card.click();
    await page.waitForSelector('#order-collapse.open', { timeout: 3000 });
  }
  await page.waitForSelector('#order-delivery-date-display', { state: 'visible', timeout: 5000 });
}

/**
 * Рассчитать теплицу: город → форма → ширина → длина → каркас → поликарбонат → Рассчитать.
 * Строгий порядок: дождаться options → выбрать → следующий select.
 */
async function calculateGreenhouse(page) {
  await waitForSelectOptions(page, 'city', 15000);
  await selectFirstOption(page, 'city');
  await waitForSelectOptions(page, 'form', 5000);
  await selectFirstOption(page, 'form');
  await waitForSelectOptions(page, 'width', 5000);
  await selectFirstOption(page, 'width');
  await waitForSelectOptions(page, 'length', 5000);
  await selectFirstOption(page, 'length');
  await waitForSelectOptions(page, 'frame', 5000);
  await selectFirstOption(page, 'frame');
  await waitForSelectOptions(page, 'polycarbonate', 5000);
  await selectFirstOption(page, 'polycarbonate');
  await page.locator('button:has-text("Рассчитать стоимость теплицы")').click();
  await page.waitForSelector('#order-add-to-cart-btn:not([disabled])', { timeout: 10000 }).catch(() => {});
}

/**
 * Добавить N одинаковых позиций в корзину (расчёт 1 раз, затем N кликов «Добавить в заказ»).
 * Для gifts smoke: 1 позиция ~35k→1 слот, 2 ~55k→2, 3 ~75k→3 (зависит от цен).
 */
async function addItemsToCart(page, count) {
  await calculateGreenhouse(page);
  for (let i = 0; i < count; i++) {
    await page.locator('#order-add-to-cart-btn').click();
    await page.waitForSelector('#order-add-to-cart-btn:not([disabled])', { timeout: 5000 }).catch(() => {});
  }
  await page.waitForSelector('#order-cart-block', { state: 'visible', timeout: 5000 });
}

/**
 * Добавить платные допы перед расчётом (форточка, полив).
 */
async function setPaidExtras(page, windowQty = 0, dripMechQty = 0) {
  if (windowQty > 0) await page.locator('#additional-window-qty').selectOption(String(windowQty));
  if (dripMechQty > 0) await page.locator('#drip-irrigation-mech-qty').selectOption(String(dripMechQty));
}

/**
 * Заполнить форму заказа (create) и отправить.
 */
async function fillAndSubmitOrderForm(page, { phone, name = 'E2E Test', comment = TEST_COMMENT }) {
  await page.locator('#order-client-name').fill(name);
  await page.locator('#order-client-phone').fill(phone);
  await page.locator('#order-source').selectOption({ index: 1 });
  await page.locator('#order-manager').selectOption({ index: 1 });
  await page.locator('#order-address-part1').fill('Ленинградская обл., г. Санкт-Петербург');
  await page.locator('#order-address-part2').fill('Невский пр.');
  await page.locator('#order-address-part3').fill('д. 1');
  if (comment) await page.locator('#order-comment').fill(comment);
  // Дата: клик по календарю, выбрать первую доступную дату (зелёная — в слотах доставки)
  await page.locator('#order-delivery-date-display').click();
  const dayBtn = page.locator('#order-calendar .order-cal-day.available').first();
  await dayBtn.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
  if (await dayBtn.isVisible()) await dayBtn.click();
  await page.locator('#order-submit-btn').click();
}

/**
 * Дождаться успешного результата заказа.
 */
async function waitOrderSuccess(page) {
  const result = page.locator('#order-result');
  await result.waitFor({ state: 'visible', timeout: 15000 });
  const text = await result.textContent();
  if (!/готово|оформлен|ура/i.test(text || '')) {
    throw new Error('Ожидался успех заказа, получено: ' + (text || '').slice(0, 100));
  }
}

/**
 * Открыть модалку редактирования, найти по телефону, открыть первый заказ.
 */
async function openEditOrderByPhone(page, phone) {
  await page.locator('#edit-orders-card').click();
  await page.locator('#edit-order-modal').waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('#edit-order-phone').fill(phone);
  await page.locator('#edit-order-search-btn').click();
  await page.locator('.edit-order-list-item').first().waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('.edit-order-list-item').first().locator('.edit-order-item-btn').click();
  await page.locator('#edit-order-modal-body[data-step="2"]').waitFor({ state: 'visible', timeout: 5000 });
}

/**
 * Открыть модалку по телефону, взять data-order-id первого редактируемого заказа, открыть его.
 * Возвращает orderId — для стабильного reopen по ?id= (не путает заказы при нескольких на один телефон).
 */
async function openEditOrderByPhoneAndGetOrderId(page, phone) {
  await page.locator('#edit-orders-card').click();
  await page.locator('#edit-order-modal').waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('#edit-order-phone').fill(phone);
  await page.locator('#edit-order-search-btn').click();
  const editBtn = page.locator('.edit-order-item-btn[data-order-id]').first();
  await editBtn.waitFor({ state: 'visible', timeout: 10000 });
  const orderId = await editBtn.getAttribute('data-order-id');
  if (!orderId || orderId.length < 10) {
    throw new Error('openEditOrderByPhoneAndGetOrderId: не найден data-order-id у кнопки Редактировать');
  }
  await editBtn.click();
  await page.locator('#edit-order-modal-body[data-step="2"]').waitFor({ state: 'visible', timeout: 5000 });
  return orderId;
}

/**
 * Открыть модалку редактирования по order id (deep link ?id=).
 * Гарантирует тот же заказ при reopen, не зависит от порядка в списке по телефону.
 */
async function openEditOrderById(page, orderId) {
  await page.goto(`/?id=${orderId}`);
  await page.locator('#edit-order-modal-body[data-step="2"]').waitFor({ state: 'visible', timeout: 10000 });
}

/**
 * Сохранить заказ в модалке редактирования.
 */
async function saveEditOrder(page) {
  await page.locator('#edit-order-save-btn').click();
  await page.locator('#edit-order-modal-body[data-step="1"]').waitFor({ state: 'visible', timeout: 10000 });
}

module.exports = {
  TEST_COMMENT,
  SEARCH_PHONE,
  testPhone,
  loginIfNeeded,
  selectFirstOption,
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
};
