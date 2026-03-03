# Миграции базы данных

## Структура

- `20260203_create_knowledge_base.sql` - Основная миграция для создания таблицы knowledge_base
- `20260213_add_assembly_date_to_delivery_dates.sql` - Добавление поля assembly_date (дата сборки) в delivery_dates
- `20260214_update_delivery_dates_rpc.sql` - RPC для обновления дат доставки
- `20260214_update_delivery_tariff_fact.sql` - Обновление факта GH-0017 (тарифы 45/50 руб/км)
- `20260215_create_update_user_password_rpc.sql` - RPC для смены паролей (админ-панель)
- `dev_drop_knowledge_base.sql` - DEV-ONLY скрипт для удаления таблицы (только для разработки!)

## Использование

### Production миграция

Выполните в Supabase SQL Editor:

```sql
-- Файл: db/migrations/20260203_create_knowledge_base.sql
```

Эта миграция безопасна для выполнения на production БД:
- Использует `CREATE TABLE IF NOT EXISTS`
- Использует `CREATE INDEX IF NOT EXISTS`
- Проверяет существование политик перед созданием
- Не удаляет существующие данные

### DEV миграция (только для разработки!)

⚠️ **ВНИМАНИЕ:** Этот скрипт удаляет таблицу и все данные!

```sql
-- Файл: db/migrations/dev_drop_knowledge_base.sql
```

Используйте ТОЛЬКО в development окружении!

## Порядок выполнения

1. Для новой БД:
   - Выполните `20260203_create_knowledge_base.sql`

2. Для поддержки дат доставки/сборки (v206):
   - Выполните `20260213_add_assembly_date_to_delivery_dates.sql`

3. Для обновления факта «Доставка: тариф» (новые тарифы 45/50 руб/км):
   - Выполните `20260214_update_delivery_tariff_fact.sql` — если БД уже содержит импортированные данные

4. Для работы админ-панели (смена паролей):
   - Выполните `20260215_create_update_user_password_rpc.sql` — создаёт RPC update_user_password

5. Для пересоздания таблицы в dev:
   - Выполните `dev_drop_knowledge_base.sql`
   - Затем выполните `20260203_create_knowledge_base.sql`

6. После создания таблицы knowledge_base:
   - Запустите импорт: `npm run kb:import`
