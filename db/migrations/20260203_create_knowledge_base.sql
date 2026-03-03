-- Миграция: создание таблицы knowledge_base
-- Дата: 2026-02-03
-- Версия: v1.0
-- 
-- ВАЖНО: Эта миграция безопасна для выполнения на production БД
-- DROP TABLE вынесен в отдельный dev-скрипт

-- Создаем таблицу knowledge_base (если не существует)
CREATE TABLE IF NOT EXISTS knowledge_base (
    id TEXT PRIMARY KEY,                    -- Уникальный ID (например, "GH-0001")
    type TEXT NOT NULL,                     -- Тип: "FACT" или "HOWTO"
    audience TEXT NOT NULL,                  -- Аудитория: "internal_only" или "client_safe"
    title TEXT NOT NULL,                     -- Заголовок карточки
    text TEXT NOT NULL,                      -- Текст карточки
    tags TEXT[],                            -- Массив тегов
    source_ref JSONB,                        -- Ссылка на источник (post_id, date, line_no)
    needs_input BOOLEAN DEFAULT false,       -- Требуется ли ввод от пользователя
    needs_from_owner TEXT DEFAULT '',       -- Что требуется от владельца
    deprecated BOOLEAN DEFAULT false,        -- Помечена ли как устаревшая
    kb_version TEXT DEFAULT 'v1.0',         -- Версия базы знаний
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индексы для быстрого поиска (если не существуют)
CREATE INDEX IF NOT EXISTS idx_knowledge_base_type ON knowledge_base(type);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_audience ON knowledge_base(audience);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON knowledge_base USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_deprecated ON knowledge_base(deprecated) WHERE deprecated = false;

-- Комментарии к таблице и полям
COMMENT ON TABLE knowledge_base IS 'База знаний для менеджеров: факты и инструкции по работе с клиентами';
COMMENT ON COLUMN knowledge_base.id IS 'Уникальный идентификатор карточки (например, GH-0001)';
COMMENT ON COLUMN knowledge_base.type IS 'Тип карточки: FACT (факт) или HOWTO (инструкция)';
COMMENT ON COLUMN knowledge_base.audience IS 'Аудитория: internal_only (только для менеджеров) или client_safe (можно показывать клиенту)';
COMMENT ON COLUMN knowledge_base.title IS 'Краткий заголовок карточки';
COMMENT ON COLUMN knowledge_base.text IS 'Основной текст карточки';
COMMENT ON COLUMN knowledge_base.tags IS 'Массив тегов для поиска и фильтрации';
COMMENT ON COLUMN knowledge_base.source_ref IS 'Ссылка на источник (JSON объект с post_id, date, line_no)';
COMMENT ON COLUMN knowledge_base.deprecated IS 'Помечена ли карточка как устаревшая (true)';
COMMENT ON COLUMN knowledge_base.kb_version IS 'Версия базы знаний, к которой относится карточка';

-- Включаем Row Level Security (RLS)
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Политика: разрешаем чтение всем аутентифицированным пользователям
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'knowledge_base' 
        AND policyname = 'Allow authenticated users to read knowledge_base'
    ) THEN
        CREATE POLICY "Allow authenticated users to read knowledge_base"
            ON knowledge_base
            FOR SELECT
            TO authenticated
            USING (true);
    END IF;
END $$;

-- Политика: разрешаем чтение анонимным пользователям (для калькулятора)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'knowledge_base' 
        AND policyname = 'Allow anonymous users to read knowledge_base'
    ) THEN
        CREATE POLICY "Allow anonymous users to read knowledge_base"
            ON knowledge_base
            FOR SELECT
            TO anon
            USING (true);
    END IF;
END $$;

-- Политика: изменения данных
-- ВАЖНО: В этом проекте используется кастомная авторизация через таблицу users (не Supabase Auth)
-- Изменения базы знаний делаются через скрипты с service_role key, поэтому RLS политика для изменений не нужна
-- Для чтения уже есть политики выше (authenticated и anon)
-- Если нужно ограничить изменения, можно добавить политику позже

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_knowledge_base_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at (если не существует)
DROP TRIGGER IF EXISTS knowledge_base_updated_at ON knowledge_base;
CREATE TRIGGER knowledge_base_updated_at
    BEFORE UPDATE ON knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_knowledge_base_updated_at();
