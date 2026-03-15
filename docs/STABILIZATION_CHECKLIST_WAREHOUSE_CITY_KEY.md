# Стабилизационный чеклист после rollout warehouse_city_key

**Контекст:** rollout шагов 1–3 завершён. Колонка добавлена, write-path пишет, readers (create/edit calendar, region availability) читают warehouse_city_key first с safe fallback. Новые заказы не создаём.

**Цель:** прогон существующими e2e/manual-safe сценариями для проверки стабильности.

---

## 1. Local-safe e2e пакет

**A. Сценарий:** Автоматический smoke — auth, create flow, edit search, gifts UI.

**B. Команда:**
```bash
cd /Users/pavelkulcinskij/Downloads/greenhouse-calculator-main
npx playwright test -g "auth-smoke|create-order-basic|edit-order-search-smoke|gifts-slot-visibility-smoke|gifts-tier-down-smoke"
```

**C. Что подтверждает:** Нет регрессии в auth, форме создания, модалке edit, gifts. Create-order-basic косвенно затрагивает create form (city/region) без submit.

**D. Что проверить после:** Все 5 тестов зелёные. Ошибок в консоли нет.

---

## 2. Edit calendar (79000000028)

**A. Сценарий:** Ручная проверка edit calendar reader — warehouse_city_key first / fallback для заказа с orders.city = «г. Санкт-Петербург».

**B. Команда:**
1. Предусловие: калькулятор доступен на `http://localhost:3000` (локальный сервер или тестовый стенд).
2. Войти (если требуется).
3. Открыть deep link: `http://localhost:3000/?editPhone=79000000028`  
   Или: модалка «Редактировать» → ввести `79000000028` → Найти → выбрать заказ.
4. Открыть блок выбора даты доставки → проверить календарь.

**C. Что подтверждает:** Edit calendar reader использует warehouse_city_key (или fallback orders.city → line_items[].city → derive). Календарь показывает реальные ограничения для СПБ, а не почти все даты зелёными.

**D. Что проверить после:** Календарь ограничен по датам (не «всё зелёное»). В Supabase для заказа 79000000028: при наличии warehouse_city_key — он используется; при отсутствии — fallback сработал без ошибок.

---

## 3. Edit order save (79000000018)

**A. Сценарий:** Ручная проверка write-path при edit — сохранение warehouse_city_key при смене даты доставки.

**B. Команда:**
1. Открыть edit по телефону `79000000018` (deep link или поиск).
2. Изменить дату доставки на другую допустимую.
3. Сохранить (Save).

**C. Что подтверждает:** Edit write-path пишет warehouse_city_key в Supabase. updated_at обновляется.

**D. Что проверить после:** В Supabase `orders` для заказа с client_phone=79000000018: `warehouse_city_key` заполнен (или обновился при edit). `delivery_date` и `updated_at` изменились. Остальные поля (quantity, line_items, status, comment, commercial_offer) не тронуты.

---

## 4. Edit order search (78883339999)

**A. Сценарий:** Поиск заказа в модалке edit — smoke edit path.

**B. Команда:** Входит в local-safe пакет (edit-order-search-smoke). Для ручной проверки:
1. Открыть `http://localhost:3000`, войти.
2. Модалка «Редактировать» → ввести `78883339999` → Найти.
3. При наличии заказов — выбрать, открыть, проверить, что форма заполнена.

**C. Что подтверждает:** Edit path открывается, поиск работает, fallback/readers не ломают загрузку заказа.

**D. Что проверить после:** Заказ открывается, данные отображаются. Нет ошибок в консоли. Регрессии по отображению city/календаря нет.

---

## 5. Cancel flow smoke (79000000066)

**A. Сценарий:** Заказ в статусе cancelled — edit-path блокируется.

**B. Команда:**
1. Открыть edit по телефону `79000000066` (deep link или поиск).
2. Убедиться, что кнопка «Редактировать» скрыта/неактивна или save блокируется.

**C. Что подтверждает:** Cancelled заказы не редактируются. Нет регрессии в логике статусов.

**D. Что проверить после:** Edit для cancelled блокируется. quantity, delivery_date, line_items, commercial_offer не изменились. Регрессий нет.

---

## Итог

| # | Сценарий              | Тип      | Ключевая проверка                          |
|---|------------------------|----------|--------------------------------------------|
| 1 | Local-safe e2e         | Авто     | Регрессия auth/create/edit/gifts           |
| 2 | Edit calendar 79000000028 | Manual | Reader warehouse_city_key / fallback        |
| 3 | Edit save 79000000018  | Manual   | Write-path warehouse_city_key               |
| 4 | Edit search 78883339999| Manual/Авто | Edit path, нет регрессии                 |
| 5 | Cancel 79000000066     | Manual   | Cancelled не редактируется                  |

**Примечание:** Create calendar и region availability в основной форме проверяются косвенно через create-order-basic (без submit). Полный create flow с submit не запускать — новые заказы не создаём.
