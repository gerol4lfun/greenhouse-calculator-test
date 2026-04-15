# Скрипты

## npm run

| Команда | Скрипт | Описание |
|---------|--------|----------|
| `npm run kb:import` | import_kb.js | Импорт базы знаний в Supabase |
| `npm run kb:search` | getKnowledgeBase.js | Поиск в базе знаний |
| `npm run beds:import` | load_beds_normalized.js | Импорт грядок в Supabase |
| `npm run ug:import:dry` | import_supplier_ug_greenhouses.js | Dry-run проверка и подготовка импорта нового поставщика теплиц |
| `npm run ug:import:write` | import_supplier_ug_greenhouses.js --write | Запись нового supplier-каталога в отдельные таблицы Supabase |
| `npm run ug:seed:sql` | export_supplier_ug_sql_seed.py | Генерация SQL seed для загрузки supplier-каталога через SQL Editor |
| `npm run ug:resolver:test` | test_supplier_catalog_resolver.js | Локальный тест resolver/adapter слоя для нового supplier-каталога |

## import_kb.js

Импортёр базы знаний из JSON файла в Supabase.

**Использование:**
```bash
npm run kb:import
```

**Что делает:**
- Читает `kb/greenhouse_kb.v1.json`
- Валидирует все карточки (проверяет обязательные поля)
- Делает upsert в таблицу `knowledge_base` по `id`
- Логирует: inserted/updated/skipped(deprecated)
- Пропускает deprecated карточки

**Требования:**
- Файл `.env` с `SUPABASE_SERVICE_ROLE_KEY`
- Таблица `knowledge_base` должна быть создана

## getKnowledgeBase.js

Функция поиска в базе знаний.

**Использование:**
```bash
npm run kb:search
```

**Параметры:**
- `q` - поисковый запрос (поиск в title и text)
- `tags` - массив тегов для фильтрации
- `type` - тип карточки (FACT или HOWTO)
- `audience` - аудитория (internal_only или client_safe)
- `includeDeprecated` - включать ли deprecated карточки (по умолчанию false)

**Пример использования в коде:**
```javascript
const { getKnowledgeBase } = require('./scripts/getKnowledgeBase');

// Поиск по запросу
const results = await getKnowledgeBase({ q: 'оплата' });

// Фильтр по тегам
const results = await getKnowledgeBase({ tags: ['оплата', 'условия'] });

// Комбинированный поиск
const results = await getKnowledgeBase({ 
    q: 'доставка', 
    type: 'FACT',
    audience: 'internal_only'
});
```

## import_supplier_ug_greenhouses.js

Импортёр нового supplier-каталога теплиц в отдельные таблицы Supabase.

**Использование:**
```bash
npm run ug:import:dry
npm run ug:import:write
```

**Что делает:**
- Читает локальные projection-файлы из `out/ug_supplier_preview/`
- Валидирует связность `compat` / `meta`
- В `dry-run` режиме ничего не пишет
- В `write` режиме делает upsert только в:
  - `supplier_greenhouse_prices_compat`
  - `supplier_greenhouse_prices_meta`

**Гарантии безопасности:**
- Не изменяет текущую таблицу `prices`
- Не меняет runtime калькулятора
- Не включает новый каталог в прод автоматически

**Перед записью в БД:**
- Выполнить SQL миграцию:
  - `db/migrations/20260414_create_supplier_greenhouse_catalog.sql`

## Быстрый refresh цен УГ из нового Excel

Если поставщик обновил файл `ПРАЙС УГ розница .xlsx`, рабочая последовательность такая:

```bash
cd /Users/pavelkulcinskij/Desktop/it/tg_calculator/greenhouse-calculator-main
python3 scripts/parse_supplier_ug_price_preview.py
python3 scripts/project_supplier_ug_greenhouses.py
npm run ug:import:dry
```

Если `dry-run` прошёл без ошибок:

```bash
cd /Users/pavelkulcinskij/Desktop/it/tg_calculator/greenhouse-calculator-main
npm run ug:import:write
```

Если в локальном окружении нет `SUPABASE_SERVICE_ROLE_KEY`, то использовать SQL seed:

```bash
cd /Users/pavelkulcinskij/Desktop/it/tg_calculator/greenhouse-calculator-main
npm run ug:seed:sql
pbcopy < /Users/pavelkulcinskij/Desktop/it/tg_calculator/greenhouse-calculator-main/out/ug_supplier_preview/ug_supplier_catalog_seed.sql
```

Дальше:
- открыть Supabase SQL Editor;
- вставить содержимое seed;
- выполнить `Run`.

Проверочный запрос по `ГОСТ`:

```sql
select
  source_model_name,
  frame_text,
  arc_step_text,
  fastening_text,
  length_m,
  polycarbonate_text,
  greenhouse_price_rub,
  assembly_price_rub
from public.supplier_greenhouse_prices_meta
where supplier_key = 'ug'
  and catalog_key = 'ug_moscow_preview'
  and source_model_name ilike '%ГОСТ%'
order by source_model_name, fastening_text, arc_step_text, length_m, polycarbonate_text;
```

## test_supplier_catalog_resolver.js

Локальный тест отдельного resolver/adapter слоя для нового каталога поставщика.

**Использование:**
```bash
npm run ug:resolver:test
```

**Что проверяет:**
- `compat` и `meta` можно адаптировать в runtime-ready строки
- категория формы сохраняется отдельно от supplier model title
- UI-лейблы по поликарбонату/каркасу/соединению сохраняются
- supplier raw metadata не теряется

**Важно:**
- этот resolver пока не подключён в `js/scripts.js`
- это подготовительный безопасный слой перед будущей интеграцией Москвы/МО
