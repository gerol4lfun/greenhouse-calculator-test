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
- **Phone scope:** legacy dual-phone slash-format («79128974834 /79085842934») — два номера одного клиента. Подтверждён только fix data-loss для existing untouched order (phone field не трогали → raw-preserve literally). Не реализовано и не считать подтверждённым: ввод dual-phone через UI, explicit edit dual-phone, поиск по dual-phone, отдельное поле второго номера. Future step — отдельный UX/поле для второго номера.
- **cancelled** — не редактируется. UI + проверка перед save.
- **Платные допы** — не должны пропадать из long КП из-за логики подарков.
- **slot count** — зависит только от total / preview total.
- **Выбор подарка** — меняет только содержимое слота, не tier.

---

## Связанные проекты

- **тг бот заказы теплицы** (TG/GAS order bot) — отдельный контур. GAS-проект (не GitHub-репо). Код не находится внутри greenhouse-calculator-main. Заказы: калькулятор → Supabase → бот → Sheets. Деплой через GAS.
- **telegram-bot/** (delivery-dates bot) — внутри greenhouse-calculator-main. delivery-dates bot, не основной order GAS bot. Репо gerol4lfun/delivery-bot-telegram. Даты доставки. Не order flow.
