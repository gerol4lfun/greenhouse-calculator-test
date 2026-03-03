-- Ручное обновление дат по данным пользователя (2026-02)
-- Выполнить в Supabase SQL Editor
-- 
-- Сначала добавьте колонку, если её нет:
ALTER TABLE delivery_dates ADD COLUMN IF NOT EXISTS assembly_date TEXT DEFAULT NULL;

-- Великий Новгород: 15.02
UPDATE delivery_dates SET delivery_date = '15.02', city_name = 'Великий Новгород', updated_at = NOW()
WHERE city_name ILIKE 'великий новгород' OR (city_name ILIKE 'новгород' AND city_name NOT ILIKE '%нижний%');

-- Краснодар, Ставрополь, Майкоп, Черкесск: доставки 15.02, сборки 16.02, ограничения
UPDATE delivery_dates SET 
  delivery_date = '15.02',
  assembly_date = '16.02',
  restrictions = '17.02, 20.02, 21.02, 27.02, 28.02',
  city_name = TRIM(REGEXP_REPLACE(city_name, '\s+доставки\s*$', '', 'i')),
  updated_at = NOW()
WHERE city_name ~* '^(краснодар|ставрополь|майкоп|черкесск)';
