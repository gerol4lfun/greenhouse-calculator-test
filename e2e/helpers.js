// @ts-check
/**
 * Хелперы для e2e order-flow тестов.
 * Используют устойчивые локаторы (id), без sleep где возможно.
 */

const path = require('path');
const ADDRESS_FIXTURES = require(path.join(__dirname, 'fixtures', 'addresses.json'));

const TEST_COMMENT = 'ТЕСТОВЫЙ ЗАКАЗ АВТОСИНКА — НЕ ПЕРЕНОСИТЬ!!!';

/** Default address (legacy SPB) — используется, если address fixture не передан. */
const DEFAULT_ADDRESS = {
  part1: 'Ленинградская обл., г. Санкт-Петербург',
  part2: 'Невский пр.',
  part3: 'д. 1',
};

/** Телефон для поиска уже существующего тестового заказа (не случайный). */
const SEARCH_PHONE = '78883339999';

/**
 * Тестовый телефон для создания заказа (11 цифр, не боевой).
 */
function testPhone(suffix = '001') {
  return '790000000' + String(suffix).padStart(2, '0').slice(-2);
}

/**
 * Дождаться готовности staging app для edit-order flow после auth.
 * Fail с явным сообщением, если UI не готов.
 */
async function waitForEditOrderReady(page, timeout = 15000) {
  const calc = page.locator('#calculator-container');
  await calc.waitFor({ state: 'visible', timeout }).catch(() => {
    throw new Error('Staging app not ready for edit-order flow after auth: #calculator-container not visible');
  });
  const card = page.locator('#edit-orders-card');
  await card.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
    throw new Error('Staging app not ready for edit-order flow after auth: #edit-orders-card not visible');
  });
}

/**
 * Логин на странице (если auth виден).
 */
async function loginIfNeeded(page, login, password) {
  const auth = page.locator('#auth-container');
  if (!(await auth.isVisible().catch(() => false))) return false;
  await page.locator('#login').fill(login);
  await page.locator('#password').fill(password);
  const loginBtn = page.locator('#auth-container button:has-text("Войти")');
  await loginBtn.waitFor({ state: 'visible', timeout: 5000 });
  await loginBtn.click({ force: true });
  await page.waitForSelector('#auth-container', { state: 'hidden', timeout: 15000 });
  return true;
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
 * @param {object} opts.address — optional fixture из ADDRESS_FIXTURES (part1, part2, part3). Не передан — legacy SPB.
 */
async function fillAndSubmitOrderForm(page, { phone, name = 'E2E Test', comment = TEST_COMMENT, address }) {
  const addr = address && address.part1 ? address : DEFAULT_ADDRESS;
  await page.locator('#order-client-name').fill(name);
  await page.locator('#order-client-phone').fill(phone);
  await page.locator('#order-source').selectOption({ index: 1 });
  await page.locator('#order-manager').selectOption({ index: 1 });
  await page.locator('#order-address-part1').fill(addr.part1);
  await page.locator('#order-address-part2').fill(addr.part2);
  await page.locator('#order-address-part3').fill(addr.part3);
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
  // Wait for fetchOrderById to fully resolve (renderEditOrderCompositionList) so that
  // the 2nd showEditOrderStep(2) has already run; otherwise it may close the item panel later.
  await page.locator('.edit-order-composition-item').first().waitFor({ state: 'visible', timeout: 10000 });
  return orderId;
}

/**
 * URL приложения с query — сохраняет subpath (GitHub Pages /greenhouse-calculator-test/).
 * Root-absolute /?id=... дропает subpath и ведёт на origin root.
 */
function appUrlWithQuery(queryString) {
  const base = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '') || '/';
  return base + '/?' + queryString;
}

/** Root URL приложения с сохранением path (важно для GitHub Pages subpath). */
function appRootUrl() {
  return (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '') + '/';
}

/**
 * Открыть модалку редактирования по order id (deep link ?id=).
 * Гарантирует тот же заказ при reopen, не зависит от порядка в списке по телефону.
 */
