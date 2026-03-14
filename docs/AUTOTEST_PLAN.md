# План автотестов order-flow

**Дата:** 12.03.2026. **Цель:** защитить новый хрупкий слой перед продом.

---

## 1. Почему Playwright

- Уже в проекте (package.json, playwright.config.js).
- Поддержка storageState — один auth-smoke, остальные используют сохранённую сессию.
- Устойчивые локаторы (getByRole, getByTestId).
- Не нужен второй фреймворк.

---

## 2. Тестовая матрица

### 2.1. Local-safe (без submit в Supabase, проходят локально)

| # | Тест | Файл | Цель |
|---|------|------|------|
| 1 | **auth-smoke** | auth-smoke.spec.js | Вход через форму (RPC). Требует TEST_LOGIN, TEST_PASSWORD. |
| 2 | **create-order-basic** | order-flow.spec.js | Расчёт → корзина → форма. Без submit. |
| 3 | **edit-order-search-smoke** | order-flow.spec.js | Модалка edit, поиск по SEARCH_PHONE (78883339999). Желателен существующий заказ. |
| 4 | **gifts-slot-visibility-smoke** | order-flow.spec.js | UI слотов подарков 1/2/3 при росте суммы. Без submit. |
| 5 | **gifts-tier-down-smoke** | order-flow.spec.js | Слотов меньше при удалении позиции из корзины. |

**Запуск local-safe:** `npx playwright test -g "auth-smoke|create-order-basic|edit-order-search-smoke|gifts-slot-visibility-smoke|gifts-tier-down-smoke"`.

**edit-order-comment:** в order-flow помечен local-safe, но сохранение comment в Supabase не проходит (RLS/триггер). UI-шаги и reopen по id проверяются при наличии заказа по SEARCH_PHONE; persistence — не verified.

### 2.2. Integration-required (нужен работающий Supabase и успешный submit)

| # | Тест | Цель |
|---|------|------|
| 1 | **create-order-integration** | Полный submit → waitOrderSuccess. |
| 2 | **create-order-paid-extras** | Submit с допами → edit → состав содержит допы. |
| 3 | **edit-order-date** | Submit → edit даты → save → reopen → дата сохранена. |
| 4 | **edit-order-composition** | Submit → edit (имя, состав) → save → reopen. |
| 5 | **cancelled-order** | Submit → cancel → кнопка «Редактировать» недоступна. |
| 6 | **save-reopen** | Submit → edit (gift по возможности) → save → reopen → состав не пустой. |
| 7 | **gifts-save-reopen** | Submit → edit → выбор подарка (drip-mech) → save → reopen по id → проверка значения в gift-select и #edit-order-gift. |

**Предусловия для integration:** BASE_URL (или localhost:3000), Supabase доступен (insert/update orders), TEST_LOGIN, TEST_PASSWORD, тестовые телефоны (79000000001 …) для создания заказов.

**Статус на localhost:** integration-тесты **not verified** — без работающего Supabase падают на waitOrderSuccess (submit не завершается). На тестовом стенде с Supabase — целевой прогон.

**gifts restore в edit-модалке:** подтверждён **ручной проверкой** (заказ 70000000019, «2 дополнительные форточки», «Капельный полив механический»). Не объявлять закрытым через e2e, пока gifts-save-reopen не зелёный на стенде.

**Multi-item:** не объявлять закрытым; отдельные e2e по 2 одинаковые / 2 разные / удаление позиции не входят в текущую матрицу.

### 2.3. Manual release smoke

- **docs/SMOKE_CHECKLIST.md** — ручной чек-лист перед выкладкой (не автотест).

### 2.4. Legacy / отдельно

- **edit-order.spec.js** — один большой тест «этапы 1–9», зависимость от TEST_PHONE и наличия заказов; sleep-ориентированный. Не входит в обязательный local-safe/integration набор.

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

**Local-safe (обязательно перед выкладкой):**
- Все 5 local-safe тестов зелёные (auth-smoke, create-order-basic, edit-order-search-smoke, gifts-slot-visibility-smoke, gifts-tier-down-smoke). Полный submit на localhost не обязателен.

**Integration (на тестовом стенде):**
- При наличии Supabase/стенда — прогон integration-тестов; gifts-save-reopen в том числе. Локально без бэкенда integration не verified.

---

## 7. Аудит текущего контура

### playwright.config.js
- testDir: ./e2e
- timeout: 45s
- baseURL: localhost:3000
- headless по умолчанию
- trace on first retry, screenshot on failure
- projects: auth-smoke (без storage), order-flow и edit-order-legacy (storageState: e2e/.auth/user.json).
- globalSetup: e2e/auth.setup.js — сохранение сессии для order-flow/edit-order-legacy.

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
