-- Объединение дубликатов: "Город доставки" → "Город"
-- Выполнить в Supabase SQL Editor после v206
--
-- Калькулятор уже объединяет дубли при отображении. Этот скрипт чистит БД.

-- 1. Обновить существующий "Город" данными из "Город доставки"
UPDATE delivery_dates d1
SET 
  delivery_date = d2.delivery_date,
  assembly_date = COALESCE(d2.assembly_date, d1.assembly_date),
  restrictions = COALESCE(NULLIF(TRIM(d2.restrictions), ''), d1.restrictions),
  updated_at = NOW()
FROM delivery_dates d2
WHERE d2.city_name = d1.city_name || ' доставки';

-- 2. Переименовать "Город доставки" в "Город" где записи "Город" нет
UPDATE delivery_dates d1
SET city_name = TRIM(REPLACE(d1.city_name, ' доставки', ''))
WHERE d1.city_name LIKE '% доставки'
  AND NOT EXISTS (
    SELECT 1 FROM delivery_dates d2 
    WHERE d2.city_name = TRIM(REPLACE(d1.city_name, ' доставки', '')) AND d2.id != d1.id
  );

-- 3. Удалить оставшиеся дубли "Город доставки" (данные уже в "Город")
DELETE FROM delivery_dates WHERE city_name LIKE '% доставки';
