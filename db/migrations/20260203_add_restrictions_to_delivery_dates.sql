-- Миграция: добавление поля restrictions в таблицу delivery_dates
-- Дата: 2026-02-03
-- Версия: v1.0
-- 
-- ВАЖНО: Эта миграция безопасна для выполнения на production БД
-- Использует IF NOT EXISTS для предотвращения ошибок при повторном выполнении

-- Добавляем поле для исключений (дни без доставки)
ALTER TABLE delivery_dates 
ADD COLUMN IF NOT EXISTS restrictions TEXT DEFAULT NULL;

-- Комментарий к полю
COMMENT ON COLUMN delivery_dates.restrictions IS 'Дни, когда доставка НЕ осуществляется. Формат: "13.02, 14.02" или "13.02, 14.02" (даты в формате ДД.ММ)';

-- Проверка: можно выполнить этот запрос, чтобы убедиться, что колонка создана
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'delivery_dates' AND column_name = 'restrictions';
