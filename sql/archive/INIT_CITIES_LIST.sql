-- Добавить все города из фиксированного списка (если ещё нет)
-- Выполнить один раз в Supabase → SQL Editor
-- Бот обновляет ТОЛЬКО эти записи, новых не создаёт

ALTER TABLE delivery_dates ADD COLUMN IF NOT EXISTS assembly_date TEXT DEFAULT NULL;
ALTER TABLE delivery_dates ADD COLUMN IF NOT EXISTS restrictions TEXT DEFAULT NULL;

-- Вставка только при отсутствии города
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

-- Удалить старые дубликаты "Город доставки"
DELETE FROM delivery_dates WHERE city_name ILIKE '% доставки';