async function openEditOrderById(page, orderId) {
  const url = appUrlWithQuery('id=' + encodeURIComponent(orderId));
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const didLogin = await loginIfNeeded(page, process.env.TEST_LOGIN, process.env.TEST_PASSWORD);
  if (didLogin) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  }
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.locator('#edit-order-loading-overlay.hidden').waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
  await page.locator('#edit-order-modal:not(.hidden)').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  await page.locator('#edit-order-modal-body[data-step="2"]').waitFor({ state: 'visible', timeout: 25000 });
  await page.locator('.edit-order-composition-item').first().waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('#edit-order-add-item-panel').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
}

/**
 * Сохранить заказ в модалке редактирования.
 */
async function saveEditOrder(page) {
  await page.locator('#edit-order-save-btn').click();
  await page.waitForFunction(() => {
    const body = document.getElementById('edit-order-modal-body');
    const hint = document.getElementById('edit-order-form-hint');
    const step = body ? body.getAttribute('data-step') : '';
    const hintText = hint ? (hint.textContent || '') : '';
    return step === '1' || (step === '2' && /изменены|Данные по заказу изменены/i.test(hintText));
  }, { timeout: 15000 });
}

/**
 * Снимок UI модалки редактирования (delivery, total, address, line_items, gift).
 * Поля могут быть null, если не видимы или недоступны.
 */
async function getEditOrderSnapshot(page) {
  const s = {
    delivery_date_display: null,
    total_display: null,
    line_items_count: null,
    delivery_line_display: null,
    gift_display: null,
    address_part1: null,
    address_part2: null,
    address_part3: null,
    comment_preview: null,
    source: null,
  };
  const fields = [
    ['delivery_date_display', '#edit-order-delivery-date-display', 'inputValue'],
    ['total_display', '#edit-order-composition-total', 'textContent'],
    ['address_part1', '#edit-order-address-part1', 'inputValue'],
    ['address_part2', '#edit-order-address-part2', 'inputValue'],
    ['address_part3', '#edit-order-address-part3', 'inputValue'],
    ['gift_display', '#edit-order-gift', 'inputValue'],
    ['comment_preview', '#edit-order-comment', 'inputValue'],
    ['source', '#edit-order-source', 'inputValue'],
  ];
  for (const [key, selector, method] of fields) {
    try {
      const el = page.locator(selector);
      if (await el.isVisible()) s[key] = (await el[method]())?.trim?.() ?? null;
    } catch (_) {}
  }
  try {
    s.line_items_count = await page.locator('#edit-order-composition-list .edit-order-composition-item').count();
  } catch (_) {}
  try {
    const deliveryLine = page.locator('.edit-order-composition-item:has-text("Доставка") .edit-order-composition-item__price');
    if (await deliveryLine.isVisible()) s.delivery_line_display = (await deliveryLine.textContent())?.trim() || null;
  } catch (_) {}
  return s;
}

/**
 * Изменить дату доставки в модалке: клик по календарю, выбор available day по индексу (0 = первый).
 */
async function changeEditOrderDeliveryDate(page, dayIndex = 1) {
  await page.locator('#edit-order-delivery-date-display').click();
  const otherDayBtn = page.locator('#edit-order-calendar .order-cal-day.available:not(.selected)').first();
  if (await otherDayBtn.isVisible().catch(() => false)) {
    await otherDayBtn.click();
    return;
  }
  const dayBtn = page.locator('#edit-order-calendar .order-cal-day.available').nth(dayIndex);
  await dayBtn.waitFor({ state: 'visible', timeout: 8000 });
  await dayBtn.click();
}

/**
 * Заполнить адрес в модалке из fixture { part1, part2, part3 }.
 */
async function changeEditOrderAddress(page, fixture) {
  if (fixture.part1) await page.locator('#edit-order-address-part1').fill(fixture.part1);
  if (fixture.part2) await page.locator('#edit-order-address-part2').fill(fixture.part2);
  if (fixture.part3) await page.locator('#edit-order-address-part3').fill(fixture.part3);
}

module.exports = {
  ADDRESS_FIXTURES,
  TEST_COMMENT,
  SEARCH_PHONE,
  appRootUrl,
  appUrlWithQuery,
  testPhone,
  loginIfNeeded,
  waitForSelectOptions,
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
  waitForEditOrderReady,
  getEditOrderSnapshot,
  changeEditOrderDeliveryDate,
  changeEditOrderAddress,
};
