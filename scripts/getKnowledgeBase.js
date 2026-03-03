/**
 * Функция поиска в базе знаний
 * 
 * Параметры:
 * - q: поисковый запрос (поиск в title и text)
 * - tags: массив тегов для фильтрации
 * - type: тип карточки (FACT или HOWTO)
 * - audience: аудитория (internal_only или client_safe)
 * - includeDeprecated: включать ли deprecated карточки (по умолчанию false)
 * 
 * Использование:
 * const results = await getKnowledgeBase({ q: 'оплата', tags: ['оплата'], includeDeprecated: false });
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Настройки Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dyoibmfdohpvjltfaygr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Ошибка: SUPABASE_SERVICE_ROLE_KEY не установлен!');
    process.exit(1);
}

// Инициализация Supabase клиента
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});

/**
 * Поиск в базе знаний
 * @param {Object} params - Параметры поиска
 * @param {string} [params.q] - Поисковый запрос (поиск в title и text)
 * @param {string[]} [params.tags] - Массив тегов для фильтрации
 * @param {string} [params.type] - Тип карточки (FACT или HOWTO)
 * @param {string} [params.audience] - Аудитория (internal_only или client_safe)
 * @param {boolean} [params.includeDeprecated=false] - Включать ли deprecated карточки
 * @returns {Promise<Array>} Массив найденных карточек
 */
async function getKnowledgeBase({
    q = null,
    tags = null,
    type = null,
    audience = null,
    includeDeprecated = false
} = {}) {
    try {
        let query = supabase
            .from('knowledge_base')
            .select('*');
        
        // Фильтр по deprecated
        if (!includeDeprecated) {
            query = query.eq('deprecated', false);
        }
        
        // Фильтр по типу
        if (type) {
            query = query.eq('type', type);
        }
        
        // Фильтр по аудитории
        if (audience) {
            query = query.eq('audience', audience);
        }
        
        // Фильтр по тегам
        if (tags && Array.isArray(tags) && tags.length > 0) {
            query = query.contains('tags', tags);
        }
        
        // Поиск по тексту (q)
        if (q) {
            // Используем ilike для поиска без учета регистра
            query = query.or(`title.ilike.%${q}%,text.ilike.%${q}%`);
        }
        
        const { data, error } = await query.order('title', { ascending: true });
        
        if (error) {
            console.error('❌ Ошибка при поиске:', error.message);
            throw error;
        }
        
        return data || [];
        
    } catch (err) {
        console.error('❌ Ошибка в getKnowledgeBase:', err);
        throw err;
    }
}

// Экспорт для использования в других модулях
module.exports = { getKnowledgeBase };

// Если запущен напрямую - пример использования
if (require.main === module) {
    (async () => {
        console.log('🔍 Примеры использования:\n');
        
        // Пример 1: Поиск по запросу
        console.log('1. Поиск по запросу "оплата":');
        const results1 = await getKnowledgeBase({ q: 'оплата' });
        console.log(`   Найдено: ${results1.length} карточек\n`);
        
        // Пример 2: Фильтр по тегам
        console.log('2. Фильтр по тегам ["оплата", "условия"]:');
        const results2 = await getKnowledgeBase({ tags: ['оплата', 'условия'] });
        console.log(`   Найдено: ${results2.length} карточек\n`);
        
        // Пример 3: Фильтр по типу
        console.log('3. Фильтр по типу "HOWTO":');
        const results3 = await getKnowledgeBase({ type: 'HOWTO' });
        console.log(`   Найдено: ${results3.length} карточек\n`);
        
        // Пример 4: Комбинированный поиск
        console.log('4. Комбинированный поиск (q="доставка", type="FACT"):');
        const results4 = await getKnowledgeBase({ q: 'доставка', type: 'FACT' });
        console.log(`   Найдено: ${results4.length} карточек\n`);
        
    })();
}
