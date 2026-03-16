# Карта источников истины

**Назначение:** при споре или потере контекста — опираться на эти файлы. Не придумывать заново.

**greenhouse-calculator-main** — главный проект и центр общей документации.

---

## Документация (источники истины)

| Файл | За что отвечает | Когда смотреть |
|------|-----------------|----------------|
| **docs/CHANGELOG.md** | История изменений, версии, что зафиксировано | Версия, дата, что уже сделано |
| **docs/context/КОНТЕКСТ_ПРОЕКТА.md** | Карта проекта, инварианты edit flow, подарки, **логика дат доставки и UI календарей** | Потеря контекста, инварианты, delivery_calendar, блок доставки, модалка дат |
| **docs/GIFT_TRUTH.md** | Бизнес-истина подарков (slot model) | Любые изменения в логике подарков |
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
- **Edit calendar source-of-truth:** confirmed. Приоритет: orders.city → line_items[].city → fallback derive from address. Alias (МСК, СПБ, Питер) нормализуется. Fix #1 (item.city preserve) и fix #2 (prefix strip) внесены. Кейсы: 8e803d39 (city=МСК); 79000000028 (city="г. Санкт-Петербург") — на актуальном калькуляторе календарь показывает реальные ограничения. Принято: вводим orders.warehouse_city_key как source of truth для delivery logic (см. ниже).
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

**PGRST204 incident (15.03.2026) — truth freeze:** Confirmed: prod-schema проблема; колонка отсутствовала; добавлена вручную; NOTIFY pgrst; save восстановлен; rollback payload rejected. Open/under doubt: кейс «28 марта»→27.03 в diff; не считать закрытым до проверки.

---

## Связанные проекты

- **тг бот заказы теплицы** (TG/GAS order bot) — отдельный контур. GAS-проект (не GitHub-репо). Код не находится внутри greenhouse-calculator-main. Заказы: калькулятор → Supabase → бот → Sheets. Деплой через GAS.
- **telegram-bot/** (delivery-dates bot) — внутри greenhouse-calculator-main. delivery-dates bot, не основной order GAS bot. Репо gerol4lfun/delivery-bot-telegram. Даты доставки. Не order flow.
