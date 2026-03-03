-- Миграция: добавление поля assembly_date в таблицу delivery_dates
-- Дата: 2026-02-13
-- Версия: v206
--
-- Назначение полей:
-- delivery_date   — дата, с которой возможна доставка теплицы (только товар)
-- assembly_date   — дата, с которой возможна сборка (null = совпадает с delivery_date)
-- restrictions    — даты, когда сборка НЕ осуществляется (формат: "17.02, 20.02, 21.02")
--
-- Пример: "Майкоп доставки с 15.02, сборки с 16.02 (кроме 17.02, 20.02...)"
-- → delivery_date=15.02, assembly_date=16.02, restrictions=17.02, 20.02...
-- 15.02 — можно привезти теплицу, бригад на сборку нет
-- 16.02 — можно и доставить, и собрать (кроме указанных дат)

ALTER TABLE delivery_dates 
ADD COLUMN IF NOT EXISTS assembly_date TEXT DEFAULT NULL;

COMMENT ON COLUMN delivery_dates.assembly_date IS 'Дата, с которой возможна сборка. NULL = совпадает с delivery_date. Ограничения (restrictions) относятся к датам сборки.';
COMMENT ON COLUMN delivery_dates.restrictions IS 'Даты, когда сборка НЕ осуществляется. Формат: "17.02, 20.02, 21.02" (ДД.ММ через запятую)';
