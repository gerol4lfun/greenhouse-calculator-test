# Карта источников истины

**Назначение:** при споре или потере контекста — опираться на эти файлы. Не придумывать заново.

**greenhouse-calculator-main** — главный проект и центр общей документации.

---

## Update 2026-03-21 10:52 MSK

### Бизнес-логика жизни заказа

| Статус | Описание |
|--------|----------|
| **active** | Живой рабочий заказ |
| **review** | В активной массе, но требует разбора / подозрительный / зависший / возможно лишний |
| **completed** | Подтверждён как выполненный |
| **archive** | Исторический слой completed-заказов |

### Источники истины по бизнесу (на текущем этапе)

- **Живые заказы:** главная операционная правда = таблица менеджеров.
- **Закрытые заказы:** правда = таблица выполненных / оплачено.
- Поставщик важен, но **не** главный source of truth для нашей стороны.
- Completed подтверждаются **не онлайн**, пачками ~2 раза в месяц.
- Калькулятор нужен, чтобы изменения по живому заказу быстрее и точнее доезжали в рабочий слой.
- *Не подтверждено:* Supabase как финальный единый источник истины для всего бизнеса.

### Literal-preserve / price-lock (текущий проектный курс)

- date-only edit → не должен менять цену
- comment-only edit → не должен менять цену
- opening existing order → не должно само пересчитывать деньги
- Менять можно только реально изменённую часть
- Исторически согласованные деньги — locked snapshot

### Phantom +1000 reopen (21.03.2026)

- Баг **не закрыт.** Новый подтверждённый симптом: 79227144004, date 11.04→12.04, total 46 470→47 470.
- Root cause **НЕ подтверждён.** Suspected: dirty baseline / delivery baseline / cross-contour — но не confirmed.

### Open (на 21.03.2026)

- phantom +1000 still open; root cause not confirmed
- `public.orders` — transitional, not final foundation
- `orders_live_v2` — future direction, not yet switched

---

## Документация (источники истины)

| Файл | За что отвечает | Когда смотреть |
|------|-----------------|----------------|
| **docs/CHANGELOG.md** | История изменений, версии, что зафиксировано | Версия, дата, что уже сделано |
| **docs/context/КОНТЕКСТ_ПРОЕКТА.md** | Карта проекта, инварианты edit flow, подарки, **логика дат доставки и UI календарей** | Потеря контекста, инварианты, delivery_calendar, блок доставки, модалка дат |
| **docs/GIFT_TRUTH.md** | Бизнес-истина подарков (slot model) | Любые изменения в логике подарков |
| **docs/AUDIT_2026-03-20_PHANTOM_DELIVERY_PROBE.md** | Phantom delivery probe: not reproduced in checked calculator-side scenarios | Phantom +1000, delivery payload |
| **docs/AUDIT_2026-03-20_INC002_GIFT_PLUS1000_READONLY.md** | INC-002 gift audit: gift does not explain +1000 in calculator code path | Gift, +1000, INC-002 |
| **docs/PREPROD_PLAN.md** | План до прода (красное/жёлтое/зелёное) | Перед релизом |
| **docs/SMOKE_CHECKLIST.md** | Ручной чек-лист перед выкладкой | Перед релизом |
| **docs/LEGACY_MAP.md** | Что устарело, что legacy | При сомнениях в FAQ/версиях |

---

## Runtime-код калькулятора

| Файл | Роль |
|------|------|
| **index.html** | Точка входа, форма, вкладки КП, модалки (edit, даты) |
| **js/scripts.js** | Вся логика: расчёт, КП, order flow, edit, gifts, save |
| **css/styles.css** | Стили |

**Версия:** `APP_VERSION` в scripts.js, `_projectVersion` в package.json, `?v=` в index.html.

---

## Данные

| Источник | Роль |
|----------|------|
| **Supabase (orders)** | Актуальные заказы. Калькулятор пишет при create/edit; бот читает. |
| **Supabase (prices, users)** | Цены, авторизация. Auth migration — docs/PREPROD_PLAN.md. |
| **Supabase (delivery_calendar)** | Ограничения дат (запреты). Основной слой. Логика — docs/context/КОНТЕКСТ_ПРОЕКТА.md. |
| **Supabase (delivery_dates)** | Fallback дат доставки при отсутствии данных в delivery_calendar. |

---

## Роли документов

