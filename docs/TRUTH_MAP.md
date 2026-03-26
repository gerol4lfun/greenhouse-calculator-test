# Карта источников истины

**Назначение:** при споре или потере контекста — опираться на эти файлы. Не придумывать заново.

**greenhouse-calculator-main** — главный проект и центр общей документации.

**Обновление верхнего baseline:** 2026-03-26 — см. блок **Latest status** ниже и `docs/STATUS_SNAPSHOT_2026-03-25_NATIVE_LEGACY_V283.md` (дополнение §1.I).

---

## Latest status (2026-03-26) — baseline + live downstream

**Current-state snapshot:** `docs/STATUS_SNAPSHOT_2026-03-25_NATIVE_LEGACY_V283.md` — структурный baseline (имя файла историческое; содержимое дополнено **2026-03-26**).

**Current working policy (кратко):** **legacy** = **date-only only** (full composition edit через калькулятор — **не** норма). **Native:** **composition edit supported**; **one-save** — **текущая норма UX**; **save-position-only** как единственный пользовательский сценарий — **не канон**. **Live create** в тестах **off by default** → **`LIVE_SMOKE_ALLOWED=1`**.

**Канон `BASE_URL`:** `https://gerol4lfun.github.io/greenhouse-calculator-test/` (с `/`).

**Канонические `order id`:**

| Роль | id |
|------|-----|
| Native single-line | `9aac35ca-9d2e-4291-a6aa-e89528278687` (phone **79000000033**) |
| Native two-line | `d8357800-b2c9-4cff-a0a5-0a4f5068d3ff` |
| Legacy date-only `TEST_ORDER_ID` | `121033f7-72f3-48b3-a833-d52444f5424e` |

**E2E lock:** Native — `e2e/staging-existing-native-composition-smoke.spec.js`, project **`staging-existing-native-composition`**. Legacy date-only — `e2e/edit-order.spec.js`, **`edit-order-legacy`**, **`existing-order-date-only-integrity`**. Legacy PATCH contract: **`delivery_date` required**; **`line_items` / `model` not required** (date-only path).

### Живое подтверждение (2026-03-26) — **CONFIRMED** (один заказ, один сценарий)

По **`9aac35ca-9d2e-4291-a6aa-e89528278687`** / **79000000033** после явного изменения состава зафиксировано TG-уведомление вида: **«Заказ изменён · 79000000033»**, блок добавленных позиций (**ТЕПЛИЦА БОЯРСКАЯ 2.5x6** ×2 в тексте), **«Итого: 20 480 ₽ → 56 460 ₽»**. Это принимается как **живое подтверждение** цепочки **calculator → PATCH → sync → Telegram notify** для этого кейса.

**Всё ещё не объявлять закрытым без отдельного доказательства:** повторные подряд правки; полнота downstream/sync/diff/analytics; каждая вариация уведомления.

**Секции с датами 2026-03-21 / 2026-03-22 / 2026-03-23 ниже** — **historical context**, **not latest status**; при конфликте приоритет у snapshot + блоку **2026-03-26** выше.

---

## Update 2026-03-21 10:52 MSK *(historical context — not latest status; baseline: `docs/STATUS_SNAPSHOT_2026-03-25_NATIVE_LEGACY_V283.md`)*

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

## Update 2026-03-22 — Existing single-item locked greenhouse (safe mode) *(historical context — not latest status; baseline: `docs/STATUS_SNAPSHOT_2026-03-25_NATIVE_LEGACY_V283.md`)*

### Current source of truth (2026-03-22)

- **Legacy single-item:** safe mode / locked snapshot path внедрён (commits f6a1f47, bced390, d54e24d).
- **Main save path:** current catalog не обязателен для default existing single-item save — если теплицу не меняли. **Not proven sufficient** — real-base smoke 2026-03-23 выявил total collapse.
- **New order flow:** untouched.

### Native/new vs legacy/manual — split (2026-03-23)

| Класс | Определение | Статус |
|-------|-------------|--------|
| **native/new** | Созданы через калькулятор; line_items присутствует | PASS evidence: order afa926e5, phone 79204934944; date-only save; total 24 990 preserved |
| **legacy/manual** | Старые заказы, вручную внесённые в Google Sheets | Отдельный audit; отдельная smoke logic; не смешивать с native в отладке |

**line_items-present native/new path** уже имеет PASS evidence. Manual legacy orders требуют отдельного audit и отдельной smoke logic. **Do not mix these classes** в future debugging. See AUDIT_2026-03-23_LEGACY_MANUAL_OPEN_EDIT.md.

### Existing-order edit — разграничение путей (2026-03-23)

**Safe-save principle (подтверждён):** если composition/order items не меняли, existing order save должен идти по safe metadata-only payload — без пересборки товарной части, без пересчёта price-locked полей. Old/existing orders keep locked prices unless user actually changes composition.

