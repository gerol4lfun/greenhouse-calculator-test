-- ПОЛНАЯ ОЧИСТКА И НОРМАЛИЗАЦИЯ
-- Выполнить в Supabase → SQL Editor
-- Источник истины — только канонические города (без " доставки" в названии)

-- 0. Убедиться, что колонки существуют
ALTER TABLE delivery_dates ADD COLUMN IF NOT EXISTS assembly_date TEXT DEFAULT NULL;
ALTER TABLE delivery_dates ADD COLUMN IF NOT EXISTS restrictions TEXT DEFAULT NULL;

-- 1. Создать RPC для корректного обновления (NULL гарантированно устанавливается)
CREATE OR REPLACE FUNCTION update_delivery_dates_row(
  p_id BIGINT,
  p_delivery_date TEXT,
  p_assembly_date TEXT,
  p_restrictions TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE delivery_dates
  SET delivery_date = p_delivery_date,
      assembly_date = p_assembly_date,
      restrictions = p_restrictions,
      updated_at = NOW()
  WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_delivery_dates_row(BIGINT, TEXT, TEXT, TEXT) TO service_role;

-- 2. Удалить все дубликаты "Город доставки"
DELETE FROM delivery_dates WHERE city_name ILIKE '% доставки';

-- 3. Добавить недостающие канонические города
INSERT INTO delivery_dates (city_name, delivery_date, assembly_date, restrictions, updated_at)
SELECT v.city, NULL, NULL, NULL, NOW()
FROM (VALUES
  ('Москва'), ('Тула'), ('Калуга'), ('Рязань'), ('Тверь'),
  ('Санкт-Петербург'), ('Великий Новгород'), ('Воронеж'), ('Белгород'), ('Липецк'),
  ('Тамбов'), ('Орёл'), ('Курск'), ('Казань'), ('Ульяновск'), ('Чебоксары'),
  ('Йошкар-Ола'), ('Набережные Челны'), ('Нижний Новгород'), ('Владимир'),
  ('Краснодар'), ('Ставрополь'), ('Майкоп'), ('Черкесск'), ('Ярославль'),
  ('Кострома'), ('Иваново'), ('Вологда'), ('Екатеринбург'), ('Челябинск'), ('Новосибирск'), ('Кемерово')
) AS v(city)
WHERE NOT EXISTS (SELECT 1 FROM delivery_dates d WHERE LOWER(TRIM(d.city_name)) = LOWER(v.city));
