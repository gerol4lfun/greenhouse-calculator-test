# Скрипты

## npm run

| Команда | Скрипт | Описание |
|---------|--------|----------|
| `npm run kb:import` | import_kb.js | Импорт базы знаний в Supabase |
| `npm run kb:search` | getKnowledgeBase.js | Поиск в базе знаний |
| `npm run beds:import` | load_beds_normalized.js | Импорт грядок в Supabase |

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