**Open-edit hydration bug (подтверждён):** часть бага была в open-edit/hydrate flow, не только в save/PATCH. Карточка показывала total 56 020 (или 31 470 для legacy 79202431340), но после «Редактировать» modal сразу показывал 2 550 или 1 000 до save. Исправлено: item_total fallback, single-item backfill, base_price/unit_price recovery for legacy. Reset edit-session state.

**Пути:**

| Путь | Статус |
|------|--------|
| **SAFE METADATA EDIT** (date-only, address-only, comment-only) | existing itemized single-item date-only: **PASS** на Sergey (79260699646). Модалка 56 020; save; total preserved; line_items preserved. address-only — не yet re-verified. |
| **COMPOSITION EDIT** | extra-only, add/remove position — **NOT PROVEN**. Не claim stable. |
| **RECALC / NOT PROVEN** | «Обновить расчёт» для legacy/non-catalog — **NOT READY**. 79045355637: save success, recalc error. Recalc path diverges from save path. Multi-item existing edit — not proven. |

### Commits in main (2026-03-22)

- **d54e24d:** fix(edit): preserve locked base_price on assembly-only edit.
- **bced390:** fix(edit): safe mode for legacy single-item orders.
- **f6a1f47:** feat(edit): safe mode for legacy single-item orders.

### Manual verification evidence

- **Order 5f9a1c7b-b6fd-463e-a326-e313223835d4:** model ТЕПЛИЦА ЦАРСКАЯ ЛЮКС 3М ПРЯМОСТЕННАЯ; extras Грунтозацепы 14 шт; assembly Сборка и установка; delivery_cost 1000; total before 62470.
- Safe mode summary-card отображается; legacy greenhouse fields больше не торчат как основная форма.
- Добавлен доп «форточка сверху» → total 63960.
- Старые допы/сборка визуально сохранились.
- **Status:** manual verification evidence; automation unreliable / blocked — решающие проверки делались вручную.

### Product direction (согласованная логика)

- Existing single-item по умолчанию — locked snapshot.
- Если теплицу не меняли: current catalog не обязателен; можно менять extras/assembly/foundation/delivery/address/comment; no-change и extras-only save должны работать. **Target, not proven:** real-base smoke 2026-03-23 показал total collapse.
- Только при изменении greenhouse identity — catalog path и новая цена.
- New order flow не трогать.

### Confirmed incidents 2026-03-23 (real-base smoke)

- **79260699646, order 6a936a8b-8bb4-401a-9276-3e67f202e35b (Сергей Николаевич):** date-only edit 28.04.2026→29.04.2026. Result: total collapsed 56 020→2 550. Remediation: order restored from manual backup (несколько раз). **После фиксов:** narrow path existing itemized single-item date-only — PASS (modal 56 020, save OK, total preserved, line_items preserved).
- **79045355637:** added timber base + assembly. Save path showed success; «Обновить расчёт» produced error «Заполните все параметры теплицы». Save path и recalc path diverge; recalc path для legacy/non-catalog broken. Remediation: order restored back.

**Отдельно зафиксировано:** возможна утечка edit-session state между заказами без full reload. Сделан reset edit-session state. Важный проработанный контур; не объявлять весь existing-edit fully stable только из-за этого.

**Не считать доказанным:** extra-only edit for all existing orders; recalc path for legacy/non-catalog; composition edit for all legacy orders; multi-item existing edit as fully stable.

**Важное различие:** старые/manual orders и new-form orders нельзя смешивать в анализе и тестах. У старых заказов часть полей может быть legacy shape. Для старых заказов менеджерская таблица может служить источником восстановления цены/допов/сборки по телефону.

**Not confirmed:** Supabase "not found" screenshot — UI had extra empty id filter; not evidence of missing-order bug.

### Open / not fully proven

- **Full «Изменить теплицу» unlock/catalog flow:** не считать fully closed; не было отдельной полной ручной проверки.
- **multi-item / x2:** вне scope.
- **line_items = null для single-item:** не blocker; future topic.
- **line_items_v2 (23.03.2026):** structured price snapshot для create path. Каждая теплица — отдельная greenhouse-строка (quantity=1). Addon/service/bed привязаны к теплице через parent_line_id. Delivery — одна общая строка без parent. Legacy flat-поля без изменений. Edit path не трогаем.
- **legacy line_items (23.03.2026):** для multi-item create (в т.ч. identical) line_items всегда заполняется (orderCart.map), не null. Совместим с downstream.
- **flat extras/assembly (23.03.2026):** для multi-item строятся по фактическим item-ам; x2 только если доп/сборка у нескольких позиций.
- **stale text guard (23.03.2026):** addToOrderCart обнуляет text-поля item если opts = off/empty (исправляет leaked extras при изменении чекбоксов без пересчёта).

