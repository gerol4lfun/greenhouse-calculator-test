/**
 * Скрипт для сканирования папки с инструкциями по сборке теплиц
 * Генерирует js/instructions-data.js с маппингом типов теплиц к PDF файлам
 */

const fs = require('fs');
const path = require('path');

const INSTRUCTIONS_DIR = path.join(__dirname, '..', 'Инструкции по сборке теплиц');
const OUTPUT_FILE = path.join(__dirname, '..', 'js', 'instructions-data.js');

// Маппинг папок инструкций к типам теплиц в greenhouses-data.js
const INSTRUCTIONS_MAPPING = {
    'Боярские': 'arochnaya', // Арочная (Боярская)
    'Стрелка (капля)': 'kaplevidnaya', // Каплевидная (Стрелка)
    'Царские': 'pryamostennaya', // Прямостенная (Царская)
    'Домиком': 'domikom', // Домиком (Дворцовая)
    'Пристенные': 'pristennaya', // Пристенная
    'По Митлайдеру': 'mitlayder', // Митлайдер
    'Премьер': 'promyshlennaya' // Промышленная
};

/**
 * Нормализует название для сравнения (убирает диакритические знаки, приводит к нижнему регистру)
 */
function normalizeName(name) {
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '');
}

/**
 * Извлекает размер из названия файла (например, "2.5", "3", "3.5", "4")
 */
function extractSize(filename) {
    const match = filename.match(/(\d+\.?\d*)\s*м/i);
    if (match) {
        return match[1];
    }
    // Пробуем найти просто число
    const numberMatch = filename.match(/(\d+\.?\d*)/);
    return numberMatch ? numberMatch[1] : null;
}

/**
 * Строит структуру данных инструкций
 */
function buildInstructionsData() {
    const instructionsData = {};
    
    if (!fs.existsSync(INSTRUCTIONS_DIR)) {
        console.error(`Папка ${INSTRUCTIONS_DIR} не найдена!`);
        return null;
    }
    
    const mainDirs = fs.readdirSync(INSTRUCTIONS_DIR).filter(item => {
        const itemPath = path.join(INSTRUCTIONS_DIR, item);
        return fs.statSync(itemPath).isDirectory();
    });
    
    for (const mainDir of mainDirs) {
        // Ищем соответствие в маппинге
        let greenhouseType = INSTRUCTIONS_MAPPING[mainDir];
        
        if (!greenhouseType) {
            // Пробуем найти по нормализованному названию
            const normalizedMainDir = normalizeName(mainDir);
            for (const key in INSTRUCTIONS_MAPPING) {
                const normalizedKey = normalizeName(key);
                if (normalizedMainDir === normalizedKey) {
                    greenhouseType = INSTRUCTIONS_MAPPING[key];
                    break;
                }
            }
        }
        
        if (!greenhouseType) {
            console.warn(`⚠️  Не найдено соответствие для папки: ${mainDir}`);
            continue;
        }
        
        const dirPath = path.join(INSTRUCTIONS_DIR, mainDir);
        const pdfFiles = fs.readdirSync(dirPath).filter(file => 
            file.toLowerCase().endsWith('.pdf')
        );
        
        if (pdfFiles.length === 0) {
            console.warn(`⚠️  Нет PDF файлов в папке: ${mainDir}`);
            continue;
        }
        
        // Группируем PDF по размерам
        const instructionsBySize = {};
        
        for (const pdfFile of pdfFiles) {
            const size = extractSize(pdfFile);
            const filePath = path.join('Инструкции по сборке теплиц', mainDir, pdfFile);
            
            if (size) {
                if (!instructionsBySize[size]) {
                    instructionsBySize[size] = [];
                }
                instructionsBySize[size].push({
                    path: filePath,
                    filename: pdfFile,
                    size: size
                });
            } else {
                // Если не удалось извлечь размер, добавляем в общий список
                if (!instructionsBySize['other']) {
                    instructionsBySize['other'] = [];
                }
                instructionsBySize['other'].push({
                    path: filePath,
                    filename: pdfFile,
                    size: null
                });
            }
        }
        
        instructionsData[greenhouseType] = {
            folder: mainDir,
            instructions: instructionsBySize
        };
        
        console.log(`✅ ${mainDir} → ${greenhouseType}: ${pdfFiles.length} PDF файлов`);
    }
    
    return instructionsData;
}

/**
 * Генерирует JavaScript файл с данными инструкций
 */
function generateInstructionsFile() {
    const data = buildInstructionsData();
    
    if (!data || Object.keys(data).length === 0) {
        console.error('❌ Не удалось собрать данные об инструкциях!');
        return;
    }
    
    const jsContent = `/**
 * Данные об инструкциях по сборке теплиц
 * Автоматически сгенерировано скриптом scripts/scan_instructions.js
 * 
 * Версия: v231
 * Дата: ${new Date().toISOString().split('T')[0]}
 * 
 * Структура:
 * - Ключ: тип теплицы (ID из greenhouses-data.js)
 * - Значение: объект с папкой и инструкциями, сгруппированными по размерам
 */

const INSTRUCTIONS_DATA = ${JSON.stringify(data, null, 2)};

// Экспорт для использования в других скриптах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = INSTRUCTIONS_DATA;
}
`;
    
    fs.writeFileSync(OUTPUT_FILE, jsContent, 'utf8');
    console.log(`\n✅ Файл ${OUTPUT_FILE} успешно создан!`);
    console.log(`📊 Всего типов теплиц с инструкциями: ${Object.keys(data).length}`);
    
    // Подсчитываем общее количество PDF
    let totalPdf = 0;
    for (const type in data) {
        for (const size in data[type].instructions) {
            totalPdf += data[type].instructions[size].length;
        }
    }
    console.log(`📄 Всего PDF файлов: ${totalPdf}`);
}

// Запуск
console.log('🔍 Сканирование инструкций по сборке теплиц...\n');
generateInstructionsFile();
