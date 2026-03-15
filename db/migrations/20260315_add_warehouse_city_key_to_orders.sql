-- Миграция: добавление warehouse_city_key в таблицу orders (шаг 1 rollout)
-- Дата: 2026-03-15
--
-- Назначение:
-- warehouse_city_key — канонический ключ склада/региона для delivery logic.
-- Source of truth для календаря, тарифа, region availability.
--
-- Шаг 1: только подготовка схемы. Без backfill. Без изменений runtime-логики.
-- Create/edit и readers пока не трогаем.
--
-- Идемпотентность: ADD COLUMN IF NOT EXISTS

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS warehouse_city_key TEXT DEFAULT NULL;

COMMENT ON COLUMN orders.warehouse_city_key IS 'Канонический ключ склада/региона (как в delivery_calendar, prices.city_name). Source of truth для delivery logic. Nullable — legacy заказы без key.';
