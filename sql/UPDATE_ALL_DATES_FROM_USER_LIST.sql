-- Полное обновление дат доставки по списку пользователя
-- Выполнить в Supabase → SQL Editor → вставить и Run
--
-- В таблице есть UNIQUE на city_name — нельзя иметь два "Краснодар".
-- Поэтому: сначала обновляем данные (без смены названия), потом удаляем дубликаты "Город доставки".

ALTER TABLE delivery_dates ADD COLUMN IF NOT EXISTS assembly_date TEXT DEFAULT NULL;

-- ========== ПРОСТЫЕ ГОРОДА (одна дата) ==========
UPDATE delivery_dates SET delivery_date = '19.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'москва';
UPDATE delivery_dates SET delivery_date = '19.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'тула';
UPDATE delivery_dates SET delivery_date = '19.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'калуга';
UPDATE delivery_dates SET delivery_date = '19.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'рязань';
UPDATE delivery_dates SET delivery_date = '19.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'тверь';

-- Питер/СПб/Санкт-Петербург
UPDATE delivery_dates SET delivery_date = '15.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() 
WHERE city_name ILIKE 'питер' OR city_name ILIKE 'санкт-петербург' OR city_name ILIKE 'петербург' OR city_name ILIKE 'спб';

-- Великий Новгород (и "Новгород" без "Нижний")
UPDATE delivery_dates SET delivery_date = '15.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() 
WHERE city_name ILIKE 'великий новгород' OR (city_name ILIKE 'новгород' AND city_name NOT ILIKE '%нижний%');

UPDATE delivery_dates SET delivery_date = '17.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'воронеж';
UPDATE delivery_dates SET delivery_date = '17.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'белгород';
UPDATE delivery_dates SET delivery_date = '17.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'липецк';
UPDATE delivery_dates SET delivery_date = '17.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'тамбов';
UPDATE delivery_dates SET delivery_date = '17.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'орёл';
UPDATE delivery_dates SET delivery_date = '17.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'курск';

UPDATE delivery_dates SET delivery_date = '16.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'казань';
UPDATE delivery_dates SET delivery_date = '16.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'ульяновск';
UPDATE delivery_dates SET delivery_date = '16.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'чебоксары';
UPDATE delivery_dates SET delivery_date = '16.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'йошкар-ола';
UPDATE delivery_dates SET delivery_date = '16.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'набережные челны' OR city_name ILIKE 'челны';

UPDATE delivery_dates SET delivery_date = '15.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'нижний новгород' OR city_name ILIKE 'нн';
UPDATE delivery_dates SET delivery_date = '15.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'владимир';
UPDATE delivery_dates SET delivery_date = '15.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'ярославль';
UPDATE delivery_dates SET delivery_date = '15.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'кострома';
UPDATE delivery_dates SET delivery_date = '15.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'иваново';
UPDATE delivery_dates SET delivery_date = '15.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'вологда';
UPDATE delivery_dates SET delivery_date = '15.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'екатеринбург';
UPDATE delivery_dates SET delivery_date = '15.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'челябинск';
UPDATE delivery_dates SET delivery_date = '15.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'новосибирск';
UPDATE delivery_dates SET delivery_date = '15.02', assembly_date = NULL, restrictions = NULL, updated_at = NOW() WHERE city_name ILIKE 'кемерово';

-- ========== СЛОЖНЫЕ ГОРОДА (доставка + сборка + ограничения) ==========
-- Сначала обновляем данные БЕЗ смены city_name (иначе конфликт unique)
UPDATE delivery_dates SET 
  delivery_date = '15.02', 
  assembly_date = '16.02', 
  restrictions = '17.02, 20.02, 21.02, 27.02, 28.02',
  updated_at = NOW()
WHERE city_name ILIKE 'краснодар' OR city_name ILIKE 'краснодар доставки';

UPDATE delivery_dates SET 
  delivery_date = '15.02', 
  assembly_date = '16.02', 
  restrictions = '17.02, 20.02, 21.02, 27.02, 28.02',
  updated_at = NOW()
WHERE city_name ILIKE 'ставрополь' OR city_name ILIKE 'ставрополь доставки';

UPDATE delivery_dates SET 
  delivery_date = '15.02', 
  assembly_date = '16.02', 
  restrictions = '17.02, 20.02, 21.02, 27.02, 28.02',
  updated_at = NOW()
WHERE city_name ILIKE 'майкоп' OR city_name ILIKE 'майкоп доставки';

UPDATE delivery_dates SET 
  delivery_date = '15.02', 
  assembly_date = '16.02', 
  restrictions = '17.02, 20.02, 21.02, 27.02, 28.02',
  updated_at = NOW()
WHERE city_name ILIKE 'черкесск' OR city_name ILIKE 'черкесск доставки';

-- Удалить записи "Город доставки" (данные уже в "Город")
DELETE FROM delivery_dates WHERE city_name ILIKE '% доставки';

-- Удалить остальные дубликаты (Питер/Санкт-Петербург и т.п.)
DELETE FROM delivery_dates a
USING delivery_dates b
WHERE a.id > b.id 
  AND LOWER(TRIM(a.city_name)) = LOWER(TRIM(b.city_name));