---

## Update 2026-03-24 — Legacy active live smoke + gifts phantom fix retest

**Scope:** real active orders; backup/restore; gifts phantom UI minimal fix.

**CONFIRMED:** 2 legacy/manual active orders (79276687505, 79178183702) — date-only edit smoke PASS. Gifts phantom UI: minimal diff (resetEditOrderSessionState_, fillEditOrderForm skipNotice); payload/save не менялись. Live retest 79276687505: ложный toast не появляется; date-only save OK; restore успешен. TG notify по 79276687505: корректно пришло только смена даты. Final restored: e939569d/79178183702/11.04.2026/1000/71730; 121033f7/79276687505/25.04.2026/1000/53850.

**OPEN:** TG notification inconsistency — часть других edit без видимых уведомлений; не confirmed bug; separate audit in telegram_bot_main.

**Not claimed:** legacy fully fixed; gifts fully fixed; notify-path fully reliable. See docs/AUDIT_2026-03-24_LEGACY_ACTIVE_LIVE_SMOKE_AND_GIFTS_RETEST.md.

---

## Update 2026-03-25 — Native vs legacy / v283 (stage snapshot)

**Файл:** `docs/STATUS_SNAPSHOT_2026-03-25_NATIVE_LEGACY_V283.md` (полный текст — там же; сверху файла — блок **Latest status**).

- **CONFIRMED:** калькулятор staging **v283**; kill switch **LIVE_SMOKE_ALLOWED**; native composition **line_items ↔ line_items_v2** fix chain (v281→v283); legacy **date-only** workflow (не full composition edit через калькулятор).
- **OPEN:** идентичные строки / FIFO; «грязные» smoke-заказы; supplier path для всех сценариев — не claim exhaustive.
- **Не заявлять:** каждый edge case закрыт; безопасный legacy full-edit; все исторические тестовые заказы как контрольные.

---

## Update 2026-03-23 — Create path storage для new orders (PASS) *(historical context — not latest status; baseline: `docs/STATUS_SNAPSHOT_2026-03-25_NATIVE_LEGACY_V283.md`)*

**Главный слой:** для новых заказов детальным хранилищем состава является `line_items_v2` (jsonb).

**Legacy flat fields** сохраняются для совместимости: model, quantity, extras, assembly, line_items, delivery_cost, total.

**Модель:** один заказ = одна запись в `orders`.

**line_items_v2:** отдельные строки по сущностям — greenhouse, addon, service, bed, delivery. `parent_line_id` связывает допы/сборку/грядки с конкретной теплицей.

**Manual PASS:** single-item, 2 identical, 2 different, 3-item mixed composition. Edit-path, TG runtime, legacy historical orders — not touched.

---

## Документация (источники истины)

| Файл | За что отвечает | Когда смотреть |
|------|-----------------|----------------|
| **docs/CHANGELOG.md** | История изменений, версии, что зафиксировано | Версия, дата, что уже сделано |
| **docs/context/КОНТЕКСТ_ПРОЕКТА.md** | Карта проекта, инварианты edit flow, подарки, **логика дат доставки и UI календарей** | Потеря контекста, инварианты, delivery_calendar, блок доставки, модалка дат |
| **docs/GIFT_TRUTH.md** | Бизнес-истина подарков (slot model) | Любые изменения в логике подарков |
| **docs/AUDIT_2026-03-20_PHANTOM_DELIVERY_PROBE.md** | Phantom delivery probe: not reproduced in checked calculator-side scenarios | Phantom +1000, delivery payload |
| **docs/AUDIT_2026-03-20_INC002_GIFT_PLUS1000_READONLY.md** | INC-002 gift audit: gift does not explain +1000 in calculator code path | Gift, +1000, INC-002 |
| **docs/EOD_2026-03-22_CALC.md** | EOD 22.03: safe mode closed, commits, manual verify, open unlock-flow | Locked greenhouse, 5f9a1c7b, next step |
| **docs/AUDIT_2026-03-23_LEGACY_MANUAL_OPEN_EDIT.md** | Legacy/manual open-edit total collapse: canonical repro, fix, verified | Native vs legacy split, canonical cases |
| **docs/AUDIT_2026-03-24_LEGACY_ACTIVE_LIVE_SMOKE_AND_GIFTS_RETEST.md** | Legacy active live smoke + gifts phantom fix retest | Live smoke 24.03, CONFIRMED/OPEN |
| **docs/STATUS_SNAPSHOT_2026-03-25_NATIVE_LEGACY_V283.md** | Этап 25.03: native/legacy, v283, CONFIRMED/OPEN/limits | После handoff v283, kill switch, line_items_v2 parity |
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
