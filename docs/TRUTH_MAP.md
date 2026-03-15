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
- **Phone scope:** legacy dual-phone slash-format («79128974834 /79085842934») — два номера одного клиента. Подтверждён только fix data-loss для existing untouched order (phone field не трогали → raw-preserve literally). Не реализовано и не считать подтверждённым: ввод dual-phone через UI, explicit edit dual-phone, поиск по dual-phone, отдельное поле второго номера. Future step — отдельный UX/поле для второго номера.
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

---

## Связанные проекты

- **тг бот заказы теплицы** (TG/GAS order bot) — отдельный контур. GAS-проект (не GitHub-репо). Код не находится внутри greenhouse-calculator-main. Заказы: калькулятор → Supabase → бот → Sheets. Деплой через GAS.
- **telegram-bot/** (delivery-dates bot) — внутри greenhouse-calculator-main. delivery-dates bot, не основной order GAS bot. Репо gerol4lfun/delivery-bot-telegram. Даты доставки. Не order flow.
