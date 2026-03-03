#!/usr/bin/env node

/**
 * Скрипт для сканирования структуры фотографий теплиц
 * и создания JSON файла со списком всех фотографий
 * 
 * Версия: v231
 * Дата: 2026-02-25
 */

const fs = require('fs');
const path = require('path');

const GREENHOUSES_DIR = path.join(__dirname, '../image/greenhouses');
const OUTPUT_FILE = path.join(__dirname, '../js/greenhouses-photos-list.js');

// Маппинг названий папок на названия теплиц в калькуляторе
const GREENHOUSE_MAPPING = {
    'Теплицы Боярские': {
        'Боярская 2.5м': 'ТЕПЛИЦА БОЯРСКАЯ 2.5М',
        'Боярская 3м': 'ТЕПЛИЦА БОЯРСКАЯ 3М',
        'Боярская Делюкс 2.5м': 'ТЕПЛИЦА БОЯРСКАЯ ДЕЛЮКС 2.5М',
        'Боярская Делюкс 3м': 'ТЕПЛИЦА БОЯРСКАЯ ДЕЛЮКС 3М',
        'Боярская Люкс 2.5м': 'ТЕПЛИЦА БОЯРСКАЯ ЛЮКС 2.5М',
        'Боярская Люкс 3.5м': 'ТЕПЛИЦА БОЯРСКАЯ ЛЮКС 3.5М',
        'Боярская Люкс 3м': 'ТЕПЛИЦА БОЯРСКАЯ ЛЮКС 3М',
        'Боярская Премиум 2.5м': 'ТЕПЛИЦА БОЯРСКАЯ ПРЕМИУМ 2.5М',
        'Боярская Премиум 3.5м': 'ТЕПЛИЦА БОЯРСКАЯ ПРЕМИУМ 3.5М',
        'Боярская Премиум 3м': 'ТЕПЛИЦА БОЯРСКАЯ ПРЕМИУМ 3М',
        'Боярская Премиум 4м': 'ТЕПЛИЦА БОЯРСКАЯ ПРЕМИУМ 4М'
    },
    'Теплицы Стрелки': {
        'Стрелка Люкс 2.5м': 'ТЕПЛИЦА СТРЕЛЕЦКАЯ ЛЮКС 2.5М',
        'Стрелка Люкс 3.5м': 'ТЕПЛИЦА СТРЕЛЕЦКАЯ ЛЮКС 3.5М',
        'Стрелка Люкс 3м': 'ТЕПЛИЦА СТРЕЛЕЦКАЯ ЛЮКС 3М'
    },
    'Теплицы Царские': {
        'Царская Люкс 2.5м': 'ТЕПЛИЦА ЦАРСКАЯ ЛЮКС 2.5М',
        'Царская Люкс 3.5м': 'ТЕПЛИЦА ЦАРСКАЯ ЛЮКС 3.5М',
        'Царская Люкс 3м': 'ТЕПЛИЦА ЦАРСКАЯ ЛЮКС 3М',
        'Царская Премиум 2.5м': 'ТЕПЛИЦА ЦАРСКАЯ ПРЕМИУМ 2.5М',
        'Царская Премиум 3.5м': 'ТЕПЛИЦА ЦАРСКАЯ ПРЕМИУМ 3.5М',
        'Царская Премиум 3м': 'ТЕПЛИЦА ЦАРСКАЯ ПРЕМИУМ 3М',
        'Царская Премиум 4м': 'ТЕПЛИЦА ЦАРСКАЯ ПРЕМИУМ 4М'
    },
    'Теплицы Домиком': {
        'Домик Люкс 2.5м': 'ТЕПЛИЦА ДВОРЦОВАЯ ЛЮКС 2.5М',
        'Домик Люкс 3.5м': 'ТЕПЛИЦА ДВОРЦОВАЯ ЛЮКС 3.5М',
        'Домик Люкс 3м': 'ТЕПЛИЦА ДВОРЦОВАЯ ЛЮКС 3М',
        'Домик Премиум 2.5м': 'ТЕПЛИЦА ДВОРЦОВАЯ ПРЕМИУМ 2.5М',
        'Домик Премиум 3.5м': 'ТЕПЛИЦА ДВОРЦОВАЯ ПРЕМИУМ 3.5М',
        'Домик Премиум 3м': 'ТЕПЛИЦА ДВОРЦОВАЯ ПРЕМИУМ 3М',
        'Домик Премиум 4м': 'ТЕПЛИЦА ДВОРЦОВАЯ ПРЕМИУМ 4М'
    },
    'Теплицы Пристенные': {
        'Пристенная Люкс 2.5м': 'ТЕПЛИЦА ПРИСТЕННАЯ ЛЮКС 2.5М',
        'Пристенная Люкс 3м': 'ТЕПЛИЦА ПРИСТЕННАЯ ЛЮКС 3М',
        'Пристенная Премиум 2.5м': 'ТЕПЛИЦА ПРИСТЕННАЯ ПРЕМИУМ 2.5М',
        'Пристенная Премиум 3м': 'ТЕПЛИЦА ПРИСТЕННАЯ ПРЕМИУМ 3М'
    },
    'Теплицы Митлайдер': {
        'Митлайдер Люкс арочный 3.5м': 'ТЕПЛИЦА МИТТЛАЙДЕР ЛЮКС 3.5М',
        'Митлайдер Люкс арочный 3м': 'ТЕПЛИЦА МИТТЛАЙДЕР ЛЮКС 3М',
        'Митлайдер Президент 3.5м': 'ТЕПЛИЦА МИТТЛАЙДЕР ЭЛИТ 3.5М',
        'Митлайдер Президент 3м': 'ТЕПЛИЦА МИТТЛАЙДЕР ЭЛИТ 3М',
        'Митлайдер Премиум арочный 3.5м': 'ТЕПЛИЦА МИТТЛАЙДЕР ПРЕМИУМ 3.5М',
        'Митлайдер Премиум арочный 3м': 'ТЕПЛИЦА МИТТЛАЙДЕР ПРЕМИУМ 3М'
    },
    'теплицы Премьеры': {
        'Монарх 7 - 8м': ['ТЕПЛИЦА МОНАРХ ПРЕМИУМ 7М', 'ТЕПЛИЦА МОНАРХ ПРЕМИУМ 8М'],
        'Президент Премиум 6м': 'ТЕПЛИЦА ПРЕМЬЕР ПРЕМИУМ 6М',
        'Премьер Премиум 5м': 'ТЕПЛИЦА ПРЕМЬЕР ПРЕМИУМ 5М'
    }
};

