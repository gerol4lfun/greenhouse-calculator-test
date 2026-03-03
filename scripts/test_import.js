// Тестовый скрипт для проверки импорта
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка конфигурации...\n');

// Пробуем загрузить .env из разных мест
const rootEnv = path.join(__dirname, '..', '.env');
const telegramBotEnv = path.join(__dirname, '..', 'telegram-bot', '.env');

console.log('Ищу .env файлы:');
console.log(`  Корень: ${rootEnv} - ${fs.existsSync(rootEnv) ? '✅ найден' : '❌ не найден'}`);
console.log(`  Telegram-bot: ${telegramBotEnv} - ${fs.existsSync(telegramBotEnv) ? '✅ найден' : '❌ не найден'}\n`);

// Загружаем .env
if (fs.existsSync(rootEnv)) {
    require('dotenv').config({ path: rootEnv });
    console.log('✅ Загружен .env из корня проекта');
} else if (fs.existsSync(telegramBotEnv)) {
    require('dotenv').config({ path: telegramBotEnv });
    console.log('✅ Загружен .env из telegram-bot/.env');
} else {
    console.log('⚠️ .env файл не найден');
}

// Проверяем переменные
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n📋 Переменные окружения:');
console.log(`  SUPABASE_URL: ${SUPABASE_URL ? '✅ установлен' : '❌ не установлен'}`);
console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? '✅ установлен (длина: ' + SUPABASE_SERVICE_ROLE_KEY.length + ')' : '❌ не установлен'}`);

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('\n❌ SUPABASE_SERVICE_ROLE_KEY не найден!');
    process.exit(1);
}

// Проверяем JSON файл
const jsonPath = path.join(__dirname, '..', 'kb', 'greenhouse_kb.v1.json');
console.log(`\n📄 JSON файл: ${jsonPath}`);
console.log(`  Существует: ${fs.existsSync(jsonPath) ? '✅' : '❌'}`);

if (fs.existsSync(jsonPath)) {
    try {
        const jsonData = fs.readFileSync(jsonPath, 'utf8');
        const knowledgeBase = JSON.parse(jsonData);
        console.log(`  Карточек в файле: ${knowledgeBase.length}`);
    } catch (err) {
        console.log(`  ❌ Ошибка чтения: ${err.message}`);
    }
}

// Тестируем подключение к Supabase
console.log('\n🔌 Тестирую подключение к Supabase...');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});

// Проверяем таблицу
supabase
    .from('knowledge_base')
    .select('id')
    .limit(1)
    .then(({ data, error }) => {
        if (error) {
            console.log(`  ❌ Ошибка: ${error.message}`);
        } else {
            console.log(`  ✅ Подключение успешно!`);
            console.log(`  Записей в таблице: ${data ? data.length : 0}`);
        }
        console.log('\n✅ Проверка завершена. Можно запускать импорт!');
    })
    .catch(err => {
        console.log(`  ❌ Ошибка подключения: ${err.message}`);
    });
