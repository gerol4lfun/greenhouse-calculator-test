-- Миграция: добавление updated_at в таблицу orders как change-signal для TG auto-sync
-- Дата: 2026-03-14
--
-- Назначение:
-- updated_at — технический change-marker, который обновляется при каждом UPDATE заказа.
-- После этой миграции TG-контур сможет делать candidate selection по updated_at
-- вместо ненадёжного batch-подхода по created_at.
--
-- Что делает этот скрипт:
-- 1. Добавляет колонку updated_at с DEFAULT now() (INSERT сразу получает timestamp)
-- 2. Backfill существующих строк: updated_at = created_at; если created_at NULL — now()
-- 3. Устанавливает NOT NULL (после backfill)
-- 4. Создаёт function + BEFORE UPDATE trigger: каждый UPDATE ставит NEW.updated_at = now()
-- 5. Создаёт индекс на updated_at для candidate selection
--
-- Безопасность:
-- - Использует ALTER TABLE ... ADD COLUMN IF NOT EXISTS
-- - Использует CREATE OR REPLACE FUNCTION
-- - Использует CREATE INDEX IF NOT EXISTS
-- - Не трогает orders_audit_trigger
-- - Не удаляет и не меняет существующие данные
-- - Транзакционно: вся миграция в одном блоке

BEGIN;

-- 1. Добавить колонку (idempotent)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Backfill: заполнить существующие строки
--    Для строк где updated_at ещё NULL (только что добавленные до DEFAULT):
--    берём created_at если есть, иначе now()
UPDATE orders
SET updated_at = COALESCE(created_at, NOW())
WHERE updated_at IS NULL;

-- 3. Поставить NOT NULL (backfill уже заполнил все строки)
ALTER TABLE orders
  ALTER COLUMN updated_at SET NOT NULL;

-- 4. Function для trigger
CREATE OR REPLACE FUNCTION orders_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 5. BEFORE UPDATE trigger (отдельный от orders_audit_trigger)
DROP TRIGGER IF EXISTS orders_updated_at_trigger ON orders;

CREATE TRIGGER orders_updated_at_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION orders_set_updated_at();

-- 6. Индекс для candidate selection по времени изменения
CREATE INDEX IF NOT EXISTS orders_updated_at_idx
  ON orders (updated_at);

COMMIT;
