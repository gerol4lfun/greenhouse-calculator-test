/**
 * Импортёр базы знаний
 * 
 * Читает kb/greenhouse_kb.v1.json
 * Валидирует данные
 * Делает upsert в knowledge_base по id
 * Логирует: inserted/updated/skipped(deprecated)
 * 
 * Использование: npm run kb:import
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Пробуем загрузить .env из разных мест
const rootEnv = path.join(__dirname, '..', '.env');
const telegramBotEnv = path.join(__dirname, '..', 'telegram-bot', '.env');

// Загружаем .env из корня проекта
if (fs.existsSync(rootEnv)) {
    require('dotenv').config({ path: rootEnv });
    console.log('✅ Загружен .env из корня проекта');
}
// Если нет в корне, пробуем из telegram-bot
else if (fs.existsSync(telegramBotEnv)) {
    require('dotenv').config({ path: telegramBotEnv });
    console.log('✅ Загружен .env из telegram-bot/.env');
} else {
    console.log('⚠️ .env файл не найден, используем переменные окружения системы');
}

// Настройки Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dyoibmfdohpvjltfaygr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Ошибка: SUPABASE_SERVICE_ROLE_KEY не установлен!');
    console.error('Проверьте .env файл в:');
    console.error(`  - ${rootEnv}`);
    console.error(`  - ${telegramBotEnv}`);
    console.error('Добавьте в .env файл: SUPABASE_SERVICE_ROLE_KEY=ваш_ключ');
    process.exit(1);
}

console.log('✅ SUPABASE_SERVICE_ROLE_KEY найден');

// Инициализация Supabase клиента
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});

// Валидация карточки
function validateCard(card, index) {
    const errors = [];
    
    // Обязательные поля
    const requiredFields = ['id', 'type', 'audience', 'title', 'text', 'source_ref'];
    for (const field of requiredFields) {
        if (!card[field] && card[field] !== false && card[field] !== '') {
            errors.push(`Отсутствует обязательное поле: ${field}`);
        }
    }
    
    // Валидация типа
    if (card.type && !['FACT', 'HOWTO'].includes(card.type)) {
        errors.push(`Недопустимый type: ${card.type}. Допустимые: FACT, HOWTO`);
    }
    
    // Валидация audience
    if (card.audience && !['internal_only', 'client_safe'].includes(card.audience)) {
        errors.push(`Недопустимый audience: ${card.audience}. Допустимые: internal_only, client_safe`);
    }
    
    // Валидация source_ref (должен быть объект)
    if (card.source_ref && typeof card.source_ref !== 'object') {
        errors.push(`source_ref должен быть объектом`);
    }
    
    // Валидация tags (должен быть массив)
    if (card.tags && !Array.isArray(card.tags)) {
        errors.push(`tags должен быть массивом`);
    }
    
    if (errors.length > 0) {
        return {
            valid: false,
            errors: errors,
            card: card.id || `[${index}]`
        };
    }
    
    return { valid: true };
}

// Импорт базы знаний
async function importKnowledgeBase() {
    try {
        // Читаем JSON файл
        const jsonPath = path.join(__dirname, '..', 'kb', 'greenhouse_kb.v1.json');
        
        if (!fs.existsSync(jsonPath)) {
            console.error(`❌ Файл не найден: ${jsonPath}`);
            process.exit(1);
        }
        
        const jsonData = fs.readFileSync(jsonPath, 'utf8');
        const knowledgeBase = JSON.parse(jsonData);
        
        if (!Array.isArray(knowledgeBase)) {
            console.error('❌ JSON должен быть массивом карточек');
            process.exit(1);
        }
        
        console.log(`📚 Найдено ${knowledgeBase.length} карточек для импорта\n`);
        
        // Валидация всех карточек
        const validationErrors = [];
        for (let i = 0; i < knowledgeBase.length; i++) {
            const validation = validateCard(knowledgeBase[i], i);
            if (!validation.valid) {
                validationErrors.push({
                    card: validation.card,
                    errors: validation.errors
                });
            }
        }
        
        if (validationErrors.length > 0) {
            console.error('❌ Ошибки валидации:\n');
            validationErrors.forEach(({ card, errors }) => {
                console.error(`  ${card}:`);
                errors.forEach(err => console.error(`    - ${err}`));
            });
            process.exit(1);
        }
        
        console.log('✅ Валидация пройдена\n');
        
        // Статистика
        let insertedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        
        // Проверяем существующие записи
        const { data: existingData, error: fetchError } = await supabase
            .from('knowledge_base')
            .select('id');
        
        if (fetchError) {
            console.error('❌ Ошибка при получении существующих записей:', fetchError.message);
            process.exit(1);
        }
        
        const existingIds = new Set(existingData.map(item => item.id));
        
        // Импортируем каждую карточку
        for (const card of knowledgeBase) {
            try {
                // Пропускаем deprecated карточки
                if (card.deprecated === true) {
                    console.log(`⏭️  Пропущено (deprecated): ${card.id} - ${card.title}`);
                    skippedCount++;
                    continue;
                }
                
                const isNew = !existingIds.has(card.id);
                
                const { data, error } = await supabase
                    .from('knowledge_base')
                    .upsert(
                        {
                            id: card.id,
                            type: card.type,
                            audience: card.audience,
                            title: card.title,
                            text: card.text,
                            tags: card.tags || [],
                            source_ref: card.source_ref,
                            needs_input: card.needs_input || false,
                            needs_from_owner: card.needs_from_owner || '',
                            deprecated: card.deprecated || false,
                            kb_version: card.kb_version || 'v1.0',
                            kb_updated_at: card.kb_updated_at || '2026-02-03',
                        },
                        {
                            onConflict: 'id',
                            ignoreDuplicates: false,
                        }
                    );
                
                if (error) {
                    console.error(`❌ Ошибка при импорте ${card.id}:`, error.message);
                    errorCount++;
                } else {
                    if (isNew) {
                        console.log(`✅ Вставлено: ${card.id} - ${card.title}`);
                        insertedCount++;
                    } else {
                        console.log(`🔄 Обновлено: ${card.id} - ${card.title}`);
                        updatedCount++;
                    }
                }
            } catch (err) {
                console.error(`❌ Ошибка при импорте ${card.id}:`, err.message);
                errorCount++;
            }
        }
        
        // Итоговая статистика
        console.log(`\n📊 Итоги импорта:`);
        console.log(`   ✅ Вставлено: ${insertedCount}`);
        console.log(`   🔄 Обновлено: ${updatedCount}`);
        console.log(`   ⏭️  Пропущено (deprecated): ${skippedCount}`);
        console.log(`   ❌ Ошибок: ${errorCount}`);
        console.log(`   📚 Всего обработано: ${knowledgeBase.length}`);
        
        if (errorCount === 0) {
            console.log(`\n🎉 Импорт завершён успешно!`);
        } else {
            console.log(`\n⚠️ Импорт завершён с ошибками.`);
            process.exit(1);
        }
        
    } catch (err) {
        console.error('❌ Критическая ошибка:', err);
        process.exit(1);
    }
}

// Запуск
importKnowledgeBase();
