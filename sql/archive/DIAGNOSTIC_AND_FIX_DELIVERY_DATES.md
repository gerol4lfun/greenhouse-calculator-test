# Проверка и исправление дат доставки

## Шаг 1: Проверить наличие колонки assembly_date

Выполните в **Supabase → SQL Editor**:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'delivery_dates' 
  AND column_name IN ('assembly_date', 'restrictions', 'delivery_date');
```

**Ожидаемый результат:** все 3 колонки должны быть в списке.

**Если assembly_date отсутствует** — выполните миграцию:
```sql
-- Файл: db/migrations/20260213_add_assembly_date_to_delivery_dates.sql
ALTER TABLE delivery_dates ADD COLUMN IF NOT EXISTS assembly_date TEXT DEFAULT NULL;
```

---

## Шаг 2: Просмотр текущих данных

```sql
SELECT city_name, delivery_date, assembly_date, restrictions 
FROM delivery_dates 
WHERE city_name IN (
  'Великий Новгород', 'Новгород', 'Краснодар', 'Ставрополь', 
  'Майкоп', 'Черкесск', 'Санкт-Петербург', 'Питер'
)
ORDER BY city_name;
```

Проверьте:
- есть ли дубли (Питер и Санкт-Петербург, Новгород и Великий Новгород);
- заполнены ли assembly_date и restrictions для Краснодара, Ставрополя, Майкопа, Черкесска.

---

## Шаг 3: Ручное обновление (если бот не сработал)

Для **Великий Новгород** (если стоит 8.02 вместо 15.02):

```sql
UPDATE delivery_dates 
SET delivery_date = '15.02', updated_at = NOW()
WHERE city_name ILIKE '%великий новгород%' OR city_name ILIKE 'новгород';
```

Для **Краснодар, Ставрополь, Майкоп, Черкесск** (добавить assembly_date и restrictions):

```sql
UPDATE delivery_dates SET 
  delivery_date = '15.02',
  assembly_date = '16.02',
  restrictions = '17.02, 20.02, 21.02, 27.02, 28.02',
  updated_at = NOW()
WHERE city_name IN ('Краснодар', 'Ставрополь', 'Майкоп', 'Черкесск');
```

---

## Шаг 4: Объединение дубликатов

Если в шаге 2 вы увидели дубли (например, "Питер" и "Санкт-Петербург"):

```sql
-- Файл: sql/merge_duplicate_delivery_cities.sql
-- Выполните его полностью
```

---

## Чек-лист для полной настройки

1. [ ] Миграция `20260213_add_assembly_date_to_delivery_dates.sql` выполнена
2. [ ] Telegram-бот задеплоен на Railway с актуальным кодом
3. [ ] Переменные окружения бота: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`
4. [ ] Отправить даты в бот заново
5. [ ] Обновить калькулятор (GitHub Pages / хостинг)
6. [ ] Очистить кеш браузера (Ctrl+Shift+R) при проверке
