# Документация проекта

## Структура

| Папка | Содержимое |
|-------|------------|
| `context/` | ТЗ, контекст проекта (`КОНТЕКСТ_ПРОЕКТА.md` — основной), доска, анализ постов |
| `faq/` | FAQ по разделам (доставка, материалы, оплата и т.д.) |
| `instructions/` | Инструкции: **пуш в репозитории** (калькулятор + delivery-bot-telegram), GitHub Pages, пароли, Cursor, бот |
| `archive/` | Устаревшие отчёты, планы, отчёты v203–v231 |

## Основные файлы

- **`instructions/ПУШ_В_РЕПОЗИТОРИИ_ИНСТРУКЦИЯ.md`** — как правильно пушить в **greenhouse-calculator** и в **delivery-bot-telegram** (два репо, без костылей)
- `CHANGELOG.md` — история изменений
- `ОРГАНИЗАЦИЯ_ПРОЕКТА.md` — структура проекта
- `ОБРАТНАЯ_СВЯЗЬ_FAQ.md` — обратная связь по FAQ

## Текущее важное состояние

- Актуальный рабочий контекст по новому поставщику зафиксирован в `CHANGELOG.md` под версией `v306`.
- Новый поставщик по Москве/МО пока внедрён как **изолированный test mode**, без замены legacy order flow для обычных менеджеров.
- Вход в UG test mode для менеджеров теперь сделан через простую кнопку `UG тест: вкл/выкл` в правом верхнем углу после входа в калькулятор.
- Технический query-параметр `?ugSupplier=1` по-прежнему поддерживается как внутренний механизм режима, но для рабочих тестов менеджерам его вручную использовать не нужно.
- При выходе из аккаунта UG test mode сбрасывается вместе с пользовательской сессией.

## Быстрое обновление цен УГ

- Источник цен: `../ПРАЙС УГ розница .xlsx`
- Новые цены УГ попадают в калькулятор через отдельные таблицы Supabase:
  - `supplier_greenhouse_prices_compat`
  - `supplier_greenhouse_prices_meta`
- Быстрый рабочий цикл обновления:

```bash
cd /Users/pavelkulcinskij/Desktop/it/tg_calculator/greenhouse-calculator-main
python3 scripts/parse_supplier_ug_price_preview.py
python3 scripts/project_supplier_ug_greenhouses.py
npm run ug:import:dry
```

- Если в окружении есть `SUPABASE_SERVICE_ROLE_KEY`, то можно писать сразу:

```bash
cd /Users/pavelkulcinskij/Desktop/it/tg_calculator/greenhouse-calculator-main
npm run ug:import:write
```

- Если `SUPABASE_SERVICE_ROLE_KEY` недоступен, использовать SQL seed:

```bash
cd /Users/pavelkulcinskij/Desktop/it/tg_calculator/greenhouse-calculator-main
npm run ug:seed:sql
pbcopy < /Users/pavelkulcinskij/Desktop/it/tg_calculator/greenhouse-calculator-main/out/ug_supplier_preview/ug_supplier_catalog_seed.sql
```

- После этого открыть Supabase SQL Editor, вставить seed и нажать `Run`.
