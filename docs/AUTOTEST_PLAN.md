# План автотестов order-flow

**Дата:** 12.03.2026. **Цель:** защитить новый хрупкий слой перед продом.

---

## 1. Почему Playwright

- Уже в проекте (package.json, playwright.config.js).
- Поддержка storageState — один auth-smoke, остальные используют сохранённую сессию.
- Устойчивые локаторы (getByRole, getByTestId).
- Не нужен второй фреймворк.

---

## 2. Что покрываем до прода

### Accepted local-safe smoke (5 тестов, проходят локально)

| # | Тест | Цель |
|---|------|------|
| 1 | **auth-smoke** | Реальный вход после auth-hotfix (RPC authenticate_user). |
| 2 | **create-order-basic** | Расчёт → корзина → форма заказа. Без submit. |
| 3 | **edit-order-search-smoke** | Модалка редактирования, поиск по телефону 78883339999. |
| 4 | **gifts-slot-visibility-smoke** | UI gift slots: 1/2/3 слотов при росте суммы. Без submit. |
| 5 | **gifts-tier-down-smoke** | Слотов меньше при удалении позиций из корзины. |

**Ограничение gifts:** текущие gift smoke — partial coverage, не полный regression suite. Проверяют только UI слотов в форме заказа при добавлении/удалении позиций. Не заменяют полный gift regression (edit-order gifts, сохранение в Supabase, подарки в КП). Threshold fix на главной форме (total < 35k → gift пустой) подтверждён браузерной проверкой, не автотестом.

### Integration / staging (7 тестов, не обязательны на localhost)

| # | Тест | Цель |
|---|------|------|
| 1 | **create-order-integration** | Полный submit заказа. |
| 2 | **create-order-paid-extras** | Заказ с платными допами → допы в составе. |
| 3 | **edit-order-date** | Изменить дату → Save → проверка. |
| 4 | **edit-order-composition** | Добавить/удалить позицию → Save. |
| 5 | **edit-order-extras** | Изменить платные допы → Save. |
| 6 | **cancelled-order** | Отменить заказ → «Редактировать» недоступна. |
| 7 | **save-reopen** | Edit → Save → reopen → данные восстановились. |

### Consciously deferred

| Тест | Причина |
|------|---------|
| **edit-order-comment** | Сохранение comment в Supabase не проходит (RLS/триггер). OrderId strategy внедрена, тест ждёт фикса бэкенда. |
| **gifts full regression** | gifts-slot-visibility-smoke и gifts-tier-down-smoke — partial. Edit-order gifts, сохранение, КП — отложено. |

---

## 3. Что не покрываем

- Полный flow до TG-уведомлений (TG — отдельный контур).
- Все комбинации форм/размеров теплиц.
- Модалка дат доставки.
- Админ-панель (отключена).
- Геокодер, Яндекс.Карты.

---

## 4. Безопасность тестов

| Элемент | Реализация |
|---------|------------|
| **Test user** | Отдельный пользователь в Supabase `users` (например `e2e_test`). Логин/пароль только в .env. |
| **Test phone** | Для создания: `79000000001`, `79000000002` и т.д. Не боевой. |
| **Test comment** | В каждом тестовом заказе: `ТЕСТОВЫЙ ЗАКАЗ АВТОСИНКА — НЕ ПЕРЕНОСИТЬ!!!` |
| **Search phone** | Поиск существующего заказа: `78883339999`. Не использовать случайные номера. |
| **TG-уведомления** | Калькулятор пишет в Supabase. TG-бот читает оттуда. Варианты: (a) тестовый Supabase project; (b) в тг боте — игнорировать заказы с comment «ТЕСТОВЫЙ ЗАКАЗ АВТОСИНКА»; (c) принять, что тестовые заказы могут вызвать уведомления — минимизировать количество. |
| **Боевые данные** | Не трогать. Тесты создают только заказы с test phone и test comment. |

---

## 5. Данные и пользователи

| Переменная | Описание |
|------------|----------|
| `TEST_LOGIN` | Логин test user (e2e_test). |
| `TEST_PASSWORD` | Пароль. Только в .env. |
| `TEST_PHONE` | Для поиска: `78883339999`. Для создания: `79000000001`, `79000000002` и т.д. |
| `BASE_URL` | http://localhost:3000 (или тестовый стенд). |

---

## 6. Критерий «можно выкатывать»

**Accepted local-safe (локально):**
- auth-smoke, create-order-basic, edit-order-search-smoke, gifts-slot-visibility-smoke, gifts-tier-down-smoke — все 5 проходят.
- Полный submit **не** обязателен на localhost.

**Integration / staging:**
- Все integration-тесты проходят на тестовом стенде.
- auth-smoke подтверждает вход через RPC.

---

## 7. Аудит текущего контура

### playwright.config.js
- testDir: ./e2e
- timeout: 45s
- baseURL: localhost:3000
- headless по умолчанию
- trace on first retry, screenshot on failure
- Один project: chromium

**Не хватает:** storageState, globalSetup для auth.

### e2e/edit-order.spec.js
- Один большой тест «этапы 1–9».
- Логин через fill + click (до auth-hotfix).
- Много `waitForTimeout` (2000, 1200, 800 и т.д.) — хрупко.
- Использует TEST_PHONE из orders — может не быть заказов.
- record()/writeResults() — кастомный отчёт.
- Локаторы: #edit-order-phone, .edit-order-list-item, #edit-order-save-btn — устойчивые (id).

**Устарело:** логин через #login/#password — после v271 нужен RPC (тот же UI, но бэкенд другой). Логин по-прежнему через форму, RPC вызывается при submit — тест не меняется.
**Слабо:** зависимость от наличия заказов по TEST_PHONE; sleep вместо waitForSelector.

---

## 8. data-testid план (минимальный)

Текущие id достаточны для большинства сценариев. Добавить data-testid только где id нет или селектор хрупкий:

| Элемент | Рекомендация |
|---------|--------------|
| Кнопка «Войти» | Уже есть `button:has-text("Войти")` — ок. |
| Блок успеха заказа | `#order-result` + `.order-result-message` — ок. |
| Кнопка «Добавить в заказ» (в корзине) | `#order-add-to-cart-btn` — ок. |
| Кнопка «Оформить заказ» | `#order-submit-btn` — уже есть. |
| Toast | Нет стабильного id — для gifts-tier ждать по тексту или пропустить проверку toast. |
| Слоты подарков в edit | Класс/селектор — проверить в DOM при реализации. |

**Минимальные правки:** id достаточно. data-testid не требуются для первого релиза.

---

## 9. Порядок внедрения

1. **Сделано:** e2e/auth.setup.js, playwright.config.js (globalSetup, projects), e2e/order-flow.spec.js, e2e/helpers.js.
2. **Запуск local-safe:** `npx playwright test -g "auth-smoke|create-order-basic|edit-order-search-smoke|gifts-slot-visibility-smoke|gifts-tier-down-smoke"`.
3. **Не трогать до прода:** старый edit-order.spec.js; бизнес-логику; TG-контур.
