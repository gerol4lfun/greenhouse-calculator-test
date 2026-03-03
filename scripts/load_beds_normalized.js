/**
 * Скрипт для загрузки нормализованных данных грядок в Supabase
 * 
 * Использует существующую структуру BEDS_DATA и дополняет её ценами из CSV
 * 
 * Использование:
 * npm run beds:import
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Пробуем загрузить .env из разных мест
const rootEnv = path.join(__dirname, '..', '.env');
const telegramBotEnv = path.join(__dirname, '..', 'telegram-bot', '.env');

if (fs.existsSync(rootEnv)) {
    require('dotenv').config({ path: rootEnv });
    console.log('✅ Загружен .env из корня проекта');
} else if (fs.existsSync(telegramBotEnv)) {
    require('dotenv').config({ path: telegramBotEnv });
    console.log('✅ Загружен .env из telegram-bot/.env');
} else {
    console.log('⚠️ .env файл не найден, используем переменные окружения системы');
}

// Конфигурация Supabase
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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});

// Нормализованная структура грядок (из js/scripts.js)
const BEDS_STRUCTURE = [
    // Низкие грядки (В 19 см)
    { id: 'low-0.5-4', height: 19, width: 0.5, length: 4 },
    { id: 'low-0.5-6', height: 19, width: 0.5, length: 6 },
    { id: 'low-0.5-8', height: 19, width: 0.5, length: 8 },
    { id: 'low-0.5-10', height: 19, width: 0.5, length: 10 },
    { id: 'low-0.5-12', height: 19, width: 0.5, length: 12 },
    { id: 'low-0.65-4', height: 19, width: 0.65, length: 4 },
    { id: 'low-0.65-6', height: 19, width: 0.65, length: 6 },
    { id: 'low-0.65-8', height: 19, width: 0.65, length: 8 },
    { id: 'low-0.65-10', height: 19, width: 0.65, length: 10 },
    { id: 'low-0.65-12', height: 19, width: 0.65, length: 12 },
    { id: 'low-0.8-4', height: 19, width: 0.8, length: 4 },
    { id: 'low-0.8-6', height: 19, width: 0.8, length: 6 },
    { id: 'low-0.8-8', height: 19, width: 0.8, length: 8 },
    { id: 'low-0.8-10', height: 19, width: 0.8, length: 10 },
    { id: 'low-0.8-12', height: 19, width: 0.8, length: 12 },
    { id: 'low-1-4', height: 19, width: 1, length: 4 },
    { id: 'low-1-6', height: 19, width: 1, length: 6 },
    { id: 'low-1-8', height: 19, width: 1, length: 8 },
    { id: 'low-1-10', height: 19, width: 1, length: 10 },
    { id: 'low-1-12', height: 19, width: 1, length: 12 },
    // Высокие грядки (В 38 см)
    { id: 'high-0.5-4', height: 38, width: 0.5, length: 4 },
    { id: 'high-0.5-6', height: 38, width: 0.5, length: 6 },
    { id: 'high-0.5-8', height: 38, width: 0.5, length: 8 },
    { id: 'high-0.5-10', height: 38, width: 0.5, length: 10 },
    { id: 'high-0.5-12', height: 38, width: 0.5, length: 12 },
    { id: 'high-0.65-4', height: 38, width: 0.65, length: 4 },
    { id: 'high-0.65-6', height: 38, width: 0.65, length: 6 },
    { id: 'high-0.65-8', height: 38, width: 0.65, length: 8 },
    { id: 'high-0.65-10', height: 38, width: 0.65, length: 10 },
    { id: 'high-0.65-12', height: 38, width: 0.65, length: 12 },
    { id: 'high-0.8-4', height: 38, width: 0.8, length: 4 },
    { id: 'high-0.8-6', height: 38, width: 0.8, length: 6 },
    { id: 'high-0.8-8', height: 38, width: 0.8, length: 8 },
    { id: 'high-0.8-10', height: 38, width: 0.8, length: 10 },
    { id: 'high-0.8-12', height: 38, width: 0.8, length: 12 },
    { id: 'high-1-4', height: 38, width: 1, length: 4 },
    { id: 'high-1-6', height: 38, width: 1, length: 6 },
    { id: 'high-1-8', height: 38, width: 1, length: 8 },
    { id: 'high-1-10', height: 38, width: 1, length: 10 },
    { id: 'high-1-12', height: 38, width: 1, length: 12 }
];

/**
 * Парсит URL товара и извлекает характеристики
 */