- **КОНТЕКСТ_ПРОЕКТА** — логика дат (delivery_calendar, правила доступности).
- **PREPROD_PLAN** — подтверждённые кейсы (Москва, Набережные Челны).
- **sql/ИНСТРУКЦИЯ_ОБНОВЛЕНИЕ_ДАТ.md** — операционное обновление данных.

---

## Инварианты (при споре — истина)

- **gifts = slots.** Fixed bundles не источник истины. См. GIFT_TRUTH.md.
- **Gifts raw-preserve:** legacy gift на existing order не должен автоматически переписываться в канонический формат при edit другого поля. Подтверждено на заказе 8e803d39-db87-4da1-b420-4325a29e0dfb (gift «форточка 1 шт.» сохранился при смене только delivery_date).
- **Phone scope:** legacy dual-phone slash-format («79128974834 / 79085842934») — два номера одного клиента. **Принятая реализация (15.03.2026):** UI reveal-on-demand (основное поле + компактное «+ Добавить доп. номер»), create/edit единый паттерн; второе поле скрыто по умолчанию, раскрывается по клику или при двух номерах в edit; storage: client_phone = "num1" или "num1 / num2"; поиск по любому номеру; untouched raw-preserve. Legacy: не backfill, не нормализуем автоматически.

**Dual-phone UI + untouched legacy (подробно):**

| Аспект | Подтверждённая истина |
|--------|------------------------|
| **Confirmed truths** | Create: второе поле скрыто по умолчанию; «+ Добавить доп. номер» — компактное вторичное действие; раскрытие по клику. Edit: один номер → второе поле скрыто; два номера → второе поле раскрыто и заполнено. Storage: "num1" или "num1 / num2". Untouched phone block → сохраняем raw literally. Поиск по второму номеру для dual-phone записей. |
| **Intentionally not solved** | Backfill legacy orders; автоматическая нормализация старых форматов; отдельный редизайн UI. |
| **Manual checks** | Create с одним/двумя номерами; edit с одним/двумя; edit only date → phone untouched; поиск по второму номеру; после submit/reset второе поле скрыто. |
| **UI create** | Основное поле «Телефон клиента *»; под ним «+ Добавить доп. номер»; после клика — второе поле + «Убрать». |
| **UI edit** | Один номер: второе поле скрыто, видна «+ Добавить доп. номер». Два номера: второе поле раскрыто и заполнено, «Убрать» рядом. |

- **Existing-order edit: untouched legacy fields:** delivery_address и client_phone, которые менеджер не трогал при edit, должны сохраняться literally. Не нормализовать, не пересобирать, не включать в phantom diff. При смене только даты — diff только по дате. Реализовано: _editOrderOriginalAddressRaw, _editOrderOriginalPhoneRaw, touched-флаги; payload использует original при untouched.
- **Legacy single-item total (20.03.2026):** при date-only save total и delivery_cost не должны пересчитываться. Root cause fix: fillEditOrderForm для delivery_cost>0 ставит item_total = total - delivery_cost (item-only amount), а не полный order.total; иначе buildOrderPayloadFromEditModal добавлял delivery_cost повторно. Retest PASS на safe clone (verified 2026-03-20).
- **Legacy single-item comment-only total overwrite (20.03.2026):** comment-only save мог перезаписывать total. Fix: buildOrderPayloadFromEditModal использует lastLoadedOrderTotalForDisplay когда usePersistedForPayload && single-item. Retest PASS на safe clone (verified 2026-03-20). Do not claim full legacy edit stability.
- **Inline vs modal delivery date mismatch (20.03.2026):** resolved for checked edit-order cases. Root cause: inline used order city; modal used default Moscow/SPB. Fix: showDeliveryDatesModal(initialCity); edit-order link «даты по городам» passes order city. Manual PASS 2026-03-20. Remains open: legacy assembly format edge cases; city normalization edge cases; full calendar edge-case coverage not claimed.
- **Edit calendar source-of-truth:** confirmed. Приоритет: warehouse_city_key → orders.city → line_items[].city → fallback derive from address. Alias (МСК, СПБ, Питер) нормализуется. Fix #1 (item.city preserve), fix #2 (prefix strip), fix #3 (numeric city candidate reject — 15.03.2026) внесены. Кейсы: 8e803d39 (city=МСК); 79000000028 (city="г. Санкт-Петербург"); Ivan case (адрес «регион, участок, улица») — canonicalCity=Москва, календарь показывает реальные ограничения. Принято: orders.warehouse_city_key как source of truth (см. ниже).
- **Create flow orders.city (18.03.2026):** source of truth — effectiveCalc.city, fallback addr1. Numeric-only ("7", "1") не сохраняются. Root cause fix: extractCityFromAddress(fullAddress) больше не приоритет.
- **Edit flow line_items[].city (18.03.2026):** после create-flow fix найден оставшийся риск — line_items[].city мог протаскивать исторический numeric-only мусор при save. Фикс применён: isRejectableNumericCityCandidate_ в buildOrderPayloadFromEditModal; numeric-only не пишутся в payload.
- **Исторические bad rows (city="7" closeout 18.03.2026):** 1 боевой 79778829506; остальные numeric-only — тестовые; 3 строки empty city + address отдельно. Blind mass cleanup не нужен. 79778829506 — ручная коррекция; historical — later review. TG не виноват.
- **cancelled** — не редактируется. UI + проверка перед save.
- **Платные допы** — не должны пропадать из long КП из-за логики подарков.
- **slot count** — зависит только от total / preview total.
- **Выбор подарка** — меняет только содержимое слота, не tier.

