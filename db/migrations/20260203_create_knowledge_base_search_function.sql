-- Функция поиска в базе знаний
-- Дата: 2026-02-03
-- Версия: v1.0
--
-- Создает функцию getKnowledgeBase для быстрого поиска
-- Использование через Supabase RPC или напрямую в SQL

-- Удаляем функцию, если существует (для обновления)
DROP FUNCTION IF EXISTS get_knowledge_base(
    search_query TEXT,
    filter_tags TEXT[],
    filter_type TEXT,
    filter_audience TEXT,
    include_deprecated BOOLEAN
);

-- Создаем функцию поиска
CREATE OR REPLACE FUNCTION get_knowledge_base(
    search_query TEXT DEFAULT NULL,
    filter_tags TEXT[] DEFAULT NULL,
    filter_type TEXT DEFAULT NULL,
    filter_audience TEXT DEFAULT NULL,
    include_deprecated BOOLEAN DEFAULT false
)
RETURNS TABLE (
    id TEXT,
    type TEXT,
    audience TEXT,
    title TEXT,
    text TEXT,
    tags TEXT[],
    source_ref JSONB,
    needs_input BOOLEAN,
    needs_from_owner TEXT,
    deprecated BOOLEAN,
    kb_version TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kb.id,
        kb.type,
        kb.audience,
        kb.title,
        kb.text,
        kb.tags,
        kb.source_ref,
        kb.needs_input,
        kb.needs_from_owner,
        kb.deprecated,
        kb.kb_version,
        kb.created_at,
        kb.updated_at
    FROM knowledge_base kb
    WHERE 
        -- Фильтр по deprecated
        (include_deprecated = true OR kb.deprecated = false)
        
        -- Поиск по тексту (если указан search_query)
        AND (
            search_query IS NULL 
            OR kb.title ILIKE '%' || search_query || '%'
            OR kb.text ILIKE '%' || search_query || '%'
        )
        
        -- Фильтр по типу (если указан)
        AND (filter_type IS NULL OR kb.type = filter_type)
        
        -- Фильтр по аудитории (если указана)
        AND (filter_audience IS NULL OR kb.audience = filter_audience)
        
        -- Фильтр по тегам (если указаны)
        AND (
            filter_tags IS NULL 
            OR kb.tags && filter_tags  -- Оператор && проверяет пересечение массивов
        )
    ORDER BY kb.title ASC;
END;
$$;

-- Комментарий к функции
COMMENT ON FUNCTION get_knowledge_base IS 
'Функция поиска в базе знаний. Параметры: search_query (поиск в title/text), filter_tags (массив тегов), filter_type (FACT/HOWTO), filter_audience (internal_only/client_safe), include_deprecated (по умолчанию false)';

-- Примеры использования:
-- 
-- 1. Поиск по запросу:
-- SELECT * FROM get_knowledge_base('оплата');
--
-- 2. Фильтр по тегам:
-- SELECT * FROM get_knowledge_base(NULL, ARRAY['оплата', 'условия']);
--
-- 3. Фильтр по типу:
-- SELECT * FROM get_knowledge_base(NULL, NULL, 'HOWTO');
--
-- 4. Комбинированный поиск:
-- SELECT * FROM get_knowledge_base('доставка', ARRAY['доставка'], 'FACT', 'internal_only', false);