function parseProductUrl(url) {
    if (!url) return null;
    
    const match = url.match(/\/item\/([^\/]+)\//);
    if (!match) return null;
    
    const itemSlug = match[1];
    
    // Определяем высоту
    let height = null;
    if (itemSlug.includes('nizkie')) {
        height = 19;
    } else if (itemSlug.includes('vysokie')) {
        height = 38;
    }
    
    // Извлекаем ширину
    let width = null;
    if (itemSlug.includes('05m') || itemSlug.includes('05-m')) {
        width = 0.5;
    } else if (itemSlug.includes('065m')) {
        width = 0.65;
    } else if (itemSlug.includes('075m') || itemSlug.includes('0.75')) {
        width = 0.8; // Нормализуем 0.75 -> 0.8
    } else if (itemSlug.includes('1m') && !itemSlug.includes('10')) {
        width = 1.0;
    }
    
    return { height, width, itemSlug };
}

/**
 * Парсит длину из строки
 */
function parseLength(lengthStr) {
    const match = lengthStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
}

/**
 * Генерирует ID для грядки
 */
function generateBedId(height, width, length) {
    const heightPrefix = height === 19 ? 'low' : 'high';
    const normalizedWidth = width === 0.75 ? 0.8 : width;
    return `${heightPrefix}-${normalizedWidth}-${length}`;
}

/**
 * Читает CSV и извлекает цены
 */
function extractPricesFromCSV() {
    const csvPath = path.join(__dirname, '..', 'gryadki_prices.csv');
    
    if (!fs.existsSync(csvPath)) {
        console.error(`❌ Файл не найден: ${csvPath}`);
        return null;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    const dataLines = lines.slice(1); // Пропускаем заголовок
    
    console.log(`📊 Обработка ${dataLines.length} строк из CSV...`);
    
    // Мапа для хранения цен: ключ = bedId, значение = массив цен
    const pricesMap = new Map();
    
    for (const line of dataLines) {
        if (!line.trim()) continue;
        
        const [cityRoot, productUrl, lengthStr, priceStr] = line.split(',');
        
        if (!productUrl || !lengthStr || !priceStr) continue;
        
        const parsed = parseProductUrl(productUrl);
        if (!parsed || !parsed.width) continue;
        
        const length = parseLength(lengthStr);
        if (!length) continue;
        
        const price = parseInt(priceStr);
        if (isNaN(price)) continue;
        
        // Если высота не указана в URL, пробуем определить по структуре
        let height = parsed.height;
        if (!height) {
            // Пробуем найти в структуре по ширине и длине
            const matchingBeds = BEDS_STRUCTURE.filter(b => 
                b.width === parsed.width && b.length === length
            );
            if (matchingBeds.length === 2) {
                // Есть и низкие, и высокие - определяем по цене позже
                height = null;
            } else if (matchingBeds.length === 1) {
                height = matchingBeds[0].height;
            }
        }
        
        // Если высота все еще не определена, пропускаем (определим позже)
        if (!height) continue;
        
        const bedId = generateBedId(height, parsed.width, length);
        
        if (!pricesMap.has(bedId)) {
            pricesMap.set(bedId, []);
        }
        pricesMap.get(bedId).push(price);
    }
    
    // Для записей без высоты определяем по цене
    // Группируем по ширине и длине, сравниваем цены
    const groupedByWidthLength = new Map();
    
    for (const line of dataLines) {
        if (!line.trim()) continue;
        
        const [cityRoot, productUrl, lengthStr, priceStr] = line.split(',');
        if (!productUrl || !lengthStr || !priceStr) continue;
        
        const parsed = parseProductUrl(productUrl);
        if (!parsed || !parsed.width) continue;
        
        const length = parseLength(lengthStr);
        if (!length) continue;
        
        const price = parseInt(priceStr);
        if (isNaN(price)) continue;
        
        // Если высота не определена, добавляем в группу
        if (!parsed.height) {
            const key = `${parsed.width}-${length}`;
            if (!groupedByWidthLength.has(key)) {
                groupedByWidthLength.set(key, []);
            }
            groupedByWidthLength.get(key).push({ price, productUrl });
        }
    }
    
    // Определяем высоту по цене для неопределенных записей
    for (const [key, items] of groupedByWidthLength) {
        const [width, length] = key.split('-').map(Number);
        const sorted = items.sort((a, b) => a.price - b.price);
        
        if (sorted.length >= 2) {
            const lowPrice = sorted[0].price;
            const highPrice = sorted[sorted.length - 1].price;
            
            // Если разница значительная, это разные типы
            if (highPrice > lowPrice * 1.3) {
                const midPrice = (lowPrice + highPrice) / 2;
                
                for (const item of sorted) {
                    const height = item.price <= midPrice ? 19 : 38;
                    const bedId = generateBedId(height, width, length);
                    
                    if (!pricesMap.has(bedId)) {
                        pricesMap.set(bedId, []);
                    }
                    pricesMap.get(bedId).push(item.price);
                }
            }
        }
    }
    
    return pricesMap;
}

/**
 * Создает нормализованные данные грядок с ценами
 */
function createNormalizedBeds() {
    const pricesMap = extractPricesFromCSV();
    
    if (!pricesMap) {
        console.error('❌ Не удалось извлечь цены из CSV');
        return null;
    }
    
    console.log(`✅ Извлечено цен для ${pricesMap.size} типов грядок`);
    
    // Создаем нормализованные данные на основе структуры
    const normalizedBeds = BEDS_STRUCTURE.map(bed => {
        const prices = pricesMap.get(bed.id) || [];
        const avgPrice = prices.length > 0 
            ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length)
            : 0;
        
        const heightName = bed.height === 19 ? 'Низкие' : 'Высокие';
        const name = `${heightName} ${bed.width} м (Ш ${bed.width}, В ${bed.height} см) - ${bed.length}м`;
        
        return {
            id: bed.id,
            height: bed.height,
            width: bed.width,
            length: bed.length,
            price: avgPrice,
            name: name,
            product_url: null // Можно добавить позже, если нужно
        };
    });
    
    // Проверяем, что все грядки имеют цены
    const bedsWithoutPrice = normalizedBeds.filter(b => b.price === 0);
    if (bedsWithoutPrice.length > 0) {
        console.warn(`⚠️ Внимание: ${bedsWithoutPrice.length} грядок без цены:`);
        bedsWithoutPrice.forEach(bed => {
            console.warn(`  - ${bed.id}: ${bed.name}`);
        });
    }
    
    return normalizedBeds;
}

/**
 * Загружает данные в Supabase
 */
async function loadToSupabase(beds) {
    console.log(`\n📤 Загрузка данных в Supabase...`);
    
    // Очищаем таблицу
    const { error: deleteError } = await supabase
        .from('beds')
        .delete()
        .neq('id', '');
    
    if (deleteError) {
        console.error('❌ Ошибка при очистке таблицы:', deleteError);
        return false;
    }
    
    console.log('✅ Таблица очищена');
    
    // Загружаем данные батчами по 100 записей
    const batchSize = 100;
    let loaded = 0;
    
    for (let i = 0; i < beds.length; i += batchSize) {
        const batch = beds.slice(i, i + batchSize);
        
        const { data, error } = await supabase
            .from('beds')
            .insert(batch);
        
        if (error) {
            console.error(`❌ Ошибка при загрузке батча ${Math.floor(i / batchSize) + 1}:`, error);
            return false;
        }
        
        loaded += batch.length;
        console.log(`  Загружено ${loaded} / ${beds.length} записей...`);
    }
    
    console.log(`\n✅ Все данные успешно загружены в Supabase!`);
    return true;
}

/**
 * Главная функция
 */
async function main() {
    try {
        console.log('🚀 Начало загрузки нормализованных данных грядок...\n');
        
        // Создаем нормализованные данные
        const beds = createNormalizedBeds();
        
        if (!beds) {
            console.error('❌ Не удалось создать нормализованные данные');
            process.exit(1);
        }
        
        console.log(`\n📋 Создано ${beds.length} нормализованных записей`);
        console.log(`\nПримеры данных:`);
        beds.slice(0, 5).forEach(bed => {
            console.log(`  ${bed.id}: ${bed.name} - ${bed.price} руб.`);
        });
        
        // Загружаем в Supabase
        const success = await loadToSupabase(beds);
        
        if (success) {
            console.log('\n✅ Готово! Данные успешно загружены в Supabase.');
            console.log(`\nВсего загружено: ${beds.length} записей`);
            
            // Статистика
            const withPrice = beds.filter(b => b.price > 0).length;
            const withoutPrice = beds.filter(b => b.price === 0).length;
            console.log(`  - С ценами: ${withPrice}`);
            console.log(`  - Без цен: ${withoutPrice}`);
        } else {
            console.error('\n❌ Произошла ошибка при загрузке данных.');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error);
        process.exit(1);
    }
}

// Запускаем скрипт
if (require.main === module) {
    main();
}

module.exports = { createNormalizedBeds, loadToSupabase };
