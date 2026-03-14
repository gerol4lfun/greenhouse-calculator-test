-- Миграция: RPC для поиска заказов по телефону с поддержкой dual-phone slash-format
-- Дата: 2026-03-14
--
-- Назначение:
-- Позволяет искать заказы по любому из двух телефонов в slash-format «num1 / num2».
-- Не переписывает существующие строки. Работает как над legacy-форматом (без пробелов),
-- так и над каноническим форматом (с пробелами вокруг /).
--
-- Поддерживаемые сценарии:
-- 1. Поиск по первому номеру: находит строки, где первый номер совпадает
-- 2. Поиск по второму номеру: находит строки, где второй номер совпадает
-- 3. Поиск по slash-input: разбивает ввод на два номера, ищет по любому из них
-- 4. Single-phone input против dual-phone row: корректно матчит
-- 5. Single-phone input против single-phone row: поведение как раньше
--
-- Безопасность:
-- - Использует CREATE OR REPLACE (idempotent)
-- - Не трогает данные в orders
-- - normalize_phone_digits_ — вспомогательная IMMUTABLE функция, safe для индексов

BEGIN;

-- Вспомогательная функция: нормализация телефона к 11-значному числу с 7
-- Убирает все нецифровые символы, нормализует 8→7, 10-значный→11-значный.
CREATE OR REPLACE FUNCTION normalize_phone_digits_(raw TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
RETURNS NULL ON NULL INPUT
AS $$
DECLARE
    digits TEXT;
BEGIN
    digits := REGEXP_REPLACE(raw, '[^0-9]', '', 'g');
    IF LENGTH(digits) = 11 AND LEFT(digits, 1) = '8' THEN
        RETURN '7' || SUBSTRING(digits FROM 2);
    END IF;
    IF LENGTH(digits) = 10 THEN
        RETURN '7' || digits;
    END IF;
    RETURN digits;
END;
$$;

-- RPC: поиск заказов по телефону, dual-phone aware
-- p_search: строка, которую ввёл пользователь (single phone или slash-format)
-- Возвращает строки orders, упорядоченные по created_at DESC, limit 30.
CREATE OR REPLACE FUNCTION search_orders_by_phone(p_search TEXT)
RETURNS SETOF orders
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    p_slash  INT;
    p1       TEXT;
    p2       TEXT;
    p_norm   TEXT;
BEGIN
    p_search := TRIM(COALESCE(p_search, ''));
    IF p_search = '' THEN RETURN; END IF;

    p_slash := POSITION('/' IN p_search);

    IF p_slash > 0 THEN
        -- Dual-phone input: разбиваем на два номера, ищем строки, у которых хоть один совпадает
        p1 := normalize_phone_digits_(TRIM(SUBSTRING(p_search FROM 1 FOR p_slash - 1)));
        p2 := normalize_phone_digits_(TRIM(SUBSTRING(p_search FROM p_slash + 1)));

        RETURN QUERY
        SELECT o.*
        FROM orders o
        WHERE
            -- Первый токен stored phone совпадает с p1 или p2
            normalize_phone_digits_(TRIM(SPLIT_PART(o.client_phone, '/', 1))) IN (p1, p2)
            OR
            -- Второй токен stored phone (если есть /) совпадает с p1 или p2
            (POSITION('/' IN o.client_phone) > 0
             AND normalize_phone_digits_(TRIM(SPLIT_PART(o.client_phone, '/', 2))) IN (p1, p2))
        ORDER BY o.created_at DESC
        LIMIT 30;
    ELSE
        -- Single-phone input: ищем строки, у которых любой из токенов совпадает
        p_norm := normalize_phone_digits_(p_search);
        IF LENGTH(p_norm) < 10 THEN RETURN; END IF;

        RETURN QUERY
        SELECT o.*
        FROM orders o
        WHERE
            normalize_phone_digits_(TRIM(SPLIT_PART(o.client_phone, '/', 1))) = p_norm
            OR
            (POSITION('/' IN o.client_phone) > 0
             AND normalize_phone_digits_(TRIM(SPLIT_PART(o.client_phone, '/', 2))) = p_norm)
        ORDER BY o.created_at DESC
        LIMIT 30;
    END IF;
END;
$$;

COMMIT;
