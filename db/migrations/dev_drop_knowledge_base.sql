-- ⚠️ DEV-ONLY СКРИПТ: Удаление таблицы knowledge_base
-- 
-- ВНИМАНИЕ: Этот скрипт удаляет таблицу и все данные!
-- Используйте ТОЛЬКО в development окружении!
-- НЕ запускайте на production БД!
--
-- Использование: для полной пересборки таблицы в dev окружении

-- Удаляем таблицу (со всеми зависимостями)
DROP TABLE IF EXISTS knowledge_base CASCADE;

-- Удаляем функцию (если нужно)
DROP FUNCTION IF EXISTS update_knowledge_base_updated_at() CASCADE;

-- После выполнения этого скрипта запустите:
-- db/migrations/20260203_create_knowledge_base.sql
