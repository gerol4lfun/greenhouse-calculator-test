-- Очистка всех restrictions (выполнить в Supabase SQL Editor)
-- Версия проекта: v205
UPDATE delivery_dates 
SET restrictions = NULL, updated_at = NOW()
WHERE restrictions IS NOT NULL;
