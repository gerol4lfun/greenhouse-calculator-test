/**
 * Скрипт для обработки CSV файла с ценами на грядки и загрузки в Supabase
 * 
 * Использование:
 * npm run beds:import
 * или
 * node scripts/process_beds_csv.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Пробуем загрузить .env из разных мест (как в import_kb.js)
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

/**
 * Парсит URL товара и извлекает характеристики грядки
 */
function parseProductUrl(url) {
    if (!url) return null;
    
    // Извлекаем часть после /item/
    const match = url.match(/\/item\/([^\/]+)\//);
    if (!match) return null;
    
    const itemSlug = match[1];
    
    // Определяем высоту (низкие или высокие)
    let height = null;
    if (itemSlug.includes('nizkie')) {
        height = 19; // Низкие
    } else if (itemSlug.includes('vysokie')) {
        height = 38; // Высокие
    } else {
        // Если не указано явно, нужно будет определить по цене позже
        height = null;
    }
    
    // Извлекаем ширину
    let width = null;
    // Сначала пробуем найти явные паттерны в URL
    if (itemSlug.includes('05m') || itemSlug.includes('05-m')) {
        width = 0.5;
    } else if (itemSlug.includes('065m')) {
        width = 0.65;
    } else if (itemSlug.includes('075m') || itemSlug.includes('0.75')) {
        // 0.75 м в каталоге соответствует 0.8 м в нашей системе
        width = 0.8;
    } else if (itemSlug.includes('1m') && !itemSlug.includes('10')) {
        width = 1.0;
    } else {
        // Пробуем извлечь числовое значение
        const widthMatch = itemSlug.match(/(\d+\.?\d*)\s*m/);
        if (widthMatch) {
            const parsedWidth = parseFloat(widthMatch[1]);
            // Нормализуем 0.75 к 0.8
            width = parsedWidth === 0.75 ? 0.8 : parsedWidth;
        }
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
    // Нормализуем ширину: 0.75 -> 0.8
    const normalizedWidth = width === 0.75 ? 0.8 : width;
    return `${heightPrefix}-${normalizedWidth}-${length}`;
}

/**
 * Читает и обрабатывает CSV файл
 */
async function processCSV() {
    const csvPath = path.join(__dirname, '..', 'gryadki_prices.csv');
    
    if (!fs.existsSync(csvPath)) {
        console.error(`❌ Файл не найден: ${csvPath}`);
        process.exit(1);
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // Пропускаем заголовок
    const dataLines = lines.slice(1);
    
    console.log(`📊 Обработка ${dataLines.length} строк...`);
    
    // Группируем данные по типу грядки (height, width, length)
    const bedsMap = new Map();
    
    // Сначала собираем все данные и определяем высоту по цене
    const tempData = [];
    
    for (const line of dataLines) {
        if (!line.trim()) continue;
        
        const [cityRoot, productUrl, lengthStr, priceStr] = line.split(',');
        
        if (!productUrl || !lengthStr || !priceStr) continue;
        
        const parsed = parseProductUrl(productUrl);
        if (!parsed) continue;
        
        const length = parseLength(lengthStr);
        if (!length) continue;
        
        const price = parseInt(priceStr);
        if (isNaN(price)) continue;
        
        tempData.push({
            height: parsed.height,
            width: parsed.width,
            length,
            price,
            productUrl: productUrl.trim(),
            itemSlug: parsed.itemSlug
        });
    }
    
    // Определяем высоту для записей, где она не указана явно
    // Группируем по ширине и длине, сравниваем цены
    const groupedByWidthLength = new Map();
    
    for (const item of tempData) {
        const key = `${item.width}-${item.length}`;
        if (!groupedByWidthLength.has(key)) {
            groupedByWidthLength.set(key, []);
        }
        groupedByWidthLength.get(key).push(item);
    }
    
    // Для каждой группы определяем высоту по цене
    for (const [key, items] of groupedByWidthLength) {
        if (items.length === 1) {
            // Если только одна запись, считаем её низкой (если не указано)
            if (items[0].height === null) {
                items[0].height = 19;
            }
        } else {
            // Если несколько записей, более дорогие - высокие, дешевые - низкие
            const sorted = items.sort((a, b) => a.price - b.price);
            const lowPrice = sorted[0].price;
            const highPrice = sorted[sorted.length - 1].price;
            
            // Если разница значительная (больше 30%), то это разные типы
            if (highPrice > lowPrice * 1.3) {
                for (const item of sorted) {
                    if (item.height === null) {
                        // Более дешевые - низкие, более дорогие - высокие
                        item.height = item.price <= (lowPrice + highPrice) / 2 ? 19 : 38;
                    }
                }
            } else {
                // Если разница небольшая, возможно это один тип, но разные города
                // Берем среднюю цену
                const avgPrice = items.reduce((sum, item) => sum + item.price, 0) / items.length;
                for (const item of items) {
                    if (item.height === null) {
                        // Если цена близка к минимальной - низкие, иначе - высокие
                        item.height = item.price <= avgPrice * 0.8 ? 19 : 38;
                    }
                }
            }
        }
    }
    
    // Теперь группируем по уникальным комбинациям (height, width, length)
    // Берем среднюю цену, если есть несколько записей
    for (const item of tempData) {
        if (!item.height || !item.width) {
            console.warn(`⚠️ Пропущена запись: ${item.itemSlug}, длина ${item.length}, цена ${item.price}`);
            continue;
        }
        
        const bedId = generateBedId(item.height, item.width, item.length);
        
        if (!bedsMap.has(bedId)) {
            bedsMap.set(bedId, {
                id: bedId,
                height: item.height,
                width: item.width,
                length: item.length,
                prices: [],
                productUrls: []
            });
        }
        
        const bed = bedsMap.get(bedId);
        bed.prices.push(item.price);
        if (!bed.productUrls.includes(item.productUrl)) {
            bed.productUrls.push(item.productUrl);
        }
    }
    
    // Вычисляем среднюю цену для каждой грядки
    const beds = Array.from(bedsMap.values()).map(bed => {
        const avgPrice = Math.round(bed.prices.reduce((sum, p) => sum + p, 0) / bed.prices.length);
        // Нормализуем ширину: 0.75 -> 0.8
        const normalizedWidth = bed.width === 0.75 ? 0.8 : bed.width;
        const heightName = bed.height === 19 ? 'Низкие' : 'Высокие';
        const name = `${heightName} ${normalizedWidth} м (Ш ${normalizedWidth}, В ${bed.height} см) - ${bed.length}м`;
        
        return {
            id: bed.id,
            height: bed.height,
            width: normalizedWidth,
            length: bed.length,
            price: avgPrice,
            name: name,
            product_url: bed.productUrls[0] // Берем первый URL
        };
    });
    
    // Сортируем по высоте, ширине, длине
    beds.sort((a, b) => {
        if (a.height !== b.height) return a.height - b.height;
        if (a.width !== b.width) return a.width - b.width;
        return a.length - b.length;
    });
    
    console.log(`✅ Обработано ${beds.length} уникальных грядок`);
    console.log(`\nПримеры данных:`);
    beds.slice(0, 5).forEach(bed => {
        console.log(`  ${bed.id}: ${bed.name} - ${bed.price} руб.`);
    });
    
    return beds;
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
        .neq('id', ''); // Удаляем все записи
    
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
            console.error(`❌ Ошибка при загрузке батча ${i / batchSize + 1}:`, error);
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
        console.log('🚀 Начало обработки CSV файла с грядками...\n');
        
        // Обрабатываем CSV
        const beds = await processCSV();
        
        // Загружаем в Supabase
        const success = await loadToSupabase(beds);
        
        if (success) {
            console.log('\n✅ Готово! Данные успешно загружены в Supabase.');
            console.log(`\nВсего загружено: ${beds.length} записей`);
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

module.exports = { processCSV, loadToSupabase };