---

## Архитектурное решение: warehouse_city_key

**Проблема:** delivery logic зависит от смешанных полей orders.city / delivery_address / runtime derive. Это уже приводило к багу edit-calendar (legacy-формат "г. Санкт-Петербург" не попадал в delivery_calendar).

**Принятое решение:** вводим отдельное поле `orders.warehouse_city_key` как source of truth для delivery logic.

**Source of truth для delivery logic:** `orders.warehouse_city_key` — канонический ключ склада/региона (как в delivery_calendar, prices.city_name). Календарь, тариф, проверка «работаем / не работаем» должны опираться на него.

**Переходное legacy:** `delivery_address` остаётся display/input полем. `orders.city` остаётся переходным legacy/display полем, но не главный источник истины для логики.

**Delivery readers:** create calendar, edit calendar, region availability — переведены на warehouse_city_key first. Tariff уже использует канонический nearestCity.name. Safe fallback: warehouse_city_key → orders.city → line_items[].city → derive from address.

**Яндекс-контур:** интеграция с Яндекс.Картами / suggest / geocoder пока не рефакторится — не сносить рабочую схему. Цель: минимальный pre-prod rollout без утопания.

**Rollout plan и legacy strategy:** см. docs/PREPROD_PLAN.md, раздел «warehouse_city_key rollout».

**PGRST204 incident (15.03.2026) — truth freeze:** Confirmed: prod-schema проблема; колонка отсутствовала; добавлена вручную; NOTIFY pgrst; save восстановлен; rollback payload rejected.

**Post-fix cleanup (15.03.2026) — RESOLVED:**
- edit-calendar canonicalCity=1 — fixed, Ivan case verified
- all-green fix — verified
- wrong save path guard — main form submit blocked when edit modal open
- Ivan dual-phone preserve — verified
- legacy composition/title phantom diff fix — verified on Svetlana (change only date → diff only date)
- passive mutation major branches contained

**UNDER DOUBT / NOT REPRODUCED:**
- 28→27 case — audit показал потенциально опасное место в `syncEditOrderCalendarSlotsWithMode()` (selected-date auto-snap: при «недоступной» дате для режима сборки выбранная дата заменяется на `getNearestAvailableDate`). Живой воспроизводимый кейс не подтверждён → code fix не вносился.
- rare legacy scenarios вне уже проверенных кейсов
- **Phantom delivery +1000 (20.03.2026):** targeted delivery probe on existing order with non-zero delivery passed; payload stable. Phantom delivery leak not reproduced in checked calculator-side probe. Gift «2 дополнительные форточки» does not explain +1000 in checked calculator code path. Calculator-side hypotheses weakened; issue not globally closed. TG/sheets/diff layer remains the more plausible next layer. See AUDIT_2026-03-20_PHANTOM_DELIVERY_PROBE.md, AUDIT_2026-03-20_INC002_GIFT_PLUS1000_READONLY.md.

---

## Связанные проекты

- **тг бот заказы теплицы** (TG/GAS order bot) — отдельный контур. GAS-проект (не GitHub-репо). Код не находится внутри greenhouse-calculator-main. Заказы: калькулятор → Supabase → бот → Sheets. Деплой через GAS.
- **telegram-bot/** (delivery-dates bot) — внутри greenhouse-calculator-main. delivery-dates bot, не основной order GAS bot. Репо gerol4lfun/delivery-bot-telegram. Даты доставки. Не order flow.