function scanDirectory(dirPath) {
    const photos = [];
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            photos.push(...scanDirectory(filePath));
        } else if (/\.(jpg|jpeg)$/i.test(file)) {
            const relativePath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');
            photos.push(relativePath);
        }
    }
    
    return photos;
}

function buildPhotosList() {
    const photosList = {};
    
    if (!fs.existsSync(GREENHOUSES_DIR)) {
        console.error(`❌ Папка ${GREENHOUSES_DIR} не найдена!`);
        return null;
    }
    
    const mainDirs = fs.readdirSync(GREENHOUSES_DIR);
    
    for (const mainDir of mainDirs) {
        const mainDirPath = path.join(GREENHOUSES_DIR, mainDir);
        if (!fs.statSync(mainDirPath).isDirectory()) continue;
        
        const subDirs = fs.readdirSync(mainDirPath);
        
        for (const subDir of subDirs) {
            const subDirPath = path.join(mainDirPath, subDir);
            if (!fs.statSync(subDirPath).isDirectory()) continue;
            
            // Находим соответствующее название теплицы
            // Функция нормализации (убирает диакритические знаки)
            const normalize = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
            
            // Пробуем найти по точному совпадению, если не найдено - по нормализованному
            let mapping = GREENHOUSE_MAPPING[mainDir];
            if (!mapping) {
                // Пробуем найти по нормализованному названию
                const normalizedMainDir = normalize(mainDir);
                for (const key in GREENHOUSE_MAPPING) {
                    const normalizedKey = normalize(key);
                    if (normalizedMainDir === normalizedKey) {
                        mapping = GREENHOUSE_MAPPING[key];
                        break;
                    }
                }
            }
            if (!mapping) {
                console.log(`⚠️  Не найдено маппинга для папки: "${mainDir}"`);
                continue;
            }
            
            // Нормализуем название подпапки для поиска
            const normalizedSubDir = normalize(subDir);
            let greenhouseName = null;
            
            // Ищем по нормализованному названию
            for (const key in mapping) {
                if (normalize(key) === normalizedSubDir) {
                    greenhouseName = mapping[key];
                    break;
                }
            }
            
            if (!greenhouseName) {
                console.log(`⚠️  Не найдено маппинга для подпапки: "${subDir}" в "${mainDir}"`);
                continue;
            }
            
            // Сканируем фотографии в подпапке
            const photos = scanDirectory(subDirPath);
            
            // Если greenhouseName - массив (для Монарх 7-8м)
            if (Array.isArray(greenhouseName)) {
                for (const name of greenhouseName) {
                    photosList[name] = photos;
                }
            } else {
                photosList[greenhouseName] = photos;
            }
        }
    }
    
    return photosList;
}

// Генерируем список фотографий
const photosList = buildPhotosList();

if (photosList) {
    const output = `/**
 * Автоматически сгенерированный список фотографий теплиц
 * Версия: v231
 * Дата: ${new Date().toISOString().split('T')[0]}
 * 
 * ВНИМАНИЕ: Этот файл генерируется автоматически скриптом scan_greenhouses_photos.js
 * Не редактируйте вручную!
 */

const GREENHOUSES_PHOTOS_LIST = ${JSON.stringify(photosList, null, 2)};

// Экспорт для использования в других файлах
if (typeof window !== 'undefined') {
    window.GREENHOUSES_PHOTOS_LIST = GREENHOUSES_PHOTOS_LIST;
}
`;
    
    fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
    
    const totalPhotos = Object.values(photosList).reduce((sum, photos) => sum + photos.length, 0);
    console.log('✅ Список фотографий создан!');
    console.log(`   Файл: ${OUTPUT_FILE}`);
    console.log(`   Типов теплиц: ${Object.keys(photosList).length}`);
    console.log(`   Всего фотографий: ${totalPhotos}`);
} else {
    console.error('❌ Не удалось создать список фотографий');
    process.exit(1);
}
