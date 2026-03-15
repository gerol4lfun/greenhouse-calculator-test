
// Константа для контроля отладки
const DEBUG = false; // Отключено для продакшена
const APP_VERSION = "v271"; // v271: auth RPC (authenticate_user, validate_session), админка временно отключена

/** Пороги подарков по сумме заказа (slot model). Источник: docs/GIFT_TRUTH.md */
const GIFT_THRESHOLDS = { slot1: 35000, slot2: 55000, slot3: 75000 };

/** Количество слотов подарков по сумме заказа. 0, 1, 2 или 3. */
function getGiftSlotsByTotal(total) {
    if (total >= GIFT_THRESHOLDS.slot3) return 3;
    if (total >= GIFT_THRESHOLDS.slot2) return 2;
    if (total >= GIFT_THRESHOLDS.slot1) return 1;
    return 0;
}

/** Справочник id подарка → человекочитаемое название. */
const GIFT_NAMES = {
    'window': 'дополнительная форточка',
    'drip-mech': 'капельный полив механический',
    'window-automation': 'автомат для форточки',
    'window-auto': 'автоматическая форточка (форточка + автомат)',
    'stakes-4': '4 грунтозацепа'
}; // v266: проверка региона по ключевым словам в строке (Ставропольский край и т.д.); для заказов до 9.03.2026 при редактировании проверку региона не показываем // v265: статус «На проверке» (в обработке) в бейдже // v264: только кнопка «Отменить заказ» (без «Заказ выполнен»); статусы бейджа: Оформлен, Выполнен, Дубль, Отменён // v263: кнопка «Отменить заказ» — подтверждение, причина, сохранение; обновление списка по телефону из формы при отмене (в т.ч. по ?id=) // v262: статусы Оформлен/На проверке/Отмена/Дубль/Заказ выполнен; кнопка «Заказ выполнен» // v261: deep link ?id= — по ссылке открывается модалка «Редактирование заказа» с загрузкой заказа по id // v260: анимация появления блока успеха + «Ура, готово! 🎉» (универсально) // v259: после «Заказ оформлен!» кнопка «Изменить заказ» → openEditOrderModalWithPhone; одна точка входа с deep link ?editPhone= // v258: при закрытии модалки «Редактирование заказа» сброс шага 1 (поле поиска, список, подсказка) // v257: при открытии блока «Оформление заказа» и при фокусе в поле формы — сброс currentOrderIdForEdit (защита от state leakage для всего сценария create vs edit) // v256: при закрытии модалки сброс id; в шапке модалки телефон // v255: при открытии модалки подарки из initialSelected в giftEl // v254: проверка региона доставки при оформлении и в модалке (isAddressInDeliveryRegionByLocality, checkAddressInDeliveryRegion) // v253: ?editPhone= убираем из URL после открытия модалки — обновление страницы не открывает её снова // v252: ?editPhone= при одном заказе — быстрый просмотр (карточка + «Редактировать»), форма только по клику // v251: один тариф доставки // v249: «Из доставки» и загрузка в модалке — два фрагмента в part1 (регион+город), не в улицу; parseAddressToParts_(2 части) // v247: адрес регион+город — убраны verbose Logger.log (11 шт), addAdditionalProductsEventListeners, безусловный console.log // v244: gift сохраняется в DOM при total<35k (не очищаем), enforce только при save; CSS: input hidden, нет !important // v232: Фаза 1 — подсказка «Данные по заказу изменены», статус на русском, адрес на localhost не обязателен, сообщение при ошибке отправки, подарки один раз в тексте для клиента и от итога корзины, предупреждение «похожий заказ» 90 дней, сворачивание карточки после редактирования // v231: текст заказа — 2+ одинаковых (одна позиция х2/х3, одна итоговая стоимость), 2+ разных (блоки «1 теплица»/«2 теплица» + доставка + общий итог), превью из корзины до «Оформить заказ», displayName в приветствии/имени // v230: текст заказа — блок «О сборке» только при выбранной опции сборки (ORDER_FOOTER_BASE / ORDER_FOOTER_ASSEMBLY, hasAssembly) // v221: дата по выбранному городу без расчёта, подсказки адреса в 3 полях (Yandex), телефон по центру // v216: замена эмодзи на flat-иконки // v215: форма оформления заказа + отправка в Supabase, цены бруса +500₽ // v214: единая версия, кеш как обычно, обновление цен — «перезайдите в калькулятор» // v212: Цены сборки по документу СБОРКА, удаление навесов // v211: Усиленный каркас в КП для арочной 20×20 // v210: Админ-панель — RPC update_user_password, выкид при смене пароля (visibilitychange + 30 сек), кнопка только у admin // v209: Тарифы 45/50, даты, КП // v208: Даты, парсер, подарки, КП // v204: Интеграция галереи фотографий теплиц и инструкций по сборке - добавлена внутренняя галерея фотографий теплиц с навигацией по типам/вариантам, добавлен раздел инструкций по сборке с поиском и фильтрацией, улучшен дизайн модальных окон, оптимизирована мобильная верстка, исправлены проблемы с копированием изображений в буфер обмена на macOS, обновлен favicon - добавлена профессиональная иконка калькулятора // v203: Добавлен favicon.ico для устранения ошибки 404, настроено кеширование статических ресурсов (изображения, видео, CSS, JS) через meta-теги и .htaccess, добавлено предупреждение в раздел "Автомат для форточки" о том, что он устанавливается только на дополнительную форточку, сделаны кнопки "скачать" менее заметными (только иконка, меньший размер, приглушенный цвет), добавлена полная надпись "Скачать" в полноэкранном режиме просмотра фото, добавлены мобильные стили для product-info-modal и polycarbonate-info-modal, улучшена адаптивность всех элементов // v202: Сделана вся область названия товара кликабельной (не только иконка), кнопка информации для поликарбоната переделана в стиле product-info-link (прозрачный фон, синий цвет, интегрирована в label), улучшена интерактивность с hover-эффектами

// ==================== СИСТЕМА УВЕДОМЛЕНИЙ (TOAST) ====================

/**
 * Показывает стильное уведомление
 * @param {string} message - Текст сообщения
 * @param {string} type - Тип уведомления: 'success', 'error', 'warning', 'info'
 * @param {string} title - Заголовок (опционально)
 * @param {number} duration - Длительность показа в мс (по умолчанию 4000)
 */
function showToast(message, type = 'info', title = null, duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) {
        // Если контейнер не найден, используем fallback на alert
        alert(message);
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Иконки для разных типов
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    // Заголовки по умолчанию
    const defaultTitles = {
        success: 'Успешно',
        error: 'Ошибка',
        warning: 'Внимание',
        info: 'Информация'
    };
    
    const toastTitle = title || defaultTitles[type] || 'Уведомление';
    const icon = icons[type] || icons.info;
    
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${toastTitle}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.closest('.toast').remove()">×</button>
    `;
    
    container.appendChild(toast);
    
    // Автоматическое удаление через duration
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, duration);
    }
    
    return toast;
}

// Удобные функции для разных типов уведомлений
function showSuccess(message, title = null, duration = 4000) {
    return showToast(message, 'success', title, duration);
}

function showError(message, title = null, duration = 5000) {
    return showToast(message, 'error', title, duration);
}

function showWarning(message, title = null, duration = 4000) {
    return showToast(message, 'warning', title, duration);
}

function showInfo(message, title = null, duration = 4000) {
    return showToast(message, 'info', title, duration);
}

// Данные о грядках с ценами (универсальные для всех городов)
// Цены одинаковые для всех городов, поэтому хранятся в коде
// Структура: { id, name, price, length, width, height }
const BEDS_DATA = [
    // Низкие грядки (В 19 см)
    // Низкие 0.5 м (Ш 0.5, В 19 см) - шаг +1200
    { id: 'low-0.5-4', name: 'Низкие 0.5 м (Ш 0.5, В 19 см) - 4м', price: 2990, length: 4, width: 0.5, height: 19 },
    { id: 'low-0.5-6', name: 'Низкие 0.5 м (Ш 0.5, В 19 см) - 6м', price: 4190, length: 6, width: 0.5, height: 19 },
    { id: 'low-0.5-8', name: 'Низкие 0.5 м (Ш 0.5, В 19 см) - 8м', price: 5390, length: 8, width: 0.5, height: 19 },
    { id: 'low-0.5-10', name: 'Низкие 0.5 м (Ш 0.5, В 19 см) - 10м', price: 6590, length: 10, width: 0.5, height: 19 },
    { id: 'low-0.5-12', name: 'Низкие 0.5 м (Ш 0.5, В 19 см) - 12м', price: 7790, length: 12, width: 0.5, height: 19 },
    
    // Низкие 0.65 м (Ш 0.65, В 19 см) - шаг +1300
    { id: 'low-0.65-4', name: 'Низкие 0.65 м (Ш 0.65, В 19 см) - 4м', price: 3290, length: 4, width: 0.65, height: 19 },
    { id: 'low-0.65-6', name: 'Низкие 0.65 м (Ш 0.65, В 19 см) - 6м', price: 4590, length: 6, width: 0.65, height: 19 },
    { id: 'low-0.65-8', name: 'Низкие 0.65 м (Ш 0.65, В 19 см) - 8м', price: 5890, length: 8, width: 0.65, height: 19 },
    { id: 'low-0.65-10', name: 'Низкие 0.65 м (Ш 0.65, В 19 см) - 10м', price: 7190, length: 10, width: 0.65, height: 19 },
    { id: 'low-0.65-12', name: 'Низкие 0.65 м (Ш 0.65, В 19 см) - 12м', price: 8490, length: 12, width: 0.65, height: 19 },
    
    // Низкие 0.8 м (Ш 0.8, В 19 см) - шаг +1400 (в каталоге может быть "0.75 м")
    { id: 'low-0.8-4', name: 'Низкие 0.8 м (Ш 0.8, В 19 см) - 4м', price: 3590, length: 4, width: 0.8, height: 19 },
    { id: 'low-0.8-6', name: 'Низкие 0.8 м (Ш 0.8, В 19 см) - 6м', price: 4990, length: 6, width: 0.8, height: 19 },
    { id: 'low-0.8-8', name: 'Низкие 0.8 м (Ш 0.8, В 19 см) - 8м', price: 6390, length: 8, width: 0.8, height: 19 },
    { id: 'low-0.8-10', name: 'Низкие 0.8 м (Ш 0.8, В 19 см) - 10м', price: 7790, length: 10, width: 0.8, height: 19 },
    { id: 'low-0.8-12', name: 'Низкие 0.8 м (Ш 0.8, В 19 см) - 12м', price: 9190, length: 12, width: 0.8, height: 19 },
    
    // Низкие 1 м (Ш 1, В 19 см) - шаг +1500
    { id: 'low-1-4', name: 'Низкие 1 м (Ш 1, В 19 см) - 4м', price: 3890, length: 4, width: 1, height: 19 },
    { id: 'low-1-6', name: 'Низкие 1 м (Ш 1, В 19 см) - 6м', price: 5390, length: 6, width: 1, height: 19 },
    { id: 'low-1-8', name: 'Низкие 1 м (Ш 1, В 19 см) - 8м', price: 6890, length: 8, width: 1, height: 19 },
    { id: 'low-1-10', name: 'Низкие 1 м (Ш 1, В 19 см) - 10м', price: 8390, length: 10, width: 1, height: 19 },
    { id: 'low-1-12', name: 'Низкие 1 м (Ш 1, В 19 см) - 12м', price: 9890, length: 12, width: 1, height: 19 },
    
    // Высокие грядки (В 38 см)
    // Высокие 0.5 м (Ш 0.5, В 38 см) - шаг +2000
    { id: 'high-0.5-4', name: 'Высокие 0.5 м (Ш 0.5, В 38 см) - 4м', price: 4990, length: 4, width: 0.5, height: 38 },
    { id: 'high-0.5-6', name: 'Высокие 0.5 м (Ш 0.5, В 38 см) - 6м', price: 6990, length: 6, width: 0.5, height: 38 },
    { id: 'high-0.5-8', name: 'Высокие 0.5 м (Ш 0.5, В 38 см) - 8м', price: 8990, length: 8, width: 0.5, height: 38 },
    { id: 'high-0.5-10', name: 'Высокие 0.5 м (Ш 0.5, В 38 см) - 10м', price: 10990, length: 10, width: 0.5, height: 38 },
    { id: 'high-0.5-12', name: 'Высокие 0.5 м (Ш 0.5, В 38 см) - 12м', price: 12990, length: 12, width: 0.5, height: 38 },
    
    // Высокие 0.65 м (Ш 0.65, В 38 см) - шаг +2200
    { id: 'high-0.65-4', name: 'Высокие 0.65 м (Ш 0.65, В 38 см) - 4м', price: 5490, length: 4, width: 0.65, height: 38 },
    { id: 'high-0.65-6', name: 'Высокие 0.65 м (Ш 0.65, В 38 см) - 6м', price: 7690, length: 6, width: 0.65, height: 38 },
    { id: 'high-0.65-8', name: 'Высокие 0.65 м (Ш 0.65, В 38 см) - 8м', price: 9890, length: 8, width: 0.65, height: 38 },
    { id: 'high-0.65-10', name: 'Высокие 0.65 м (Ш 0.65, В 38 см) - 10м', price: 12090, length: 10, width: 0.65, height: 38 },
    { id: 'high-0.65-12', name: 'Высокие 0.65 м (Ш 0.65, В 38 см) - 12м', price: 14290, length: 12, width: 0.65, height: 38 },
    
    // Высокие 0.8 м (Ш 0.8, В 38 см) - шаг +2400
    { id: 'high-0.8-4', name: 'Высокие 0.8 м (Ш 0.8, В 38 см) - 4м', price: 5990, length: 4, width: 0.8, height: 38 },
    { id: 'high-0.8-6', name: 'Высокие 0.8 м (Ш 0.8, В 38 см) - 6м', price: 8390, length: 6, width: 0.8, height: 38 },
    { id: 'high-0.8-8', name: 'Высокие 0.8 м (Ш 0.8, В 38 см) - 8м', price: 10790, length: 8, width: 0.8, height: 38 },
    { id: 'high-0.8-10', name: 'Высокие 0.8 м (Ш 0.8, В 38 см) - 10м', price: 13190, length: 10, width: 0.8, height: 38 },
    { id: 'high-0.8-12', name: 'Высокие 0.8 м (Ш 0.8, В 38 см) - 12м', price: 15590, length: 12, width: 0.8, height: 38 },
    
    // Высокие 1 м (Ш 1, В 38 см) - шаг +2600
    { id: 'high-1-4', name: 'Высокие 1 м (Ш 1, В 38 см) - 4м', price: 6490, length: 4, width: 1, height: 38 },
    { id: 'high-1-6', name: 'Высокие 1 м (Ш 1, В 38 см) - 6м', price: 9090, length: 6, width: 1, height: 38 },
    { id: 'high-1-8', name: 'Высокие 1 м (Ш 1, В 38 см) - 8м', price: 11690, length: 8, width: 1, height: 38 },
    { id: 'high-1-10', name: 'Высокие 1 м (Ш 1, В 38 см) - 10м', price: 14290, length: 10, width: 1, height: 38 },
    { id: 'high-1-12', name: 'Высокие 1 м (Ш 1, В 38 см) - 12м', price: 16890, length: 12, width: 1, height: 38 }
];

// Функция загрузки данных грядок из Supabase (ОТКЛЮЧЕНА - цены в коде)
// Цены на грядки одинаковые для всех городов, поэтому хранятся в константе BEDS_DATA выше
async function loadBedsFromSupabase() {
    // Цены зашиты в код, так как они одинаковые для всех городов
    // Если в будущем понадобится загружать из Supabase, раскомментируйте код ниже
    // Используются цены на грядки из кода
    return true;
    
    /* Раскомментировать, если нужно загружать из Supabase:
    try {
        const { data, error } = await supabaseClient
            .from('beds')
            .select('*')
            .order('height')
            .order('width')
            .order('length');
        
        if (error) {
            return false;
        }
        
        if (!data || data.length === 0) {
            return false;
        }
        
        // Преобразуем данные из Supabase в формат, используемый в коде
        BEDS_DATA = data.map(bed => ({
            id: bed.id,
            name: bed.name,
            price: bed.price,
            length: bed.length,
            width: parseFloat(bed.width),
            height: bed.height
        }));
        
        return true;
        
    } catch (err) {
        return false;
    }
    */
}

// Лёгкий wrapper для отладочных логов (в проде не пишет в консоль и не тратит время)
function debugLog(...args) {
    if (DEBUG) console.log(...args);
}
function debugWarn(...args) {
    if (DEBUG) console.warn(...args);
}

// Временная заглушка для showFAQModal (на случай, если скрипт еще не загрузился)
if (typeof window.showFAQModal === 'undefined') {
    window.showFAQModal = function() {
        debugWarn("⚠️ showFAQModal еще не загружена, ждем загрузки скрипта...");
        setTimeout(() => {
            if (typeof showFAQModal === 'function') {
                showFAQModal();
            } else {
                console.error("❌ Функция showFAQModal не найдена после загрузки!");
                showError("Функция showFAQModal не найдена. Обновите страницу.", 'Ошибка');
            }
        }, 100);
    };
}

// Временная заглушка для showBedsModal (на случай, если скрипт еще не загрузился)
if (typeof window.showBedsModal === 'undefined') {
    window.showBedsModal = function() {
        setTimeout(() => {
            if (typeof showBedsModal === 'function') {
                showBedsModal();
            } else {
                console.error("❌ Функция showBedsModal не найдена после загрузки!");
                showError("Функция showBedsModal не найдена. Обновите страницу.", 'Ошибка');
            }
        }, 100);
    };
}

// Флаг для включения/выключения вывода даты доставки в коммерческое предложение
const SHOW_DELIVERY_DATE_IN_OFFER = false; // Установите true, чтобы включить вывод даты доставки в КП

/**
 * Функция форматирования чисел с точками
 * @param {number} num - Число для форматирования
 * @returns {string} - Отформатированное число
 */
function formatPrice(num) {
    if (num == null || num === '' || isNaN(Number(num))) return '0';
    return Number(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Функция нормализации строк (убирает пробелы и приводит к нижнему регистру)
function normalizeString(str) {
    if (!str) return "";
    // Заменяем обычные и неразрывные пробелы на пустую строку
    return str.trim().toLowerCase().replace(/[\s\u00A0]+/g, "");
}

/**
 * Очищает название города от суффиксов "доставки" и "сборки" (первое слово = город)
 * "Ставрополь доставки" → "Ставрополь", "Краснодар доставки" → "Краснодар"
 */
function cleanDeliveryCityName(cityName) {
    if (!cityName) return cityName || '';
    return cityName
        .replace(/\s+доставки\s*$/i, '')
        .replace(/\s+сборки\s*$/i, '')
        .trim() || cityName;
}

// Функция нормализации названий городов (заменяет Ё на Е для сравнения)
function normalizeCityName(cityName) {
    if (!cityName) return "";
    
    const normalized = cityName.trim().toLowerCase().replace(/ё/g, "е").replace(/Ё/g, "Е");
    
    // Маппинг альтернативных названий на стандартные
    const cityMap = {
        'питер': 'санкт-петербург',
        'петербург': 'санкт-петербург',
        'спб': 'санкт-петербург',
        'нн': 'нижний новгород',
        'нижний': 'нижний новгород',
        'челны': 'набережные челны',
        'набережные челны': 'набережные челны'
    };
    
    // Проверяем точное совпадение
    if (cityMap[normalized]) {
        return cityMap[normalized];
    }
    
    // Проверяем частичное совпадение
    for (const [key, value] of Object.entries(cityMap)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return value;
        }
    }
    
    return normalized;
}

// Функция поиска города в выпадающем списке по нормализованному названию
function findCityInDropdown(cityName) {
    if (!cityName) return null;
    const cityDropdown = document.getElementById('city');
    if (!cityDropdown || !cityDropdown.options) return null;
    
    const normalizedTarget = normalizeCityName(cityName);
    
    // Ищем точное совпадение по нормализованному названию
    for (let i = 0; i < cityDropdown.options.length; i++) {
        const option = cityDropdown.options[i];
        if (option.value && normalizeCityName(option.value) === normalizedTarget) {
            return option.value; // Возвращаем оригинальное название из списка
        }
    }
    
    // Если точного совпадения нет, ищем частичное (для "Набережные Челны" vs "Челны")
    for (let i = 0; i < cityDropdown.options.length; i++) {
        const option = cityDropdown.options[i];
        if (option.value) {
            const normalizedOption = normalizeCityName(option.value);
            if (normalizedTarget.includes(normalizedOption) || normalizedOption.includes(normalizedTarget)) {
                return option.value;
            }
        }
    }
    
    return null;
}

// Пользователи: все пароли хранятся в Supabase в таблице users

// Ключ для админа в localStorage (для доступа к админ-панели)
const ADMIN_KEY = 'admin_access_granted';

// Временно отключено: админка требует policy на users. После безопасных admin RPC — поставить false.
const ADMIN_PANEL_DISABLED = true;

// Приоритеты форм (чем меньше число, тем выше в списке)
const formPriority = {
    "Арочная": 1,
    "Каплевидная": 2,
    "Прямостенная": 3,
    "Домиком": 4,
    "Пристенная": 5,
    "Миттлайдер арочная": 6,
    "Миттлайдер прямостенная": 7,
    "Промышленная прямостенная": 8,
    "Промышленная домиком": 9,
    "Прочие": 10
};

// Массив регионов доставки с ключевыми словами
const deliveryRegions = [
    { keywords: ["москва", "msk", "московская область"] },
    { keywords: ["санкт-петербург", "spb", "питер", "ленинградская область"] },
    { keywords: ["белгород", "belgorod", "белгородская область"] },
    { keywords: ["великий новгород", "новгород", "новгородская область"] },
    { keywords: ["владимир", "vladimir", "владимирская область"] },
    { keywords: ["вологда", "vologda", "вологодская область"] },
    { keywords: ["воронеж", "voronezh", "воронежская область"] },
    { keywords: ["екатеринбург", "ekaterinburg", "свердловская область"] },
    { keywords: ["иваново", "ivanovo", "ивановская область"] },
    { keywords: ["йошкар-ола", "yoshkar-ola", "марий эл", "республика марий эл"] },
    { keywords: ["казань", "kazan", "татарстан", "республика татарстан"] },
    { keywords: ["калуга", "kaluga", "калужская область"] },
    { keywords: ["кемерово", "kemerovo", "кемеровская область", "кузбасс"] },
    { keywords: ["кострома", "kostroma", "костромская область"] },
    { keywords: ["краснодар", "krasnodar", "краснодарский край", "кубань"] },
    { keywords: ["курск", "kursk", "курская область"] },
    { keywords: ["липецк", "lipetsk", "липецкая область"] },
    { keywords: ["майкоп", "maykop", "адыгея", "республика адыгея"] },
    { keywords: ["набережные челны", "nab-chelny", "челны", "республика татарстан"] },
    { keywords: ["нижний новгород", "nizh-novgorod", "нн", "нижегородская область"] },
    { keywords: ["новосибирск", "novosibirsk", "новосибирская область"] },
    { keywords: ["орел", "orel", "орловская область"] },
    { keywords: ["рязань", "ryazan", "рязанская область"] },
    { keywords: ["ставрополь", "stavropol", "ставропольский край"] },
    { keywords: ["тамбов", "tambov", "тамбовская область"] },
    { keywords: ["тверь", "tver", "тверская область"] },
    { keywords: ["тула", "tula", "тульская область"] },
    { keywords: ["ульяновск", "ulyanovsk", "ульяновская область"] },
    { keywords: ["чебоксары", "cheboksary", "чувашия", "республика чувашия"] },
    { keywords: ["челябинск", "chelyabinsk", "челябинская область"] },
    { keywords: ["черкесск", "cherkessk", "карачай-черкесия", "карачаево-черкесская республика"] },
    { keywords: ["ярославль", "yaroslavl", "ярославская область"] }
];

/**
 * Маппинг keyword → canonical city для delivery_calendar / delivery_dates.
 * Используется для legacy/freeform адресов в edit existing order calendar.
 * Первый keyword каждой группы — канонический город (как в delivery_calendar).
 * Дополнительные keyword — альтернативные написания области/региона.
 */
const _regionCalendarMap_ = (function() {
    var map = [];
    deliveryRegions.forEach(function(entry) {
        if (!entry.keywords || entry.keywords.length < 2) return;
        var city = entry.keywords[0]; // первый keyword = канонический город
        entry.keywords.slice(1).forEach(function(alias) {
            map.push({ alias: alias, city: city });
        });
    });
    return map;
})();

/**
 * Привести freeform адрес / регион к каноническому городу delivery_calendar.
 * Возвращает canonical city string, или null если не определён.
 */
function resolveRegionToCanonicalCity_(text) {
    if (!text || typeof text !== 'string') return null;
    var lower = text.trim().toLowerCase().replace(/ё/g, 'е');
    for (var i = 0; i < _regionCalendarMap_.length; i++) {
        if (lower.indexOf(_regionCalendarMap_[i].alias) !== -1) {
            return _regionCalendarMap_[i].city;
        }
    }
    return null;
}

/**
 * Нормализация alias-форм city key к каноническому названию delivery_calendar.
 * МСК/msk -> Москва, СПБ/spb/Питер -> Санкт-Петербург, и т.п.
 * Если alias не найден, возвращает исходную строку без изменений.
 */
function normalizeCityAlias_(cityRaw) {
    if (!cityRaw || typeof cityRaw !== 'string') return cityRaw || null;
    var lower = cityRaw.trim().toLowerCase().replace(/ё/g, 'е');
    lower = lower.replace(/^(г\.\s*|город\s+)/, '').trim();
    var aliasMap = {
        'мск': 'Москва', 'msk': 'Москва', 'москва': 'Москва',
        'спб': 'Санкт-Петербург', 'spb': 'Санкт-Петербург',
        'питер': 'Санкт-Петербург', 'петербург': 'Санкт-Петербург',
        'санкт-петербург': 'Санкт-Петербург',
        'нн': 'Нижний Новгород', 'нижний': 'Нижний Новгород',
        'челны': 'Набережные Челны'
    };
    return aliasMap[lower] || cityRaw.trim();
}

/**
 * Канонический warehouse city key для create-flow delivery readers.
 * Priority: city dropdown -> lastCalculation.city.
 */
function resolveCreateWarehouseCityKey_() {
    var citySelect = document.getElementById('city');
    var c1 = (citySelect && citySelect.value) ? citySelect.value.trim() : '';
    if (c1) return normalizeCityAlias_(c1);
    var c2 = (typeof lastCalculation !== 'undefined' && lastCalculation && lastCalculation.city) ? String(lastCalculation.city).trim() : '';
    if (c2) return normalizeCityAlias_(c2);
    return null;
}

/**
 * Приоритетный выбор canonical city для edit calendar existing order.
 * 1) orders.warehouse_city_key — source of truth для delivery readers
 * 2) orders.city (сохранённый при расчёте/создании заказа) — legacy/display field
 * 3) первый ненулевой line_items[].city из editOrderComposition — надёжный fallback
 * 4) derive from DOM address — legacy/recovery fallback
 */
function resolveEditOrderCalendarCity_() {
    // Priority 1: saved orders.warehouse_city_key
    if (_editOrderLoadedWarehouseCityKey) {
        var c0 = normalizeCityAlias_(_editOrderLoadedWarehouseCityKey);
        if (c0) return c0;
    }
    // Priority 2: saved orders.city
    if (_editOrderLoadedCityRaw) {
        var c1 = normalizeCityAlias_(_editOrderLoadedCityRaw);
        if (c1) return c1;
    }
    // Priority 3: first line_items[].city
    if (Array.isArray(editOrderComposition) && editOrderComposition.length > 0) {
        for (var i = 0; i < editOrderComposition.length; i++) {
            var c2 = (editOrderComposition[i].city || '').trim();
            if (c2) return normalizeCityAlias_(c2);
        }
    }
    // Priority 4: derive from DOM address (legacy/recovery fallback)
    var part1 = document.getElementById('edit-order-address-part1');
    var part2 = document.getElementById('edit-order-address-part2');
    var part3 = document.getElementById('edit-order-address-part3');
    var p1 = (part1 && part1.value) ? part1.value.trim() : '';
    var p2 = (part2 && part2.value) ? part2.value.trim() : '';
    var p3 = (part3 && part3.value) ? part3.value.trim() : '';
    var fullAddr = [p1, p2, p3].filter(Boolean).join(', ');
    var cityCandidate = (typeof extractCityFromAddress === 'function' ? extractCityFromAddress(fullAddr) : '') || p1;
    var c3 = cityCandidate && typeof findCityInDropdown === 'function'
        ? (findCityInDropdown(cityCandidate) || findCityInDropdown(p1) || cityCandidate)
        : cityCandidate;
    if (c3 && typeof resolveRegionToCanonicalCity_ === 'function') {
        var resolved = resolveRegionToCanonicalCity_(fullAddr) || resolveRegionToCanonicalCity_(c3);
        if (resolved) c3 = resolved;
    }
    return c3 || null;
}

/** Проверка по массивам localities и administrativeAreas (нижний регистр): входит ли адрес в зону доставки. Один источник правды для расчёта доставки и форм заказа. */
function isAddressInDeliveryRegionByLocality(localities, administrativeAreas) {
    if (!Array.isArray(localities)) localities = [];
    if (!Array.isArray(administrativeAreas)) administrativeAreas = [];
    return deliveryRegions.some(function (regionEntry) {
        return regionEntry.keywords.some(function (keyword) {
            return localities.some(function (loc) { return loc.indexOf(keyword) !== -1; }) ||
                administrativeAreas.some(function (area) { return area.indexOf(keyword) !== -1; });
        });
    });
}

/** Проверка строки (регион, город или полный адрес) по ключевым словам доставки. Если в списке есть «Ставрополь» — работаем по всему Ставропольскому краю и т.д. */
function isRegionMatchByKeywords(text) {
    if (!text || typeof text !== 'string') return false;
    var lower = text.trim().toLowerCase();
    if (!lower) return false;
    return deliveryRegions.some(function (regionEntry) {
        return regionEntry.keywords.some(function (keyword) {
            return lower.indexOf(keyword) !== -1;
        });
    });
}

/** Асинхронная проверка строки адреса через геокодер: доставляем ли в этот регион. Возвращает Promise<{ inRegion: boolean, errorMessage?: string }>. */
function checkAddressInDeliveryRegion(addressString, warehouseCityKey) {
    var key = (warehouseCityKey && typeof warehouseCityKey === 'string') ? warehouseCityKey.trim() : '';
    if (key) {
        var normalizedKey = (typeof normalizeCityAlias_ === 'function') ? (normalizeCityAlias_(key) || key) : key;
        if (isRegionMatchByKeywords(normalizedKey)) return Promise.resolve({ inRegion: true });
    }
    var trimmed = (addressString && typeof addressString === 'string') ? addressString.trim() : '';
    if (!trimmed) return Promise.resolve({ inRegion: true });
    if (isRegionMatchByKeywords(trimmed)) return Promise.resolve({ inRegion: true });
    if (typeof ymaps === 'undefined') return Promise.resolve({ inRegion: false, errorMessage: 'Яндекс.Карты недоступны. Проверьте интернет.' });
    return ymaps.geocode(trimmed, { results: 1 }).then(function (res) {
        var geoObject = res.geoObjects.get(0);
        if (!geoObject) return { inRegion: false, errorMessage: 'Адрес не найден.' };
        var localities = geoObject.getLocalities().map(function (loc) { return loc.toLowerCase(); });
        var administrativeAreas = geoObject.getAdministrativeAreas().map(function (area) { return area.toLowerCase(); });
        var inRegion = isAddressInDeliveryRegionByLocality(localities, administrativeAreas);
        return { inRegion: inRegion, errorMessage: inRegion ? undefined : 'Доставка в этот регион не осуществляется.' };
    }).catch(function () {
        return { inRegion: false, errorMessage: 'Не удалось проверить регион.' };
    });
}

// Города для карты. pricePerKm — тариф руб/км от склада (зависит от города).
const citiesForMap = [
    { name: "Москва", coords: [55.751244, 37.618423], boundaryDistance: 20, pricePerKm: 45 },
    { name: "Санкт-Петербург", coords: [59.934280, 30.335099], boundaryDistance: 20, pricePerKm: 45 },
    { name: "Белгород", coords: [50.597735, 36.585823], boundaryDistance: 10, pricePerKm: 50 },
    { name: "Великий Новгород", coords: [58.521400, 31.275505], boundaryDistance: 10, pricePerKm: 45 },
    { name: "Владимир", coords: [56.129057, 40.407031], boundaryDistance: 12, pricePerKm: 50 },
    { name: "Вологда", coords: [59.220492, 39.891568], boundaryDistance: 10, pricePerKm: 50 },
    { name: "Воронеж", coords: [51.661535, 39.200287], boundaryDistance: 15, pricePerKm: 50 },
    { name: "Екатеринбург", coords: [56.838926, 60.605703], boundaryDistance: 15, pricePerKm: 50 },
    { name: "Иваново", coords: [57.000348, 40.973921], boundaryDistance: 12, pricePerKm: 50 },
    { name: "Йошкар-Ола", coords: [56.634431, 47.899888], boundaryDistance: 12, pricePerKm: 50 },
    { name: "Казань", coords: [55.796391, 49.108891], boundaryDistance: 15, pricePerKm: 50 },
    { name: "Калуга", coords: [54.506043, 36.251593], boundaryDistance: 12, pricePerKm: 45 },
    { name: "Кемерово", coords: [55.354968, 86.087314], boundaryDistance: 15, pricePerKm: 50 },
    { name: "Кострома", coords: [57.767961, 40.926858], boundaryDistance: 10, pricePerKm: 50 },
    { name: "Краснодар", coords: [45.035470, 38.975313], boundaryDistance: 12, pricePerKm: 50 },
    { name: "Курск", coords: [51.730361, 36.192647], boundaryDistance: 10, pricePerKm: 50 },
    { name: "Липецк", coords: [52.610150, 39.594180], boundaryDistance: 12, pricePerKm: 50 },
    { name: "Майкоп", coords: [44.607782, 40.105690], boundaryDistance: 10, pricePerKm: 50 },
    { name: "Набережные Челны", coords: [55.727110, 52.404913], boundaryDistance: 12, pricePerKm: 50 },
    { name: "Нижний Новгород", coords: [56.296504, 43.936059], boundaryDistance: 15, pricePerKm: 50 },
    { name: "Новосибирск", coords: [55.008352, 82.935733], boundaryDistance: 15, pricePerKm: 50 },
    { name: "Орёл", coords: [52.967257, 36.069647], boundaryDistance: 10, pricePerKm: 50 },
    { name: "Рязань", coords: [54.629704, 39.741146], boundaryDistance: 12, pricePerKm: 45 },
    { name: "Ставрополь", coords: [45.044838, 41.969230], boundaryDistance: 10, pricePerKm: 50 },
    { name: "Тамбов", coords: [52.721219, 41.452274], boundaryDistance: 10, pricePerKm: 50 },
    { name: "Тверь", coords: [56.858539, 35.917596], boundaryDistance: 12, pricePerKm: 45 },
    { name: "Тула", coords: [54.193122, 37.617348], boundaryDistance: 12, pricePerKm: 45 },
    { name: "Ульяновск", coords: [54.316685, 48.403123], boundaryDistance: 12, pricePerKm: 50 },
    { name: "Чебоксары", coords: [56.146223, 47.251931], boundaryDistance: 12, pricePerKm: 50 },
    { name: "Челябинск", coords: [55.164442, 61.436843], boundaryDistance: 15, pricePerKm: 50 },
    { name: "Черкесск", coords: [44.226863, 42.046782], boundaryDistance: 10, pricePerKm: 50 },
    { name: "Ярославль", coords: [57.626559, 39.893813], boundaryDistance: 10, pricePerKm: 50 }
];

// Дополнительные услуги данные
const additionalServicesData = {
    "Брус": {
        price_by_length: {
            4: 5990,
            6: 7490,
            8: 8990,
            10: 10490,
            12: 11990,
            14: 13490,
            16: 14990
        }
    },
    "Штыри": {
        price_per_unit: 249,
        quantity_by_length: {
            "without_bracing": { "4": 10, "6": 14, "8": 18, "10": 22, "12": 26, "14": 30, "16": 34 },
            "with_bracing": { "4": 6, "6": 10, "8": 14, "10": 18, "12": 22, "14": 26, "16": 30 }
        }
    }
    // Сборка теперь обрабатывается через assemblyPrices
};

// Структура данных для сборки теплиц (по документу СБОРКА: кат.1 арочные/каплевидные 2.5–3.5; кат.2 прямостенные/двускатные 2.5–3.5; кат.3 каплевидная 3.5, арочная 4, прямостенная 4, домиком 4, миттлайдер; кат.4 промышленные)
const assemblyPrices = {
    "Арочная": {
        "2.5М": { 4: 5490, 6: 6990, 8: 8490, 10: 9490, 12: 11490 },
        "3М": { 4: 5490, 6: 6990, 8: 8490, 10: 9490, 12: 11490 },
        "3.5М": { 4: 5490, 6: 6990, 8: 8490, 10: 9490, 12: 11490 },
        "4М": { 4: 7990, 6: 11490, 8: 14990, 10: 18490, 12: 22490 }
    },
    "Каплевидная": {
        "2.5М": { 4: 5490, 6: 6990, 8: 8490, 10: 9490, 12: 11490 },
        "3М": { 4: 5490, 6: 6990, 8: 8490, 10: 9490, 12: 11490 },
        "3.5М": { 4: 7990, 6: 11490, 8: 14990, 10: 18490, 12: 22490 }
    },
    "Прямостенная": {
        "2.5М": { 4: 6490, 6: 8490, 8: 10490, 10: 12490, 12: 14490 },
        "3М": { 4: 6490, 6: 8490, 8: 10490, 10: 12490, 12: 14490 },
        "3.5М": { 4: 6490, 6: 8490, 8: 10490, 10: 12490, 12: 14490 },
        "4М": { 4: 7990, 6: 11490, 8: 14990, 10: 18490, 12: 22490 }
    },
    "Домиком": {
        "2.5М": { 4: 6490, 6: 8490, 8: 10490, 10: 12490, 12: 14490 },
        "3М": { 4: 6490, 6: 8490, 8: 10490, 10: 12490, 12: 14490 },
        "3.5М": { 4: 6490, 6: 8490, 8: 10490, 10: 12490, 12: 14490 },
        "4М": { 4: 7990, 6: 11490, 8: 14990, 10: 18490, 12: 22490 }
    },
    "Пристенная": {
        "2.5М": { 4: 6490, 6: 8490, 8: 10490, 10: 12490, 12: 14490 },
        "3М": { 4: 6490, 6: 8490, 8: 10490, 10: 12490, 12: 14490 }
    },
    "Миттлайдер арочная": {
        "3М": { 4: 7990, 6: 11490, 8: 14990, 10: 18490, 12: 22490 },
        "3.5М": { 4: 7990, 6: 11490, 8: 14990, 10: 18490, 12: 22490 }
    },
    "Миттлайдер прямостенная": {
        "3М": { 4: 7990, 6: 11490, 8: 14990, 10: 18490, 12: 22490 },
        "3.5М": { 4: 7990, 6: 11490, 8: 14990, 10: 18490, 12: 22490 }
    },
    "Промышленная прямостенная": {
        "5М": { 4: 11990, 6: 16990, 8: 21990, 10: 26990, 12: 31990, 14: 36990, 16: 41990 },
        "6М": { 4: 11990, 6: 16990, 8: 21990, 10: 26990, 12: 31990, 14: 36990, 16: 41990 }
    },
    "Промышленная домиком": {
        "7М": { 4: 11990, 6: 16990, 8: 21990, 10: 26990, 12: 31990, 14: 36990, 16: 41990 },
        "8М": { 4: 11990, 6: 16990, 8: 21990, 10: 26990, 12: 31990, 14: 36990, 16: 41990 }
    }
};

// Определение доступных форм теплиц и их названий
const availableForms = {
    "Арочная": [
        { name: "ТЕПЛИЦА БОЯРСКАЯ 2.5М", frame: "20х20" },
        { name: "ТЕПЛИЦА БОЯРСКАЯ 3М", frame: "20х20" },
        { name: "ТЕПЛИЦА БОЯРСКАЯ ЛЮКС 2.5М", frame: "40х20" },
        { name: "ТЕПЛИЦА БОЯРСКАЯ ЛЮКС 3М", frame: "40х20" },
        { name: "ТЕПЛИЦА БОЯРСКАЯ ЛЮКС 3.5М", frame: "40х20" },
        { name: "ТЕПЛИЦА БОЯРСКАЯ ДЕЛЮКС 2.5М", frame: "20х20+20х20" },
        { name: "ТЕПЛИЦА БОЯРСКАЯ ДЕЛЮКС 3М", frame: "20х20+20х20" },
        { name: "ТЕПЛИЦА БОЯРСКАЯ ПРЕМИУМ 2.5М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА БОЯРСКАЯ ПРЕМИУМ 3М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА БОЯРСКАЯ ПРЕМИУМ 3.5М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА БОЯРСКАЯ ПРЕМИУМ 4М", frame: "40х20+20х20" }
    ],
    "Каплевидная": [
        { name: "ТЕПЛИЦА СТРЕЛЕЦКАЯ ЛЮКС 2.5М", frame: "40х20" },
        { name: "ТЕПЛИЦА СТРЕЛЕЦКАЯ ЛЮКС 3М", frame: "40х20" },
        { name: "ТЕПЛИЦА СТРЕЛЕЦКАЯ ЛЮКС 3.5М", frame: "40х20" }
    ],
    "Прямостенная": [
        { name: "ТЕПЛИЦА ЦАРСКАЯ ЛЮКС 2.5М", frame: "40х20" },
        { name: "ТЕПЛИЦА ЦАРСКАЯ ЛЮКС 3М", frame: "40х20" },
        { name: "ТЕПЛИЦА ЦАРСКАЯ ЛЮКС 3.5М", frame: "40х20" },
        { name: "ТЕПЛИЦА ЦАРСКАЯ ПРЕМИУМ 2.5М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА ЦАРСКАЯ ПРЕМИУМ 3М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА ЦАРСКАЯ ПРЕМИУМ 3.5М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА ЦАРСКАЯ ПРЕМИУМ 4М", frame: "40х20+20х20" }
    ],
    "Домиком": [
        { name: "ТЕПЛИЦА ДВОРЦОВАЯ ЛЮКС 2.5М", frame: "40х20" },
        { name: "ТЕПЛИЦА ДВОРЦОВАЯ ЛЮКС 3М", frame: "40х20" },
        { name: "ТЕПЛИЦА ДВОРЦОВАЯ ЛЮКС 3.5М", frame: "40х20" },
        { name: "ТЕПЛИЦА ДВОРЦОВАЯ ПРЕМИУМ 2.5М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА ДВОРЦОВАЯ ПРЕМИУМ 3М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА ДВОРЦОВАЯ ПРЕМИУМ 3.5М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА ДВОРЦОВАЯ ПРЕМИУМ 4М", frame: "40х20+20х20" }
    ],
    "Пристенная": [
        { name: "ТЕПЛИЦА ПРИСТЕННАЯ ЛЮКС 2.5М", frame: "40х20" },
        { name: "ТЕПЛИЦА ПРИСТЕННАЯ ЛЮКС 3М", frame: "40х20" },
        { name: "ТЕПЛИЦА ПРИСТЕННАЯ ПРЕМИУМ 2.5М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА ПРИСТЕННАЯ ПРЕМИУМ 3М", frame: "40х20+20х20" }
    ],
    "Миттлайдер арочная": [
        { name: "ТЕПЛИЦА МИТТЛАЙДЕР ЛЮКС 3М", frame: "40х20" },
        { name: "ТЕПЛИЦА МИТТЛАЙДЕР ЛЮКС 3.5М", frame: "40х20" },
        { name: "ТЕПЛИЦА МИТТЛАЙДЕР ПРЕМИУМ 3М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА МИТТЛАЙДЕР ПРЕМИУМ 3.5М", frame: "40х20+20х20" }
    ],
    "Миттлайдер прямостенная": [
        { name: "ТЕПЛИЦА МИТТЛАЙДЕР ЭЛИТ 3М", frame: "40х20+20х20" },
        { name: "ТЕПЛИЦА МИТТЛАЙДЕР ЭЛИТ 3.5М", frame: "40х20+20х20" }
    ],
    "Промышленная прямостенная": [
        { name: "ТЕПЛИЦА ПРЕМЬЕР ПРЕМИУМ 5М", frame: "40х20+40х20" },
        { name: "ТЕПЛИЦА ПРЕМЬЕР ПРЕМИУМ 6М", frame: "40х20+40х20" }
    ],
    "Промышленная домиком": [
        { name: "ТЕПЛИЦА МОНАРХ ПРЕМИУМ 7М", frame: "40х20+40х20" },
        { name: "ТЕПЛИЦА МОНАРХ ПРЕМИУМ 8М", frame: "40х20+40х20" }
    ]
};

// Создание обратной карты: form_name -> category
const formNameToCategory = {};

Object.keys(availableForms).forEach(category => {
    availableForms[category].forEach(form => {
        formNameToCategory[normalizeString(form.name)] = category;
    });
});

// Функция определения категории на основе имени формы
function getFormCategory(formName) {
    if (!formName || typeof formName !== "string") return "Прочие";
    const normalizedFormName = normalizeString(formName);
    const category = formNameToCategory[normalizedFormName];
    if (category) {
        return category;
    } else {
        return "Прочие";
    }
}

let currentCityData = []; // Данные для текущего города
let deliveryCost = 0; // Стоимость доставки
let currentDeliveryDate = null; // Текущая дата доставки для выбранного города
let currentDeliveryAssemblyDate = null; // Дата сборки (null = совпадает с доставкой)
let currentDeliveryRestrictions = null; // Общие ограничения по датам (доставка и сборка)
/** Новый слой дат: true = данные из delivery_calendar, иначе fallback на delivery_dates */
let deliveryDatesFromCalendar = false;
let currentAvailableDatesWithoutAssembly = []; // ISO даты (ДС+Д), только даты > сегодня Москва
let currentAvailableDatesWithAssembly = [];   // ISO даты (только ДС), только даты > сегодня Москва
let currentDeliveryDateStateMap = Object.create(null); // { iso: { withoutAssembly, withAssembly, rawStatus } }
let activeOfferTab = 'short'; // Активная вкладка КП: 'short' или 'long'
let orderTextFilledBySubmit = false; // true = в «Текст заказа» только что подставили полный шаблон, не перезаписывать превью
let clearingFormAfterSubmit = false; // true = очищаем форму после отправки, не перезаписывать поле «Текст заказа»
let lastCalculation = null; // Данные последнего расчёта для формы заказа
/** Корзина заказа: массив позиций (разные теплицы). Каждая — копия lastCalculation + itemTotal без доставки + снимок опций для «Изменить». */
let orderCart = [];
/** Хранилище выбранных грядок (объявление выше блока инициализации при загрузке, чтобы не было TDZ). */
let selectedBeds = JSON.parse(localStorage.getItem('selectedBeds') || '{}');
/** Флаг сборки грядок (объявление выше блока инициализации при загрузке). */
let bedsAssemblyEnabled = localStorage.getItem('bedsAssemblyEnabled') === 'true';
/** Индекс позиции в orderCart, которую пользователь редактирует через «Изменить»; при следующем «Добавить в заказ» — замена этой позиции. */
let orderCartEditingIndex = null;
/** id заказа в Supabase при редактировании; при заданном — submitOrder делает update вместо insert */
let currentOrderIdForEdit = null;
/** Дата создания редактируемого заказа (ISO); для заказов до 2026-03-09 проверку региона не показываем. */
let currentOrderCreatedAtForEdit = null;

/** Состав заказа в модалке редактирования: массив { model, width, length, frame, arc_step, polycarbonate, item_total, form, city }. */
let editOrderComposition = [];
/** Стоимость доставки по заказу (один раз на заказ); для total = sum(item_total) + editOrderDeliveryCost. */
let editOrderDeliveryCost = 0;
/** Итого по заказу при последней загрузке (для отображения цены теплицы как остаток, если base_price/item_total нет). */
let lastLoadedOrderTotalForDisplay = null;
/** Менеджер из загруженного заказа (для пересборки commercial_offer при edit). */
var lastEditOrderManager = '';
/** Оригинальный commercial_offer загруженного заказа (для извлечения height, snowLoad и т.д. при edit). */
var lastLoadedOrderCommercialOffer = '';
/** Индекс позиции при редактировании (null = добавление новой). */
let editOrderEditingIndex = null;
/** Данные цен по городу для подформы добавления позиции в модалке (не трогаем currentCityData). */
let modalCityData = [];
/** Результат последнего расчёта в подформе модалки (для «Добавить в состав»). */
let lastModalCalculationResult = null;
/** Город, по которому загружены данные в панели «Добавить теплицу» (при добавлении новой позиции — чтобы сохранить в состав тот же город). */
let editOrderAddPanelCity = null;
/** Снимок состава заказа до последнего действия (удаление/добавление/изменение позиции) — для кнопки «Вернуть». */
let editOrderCompositionUndoSample = null;
/** Полный снимок состояния редактирования (состав + подарки) для отмены/повтора любого действия. */
let editOrderStateUndoSample = null;
let editOrderStateRedoSample = null;
/** Снимок состояния после последнего «зафиксированного» действия (открытие, изменение состава/подарков, undo/redo). */
let lastSavedEditOrderState = null;
/** Снимок полей формы после загрузки заказа (для проверки «несохранённые изменения»). */
let lastSavedEditOrderFormState = null;
/** Состояние заказа в момент загрузки или последнего сохранения на сервер (только для проверки «есть несохранённые изменения»). Не обновляется при добавлении товара/undo/redo. */
let lastPersistedEditOrderState = null;
let lastPersistedEditOrderFormState = null;
/** Колбэк при нажатии «Закрыть без сохранения» в диалоге подтверждения (пока диалог виден). */
let editOrderCloseConfirmCallback = null;
/** Флаг: идёт восстановление из undo/redo, не пушить новый undo из onEditOrderGiftSelectChange. */
let editOrderRestoringState = false;
/** Флаг: пересборка блока подарков из-за смены выбора (чтобы скрыть занятый слот window-auto), не пушить undo во вложенном onEditOrderGiftSelectChange. */
let editOrderGiftBlockRebuilding = false;
/** Предыдущее кол-во gift slots (для уведомления о смене tier). -1 = ещё не инициализировано. */
let editOrderGiftSlotsPrev = -1;
/** Raw gift text существующего заказа на момент открытия. null = не установлен (новый заказ). */
let _editOrderOriginalGiftRaw = null;
/** Raw client_phone существующего заказа на момент открытия. null = не установлен (новый заказ). */
let _editOrderOriginalPhoneRaw = null;
/** Пользователь явно редактировал поле телефона в текущей сессии редактирования. */
let _editOrderPhoneTouchedByUser = false;
/** Пользователь явно выбирал подарки в селектах модалки в текущей сессии редактирования. */
let _editOrderGiftTouchedByUser = false;
/** Gift tier (кол-во слотов) на момент открытия заказа. Для определения реального tier change из-за изменения состава. */
let _editOrderGiftTierAtOpen = 0;
/** Сохранённый orders.city на момент открытия заказа. Primary source of truth для edit calendar. null = не установлен. */
let _editOrderLoadedCityRaw = null;
/** Сохранённый orders.warehouse_city_key на момент открытия заказа. Source of truth для delivery readers. null = не установлен. */
let _editOrderLoadedWarehouseCityKey = null;

function editOrderCompositionClone() {
    return editOrderComposition.map(function (item) {
        var o = {};
        for (var k in item) if (Object.prototype.hasOwnProperty.call(item, k)) o[k] = item[k];
        return o;
    });
}

/** Текущий выбор подарков из DOM (селекты в модалке). */
function getEditOrderGiftSelectionFromDom() {
    var out = {};
    var selects = document.querySelectorAll('.edit-order-gift-select');
    selects.forEach(function (sel) {
        var num = (sel.id || '').replace('edit-order-gift-', '');
        if (num && sel.value && sel.value.trim()) out['gift-' + num] = sel.value.trim();
    });
    return out;
}

/** Полный снимок состояния: состав + подарки (для undo/redo любого действия). */
function getEditOrderStateSnapshot() {
    return {
        composition: editOrderCompositionClone(),
        gifts: getEditOrderGiftSelectionFromDom()
    };
}

/** Снимок полей формы (имя, телефон, дата, адрес, источник, комментарий) для проверки несохранённых изменений. */
function getEditOrderFormSnapshot() {
    var nameEl = document.getElementById('edit-order-client-name');
    var phoneEl = document.getElementById('edit-order-client-phone');
    var dateEl = document.getElementById('edit-order-delivery-date');
    var addr1 = document.getElementById('edit-order-address-part1');
    var addr2 = document.getElementById('edit-order-address-part2');
    var addr3 = document.getElementById('edit-order-address-part3');
    var noPlotEl = document.getElementById('edit-order-no-plot');
    var sourceEl = document.getElementById('edit-order-source');
    var commentEl = document.getElementById('edit-order-comment');
    return {
        name: nameEl ? (nameEl.value || '').trim() : '',
        phone: phoneEl ? (phoneEl.value || '').trim() : '',
        deliveryDate: dateEl ? (dateEl.value || '').trim() : '',
        addr1: addr1 ? (addr1.value || '').trim() : '',
        addr2: addr2 ? (addr2.value || '').trim() : '',
        addr3: addr3 ? (addr3.value || '').trim() : '',
        noPlot: noPlotEl ? !!noPlotEl.checked : false,
        source: sourceEl ? (sourceEl.value || '').trim() : '',
        comment: commentEl ? (commentEl.value || '').trim() : ''
    };
}

/** Восстановить состояние из снимка (состав + подарки). */
function restoreEditOrderState(snap) {
    if (!snap) return;
    editOrderComposition.length = 0;
    if (snap.composition && snap.composition.length) {
        snap.composition.forEach(function (item) { editOrderComposition.push(item); });
    }
    editOrderRestoringState = true;
    // Устанавливаем значение gift ДО вызова renderEditOrderCompositionList:
    // иначе updateEditOrderGiftFromTotal (вызванный внутри render) сначала очищает поле,
    // а потом мы снова ставили значение из снимка — обходя threshold-проверку.
    var giftEl = document.getElementById('edit-order-gift');
    if (giftEl && typeof getGiftsTextFromObject === 'function') {
        var giftText = snap.gifts ? getGiftsTextFromObject(snap.gifts) : '';
        giftEl.value = giftText ? String(giftText).replace(/^\s+/, '').trim() : '';
    }
    renderEditOrderCompositionList(); // вызовет updateEditOrderGiftFromTotal → применит threshold
    editOrderRestoringState = false;
}

function updateEditOrderUndoRedoButtons() {
    var canUndo = !!editOrderStateUndoSample;
    var canRedo = !!editOrderStateRedoSample;
    var undoBtn = document.getElementById('edit-order-undo-btn');
    if (undoBtn) {
        undoBtn.disabled = !canUndo;
        undoBtn.setAttribute('aria-disabled', canUndo ? 'false' : 'true');
        undoBtn.title = canUndo ? 'Отменить последнее действие (состав или подарки)' : 'Нечего отменять';
    }
    var redoBtn = document.getElementById('edit-order-redo-btn');
    if (redoBtn) {
        redoBtn.disabled = !canRedo;
        redoBtn.setAttribute('aria-disabled', canRedo ? 'false' : 'true');
        redoBtn.title = canRedo ? 'Вернуть отменённое действие вперёд' : 'Нечего вернуть вперёд';
    }
}

// Кеширование для оптимизации производительности
let citiesCache = null; // Кеш списка городов
let cityDataCache = {}; // Кеш данных по городам {cityName: data}

// Инициализация Supabase
const SUPABASE_URL = 'https://dyoibmfdohpvjltfaygr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5b2libWZkb2hwdmpsdGZheWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5ODAxMzcsImV4cCI6MjA0OTU1NjEzN30.ZHj1JJsmSN45-0cv83uJDpaqtv3R6_U7CZmbkK-H24s'; // Ваш Anon Public Key

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let mapInstance;
let currentRoute;

/**
 * Вызов callback только если Яндекс.Карты загружены; при ошибке сети API может быть недоступен.
 * Подсказки адреса — бесплатный вариант: ymaps.geocode() (не платный Геосаджест/Suggest API).
 * Своя логика: контекст part1 / part1+part2 для иерархии регион→улица→дом; разбор через
 * getAdministrativeAreas/getLocalities/getThoroughfare/getPremiseNumber. Поля #address и
 * #order-address-part1/2/3, контейнеры #suggestions и #order-suggestions-1/2/3, #edit-order-suggestions-1/2/3.
 */
function whenYmapsReady(callback) {
    if (typeof ymaps === 'undefined') {
        console.warn('Яндекс.Карты не загружены (сеть или ошибка API). Подсказки адреса и карта недоступны.');
        return;
    }
    try {
        ymaps.ready(callback);
    } catch (e) {
        console.warn('Яндекс.Карты: ошибка инициализации', e);
    }
}

whenYmapsReady(() => {
    mapInstance = new ymaps.Map("map", {
        center: [55.751244, 37.618423],
        zoom: 7
    });

    // Инициализация SuggestView для автодополнения адреса
    // const suggestView = new ymaps.SuggestView('address'); // Удалено, т.к. мы используем собственные подсказки
});

// Функция аутентификации через Supabase RPC (пароль не уходит в браузер)
async function authenticate() {
    const loginInput = document.getElementById("login");
    const passwordInput = document.getElementById("password");
    const authError = document.getElementById("auth-error");

    const login = loginInput.value.trim();
    const password = passwordInput.value.trim();

    if (!login || !password) {
        if (authError) {
            authError.textContent = "Пожалуйста, введите логин и пароль!";
        authError.style.display = "block";
        }
        return;
    }

    try {
        if (!supabaseClient) {
            console.error("Supabase клиент не инициализирован!");
            if (authError) {
                authError.textContent = "Ошибка подключения к базе данных. Проверьте настройки.";
                authError.style.display = "block";
            }
            return;
        }

        const { data, error } = await supabaseClient.rpc('authenticate_user', {
            p_login: login,
            p_password: password
        });

        if (error) {
            const errorMessage = error.message || '';
            if (errorMessage.includes('Load failed') || errorMessage.includes('TypeError') || errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
                if (authError) {
                    authError.textContent = "Ошибка подключения к серверу. Проверьте интернет-соединение и попробуйте снова.";
                    authError.style.display = "block";
                }
                return;
            }
            console.error("Ошибка RPC authenticate_user:", error);
            if (authError) {
                authError.textContent = "Неверный логин или пароль!";
                authError.style.display = "block";
            }
            return;
        }

        if (!data || !data.user_id) {
            if (authError) {
                authError.textContent = "Неверный логин или пароль!";
                authError.style.display = "block";
            }
            return;
        }

        if (!data.is_active) {
            if (authError) {
                authError.textContent = "Ваш аккаунт деактивирован. Обратитесь к администратору.";
                authError.style.display = "block";
            }
            return;
        }

        authError.style.display = "none";
        localStorage.setItem('savedLogin', data.login || login);
        localStorage.setItem('appVersion', APP_VERSION);
        localStorage.setItem('passwordVersion', String(data.password_version || 0));
        localStorage.setItem('userId', data.user_id);

        if (login && login.trim().toLowerCase() === 'admin') {
            localStorage.setItem(ADMIN_KEY, 'true');
        } else {
            localStorage.removeItem(ADMIN_KEY);
        }

        document.getElementById("auth-container").classList.add("hidden");
        document.getElementById("calculator-container").classList.remove("hidden");
        await initializeCalculator();
    } catch (err) {
        console.error("Ошибка при авторизации:", err);
        const errorMessage = err.message || '';
        if (authError) {
            if (errorMessage.includes('Load failed') || errorMessage.includes('TypeError') || errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
                authError.textContent = "Ошибка подключения к серверу. Проверьте интернет-соединение и попробуйте снова.";
            } else {
                authError.textContent = "Неверный логин или пароль!";
            }
            authError.style.display = "block";
        }
    }
}


// Функция выхода
function logout() {
    try {
        const savedLogin = localStorage.getItem('savedLogin');
        
        localStorage.removeItem('savedLogin');
        localStorage.removeItem('passwordVersion');
        localStorage.removeItem('userId');
        localStorage.removeItem(ADMIN_KEY);
        
        const authContainer = document.getElementById("auth-container");
        const calcContainer = document.getElementById("calculator-container");
        
        if (authContainer) {
            authContainer.classList.remove("hidden");
        } else {
            console.error("auth-container не найден!");
        }
        
        if (calcContainer) {
            calcContainer.classList.add("hidden");
        } else {
            console.error("calculator-container не найден!");
        }
        
        // Скрываем админ-панель, если открыта
        const adminPanel = document.getElementById("admin-panel");
        if (adminPanel) {
            adminPanel.classList.add("hidden");
        }
        
        // Сброс калькулятора при выходе
        resetDropdown('form', 'Сначала выберите город');
        resetDropdown('width', 'Сначала выберите форму');
        resetDropdown('length', 'Сначала выберите ширину');
        resetDropdown('frame', 'Сначала выберите длину');
        resetDropdown('polycarbonate', 'Сначала выберите город');
        resetDropdown('arcStep', 'Выберите шаг');
        resetAdditionalOptions();
        
        const offerField = document.getElementById("commercial-offer");
        if (offerField) {
            offerField.value = "Здесь будет ваше коммерческое предложение.";
        }
        
        const resultDiv = document.getElementById("result");
        if (resultDiv) {
            resultDiv.innerText = "";
        }
        
        if (mapInstance && currentRoute) {
            mapInstance.geoObjects.remove(currentRoute);
        }
        
    } catch (error) {
        console.error("❌ Ошибка при выходе:", error);
        // Принудительная очистка localStorage и перезагрузка
        localStorage.clear();
        location.reload();
    }
}

// Функция проверки актуальности пароля пользователя (через RPC, без чтения users)
async function checkPasswordVersion() {
    const savedLogin = localStorage.getItem('savedLogin');
    const savedPasswordVersion = localStorage.getItem('passwordVersion');

    if (!savedLogin || !savedPasswordVersion) {
        return false;
    }

    try {
        const { data, error } = await supabaseClient.rpc('validate_session', {
            p_login: savedLogin,
            p_password_version: savedPasswordVersion
        });

        if (error) {
            if (isNetworkError(error)) {
                console.warn("[Сессия] Ошибка сети при проверке версии пароля (Supabase недоступен). Продолжаем работу.");
                return true;
            }
            console.error("Ошибка validate_session:", error);
            logout();
            return false;
        }

        if (!data || !data.user_id) {
            logout();
            showWarning("Сессия истекла. Пожалуйста, войдите снова.", 'Сессия');
            return false;
        }

        if (!data.is_active || String(data.password_version || '') !== savedPasswordVersion) {
            logout();
            if (String(data.password_version || '') !== savedPasswordVersion) {
                showWarning("Сессия истекла. Пожалуйста, войдите снова.", 'Сессия');
            }
            return false;
        }

        return true;
    } catch (err) {
        if (isNetworkError(err)) {
            console.warn("[Сессия] Ошибка сети при проверке версии пароля. Продолжаем работу.");
            return true;
        }
        console.warn("Ошибка при проверке версии пароля (продолжаем работу):", err);
        return true;
    }
}

// Функция проверки сетевых ошибок
function isNetworkError(error) {
    if (!error) return false;
    const errorStr = JSON.stringify(error).toLowerCase();
    const msg = (error.message && error.message.toLowerCase()) || '';
    return errorStr.includes('load failed') ||
           errorStr.includes('network') ||
           errorStr.includes('timeout') ||
           errorStr.includes('err_network_changed') ||
           errorStr.includes('err_name_not_resolved') ||
           errorStr.includes('err_connection_closed') ||
           errorStr.includes('failed to fetch') ||
           errorStr.includes('networkerror') ||
           msg.includes('failed to fetch') ||
           msg.includes('connection_closed');
}

/**
 * Формирует текст даты доставки/сборки для КП с учётом типа заказа
 * @param {boolean} withAssembly - Выбрана ли доставка со сборкой
 * @returns {string} Текст для вставки в КП (только дата, напр. "15.02.2026")
 */
/** Для КП: только актуальная дата — без служебной инфы. Со сборкой = дата сборки, без = дата доставки. */
function getDeliveryDateTextForKP(withAssembly) {
    if (!currentDeliveryDate) return null;
    const y = new Date().getFullYear();
    if (!withAssembly) return `${currentDeliveryDate}.${y}`;
    const a = currentDeliveryAssemblyDate || currentDeliveryDate;
    return `${a}.${y}`;
}

/** Текст для блока результата доставки (менеджер озвучивает). Ограничения общие для доставки и сборки. */
function getDeliveryDateTextForBlock(withAssembly) {
    if (!currentDeliveryDate) return null;
    const y = new Date().getFullYear();
    const d = `${currentDeliveryDate}.${y}`;
    const restr = currentDeliveryRestrictions ? currentDeliveryRestrictions.split(',').map(r => r.trim()).filter(r => r) : [];
    const r = restr.length > 0 ? ` (кроме ${restr.join(', ')})` : '';

    if (!withAssembly) return `Доставка: с ${d}${r}`;

    const assemblyDate = currentDeliveryAssemblyDate || currentDeliveryDate;
    const a = `${assemblyDate}.${y}`;
    return `Доставка: с ${d}, сборки с ${a}${r}`;
}

/** DD.MM или DD.MM.YYYY → "17 марта" (год не показывается). Для UI блока доставки. */
function formatDateToDayMonth(dateStr) {
    if (!dateStr || dateStr === '—') return '—';
    var parts = String(dateStr).split('.');
    if (parts.length < 2) return dateStr;
    var day = parts[0];
    var monthNum = parseInt(parts[1], 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return dateStr;
    var months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    return day + ' ' + months[monthNum - 1];
}

/** Данные для UI блока доставки: { without, withAssembly } в формате DD.MM.YYYY или "—". */
function getDeliveryDateBlockForUI() {
    if (!currentDeliveryDate) return null;
    var without = '', withA = '';
    if (deliveryDatesFromCalendar) {
        var nw = getNearestAvailableDate(false);
        var naw = getNearestAvailableDate(true);
        if (!nw && !naw) return null;
        var yNw = nw ? nw.split('-')[0] : null;
        var yNaw = naw ? naw.split('-')[0] : null;
        without = nw ? (isoDateToDdMm(nw) + '.' + yNw) : '—';
        withA = naw ? (isoDateToDdMm(naw) + '.' + yNaw) : '—';
    } else {
        var yMoscow = getTodayMoscowISO().slice(0, 4);
        without = currentDeliveryDate + '.' + yMoscow;
        withA = (currentDeliveryAssemblyDate || currentDeliveryDate) + '.' + yMoscow;
    }
    return { without: without, withAssembly: withA };
}

/** Две ближайшие даты для блока доставки (без текста "кроме ..."). Год по Москве. */
function getDeliveryDateBlockTwoLines() {
    if (!currentDeliveryDate) return null;
    var without = '', withA = '';
    if (deliveryDatesFromCalendar) {
        var nw = getNearestAvailableDate(false);
        var naw = getNearestAvailableDate(true);
        if (!nw && !naw) return null;
        var yNw = nw ? nw.split('-')[0] : null;
        var yNaw = naw ? naw.split('-')[0] : null;
        without = nw ? (isoDateToDdMm(nw) + '.' + yNw) : '—';
        withA = naw ? (isoDateToDdMm(naw) + '.' + yNaw) : '—';
    } else {
        var yMoscow = getTodayMoscowISO().slice(0, 4);
        without = currentDeliveryDate + '.' + yMoscow;
        withA = (currentDeliveryAssemblyDate || currentDeliveryDate) + '.' + yMoscow;
    }
    return 'Ближайшая дата без сборки: ' + without + '\nБлижайшая дата со сборкой: ' + withA;
}

/** Текущая календарная дата по Москве (UTC+3), ISO YYYY-MM-DD. Источник истины для фильтра доступных дат — не локальная дата браузера. */
function getTodayMoscowISO() {
    var utcMs = Date.now();
    var moscowMs = utcMs + 3 * 60 * 60 * 1000;
    var d = new Date(moscowMs);
    var y = d.getUTCFullYear();
    var m = String(d.getUTCMonth() + 1).padStart(2, '0');
    var day = String(d.getUTCDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
}

/** ISO YYYY-MM-DD → DD.MM для отображения в блоке доставки/КП */
function isoDateToDdMm(iso) {
    if (!iso || typeof iso !== 'string') return null;
    var p = iso.split('-');
    if (p.length !== 3) return null;
    return p[2] + '.' + p[1];
}

function normalizeDeliveryCalendarISO(value) {
    if (!value) return null;
    var iso = typeof value === 'string' ? value : String(value);
    if (!iso) return null;
    if (iso.indexOf('T') !== -1) iso = iso.split('T')[0];
    var parts = iso.split('-');
    if (parts.length !== 3) return null;
    return parts[0] + '-' + parts[1] + '-' + parts[2];
}

function getMoscowTodayDateObject() {
    var parts = getTodayMoscowISO().split('-');
    return new Date(+parts[0], +parts[1] - 1, +parts[2]);
}

function getCurrentCalendarSlotsByMode(withAssembly) {
    return withAssembly ? (currentAvailableDatesWithAssembly || []) : (currentAvailableDatesWithoutAssembly || []);
}

/** Дата доступна для режима? delivery_calendar = слой ограничений; future unknown = доступна */
function isDateAvailableForMode(iso, withAssembly, todayISO) {
    if (!iso || iso <= todayISO) return false;
    var meta = currentDeliveryDateStateMap[iso];
    if (!meta) return true;
    return withAssembly ? !!meta.withAssembly : !!meta.withoutAssembly;
}

/** Ближайшая доступная дата после todayMoscow для режима (сборка/без) */
function getNearestAvailableDate(withAssembly) {
    if (!deliveryDatesFromCalendar) return null;
    var todayISO = getTodayMoscowISO();
    var p = todayISO.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    for (var i = 0; i < 400; i++) {
        d.setDate(d.getDate() + 1);
        var iso = formatISOLocal(d);
        if (isDateAvailableForMode(iso, withAssembly, todayISO)) return iso;
    }
    return null;
}

function getDeliveryCalendarCellState(cellISO, withAssembly, todayISO) {
    if (cellISO <= todayISO) return 'past';
    var meta = currentDeliveryDateStateMap[cellISO];
    if (!meta) return 'available';
    return withAssembly ? (meta.withAssembly ? 'available' : 'blocked') : (meta.withoutAssembly ? 'available' : 'blocked');
}

function syncOrderCalendarSlotsWithMode() {
    if (!deliveryDatesFromCalendar) return false;
    var assemblyEl = document.getElementById('assembly');
    var withAssembly = assemblyEl ? assemblyEl.checked : false;
    var todayISO = getTodayMoscowISO();
    if (_orderCalSelected && isDateAvailableForMode(_orderCalSelected, withAssembly, todayISO)) return true;
    selectOrderCalDate(getNearestAvailableDate(withAssembly) || '');
    return true;
}

function syncEditOrderCalendarSlotsWithMode() {
    if (!deliveryDatesFromCalendar) return false;
    var assemblyEditEl = document.getElementById('edit-order-add-assembly');
    var withAssemblyEdit = assemblyEditEl ? assemblyEditEl.checked : false;
    var todayISO = getTodayMoscowISO();
    if (_editOrderCalSelected && isDateAvailableForMode(_editOrderCalSelected, withAssemblyEdit, todayISO)) return true;
    selectEditOrderCalDate(getNearestAvailableDate(withAssemblyEdit) || '');
    return true;
}

function applyDeliveryCalendarRows(rows, todayMoscow) {
    var withoutAssembly = [];
    var withAssembly = [];
    var stateMap = Object.create(null);
    for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var iso = normalizeDeliveryCalendarISO(r.delivery_date);
        if (!iso) continue;
        stateMap[iso] = {
            withoutAssembly: !!r.available_without_assembly,
            withAssembly: !!r.available_with_assembly,
            rawStatus: r.raw_status || null
        };
        if (iso <= todayMoscow) continue;
        if (r.available_without_assembly) withoutAssembly.push(iso);
        if (r.available_with_assembly) withAssembly.push(iso);
    }
    deliveryDatesFromCalendar = true;
    currentAvailableDatesWithoutAssembly = withoutAssembly;
    currentAvailableDatesWithAssembly = withAssembly;
    currentDeliveryDateStateMap = stateMap;
    currentDeliveryRestrictions = null;
    var nearestWithout = getNearestAvailableDate(false);
    var nearestWith = getNearestAvailableDate(true);
    if (!nearestWithout && !nearestWith) {
        currentDeliveryDate = null;
        currentDeliveryAssemblyDate = null;
        updateDeliveryDateDisplay();
        return null;
    }
    currentDeliveryDate = isoDateToDdMm(nearestWithout || nearestWith);
    currentDeliveryAssemblyDate = nearestWith ? isoDateToDdMm(nearestWith) : (nearestWithout ? isoDateToDdMm(nearestWithout) : null);
    updateDeliveryDateDisplay();
    return currentDeliveryDate;
}

// Функция загрузки даты доставки для города
async function loadDeliveryDate(cityName) {
    if (!cityName) {
        currentDeliveryDate = null;
        currentDeliveryAssemblyDate = null;
        currentDeliveryRestrictions = null;
        deliveryDatesFromCalendar = false;
        currentAvailableDatesWithoutAssembly = [];
        currentAvailableDatesWithAssembly = [];
        currentDeliveryDateStateMap = Object.create(null);
        updateDeliveryDateDisplay();
        return null;
    }

    var todayMoscow = getTodayMoscowISO();

    try {
        var calRes = await supabaseClient
            .from('delivery_calendar')
            .select('city_name, delivery_date, available_without_assembly, available_with_assembly, raw_status')
            .eq('city_name', cityName)
            .order('delivery_date');

        if (!calRes.error && calRes.data && calRes.data.length > 0) {
            applyDeliveryCalendarRows(calRes.data, todayMoscow);
            return currentDeliveryDate;
        }

        if (!calRes.error && calRes.data && calRes.data.length === 0) {
            var normalizedCity = normalizeCityName(cityName);
            var calAltRes = await supabaseClient
                .from('delivery_calendar')
                .select('city_name, delivery_date, available_without_assembly, available_with_assembly, raw_status')
                .limit(1000);

            if (!calAltRes.error && calAltRes.data && calAltRes.data.length > 0) {
                var matchedRow = calAltRes.data.find(function(item) {
                    var cleanedItem = cleanDeliveryCityName(item.city_name);
                    var normalizedItem = normalizeCityName(cleanedItem);
                    return normalizedItem === normalizedCity ||
                           normalizedCity.includes(normalizedItem) ||
                           normalizedItem.includes(normalizedCity);
                });
                if (matchedRow) {
                    var matchedNormalizedCity = normalizeCityName(cleanDeliveryCityName(matchedRow.city_name));
                    var matchedRows = calAltRes.data.filter(function(item) {
                        return normalizeCityName(cleanDeliveryCityName(item.city_name)) === matchedNormalizedCity;
                    });
                    if (matchedRows.length > 0) {
                        applyDeliveryCalendarRows(matchedRows, todayMoscow);
                        return currentDeliveryDate;
                    }
                }
            }
        }

        if (calRes.error || !calRes.data || calRes.data.length === 0) {
            deliveryDatesFromCalendar = false;
            currentAvailableDatesWithoutAssembly = [];
            currentAvailableDatesWithAssembly = [];
            currentDeliveryDateStateMap = Object.create(null);
        }
    } catch (e) {
        deliveryDatesFromCalendar = false;
        currentAvailableDatesWithoutAssembly = [];
        currentAvailableDatesWithAssembly = [];
        currentDeliveryDateStateMap = Object.create(null);
    }

    try {
        let { data, error } = await supabaseClient
            .from('delivery_dates')
            .select('delivery_date, assembly_date, restrictions')
            .eq('city_name', cityName)
            .maybeSingle();

        if (error && error.code === '42703') {
            const { data: fallback } = await supabaseClient
                .from('delivery_dates')
                .select('delivery_date, restrictions')
                .eq('city_name', cityName)
                .maybeSingle();
            if (fallback) {
                data = { ...fallback, assembly_date: null };
                error = null;
            }
        }

        if (error || !data) {
            if (DEBUG) console.log(`Точное совпадение не найдено для "${cityName}", ищем альтернативы...`, error);
            
            const normalizedCity = normalizeCityName(cityName);
            const { data: altData, error: altError } = await supabaseClient
                .from('delivery_dates')
                .select('city_name, delivery_date, assembly_date, restrictions')
                .limit(100);

            if (altError) {
                console.error("Ошибка при загрузке альтернативных дат:", altError);
                currentDeliveryDate = null;
                currentDeliveryAssemblyDate = null;
                currentDeliveryRestrictions = null;
                deliveryDatesFromCalendar = false;
                currentAvailableDatesWithoutAssembly = [];
                currentAvailableDatesWithAssembly = [];
                currentDeliveryDateStateMap = Object.create(null);
                updateDeliveryDateDisplay();
                return null;
            }

            if (altData && altData.length > 0) {
                const found = altData.find(item => {
                    const cleanedItem = cleanDeliveryCityName(item.city_name);
                    const normalizedItem = normalizeCityName(cleanedItem);
                    return normalizedItem === normalizedCity || 
                           normalizedCity.includes(normalizedItem) || 
                           normalizedItem.includes(normalizedCity);
                });
                if (found) {
                    if (DEBUG) console.log(`Найдена дата для "${cityName}" через "${found.city_name}": ${found.delivery_date}`);
                    deliveryDatesFromCalendar = false;
                    currentAvailableDatesWithoutAssembly = [];
                    currentAvailableDatesWithAssembly = [];
                    currentDeliveryDateStateMap = Object.create(null);
                    currentDeliveryDate = found.delivery_date;
                    currentDeliveryAssemblyDate = found.assembly_date || null;
                    currentDeliveryRestrictions = found.restrictions || null;
                    updateDeliveryDateDisplay();
                    return found.delivery_date;
                }
            }
            
            currentDeliveryDate = null;
            currentDeliveryAssemblyDate = null;
            currentDeliveryRestrictions = null;
            deliveryDatesFromCalendar = false;
            currentAvailableDatesWithoutAssembly = [];
            currentAvailableDatesWithAssembly = [];
            currentDeliveryDateStateMap = Object.create(null);
            updateDeliveryDateDisplay();
            return null;
        }

        // НЕ используем "Город доставки" — источник истины только канонические города (fallback delivery_dates)
        deliveryDatesFromCalendar = false;
        currentAvailableDatesWithoutAssembly = [];
        currentAvailableDatesWithAssembly = [];
        currentDeliveryDateStateMap = Object.create(null);
        currentDeliveryDate = data.delivery_date;
        currentDeliveryAssemblyDate = data.assembly_date || null;
        currentDeliveryRestrictions = data.restrictions || null;
        updateDeliveryDateDisplay();
        return data.delivery_date;
    } catch (err) {
        console.error("Ошибка при загрузке даты доставки:", err);
        currentDeliveryDate = null;
        currentDeliveryAssemblyDate = null;
        currentDeliveryRestrictions = null;
        deliveryDatesFromCalendar = false;
        currentAvailableDatesWithoutAssembly = [];
        currentAvailableDatesWithAssembly = [];
        currentDeliveryDateStateMap = Object.create(null);
        updateDeliveryDateDisplay();
        return null;
    }
}

// Функция обновления отображения даты доставки в интерфейсе
// УДАЛЕНО: больше не показываем дату под выпадающим списком города
function updateDeliveryDateDisplay() {
    // Функция оставлена для совместимости, но ничего не делает
    // Дата теперь показывается только в модальном окне
}

/**
 * Рендерит блок результата доставки: стоимость + компактные даты (формат "17 марта").
 * Активная строка подсвечивается по чекбоксу сборки.
 */
function renderDeliveryResultBlock(costText, dateData) {
    if (!dateData) return costText;
    var withoutStr = formatDateToDayMonth(dateData.without);
    var withStr = formatDateToDayMonth(dateData.withAssembly);
    var hasAssembly = !!document.getElementById('assembly')?.checked;
    var activeWithout = hasAssembly ? '' : ' delivery-date-row--active';
    var activeWith = hasAssembly ? ' delivery-date-row--active' : '';
    return costText + '<div class="delivery-result-dates"><div class="delivery-result-dates-title">Даты доставки</div>' +
        '<div class="delivery-date-row' + activeWithout + '">Без сборки — ' + withoutStr + '</div>' +
        '<div class="delivery-date-row' + activeWith + '">Со сборкой — ' + withStr + '</div></div>';
}

/**
 * Обновляет дату в блоке результата доставки (дата доставки и сборки).
 * Перерисовывает блок с учётом активного режима сборки.
 */
function updateDeliveryResultDate() {
    const resultDiv = document.getElementById('result');
    if (!resultDiv || !currentDeliveryDate) return;
    var costEl = resultDiv.querySelector('.delivery-result-cost');
    if (!costEl) return;
    var costText = '<div class="delivery-result-cost">' + costEl.textContent.trim() + '</div>';
    var dateData = getDeliveryDateBlockForUI();
    if (!dateData) return;
    resultDiv.innerHTML = renderDeliveryResultBlock(costText, dateData);
}

// Функция для загрузки городов из Supabase с учётом пагинации
async function loadCities() {
    // Проверяем кеш
    if (citiesCache) {
        const cityDropdown = document.getElementById('city');
        if (cityDropdown && cityDropdown.options.length > 1) {
            return; // Уже загружено
        }
    }
    
    const pageSize = 1000; // Максимальное количество строк за один запрос
    let allCities = [];
    let page = 0;

    while (true) {
        try {
        // Запрос данных с пагинацией
        let { data, error } = await supabaseClient
            .from('prices')
            .select('city_name') // Запрашиваем города
            .range(page * pageSize, (page + 1) * pageSize - 1); // Пагинация

        if (error) {
            console.error("Ошибка при загрузке городов из Supabase:", error);
                // Показываем пользователю понятное сообщение
                const cityDropdown = document.getElementById('city');
                if (cityDropdown) {
                    cityDropdown.innerHTML = '<option value="" disabled selected>Ошибка загрузки данных</option>';
                }
                // Не показываем alert для сетевых ошибок
            return;
        }

        // Если данных на странице меньше, чем pageSize, значит, это последняя страница
        if (data.length === 0) break;

        // Добавляем города в общий массив
        allCities = allCities.concat(data.map(item => item.city_name));
        page++;
        } catch (err) {
            console.error("Критическая ошибка при загрузке городов:", err);
            const cityDropdown = document.getElementById('city');
            if (cityDropdown) {
                cityDropdown.innerHTML = '<option value="" disabled selected>Ошибка загрузки данных</option>';
            }
            // Не показываем alert для сетевых ошибок
            return;
        }
    }

    // Убираем дубликаты городов
    let uniqueCities = [...new Set(allCities)];

    // Приоритетные города
    const priorityCities = ["Москва", "Санкт-Петербург"];

    // Удаляем приоритетные города из основного списка
    uniqueCities = uniqueCities.filter(city => !priorityCities.includes(city));

    // Сортируем оставшиеся города по алфавиту
    uniqueCities.sort((a, b) => a.localeCompare(b, 'ru'));

    // Объединяем приоритетные города и отсортированные города
    const finalCities = [...priorityCities, ...uniqueCities];

    // Обновляем выпадающий список
    const cityDropdown = document.getElementById('city');
    cityDropdown.innerHTML = '<option value="" disabled selected>Выберите город</option>';

    finalCities.forEach(city => {
        cityDropdown.innerHTML += `<option value="${city}">${city}</option>`;
    });
    
    // Сохраняем в кеш
    citiesCache = finalCities;
}

// Функция обработки изменения города
async function onCityChange() {
    const city = document.getElementById('city').value;

    // Если город не выбран – сбрасываем все поля
    if (!city) {
        resetDropdown('form', 'Сначала выберите город');
        resetDropdown('width', 'Сначала выберите форму');
        resetDropdown('length', 'Сначала выберите ширину');
        resetDropdown('frame', 'Сначала выберите длину');
        resetDropdown('arcStep', 'Выберите шаг');
        resetDropdown('polycarbonate', 'Сначала выберите город');
        resetAdditionalOptions();
        currentDeliveryDate = null;
        currentDeliveryAssemblyDate = null;
        currentDeliveryRestrictions = null;
        updateDeliveryDateDisplay();
        return;
    }

    // Проверяем кеш
    if (cityDataCache[city]) {
        currentCityData = cityDataCache[city];
    } else {
    let { data, error } = await supabaseClient
        .from('prices')
        .select('form_name, polycarbonate_type, width, length, frame_description, price, snow_load, height, horizontal_ties, equipment') // Добавлены новые поля
        .eq('city_name', city)
        .limit(30000);

    if (error) {
        console.error('Ошибка при получении данных по городу:', error);
            // Показываем понятное сообщение пользователю
            showError("Не удалось загрузить данные для выбранного города. Проверьте подключение к интернету и попробуйте снова.", 'Ошибка загрузки');
        return;
    }

    if (!data || data.length === 0) {
        showWarning("Данные для выбранного города не найдены. Попробуйте другой город.", 'Данные не найдены');
        return; // Остановить выполнение функции
    }

        // Сохраняем в кеш
        cityDataCache[city] = data;
    currentCityData = data;
    }

    // 1. Обновляем выпадающий список поликарбоната
    const polycarbonateDropdown = document.getElementById('polycarbonate');
    polycarbonateDropdown.innerHTML = '<option value="" disabled selected>Выберите поликарбонат</option>';

    // Упорядочиваем поликарбонат в порядке: Стандарт 4 мм / Люкс 4 мм / Премиум 6 мм / Без поликарбоната
    const rawPolys = currentCityData.map(g => g.polycarbonate_type).filter(Boolean);
    const uniquePoly = [...new Set(rawPolys)];
    const preferredOrder = ["Стандарт 4 мм", "Люкс 4 мм", "Премиум 6 мм", "Без поликарбоната"];

    // Сначала добавляем по порядку, если есть
    const orderedPolys = preferredOrder.filter(poly => uniquePoly.includes(poly));

    // Добавляем остальные в конец (если есть непредусмотренные значения)
    const extraPolys = uniquePoly.filter(poly => !preferredOrder.includes(poly));
    orderedPolys.push(...extraPolys);

    // Добавляем упорядоченные варианты
    orderedPolys.forEach(poly => {
        const option = document.createElement('option');
        option.value = poly;
        option.textContent = poly;
        polycarbonateDropdown.appendChild(option);
    });

    // Устанавливаем "Стандарт 4 мм" по умолчанию, если доступно
    if (uniquePoly.includes("Стандарт 4 мм")) {
        polycarbonateDropdown.value = "Стандарт 4 мм";
    } else if (uniquePoly.length > 0) {
        polycarbonateDropdown.value = orderedPolys[0]; // Выбираем первый доступный вариант
    }

    // 2. Фильтруем формы на основе availableForms
    const formCategories = Object.keys(availableForms);
    const formsAvailable = formCategories.filter(formType =>
        currentCityData.some(item => availableForms[formType].some(form => normalizeString(item.form_name) === normalizeString(form.name)))
    );

    // Сортируем формы по приоритету
    formsAvailable.sort((a, b) => (formPriority[a] || 100) - (formPriority[b] || 100)); // Прочие формы получат низкий приоритет

    // 3. Обновляем выпадающий список форм теплиц
    const formDropdown = document.getElementById('form');
    formDropdown.innerHTML = '<option value="" disabled selected>Выберите форму</option>';

    formsAvailable.forEach(form => {
        if (form && form !== "Прочие") {
            const option = document.createElement('option');
            option.value = form;
            option.textContent = form;
            formDropdown.appendChild(option);
        }
    });

    // 4. Сбрасываем размеры и каркасы
    resetDropdown('width', 'Сначала выберите форму');
    resetDropdown('length', 'Сначала выберите ширину');
    resetDropdown('frame', 'Сначала выберите длину');
    resetDropdown('arcStep', 'Выберите шаг');

    // Сброс дополнительных опций
    resetAdditionalOptions();

    // Загружаем дату доставки для выбранного города
    await loadDeliveryDate(city);

    // Если форма заказа уже открыта — обновляем дату доставки в ней
    var orderCollapse = document.getElementById('order-collapse');
    if (orderCollapse && orderCollapse.classList.contains('open')) {
        populateOrderDeliveryDate();
    }
}

// Модалка «Параметры теплицы»: город из заказа. ВРЕМЯ ТЕСТОВ — при неизвестном городе подставляем fallback (поиск: EDIT_ORDER_FALLBACK).
var EDIT_ORDER_FALLBACK_CITIES = ['МСК', 'Москва', 'Санкт-Петербург'];

function isKnownCityForEditOrder(cityName) {
    var c = (cityName || '').trim();
    if (!c) return false;
    if (/тестов|test|рандом|random/i.test(c)) return false;
    if (citiesCache && Array.isArray(citiesCache) && citiesCache.length > 0) {
        return citiesCache.some(function (name) { return (name || '').trim() === c; });
    }
    return true;
}

function getEditOrderAddCity() {
    var defaultCity = EDIT_ORDER_FALLBACK_CITIES[0];
    if (editOrderEditingIndex != null && editOrderComposition[editOrderEditingIndex]) {
        var itemCity = editOrderComposition[editOrderEditingIndex].city;
        return isKnownCityForEditOrder(itemCity) ? (itemCity || defaultCity) : defaultCity;
    }
    var addr = document.getElementById('edit-order-address-part1');
    var v = addr ? addr.value.trim() : '';
    if (!v) return defaultCity;
    return isKnownCityForEditOrder(v) ? v : defaultCity;
}

/** Собрать options для расчёта из полей панели «Параметры теплицы» в модалке (допы, сборка, монтаж, доп. товары). */
function getEditOrderAddPanelOptions(polycarbonateValue) {
    var panel = document.getElementById('edit-order-add-item-panel');
    if (!panel) {
        return { bracing: false, groundHooks: false, assembly: false, onWood: false, onConcrete: false, deliveryPrice: 0, additionalProducts: [], selectedBeds: {}, bedsAssemblyEnabled: false, isWithoutPolycarbonate: false };
    }
    var bracingEl = panel.querySelector('#edit-order-add-bracing');
    var groundHooksEl = panel.querySelector('#edit-order-add-ground-hooks');
    var assemblyEl = panel.querySelector('#edit-order-add-assembly');
    var onWoodEl = panel.querySelector('#edit-order-add-on-wood');
    var onConcreteEl = panel.querySelector('#edit-order-add-on-concrete');
    var additionalProducts = [];
    var productItems = panel.querySelectorAll('.edit-order-add-product-item');
    for (var i = 0; i < productItems.length; i++) {
        var select = productItems[i].querySelector('select');
        var nameEl = productItems[i].querySelector('.edit-order-add-product-name');
        if (!select || !nameEl) continue;
        var quantity = parseInt(select.value, 10);
        if (quantity > 0) {
            var productName = (nameEl.textContent || '').trim();
            if (productName.toLowerCase().indexOf('перегородка') !== -1) continue;
            var productPrice = parseFloat(select.getAttribute('data-price'));
            if (!isNaN(productPrice) && productPrice > 0) {
                additionalProducts.push({ name: productName, cost: productPrice * quantity, quantity: quantity });
            }
        }
    }
    var polyNorm = (polycarbonateValue || '').toLowerCase().replace(/\s/g, '');
    return {
        bracing: bracingEl ? bracingEl.checked : false,
        groundHooks: groundHooksEl ? groundHooksEl.checked : false,
        assembly: assemblyEl ? assemblyEl.checked : false,
        onWood: onWoodEl ? onWoodEl.checked : false,
        onConcrete: onConcreteEl ? onConcreteEl.checked : false,
        onWoodPrice: onWoodEl ? parseFloat(onWoodEl.getAttribute('data-price')) || 0 : 0,
        onConcretePrice: onConcreteEl ? parseFloat(onConcreteEl.getAttribute('data-price')) || 0 : 0,
        deliveryPrice: 0,
        additionalProducts: additionalProducts,
        selectedBeds: {},
        bedsAssemblyEnabled: false,
        isWithoutPolycarbonate: polyNorm === 'безполикарбоната'
    };
}

/** Собрать опции панели для сохранения в позиции (19.2: предзаполнение при редактировании). */
function getEditOrderAddPanelOptionsForStorage() {
    var panel = document.getElementById('edit-order-add-item-panel');
    if (!panel) return { bracing: false, assembly: false, groundHooks: false, onWood: false, onConcrete: false, additionalProducts: [] };
    var bracingEl = panel.querySelector('#edit-order-add-bracing');
    var groundHooksEl = panel.querySelector('#edit-order-add-ground-hooks');
    var assemblyEl = panel.querySelector('#edit-order-add-assembly');
    var onWoodEl = panel.querySelector('#edit-order-add-on-wood');
    var onConcreteEl = panel.querySelector('#edit-order-add-on-concrete');
    var additionalProducts = [];
    panel.querySelectorAll('.edit-order-add-product-item').forEach(function (row) {
        var select = row.querySelector('select');
        var nameEl = row.querySelector('.edit-order-add-product-name');
        if (!select || !nameEl) return;
        var qty = parseInt(select.value, 10);
        if (qty <= 0) return;
        var id = (select.id || '').replace(/^edit-order-add-/, '').replace(/-qty$/, '');
        var price = parseFloat(select.getAttribute('data-price')) || 0;
        var cost = price * qty;
        additionalProducts.push({ id: id, name: (nameEl.textContent || '').trim(), quantity: qty, cost: cost });
    });
    return {
        bracing: bracingEl ? bracingEl.checked : false,
        assembly: assemblyEl ? assemblyEl.checked : false,
        groundHooks: groundHooksEl ? groundHooksEl.checked : false,
        onWood: onWoodEl ? onWoodEl.checked : false,
        onConcrete: onConcreteEl ? onConcreteEl.checked : false,
        additionalProducts: additionalProducts
    };
}

/** Подставить сохранённые опции в панель (19.2: при открытии «Изменить»). */
function setEditOrderAddPanelOptions(options) {
    if (!options) return;
    var panel = document.getElementById('edit-order-add-item-panel');
    if (!panel) return;
    var bracing = panel.querySelector('#edit-order-add-bracing');
    var groundHooks = panel.querySelector('#edit-order-add-ground-hooks');
    var assembly = panel.querySelector('#edit-order-add-assembly');
    var onWood = panel.querySelector('#edit-order-add-on-wood');
    var onConcrete = panel.querySelector('#edit-order-add-on-concrete');
    if (bracing) bracing.checked = !!options.bracing;
    if (groundHooks) groundHooks.checked = !!options.groundHooks;
    if (assembly) assembly.checked = !!options.assembly;
    if (onWood) onWood.checked = !!options.onWood;
    if (onConcrete) onConcrete.checked = !!options.onConcrete;
    var products = options.additionalProducts;
    if (Array.isArray(products) && products.length > 0) {
        products.forEach(function (p) {
            var id = (p.id || '').toString();
            if (!id) return;
            var sel = panel.querySelector('#edit-order-add-' + id + '-qty');
            if (sel) sel.value = String(Math.max(0, parseInt(p.quantity, 10) || 0));
        });
    }
}

/** Данные цен по городу для модалки. При ошибке или пустом ответе возвращает { data: null }. */
async function getCityDataForModal(cityName) {
    try {
        var city = (cityName || '').trim();
        if (city) {
            if (cityDataCache[city]) return { data: cityDataCache[city], usedFallback: false };
            var res = await supabaseClient.from('prices').select('form_name, polycarbonate_type, width, length, frame_description, price, snow_load, height, horizontal_ties, equipment').eq('city_name', city).limit(30000);
            if (!res.error && res.data && res.data.length > 0) {
                cityDataCache[city] = res.data;
                return { data: res.data, usedFallback: false };
            }
        }
        var toTry = EDIT_ORDER_FALLBACK_CITIES.filter(function (c) { return c && c !== city; });
        for (var j = 0; j < toTry.length; j++) {
            var fallbackCity = toTry[j];
            if (cityDataCache[fallbackCity]) return { data: cityDataCache[fallbackCity], usedFallback: true };
            var resF = await supabaseClient.from('prices').select('form_name, polycarbonate_type, width, length, frame_description, price, snow_load, height, horizontal_ties, equipment').eq('city_name', fallbackCity).limit(30000);
            if (!resF.error && resF.data && resF.data.length > 0) {
                cityDataCache[fallbackCity] = resF.data;
                return { data: resF.data, usedFallback: true };
            }
        }
        var anyRes = await supabaseClient.from('prices').select('city_name').limit(1);
        if (anyRes.data && anyRes.data[0] && anyRes.data[0].city_name) {
            var firstCity = anyRes.data[0].city_name;
            if (cityDataCache[firstCity]) return { data: cityDataCache[firstCity], usedFallback: true };
            var resAny = await supabaseClient.from('prices').select('form_name, polycarbonate_type, width, length, frame_description, price, snow_load, height, horizontal_ties, equipment').eq('city_name', firstCity).limit(30000);
            if (!resAny.error && resAny.data && resAny.data.length > 0) {
                cityDataCache[firstCity] = resAny.data;
                return { data: resAny.data, usedFallback: true };
            }
        }
        return { data: null, usedFallback: false };
    } catch (e) {
        if (typeof console !== 'undefined' && console.error) console.error('getCityDataForModal:', e);
        return { data: null, usedFallback: false };
    }
}

/**
 * Единая точка входа расчёта теплицы без привязки к DOM (Этап 5).
 * Загружает данные по городу (кэш/getCityDataForModal), вызывает calculateGreenhousePriceCore.
 * @param {string} cityName - название города
 * @param {string} form - форма (модель)
 * @param {number} width - ширина, м
 * @param {number} length - длина, м
 * @param {string} frame - каркас
 * @param {string} polycarbonate - поликарбонат
 * @param {number} arcStep - шаг дуг (1 или 0.65)
 * @param {Object} options - { bracing, groundHooks, assembly, onWood, onConcrete, onWoodPrice, onConcretePrice, deliveryPrice, additionalProducts, selectedBeds, bedsAssemblyEnabled, isWithoutPolycarbonate, address }
 * @returns {Promise<{ ok: true, data: Object, cityData: Array }|{ ok: false, error: string }>}
 */
async function calculateGreenhousePrice(cityName, form, width, length, frame, polycarbonate, arcStep, options) {
    var city = (cityName || '').trim();
    var opts = options || {};
    var result = await getCityDataForModal(city || '');
    var cityData = result && result.data;
    if (!cityData || cityData.length === 0) {
        return { ok: false, error: 'Нет данных по городу. Укажите город из списка или введите в адресе.' };
    }
    var params = {
        city: city,
        form: form,
        width: width,
        length: length,
        frame: frame,
        polycarbonate: polycarbonate,
        arcStep: arcStep,
        options: opts
    };
    var out = calculateGreenhousePriceCore(cityData, params);
    if (!out.ok) return out;
    return { ok: true, data: out.data, cityData: cityData };
}

// Функция обработки изменения формы
function onFormChange() {
    const form = document.getElementById("form").value;

    const widthSelect = document.getElementById("width");
    widthSelect.innerHTML = '<option value="" disabled selected>Выберите ширину</option>';

    if (!form) {
        return;
    }

    // Фильтруем данные по выбранной форме на основе availableForms
    const filteredData = currentCityData.filter(item => {
        const category = getFormCategory(item.form_name);
        return category === form;
    });

    // Проверка на пустые данные
    if (filteredData.length === 0) {
        showWarning("Теплица с указанными параметрами не найдена. Попробуйте выбрать другие параметры.", 'Теплица не найдена');
        return;
    }

    // Получаем уникальные значения ширины
    const uniqueWidths = [...new Set(filteredData.map(item => item.width))].sort((a, b) => a - b);

    // Заполняем выпадающий список ширины
    uniqueWidths.forEach(width => {
        widthSelect.innerHTML += `<option value="${width}">${formatPrice(width)} м</option>`;
    });

    // Сброс длины и каркасов
    resetDropdown('length', 'Сначала выберите ширину');
    resetDropdown('frame', 'Сначала выберите длину');
    resetDropdown('arcStep', 'Выберите шаг');

    // Сброс дополнительных опций
    resetAdditionalOptions();
}

// Функция обработки изменения ширины
function onWidthChange() {
    const form = document.getElementById("form").value;
    const width = parseFloat(document.getElementById("width").value);

    const lengthSelect = document.getElementById("length");
    lengthSelect.innerHTML = '<option value="" disabled selected>Выберите длину</option>';

    if (isNaN(width)) {
        return;
    }

    // Фильтруем данные по форме и ширине
    const filteredData = currentCityData.filter(item => {
        const category = getFormCategory(item.form_name);
        return category === form && parseFloat(item.width) === width;
    });

    // Проверка на пустые данные
    if (filteredData.length === 0) {
        showWarning("Теплица с указанными параметрами не найдена. Попробуйте выбрать другие параметры.", 'Теплица не найдена');
        return;
    }

    // Получаем уникальные значения длины
    const uniqueLengths = [...new Set(filteredData.map(item => item.length))].sort((a, b) => a - b);

    // Заполняем выпадающий список длины
    uniqueLengths.forEach(length => {
        lengthSelect.innerHTML += `<option value="${length}">${formatPrice(length)} м</option>`;
    });

    // Сброс каркаса и шага дуг
    resetDropdown('frame', 'Сначала выберите длину');
    resetDropdown('arcStep', 'Выберите шаг');

    // Сброс нестандартной длины
    var oddCb = document.getElementById('odd-length');
    if (oddCb) { oddCb.checked = false; oddCb.disabled = true; }

    // Сброс дополнительных опций
    resetAdditionalOptions();
}

// Минимальная длина, с которой доступна нестандартная (на 1 м короче): 4→3, 6→5, 12→11 и т.д.
var ODD_LENGTH_MIN_BILLING = 4;

/** С главной панели: фактическая длина для КП/заказа и длина для расчёта цены. */
function getEffectiveLengthFromMainPanel() {
    var lengthEl = document.getElementById('length');
    var oddEl = document.getElementById('odd-length');
    var billing = lengthEl && lengthEl.value ? parseFloat(lengthEl.value) : NaN;
    if (isNaN(billing)) return { effective: NaN, billing: NaN };
    var useOdd = oddEl && oddEl.checked && billing >= ODD_LENGTH_MIN_BILLING;
    return { effective: useOdd ? billing - 1 : billing, billing: billing };
}

// Функция обработки изменения длины
function onLengthChange() {
    const form = document.getElementById("form").value;
    const width = parseFloat(document.getElementById("width").value);
    const length = parseFloat(document.getElementById("length").value);

    const frameSelect = document.getElementById("frame");
    frameSelect.innerHTML = '<option value="" disabled selected>Выберите каркас</option>';

    var oddCheckbox = document.getElementById('odd-length');
    if (oddCheckbox) {
        if (!isNaN(length) && length >= ODD_LENGTH_MIN_BILLING) {
            oddCheckbox.disabled = false;
        } else {
            oddCheckbox.checked = false;
            oddCheckbox.disabled = true;
        }
    }

    if (isNaN(length)) {
        return;
    }

    // Фильтруем данные по форме, ширине и длине
    const filteredData = currentCityData.filter(item => {
        const category = getFormCategory(item.form_name);
        return category === form && parseFloat(item.width) === width && parseFloat(item.length) === length;
    });

    // Проверка на пустые данные
    if (filteredData.length === 0) {
        showWarning("Теплица с указанными параметрами не найдена. Попробуйте выбрать другие параметры.", 'Теплица не найдена');
        return;
    }

    // Задаём порядок сортировки каркасов
    const frameOrder = ["20х20", "40х20", "20х20+20х20", "40х20+20х20", "40х20+40х20"];

    // Получаем уникальные значения каркаса
    let uniqueFrames = [...new Set(filteredData.map(item => {
        // Отладочное логирование: вывод названия и исходного описания

        // Нормализуем описание:
        // 1. Удаляем слово "двойная" (с любыми пробелами после него)
        // 2. Удаляем "оцинкованная труба" (без учета регистра)
        // 3. Удаляем символы "мм"
        let cleanDescription = item.frame_description
            .replace(/двойная\s*/gi, "")  // добавлено удаление слова "двойная"
            .replace(/оцинкованная труба/gi, "")
            .replace(/мм/gi, "")
            .trim();

        // Убираем лишние пробелы вокруг знака "+"
        cleanDescription = cleanDescription.replace(/\s*\+\s*/g, "+");

        // Если строка содержит "+", значит, это составной каркас – возвращаем её целиком
        if (cleanDescription.includes('+')) {
            return cleanDescription;
        }

        // Если нет знака "+", ищем простое совпадение для "20х20" или "40х20"
        const matches = cleanDescription.match(/(20х20|40х20)/gi);
        if (matches) {
        }

        return matches ? matches.join(",") : cleanDescription;
    }))];

    uniqueFrames = [...new Set(uniqueFrames.flatMap(f => f.split(",")))];

    uniqueFrames.sort((a, b) => {
        const iA = frameOrder.indexOf(a.trim());
        const iB = frameOrder.indexOf(b.trim());
        if (iA === -1 && iB === -1) {
            return a.localeCompare(b);
        } else if (iA === -1) {
            return 1;
        } else if (iB === -1) {
            return -1;
        }
        return iA - iB;
    });

    uniqueFrames.forEach(frame => {
        frameSelect.innerHTML += `<option value="${frame.trim()}">${frame.trim()}</option>`;
    });

    // Сброс шага дуг
    resetDropdown('arcStep', 'Выберите шаг');

    // Сброс дополнительных опций
    resetAdditionalOptions();
    
    // Предварительное обновление блока подарков (если все параметры выбраны)
    updateGiftsBlockPreview();
}

// Функция обработки изменения каркаса
function onFrameChange() {
    // Здесь вы можете добавить дополнительную логику, если требуется
    // Например, обновление шага дуг на основе выбранного каркаса
    resetDropdown('arcStep', 'Выберите шаг');
    resetAdditionalOptions();
    
    // Предварительное обновление блока подарков (если все параметры выбраны)
    updateGiftsBlockPreview();
}

// Функция сброса выпадающих списков
function resetDropdown(elementId, placeholderText) {
    const dropdown = document.getElementById(elementId);
    if (dropdown) {
        if (elementId === 'arcStep') {
            dropdown.value = "1"; // Устанавливаем значение по умолчанию
        } else if (elementId === 'polycarbonate') {
            // Для поликарбоната устанавливаем "Стандарт 4 мм", если доступно
            const options = dropdown.options;
            let standardFound = false;
            for (let i = 0; i < options.length; i++) {
                if (normalizeString(options[i].text) === normalizeString("Стандарт 4 мм")) {
                    dropdown.selectedIndex = i;
                    standardFound = true;
                    break;
                }
            }
            if (!standardFound && options.length > 1) {
                dropdown.selectedIndex = 1; // Выбираем первый доступный вариант, если "Стандарт 4 мм" не найден
            }
        } else if (elementId === 'city') {
            // ВАЖНО: Для города НЕ очищаем список, только сбрасываем выбор
            // Если список пустой, восстанавливаем из кеша
            if (dropdown.options.length <= 1 && citiesCache && citiesCache.length > 0) {
                // Восстанавливаем список из кеша
                dropdown.innerHTML = '<option value="" disabled selected>Выберите город</option>';
                citiesCache.forEach(city => {
                    dropdown.innerHTML += `<option value="${city}">${city}</option>`;
                });
            } else {
                // Просто сбрасываем выбор на placeholder
                dropdown.value = "";
                // Убеждаемся, что есть placeholder
                if (dropdown.options.length === 0 || dropdown.options[0].value !== "") {
                    dropdown.innerHTML = `<option value="" disabled selected>${placeholderText}</option>`;
                } else {
                    dropdown.selectedIndex = 0;
                }
            }
        } else {
            dropdown.innerHTML = `<option value="" disabled selected>${placeholderText}</option>`;
        }
    }
}

// Функция сброса дополнительных опций
function resetAdditionalOptions() {
    // Сбрасываем чекбоксы дополнительных услуг
    const additionalServices = document.querySelectorAll('.additional-services input[type="checkbox"]');
    additionalServices.forEach(checkbox => {
        if (checkbox) {
            checkbox.checked = false;
        }
    });

    // Сбрасываем select'ы для дополнительных товаров (количество = 0)
    const additionalProductSelects = document.querySelectorAll('.additional-products select');
    additionalProductSelects.forEach(select => {
        if (select) {
            select.value = "0";
        }
    });

    // Сбрасываем чекбокс сборки теплицы
    const assemblyCheckbox = document.getElementById('assembly');
    if (assemblyCheckbox) {
        assemblyCheckbox.checked = false;
    }
}

// Функция получения категории сборки на основе формы и ширины
function getAssemblyCategory(form, width) {
    return `${width}М`;
}

// Функция расчёта стоимости сборки
function calculateAssemblyCost(form, assemblyCategory, length) {
    if (!form || !assemblyPrices[form] || !assemblyPrices[form][assemblyCategory] || !assemblyPrices[form][assemblyCategory][length]) {
        return 0;
    }
    const price = assemblyPrices[form][assemblyCategory][length];
    return price;
}

/**
 * Ядро расчёта стоимости теплицы без DOM (для переиспользования на главной и в модалке).
 * @param {Array} cityData - данные цен по городу (как currentCityData)
 * @param {Object} params - { city, form, width, length, frame, polycarbonate, arcStep, options }
 * @param {Object} params.options - { bracing, groundHooks, assembly, onWood, onConcrete, onWoodPrice, onConcretePrice, deliveryPrice, additionalProducts: [{name, quantity, cost}], selectedBeds: {}, bedsAssemblyEnabled, isWithoutPolycarbonate, address }
 * @returns {{ ok: true, data: Object }|{ ok: false, error: string }}
 */
function calculateGreenhousePriceCore(cityData, params) {
    var city = params.city;
    var form = params.form;
    var width = params.width;
    var length = params.length;
    var frame = params.frame;
    var polycarbonate = params.polycarbonate;
    var arcStep = params.arcStep;
    var opts = params.options || {};
    var bracingChecked = !!opts.bracing;
    var groundHooksChecked = !!opts.groundHooks;
    var assemblyChecked = !!opts.assembly;
    var onWoodChecked = !!opts.onWood;
    var onConcreteChecked = !!opts.onConcrete;
    var onWoodPrice = opts.onWoodPrice || 0;
    var onConcretePrice = opts.onConcretePrice || 0;
    var deliveryPrice = opts.deliveryPrice != null ? opts.deliveryPrice : 0;
    var additionalProducts = opts.additionalProducts || [];
    var selectedBeds = opts.selectedBeds || {};
    var bedsAssemblyEnabled = !!opts.bedsAssemblyEnabled;
    var isWithoutPolycarbonate = !!opts.isWithoutPolycarbonate;
    var address = opts.address || '';

    var selectedEntry = cityData.find(function (item) {
        return (
            getFormCategory(item.form_name) === form &&
            parseFloat(item.width) === width &&
            parseFloat(item.length) === length &&
            normalizeString((item.frame_description || '').replace(/двойная\s*/gi, '')).includes(normalizeString(frame)) &&
            normalizeString(item.polycarbonate_type) === normalizeString(polycarbonate)
        );
    });

    if (!selectedEntry) {
        return { ok: false, error: 'Теплица с заданными параметрами не найдена.' };
    }

    var basePrice = selectedEntry.price;
    var basePriceText = 'Стоимость с учетом скидки - ' + formatPrice(basePrice) + ' рублей';
    var originalSnowLoadText = selectedEntry.snow_load || '0 кг/м2';
    var rawSnowLoad = originalSnowLoadText.match(/\d+(\.\d+)?/);
    var snowLoadNum = rawSnowLoad ? parseFloat(rawSnowLoad[0]) : 0;
    if (isNaN(snowLoadNum)) snowLoadNum = 0;

    if (arcStep === 0.65) {
        var baseEntry = cityData.find(function (item) {
            return (
                getFormCategory(item.form_name) === form &&
                parseFloat(item.width) === width &&
                parseFloat(item.length) === length &&
                normalizeString(item.frame_description || '').includes(normalizeString(frame)) &&
                (normalizeString(item.polycarbonate_type) === normalizeString('стандарт4мм') ||
                    normalizeString(item.polycarbonate_type) === normalizeString('стандарт 4мм'))
            );
        });
        if (!baseEntry) {
            return { ok: false, error: 'Не найдена базовая цена для покрытия "Стандарт 4 мм".' };
        }
        var basePriceStandard = baseEntry.price;
        basePrice += 0.25 * basePriceStandard;
        basePrice = Math.ceil(basePrice / 10) * 10;
        basePriceText = 'Стоимость с учетом скидки - ' + formatPrice(basePrice) + ' рублей';
        snowLoadNum = Math.round(snowLoadNum * 1.25);
    }

    var polyStr = normalizeString(polycarbonate);
    if (polyStr === 'люкс4мм' || polyStr === 'люкс4 мм') snowLoadNum = Math.round(snowLoadNum * 1.1);
    if (polyStr === 'премиум6мм' || polyStr === 'премиум6 мм') snowLoadNum = Math.round(snowLoadNum * 1.2);
    var snowLoadFinalText = snowLoadNum + ' кг/м2';

    var assemblyCost = 0;
    var foundationCost = 0;
    var additionalProductsCost = 0;
    var assemblyText = '';
    var foundationText = '';
    var bedsAssemblyText = '';
    var additionalProductsText = '';

    if (bracingChecked) {
        var bracingPrice = additionalServicesData['Брус'] && additionalServicesData['Брус'].price_by_length && additionalServicesData['Брус'].price_by_length[length];
        if (bracingPrice != null) {
            foundationCost += bracingPrice;
            foundationText += '\nОснование из бруса - ' + formatPrice(bracingPrice) + ' рублей';
        } else {
            return { ok: false, error: 'Не найдена стоимость бруса для длины ' + length + ' м.' };
        }
    }

    if (groundHooksChecked) {
        var quantityData = bracingChecked
            ? (additionalServicesData['Штыри'] && additionalServicesData['Штыри'].quantity_by_length && additionalServicesData['Штыри'].quantity_by_length['with_bracing'])
            : (additionalServicesData['Штыри'] && additionalServicesData['Штыри'].quantity_by_length && additionalServicesData['Штыри'].quantity_by_length['without_bracing']);
        var stakesQuantity = quantityData && quantityData[length];
        if (stakesQuantity != null) {
            var stakesCost = stakesQuantity * (additionalServicesData['Штыри'] && additionalServicesData['Штыри'].price_per_unit || 0);
            foundationCost += stakesCost;
            foundationText += '\nГрунтозацепы ' + stakesQuantity + ' шт - ' + formatPrice(stakesCost) + ' рублей';
        } else {
            return { ok: false, error: 'Не найдена информация о количестве штырей для длины ' + length + ' м.' };
        }
    }

    if (assemblyChecked && !isWithoutPolycarbonate) {
        var assemblyCategory = getAssemblyCategory(form, width);
        if (assemblyCategory) {
            var assemblyCostCalculated = calculateAssemblyCost(form, assemblyCategory, length);
            if (assemblyCostCalculated > 0) {
                assemblyCost += assemblyCostCalculated;
                assemblyText += '\nСборка и установка - ' + formatPrice(assemblyCostCalculated) + ' рублей';
            } else {
                return { ok: false, error: 'Не найдена стоимость сборки для выбранной комбинации.' };
            }
        } else {
            return { ok: false, error: 'Категория сборки не определена.' };
        }
    }

    if (onWoodChecked && onWoodPrice) {
        foundationCost += onWoodPrice;
        foundationText += '\nМонтаж на брус клиента - ' + formatPrice(onWoodPrice) + ' рублей';
    }
    if (onConcreteChecked && onConcretePrice) {
        foundationCost += onConcretePrice;
        foundationText += '\nМонтаж на бетон клиента - ' + formatPrice(onConcretePrice) + ' рублей';
    }

    for (var i = 0; i < additionalProducts.length; i++) {
        var p = additionalProducts[i];
        additionalProductsCost += (p.cost != null ? p.cost : (p.quantity || 0) * (p.pricePerUnit || 0));
    }

    if (Object.keys(selectedBeds).length > 0 && typeof BEDS_DATA !== 'undefined') {
        var bedsText = '';
        Object.keys(selectedBeds).forEach(function (bedId) {
            var bed = BEDS_DATA.find(function (b) { return b.id === bedId; });
            if (bed && selectedBeds[bedId] > 0 && bed.price > 0) {
                var totalCost = bed.price * selectedBeds[bedId];
                additionalProductsCost += totalCost;
                var heightText = bed.height === 19 ? 'низкие' : 'высокие';
                bedsText += selectedBeds[bedId] + ' грядка ' + heightText + ' ' + bed.length + ' м: ширина ' + bed.width + ' м - ' + formatPrice(totalCost) + ' рублей\n';
            }
        });
        if (bedsText) additionalProductsText += (additionalProductsText ? '\n\n' : '') + bedsText.trim();
        if (bedsAssemblyEnabled && typeof calculateBedsAssemblyCost === 'function') {
            var bedsAssemblyCost = calculateBedsAssemblyCost(selectedBeds);
            additionalProductsCost += bedsAssemblyCost;
            if (bedsAssemblyCost > 0) bedsAssemblyText = 'Сборка грядок - ' + formatPrice(bedsAssemblyCost) + ' рублей';
        }
    }

    if (additionalProducts.length > 0) {
        var productsText = additionalProducts.map(function (product) {
            var q = product.quantity || 1;
            var c = product.cost != null ? product.cost : (product.pricePerUnit || 0) * q;
            return (q > 1 ? (product.name || '') + ' x ' + q + ' - ' : (product.name || '') + ' - ') + formatPrice(c) + ' рублей';
        }).join('\n');
        additionalProductsText = (additionalProductsText ? additionalProductsText + '\n\n' : '') + productsText;
    }

    var finalTotalPrice = basePrice + assemblyCost + foundationCost + additionalProductsCost + deliveryPrice;
    finalTotalPrice = Math.ceil(finalTotalPrice / 10) * 10;

    var result = {
        city: city,
        form: form,
        model: selectedEntry.form_name,
        width: width,
        length: length,
        height: selectedEntry.height || '',
        frame: frame,
        arcStep: arcStep,
        polycarbonate: polycarbonate,
        snowLoad: snowLoadFinalText,
        horizontalTies: selectedEntry.horizontal_ties || '',
        equipment: selectedEntry.equipment || '',
        basePrice: basePrice,
        assemblyCost: assemblyCost,
        foundationCost: foundationCost,
        additionalProductsCost: additionalProductsCost,
        deliveryPrice: deliveryPrice,
        finalTotalPrice: finalTotalPrice,
        assemblyText: assemblyText,
        foundationText: foundationText,
        bedsAssemblyText: bedsAssemblyText,
        additionalProductsText: additionalProductsText,
        address: address
    };
    return { ok: true, data: result };
}

// Переменная для debounce calculateGreenhouseCost
let calculateDebounceTimer = null;

// Переменная для debounce calculateDelivery (защита от массовых запросов к Яндекс API)
let calculateDeliveryDebounceTimer = null;
let isCalculatingDelivery = false; // Флаг для предотвращения параллельных запросов

async function calculateGreenhouseCost(event = null) {
    const city = document.getElementById("city").value.trim();
    const form = document.getElementById("form").value.trim();
    const width = parseFloat(document.getElementById("width").value);
    const lengthFromSelect = parseFloat(document.getElementById("length").value);
    const frame = document.getElementById("frame").value.trim();
    const polycarbonate = document.getElementById("polycarbonate").value.trim();
    const arcStep = parseFloat(document.getElementById("arcStep").value);
    var lenPair = getEffectiveLengthFromMainPanel();
    var billingLength = isNaN(lengthFromSelect) ? lengthFromSelect : lenPair.billing;
    var effectiveLength = isNaN(lenPair.effective) ? lengthFromSelect : lenPair.effective;

    // Проверка на заполнение всех обязательных полей
    const isFormComplete =
        city && form && !isNaN(width) && !isNaN(billingLength) && frame && polycarbonate && !isNaN(arcStep);

    // Если поля не заполнены, проверяем изменение поликарбоната
    const isPolycarbonateChange =
        event && event.target && event.target.id === "polycarbonate";

    if (!isFormComplete) {
        if (isPolycarbonateChange) {
            return; // Не показываем alert при изменении поликарбоната
        }
        // Не показываем alert при каждом изменении - только если это явный вызов (кнопка)
        if (event && event.type === 'click') {
        showWarning("Пожалуйста, заполните все обязательные поля.", 'Заполните поля');
        }
        return;
    }
    
    // Debounce для оптимизации - не пересчитываем при каждом изменении
    if (calculateDebounceTimer) {
        clearTimeout(calculateDebounceTimer);
    }
    
    // Если это клик по кнопке - выполняем сразу, иначе с задержкой 300ms
    const delay = (event && event.type === 'click') ? 0 : 300;
    
    calculateDebounceTimer = setTimeout(async () => {
        await performCalculation(city, form, width, billingLength, frame, polycarbonate, arcStep, effectiveLength);
    }, delay);
}

// Вынесена логика расчета в отдельную функцию для переиспользования. Единая точка входа — calculateGreenhousePrice (без привязки к DOM главной).
// length — для расчёта цены (чётная); effectiveLength — для КП и заказа (может быть 3,5,7,9).
async function performCalculation(city, form, width, length, frame, polycarbonate, arcStep, effectiveLength) {
    var bracingCheckbox = document.getElementById('bracing');
    var groundHooksCheckbox = document.getElementById('ground-hooks');
    var assemblyCheckbox = document.getElementById('assembly');
    var onWoodCheckbox = document.getElementById('on-wood');
    var onConcreteCheckbox = document.getElementById('on-concrete');
    var polyEl = document.getElementById('polycarbonate');
    var addressEl = document.getElementById('address');
    var polycarbonateValue = polyEl ? polyEl.value.trim() : '';
    var polyNormalized = polycarbonateValue.replace(/\s+/g, '').toLowerCase();
    var isWithoutPolycarbonate = polyNormalized === 'безполикарбоната';

    var additionalProducts = [];
    var productSelects = document.querySelectorAll('.additional-products .product-item select');
    for (var s = 0; s < productSelects.length; s++) {
        var select = productSelects[s];
        var quantity = parseInt(select.value, 10);
        if (quantity > 0) {
            var productNameElement = select.parentElement ? select.parentElement.querySelector('.product-name') : null;
            var productName = productNameElement ? productNameElement.textContent.trim() : '';
            if (productName.toLowerCase().indexOf('перегородка') !== -1) continue;
            var productPrice = parseFloat(select.getAttribute('data-price'));
            if (!isNaN(productPrice) && productPrice > 0) {
                additionalProducts.push({ name: productName, cost: productPrice * quantity, quantity: quantity });
            }
        }
    }

    var selectedBeds = {};
    try {
        selectedBeds = JSON.parse(localStorage.getItem('selectedBeds') || '{}');
    } catch (e) {}
    var bedsAssemblyEnabled = localStorage.getItem('bedsAssemblyEnabled') === 'true';

    var options = {
        bracing: bracingCheckbox ? bracingCheckbox.checked : false,
        groundHooks: groundHooksCheckbox ? groundHooksCheckbox.checked : false,
        assembly: assemblyCheckbox ? assemblyCheckbox.checked : false,
        onWood: onWoodCheckbox ? onWoodCheckbox.checked : false,
        onConcrete: onConcreteCheckbox ? onConcreteCheckbox.checked : false,
        onWoodPrice: onWoodCheckbox ? parseFloat(onWoodCheckbox.getAttribute('data-price')) || 0 : 0,
        onConcretePrice: onConcreteCheckbox ? parseFloat(onConcreteCheckbox.getAttribute('data-price')) || 0 : 0,
        deliveryPrice: deliveryCost,
        additionalProducts: additionalProducts,
        selectedBeds: selectedBeds,
        bedsAssemblyEnabled: bedsAssemblyEnabled,
        isWithoutPolycarbonate: isWithoutPolycarbonate,
        address: addressEl ? (addressEl.value || '').trim() : ''
    };

    var out = await calculateGreenhousePrice(city, form, width, length, frame, polycarbonate, arcStep, options);
    if (!out.ok) {
        showWarning(out.error || 'Ошибка расчёта.', 'Теплица не найдена');
        return;
    }
    if (out.cityData) currentCityData = out.cityData;

    var data = out.data;
    if (effectiveLength != null && !isNaN(effectiveLength) && effectiveLength !== length) {
        data.length = effectiveLength;
    }
    var selectedEntry = currentCityData.find(function (item) {
        return getFormCategory(item.form_name) === form && parseFloat(item.width) === width &&
            parseFloat(item.length) === length && normalizeString((item.frame_description || '').replace(/двойная\s*/gi, '')).includes(normalizeString(frame)) &&
            normalizeString(item.polycarbonate_type) === normalizeString(polycarbonate);
    });

    lastCalculatedPrice = data.finalTotalPrice;
    lastCalculation = data;

    var displayLength = (effectiveLength != null && !isNaN(effectiveLength)) ? effectiveLength : length;
    await generateCommercialOffer(data.basePrice, data.assemblyCost, data.foundationCost, additionalProducts, data.additionalProductsCost, data.deliveryPrice, data.finalTotalPrice, selectedEntry || {}, 'Стоимость с учетом скидки - ' + formatPrice(data.basePrice) + ' рублей', data.assemblyText, data.foundationText, data.bedsAssemblyText, data.additionalProductsText, data.snowLoad || '', displayLength);
    await generateShortOffer(data.finalTotalPrice, selectedEntry || {}, displayLength);
    var giftTotal = (typeof orderCart !== 'undefined' && orderCart.length > 0 && typeof getOrderCartTotal === 'function') ? getOrderCartTotal() : data.finalTotalPrice;
    updateGiftsBlock(giftTotal);
    var savedGifts = {};
    try {
        savedGifts = JSON.parse(localStorage.getItem('selectedGifts') || '{}');
    } catch (e) {}
    if (Object.keys(savedGifts).length > 0) {
        updateCommercialOffersWithGifts(savedGifts);
    }
    setOfferTab('short');
    updateOrderCartUI();
}

async function calculateDelivery() {
    // Защита от параллельных запросов
    if (isCalculatingDelivery) {
        return; // Уже идет расчет, пропускаем
    }

    const addressInput = document.getElementById("address");
    const address = addressInput.value.trim().toLowerCase();

    if (!address) {
        document.getElementById('result').innerText = "Введите адрес!";
        return;
    }

    // Устанавливаем флаг, что идет расчет
    isCalculatingDelivery = true;

    if (typeof ymaps === 'undefined') {
        isCalculatingDelivery = false;
        document.getElementById('result').innerText = "Яндекс.Карты недоступны. Проверьте интернет и перезагрузите страницу.";
        return;
    }

    try {
        const res = await ymaps.geocode(address, { results: 1 });
        const geoObject = res.geoObjects.get(0);

        if (!geoObject) {
            document.getElementById('result').innerText = "Адрес не найден!";
            return;
        }

        // Извлекаем населённые пункты и административные области (нижний регистр)
        let localities = geoObject.getLocalities().map(loc => loc.toLowerCase());
        let administrativeAreas = geoObject.getAdministrativeAreas().map(area => area.toLowerCase());

        if (!isAddressInDeliveryRegionByLocality(localities, administrativeAreas)) {
            document.getElementById('result').innerText = "Доставка в этот регион не осуществляется.";
            return;
        }

        const coords = geoObject.geometry.getCoordinates();
        const destinationLat = coords[0];
        const destinationLon = coords[1];

        let cityDistances = [];

// Шаг 1: Вычисляем прямые расстояния до всех городов
citiesForMap.forEach(city => {
    const geoDistance = ymaps.coordSystem.geo.getDistance(city.coords, [destinationLat, destinationLon]) / 1000; // расстояние в км
    cityDistances.push({ city: city, geoDistance: geoDistance });
});

// Сортируем города по прямому расстоянию и берём топ-5 ближайших
cityDistances.sort((a, b) => a.geoDistance - b.geoDistance);
const topCities = cityDistances.slice(0, 5); // Берём 5 ближайших городов

// Шаг 2: Теперь строим маршруты для этих 5 городов ПАРАЛЛЕЛЬНО и выбираем наименьший
let nearestCity = null;
let minRouteDistance = Infinity;

// Делаем запросы параллельно вместо последовательно для ускорения
const routePromises = topCities.map(async (entry) => {
    try {
        const route = await ymaps.route([entry.city.coords, [destinationLat, destinationLon]]);
        const routeDistance = route.getLength() / 1000; // расстояние по дорогам в км
        return { city: entry.city, distance: routeDistance, route: route };
    } catch (error) {
        // Маршрут для части складов может не строиться (ограничения API) — используем успешные
        if (DEBUG) console.warn("Маршрут для", entry.city.name, "не построен, берём другие склады:", error?.message || error);
        return null;
    }
});

// Ждем все запросы параллельно
const routeResults = await Promise.all(routePromises);

// Находим ближайший город
for (const result of routeResults) {
    if (result && result.distance < minRouteDistance) {
        minRouteDistance = result.distance;
        nearestCity = result.city;
    }
}

// Проверяем, нашёлся ли ближайший город
if (!nearestCity) {
    document.getElementById('result').innerText = "Ошибка: ближайший город не найден.";
    return;
}

        if (mapInstance) mapInstance.setCenter(nearestCity.coords, 7);

        // Автоматически установить найденный город в выпадающем списке "Город"
        // Используем нормализованное сравнение для поиска правильного названия
        const cityDropdown = document.getElementById('city');
        const foundCityName = findCityInDropdown(nearestCity.name);
        
        if (foundCityName) {
            cityDropdown.value = foundCityName;
            await onCityChange(); // Ждем загрузки данных города, включая дату доставки
        } else {
            // Если не найдено, пытаемся установить напрямую
            cityDropdown.value = nearestCity.name;
            // Загружаем дату доставки для найденного города (даже если он не в списке)
            await loadDeliveryDate(nearestCity.name);
            // Пробуем снова через небольшую задержку (на случай, если список ещё загружается)
            setTimeout(async () => {
                const foundAfterDelay = findCityInDropdown(nearestCity.name);
                if (foundAfterDelay) {
                    cityDropdown.value = foundAfterDelay;
                    await onCityChange();
                }
            }, 300);
        }

        if (mapInstance && currentRoute) {
            mapInstance.geoObjects.remove(currentRoute);
        }

        try {
            const route = await ymaps.route([nearestCity.coords, [destinationLat, destinationLon]]);
            currentRoute = route;
            if (mapInstance) mapInstance.geoObjects.add(route);

            const distanceInKm = route.getLength() / 1000;
            const distanceFromBoundary = Math.max(distanceInKm - nearestCity.boundaryDistance, 0);
            const rate = nearestCity.pricePerKm ?? 50; // тариф руб/км от склада (один тариф — всегда как со сборкой)
            const cost = Math.max(1000, rate * distanceFromBoundary);

            const roundedCost = Math.ceil(cost / 50) * 50;

            deliveryCost = roundedCost; // сохраняем стоимость доставки в глобальной переменной

            const deliveryDate = await loadDeliveryDate(nearestCity.name);
            
            var costText = '<div class="delivery-result-cost">Стоимость доставки: ' + formatPrice(roundedCost) + ' рублей (' + nearestCity.name + ')</div>';
            var dateData = getDeliveryDateBlockForUI();
            document.getElementById('result').innerHTML = renderDeliveryResultBlock(costText, dateData);
        } catch (routeError) {
            document.getElementById('result').innerText = "Ошибка при расчёте маршрута.";
        }

    } catch (geocodeError) {
        document.getElementById('result').innerText = "Ошибка при расчёте. Попробуйте снова.";
    } finally {
        // Снимаем флаг после завершения (успешного или с ошибкой)
        isCalculatingDelivery = false;
    }
}

// Функция-обертка с debounce для calculateDelivery
function calculateDeliveryDebounced() {
    // Очищаем предыдущий таймер
    if (calculateDeliveryDebounceTimer) {
        clearTimeout(calculateDeliveryDebounceTimer);
    }
    
    // Устанавливаем новый таймер (500мс задержка)
    calculateDeliveryDebounceTimer = setTimeout(() => {
        calculateDelivery();
    }, 500);
}

// Функция формирования коммерческого предложения
async function generateCommercialOffer(basePrice, assemblyCost, foundationCost, additionalProducts, additionalProductsCost, deliveryPrice, finalTotalPrice, selectedEntry, basePriceText, assemblyText, foundationText, bedsAssemblyText, additionalProductsText, snowLoadFinalText, displayLength) {
    // Извлечение дополнительных характеристик
    const height = selectedEntry.height ? selectedEntry.height : "Не указано";
    const horizontalTies = selectedEntry.horizontal_ties ? selectedEntry.horizontal_ties : "Не указано";
    const equipment = selectedEntry.equipment || "Не указано";

    // Получаем название теплицы из базы данных и приводим к верхнему регистру
    const baseName = selectedEntry.form_name.toUpperCase(); // например, "ДОМИК ЛЮКС 3М"

    // Выбранная форма (например, "ДОМИКОМ" или "АРОЧНАЯ")
    const selectedForm = document.getElementById("form").value.toUpperCase();

    // Массив ключевых слов, по которым определяется форма
    const formSynonyms = [
        "ДОМИК",
        "АРОЧНАЯ",
        "КАПЛЕВИДНАЯ",
        "ПРИСТЕННАЯ",
        "ПРЯМОСТЕННАЯ",
        "МИТТЛАЙДЕР",
        "ПРОМЫШЛЕННАЯ"
    ];

    // Функция, которая проверяет, содержится ли выбранная форма (или её синоним)
    // в baseName. Если хотя бы одно ключевое слово из selectedForm совпадает с частью baseName, то дописывать не нужно.
    function shouldAppendForm(baseName, selectedForm) {
        // Пройдемся по ключевым словам
        for (let i = 0; i < formSynonyms.length; i++) {
            const key = formSynonyms[i];
            // Если и baseName содержит это ключевое слово, и выбранная форма тоже содержит его, значит не нужно дописывать
            if (baseName.includes(key) && selectedForm.includes(key)) {
                return false;
            }
        }
        return true;
    }

    // Формируем итоговое название теплицы
    let cleanName = baseName;
    if (shouldAppendForm(baseName, selectedForm)) {
        cleanName += ` ${selectedForm}`;
    }

    const frameValue = document.getElementById("frame").value.trim();
    const widthValue = document.getElementById("width").value.trim();
    const lengthValue = (displayLength != null && displayLength !== '') ? String(displayLength) : (document.getElementById("length") ? document.getElementById("length").value.trim() : '');
    const arcStepValue = document.getElementById("arcStep").value.trim();
    const polycarbonateValue = document.getElementById("polycarbonate").value.trim();
    
    // Нормализуем значение поликарбоната для проверок
    const polyNormalized = polycarbonateValue.replace(/\s+/g, "").toLowerCase();
    
    // Добавляем "без поликарбоната" если выбран вариант без поликарбоната
    if (polyNormalized === "безполикарбоната") {
        cleanName += ` без поликарбоната`;
    }

    // Формирование строки для каркаса с добавлением суффикса ", краб система"
    let frameLine = `Каркас: ${frameValue}`;
    if (frameValue) {
        frameLine += `, краб система`;
    }

    // Формирование строки для поликарбоната с добавлением веса (если выбран вариант, отличный от "Без поликарбоната")
    let polycarbonateLine = `Поликарбонат с УФ защитой: ${polycarbonateValue}`;
    if (polyNormalized !== "безполикарбоната") {
        if (polyNormalized === "стандарт4мм") {
            polycarbonateLine += `, 0.47 кг/м2`;
        } else if (polyNormalized === "люкс4мм" || polyNormalized === "люкс4 мм") {
            polycarbonateLine += `, 0.52 кг/м2`;
        } else if (polyNormalized === "премиум6мм" || polyNormalized === "премиум6 мм") {
            polycarbonateLine += `, 0.8 кг/м2`;
        }
    }

    // Формирование итогового коммерческого предложения
    let commercialOffer = `${cleanName}\n\n` +
        `${frameLine}\n` +
        `Ширина: ${widthValue} м\n` +
        `Длина: ${lengthValue} м\n` +
        `Высота: ${height}\n` +
        `Шаг дуги: ${arcStepValue} м\n` +
        `${polycarbonateLine}\n` +
        `Снеговая нагрузка: ${snowLoadFinalText}\n` +
        `Горизонтальные стяжки: ${horizontalTies}\n` +
        `Комплектация: ${equipment}\n` +
        `${basePriceText}\n`;

    if (assemblyText) {
        commercialOffer += `${assemblyText}\n`;
    }
    if (foundationText) {
        commercialOffer += `${foundationText}\n`;
    }
    if (bedsAssemblyText) {
        commercialOffer += `${bedsAssemblyText}\n`;
    }
    if (additionalProductsText) {
        commercialOffer += `\n${additionalProductsText}\n`;
    }
    
    if (deliveryPrice > 0) {
        commercialOffer += `\nДоставка - ${formatPrice(deliveryPrice)} рублей\n`;
    }
    
    const withAssembly = !!document.getElementById('assembly')?.checked;
    if (SHOW_DELIVERY_DATE_IN_OFFER) {
        if (!currentDeliveryDate) {
            const selectedCity = (typeof resolveCreateWarehouseCityKey_ === 'function' ? (resolveCreateWarehouseCityKey_() || '') : '') || document.getElementById("city").value;
            if (selectedCity) {
                await loadDeliveryDate(selectedCity);
            }
        }
        const dateText = getDeliveryDateTextForKP(withAssembly);
        if (dateText) {
            commercialOffer += `📅 Ближайшая дата доставки: ${dateText}\n`;
        }
    }
    const dateTextForOffer = getDeliveryDateTextForKP(withAssembly);
    const deliveryDateText = dateTextForOffer ? `📅 Ближайшая дата доставки: ${dateTextForOffer}.` : '';
    
    // Подарки НЕ добавляются здесь - они добавляются через updateCommercialOffersWithGifts()
    // Это предотвращает дублирование подарков в КП
    
    // Если сумма больше порога подарков - используем расширенный формат
    if (finalTotalPrice > GIFT_THRESHOLDS.slot1) {
        commercialOffer += `\nИтого: ${formatPrice(finalTotalPrice)} рублей\n\n`;
        commercialOffer += `💳 Без предоплаты — оплата по факту.\n` +
            `🌱 Бесплатное хранение до весны с сохранением цены.\n`;
        if (deliveryDateText) {
            commercialOffer += `${deliveryDateText}\n`;
        }
    } else {
        // Если сумма ниже порога подарков - стандартный формат
        commercialOffer += `\nИтоговая стоимость - ${formatPrice(finalTotalPrice)} рублей\n`;
        commercialOffer += `💳 Без предоплаты — оплата по факту\n` +
            `🌱 Бесплатное хранение до весны с сохранением цены.\n`;
        if (deliveryDateText) {
            commercialOffer += `${deliveryDateText}\n`;
        }
    }

    // ========== ВАРИАНТ 2: С запасом по нагрузке ==========
    const reserveVariant = pickReserveVariant();
    if (reserveVariant) {
        const finalTotalPrice2 = computeFinalTotalPriceForVariant({
            frame: reserveVariant.altFrame,
            arcStep: reserveVariant.altArcStep,
            polycarbonate: reserveVariant.altPolycarbonate,
            deliveryPrice: deliveryPrice // Передаем актуальную стоимость доставки
        });
        
        if (finalTotalPrice2 !== null) {
            // Генерируем полное описание второго варианта
            const variant2Description = await generateVariant2Description(
                reserveVariant.altFrame,
                reserveVariant.altArcStep,
                reserveVariant.altPolycarbonate,
                reserveVariant.reasonText,
                finalTotalPrice2,
                selectedEntry,
                deliveryPrice // Передаем актуальную стоимость доставки
            );
            
            if (variant2Description) {
                commercialOffer += `\n\n${variant2Description}`;
            }
        }
    }

    // Выводим сформированное КП в textarea
    document.getElementById("commercial-offer").value = commercialOffer;
    
    // Обновляем счетчик символов и кнопки
    updateCharCounter('commercial-offer');
}

// Функция генерации полного описания второго варианта для длинного КП
async function generateVariant2Description(altFrame, altArcStep, altPolycarbonate, reasonText, finalTotalPrice2, baseSelectedEntry, deliveryPrice = null) {
    try {
        const form = document.getElementById("form").value.trim();
        const width = parseFloat(document.getElementById("width").value);
        const length = parseFloat(document.getElementById("length").value);
        const lenPair = getEffectiveLengthFromMainPanel();
        const displayLength = (!isNaN(lenPair.effective)) ? lenPair.effective : length;

        // Находим entry для альтернативного варианта
        const altEntry = currentCityData.find(item => {
            return (
                getFormCategory(item.form_name) === form &&
                parseFloat(item.width) === width &&
                parseFloat(item.length) === length &&
                normalizeString(item.frame_description.replace(/двойная\s*/gi, "")).includes(normalizeString(altFrame)) &&
                normalizeString(item.polycarbonate_type) === normalizeString(altPolycarbonate)
            );
        });
        
        if (!altEntry) {
            return null; // Вариант не найден
        }
        
        // Извлечение дополнительных характеристик
        const height = altEntry.height ? altEntry.height : "Не указано";
        const horizontalTies = altEntry.horizontal_ties ? altEntry.horizontal_ties : "Не указано";
        const equipment = altEntry.equipment || "Не указано";
        
        // Получаем название теплицы
        const baseName = altEntry.form_name.toUpperCase();
        const selectedForm = document.getElementById("form").value.toUpperCase();
        
        const formSynonyms = [
            "ДОМИК", "АРОЧНАЯ", "КАПЛЕВИДНАЯ", "ПРИСТЕННАЯ",
            "ПРЯМОСТЕННАЯ", "МИТТЛАЙДЕР", "ПРОМЫШЛЕННАЯ"
        ];
        
        function shouldAppendForm(baseName, selectedForm) {
            for (let i = 0; i < formSynonyms.length; i++) {
                const key = formSynonyms[i];
                if (baseName.includes(key) && selectedForm.includes(key)) {
                    return false;
                }
            }
            return true;
        }
        
        let cleanName = baseName;
        if (shouldAppendForm(baseName, selectedForm)) {
            cleanName += ` ${selectedForm}`;
        }
        
        // Формирование строки для каркаса
        let frameLine = `Каркас: ${altFrame}`;
        if (altFrame) {
            frameLine += `, краб система`;
        }
        
        // Формирование строки для поликарбоната
        let polycarbonateLine = `Поликарбонат с УФ защитой: ${altPolycarbonate}`;
        const polyNormalized = altPolycarbonate.replace(/\s+/g, "").toLowerCase();
        if (polyNormalized !== "безполикарбоната") {
            if (polyNormalized === "стандарт4мм") {
                polycarbonateLine += `, 0.47 кг/м2`;
            } else if (polyNormalized === "люкс4мм" || polyNormalized === "люкс4 мм") {
                polycarbonateLine += `, 0.52 кг/м2`;
            } else if (polyNormalized === "премиум6мм" || polyNormalized === "премиум6 мм") {
                polycarbonateLine += `, 0.8 кг/м2`;
            }
        }
        
        // Расчёт снеговой нагрузки (как в calculateGreenhouseCost)
        let originalSnowLoadText = altEntry.snow_load || "0 кг/м2";
        let rawSnowLoad = originalSnowLoadText.match(/\d+(\.\d+)?/);
        let snowLoadNum = rawSnowLoad ? parseFloat(rawSnowLoad[0]) : 0;
        if (isNaN(snowLoadNum)) {
            snowLoadNum = 0;
        }
        
        // Надбавка за arcStep 0.65
        if (altArcStep === 0.65) {
            snowLoadNum = Math.round(snowLoadNum * 1.25);
        }
        
        // Надбавка за поликарбонат
        if (polyNormalized === "люкс4мм" || polyNormalized === "люкс4 мм") {
            snowLoadNum = Math.round(snowLoadNum * 1.1);
        }
        if (polyNormalized === "премиум6мм" || polyNormalized === "премиум6 мм") {
            snowLoadNum = Math.round(snowLoadNum * 1.2);
        }
        
        let snowLoadFinalText = `${snowLoadNum} кг/м2`;
        
        // Получаем те же дополнительные услуги и товары (они не меняются)
        const bracingCheckbox = document.getElementById('bracing');
        const groundHooksCheckbox = document.getElementById('ground-hooks');
        const assemblyCheckbox = document.getElementById('assembly');
        const onWoodCheckbox = document.getElementById('on-wood');
        const onConcreteCheckbox = document.getElementById('on-concrete');
        
        const bracingChecked = bracingCheckbox ? bracingCheckbox.checked : false;
        const groundHooksChecked = groundHooksCheckbox ? groundHooksCheckbox.checked : false;
        const assemblyChecked = assemblyCheckbox ? assemblyCheckbox.checked : false;
        const onWoodChecked = onWoodCheckbox ? onWoodCheckbox.checked : false;
        const onConcreteChecked = onConcreteCheckbox ? onConcreteCheckbox.checked : false;
        
        // Расчёт basePrice для альтернативного варианта
        let basePrice = altEntry.price;
        if (altArcStep === 0.65) {
            const baseEntry = currentCityData.find(item => {
                return (
                    getFormCategory(item.form_name) === form &&
                    parseFloat(item.width) === width &&
                    parseFloat(item.length) === length &&
                    normalizeString(item.frame_description).includes(normalizeString(altFrame)) &&
                    (normalizeString(item.polycarbonate_type) === normalizeString("стандарт4мм") ||
                        normalizeString(item.polycarbonate_type) === normalizeString("стандарт 4мм"))
                );
            });
            if (baseEntry) {
                const basePriceStandard = baseEntry.price;
                const additionalCost = 0.25 * basePriceStandard;
                basePrice += additionalCost;
                basePrice = Math.ceil(basePrice / 10) * 10;
            }
        }
        
        // Формируем тексты для дополнительных услуг (те же, что в основном варианте)
        let assemblyText = "";
        let foundationText = "";
        let additionalProductsText = "";
        
        if (assemblyChecked) {
            const assemblyCategory = getAssemblyCategory(form, width);
            if (assemblyCategory) {
                const assemblyCostCalculated = calculateAssemblyCost(form, assemblyCategory, length);
                if (assemblyCostCalculated > 0) {
                    assemblyText = `\nСборка и установка - ${formatPrice(assemblyCostCalculated)} рублей`;
                }
            }
        }
        
        if (bracingChecked) {
            const bracingPrice = additionalServicesData["Брус"].price_by_length[length];
            if (bracingPrice) {
                foundationText += `\nОснование из бруса - ${formatPrice(bracingPrice)} рублей`;
            }
        }
        
        if (groundHooksChecked) {
            const quantityData = bracingChecked
                ? additionalServicesData["Штыри"].quantity_by_length["with_bracing"]
                : additionalServicesData["Штыри"].quantity_by_length["without_bracing"];
            const stakesQuantity = quantityData[length];
            if (stakesQuantity) {
                const stakesCost = stakesQuantity * additionalServicesData["Штыри"].price_per_unit;
                foundationText += `\nГрунтозацепы ${stakesQuantity} шт - ${formatPrice(stakesCost)} рублей`;
            }
        }
        
        if (onWoodChecked) {
            const woodPrice = onWoodCheckbox ? parseFloat(onWoodCheckbox.getAttribute('data-price')) : 0;
            if (woodPrice) {
                foundationText += `\nМонтаж на брус клиента - ${formatPrice(woodPrice)} рублей`;
            }
        }
        
        if (onConcreteChecked) {
            const concretePrice = onConcreteCheckbox ? parseFloat(onConcreteCheckbox.getAttribute('data-price')) : 0;
            if (concretePrice) {
                foundationText += `\nМонтаж на бетон клиента - ${formatPrice(concretePrice)} рублей`;
            }
        }
        
        // Дополнительные товары (те же)
        const productSelects = document.querySelectorAll('.additional-products .product-item select');
        const additionalProducts = [];
        productSelects.forEach(select => {
            const quantity = parseInt(select.value, 10);
            if (quantity > 0) {
                const productNameElement = select.parentElement.querySelector('.product-name');
                const productName = productNameElement ? productNameElement.textContent.trim() : "";
                if (!productName.toLowerCase().includes("перегородка")) {
                    const productPrice = parseFloat(select.getAttribute('data-price'));
                    if (!isNaN(productPrice) && productPrice > 0) {
                        additionalProducts.push({
                            name: productName,
                            cost: productPrice * quantity,
                            quantity: quantity
                        });
                    }
                }
            }
        });
        
        if (additionalProducts.length > 0) {
            additionalProductsText = additionalProducts.map(product => {
                if (product.quantity > 1) {
                    return `${product.name} x ${product.quantity} - ${formatPrice(product.cost)} рублей`;
                } else {
                    return `${product.name} - ${formatPrice(product.cost)} рублей`;
                }
            }).join('\n');
        }
        
        // Получаем стоимость доставки (переданную как параметр или из глобальной переменной)
        const deliveryPriceValue = deliveryPrice !== null ? deliveryPrice : deliveryCost;
        
        // Формируем описание второго варианта
        let variant2Text = `\nВАРИАНТ 2: С запасом по нагрузке (${reasonText})\n\n`;
        variant2Text += `${cleanName}\n\n`;
        variant2Text += `${frameLine}\n`;
        variant2Text += `Ширина: ${width} м\n`;
        variant2Text += `Длина: ${displayLength} м\n`;
        variant2Text += `Высота: ${height}\n`;
        variant2Text += `Шаг дуги: ${altArcStep} м\n`;
        variant2Text += `${polycarbonateLine}\n`;
        variant2Text += `Снеговая нагрузка: ${snowLoadFinalText}\n`;
        variant2Text += `Горизонтальные стяжки: ${horizontalTies}\n`;
        variant2Text += `Комплектация: ${equipment}\n`;
        variant2Text += `Стоимость с учетом скидки - ${formatPrice(basePrice)} рублей\n`;
        
        if (assemblyText) {
            variant2Text += `${assemblyText}\n`;
        }
        if (foundationText) {
            variant2Text += `${foundationText}\n`;
        }
        if (additionalProductsText) {
            variant2Text += `\n${additionalProductsText}\n`;
        }
        
        // Добавляем грядки во второй вариант (если выбраны)
        const selectedBeds = JSON.parse(localStorage.getItem('selectedBeds') || '{}');
        const bedsAssemblyEnabled = localStorage.getItem('bedsAssemblyEnabled') === 'true';
        let bedsText = '';
        
        if (Object.keys(selectedBeds).length > 0) {
            bedsText += '\nГрядки оцинкованные:\n';
            Object.keys(selectedBeds).forEach(bedId => {
                const bed = BEDS_DATA.find(b => b.id === bedId);
                if (bed && selectedBeds[bedId] > 0 && bed.price > 0) {
                    const quantity = selectedBeds[bedId];
                    const totalCost = bed.price * quantity;
                    const heightText = bed.height === 19 ? 'низкие' : 'высокие';
                    // Правильное склонение слова "грядка"
                    let bedWord = 'грядка';
                    if (quantity === 1) {
                        bedWord = 'грядка';
                    } else if (quantity >= 2 && quantity <= 4) {
                        bedWord = 'грядки';
                    } else {
                        bedWord = 'грядок';
                    }
                    bedsText += `${quantity} ${bedWord} ${heightText} ${bed.length} м: ширина ${bed.width} м, высота ${bed.height} см - ${formatPrice(totalCost)} рублей\n`;
                }
            });
            
            // Добавляем сборку грядок, если включена (считаем для каждой грядки отдельно по её длине)
            if (bedsAssemblyEnabled) {
                const bedsAssemblyCost = calculateBedsAssemblyCost(selectedBeds);
                if (bedsAssemblyCost > 0) {
                    bedsText += `Сборка грядок - ${formatPrice(bedsAssemblyCost)} рублей\n`;
                }
            }
        }
        
        if (bedsText) {
            variant2Text += bedsText;
        }
        
        if (deliveryPriceValue > 0) {
            variant2Text += `\nДоставка - ${formatPrice(deliveryPriceValue)} рублей\n`;
        }
        
        const withAssemblyV2 = !!document.getElementById('assembly')?.checked;
        const dateTextV2 = getDeliveryDateTextForKP(withAssemblyV2);
        const deliveryDateText = dateTextV2 ? `📅 Ближайшая дата доставки: ${dateTextV2}.` : '';
        
        // Добавляем итоговую сумму
        if (finalTotalPrice2 > GIFT_THRESHOLDS.slot1) {
            variant2Text += `\nИтого: ${formatPrice(finalTotalPrice2)} рублей\n\n`;
        } else {
            variant2Text += `\nИтоговая стоимость - ${formatPrice(finalTotalPrice2)} рублей\n`;
        }
        
        // Подарки НЕ добавляются здесь - они добавляются через rebuildLongOfferWithGifts()
        // Это предотвращает дублирование подарков в КП
        
        // Добавляем условия оплаты (те же, что в основном КП)
        if (finalTotalPrice2 > GIFT_THRESHOLDS.slot1) {
            variant2Text += `💳 Без предоплаты — оплата по факту.\n` +
                `🌱 Бесплатное хранение до весны с сохранением цены.\n`;
            if (deliveryDateText) {
                variant2Text += `${deliveryDateText}\n`;
            }
        } else {
            variant2Text += `💳 Без предоплаты — оплата по факту\n` +
                `🌱 Бесплатное хранение до весны с сохранением цены.\n`;
            if (deliveryDateText) {
                variant2Text += `${deliveryDateText}\n`;
            }
        }
        
        return variant2Text;
    } catch (err) {
        console.error("Ошибка при генерации описания второго варианта:", err);
        return null;
    }
}

// ==================== КОРОТКОЕ КП ====================

// Функция выбора альтернативного варианта (для ИТОГО_2)
// Новая логика: шаг дуг → каркас → поликарбонат
function pickReserveVariant() {
    const currentFrame = document.getElementById("frame").value.trim();
    const currentArcStep = parseFloat(document.getElementById("arcStep").value);
    const currentPolycarbonate = document.getElementById("polycarbonate").value.trim();
    const currentForm = (document.getElementById("form") && document.getElementById("form").value) ? document.getElementById("form").value.trim() : "";
    const frameSelect = document.getElementById("frame");
    const polycarbonateSelect = document.getElementById("polycarbonate");
    
    const normalizedCurrentFrame = normalizeString(currentFrame);
    const normalizedCurrentPoly = normalizeString(currentPolycarbonate);
    const normalizedCurrentForm = normalizeString(currentForm);
    
    // ========== ОСОБЫЙ СЛУЧАЙ: Арочная + каркас 20×20 → рекомендуем 40×20 (не шаг 0.65) ==========
    const isArched = normalizedCurrentForm.includes("арочная");
    const frameNorm = normalizedCurrentFrame.replace(/×/g, "х"); // унифицируем × и х
    const isSingle20x20 = !normalizedCurrentFrame.includes("+") && (frameNorm.includes("20х20") && !frameNorm.includes("40х20"));
    if (isArched && isSingle20x20) {
        for (let i = 0; i < frameSelect.options.length; i++) {
            const optionValue = frameSelect.options[i].value.trim();
            const normalizedOption = normalizeString(optionValue);
            if (normalizedOption.includes("40х20") && !normalizedOption.includes("+")) {
                return {
                    altFrame: optionValue,
                    altArcStep: currentArcStep,
                    altPolycarbonate: currentPolycarbonate,
                    reasonText: "усиленный каркас"
                };
            }
        }
    }
    
    // ========== ШАГ 1: Улучшаем шаг дуг до 0.65 (если не 0.65) ==========
    if (currentArcStep !== 0.65) {
        return {
            altFrame: currentFrame,
            altArcStep: 0.65,
            altPolycarbonate: currentPolycarbonate,
            reasonText: "усиленный шаг дуг 0.65 м"
        };
    }
    
    // ========== ШАГ 2: Улучшаем каркас (если уже 0.65) ==========
    // Проверяем, одинарный ли каркас (без "+")
    const isDoubleFrame = normalizedCurrentFrame.includes("+");
    
    if (!isDoubleFrame) {
        // ОДИНАРНЫЙ КАРКАС: 20×20 → 40×20
        if (normalizedCurrentFrame.includes("20х20") && !normalizedCurrentFrame.includes("40х20")) {
            // Ищем "40×20" (одинарный) в доступных опциях
            for (let i = 0; i < frameSelect.options.length; i++) {
                const optionValue = frameSelect.options[i].value.trim();
                const normalizedOption = normalizeString(optionValue);
                // Ищем одинарный 40×20 (без "+")
                if (normalizedOption.includes("40х20") && !normalizedOption.includes("+")) {
                    return {
                        altFrame: optionValue,
                        altArcStep: currentArcStep,
                        altPolycarbonate: currentPolycarbonate,
                        reasonText: "усиленный каркас"
                    };
                }
            }
        }
        // Если уже 40×20 (одинарный), НЕ предлагаем двойную дугу - переходим к поликарбонату
    } else {
        // ДВОЙНАЯ ДУГА: 20×20+20×20 → 40×20+20×20
        if (normalizedCurrentFrame.includes("20х20+20х20")) {
            // Ищем "40×20+20×20" в доступных опциях
            for (let i = 0; i < frameSelect.options.length; i++) {
                const optionValue = frameSelect.options[i].value.trim();
                const normalizedOption = normalizeString(optionValue);
                if (normalizedOption.includes("40х20+20х20")) {
                    return {
                        altFrame: optionValue,
                        altArcStep: currentArcStep,
                        altPolycarbonate: currentPolycarbonate,
                        reasonText: "усиленный каркас 40×20+20×20"
                    };
                }
            }
        }
        // Если уже 40×20+20×20, переходим к поликарбонату
    }
    
    // ========== ШАГ 3: Улучшаем поликарбонат (если каркас уже максимальный) ==========
    // Стандарт 4мм → Люкс 4мм (писать "усиленный")
    if (normalizedCurrentPoly.includes("стандарт") && normalizedCurrentPoly.includes("4")) {
        // Ищем "Люкс 4 мм" в доступных опциях
        for (let i = 0; i < polycarbonateSelect.options.length; i++) {
            const optionValue = polycarbonateSelect.options[i].value.trim();
            const normalizedOption = normalizeString(optionValue);
            if (normalizedOption.includes("люкс") && normalizedOption.includes("4")) {
                    return {
                        altFrame: currentFrame,
                        altArcStep: currentArcStep,
                        altPolycarbonate: optionValue,
                        reasonText: "усиленный поликарбонат"
                    };
            }
        }
    }
    
    // Люкс 4мм → Премиум 6мм (писать "Премиум усиленный")
    if (normalizedCurrentPoly.includes("люкс") && normalizedCurrentPoly.includes("4")) {
        // Ищем "Премиум 6 мм" в доступных опциях
        for (let i = 0; i < polycarbonateSelect.options.length; i++) {
            const optionValue = polycarbonateSelect.options[i].value.trim();
            const normalizedOption = normalizeString(optionValue);
            if (normalizedOption.includes("премиум") && normalizedOption.includes("6")) {
                    return {
                        altFrame: currentFrame,
                        altArcStep: currentArcStep,
                        altPolycarbonate: optionValue,
                        reasonText: "премиум поликарбонат усиленный"
                    };
            }
        }
    }
    
    // Если ничего не найдено - все уже максимально улучшено
    return null;
}

// Функция расчёта итоговой стоимости для альтернативного варианта
function computeFinalTotalPriceForVariant(overrideParams) {
    try {
        // Получаем актуальную стоимость доставки из параметров или глобальной переменной
        const deliveryPriceValue = overrideParams.deliveryPrice !== undefined ? overrideParams.deliveryPrice : deliveryCost;
        // Получаем текущие параметры из DOM
        const city = document.getElementById("city").value.trim();
        const form = document.getElementById("form").value.trim();
        const width = parseFloat(document.getElementById("width").value);
        const length = parseFloat(document.getElementById("length").value);
        
        // Применяем overrideParams
        const frame = overrideParams.frame || document.getElementById("frame").value.trim();
        const arcStep = overrideParams.arcStep !== undefined ? overrideParams.arcStep : parseFloat(document.getElementById("arcStep").value);
        const polycarbonate = overrideParams.polycarbonate || document.getElementById("polycarbonate").value.trim();
        
        // Получаем состояние чекбоксов и доп. товаров
        const bracingCheckbox = document.getElementById('bracing');
        const groundHooksCheckbox = document.getElementById('ground-hooks');
        const assemblyCheckbox = document.getElementById('assembly');
        const onWoodCheckbox = document.getElementById('on-wood');
        const onConcreteCheckbox = document.getElementById('on-concrete');
        
        const bracingChecked = bracingCheckbox ? bracingCheckbox.checked : false;
        const groundHooksChecked = groundHooksCheckbox ? groundHooksCheckbox.checked : false;
        const assemblyChecked = assemblyCheckbox ? assemblyCheckbox.checked : false;
        const onWoodChecked = onWoodCheckbox ? onWoodCheckbox.checked : false;
        const onConcreteChecked = onConcreteCheckbox ? onConcreteCheckbox.checked : false;
        
        // Получаем дополнительные товары
        const additionalProducts = [];
        const productSelects = document.querySelectorAll('.additional-products .product-item select');
        productSelects.forEach(select => {
            const quantity = parseInt(select.value, 10);
            if (quantity > 0) {
                const productPrice = parseFloat(select.getAttribute('data-price'));
                if (!isNaN(productPrice) && productPrice > 0) {
                    additionalProducts.push({ 
                        cost: productPrice * quantity
                    });
                }
            }
        });
        
        // Находим selectedEntry в currentCityData
        const selectedEntry = currentCityData.find(item => {
            return (
                getFormCategory(item.form_name) === form &&
                parseFloat(item.width) === width &&
                parseFloat(item.length) === length &&
                normalizeString(item.frame_description.replace(/двойная\s*/gi, "")).includes(normalizeString(frame)) &&
                normalizeString(item.polycarbonate_type) === normalizeString(polycarbonate)
            );
        });
        
        if (!selectedEntry) {
            return null; // Вариант не найден
        }
        
        // Расчёт basePrice (как в calculateGreenhouseCost)
        let basePrice = selectedEntry.price;
        
        // Надбавка за arcStep 0.65
        if (arcStep === 0.65) {
            const baseEntry = currentCityData.find(item => {
                return (
                    getFormCategory(item.form_name) === form &&
                    parseFloat(item.width) === width &&
                    parseFloat(item.length) === length &&
                    normalizeString(item.frame_description).includes(normalizeString(frame)) &&
                    (normalizeString(item.polycarbonate_type) === normalizeString("стандарт4мм") ||
                        normalizeString(item.polycarbonate_type) === normalizeString("стандарт 4мм"))
                );
            });
            
            if (baseEntry) {
                const basePriceStandard = baseEntry.price;
                const additionalCost = 0.25 * basePriceStandard;
                basePrice += additionalCost;
                basePrice = Math.ceil(basePrice / 10) * 10;
            }
        }
        
        // Расчёт сборки
        let assemblyCost = 0;
        if (assemblyChecked) {
            const assemblyCategory = getAssemblyCategory(form, width);
            if (assemblyCategory) {
                const assemblyCostCalculated = calculateAssemblyCost(form, assemblyCategory, length);
                if (assemblyCostCalculated > 0) {
                    assemblyCost = assemblyCostCalculated;
                }
            }
        }
        
        // Расчёт основания
        let foundationCost = 0;
        if (bracingChecked) {
            const bracingPrice = additionalServicesData["Брус"].price_by_length[length];
            if (bracingPrice) {
                foundationCost += bracingPrice;
            }
        }
        
        if (groundHooksChecked) {
            const quantityData = bracingChecked
                ? additionalServicesData["Штыри"].quantity_by_length["with_bracing"]
                : additionalServicesData["Штыри"].quantity_by_length["without_bracing"];
            const stakesQuantity = quantityData[length];
            if (stakesQuantity) {
                const stakesCost = stakesQuantity * additionalServicesData["Штыри"].price_per_unit;
                foundationCost += stakesCost;
            }
        }
        
        if (onWoodChecked) {
            const woodPrice = onWoodCheckbox ? parseFloat(onWoodCheckbox.getAttribute('data-price')) : 0;
            if (woodPrice) {
                foundationCost += woodPrice;
            }
        }
        
        if (onConcreteChecked) {
            const concretePrice = onConcreteCheckbox ? parseFloat(onConcreteCheckbox.getAttribute('data-price')) : 0;
            if (concretePrice) {
                foundationCost += concretePrice;
            }
        }
        
        // Расчёт дополнительных товаров
        let additionalProductsCost = 0;
        additionalProducts.forEach(product => {
            additionalProductsCost += product.cost;
        });
        
        // Расчёт грядок (если выбраны)
        const selectedBeds = JSON.parse(localStorage.getItem('selectedBeds') || '{}');
        const bedsAssemblyEnabled = localStorage.getItem('bedsAssemblyEnabled') === 'true';
        let bedsCost = 0;
        let bedsAssemblyCost = 0;
        
        if (Object.keys(selectedBeds).length > 0) {
            Object.keys(selectedBeds).forEach(bedId => {
                const bed = BEDS_DATA.find(b => b.id === bedId);
                if (bed && selectedBeds[bedId] > 0 && bed.price > 0) {
                    bedsCost += bed.price * selectedBeds[bedId];
                }
            });
            
            // Стоимость сборки грядок (считаем для каждой грядки отдельно по её длине)
            if (bedsAssemblyEnabled) {
                bedsAssemblyCost = calculateBedsAssemblyCost(selectedBeds);
            }
        }
        
        // Итоговая стоимость (включая грядки и доставку)
        let finalTotalPriceAlt = basePrice + assemblyCost + foundationCost + additionalProductsCost + bedsCost + bedsAssemblyCost + deliveryPriceValue;
        // Округление вверх до ближайшего десятка (после добавления доставки)
        finalTotalPriceAlt = Math.ceil(finalTotalPriceAlt / 10) * 10;
        
        return finalTotalPriceAlt;
    } catch (err) {
        console.error("Ошибка при расчёте альтернативного варианта:", err);
        return null;
    }
}

// Функция генерации короткого КП
async function generateShortOffer(finalTotalPrice1, selectedEntry, displayLength) {
    const form = document.getElementById("form").value.trim();
    const width = document.getElementById("width").value.trim();
    const length = (displayLength != null && displayLength !== '') ? String(displayLength) : (document.getElementById("length") ? document.getElementById("length").value.trim() : '');
    
    // Получаем адрес доставки и формируем заголовок
    const addressInput = document.getElementById("address");
    const deliveryAddress = addressInput ? addressInput.value.trim() : "";
    
    // Проверяем выбранные опции
    const assemblyCheckbox = document.getElementById('assembly');
    const bracingCheckbox = document.getElementById('bracing');
    const groundHooksCheckbox = document.getElementById('ground-hooks');
    
    const assemblyChecked = assemblyCheckbox ? assemblyCheckbox.checked : false;
    const bracingChecked = bracingCheckbox ? bracingCheckbox.checked : false;
    const groundHooksChecked = groundHooksCheckbox ? groundHooksCheckbox.checked : false;
    
    // Получаем информацию о грядках (для короткого КП - цена с учетом сборки)
    const selectedBeds = JSON.parse(localStorage.getItem('selectedBeds') || '{}');
    const bedsAssemblyEnabled = localStorage.getItem('bedsAssemblyEnabled') === 'true';
    let bedsTotalCost = 0;
    if (Object.keys(selectedBeds).length > 0) {
        Object.keys(selectedBeds).forEach(bedId => {
            const bed = BEDS_DATA.find(b => b.id === bedId);
            if (bed && selectedBeds[bedId] > 0 && bed.price > 0) {
                bedsTotalCost += bed.price * selectedBeds[bedId];
            }
        });
        // Добавляем стоимость сборки, если включена (считаем для каждой грядки отдельно по её длине)
        if (bedsAssemblyEnabled) {
            const bedsAssemblyCost = calculateBedsAssemblyCost(selectedBeds);
            bedsTotalCost += bedsAssemblyCost;
        }
    }
    
    // Функция склонения типа населенного пункта в родительный падеж
    function declineSettlementType(type) {
        if (!type) return type;
        
        const lowerType = type.toLowerCase().trim();
        
        // Словарь склонений типов населенных пунктов
        const typeDeclensions = {
            'посёлок': 'посёлка',
            'поселок': 'посёлка',
            'пгт': 'пгт',
            'посёлок городского типа': 'посёлка городского типа',
            'поселок городского типа': 'посёлка городского типа',
            'село': 'села',
            'деревня': 'деревни',
            'город': 'города',
            'городок': 'городка',
            'станица': 'станицы',
            'хутор': 'хутора',
            'аул': 'аула',
            'кишлак': 'кишлака',
            'снт': 'СНТ',
            'днт': 'ДНТ',
            'тсн': 'ТСН',
            'садоводство': 'садоводства',
            'дачный посёлок': 'дачного посёлка',
            'дачный поселок': 'дачного посёлка',
            'рабочий посёлок': 'рабочего посёлка',
            'рабочий поселок': 'рабочего посёлка',
            'курортный посёлок': 'курортного посёлка',
            'курортный поселок': 'курортного посёлка'
        };
        
        // Проверяем точное совпадение
        if (typeDeclensions[lowerType]) {
            // Сохраняем регистр первой буквы
            const firstChar = type[0];
            const declined = typeDeclensions[lowerType];
            return firstChar === firstChar.toUpperCase() 
                ? declined.charAt(0).toUpperCase() + declined.slice(1)
                : declined;
        }
        
        // Проверяем составные типы (например, "посёлок городского типа")
        for (const [key, value] of Object.entries(typeDeclensions)) {
            if (lowerType.includes(key) && key.length > 5) { // Для составных типов
                // Заменяем только тип, сохраняя остальное
                const regex = new RegExp(key, 'i');
                return type.replace(regex, value);
            }
        }
        
        // Если не найдено, возвращаем как есть
        return type;
    }
    
    // Функция склонения названия населенного пункта (без типа) в родительный падеж
    function declineCityName(cityName) {
        if (!cityName) return cityName;
        
        const city = cityName.trim();
        const lowerCity = city.toLowerCase();
        
        // Специальные случаи
        const specialCases = {
            'москва': 'Москвы',
            'санкт-петербург': 'Санкт-Петербурга',
            'питер': 'Санкт-Петербурга',
            'спб': 'Санкт-Петербурга',
            'казань': 'Казани',
            'нижний новгород': 'Нижнего Новгорода',
            'екатеринбург': 'Екатеринбурга',
            'новосибирск': 'Новосибирска',
            'краснодар': 'Краснодара',
            'воронеж': 'Воронежа',
            'челябинск': 'Челябинска',
            'уфа': 'Уфы',
            'ростов-на-дону': 'Ростова-на-Дону',
            'набережные челны': 'Набережных Челнов',
            'истра': 'Истры',
            'подольск': 'Подольска',
            'химки': 'Химок',
            'балашиха': 'Балашихи',
            'мытищи': 'Мытищ',
            'королёв': 'Королёва',
            'люберцы': 'Люберец',
            'красногорск': 'Красногорска',
            'электросталь': 'Электростали',
            'коломна': 'Коломны',
            'одинцово': 'Одинцово',
            'серпухов': 'Серпухова',
            'щелково': 'Щёлкова',
            'орехово-зуево': 'Орехово-Зуево',
            'дмитров': 'Дмитрова',
            'долгопрудный': 'Долгопрудного',
            'жуковский': 'Жуковского',
            'реутов': 'Реутова',
            'домодедово': 'Домодедова',
            'раменское': 'Раменского',
            'пушкино': 'Пушкино',
            'волоколамск': 'Волоколамска',
            'звенигород': 'Звенигорода',
            'клин': 'Клина',
            'солнечногорск': 'Солнечногорска',
            'тверь': 'Твери',
            'тула': 'Тулы',
            'калуга': 'Калуги',
            'брянск': 'Брянска',
            'смоленск': 'Смоленска',
            'рязань': 'Рязани',
            'ярославль': 'Ярославля',
            'кострома': 'Костромы',
            'иваново': 'Иваново',
            'владимир': 'Владимира',
            'вологда': 'Вологды',
            'белгород': 'Белгорода',
            'курск': 'Курска',
            'орёл': 'Орла',
            'липецк': 'Липецка',
            'тамбов': 'Тамбова',
            'пенза': 'Пензы',
            'саратов': 'Саратова',
            'самара': 'Самары',
            'ульяновск': 'Ульяновска',
            'чебоксары': 'Чебоксар',
            'йошкар-ола': 'Йошкар-Олы',
            'киров': 'Кирова',
            'пермь': 'Перми',
            'екатеринбург': 'Екатеринбурга',
            'тюмень': 'Тюмени',
            'омск': 'Омска',
            'барнаул': 'Барнаула',
            'кемерово': 'Кемерово',
            'новокузнецк': 'Новокузнецка',
            'красноярск': 'Красноярска',
            'иркутск': 'Иркутска',
            'хабаровск': 'Хабаровска',
            'владивосток': 'Владивостока',
            'ставрополь': 'Ставрополя',
            'майкоп': 'Майкопа',
            'черкесск': 'Черкесска',
            'великий новгород': 'Великого Новгорода',
            'вольгинский': 'Вольгинского',
            'мрясово': 'Мрясово',
            'малино': 'Малино'
        };
        
        // Проверяем специальные случаи
        if (specialCases[lowerCity]) {
            return specialCases[lowerCity];
        }
        
        // Общие правила склонения
        // Если заканчивается на -а (кроме -ка, -га, -ха, -ино, -ово, -ево), меняем на -ы
        if (city.endsWith('а') && !city.endsWith('ка') && !city.endsWith('га') && !city.endsWith('ха') && 
            !city.endsWith('ино') && !city.endsWith('ово') && !city.endsWith('ево')) {
            return city.slice(0, -1) + 'ы';
        }
        // Если заканчивается на -я, меняем на -и
        if (city.endsWith('я')) {
            return city.slice(0, -1) + 'и';
        }
        // Если заканчивается на -ь, меняем на -и
        if (city.endsWith('ь')) {
            return city.slice(0, -1) + 'и';
        }
        // Если заканчивается на -ск, -цк, -нк, добавляем -а
        if (city.endsWith('ск') || city.endsWith('цк') || city.endsWith('нк')) {
            return city + 'а';
        }
        // Если заканчивается на -ов, -ев, -ин, -ын, добавляем -а
        if (city.endsWith('ов') || city.endsWith('ев') || city.endsWith('ин') || city.endsWith('ын')) {
            return city + 'а';
        }
        // Если заканчивается на -град, меняем на -града
        if (city.endsWith('град')) {
            return city + 'а';
        }
        // Если заканчивается на -бург, меняем на -бурга
        if (city.endsWith('бург')) {
            return city + 'а';
        }
        // Если заканчивается на -ский, -цкий, меняем на -ского, -цкого
        if (city.endsWith('ский')) {
            return city.slice(0, -4) + 'ого';
        }
        if (city.endsWith('цкий')) {
            return city.slice(0, -4) + 'ого';
        }
        // Если заканчивается на -ино, -ово, -ево - обычно не склоняется, но может склоняться
        // Для большинства случаев оставляем как есть, но для некоторых склоняем
        if (city.endsWith('ино') || city.endsWith('ово') || city.endsWith('ево')) {
            // Большинство таких названий не склоняется, но есть исключения
            // Для простоты оставляем как есть
            return city;
        }
        
        // Если не подошло ни одно правило, возвращаем как есть
        return city;
    }
    
    // Улучшенная функция склонения населенного пункта с учетом типа
    function declineSettlementName(settlementName) {
        if (!settlementName) return settlementName;
        
        const name = settlementName.trim();
        const lowerName = name.toLowerCase();
        
        // Типы населенных пунктов для поиска
        const settlementTypes = [
            'посёлок городского типа',
            'поселок городского типа',
            'дачный посёлок',
            'дачный поселок',
            'рабочий посёлок',
            'рабочий поселок',
            'курортный посёлок',
            'курортный поселок',
            'посёлок',
            'поселок',
            'пгт',
            'село',
            'деревня',
            'город',
            'городок',
            'станица',
            'хутор',
            'аул',
            'кишлак',
            'снт',
            'днт',
            'тсн',
            'садоводство'
        ];
        
        // Ищем тип населенного пункта
        let foundType = null;
        let typeIndex = -1;
        let typeLength = 0;
        
        // Сначала ищем составные типы (длинные)
        for (const type of settlementTypes) {
            const index = lowerName.indexOf(type);
            if (index === 0 || (index > 0 && lowerName[index - 1] === ' ')) {
                if (type.length > typeLength) {
                    foundType = name.substring(index, index + type.length);
                    typeIndex = index;
                    typeLength = type.length;
                }
            }
        }
        
        // Если нашли тип
        if (foundType) {
            const declinedType = declineSettlementType(foundType);
            const namePart = name.substring(typeIndex + typeLength).trim();
            
            // Если есть название после типа
            if (namePart) {
                const declinedName = declineCityName(namePart);
                return `${declinedType} ${declinedName}`;
            } else {
                // Если только тип без названия
                return declinedType;
            }
        }
        
        // Если тип не найден, склоняем как обычное название города
        return declineCityName(name);
    }
    
    // Получаем значение поликарбоната
    const polycarbonateValue = document.getElementById("polycarbonate").value.trim();
    const polyNormalized = polycarbonateValue.replace(/\s+/g, "").toLowerCase();
    const isWithoutPolycarbonate = polyNormalized === "безполикарбоната";
    
    // Формируем заголовок
    let title = `${form} теплица ${width}×${length}`;
    
    // Добавляем "без поликарбоната" если выбран вариант без поликарбоната
    if (isWithoutPolycarbonate) {
        title += ` без поликарбоната`;
    }
    
    // Добавляем информацию о доставке, если адрес указан
    if (deliveryAddress) {
        // Извлекаем последнюю часть адреса (последний элемент после запятой)
        // Например: "Республика Татарстан (Татарстан), Пестречинский район, Шигалеевское сельское поселение, СНТ Городок" -> "СНТ Городок"
        const addressParts = deliveryAddress.split(',').map(part => part.trim());
        const lastPart = addressParts[addressParts.length - 1];
        
        if (lastPart) {
            // Склоняем название населенного пункта в родительный падеж (с учетом типа)
            const declinedCity = declineSettlementName(lastPart);
            title += ` с доставкой до ${declinedCity}`;
        }
    }
    
    // Добавляем информацию о сборке и комплектации
    // Логика: если сборка выбрана - пишем "со сборкой на...", если нет - "с ... в комплекте"
    // Сборка недоступна для теплиц без поликарбоната
    
    if (assemblyChecked && !isWithoutPolycarbonate) {
        // Со сборкой - можно писать "на брусе", так как сборка подразумевает установку
        if (bracingChecked && groundHooksChecked) {
            title += " со сборкой на брус с грунтозацепами";
        } else if (bracingChecked) {
            title += " со сборкой на брусе";
        } else if (groundHooksChecked) {
            title += " со сборкой с грунтозацепами";
        } else {
            title += " со сборкой";
        }
    } else {
        // Без сборки - пишем "в комплекте", чтобы не вводить в заблуждение
        if (bracingChecked && groundHooksChecked) {
            title += " с брусом и грунтозацепами в комплекте";
        } else if (bracingChecked) {
            title += " с брусом в комплекте";
        } else if (groundHooksChecked) {
            title += " с грунтозацепами в комплекте";
        }
    }
    
    // СТРОКА 1: Заголовок с полной информацией
    let shortOffer = `${title}\n\n`;
    
    // ИТОГО_1 (стандарт)
    shortOffer += `1) Стандарт: ${formatPrice(finalTotalPrice1)} рублей\n`;
    
    // ИТОГО_2 (с запасом по нагрузке)
    const reserveVariant = pickReserveVariant();
    let finalTotalPrice2 = null;
    let reasonText = null;
    
    if (reserveVariant) {
        finalTotalPrice2 = computeFinalTotalPriceForVariant({
            frame: reserveVariant.altFrame,
            arcStep: reserveVariant.altArcStep,
            polycarbonate: reserveVariant.altPolycarbonate
        });
        reasonText = reserveVariant.reasonText;
        
        // Если не посчиталось, пробуем fallback с arcStep 0.65 (только если не был уже 0.65)
        if (finalTotalPrice2 === null && reserveVariant.altArcStep !== 0.65) {
            const currentArcStep = parseFloat(document.getElementById("arcStep").value);
            if (currentArcStep !== 0.65) {
                const fallbackVariant = {
                    altFrame: reserveVariant.altFrame || document.getElementById("frame").value.trim(),
                    altArcStep: 0.65,
                    altPolycarbonate: reserveVariant.altPolycarbonate || document.getElementById("polycarbonate").value.trim(),
                    reasonText: "усиленный шаг дуг 0.65 м"
                };
                finalTotalPrice2 = computeFinalTotalPriceForVariant({
                    frame: fallbackVariant.altFrame,
                    arcStep: fallbackVariant.altArcStep,
                    polycarbonate: fallbackVariant.altPolycarbonate
                });
                if (finalTotalPrice2 !== null) {
                    reasonText = fallbackVariant.reasonText;
                }
            }
        }
    }
    
    // Добавляем строку 2, если альтернатива посчиталась
    if (finalTotalPrice2 !== null && reasonText) {
        shortOffer += `2) С запасом по нагрузке: ${formatPrice(finalTotalPrice2)} рублей (${reasonText})\n`;
    }
    
    // Добавляем информацию о грядках, если они выбраны (в коротком КП - цена с учетом сборки)
    if (bedsTotalCost > 0) {
        const bedsCount = Object.values(selectedBeds).reduce((sum, qty) => sum + qty, 0);
        const assemblyText = bedsAssemblyEnabled ? ' (со сборкой)' : '';
        shortOffer += `\nДополнительно:\nГрядки: ${formatPrice(bedsTotalCost)} рублей${assemblyText}\n`;
    }
    
    // Условия оплаты - лаконично, без лишних эмодзи
    shortOffer += `\nБез предоплаты. Гарантия 15 лет. Бесплатная заморозка стоимости.\n`;
    
    // Подарки НЕ добавляются здесь - они добавляются через updateCommercialOffersWithGifts()
    // Это предотвращает дублирование подарков в КП
    
    const withAssemblyShort = !!document.getElementById('assembly')?.checked;
    const dateText = getDeliveryDateTextForKP(withAssemblyShort);
    if (dateText) shortOffer += `\nБлижайшая дата доставки — ${dateText}.`;
    
    const shortOfferTextarea = document.getElementById("commercial-offer-short");
    if (shortOfferTextarea) {
        shortOfferTextarea.value = shortOffer;
        updateCharCounter('commercial-offer-short');
    }
    updateClientOfferFromShort();
}

/**
 * Собирает объект клиента из полей формы заказа (для превью «Текст заказа» и отправки).
 * Пустые поля подставляются плейсхолдерами для отображения шаблона.
 */
function getClientFromOrderForm() {
    const name = document.getElementById('order-client-name')?.value?.trim() || 'Клиент';
    const phone = document.getElementById('order-client-phone')?.value?.trim() || '';
    const deliveryDate = document.getElementById('order-delivery-date')?.value || '';
    const manager = document.getElementById('order-manager')?.value?.trim() || 'Менеджер';
    const addr1 = document.getElementById('order-address-part1')?.value?.trim() || '';
    const addr2 = document.getElementById('order-address-part2')?.value?.trim() || '';
    const noPlotCb = document.getElementById('order-no-plot');
    const part3 = document.getElementById('order-address-part3');
    const addr3 = noPlotCb?.checked ? '' : (part3?.value?.trim() || '');
    const fullAddress = [addr1, addr2, noPlotCb?.checked ? 'без номера участка' : addr3].filter(Boolean).join(', ');
    return { name, phone, deliveryDate, manager, address: fullAddress };
}

/**
 * Превью для вкладки «Текст заказа» до нажатия «Оформить заказ»: расчёт (характеристики теплицы) + при наличии — введённые данные формы.
 * Полный текст для клиента подставляется только после успешной отправки заказа.
 */
function buildOrderPreview(calc, client) {
    const hasData = (client.name !== 'Клиент') || (client.manager !== 'Менеджер') || client.phone || client.deliveryDate || client.address;
    let out = '';
    if (hasData) {
        out += 'Данные заказа:\n';
        out += `Имя: ${client.name}\n`;
        out += `Дата доставки: ${formatDateRu(client.deliveryDate)}\n`;
        out += `Адрес: ${client.address || '—'}\n`;
        out += `Телефон: ${formatPhoneDisplay(client.phone)}\n`;
        out += `Менеджер: ${client.manager}\n\n`;
    }
    out += buildGreenhouseBlock(calc);
    return out;
}

/**
 * Обновляет поле «Текст заказа»: до отправки — превью с актуальным составом (1 теплица, 2+ одинаковых с х2/итогом, 2+ разных); после «Оформить заказ» не трогаем.
 */
function updateClientOfferFromShort() {
    if (clearingFormAfterSubmit) return;
    const clientOfferTextarea = document.getElementById("commercial-offer-client");
    if (!clientOfferTextarea) return;
    const client = getClientFromOrderForm();
    if (typeof orderCart !== 'undefined' && orderCart && orderCart.length > 0) {
        var effectiveCalc = orderCart[0];
        clientOfferTextarea.value = generateFullOrderTemplate(effectiveCalc, client, orderCart);
    } else if (lastCalculation) {
        clientOfferTextarea.value = buildOrderPreview(lastCalculation, client);
    } else {
        clientOfferTextarea.value = 'Сначала выполните расчёт теплицы — здесь будет видно, что добавляем в заказ. После нажатия «Оформить заказ» появится полный текст для отправки клиенту.';
    }
    updateCharCounter('commercial-offer-client');
}

// Функция переключения вкладок КП
function setOfferTab(tab) {
    if (tab !== 'short' && tab !== 'long' && tab !== 'client') {
        console.error("Неверный параметр tab:", tab);
        return;
    }
    activeOfferTab = tab;

    const tabs = document.querySelectorAll('.kp-tab');
    const panels = document.querySelectorAll('.kp-panel');
    if (tabs.length < 3 || panels.length < 3) return;

    tabs.forEach(t => {
        t.classList.remove('active');
        t.style.display = '';
    });
    panels.forEach(p => {
        p.classList.add('hidden');
        p.style.display = 'none';
    });

    if (tab === 'short') {
        tabs[0].classList.add('active');
        const shortPanel = document.getElementById('kp-panel-short');
        if (shortPanel) {
            shortPanel.classList.remove('hidden');
            shortPanel.style.display = 'block';
        }
    } else if (tab === 'long') {
        tabs[1].classList.add('active');
        const longPanel = document.getElementById('kp-panel-long');
        if (longPanel) {
            longPanel.classList.remove('hidden');
            longPanel.style.display = 'block';
        }
    } else {
        tabs[2].classList.add('active');
        const clientPanel = document.getElementById('kp-panel-client');
        if (clientPanel) {
            clientPanel.classList.remove('hidden');
            clientPanel.style.display = 'block';
        }
        if (orderTextFilledBySubmit) {
            orderTextFilledBySubmit = false;
        } else {
            updateClientOfferFromShort();
        }
    }

    const activeTextareaId = tab === 'short' ? 'commercial-offer-short' : (tab === 'long' ? 'commercial-offer' : 'commercial-offer-client');
    updateCharCounter(activeTextareaId);

    // На вкладке «Длинное КП» — две кнопки (КП 1 и КП 2), на остальных — одна «Скопировать КП»
    const copyKP1Btn = document.getElementById('copy-kp1-btn');
    const copyKP2Btn = document.getElementById('copy-kp2-btn');
    const copyFullKPBtn = document.getElementById('copy-full-kp-btn');
    if (tab === 'long') {
        const offerText = document.getElementById('commercial-offer');
        if (offerText) updateCharCounter('commercial-offer');
        if (copyKP1Btn) copyKP1Btn.style.display = '';
        if (copyKP2Btn) copyKP2Btn.style.display = '';
        if (copyFullKPBtn) copyFullKPBtn.style.display = 'none';
    } else {
        if (copyKP1Btn) copyKP1Btn.style.display = 'none';
        if (copyKP2Btn) copyKP2Btn.style.display = 'none';
        if (copyFullKPBtn) copyFullKPBtn.style.display = '';
    }
}

// Функция копирования КП (копирует активную вкладку)
/**
 * Обновляет счетчик символов для указанного textarea
 */
function updateCharCounter(textareaId) {
    const textarea = document.getElementById(textareaId);
    const counterId = textareaId === 'commercial-offer-short' ? 'char-counter-short' : (textareaId === 'commercial-offer-client' ? 'char-counter-client' : 'char-counter-long');
    const counter = document.getElementById(counterId);
    
    if (!textarea || !counter) return;
    
    const text = textarea.value;
    const charCount = text.length;
    const AVITO_LIMIT = 800;
    
    if (textareaId === 'commercial-offer-client') {
        counter.textContent = `Символов: ${charCount} / ${AVITO_LIMIT} (для отправки клиенту)`;
    } else {
        counter.textContent = `Символов: ${charCount} / ${AVITO_LIMIT} (для Авито)`;
    }
    
    if (charCount > AVITO_LIMIT) {
        counter.classList.add('over-limit');
    } else {
        counter.classList.remove('over-limit');
    }
    
    const warningId = textareaId === 'commercial-offer-short' ? 'avito-warning-short' : (textareaId === 'commercial-offer-client' ? null : 'avito-warning-long');
    const warning = warningId ? document.getElementById(warningId) : null;
    if (warning) {
        if (charCount > AVITO_LIMIT) {
            warning.style.display = 'block';
            // Обновляем текст предупреждения с количеством частей
            const partsCount = Math.ceil(charCount / AVITO_LIMIT);
            const warningText = warning.querySelector('p');
            if (warningText) {
                // Проверяем, есть ли ВАРИАНТ 2
                const hasVariant2 = text.includes('ВАРИАНТ 2:');
                if (hasVariant2) {
                    warningText.textContent = `Лимит Авито: ${AVITO_LIMIT} символов. Если превысить лимит, сообщение не отправится и клиент его не увидит. Ваш текст (${charCount} символов) нужно разделить на ${partsCount} ${partsCount === 2 ? 'части' : partsCount === 3 ? 'части' : 'частей'}. Используйте кнопки "Скопировать КП 1" и "Скопировать КП 2" ниже.`;
                } else {
                    warningText.textContent = `Лимит Авито: ${AVITO_LIMIT} символов. Если превысить лимит, сообщение не отправится и клиент его не увидит. Ваш текст (${charCount} символов) нужно разделить на ${partsCount} ${partsCount === 2 ? 'части' : partsCount === 3 ? 'части' : 'частей'}.`;
                }
            }
        } else {
            warning.style.display = 'none';
        }
    }
    
    // Показываем/скрываем кнопки "Скопировать КП 1" и "Скопировать КП 2" только для длинного КП с ВАРИАНТОМ 2
    const copyKP1Btn = document.getElementById('copy-kp1-btn');
    const copyKP2Btn = document.getElementById('copy-kp2-btn');
    const copyFullKPBtn = document.getElementById('copy-full-kp-btn');
    
    if (textareaId === 'commercial-offer' && activeOfferTab === 'long') {
        const hasVariant2 = text.includes('ВАРИАНТ 2:');
        if (hasVariant2 || charCount > AVITO_LIMIT) {
            if (copyKP1Btn) copyKP1Btn.style.display = '';
            if (copyKP2Btn) copyKP2Btn.style.display = '';
            if (copyFullKPBtn) copyFullKPBtn.style.display = 'none';
        } else {
            if (copyKP1Btn) copyKP1Btn.style.display = 'none';
            if (copyKP2Btn) copyKP2Btn.style.display = 'none';
            if (copyFullKPBtn) copyFullKPBtn.style.display = '';
        }
    } else {
        if (copyKP1Btn) copyKP1Btn.style.display = 'none';
        if (copyKP2Btn) copyKP2Btn.style.display = 'none';
        if (copyFullKPBtn) copyFullKPBtn.style.display = '';
    }
}

/**
 * Копирует первую часть длинного КП. Если есть блок «ВАРИАНТ 2» — копирует только первый вариант (всё до «ВАРИАНТ 2»). Иначе при длине > 800 символов — до 800 по границе строки.
 */
function copyKP1() {
    const offerText = document.getElementById('commercial-offer');
    if (!offerText) { showError("Ошибка: текстовое поле не найдено!"); return; }
    
    const fullText = offerText.value;
    if (!fullText || fullText === "Здесь будет ваше коммерческое предложение.") {
        showWarning("Сначала рассчитайте стоимость теплицы, чтобы сформировать коммерческое предложение.");
        return;
    }
    
    const variant2Idx = fullText.indexOf('ВАРИАНТ 2:');
    if (variant2Idx !== -1) {
        copyTextToClipboard(fullText.substring(0, variant2Idx).trim(), "КП 1 скопировано!");
        return;
    }
    
    const AVITO_LIMIT = 800;
    if (fullText.length <= AVITO_LIMIT) {
        copyTextToClipboard(fullText, "КП 1 скопировано!");
        return;
    }
    let cut = AVITO_LIMIT;
    const near = fullText.lastIndexOf('\n', AVITO_LIMIT);
    if (near > AVITO_LIMIT * 0.7) cut = near + 1;
    copyTextToClipboard(fullText.substring(0, cut).trim(), "КП 1 скопировано!");
}

/**
 * Кнопка 2: копирует второе КП целиком (от «ВАРИАНТ 2» до конца — с названием теплицы, характеристиками, итого, датой).
 * Если блока ВАРИАНТ 2 нет — при длине > 800 копирует всё после первых 800 символов для Авито.
 */
function copyKP2() {
    const offerText = document.getElementById('commercial-offer');
    if (!offerText) { showError("Ошибка: текстовое поле не найдено!"); return; }
    
    const fullText = offerText.value;
    if (!fullText || fullText === "Здесь будет ваше коммерческое предложение.") {
        showWarning("Сначала рассчитайте стоимость теплицы, чтобы сформировать коммерческое предложение.");
        return;
    }
    
    const idx = fullText.indexOf('ВАРИАНТ 2:');
    if (idx !== -1) {
        copyTextToClipboard(fullText.substring(idx).trim(), "КП 2 скопировано!");
        return;
    }
    
    const AVITO_LIMIT = 800;
    if (fullText.length <= AVITO_LIMIT) {
        showWarning("Текст помещается в одно сообщение. Используйте кнопку «Скопировать КП 1».");
        return;
    }
    let cut = AVITO_LIMIT;
    const near = fullText.lastIndexOf('\n', AVITO_LIMIT);
    if (near > AVITO_LIMIT * 0.7) cut = near + 1;
    copyTextToClipboard(fullText.substring(cut).trim(), "КП 2 скопировано!");
}

/**
 * Вспомогательная функция для копирования текста в буфер обмена
 */
function copyTextToClipboard(text, successMessage) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showSuccess(successMessage);
        }).catch(() => {
            // Fallback на старый метод
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                showSuccess(successMessage);
            } catch (err) {
                showError("Не удалось скопировать. Попробуйте выделить текст вручную.");
            }
            document.body.removeChild(textarea);
        });
    } else {
        // Fallback для старых браузеров
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showSuccess(successMessage);
        } catch (err) {
            showError("Не удалось скопировать. Попробуйте выделить текст вручную.");
        }
        document.body.removeChild(textarea);
    }
}

/**
 * Разделяет текст на части для Авито (максимум 800 символов на часть)
 * Копирует части по очереди при каждом нажатии
 * @deprecated Используйте copyKP1() и copyKP2() вместо этой функции
 */
function splitForAvito() {
    const textareaId = activeOfferTab === 'short' ? 'commercial-offer-short' : 'commercial-offer';
    const offerText = document.getElementById(textareaId);
    
    if (!offerText) {
        showError("Ошибка: текстовое поле не найдено!");
        return;
    }
    
    const text = offerText.value.trim();
    if (!text || 
        text === "Здесь будет ваше короткое КП." || 
        text === "Здесь будет ваше коммерческое предложение.") {
        showWarning("Сначала рассчитайте стоимость теплицы, чтобы сформировать коммерческое предложение.");
        return;
    }
    
    const AVITO_LIMIT = 800;
    
    if (text.length <= AVITO_LIMIT) {
        showInfo("Текст уже помещается в одно сообщение Авито (до 800 символов).");
        return;
    }
    
    // Проверяем, есть ли уже сохраненные части
    const storageKey = `avito-parts-${textareaId}`;
    const currentIndexKey = `avito-current-index-${textareaId}`;
    const originalTextKey = `avito-original-text-${textareaId}`;
    
    const savedOriginalText = sessionStorage.getItem(originalTextKey);
    const savedParts = sessionStorage.getItem(storageKey);
    
    // Если текст изменился или частей нет - разделяем заново
    let parts = null;
    let currentIndex = 0;
    
    if (savedOriginalText === text && savedParts) {
        // Текст не изменился, используем сохраненные части
        parts = JSON.parse(savedParts);
        currentIndex = parseInt(sessionStorage.getItem(currentIndexKey) || '0', 10);
    }
    
    // Если частей нет или текст изменился - разделяем заново
    if (!parts || parts.length === 0) {
        parts = [];
        let currentPart = '';
        
        // Разделяем по строкам (переносы строк - естественные точки разрыва)
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineWithNewline = i < lines.length - 1 ? line + '\n' : line;
            const testPart = currentPart + lineWithNewline;
            
            if (testPart.length <= AVITO_LIMIT) {
                currentPart = testPart;
            } else {
                // Если текущая часть не пустая, сохраняем её
                if (currentPart.trim()) {
                    parts.push(currentPart.trim());
                }
                
                // Если одна строка больше лимита, режем по словам
                if (line.length > AVITO_LIMIT) {
                    const words = line.split(/(\s+)/);
                    let wordPart = '';
                    for (const word of words) {
                        const testWordPart = wordPart + word;
                        if (testWordPart.length <= AVITO_LIMIT) {
                            wordPart = testWordPart;
                        } else {
                            if (wordPart.trim()) {
                                parts.push(wordPart.trim());
                            }
                            wordPart = word;
                        }
                    }
                    currentPart = wordPart + (i < lines.length - 1 ? '\n' : '');
                } else {
                    currentPart = lineWithNewline;
                }
            }
        }
        
        if (currentPart.trim()) {
            parts.push(currentPart.trim());
        }
        
        // Сохраняем части и оригинальный текст в sessionStorage
        sessionStorage.setItem(storageKey, JSON.stringify(parts));
        sessionStorage.setItem(originalTextKey, text);
        currentIndex = 0;
    }
    
    // Копируем текущую часть
    if (currentIndex < parts.length) {
        const partToCopy = parts[currentIndex];
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(partToCopy).then(() => {
                const totalParts = parts.length;
                const partNumber = currentIndex + 1;
                
                if (partNumber < totalParts) {
                    showSuccess(`📋 Часть ${partNumber} из ${totalParts} скопирована! Нажмите кнопку еще раз для части ${partNumber + 1}.`, null, 4000);
                } else {
                    showSuccess(`📋 Часть ${partNumber} из ${totalParts} скопирована! Все части скопированы.`, null, 4000);
                    // Очищаем сохраненные части после копирования всех
                    sessionStorage.removeItem(storageKey);
                    sessionStorage.removeItem(currentIndexKey);
                    sessionStorage.removeItem(originalTextKey);
                }
                
                // Увеличиваем индекс для следующего копирования
                currentIndex++;
                sessionStorage.setItem(currentIndexKey, currentIndex.toString());
            }).catch(() => {
                showError("Не удалось скопировать. Попробуйте еще раз.");
            });
        } else {
            // Fallback для старых браузеров
            offerText.value = partToCopy;
            offerText.select();
            showInfo(`Часть ${currentIndex + 1} из ${parts.length} выделена. Скопируйте вручную (Ctrl+C).`);
            currentIndex++;
            sessionStorage.setItem(currentIndexKey, currentIndex.toString());
        }
    } else {
        // Все части скопированы, начинаем заново
        sessionStorage.removeItem(storageKey);
        sessionStorage.removeItem(currentIndexKey);
        sessionStorage.removeItem(originalTextKey);
        showInfo("Все части скопированы. Нажмите кнопку еще раз для повторного разделения.");
    }
}

function copyCommercialOffer() {
    const textareaId = activeOfferTab === 'short' ? 'commercial-offer-short' : (activeOfferTab === 'client' ? 'commercial-offer-client' : 'commercial-offer');
    const offerText = document.getElementById(textareaId);
    
    if (!offerText) {
        showError("Ошибка: текстовое поле не найдено!");
        return;
    }
    
    const textValue = offerText.value.trim();
    if (!textValue || 
        textValue === "Здесь будет ваше короткое КП." || 
        textValue === "Здесь будет ваше коммерческое предложение." ||
        textValue === "Здесь будет текст заказа.") {
        showWarning("Сначала рассчитайте стоимость теплицы, чтобы сформировать коммерческое предложение.");
        return;
    }
    
    const AVITO_LIMIT = 800;
    const charCount = textValue.length;
    
    // Проверяем лимит Авито и показываем предупреждение (один раз за сессию)
    if (charCount > AVITO_LIMIT) {
        const warningKey = `avito-warning-shown-${textareaId}`;
        if (!sessionStorage.getItem(warningKey)) {
            const partsCount = Math.ceil(charCount / AVITO_LIMIT);
            showWarning(
                `⚠️ ВНИМАНИЕ! Это длинное КП (${charCount} символов) не отправится в Авито!\n\n` +
                `Лимит Авито: ${AVITO_LIMIT} символов на сообщение.\n` +
                `Если превысить лимит, сообщение не отправится и клиент его не увидит.\n` +
                `Ваш текст нужно разделить на ${partsCount} ${partsCount === 2 ? 'части' : partsCount === 3 ? 'части' : 'частей'}.\n\n` +
                `Используйте кнопки "Скопировать КП 1" и "Скопировать КП 2" ниже.`,
                'Длинное КП не отправится в Авито!',
                6000
            );
            sessionStorage.setItem(warningKey, 'true');
        }
    }
    
    offerText.select();
    offerText.setSelectionRange(0, 99999); // Для мобильных устройств

    try {
        // Используем современный API, если доступен
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textValue).then(() => {
                showSuccess("Коммерческое предложение скопировано!");
            }).catch(() => {
                // Fallback на старый метод
    document.execCommand("copy");
                showSuccess("Коммерческое предложение скопировано!");
            });
        } else {
            // Fallback для старых браузеров
            document.execCommand("copy");
            showSuccess("Коммерческое предложение скопировано!");
        }
    } catch (err) {
        console.error("Ошибка при копировании:", err);
        showError("Не удалось скопировать. Попробуйте выделить текст вручную.");
    }
}

// Функция сброса всех фильтров
async function resetAllFilters() {
    // ВАЖНО: Сначала сбрасываем город, но сохраняем список городов
    resetDropdown('city', 'Выберите город');
    
    // Если список городов пустой, загружаем его заново
    const cityDropdown = document.getElementById('city');
    if (cityDropdown && (cityDropdown.options.length <= 1 || !citiesCache)) {
        await loadCities();
    } else if (cityDropdown && citiesCache && cityDropdown.options.length <= 1) {
        // Восстанавливаем список из кеша
        cityDropdown.innerHTML = '<option value="" disabled selected>Выберите город</option>';
        citiesCache.forEach(city => {
            cityDropdown.innerHTML += `<option value="${city}">${city}</option>`;
        });
    }
    
    // Сбрасываем остальные выпадающие списки
    resetDropdown('form', 'Сначала выберите город');
    resetDropdown('width', 'Сначала выберите форму');
    resetDropdown('length', 'Сначала выберите ширину');
    resetDropdown('frame', 'Сначала выберите длину');
    resetDropdown('arcStep', 'Выберите шаг');
    resetDropdown('polycarbonate', 'Сначала выберите город');

    // Сбрасываем все дополнительные опции (чекбоксы и select'ы)
    resetAdditionalOptions();
    
    // Сбрасываем грядки
    selectedBeds = {};
    localStorage.setItem('selectedBeds', JSON.stringify(selectedBeds));
    
    // Сбрасываем сборку грядок
    bedsAssemblyEnabled = false;
    localStorage.setItem('bedsAssemblyEnabled', 'false');
    const bedsAssemblyCheckbox = document.getElementById('beds-assembly-checkbox');
    if (bedsAssemblyCheckbox) {
        bedsAssemblyCheckbox.checked = false;
    }
    updateBedsCounter();

    // Сбрасываем доставку
    const addressInput = document.getElementById("address");
    if (addressInput) {
        addressInput.value = "";
    }
    
    // Очищаем результат доставки
    const resultDiv = document.getElementById("result");
    if (resultDiv) {
        resultDiv.innerText = "";
    }

    // Очищаем карту
    if (mapInstance && currentRoute) {
        mapInstance.geoObjects.remove(currentRoute);
        currentRoute = null;
    }

    // Сброс глобальной переменной стоимости доставки
    deliveryCost = 0;
    currentDeliveryDate = null;
    currentDeliveryAssemblyDate = null;
    currentDeliveryRestrictions = null;
    updateDeliveryDateDisplay();

    // Сбрасываем текст КП и результатов
    const shortOfferTextarea = document.getElementById("commercial-offer-short");
    const longOfferTextarea = document.getElementById("commercial-offer");
    if (shortOfferTextarea) shortOfferTextarea.value = "Здесь будет ваше короткое КП.";
    if (longOfferTextarea) longOfferTextarea.value = "Здесь будет ваше коммерческое предложение.";
    updateClientOfferFromShort();
    setOfferTab('short');
    
    // Очищаем подсказки адреса
    const suggestionsDiv = document.getElementById("suggestions");
    if (suggestionsDiv) {
        suggestionsDiv.innerHTML = "";
    }
}

// Функция сброса доставки
function resetDelivery() {
    document.getElementById("address").value = "";
    document.getElementById("result").innerText = "";

    // Удаляем маршрут с карты, если есть
    if (mapInstance && currentRoute) {
        mapInstance.geoObjects.remove(currentRoute);
    }

    // Сброс глобальной переменной стоимости доставки
    deliveryCost = 0;
    // Не сбрасываем currentDeliveryDate, т.к. она привязана к выбранному городу
}

// Инициализация при загрузке страницы
window.onload = async function () {
    if (localStorage.getItem('appVersion') !== APP_VERSION) {
        localStorage.clear();
    }
    
    // Загружаем данные грядок из Supabase
    await loadBedsFromSupabase();
    
    const savedLogin = localStorage.getItem('savedLogin');
    var didRunCalculator = false;
    
    if (savedLogin) {
        // Убеждаемся, что admin флаг установлен, если это admin (ДО проверки пароля)
        if (savedLogin === 'admin' || savedLogin.toLowerCase() === 'admin') {
            localStorage.setItem(ADMIN_KEY, 'true');
        }
        
        // Проверяем актуальность версии пароля
        const isPasswordValid = await checkPasswordVersion();
        if (isPasswordValid) {
            document.getElementById("login").value = savedLogin;
            document.getElementById("password").focus();
            document.getElementById("auth-container").classList.add("hidden");
            document.getElementById("calculator-container").classList.remove("hidden");
            
            await initializeCalculator();
            didRunCalculator = true;
        } else {
            // Версия пароля не совпадает - разлогиниваем
            localStorage.clear();
            document.getElementById("login").value = savedLogin;
        }
    }
    if (/[?&]editPhone=/.test(window.location.search)) {
        var o = document.getElementById('edit-order-loading-overlay');
        if (o && !didRunCalculator) o.classList.add('hidden');
    }
    
    // Проверка версии пароля при возврате во вкладку (мгновенный выкид при смене пароля)
    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
            const savedLogin = localStorage.getItem('savedLogin');
            if (savedLogin && document.getElementById("calculator-container") && !document.getElementById("calculator-container").classList.contains("hidden")) {
                await checkPasswordVersion();
            }
        }
    });

    // Периодическая проверка версии пароля каждые 30 секунд
    setInterval(async () => {
        const savedLogin = localStorage.getItem('savedLogin');
        if (savedLogin && document.getElementById("calculator-container") && !document.getElementById("calculator-container").classList.contains("hidden")) {
            await checkPasswordVersion();
        }
    }, 30000);
    
    // Принудительная проверка кнопки админа через 1 секунду (на случай задержки)
    setTimeout(() => {
        const adminBtn = document.getElementById('admin-button');
        if (!adminBtn) return;
        if (ADMIN_PANEL_DISABLED) {
            adminBtn.classList.add('hidden');
            adminBtn.style.display = 'none';
            return;
        }
        const savedLogin = localStorage.getItem('savedLogin');
        const isAdmin = savedLogin && savedLogin.trim().toLowerCase() === 'admin';
        if (isAdmin) {
            adminBtn.classList.remove('hidden');
            adminBtn.style.display = 'block';
            adminBtn.style.visibility = 'visible';
        } else {
            adminBtn.classList.add('hidden');
            adminBtn.style.display = 'none';
            adminBtn.style.visibility = 'hidden';
        }
    }, 1000);
}

// Функция загрузки городов при инициализации калькулятора
async function initializeCalculator() {
    await loadCities();
    // addAdditionalProductsEventListeners() - не нужна, т.к. в HTML уже есть onchange
    
    // Убираем дублирование - в HTML уже есть onchange для polycarbonate и arcStep
    // document.getElementById("polycarbonate").addEventListener("change", calculateGreenhouseCost);
    // document.getElementById("arcStep").addEventListener("change", calculateGreenhouseCost);
    
    // Устанавливаем активной вкладку "Короткое КП" по умолчанию
    setOfferTab('short');
    
    // Проверяем права админа и показываем/скрываем кнопку админ-панели
    const savedLogin = localStorage.getItem('savedLogin');
    
    // СТРОГАЯ проверка: только пользователь с логином точно "admin" (без пробелов, без регистра)
    const isAdmin = savedLogin && savedLogin.trim().toLowerCase() === 'admin';
    
    // Если это админ, но флаг не установлен - устанавливаем
    if (isAdmin && localStorage.getItem(ADMIN_KEY) !== 'true') {
        localStorage.setItem(ADMIN_KEY, 'true');
    }
    
    // Если это НЕ админ, обязательно удаляем флаг
    if (!isAdmin) {
        localStorage.removeItem(ADMIN_KEY);
    }
    
    // Даём немного времени на рендеринг DOM
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const adminButton = document.getElementById("admin-button");
    const logoutButton = document.querySelector(".logout");
    const topButtonsContainer = document.querySelector(".top-buttons-container");
    
    // Убеждаемся, что контейнер и кнопка "Выйти" всегда видимы
    if (topButtonsContainer) {
        topButtonsContainer.style.display = "flex";
        topButtonsContainer.style.visibility = "visible";
        topButtonsContainer.style.opacity = "1";
    }
    if (logoutButton) {
        logoutButton.style.display = "block";
        logoutButton.style.visibility = "visible";
        logoutButton.style.opacity = "1";
    }
    
    if (adminButton) {
        if (ADMIN_PANEL_DISABLED) {
            adminButton.classList.add("hidden");
            adminButton.style.display = "none";
        } else if (isAdmin) {
            adminButton.classList.remove("hidden");
            adminButton.style.display = "block";
            adminButton.style.visibility = "visible";
            adminButton.style.opacity = "1";
            await loadUsersForAdmin();
        } else {
            adminButton.classList.add("hidden");
            adminButton.style.display = "none";
            adminButton.style.visibility = "hidden";
        }
    }
    
    // Инициализация счетчиков символов для КП
    initCharCounters();

    // Deep link: ?editPhone= — оверлей уже показан из HTML; здесь только открываем модалку, поиск, скрываем оверлей в .finally()
    function hideEditOrderLoadingOverlay_() {
        var o = document.getElementById('edit-order-loading-overlay');
        if (o) o.classList.add('hidden');
    }
    var editPhoneParam = new URLSearchParams(window.location.search).get('editPhone');
    if (editPhoneParam) {
        var normalized = typeof normalizePhone === 'function' ? normalizePhone(editPhoneParam) : '';
        if (normalized.length !== 11) {
            hideEditOrderLoadingOverlay_();
        } else {
            var phoneForDeepLink = editPhoneParam;
            requestAnimationFrame(function () {
                setTimeout(function () {
                    try {
                        var p = new URLSearchParams(window.location.search);
                        p.delete('editPhone');
                        var q = p.toString();
                        var cleanUrl = window.location.pathname + (q ? '?' + q : '') + (window.location.hash || '');
                        window.history.replaceState({}, '', cleanUrl);
                    } catch (e) {}
                    if (typeof openEditOrderModalWithPhone !== 'function') { hideEditOrderLoadingOverlay_(); return; }
                    openEditOrderModalWithPhone(phoneForDeepLink, function () { requestAnimationFrame(hideEditOrderLoadingOverlay_); });
                }, 0);
            });
        }
        return;
    }
    var orderIdParam = new URLSearchParams(window.location.search).get('id');
    if (orderIdParam && orderIdParam.trim().length > 10) {
        var orderIdForDeepLink = orderIdParam.trim();
        requestAnimationFrame(function () {
            setTimeout(function () {
                try {
                    var p = new URLSearchParams(window.location.search);
                    p.delete('id');
                    var q = p.toString();
                    var cleanUrl = window.location.pathname + (q ? '?' + q : '') + (window.location.hash || '');
                    window.history.replaceState({}, '', cleanUrl);
                } catch (e) {}
                if (typeof openEditOrderModal !== 'function' || typeof startEditOrder !== 'function') {
                    hideEditOrderLoadingOverlay_();
                    return;
                }
                openEditOrderModal();
                startEditOrder(orderIdForDeepLink, function () { requestAnimationFrame(hideEditOrderLoadingOverlay_); });
            }, 0);
        });
    }
}

/**
 * Инициализирует счетчики символов для textarea КП
 */
function initCharCounters() {
    const shortTextarea = document.getElementById('commercial-offer-short');
    const longTextarea = document.getElementById('commercial-offer');
    const clientTextarea = document.getElementById('commercial-offer-client');
    if (shortTextarea) {
        updateCharCounter('commercial-offer-short');
        shortTextarea.addEventListener('input', () => { updateCharCounter('commercial-offer-short'); });
    }
    if (longTextarea) {
        updateCharCounter('commercial-offer');
        longTextarea.addEventListener('input', () => { updateCharCounter('commercial-offer'); });
    }
    if (clientTextarea) {
        updateCharCounter('commercial-offer-client');
        clientTextarea.addEventListener('input', () => { updateCharCounter('commercial-offer-client'); });
    }
    // Обновление «Текст заказа» при изменении полей формы заказа
    const refreshClientOffer = () => updateClientOfferFromShort();
    const orderIds = ['order-client-name', 'order-client-phone', 'order-manager', 'order-address-part1', 'order-address-part2', 'order-address-part3', 'order-no-plot'];
    orderIds.forEach(function (id) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', refreshClientOffer);
            el.addEventListener('change', refreshClientOffer);
        }
    });
}

// Функция добавления обработчиков событий для дополнительных опций
// Код Яндекс.Карт для подсказок (с debounce для защиты от массовых запросов)
whenYmapsReady(() => {
    const input = document.getElementById('address'); // Поле ввода адреса
    const resultsContainer = document.getElementById('suggestions'); // Используем существующий блок
    let geocodeDebounceTimer = null; // Таймер для debounce подсказок

    input.addEventListener('input', () => {
        const query = input.value.trim();

        // Очищаем предыдущий таймер
        if (geocodeDebounceTimer) {
            clearTimeout(geocodeDebounceTimer);
        }

        // Если запрос слишком короткий, скрываем подсказки
        if (query.length <= 2) {
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
            return;
        }

        // Устанавливаем новый таймер (300мс задержка для подсказок)
        geocodeDebounceTimer = setTimeout(() => {
            ymaps.geocode(query, { results: 5 }).then(res => {
                const items = res.geoObjects.toArray();
                resultsContainer.innerHTML = ''; // Очищаем старые подсказки

                if (items.length === 0) {
                    resultsContainer.style.display = 'none'; // Скрываем контейнер, если нет результатов
                    return;
                } else {
                    resultsContainer.style.display = 'block'; // Показываем контейнер
                }

                items.forEach(item => {
                    const suggestion = document.createElement('div');
                    suggestion.classList.add('suggestion');

                    // Выделяем совпадения жирным
                    const regex = new RegExp(`(${query})`, 'gi');
                    const address = item.getAddressLine();
                    const highlightedAddress = address.replace(regex, '<span class="highlight">$1</span>');
                    suggestion.innerHTML = highlightedAddress;

                    suggestion.addEventListener('click', () => {
                        input.value = address;
                        resultsContainer.innerHTML = ''; // Убираем подсказки
                        resultsContainer.style.display = 'none'; // Скрываем контейнер
                        // Используем debounced версию для защиты от массовых запросов
                        calculateDeliveryDebounced(); // Автоматически рассчитываем доставку при выборе адреса
                    });

                    resultsContainer.appendChild(suggestion);
                });
            }).catch(err => {
                // Ошибка при запросе подсказок - просто скрываем контейнер
                console.error('Ошибка при получении геокодинга:', err);
                resultsContainer.innerHTML = '';
                resultsContainer.style.display = 'none';
            });
        }, 300); // 300мс задержка для подсказок
    });

    // Закрытие подсказок при клике вне области
    document.addEventListener('click', (event) => {
        if (!document.querySelector('.address-container').contains(event.target)) {
            resultsContainer.style.display = 'none';
        }
    });
});

// Общая логика подсказок адреса для трёх полей (регион+город → улица → дом). Используется в форме заказа и в модалке редактирования.
// Разбор по запятым (fallback когда нет структуры от геокодера). Два фрагмента = регион+город (оба в part1), не улица.
function parseAddressToParts_(fullAddress) {
    const parts = fullAddress.split(',').map(function (p) { return p.trim(); }).filter(Boolean);
    if (parts.length >= 3) {
        return { part1: parts.slice(0, -2).join(', '), part2: parts[parts.length - 2], part3: parts[parts.length - 1] };
    }
    if (parts.length === 2) {
        return { part1: parts.join(', '), part2: '', part3: '' };
    }
    if (parts.length === 1) {
        return { part1: parts[0], part2: '', part3: '' };
    }
    return { part1: '', part2: '', part3: '' };
}

// Из GeoObject (ymaps) получаем структуру: регион+город, улица, дом. Как в доставке/пицце: сначала регион и город, потом улица, дом — необязателен (СНТ, деревни).
function parseAddressFromGeoObject_(item) {
    if (!item || typeof item.getAddressLine !== 'function') return { part1: '', part2: '', part3: '' };
    var part1 = '', part2 = '', part3 = '';
    try {
        var areas = [];
        if (typeof item.getAdministrativeAreas === 'function') { var a = item.getAdministrativeAreas(); if (a && a.length) areas = a; }
        if (typeof item.getLocalities === 'function') { var l = item.getLocalities(); if (l && l.length) areas = areas.concat(l); }
        part1 = areas.filter(Boolean).join(', ');
        if (typeof item.getThoroughfare === 'function') { var t = item.getThoroughfare(); if (t) part2 = t; }
        if (typeof item.getPremiseNumber === 'function') { var p = item.getPremiseNumber(); if (p) part3 = p; }
    } catch (e) { }
    if (!part1 && !part2 && !part3) {
        var parsed = parseAddressToParts_(item.getAddressLine());
        part1 = parsed.part1;
        part2 = parsed.part2;
        part3 = parsed.part3;
    }
    return { part1: part1, part2: part2, part3: part3 };
}

function attachTripleAddressSuggestions_(cfg) {
    const part1Input = cfg.part1Input;
    const part2Input = cfg.part2Input;
    const part3Input = cfg.part3Input;
    const getSuggestionEl = cfg.getSuggestionEl;
    const clickOutsideSelector = cfg.clickOutsideSelector;
    if (!part1Input || !part2Input || !part3Input || typeof getSuggestionEl !== 'function') return;
    const containers = [
        { input: part1Input, suggestions: getSuggestionEl(1), getQuery: function () { return part1Input.value.trim(); }, getContext: function () { return ''; } },
        { input: part2Input, suggestions: getSuggestionEl(2), getQuery: function () { return part2Input.value.trim(); }, getContext: function () { return part1Input.value.trim(); } },
        { input: part3Input, suggestions: getSuggestionEl(3), getQuery: function () { return part3Input.value.trim(); }, getContext: function () { return [part1Input.value.trim(), part2Input.value.trim()].filter(Boolean).join(', '); } }
    ];
    const debounceTimers = { 1: null, 2: null, 3: null };

    function showSuggestions(index, query, context) {
        const c = containers[index];
        if (!c || !c.suggestions) return;
        if (query.length <= 1) {
            c.suggestions.innerHTML = '';
            c.suggestions.style.display = 'none';
            return;
        }
        const fullQuery = context ? (context + ', ' + query) : query;
        ymaps.geocode(fullQuery, { results: 5 }).then(function (res) {
            const items = res.geoObjects.toArray();
            c.suggestions.innerHTML = '';
            if (items.length === 0) {
                c.suggestions.style.display = 'none';
                return;
            }
            c.suggestions.style.display = 'block';
            items.forEach(function (item) {
                const suggestion = document.createElement('div');
                suggestion.classList.add('suggestion');
                const parsed = parseAddressFromGeoObject_(item);
                var displayText = item.getAddressLine();
                if (index === 0 && parsed.part1) displayText = parsed.part1;
                else if (index === 1 && parsed.part2) displayText = parsed.part2;
                else if (index === 2 && parsed.part3) displayText = parsed.part3;
                const regex = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
                suggestion.innerHTML = displayText.replace(regex, '<span class="highlight">$1</span>');
                suggestion.addEventListener('click', function () {
                    part1Input.value = parsed.part1;
                    part2Input.value = parsed.part2;
                    part3Input.value = parsed.part3;
                    [1, 2, 3].forEach(function (i) {
                        const s = getSuggestionEl(i);
                        if (s) { s.innerHTML = ''; s.style.display = 'none'; }
                    });
                });
                c.suggestions.appendChild(suggestion);
            });
        }).catch(function () {
            c.suggestions.innerHTML = '';
            c.suggestions.style.display = 'none';
        });
    }

    containers.forEach(function (c, index) {
        if (!c.input || !c.suggestions) return;
        const idx = index + 1;
        c.input.addEventListener('input', function () {
            if (debounceTimers[idx]) clearTimeout(debounceTimers[idx]);
            debounceTimers[idx] = setTimeout(function () {
                showSuggestions(index, c.getQuery(), c.getContext());
            }, 300);
        });
    });

    document.addEventListener('click', function (event) {
        if (event.target.closest(clickOutsideSelector)) return;
        [1, 2, 3].forEach(function (i) {
            const s = getSuggestionEl(i);
            if (s) s.style.display = 'none';
        });
    });
}

// Подсказки адреса: форма заказа + модалка редактирования (регион → улица → дом)
whenYmapsReady(() => {
    attachTripleAddressSuggestions_({
        part1Input: document.getElementById('order-address-part1'),
        part2Input: document.getElementById('order-address-part2'),
        part3Input: document.getElementById('order-address-part3'),
        getSuggestionEl: function (i) { return document.getElementById('order-suggestions-' + i); },
        clickOutsideSelector: '.order-address-container'
    });
    attachTripleAddressSuggestions_({
        part1Input: document.getElementById('edit-order-address-part1'),
        part2Input: document.getElementById('edit-order-address-part2'),
        part3Input: document.getElementById('edit-order-address-part3'),
        getSuggestionEl: function (i) { return document.getElementById('edit-order-suggestions-' + i); },
        clickOutsideSelector: '.edit-order-address-container'
    });
});

// ==================== АДМИН-ПАНЕЛЬ ====================

// Загрузка списка пользователей для админ-панели
async function loadUsersForAdmin() {
    if (ADMIN_PANEL_DISABLED) return;
    try {
        const { data, error } = await supabaseClient.rpc('get_users_for_admin');

        if (error) {
            console.error("Ошибка при загрузке пользователей:", error);
            return;
        }

        const userSelect = document.getElementById('admin-user-select');
        if (!userSelect) return;

        userSelect.innerHTML = '<option value="" disabled selected>Выберите пользователя</option>';
        
        if (data && data.length > 0) {
            data.forEach(user => {
                const option = document.createElement('option');
                option.value = user.user_id;
                option.dataset.login = user.login;
                option.textContent = `${user.login}${!user.is_active ? ' (неактивен)' : ''}`;
                userSelect.appendChild(option);
            });
        }
        // При смене пользователя подставляем текущий логин в поле "Имя пользователя"
        userSelect.onchange = function() {
            const sel = this.options[this.selectedIndex];
            const loginInput = document.getElementById('admin-new-login');
            if (loginInput) loginInput.value = sel && sel.value ? (sel.dataset.login || '') : '';
        };
    } catch (err) {
        console.error("Ошибка при загрузке пользователей:", err);
    }
}

// Переключение видимости админ-панели
function toggleAdminPanel() {
    if (ADMIN_PANEL_DISABLED) {
        if (typeof showWarning === 'function') return showWarning('Админ-панель временно недоступна. Смена пароля/логина — через Supabase SQL Editor.', 'Админка');
        return;
    }
    const adminPanel = document.getElementById("admin-panel");
    if (!adminPanel) return;

    const isHidden = adminPanel.classList.contains("hidden");
    const adminButton = document.getElementById("admin-button");
    const logoutButton = document.querySelector(".logout");
    const topButtonsContainer = document.querySelector(".top-buttons-container");
    
    // Убеждаемся, что контейнер и кнопка "Выйти" всегда видимы
    if (topButtonsContainer) {
        topButtonsContainer.style.display = "flex";
        topButtonsContainer.style.visibility = "visible";
        topButtonsContainer.style.opacity = "1";
    }
    if (logoutButton) {
        logoutButton.style.display = "block";
        logoutButton.style.visibility = "visible";
        logoutButton.style.opacity = "1";
    }
    
    if (isHidden) {
        // Проверяем права админа: только логин "admin"
        const savedLogin = localStorage.getItem('savedLogin');
        const isAdmin = savedLogin && savedLogin.trim().toLowerCase() === 'admin';
        if (!isAdmin) {
            showError("У вас нет прав доступа к админ-панели.");
            return;
        }
        adminPanel.classList.remove("hidden");
        loadUsersForAdmin();
        // Очищаем поля при открытии
        const loginInput = document.getElementById("admin-new-login");
        if (loginInput) loginInput.value = "";
        document.getElementById("admin-new-password").value = "";
        document.getElementById("admin-confirm-password").value = "";
        document.getElementById("admin-message").innerText = "";
    } else {
        adminPanel.classList.add("hidden");
    }
}

// Изменение пароля и/или имени (логина) пользователя
async function changeUserPassword() {
    if (ADMIN_PANEL_DISABLED) return;
    const userSelect = document.getElementById("admin-user-select");
    const userId = userSelect.value;
    const newLogin = (document.getElementById("admin-new-login") && document.getElementById("admin-new-login").value.trim()) || '';
    const newPassword = document.getElementById("admin-new-password").value.trim();
    const confirmPassword = document.getElementById("admin-confirm-password").value.trim();
    const messageDiv = document.getElementById("admin-message");

    const currentLogin = userSelect.selectedOptions[0] ? (userSelect.selectedOptions[0].dataset.login || userSelect.selectedOptions[0].textContent.split(' (')[0]) : '';

    // Валидация
    if (!userId) {
        messageDiv.innerText = "Выберите пользователя!";
        messageDiv.style.color = "red";
        return;
    }

    const wantLoginChange = newLogin && newLogin !== currentLogin;
    const wantPasswordChange = !!newPassword;

    if (!wantLoginChange && !wantPasswordChange) {
        messageDiv.innerText = "Введите новое имя пользователя и/или новый пароль!";
        messageDiv.style.color = "red";
        return;
    }

    if (wantPasswordChange) {
        if (newPassword.length < 6) {
            messageDiv.innerText = "Пароль должен содержать минимум 6 символов!";
            messageDiv.style.color = "red";
            return;
        }
        if (newPassword !== confirmPassword) {
            messageDiv.innerText = "Пароли не совпадают!";
            messageDiv.style.color = "red";
            return;
        }
    }

    // Проверяем права админа: только логин "admin"
    const savedLoginAdmin = localStorage.getItem('savedLogin');
    const isAdminUser = savedLoginAdmin && savedLoginAdmin.trim().toLowerCase() === 'admin';
    if (!isAdminUser) {
        messageDiv.innerText = "У вас нет прав для изменения пользователей!";
        messageDiv.style.color = "red";
        return;
    }

    try {
        const updates = [];
        if (wantLoginChange) updates.push('имя (логин)');
        if (wantPasswordChange) updates.push('пароль');

        // 1. Изменение логина (если нужно)
        if (wantLoginChange) {
            const { error: loginError } = await supabaseClient.rpc('update_user_login', {
                p_user_id: userId,
                p_new_login: newLogin
            });

            if (loginError) {
                const sqlLogin = `UPDATE users SET login = '${newLogin.replace(/'/g, "''")}', updated_at = NOW() WHERE id = '${userId}';`;
                messageDiv.innerHTML = `
                    <strong style="color: orange;">⚠️ Не удалось изменить логин через интерфейс.</strong><br><br>
                    <strong>Используйте SQL Editor в Supabase:</strong><br>
                    <textarea style="width: 100%; height: 60px; margin-top: 10px; font-family: monospace;" readonly>${sqlLogin}</textarea>
                `;
                messageDiv.style.color = "orange";
                console.error("Ошибка обновления логина:", loginError);
                return;
            }
        }

        // 2. Изменение пароля (если нужно)
        if (wantPasswordChange) {
            const userLoginForRpc = wantLoginChange ? newLogin : currentLogin;
            const { error: rpcError } = await supabaseClient.rpc('update_user_password', {
                p_login: userLoginForRpc,
                p_new_password: newPassword
            });

            if (rpcError) {
                const sqlQuery = `-- Выполните в Supabase SQL Editor (RPC не сработал)
SELECT update_user_password('${(wantLoginChange ? newLogin : currentLogin).replace(/'/g, "''")}', '${newPassword.replace(/'/g, "''")}');`;
                messageDiv.innerHTML = `
                    <strong style="color: orange;">⚠️ Не удалось изменить пароль через интерфейс.</strong><br><br>
                    <strong>Используйте SQL Editor в Supabase:</strong><br>
                    <textarea style="width: 100%; height: 80px; margin-top: 10px; font-family: monospace;" readonly>${sqlQuery}</textarea>
                    <p style="margin-top: 10px;">Скопируйте SQL запрос выше и выполните его в SQL Editor.</p>
                `;
                messageDiv.style.color = "orange";
                console.error("Ошибка обновления пароля:", rpcError);
                return;
            }
        }

        messageDiv.innerText = `✅ Изменения сохранены (${updates.join(', ')}). Пользователь будет разлогинен при возврате во вкладку или в течение 30 секунд.`;
        messageDiv.style.color = "green";

        document.getElementById("admin-new-login").value = "";
        document.getElementById("admin-new-password").value = "";
        document.getElementById("admin-confirm-password").value = "";
        document.getElementById("admin-user-select").value = "";

        await loadUsersForAdmin();

    } catch (err) {
        console.error("Ошибка при сохранении изменений:", err);
        messageDiv.innerText = `❌ Ошибка: ${err.message}`;
        messageDiv.style.color = "red";
    }
}

// ==================== МОДАЛЬНОЕ ОКНО С ДАТАМИ ДОСТАВКИ ====================

var _deliveryModalCitySummary = [];
var _deliveryModalFilteredSummary = [];
var _deliveryModalSelectedCity = null;
var _deliveryModalCalMonth = null;
var _deliveryModalStateMapCache = {};
var _deliveryModalCurrentStateMap = {};

async function showDeliveryDatesModal() {
    var modal = document.getElementById('delivery-dates-modal');
    var loadingDiv = document.getElementById('delivery-dates-loading');
    var contentDiv = document.getElementById('delivery-dates-content');
    if (!modal) {
        console.error("Модальное окно не найдено!");
        alert("Ошибка: модальное окно не найдено. Обновите страницу.");
        return;
    }
    try {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        if (loadingDiv) {
            loadingDiv.style.display = 'block';
            loadingDiv.innerHTML = 'Загрузка данных...';
        }
        if (contentDiv) contentDiv.style.display = 'none';
        await loadDeliveryDatesModalData();
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (contentDiv) contentDiv.style.display = 'flex';
    } catch (err) {
        console.error("Ошибка при открытии модального окна:", err);
        if (loadingDiv) {
            loadingDiv.innerHTML = '<div class="no-data" style="color: red; padding: 20px;">Ошибка загрузки. ' + (err.message || '') + '</div>';
        }
    }
}

async function refreshDeliveryDates() {
    var loadingDiv = document.getElementById('delivery-dates-loading');
    var contentDiv = document.getElementById('delivery-dates-content');
    if (loadingDiv) {
        loadingDiv.style.display = 'block';
        loadingDiv.innerHTML = 'Обновление данных...';
    }
    if (contentDiv) contentDiv.style.display = 'none';
    try {
        await loadDeliveryDatesModalData();
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (contentDiv) contentDiv.style.display = 'flex';
        if (typeof showSuccess === 'function') showSuccess('Данные обновлены', '');
    } catch (err) {
        console.error("Ошибка обновления:", err);
        if (loadingDiv) loadingDiv.innerHTML = '<div class="no-data" style="color: red; padding: 20px;">' + (err.message || '') + '</div>';
        if (typeof showError === 'function') showError('Не удалось обновить', '');
    }
}

// Убеждаемся, что функция доступна глобально
window.showDeliveryDatesModal = showDeliveryDatesModal;
window.closeDeliveryDatesModal = closeDeliveryDatesModal;
window.refreshDeliveryDates = refreshDeliveryDates;
window.updateDeliveryResultDate = updateDeliveryResultDate;

// Функция закрытия модального окна
function closeDeliveryDatesModal() {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    var modal = document.getElementById('delivery-dates-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

function buildStateMapFromRows(rows, todayMoscow) {
    var stateMap = Object.create(null);
    for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var iso = normalizeDeliveryCalendarISO(r.delivery_date);
        if (!iso) continue;
        stateMap[iso] = {
            withoutAssembly: !!r.available_without_assembly,
            withAssembly: !!r.available_with_assembly,
            rawStatus: r.raw_status || null
        };
    }
    return stateMap;
}

function getNearestFromStateMap(stateMap, todayISO, withAssembly) {
    var p = todayISO.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    for (var i = 0; i < 400; i++) {
        d.setDate(d.getDate() + 1);
        var iso = formatISOLocal(d);
        if (iso <= todayISO) continue;
        var meta = stateMap[iso];
        if (!meta) return iso;
        var ok = withAssembly ? meta.withAssembly : meta.withoutAssembly;
        if (ok) return iso;
    }
    return null;
}

function getDeliveryModalCellState(cellISO, todayISO, stateMap) {
    if (cellISO <= todayISO) return 'past';
    var meta = stateMap[cellISO];
    if (!meta) return 'available';
    var rs = (meta.rawStatus || '').toString().toUpperCase().trim();
    if (rs === 'ДС') return 'available';
    if (rs === 'Д') return 'only-delivery';
    if (rs === 'С') return 'only-assembly';
    if (rs === 'X' || rs === 'Х') return 'blocked';
    if (meta.withoutAssembly && meta.withAssembly) return 'available';
    if (meta.withoutAssembly && !meta.withAssembly) return 'only-delivery';
    if (!meta.withoutAssembly && meta.withAssembly) return 'only-assembly';
    return 'blocked';
}

async function loadDeliveryDatesModalData() {
    var listEl = document.getElementById('delivery-dates-city-list');
    if (!listEl) return;
    var standardCityNames = {
        'санкт-петербург': 'Санкт-Петербург', 'москва': 'Москва', 'нижний новгород': 'Нижний Новгород',
        'набережные челны': 'Набережные Челны', 'великий новгород': 'Великий Новгород',
        'йошкар-ола': 'Йошкар-Ола', 'орёл': 'Орёл'
    };
    var todayISO = getTodayMoscowISO();
    var dd = new Date(+todayISO.split('-')[0], +todayISO.split('-')[1] - 1, +todayISO.split('-')[2]);
    var endD = new Date(dd.getTime() + 95 * 86400000);
    var endStr = endD.getFullYear() + '-' + String(endD.getMonth() + 1).padStart(2, '0') + '-' + String(endD.getDate()).padStart(2, '0');
    var datesQ = supabaseClient.from('delivery_dates').select('city_name, delivery_date, assembly_date, restrictions').order('city_name');
    var datesRes = await datesQ;
    var data = datesRes.data || [];
    var error = datesRes.error;
    var calData = [];
    var calPage = 0;
    var calPageSize = 1000;
    while (true) {
        var calRes = await supabaseClient.from('delivery_calendar').select('city_name, delivery_date, available_without_assembly, available_with_assembly, raw_status').gte('delivery_date', todayISO).lte('delivery_date', endStr).order('delivery_date').range(calPage * calPageSize, (calPage + 1) * calPageSize - 1);
        if (calRes.error) throw calRes.error;
        if (!calRes.data || calRes.data.length === 0) break;
        calData = calData.concat(calRes.data);
        if (calRes.data.length < calPageSize) break;
        calPage++;
    }
    if (error && error.code === '42703') {
        var fb = await supabaseClient.from('delivery_dates').select('city_name, delivery_date').order('city_name');
        if (!fb.error && fb.data) {
            data = fb.data.map(function (i) { return { city_name: i.city_name, delivery_date: i.delivery_date, assembly_date: null, restrictions: null }; });
            error = null;
        }
    }
    var calByCity = {};
    for (var c = 0; c < calData.length; c++) {
        var row = calData[c];
        var cn = cleanDeliveryCityName(row.city_name);
        var nn = normalizeCityName(cn);
        if (!calByCity[nn]) calByCity[nn] = [];
        calByCity[nn].push(row);
    }
    var normalizedMap = {};
    var deliveryDatesByCity = {};
    var canonical = data.filter(function (i) { return !/ доставки$/i.test(i.city_name); });
    for (var i = 0; i < canonical.length; i++) {
        var item = canonical[i];
        var cleaned = cleanDeliveryCityName(item.city_name);
        var key = normalizeCityName(cleaned);
        if (normalizedMap[key]) continue;
        var name = standardCityNames[key] || (cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase());
        normalizedMap[key] = { city_name: name };
        deliveryDatesByCity[name] = { delivery_date: item.delivery_date, assembly_date: item.assembly_date };
    }
    for (var nnKey in calByCity) {
        if (normalizedMap[nnKey]) continue;
        var calCityName = standardCityNames[nnKey] || (nnKey.charAt(0).toUpperCase() + nnKey.slice(1).toLowerCase());
        normalizedMap[nnKey] = { city_name: calCityName };
    }
    var cityList = Object.keys(normalizedMap).map(function (k) { return normalizedMap[k].city_name; });
    if (cityList.length === 0) {
        listEl.innerHTML = '<div class="no-data">Нет данных о городах.</div>';
        return;
    }
    cityList.sort(function (a, b) {
        var ca = (a || '').toLowerCase().trim();
        var cb = (b || '').toLowerCase().trim();
        if (ca === 'москва') return -1;
        if (cb === 'москва') return 1;
        if (ca === 'санкт-петербург') return -1;
        if (cb === 'санкт-петербург') return 1;
        return ca.localeCompare(cb, 'ru');
    });
    _deliveryModalCitySummary = [];
    _deliveryModalStateMapCache = {};
    var fmt = function (iso) {
        if (!iso) return '—';
        return typeof isoDateToDdMm === 'function' ? isoDateToDdMm(iso) : iso;
    };
    for (var j = 0; j < cityList.length; j++) {
        var city = cityList[j];
        var nw = null;
        var naw = null;
        var stateMap = null;
        var calRows = calByCity[normalizeCityName(city)];
        if (calRows && calRows.length > 0) {
            stateMap = buildStateMapFromRows(calRows, todayISO);
            nw = getNearestFromStateMap(stateMap, todayISO, false);
            naw = getNearestFromStateMap(stateMap, todayISO, true);
            _deliveryModalStateMapCache[city] = stateMap;
        } else {
            var fd = deliveryDatesByCity[city];
            if (fd && fd.delivery_date) {
                var isoD = typeof deliveryDateDdMmToISO === 'function' ? deliveryDateDdMmToISO(fd.delivery_date) : null;
                nw = isoD;
                naw = fd.assembly_date && typeof deliveryDateDdMmToISO === 'function' ? deliveryDateDdMmToISO(fd.assembly_date) : isoD;
            }
        }
        _deliveryModalCitySummary.push({
            city: city,
            nearestWithout: fmt(nw),
            nearestWith: fmt(naw || nw),
            hasCalendar: !!stateMap
        });
    }
    _deliveryModalFilteredSummary = _deliveryModalCitySummary.slice();
    renderDeliveryDatesCityList(_deliveryModalFilteredSummary);
    setupDeliveryDatesModalSearch();
    var defaultCity = cityList.indexOf('Москва') >= 0 ? 'Москва' : (cityList[0] || null);
    _deliveryModalSelectedCity = defaultCity;
    var now = getMoscowTodayDateObject();
    _deliveryModalCalMonth = { year: now.getFullYear(), month: now.getMonth() };
    if (defaultCity && _deliveryModalStateMapCache[defaultCity]) {
        var placeholder = document.getElementById('delivery-dates-cal-placeholder');
        var panel = document.getElementById('delivery-dates-cal-panel');
        var cityEl = document.getElementById('delivery-dates-cal-city');
        if (placeholder) placeholder.style.display = 'none';
        if (panel) panel.style.display = 'flex';
        if (cityEl) cityEl.textContent = defaultCity;
        _deliveryModalCurrentStateMap = _deliveryModalStateMapCache[defaultCity];
        renderDeliveryModalCalendar();
    } else if (defaultCity) {
        loadDeliveryDate(defaultCity).then(function () {
            _deliveryModalCurrentStateMap = currentDeliveryDateStateMap;
            var placeholder = document.getElementById('delivery-dates-cal-placeholder');
            var panel = document.getElementById('delivery-dates-cal-panel');
            var cityEl = document.getElementById('delivery-dates-cal-city');
            if (placeholder) placeholder.style.display = 'none';
            if (panel) panel.style.display = 'flex';
            if (cityEl) cityEl.textContent = defaultCity;
            renderDeliveryModalCalendar();
        });
    } else {
        var placeholder = document.getElementById('delivery-dates-cal-placeholder');
        var panel = document.getElementById('delivery-dates-cal-panel');
        if (placeholder) placeholder.style.display = 'flex';
        if (panel) panel.style.display = 'none';
    }
}

function renderDeliveryDatesCityList(summary) {
    var listEl = document.getElementById('delivery-dates-city-list');
    if (!listEl) return;
    if (!summary || summary.length === 0) {
        listEl.innerHTML = '<div class="no-data">Нет данных.</div>';
        return;
    }
    var html = '';
    for (var i = 0; i < summary.length; i++) {
        var s = summary[i];
        var sel = s.city === _deliveryModalSelectedCity ? ' selected' : '';
        var cityEsc = (s.city || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += '<div class="delivery-dates-city-item' + sel + '" data-city="' + cityEsc + '">';
        html += '<div class="delivery-dates-city-name">' + (s.city || '') + '</div>';
        html += '<div class="delivery-dates-city-dates">без сборки: ' + (s.nearestWithout || '—') + ' · со сборкой: ' + (s.nearestWith || '—') + '</div>';
        html += '</div>';
    }
    listEl.innerHTML = html;
}

function setupDeliveryDatesModalSearch() {
    var input = document.getElementById('delivery-dates-search');
    if (!input) return;
    var clone = input.cloneNode(true);
    input.parentNode.replaceChild(clone, input);
    clone.addEventListener('input', function () {
        var term = (clone.value || '').trim().toLowerCase();
        _deliveryModalFilteredSummary = !term ? _deliveryModalCitySummary.slice() : _deliveryModalCitySummary.filter(function (s) {
            return normalizeCityName(s.city).indexOf(normalizeCityName(term)) !== -1;
        });
        renderDeliveryDatesCityList(_deliveryModalFilteredSummary);
    });
}

function deliveryModalSelectCity(city) {
    if (!city) return;
    _deliveryModalSelectedCity = city;
    var cached = _deliveryModalStateMapCache[city];
    if (cached) {
        _deliveryModalCurrentStateMap = cached;
        var now = getMoscowTodayDateObject();
        if (!_deliveryModalCalMonth) _deliveryModalCalMonth = { year: now.getFullYear(), month: now.getMonth() };
        var placeholder = document.getElementById('delivery-dates-cal-placeholder');
        var panel = document.getElementById('delivery-dates-cal-panel');
        var cityEl = document.getElementById('delivery-dates-cal-city');
        if (placeholder) placeholder.style.display = 'none';
        if (panel) panel.style.display = 'flex';
        if (cityEl) cityEl.textContent = city;
        renderDeliveryModalCalendar();
        renderDeliveryDatesCityList(_deliveryModalFilteredSummary);
        return;
    }
    loadDeliveryDate(city).then(function () {
        _deliveryModalCurrentStateMap = currentDeliveryDateStateMap || {};
        var now = getMoscowTodayDateObject();
        _deliveryModalCalMonth = { year: now.getFullYear(), month: now.getMonth() };
        var placeholder = document.getElementById('delivery-dates-cal-placeholder');
        var panel = document.getElementById('delivery-dates-cal-panel');
        var cityEl = document.getElementById('delivery-dates-cal-city');
        if (placeholder) placeholder.style.display = 'none';
        if (panel) panel.style.display = 'flex';
        if (cityEl) cityEl.textContent = city;
        renderDeliveryModalCalendar();
        renderDeliveryDatesCityList(_deliveryModalFilteredSummary);
    });
}

function deliveryModalCalNav(dir) {
    if (!_deliveryModalCalMonth) return;
    _deliveryModalCalMonth.month += dir;
    if (_deliveryModalCalMonth.month > 11) { _deliveryModalCalMonth.month = 0; _deliveryModalCalMonth.year++; }
    if (_deliveryModalCalMonth.month < 0) { _deliveryModalCalMonth.month = 11; _deliveryModalCalMonth.year--; }
    renderDeliveryModalCalendar();
}

function renderDeliveryModalCalendar() {
    var grid = document.getElementById('delivery-dates-cal-grid');
    var titleEl = document.getElementById('delivery-dates-cal-title');
    if (!grid || !titleEl || !_deliveryModalCalMonth) return;
    var todayISO = getTodayMoscowISO();
    var y = _deliveryModalCalMonth.year;
    var m = _deliveryModalCalMonth.month;
    var monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    titleEl.textContent = monthNames[m] + ' ' + y;
    var firstDay = new Date(y, m, 1);
    var startDow = (firstDay.getDay() + 6) % 7;
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    grid.innerHTML = '';
    for (var blank = 0; blank < startDow; blank++) {
        var empty = document.createElement('span');
        empty.className = 'order-cal-day other-month';
        grid.appendChild(empty);
    }
    for (var day = 1; day <= daysInMonth; day++) {
        var cellDate = new Date(y, m, day);
        var cellISO = formatISOLocal(cellDate);
        var btn = document.createElement('span');
        btn.className = 'order-cal-day';
        btn.textContent = day;
        var stateMap = _deliveryModalCurrentStateMap || {};
        var state = getDeliveryModalCellState(cellISO, todayISO, stateMap);
        if (state === 'past') btn.classList.add('past');
        else if (state === 'available') btn.classList.add('available');
        else if (state === 'only-delivery') btn.classList.add('only-delivery');
        else if (state === 'only-assembly') btn.classList.add('only-assembly');
        else btn.classList.add('blocked');
        grid.appendChild(btn);
    }
}

// Убеждаемся, что функции доступны глобально для onclick
window.showDeliveryDatesModal = showDeliveryDatesModal;
window.closeDeliveryDatesModal = closeDeliveryDatesModal;
window.setOfferTab = setOfferTab;

// Закрытие модального окна при клике вне его (инициализация при загрузке)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDeliveryDatesModal);
} else {
    initDeliveryDatesModal();
}

function initDeliveryDatesModal() {
    var listEl = document.getElementById('delivery-dates-city-list');
    if (listEl) {
        listEl.addEventListener('click', function (e) {
            var item = e.target && e.target.closest ? e.target.closest('.delivery-dates-city-item') : null;
            if (item) deliveryModalSelectCity(item.getAttribute('data-city') || '');
        });
    }
    document.addEventListener('click', function (event) {
        var modal = document.getElementById('delivery-dates-modal');
        if (modal && !modal.classList.contains('hidden')) {
            var modalContent = modal.querySelector('.delivery-dates-modal-content');
            if (modalContent && !modalContent.contains(event.target) && event.target === modal) {
                closeDeliveryDatesModal();
            }
        }
    });

    // Закрытие модального окна по клавише Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            var confirmDialog = document.getElementById('edit-order-close-confirm');
            if (confirmDialog && !confirmDialog.classList.contains('hidden')) {
                if (typeof hideEditOrderCloseConfirm === 'function') hideEditOrderCloseConfirm();
                return;
            }
            var editModal = document.getElementById('edit-order-modal');
            if (editModal && !editModal.classList.contains('hidden')) {
                if (typeof requestCloseEditOrderModal === 'function') requestCloseEditOrderModal();
                return;
            }
            closeDeliveryDatesModal();
            closeFAQModal();
            closeBedsModal();
            closeEditOrderModal();
        }
    });
}

/** Элемент, с которого открыли модалку — для возврата фокуса при закрытии (доступность). */
var editOrderModalPreviousFocus = null;

/** Открыть модальное окно «Редактирование заказа» */
function openEditOrderModal() {
    var modal = document.getElementById('edit-order-modal');
    if (!modal) return;
    editOrderModalPreviousFocus = document.activeElement;
    closeEditOrderAddPanel();
    showEditOrderStep(1);
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    document.body.style.overflow = 'hidden';
    var body = document.getElementById('edit-order-modal-body');
    if (body) body.scrollTop = 0;
    var first = document.getElementById('edit-order-phone');
    if (first) setTimeout(function () { first.focus(); }, 50);
}

/**
 * Открыть модалку «Редактирование заказа» с подставленным телефоном и сразу запустить поиск заказов.
 * Одна точка входа для deep link (?editPhone=) и для кнопки «Изменить заказ» после оформления.
 * @param {string} phone — телефон (11 цифр или как в форме)
 * @param {function} [optFinally] — вызывается в .finally() после поиска (например скрыть оверлей при deep link)
 */
function openEditOrderModalWithPhone(phone, optFinally) {
    if (typeof openEditOrderModal !== 'function') return;
    openEditOrderModal();
    var phoneInput = document.getElementById('edit-order-phone');
    var hintEl = document.getElementById('edit-order-search-hint');
    if (phoneInput && !phoneInput.value) phoneInput.value = phone;
    if (hintEl) { hintEl.style.display = ''; hintEl.textContent = 'Поиск...'; hintEl.className = 'edit-order-hint'; }
    if (typeof searchOrdersByPhone !== 'function') {
        if (typeof optFinally === 'function') optFinally();
        return;
    }
    searchOrdersByPhone(phone).then(function (orders) {
        if (typeof renderEditOrderList === 'function') renderEditOrderList(orders);
        if (orders.length === 0 && typeof clearEditOrderForm === 'function') clearEditOrderForm();
        if (hintEl) {
            hintEl.textContent = orders.length ? 'Найдено заказов: ' + orders.length : '';
            hintEl.className = 'edit-order-hint';
        }
    }).catch(function (err) {
        if (hintEl) { hintEl.textContent = 'Ошибка поиска: ' + (err.message || 'попробуйте позже'); hintEl.className = 'edit-order-hint edit-order-hint--error'; }
        if (typeof renderEditOrderList === 'function') renderEditOrderList([]);
    }).finally(function () {
        if (typeof optFinally === 'function') optFinally();
    });
}

/** Есть ли несохранённые изменения относительно загруженного/сохранённого на сервер состояния (не считая добавление товара как «уже сохранённое»). */
function hasEditOrderUnsavedChanges() {
    if (!currentOrderIdForEdit) return false;
    var compositionChanged = lastPersistedEditOrderState != null && JSON.stringify(getEditOrderStateSnapshot()) !== JSON.stringify(lastPersistedEditOrderState);
    var formChanged = lastPersistedEditOrderFormState != null && JSON.stringify(getEditOrderFormSnapshot()) !== JSON.stringify(lastPersistedEditOrderFormState);
    return compositionChanged || formChanged;
}

/** Сохранённое состояние дат доставки оформления заказа (восстанавливаем при закрытии модалки редактирования после loadDeliveryDate по адресу заказа). */
var _savedDeliveryDateState = null;

/** Закрыть модальное окно «Редактирование заказа» (без проверки несохранённых). */
function closeEditOrderModal() {
    var modal = document.getElementById('edit-order-modal');
    if (!modal) return;
    if (_savedDeliveryDateState) {
        currentDeliveryDate = _savedDeliveryDateState.date;
        currentDeliveryAssemblyDate = _savedDeliveryDateState.assembly;
        currentDeliveryRestrictions = _savedDeliveryDateState.restrictions;
        deliveryDatesFromCalendar = _savedDeliveryDateState.fromCalendar || false;
        currentDeliveryDateStateMap = _savedDeliveryDateState.stateMap || Object.create(null);
        _savedDeliveryDateState = null;
        if (typeof populateOrderDeliveryDate === 'function') populateOrderDeliveryDate();
    }
    closeEditOrderCalendar();
    lastPersistedEditOrderState = null;
    lastPersistedEditOrderFormState = null;
    // При любом закрытии модалки сбрасываем id редактируемого заказа, иначе форма «Оформить заказ»
    // при следующей отправке сделает update этого заказа вместо insert (обратная связь: «оформляла на Дмитрия — изменился заказ Надежды»).
    if (typeof currentOrderIdForEdit !== 'undefined') currentOrderIdForEdit = null;
    if (typeof currentOrderCreatedAtForEdit !== 'undefined') currentOrderCreatedAtForEdit = null;
    var titleEl = document.getElementById('edit-order-modal-title');
    if (titleEl) titleEl.textContent = typeof EDIT_ORDER_MODAL_TITLE_BASE !== 'undefined' ? EDIT_ORDER_MODAL_TITLE_BASE : 'Редактирование заказа';
    // Сброс шага 1: поле поиска и список, чтобы при следующем открытии не оставался старый номер (защита от дурака и случайности).
    setEditOrderFieldValue('edit-order-phone', '');
    if (typeof showEditOrderStep === 'function') showEditOrderStep(1);
    var listContainer = document.getElementById('edit-order-list');
    if (listContainer) listContainer.innerHTML = '<p class="edit-order-list-placeholder">Введите телефон и нажмите «Найти».</p>';
    var searchHint = document.getElementById('edit-order-search-hint');
    if (searchHint) { searchHint.style.display = 'none'; searchHint.textContent = ''; }
    modal.classList.add('hidden');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    if (editOrderModalPreviousFocus && typeof editOrderModalPreviousFocus.focus === 'function' && document.body.contains(editOrderModalPreviousFocus)) {
        editOrderModalPreviousFocus.focus();
    }
    editOrderModalPreviousFocus = null;
}

/** Показать диалог «Есть несохранённые данные. Закрыть?»; при подтверждении вызвать callback. */
function showEditOrderCloseConfirm(callbackOnDiscard) {
    var el = document.getElementById('edit-order-close-confirm');
    if (!el) return;
    editOrderCloseConfirmCallback = typeof callbackOnDiscard === 'function' ? callbackOnDiscard : null;
    el.classList.remove('hidden');
}

/** Скрыть диалог подтверждения закрытия и сбросить колбэк. */
function hideEditOrderCloseConfirm() {
    var el = document.getElementById('edit-order-close-confirm');
    if (el) el.classList.add('hidden');
    editOrderCloseConfirmCallback = null;
}

/** Запросить закрытие модалки: при несохранённых изменениях — кастомный диалог. Возвращает true, если модалка закрыта или не открыта; иначе false. */
function requestCloseEditOrderModal() {
    var modal = document.getElementById('edit-order-modal');
    var confirmEl = document.getElementById('edit-order-close-confirm');
    if (!modal || modal.classList.contains('hidden')) return true;
    if (confirmEl && !confirmEl.classList.contains('hidden')) {
        hideEditOrderCloseConfirm();
        return false;
    }
    if (hasEditOrderUnsavedChanges()) {
        showEditOrderCloseConfirm(function () {
            hideEditOrderCloseConfirm();
            closeEditOrderModal();
        });
        return false;
    }
    closeEditOrderModal();
    return true;
}

/** Поиск заказов в Supabase по телефону (нормализованный, 11 цифр с 7). Возвращает массив заказов. */
async function searchOrdersByPhone(phone) {
    var normalized = normalizePhone(phone);
    if (!normalized || normalized.length !== 11) return [];
    var list = await supabaseClient
        .from('orders')
        .select('id, created_at, client_name, client_phone, status, delivery_date, delivery_address, source, manager, comment, model, width, length, total, quantity, unit_price, line_items, extras, assembly, delivery_cost')
        .eq('client_phone', normalized)
        .order('created_at', { ascending: false })
        .limit(30);
    if (list.error) throw list.error;
    return list.data || [];
}

/** Число из total/delivery_cost/item_total: поддерживает "24.040" (точка — разделитель тысяч). */
function parseOrderPrice_(val) {
    if (val == null || val === '') return 0;
    var s = String(val).replace(/\s/g, '').trim();
    if (!s) return 0;
    if (/^\d{1,3}(\.\d{3})*$/.test(s)) return parseInt(s.replace(/\./g, ''), 10);
    var n = parseInt(s, 10);
    return isNaN(n) ? 0 : n;
}

/**
 * Состав заказа в виде структурированных линий для отображения в карточке (шаг 1).
 * Без нумерации; заголовок позиции с ценой теплицы, подпозиции «название — цена», один итог по заказу.
 * @param {Object} order — заказ (line_items или плоские поля)
 * @returns {Array<{type: string, text: string, price?: number}>} type: 'header' | 'extra' | 'total'
 */
function getOrderCompositionLines(order) {
    var out = [];
    if (!order) return out;
    var orderTotal = parseOrderPrice_(order.total);
    var deliveryCost = parseOrderPrice_(order.delivery_cost);
    var hasLineItems = order.line_items && typeof order.line_items === 'string';
    if (hasLineItems) {
        try {
            var items = JSON.parse(order.line_items);
            if (Array.isArray(items) && items.length > 0) {
                var totalExtrasSum = 0;
                items.forEach(function (item) { totalExtrasSum += parseExtrasAssemblySum(item.extras, item.assembly); });
                var remainder = Math.max(0, orderTotal - deliveryCost - totalExtrasSum);
                items.forEach(function (item) {
                    if (item.base_price != null && !isNaN(Number(item.base_price))) remainder -= Number(item.base_price);
                    else if (parseOrderPrice_(item.item_total) > 0) {
                        var es = parseExtrasAssemblySum(item.extras, item.assembly);
                        remainder -= Math.max(0, parseOrderPrice_(item.item_total) - es);
                    }
                });
                remainder = Math.max(0, remainder);
                if (remainder === 0 && orderTotal > 0) remainder = Math.max(0, orderTotal - deliveryCost - totalExtrasSum);
                var noPriceCount = 0;
                items.forEach(function (item) {
                    var hasPrice = (item.base_price != null && !isNaN(Number(item.base_price))) || parseOrderPrice_(item.item_total) > 0;
                    if (!hasPrice) noPriceCount++;
                });
                // Цена теплицы в заказе = Итого − доставка − сумма всех допов/сборки (одна цена, может быть ниже текущей — клиент забронировал раньше).
                var priceInOrderOne = Math.max(0, orderTotal - deliveryCost - totalExtrasSum);
                items.forEach(function (item) {
                    var m = (item.model || '').toString().trim() || 'Теплица';
                    var w = item.width != null ? item.width : '';
                    var l = item.length != null ? item.length : '';
                    var displayPrice;
                    if (items.length === 1) {
                        displayPrice = priceInOrderOne;
                    } else {
                        var itemTotal = parseOrderPrice_(item.item_total);
                        if (item.base_price != null && !isNaN(Number(item.base_price))) {
                            displayPrice = Number(item.base_price);
                        } else if (itemTotal > 0) {
                            var extrasSum = parseExtrasAssemblySum(item.extras, item.assembly);
                            displayPrice = (extrasSum > 0 && itemTotal >= extrasSum) ? Math.max(0, itemTotal - extrasSum) : itemTotal;
                        } else {
                            displayPrice = noPriceCount === 1 ? remainder : (noPriceCount > 0 ? Math.round(remainder / noPriceCount) : 0);
                        }
                        if (displayPrice === 0 && orderTotal > 0) displayPrice = Math.max(0, orderTotal - deliveryCost - totalExtrasSum);
                    }
                    out.push({ type: 'header', text: greenhouseTitle_(m, w, l), price: displayPrice });
                    var extrasStr = (item.extras || '').trim();
                    var assemblyStr = (item.assembly || '').trim();
                    if (extrasStr || assemblyStr) {
                        var combined = [extrasStr, assemblyStr].filter(Boolean).join('\n');
                        combined.split('\n').forEach(function (subLine) {
                            var t = (subLine || '').trim();
                            if (t && !isOrphanUnitLine_(t)) out.push({ type: 'extra', text: t });
                        });
                    }
                });
                if (out.length) {
                    if (deliveryCost > 0) out.push({ type: 'extra', text: 'Доставка - ' + (typeof formatPrice === 'function' ? formatPrice(deliveryCost) : deliveryCost) + ' ₽' });
                    else if ((order.delivery_address || order.delivery_date || '').toString().trim()) out.push({ type: 'extra', text: 'Доставка — не указана' });
                }
                if (orderTotal && out.length) out.push({ type: 'total', text: 'Итого', price: orderTotal });
                return out;
            }
        } catch (e) { /* ignore */ }
    }
    var model = (order.model || '').toString().trim();
    var width = order.width != null ? String(order.width) : '';
    var length = order.length != null ? String(order.length) : '';
    var tot = parseOrderPrice_(order.total);
    if (!model && !width && !length && !tot) return out;
    var sumExtras = parseExtrasAssemblySum(order.extras, order.assembly);
    var displayPriceOne = Math.max(0, tot - deliveryCost - sumExtras);
    out.push({ type: 'header', text: greenhouseTitle_(model, width, length), price: displayPriceOne });
    var extrasStr = (order.extras || '').trim();
    var assemblyStr = (order.assembly || '').trim();
    if (extrasStr || assemblyStr) {
        var combined = [extrasStr, assemblyStr].filter(Boolean).join('\n');
        combined.split('\n').forEach(function (subLine) {
            var t = (subLine || '').trim();
            if (t && !isOrphanUnitLine_(t)) out.push({ type: 'extra', text: t });
        });
    }
    if (out.length) {
        if (deliveryCost > 0) out.push({ type: 'extra', text: 'Доставка - ' + (typeof formatPrice === 'function' ? formatPrice(deliveryCost) : deliveryCost) + ' ₽' });
        else if ((order.delivery_address || order.delivery_date || '').toString().trim()) out.push({ type: 'extra', text: 'Доставка — не указана' });
    }
    if (tot) out.push({ type: 'total', text: 'Итого', price: tot });
    return out;
}

/** Строка из допов/сборки — одиночная буква «м»/«М» (от размеров 3.0x4.0 м), не показывать отдельной строкой. */
function isOrphanUnitLine_(s) {
    if (!s || s.length > 2) return false;
    var t = s.trim();
    return t.length === 1 && /[мМmM]/.test(t) || (t.length === 2 && /[мМmM]\.?/.test(t));
}

/**
 * Название теплицы с размерами без дублирования ширины.
 * Если в названии уже есть ширина («2.5М»), убирает её и добавляет width×length.
 * Пример: «ТЕПЛИЦА БОЯРСКАЯ ЛЮКС 2.5М», 2.5, 6 → «ТЕПЛИЦА БОЯРСКАЯ ЛЮКС 2.5×6 м»
 */
function greenhouseTitle_(model, width, length) {
    var m = (model || 'Теплица').toString().trim();
    var w = width != null ? String(width).trim() : '';
    var l = length != null ? String(length).trim() : '';
    if (!w || !l) return m;
    var rx = /^(.*?)\s+(\d+(?:[.,]\d+)?)\s*[МMм]\s*$/i;
    var match = m.match(rx);
    if (match) {
        var mw = parseFloat(match[2].replace(',', '.'));
        var dw = parseFloat(w.replace(',', '.'));
        if (!isNaN(mw) && !isNaN(dw) && Math.abs(mw - dw) < 0.01) {
            return match[1].trim() + ' ' + w + '×' + l + ' м';
        }
    }
    return m + ' ' + w + '×' + l + ' м';
}

/** Полный состав заказа для карточки (шаг 1): текстовая сводка по getOrderCompositionLines (обратная совместимость, если где-то ожидают текст). */
function getOrderCompositionSummary(order) {
    var lines = getOrderCompositionLines(order);
    if (lines.length === 0) return '';
    return lines.map(function (ln) {
        if (ln.type === 'header') return ln.text + (ln.price != null && ln.price > 0 ? ' — ' + (typeof formatPrice === 'function' ? formatPrice(ln.price) : ln.price) + ' ₽' : '');
        if (ln.type === 'total') return 'Итого: ' + (typeof formatPrice === 'function' ? formatPrice(ln.price) : ln.price) + ' ₽';
        return ln.text;
    }).join('\n');
}

/** Бейдж статуса заказа (место у блока КЛИЕНТ). Оформлен, На проверке (в обработке), Выполнен, Дубль, Отменён. */
function getOrderStatusDisplay(order) {
    var raw = (order.status || '').trim().toLowerCase();
    var original = (order.status || '').trim();
    if (raw === 'completed') return { text: 'Выполнен', modifier: '--done' };
    if (raw === 'cancelled' || raw === 'canceled' || raw === 'отмена') return { text: 'Отменён', modifier: '' };
    if (raw === 'duplicate' || raw === 'дубль' || original.toLowerCase().indexOf('дубль') !== -1) return { text: 'Дубль', modifier: '' };
    if (raw === 'in_progress' || raw === 'pending_production' || original.indexOf('на проверке') !== -1) return { text: 'На проверке', modifier: '' };
    if (raw === 'synced' || raw === 'confirmed' || raw === 'new' || raw === 'error' || !raw) return { text: 'Оформлен', modifier: '--ok' };
    return { text: 'Оформлен', modifier: '--ok' };
}

/** Показать список найденных заказов: карточка с 4 блоками (Клиент, Доставка, Состав, Контекст), кнопка «Редактировать» или «Новый заказ». */
function renderEditOrderList(orders) {
    var container = document.getElementById('edit-order-list');
    if (!container) return;
    if (!orders || orders.length === 0) {
        container.innerHTML = '<p class="edit-order-list-placeholder">По этому номеру заказов не найдено.</p>';
        return;
    }
    var html = '';
    orders.forEach(function (order) {
        var id = (order.id || '').toString().replace(/"/g, '&quot;');
        var phone = (order.client_phone || '').trim();
        var name = (order.client_name || '').trim() || '—';
        var phoneDisplay = phone || '—';
        var createdRaw = order.created_at || '';
        var dateOnly = createdRaw.indexOf('T') !== -1 ? createdRaw.split('T')[0] : createdRaw;
        var created = (dateOnly && dateOnly.indexOf('-') !== -1) ? formatDateRu(dateOnly) : (createdRaw || '—');
        var delivery = order.delivery_date || '—';
        var address = (order.delivery_address || '').trim() || '—';
        var compLines = getOrderCompositionLines(order);
        var statusDisplay = getOrderStatusDisplay(order);
        var source = (order.source || '').trim() || '';
        var manager = (order.manager || '').trim() || '';
        var comment = (order.comment || '').trim() || '';

        var isCompleted = order.status === 'completed';
        var st = (order.status || '').trim().toLowerCase();
        var isCancelled = st === 'cancelled' || st === 'canceled' || st === 'отмена';
        // Для заказов до 2025 года данные исторические: разные менеджеры, кривые цены — не показываем
        var createdYear = dateOnly ? parseInt(dateOnly.split('-')[0], 10) : 0;
        var isPreHistory = createdYear > 0 && createdYear < 2025;

        html += '<div class="edit-order-list-item">';
        html += '<div class="edit-order-list-item__card">';

        html += '<div class="edit-order-card-block edit-order-card-block--client">';
        html += '<div class="edit-order-card-block__head edit-order-card-block__head--client">';
        html += '<span class="edit-order-card-block__title">Клиент</span>';
        html += '<span class="edit-order-item-status-badge edit-order-item-status-badge' + escapeHtml(statusDisplay.modifier) + '">' + escapeHtml(statusDisplay.text) + '</span>';
        html += '</div>';
        html += '<div class="edit-order-card-block__row">' + escapeHtml(name) + ' · <span class="edit-order-item-phone">' + escapeHtml(phoneDisplay) + '</span></div></div>';

        html += '<div class="edit-order-card-block edit-order-card-block--delivery">';
        html += '<div class="edit-order-card-block__title">Доставка</div>';
        html += '<div class="edit-order-card-block__row">Заявка: <strong>' + escapeHtml(created) + '</strong> · Доставка: <strong>' + escapeHtml(delivery) + '</strong></div>';
        html += '<div class="edit-order-card-block__row edit-order-card-block__row--address">' + escapeHtml(address) + '</div></div>';

        var totalLineStr = '';
        if (compLines.length > 0) {
            html += '<div class="edit-order-card-block edit-order-card-block--composition">';
            html += '<div class="edit-order-card-block__title">Состав</div>';
            html += '<div class="edit-order-item-composition">';
            var inPosition = false;
            compLines.forEach(function (ln) {
                if (ln.type === 'header') {
                    if (inPosition) html += '</div>';
                    html += '<div class="edit-order-card-position">';
                    inPosition = true;
                    // Цены показываем только для заказов с 2025 года; 0 не показываем — только итог
                    var priceStr = (!isPreHistory && ln.price != null && ln.price > 0) ? (typeof formatPrice === 'function' ? formatPrice(ln.price) : ln.price) + ' ₽' : '';
                    html += '<div class="edit-order-item-composition-header">';
                    html += '<span class="edit-order-item-composition-header__text">' + escapeHtml(ln.text) + '</span>';
                    if (priceStr) html += '<span class="edit-order-item-composition-header__price">' + escapeHtml(priceStr) + '</span>';
                    html += '</div>';
                } else if (ln.type === 'extra') {
                    html += '<div class="edit-order-item-composition-extras">' + escapeHtml(ln.text) + '</div>';
                } else if (ln.type === 'total') {
                    if (inPosition) { html += '</div>'; inPosition = false; }
                    if (!isPreHistory && ln.price != null) {
                        totalLineStr = 'Итого: ' + (typeof formatPrice === 'function' ? formatPrice(ln.price) : ln.price) + ' ₽';
                    }
                }
            });
            if (inPosition) html += '</div>';
            html += '</div>';
            html += '</div>';
        }

        if (comment) {
            html += '<div class="edit-order-card-block edit-order-card-block--context">';
            html += '<div class="edit-order-card-block__title">Контекст</div>';
            html += '<div class="edit-order-card-block__row edit-order-card-block__row--comment">' + escapeHtml(comment) + '</div>';
            html += '</div>';
        }

        // Менеджер и источник — только для заказов с 2025 года (до 2025 данные неактуальны)
        var showMeta = !isPreHistory && (source || manager);
        if (totalLineStr || showMeta) {
            html += '<div class="edit-order-card-summary-row">';
            if (totalLineStr) html += '<span class="edit-order-item-composition-total">' + escapeHtml(totalLineStr) + '</span>';
            if (showMeta) {
                html += '<span class="edit-order-card-meta edit-order-card-meta--inline">';
                if (source) html += 'Источник: ' + escapeHtml(source);
                if (source && manager) html += ' ';
                if (manager) html += 'Менеджер: ' + escapeHtml(manager);
                html += '</span>';
            }
            html += '</div>';
        }

        html += '</div>';

        // completed — только просмотр; кнопка создаёт новый заказ на того же клиента
        if (isCompleted) {
            var phoneSafe = phone.replace(/"/g, '&quot;');
            html += '<button type="button" class="edit-order-item-btn edit-order-item-btn--new-order" onclick="startNewOrderForPhone(\'' + phoneSafe + '\')">';
            html += '＋ Новый заказ для этого клиента</button>';
        } else if (isCancelled) {
            /* бейдж «Отменён» уже в карточке; кнопки нет */
        } else {
            var idEscaped = (id || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            html += '<button type="button" class="green-button edit-order-item-btn edit-order-btn-with-icon" data-order-id="' + id + '" onclick="if(typeof startEditOrder===\'function\')startEditOrder(\'' + idEscaped + '\')"><img src="icons/edit-order-icon-edit.png" alt="" class="edit-order-btn-icon edit-order-btn-icon--light" aria-hidden="true">Редактировать</button>';
        }

        html += '</div>';
    });
    container.innerHTML = html;
    // Обработка клика только через inline onclick на кнопке (без addEventListener и делегирования, чтобы ничего не перехватывало клик).
}

/** Закрыть модалку редактирования и подставить телефон в поле поиска/заявки. */
function startNewOrderForPhone(phone) {
    closeEditOrderModal();
    // Ищем поле телефона в главной форме и подставляем номер
    var phoneField = document.getElementById('phone');
    if (phoneField) {
        phoneField.value = phone;
        phoneField.dispatchEvent(new Event('input', { bubbles: true }));
        phoneField.dispatchEvent(new Event('blur', { bubbles: true }));
        setTimeout(function () {
            phoneField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            phoneField.focus();
        }, 300);
    }
}

function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

/** Получить полный заказ из Supabase по id (для подстановки в форму). */
async function fetchOrderById(orderId) {
    if (!orderId) return null;
    var res = await supabaseClient.from('orders').select('*').eq('id', orderId).maybeSingle();
    if (res.error) throw res.error;
    return res.data;
}

var EDIT_ORDER_MODAL_TITLE_BASE = 'Редактирование заказа';

/** Показать шаг 1 (поиск/список) или 2 (форма редактирования) в модалке. Блок «Параметры теплицы» скрыт, пока не нажали «Добавить теплицу» или «Изменить». */
function showEditOrderStep(step) {
    var body = document.getElementById('edit-order-modal-body');
    if (!body) return;
    body.setAttribute('data-step', String(step));
    body.scrollTop = 0;
    if (String(step) === '1') {
        var titleEl = document.getElementById('edit-order-modal-title');
        if (titleEl) titleEl.textContent = EDIT_ORDER_MODAL_TITLE_BASE;
    }
    if (String(step) === '2') {
        closeEditOrderAddPanel();
        var first = document.getElementById('edit-order-client-name');
        if (first) setTimeout(function () { first.focus(); }, 80);
    }
}

/** Заполнить форму редактирования в модалке данными заказа. */
function fillEditOrderForm(order) {
    if (!order) return;
    lastEditOrderManager = (order.manager || '').trim();
    lastLoadedOrderCommercialOffer = (order.commercial_offer || '').trim();
    setEditOrderFieldValue('edit-order-client-name', order.client_name || '');
    setEditOrderFieldValue('edit-order-client-phone', order.client_phone || '');
    // raw-preserve: сохранить оригинальный телефон до любых изменений пользователем
    _editOrderOriginalPhoneRaw = order.client_phone != null ? String(order.client_phone) : '';
    _editOrderPhoneTouchedByUser = false;
    var deliveryStr = (order.delivery_date || '').trim();
    var displayDate = '';
    var isoForDate = '';
    if (deliveryStr.indexOf('-') !== -1 && deliveryStr.length >= 10) {
        var dateOnly = deliveryStr.split('T')[0] || deliveryStr;
        displayDate = formatDateRu(dateOnly);
        isoForDate = dateOnly;
    } else {
        displayDate = deliveryStr;
        isoForDate = deliveryDateDdMmToISO(deliveryStr) || '';
    }
    setEditOrderFieldValue('edit-order-delivery-date', isoForDate);
    setEditOrderFieldValue('edit-order-delivery-date-display', displayDate);
    _editOrderCalSelected = isoForDate;
    if (isoForDate) {
        var p = isoForDate.split('-');
        if (p.length === 3) _editOrderCalMonth = { year: +p[0], month: +p[1] - 1 };
        else _editOrderCalMonth = null;
    } else {
        _editOrderCalMonth = null;
    }

    var addr = (order.delivery_address || '').trim();
    var parsedAddr = addr ? parseAddressToParts_(addr) : { part1: '', part2: '', part3: '' };
    setEditOrderFieldValue('edit-order-address-part1', parsedAddr.part1 || '');
    setEditOrderFieldValue('edit-order-address-part2', parsedAddr.part2 || '');
    setEditOrderFieldValue('edit-order-address-part3', parsedAddr.part3 || '');
    var noPlotEl = document.getElementById('edit-order-no-plot');
    if (noPlotEl) noPlotEl.checked = !!(addr && addr.toLowerCase().indexOf('без номера') !== -1);

    setEditOrderSelectValue('edit-order-source', order.source || '');
    setEditOrderFieldValue('edit-order-comment', order.comment || '');

    var orderCity = (order.city || '').trim() || (parsedAddr.part1 || '').trim();
    // primary source of truth для edit calendar
    _editOrderLoadedCityRaw = (order.city || '').trim() || null;
    _editOrderLoadedWarehouseCityKey = (order.warehouse_city_key || '').trim() || null;
    lastLoadedOrderTotalForDisplay = order.total != null ? parseOrderPrice_(order.total) : null;
    editOrderComposition = [];
    editOrderDeliveryCost = parseOrderPrice_(order.delivery_cost);
    if (order.line_items && typeof order.line_items === 'string') {
        try {
            var items = JSON.parse(order.line_items);
            if (Array.isArray(items) && items.length > 0) {
                items.forEach(function (item, idx) {
                    var extrasStr = (item.extras != null ? String(item.extras) : '').trim();
                    var assemblyStr = (item.assembly != null ? String(item.assembly) : '').trim();
                    if (!assemblyStr && idx === 0 && (order.assembly || '').trim()) assemblyStr = (order.assembly || '').trim();
                    if (!extrasStr && idx === 0 && (order.extras || '').trim()) extrasStr = (order.extras || '').trim();
                    editOrderComposition.push({
                        model: (item.model || '').toString().trim() || 'Теплица',
                        width: item.width != null ? item.width : '',
                        length: item.length != null ? item.length : '',
                        frame: (item.frame || '').toString().trim() || '',
                        arc_step: item.arc_step != null ? item.arc_step : '',
                        polycarbonate: (item.polycarbonate || '').toString().trim() || '',
                        item_total: parseOrderPrice_(item.item_total),
                        base_price: item.base_price != null && !isNaN(Number(item.base_price)) ? Number(item.base_price) : undefined,
                        form: (item.form || '').toString().trim() || getFormCategory(item.model || ''),
                        city: (item.city || '').trim() || orderCity,
                        extras: extrasStr,
                        assembly: assemblyStr,
                        options: item.options && typeof item.options === 'object' ? item.options : undefined
                    });
                });
                var sumItems = editOrderComposition.reduce(function (s, i) { return s + (i.item_total || 0); }, 0);
                if (editOrderDeliveryCost === 0 && order.total != null) editOrderDeliveryCost = Math.max(0, parseOrderPrice_(order.total) - sumItems);
            }
        } catch (e) { /* ignore */ }
    }
    if (editOrderComposition.length === 0 && order.model) {
        var tot = parseOrderPrice_(order.total);
        var flatBasePrice = order.base_price != null && !isNaN(Number(order.base_price)) ? Number(order.base_price) : (order.unit_price != null && !isNaN(Number(order.unit_price)) ? Number(order.unit_price) : undefined);
        editOrderComposition.push({
            model: (order.model || '').toString().trim() || 'Теплица',
            width: order.width != null ? order.width : '',
            length: order.length != null ? order.length : '',
            frame: (order.frame || '').toString().trim() || '',
            arc_step: order.arc_step != null ? order.arc_step : '',
            polycarbonate: (order.polycarbonate || '').toString().trim() || '',
            item_total: tot,
            base_price: flatBasePrice,
            form: getFormCategory(order.model || ''),
            city: orderCity,
            extras: (order.extras != null ? String(order.extras) : '').trim(),
            assembly: (order.assembly != null ? String(order.assembly) : '').trim(),
            options: order.options && typeof order.options === 'object' ? order.options : undefined
        });
        editOrderDeliveryCost = 0;
    }
    setEditOrderFieldValue('edit-order-gift', order.gift || '');
    editOrderEditingIndex = null;
    editOrderCompositionUndoSample = null;
    editOrderCompositionRedoSample = null;
    editOrderStateUndoSample = null;
    editOrderStateRedoSample = null;
    var cancelOrderBtnEl = document.getElementById('edit-order-cancel-order-btn');
    if (cancelOrderBtnEl) {
        var st = (order.status || '').toLowerCase();
        cancelOrderBtnEl.style.display = (st === 'cancelled' || st === 'completed') ? 'none' : '';
    }
    editOrderGiftSlotsPrev = -1;
    // raw-preserve: сохранить оригинальный gift text до render-cascade, которая может нормализовать его в текущий формат
    _editOrderOriginalGiftRaw = order.gift != null ? String(order.gift) : '';
    _editOrderGiftTouchedByUser = false;
    _editOrderGiftTierAtOpen = (typeof getGiftSlotsByTotal === 'function' && typeof getEditOrderCompositionTotal === 'function')
        ? getGiftSlotsByTotal(getEditOrderCompositionTotal()) : 0;
    renderEditOrderCompositionList(); // вызывает updateEditOrderGiftFromTotal → threshold → показ/скрытие блока
    // Принудительный enforce видимости: renderEditOrderCompositionList может не успеть при асинхронных изменениях DOM
    if (typeof updateEditOrderGiftsBlock === 'function' && typeof getEditOrderCompositionTotal === 'function') {
        updateEditOrderGiftsBlock(getEditOrderCompositionTotal());
    }
    lastSavedEditOrderState = getEditOrderStateSnapshot();
    lastSavedEditOrderFormState = getEditOrderFormSnapshot();
    lastPersistedEditOrderState = getEditOrderStateSnapshot();
    lastPersistedEditOrderFormState = getEditOrderFormSnapshot();
}

/** Итог по составу: сумма позиций + доставка. */
function getEditOrderCompositionTotal() {
    var sum = editOrderComposition.reduce(function (s, i) { return s + (i.item_total || 0); }, 0);
    return sum + (editOrderDeliveryCost || 0);
}

/** Итог с учётом превью из панели «Параметры теплицы»: если есть lastModalCalculationResult, подставляем его item_total вместо текущей позиции (edit) или добавляем к сумме (add). */
function getEditOrderCompositionTotalWithPreview() {
    if (!lastModalCalculationResult) return getEditOrderCompositionTotal();
    var recalcTotal = lastModalCalculationResult.item_total || 0;
    if (editOrderEditingIndex != null && editOrderEditingIndex >= 0 && editOrderEditingIndex < editOrderComposition.length) {
        var sum = 0;
        editOrderComposition.forEach(function (item, idx) {
            sum += (idx === editOrderEditingIndex ? recalcTotal : (item.item_total || 0));
        });
        return sum + (editOrderDeliveryCost || 0);
    }
    return getEditOrderCompositionTotal() + recalcTotal;
}

/** По тексту подарков (из заказа) восстановить объект { 'gift-1': id, ... } для предзаполнения селектов в модалке. */
function parseGiftTextToSelected(text) {
    var raw = (text || '').trim();
    // Убрать префикс из Supabase/КП: "🎁 Подарки: ..." или "🎁 Подарок: ..."
    var t = raw.replace(/^\s*\n?\s*🎁?\s*(Подарки?|подарки?):\s*/i, '').trim();
    t = t.toLowerCase().replace(/\s+/g, ' ');
    // Разбивать по запятой, точке с запятой, переносу или по " и " (не по букве "и" внутри слов типа "полива")
    var parts = t.split(/\s+и\s+|[,;\n]+/).map(function (p) { return p.trim(); }).filter(Boolean);
    var ids = [];
    var order = [
        { re: /автоматическая\s+форточка|форточка\s*\+\s*автомат/i, id: 'window-auto' },
        { re: /автомат\s+для\s+форточки|автомата\s+для\s+форточки|автоматов\s+для\s+форточки/i, id: 'window-automation' },
        { re: /дополнительная\s+форточка|доп\.?\s*форточк|дополнительных\s+форточек/i, id: 'window' },
        { re: /капельный\s+полив\s+механический|капельный\s+полив\s+мех\.?|капельный\s+полив|капельных\s+полива\s+механических|капельных\s+поливов\s+механических|капельных\s+полива\s+механ|капельных\s+полива\s+мех\.?|капельных\s+полива/i, id: 'drip-mech' },
        { re: /\d+\s*грунтозацеп|4\s*грунтозацеп|грунтозацепов|грунтозацепа/i, id: 'stakes-4' }
    ];
    parts.forEach(function (part) {
        var countMatch = part.match(/^(\d+)\s+/);
        if (!countMatch) {
            countMatch = part.match(/(\d+)\s+капельных/) || part.match(/(\d+)\s+дополнительн/) || part.match(/(\d+)\s+грунтозацеп/) || part.match(/(\d+)\s+автомат/);
        }
        var num = countMatch ? parseInt(countMatch[1], 10) : 1;
        for (var i = 0; i < order.length; i++) {
            if (order[i].re.test(part)) {
                var id = order[i].id;
                var count = 1;
                if ((id === 'drip-mech' || id === 'window-automation') && num >= 2) count = Math.min(num, 3);
                else if (id === 'stakes-4' && num >= 8) count = Math.min(Math.floor(num / 4), 3);
                for (var c = 0; c < count && ids.length < 3; c++) ids.push(id);
                break;
            }
        }
    });
    var out = {};
    ids.slice(0, 3).forEach(function (id, idx) {
        out['gift-' + (idx + 1)] = id;
    });
    return out;
}

/** Синхронизировать поле «Подарки» из селектов в модалке (при смене выбора). Ключи gift-1, gift-2, gift-3 как в калькуляторе. Та же логика, что на главной: «Автоматическая форточка» занимает 2 слота — при выборе пересобираем блок, чтобы скрыть занятый слот (isGiftSlotOccupied). */
function onEditOrderGiftSelectChange() {
    var giftEl = document.getElementById('edit-order-gift');
    if (!giftEl) return;
    var selected = {};
    var selects = document.querySelectorAll('.edit-order-gift-select');
    selects.forEach(function (sel) {
        var num = (sel.id || '').replace('edit-order-gift-', '');
        if (num && sel.value && sel.value.trim()) selected['gift-' + num] = sel.value.trim();
    });
    var text = typeof getGiftsTextFromObject === 'function' ? getGiftsTextFromObject(selected) : '';
    giftEl.value = text ? String(text).replace(/^\s+/, '').trim() : '';
    if (editOrderGiftBlockRebuilding) return;
    // raw-preserve: фиксируем явный выбор пользователя; при restore или пересборке блока — не ставим
    if (!editOrderRestoringState) {
        _editOrderGiftTouchedByUser = true;
    }
    if (!editOrderRestoringState && lastSavedEditOrderState != null) {
        editOrderStateUndoSample = { composition: lastSavedEditOrderState.composition.map(function (i) { var o = {}; for (var k in i) if (Object.prototype.hasOwnProperty.call(i, k)) o[k] = i[k]; return o; }), gifts: Object.assign({}, lastSavedEditOrderState.gifts) };
        editOrderStateRedoSample = null;
        lastSavedEditOrderState = getEditOrderStateSnapshot();
        updateEditOrderUndoRedoButtons();
    }
    editOrderGiftBlockRebuilding = true;
    if (typeof updateEditOrderGiftsBlock === 'function' && typeof getEditOrderCompositionTotalWithPreview === 'function') {
        updateEditOrderGiftsBlock(getEditOrderCompositionTotalWithPreview(), false, true);
    }
    editOrderGiftBlockRebuilding = false;
}

/** Обновить блок селектов подарков в модалке (как на главной): по итогу заказа показывать 1–3 выпадающих списка, логика getGiftOptions. @param {boolean} [previewOnly] — true: только отобразить слоты, не писать в giftEl (превью до сохранения позиции). @param {boolean} [skipNotice] — true: не трогать notice (вызов из смены выбора подарка — total не менялся). */
function updateEditOrderGiftsBlock(totalPrice, previewOnly, skipNotice) {
    editOrderGiftBlockRebuilding = true;
    var block = document.getElementById('edit-order-gifts-block');
    var infoEl = document.getElementById('edit-order-gifts-info');
    var selectionEl = document.getElementById('edit-order-gifts-selection');
    var giftEl = document.getElementById('edit-order-gift');
    // Ищем wrapper по id (новый HTML) или по классу (старый HTML — .closest надёжнее getId)
    var fieldWrapper = document.getElementById('edit-order-gifts-field') ||
                       (block && block.closest ? block.closest('.edit-order-gifts-field') : null);
    if (!block || !infoEl || !selectionEl) { editOrderGiftBlockRebuilding = false; return; }
    var availableGifts = getGiftSlotsByTotal(totalPrice);
    if (availableGifts === 0) {
        if (!skipNotice && editOrderGiftSlotsPrev > 0 && typeof showToast === 'function') {
            showToast('Сумма заказа стала ниже порога — подарки недоступны', 'info', null, 4000);
        }
        block.style.display = 'none';
        if (fieldWrapper) fieldWrapper.style.display = 'none';
        editOrderGiftSlotsPrev = 0;
        editOrderGiftBlockRebuilding = false;
        return;
    }
    if (fieldWrapper) fieldWrapper.style.display = '';
    block.style.display = 'block';
    var giftTier = availableGifts === 3 ? '75 000' : availableGifts === 2 ? '55 000' : '35 000';
    infoEl.textContent = 'По сумме заказа доступно ' + availableGifts + (availableGifts === 1 ? ' подарок' : availableGifts === 2 ? ' подарка' : ' подарков') + ' (итог от ' + giftTier + ' ₽). Выберите в списках ниже.';
    var currentText = giftEl ? (giftEl.value || '').trim() : '';
    var savedFromDom = {};
    var selects = selectionEl.querySelectorAll('.edit-order-gift-select');
    selects.forEach(function (sel) {
        var num = (sel.id || '').replace('edit-order-gift-', '');
        if (num && sel.value && sel.value.trim()) savedFromDom['gift-' + num] = sel.value.trim();
    });
    if (!skipNotice && editOrderGiftSlotsPrev >= 0 && editOrderGiftSlotsPrev !== availableGifts) {
        var msg;
        if (availableGifts > editOrderGiftSlotsPrev) {
            msg = 'Сумма заказа увеличилась — теперь доступно ' + availableGifts + (availableGifts === 1 ? ' подарок' : availableGifts === 2 ? ' подарка' : ' подарков');
        } else {
            var hadGiftsRemoved = false;
            for (var x = availableGifts + 1; x <= editOrderGiftSlotsPrev; x++) {
                if (savedFromDom['gift-' + x]) { hadGiftsRemoved = true; break; }
            }
            msg = hadGiftsRemoved ? 'Сумма заказа уменьшилась — лишние подарки убраны' : 'Сумма заказа уменьшилась — теперь доступно ' + availableGifts + (availableGifts === 1 ? ' подарок' : availableGifts === 2 ? ' подарка' : ' подарков');
        }
        if (typeof showToast === 'function') showToast(msg, 'info', null, 4000);
    }
    editOrderGiftSlotsPrev = availableGifts;
    var initialSelected = (editOrderRestoringState || !(savedFromDom && Object.keys(savedFromDom).length > 0))
        ? (currentText && typeof parseGiftTextToSelected === 'function' ? parseGiftTextToSelected(currentText) : {})
        : savedFromDom;
    // Дефолтные подарки ставим ТОЛЬКО для новых заказов (currentOrderIdForEdit === null/undefined).
    // Для существующих заказов менеджер выбирает сам — иначе 5.4.2: ложный дифф «gift добавлен».
    if (Object.keys(initialSelected).length === 0) {
        var isNewOrderForDefaults = typeof currentOrderIdForEdit === 'undefined' || !currentOrderIdForEdit;
        if (isNewOrderForDefaults) {
            if (availableGifts >= 1) initialSelected['gift-1'] = 'window';
            if (availableGifts >= 2) initialSelected['gift-2'] = 'drip-mech';
            if (availableGifts >= 3) initialSelected['gift-3'] = 'stakes-4';
        }
    }
    for (var i = availableGifts + 1; i <= 3; i++) delete initialSelected['gift-' + i];
    var hasAdditionalWindow = Object.keys(initialSelected).some(function (k) {
        var v = initialSelected[k];
        return v === 'window' || v === 'window-auto';
    });
    selectionEl.innerHTML = '';
    for (var j = 1; j <= availableGifts; j++) {
        if (typeof isGiftSlotOccupied === 'function' && isGiftSlotOccupied(j, initialSelected)) continue;
        var row = document.createElement('div');
        row.className = 'edit-order-gift-row';
        var labelSpan = document.createElement('span');
        labelSpan.className = 'edit-order-gift-row__label';
        labelSpan.textContent = 'Подарок ' + j;
        var sel = document.createElement('select');
        sel.id = 'edit-order-gift-' + j;
        sel.className = 'edit-order-gift-select';
        sel.setAttribute('aria-label', 'Подарок ' + j);
        var opts = typeof getGiftOptions === 'function' ? getGiftOptions(j, initialSelected, hasAdditionalWindow, availableGifts) : [];
        opts.forEach(function (opt) {
            var o = document.createElement('option');
            o.value = opt.value;
            o.textContent = opt.text;
            sel.appendChild(o);
        });
        if (initialSelected['gift-' + j] && sel.querySelector('option[value="' + initialSelected['gift-' + j] + '"]')) {
            sel.value = initialSelected['gift-' + j];
        }
        sel.onchange = onEditOrderGiftSelectChange;
        row.appendChild(labelSpan);
        row.appendChild(sel);
        selectionEl.appendChild(row);
    }
    // Не перезаписывать giftEl из DOM: при window-auto второй слот скрыт — в DOM один селект,
    // onEditOrderGiftSelectChange дал бы только первый подарок и удалил бы второй (капельный полив и т.д.).
    // В режиме previewOnly не трогаем giftEl — при отмене восстановим из updateEditOrderGiftFromTotal.
    if (!previewOnly && giftEl) {
        if (Object.keys(initialSelected).length > 0 && typeof getGiftsTextFromObject === 'function') {
            var fullGiftText = getGiftsTextFromObject(initialSelected);
            if (fullGiftText) giftEl.value = String(fullGiftText).replace(/^\s+/, '').trim();
        } else {
            onEditOrderGiftSelectChange();
        }
    }
    var hintEl = document.getElementById('edit-order-gift-hint');
    if (hintEl) {
        var tier = availableGifts === 3 ? '75 000' : availableGifts === 2 ? '55 000' : '35 000';
        var hasWindowAuto = initialSelected['gift-1'] === 'window-auto' || initialSelected['gift-2'] === 'window-auto';
        if (hasWindowAuto) {
            hintEl.textContent = '«Автоматическая форточка» занимает 2 слота (форточка + автомат). Один слот скрыт — выберите в списках выше.';
        } else {
            hintEl.textContent = 'Выберите подарки в списках выше или оставьте как есть.';
        }
    }
    editOrderGiftBlockRebuilding = false;
}

/** Обновить подарки в модалке от итога заказа (19.2/19.3): подсказка, при пустом поле — подстановка по умолчанию, блок селектов как в калькуляторе. */
function updateEditOrderGiftFromTotal() {
    var giftEl = document.getElementById('edit-order-gift');
    var hintEl = document.getElementById('edit-order-gift-hint');
    var total = getEditOrderCompositionTotalWithPreview();
    var availableGifts = getGiftSlotsByTotal(total);
    if (hintEl) {
        if (availableGifts <= 0) {
            hintEl.textContent = '';
        } else {
            var tier = availableGifts === 3 ? '75 000' : availableGifts === 2 ? '55 000' : '35 000';
            hintEl.textContent = 'Выберите подарки в списках ниже или оставьте как есть.';
        }
    }
    // Не очищаем giftEl.value при total < 35k: значение сохраняется в DOM (скрыто).
    // При сохранении (buildOrderPayloadFromEditModal) threshold enforced принудительно.
    // Это позволяет восстановить подарок когда сумма снова поднимается выше порога.
    if (giftEl && availableGifts > 0) {
        var currentVal = (giftEl.value || '').trim();
        // При редактировании существующего заказа дефолт не подставляем — только при создании нового.
        // Иначе fingerprint в GAS видит изменение gift которого не было (баг 5.4.2).
        var isNewOrder = !currentOrderIdForEdit;
        if (!currentVal && isNewOrder) {
            var defaultSelected = {};
            if (availableGifts >= 1) defaultSelected['gift-1'] = 'window';
            if (availableGifts >= 2) defaultSelected['gift-2'] = 'drip-mech';
            if (availableGifts >= 3) defaultSelected['gift-3'] = 'stakes-4';
            var giftDefaultText = typeof getGiftsTextFromObject === 'function' ? getGiftsTextFromObject(defaultSelected) : '';
            if (giftDefaultText) giftEl.value = String(giftDefaultText).replace(/^\s+/, '').trim();
        } else if (currentVal && typeof parseGiftTextToSelected === 'function' && typeof getGiftsTextFromObject === 'function') {
            // Если тир понизился (было 3 подарка → стало 1) — подрезаем лишние слоты
            var parsed = parseGiftTextToSelected(currentVal);
            var trimmed = {};
            for (var si = 1; si <= availableGifts; si++) {
                if (parsed['gift-' + si]) trimmed['gift-' + si] = parsed['gift-' + si];
            }
            var trimmedText = getGiftsTextFromObject(trimmed);
            if (trimmedText !== currentVal) giftEl.value = trimmedText;
        }
    }
    if (typeof updateEditOrderGiftsBlock === 'function') updateEditOrderGiftsBlock(total);
}

/** Сумма цен из текста extras/assembly (строки вида «… - X XXX рублей»). Для старых заказов без base_price: цена теплицы ≈ item_total - эта сумма. */
function parseExtrasAssemblySum(extras, assembly) {
    var combined = ((extras || '') + ' ' + (assembly || '')).replace(/\s+/g, ' ');
    var re = /[\s\-–—](\d[\d\s.]*)\s*рублей?/gi;
    var sum = 0;
    var m;
    while ((m = re.exec(combined)) !== null) {
        var s = m[1].replace(/\s/g, '');
        if (/^\d+\.\d{3}$/.test(s)) sum += parseInt(s.replace('.', ''), 10);
        else if (/^\d+$/.test(s)) sum += parseInt(s, 10);
        else sum += parseFloat(s.replace('.', '').replace(',', '.')) || 0;
    }
    return sum;
}

/** По тексту extras/assembly восстановить опции чекбоксов (брус, сборка, штыри, монтаж). Для предзаполнения панели «Изменить». */
function deriveOptionsFromExtrasAssembly(extras, assembly) {
    var combined = ((extras || '') + ' ' + (assembly || '')).replace(/\s+/g, ' ').toLowerCase();
    return {
        bracing: /основание\s+из\s+бруса|брус\s+\d|из\s+бруса/i.test(combined),
        assembly: /сборка\s+и\s+установка|сборка\s+и\s+установк|сборка\s+-\s*\d/i.test(combined),
        groundHooks: /грунтозацепы|штыри\s+\d|штыри\s*-\s*\d/i.test(combined),
        onWood: /монтаж\s+на\s+брус/i.test(combined),
        onConcrete: /монтаж\s+на\s+бетон/i.test(combined),
        additionalProducts: []
    };
}

/**
 * Собирает HTML одного пункта состава заказа (модалка «Редактирование заказа», блок «Состав заказа»).
 * @param {Object} opts — text (название+размеры), priceFormatted (цена теплицы, уже отформатированная), extrasHtml (разбивка допов/сборки), index, showEditButton, showDeleteButton
 */
function buildOrderCompositionItemHtml(opts) {
    var text = opts.text || 'Теплица';
    var priceFormatted = opts.priceFormatted != null ? String(opts.priceFormatted) : '';
    var extrasHtml = opts.extrasHtml || '';
    var idx = opts.index != null ? opts.index : 0;
    var showEdit = opts.showEditButton !== false;
    var showDel = opts.showDeleteButton !== false;
    var html = '<div class="edit-order-composition-item" data-index="' + idx + '">';
    html += '<span class="edit-order-composition-item__text">' + escapeHtml(text) + '</span>';
    if (priceFormatted !== '') html += '<span class="edit-order-composition-item__price">' + escapeHtml(priceFormatted) + ' ₽</span>';
    if (extrasHtml) html += '<div class="edit-order-composition-item__extras">' + extrasHtml + '</div>';
    html += '<span class="edit-order-composition-item__actions">';
    if (showEdit) html += '<button type="button" class="edit-order-composition-item__btn edit-order-composition-item__btn--edit">Изменить</button>';
    if (showDel) html += '<button type="button" class="edit-order-composition-item__btn edit-order-composition-item__btn--del">Удалить</button>';
    html += '</span>';
    html += '</div>';
    return html;
}

/** Отрисовать список состава в модалке и привязать кнопки Изменить/Удалить. У позиции справа — цена теплицы (base_price), под позицией — разбивка допов, внизу — строка «Итого». */
function renderEditOrderCompositionList() {
    var listEl = document.getElementById('edit-order-composition-list');
    var emptyEl = document.getElementById('edit-order-composition-empty');
    if (!listEl) return;
    if (editOrderComposition.length === 0) {
        closeEditOrderAddPanel();
        resetEditOrderAddPanelOptions();
    }
    var total = getEditOrderCompositionTotal();
    var orderTotal = lastLoadedOrderTotalForDisplay != null ? lastLoadedOrderTotalForDisplay : total;
    var totalExtrasSum = 0;
    editOrderComposition.forEach(function (item) { totalExtrasSum += parseExtrasAssemblySum(item.extras, item.assembly); });
    var remainder = Math.max(0, orderTotal - (editOrderDeliveryCost || 0) - totalExtrasSum);
    editOrderComposition.forEach(function (item) {
        if (item.base_price != null && !isNaN(Number(item.base_price))) remainder -= Number(item.base_price);
        else if (item.item_total != null && Number(item.item_total) > 0) {
            var es = parseExtrasAssemblySum(item.extras, item.assembly);
            remainder -= Math.max(0, Number(item.item_total) - es);
        }
    });
    remainder = Math.max(0, remainder);
    if (remainder === 0 && orderTotal > 0) remainder = Math.max(0, orderTotal - (editOrderDeliveryCost || 0) - totalExtrasSum);
    var noPriceCount = 0;
    editOrderComposition.forEach(function (item) {
        var hasPrice = (item.base_price != null && !isNaN(Number(item.base_price))) || (item.item_total != null && Number(item.item_total) > 0);
        if (!hasPrice) noPriceCount++;
    });
    var html = '';
    editOrderComposition.forEach(function (item, idx) {
        var text = greenhouseTitle_(item.model, item.width, item.length);
        var displayPrice;
        if (item.base_price != null && !isNaN(Number(item.base_price))) {
            displayPrice = Number(item.base_price);
        } else {
            var extrasSum = parseExtrasAssemblySum(item.extras, item.assembly);
            var itemTotal = item.item_total != null ? Number(item.item_total) : 0;
            if (itemTotal > 0) {
                displayPrice = (extrasSum > 0 && itemTotal >= extrasSum) ? Math.max(0, itemTotal - extrasSum) : itemTotal;
            } else {
                displayPrice = noPriceCount === 1 ? remainder : (noPriceCount > 0 ? Math.round(remainder / noPriceCount) : 0);
            }
        }
        if (displayPrice === 0 && orderTotal > 0 && editOrderComposition.length === 1) displayPrice = Math.max(0, orderTotal - (editOrderDeliveryCost || 0));
        var priceFormatted = (displayPrice > 0 && typeof formatPrice === 'function') ? formatPrice(displayPrice) : (displayPrice > 0 ? displayPrice : '');
        var extrasStr = (item.extras || '').trim();
        var assemblyStr = (item.assembly || '').trim();
        var extrasHtml = '';
        if (extrasStr || assemblyStr) {
            var combined = [extrasStr, assemblyStr].filter(Boolean).join('\n');
            var lines = combined.split(/\r?\n/).map(function (s) { return (s || '').trim(); }).filter(Boolean).filter(function (line) { return !isOrphanUnitLine_(line); });
            lines.forEach(function (line) {
                extrasHtml += '<div class="edit-order-composition-item__extras-line">' + escapeHtml(line) + '</div>';
            });
        }
        html += buildOrderCompositionItemHtml({ text: text, priceFormatted: priceFormatted, extrasHtml: extrasHtml, index: idx, showEditButton: true, showDeleteButton: true });
    });
    if (editOrderDeliveryCost > 0) {
        html += '<div class="edit-order-composition-item"><span class="edit-order-composition-item__text">Доставка</span><span class="edit-order-composition-item__price">' + escapeHtml(typeof formatPrice === 'function' ? formatPrice(editOrderDeliveryCost) : editOrderDeliveryCost) + ' ₽</span></div>';
    }
    listEl.innerHTML = html;
    var totalEl = document.getElementById('edit-order-composition-total');
    if (totalEl) {
        totalEl.textContent = editOrderComposition.length > 0 ? 'Итого: ' + (typeof formatPrice === 'function' ? formatPrice(total) : total) + ' ₽' : '';
    }
    if (emptyEl) {
        emptyEl.classList.toggle('hidden', editOrderComposition.length > 0);
    }
    listEl.querySelectorAll('.edit-order-composition-item__btn--edit').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var row = this.closest('.edit-order-composition-item');
            if (row) {
                var idx = parseInt(row.getAttribute('data-index'), 10);
                if (!isNaN(idx) && idx >= 0 && idx < editOrderComposition.length) openEditOrderAddPanel(idx);
            }
        });
    });
    listEl.querySelectorAll('.edit-order-composition-item__btn--del').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var row = this.closest('.edit-order-composition-item');
            if (row) {
                var idx = parseInt(row.getAttribute('data-index'), 10);
                if (!isNaN(idx) && idx >= 0) {
                    var snap = lastSavedEditOrderState || getEditOrderStateSnapshot();
                    editOrderStateUndoSample = { composition: snap.composition.map(function (i) { var o = {}; for (var k in i) if (Object.prototype.hasOwnProperty.call(i, k)) o[k] = i[k]; return o; }), gifts: Object.assign({}, snap.gifts) };
                    editOrderStateRedoSample = null;
                    editOrderComposition.splice(idx, 1);
                    renderEditOrderCompositionList();
                    lastSavedEditOrderState = getEditOrderStateSnapshot();
                    updateEditOrderUndoRedoButtons();
                }
            }
        });
    });
    updateEditOrderGiftFromTotal();
    updateEditOrderUndoRedoButtons();
    if (editOrderComposition.length > 0) {
        var compWrapper = document.getElementById('eo-composition');
        if (compWrapper) {
            compWrapper.classList.remove('edit-order-field-error');
            var msg = compWrapper.querySelector('.edit-order-validation-msg');
            if (msg) msg.textContent = '';
        }
    }
}

function resetEditOrderAddPanelOptions() {
    var panel = document.getElementById('edit-order-add-item-panel');
    if (!panel) return;
    var bracing = panel.querySelector('#edit-order-add-bracing');
    var groundHooks = panel.querySelector('#edit-order-add-ground-hooks');
    var assembly = panel.querySelector('#edit-order-add-assembly');
    var onWood = panel.querySelector('#edit-order-add-on-wood');
    var onConcrete = panel.querySelector('#edit-order-add-on-concrete');
    if (bracing) bracing.checked = false;
    if (groundHooks) groundHooks.checked = false;
    if (assembly) assembly.checked = false;
    if (onWood) onWood.checked = false;
    if (onConcrete) onConcrete.checked = false;
    panel.querySelectorAll('.edit-order-add-product-item select').forEach(function (sel) { sel.value = '0'; });
}

function clearEditOrderAddBreakdown() {
    var el = document.getElementById('edit-order-add-breakdown');
    if (!el) return;
    el.textContent = '';
    el.classList.add('hidden');
}

/** Сбросить результат расчёта в панели «Параметры теплицы» при смене модели/размеров — чтобы не сохранить старую цену без повторного «Рассчитать». */
function clearEditOrderAddPanelCalculation() {
    lastModalCalculationResult = null;
    var priceEl = document.getElementById('edit-order-add-price');
    if (priceEl) priceEl.textContent = '';
    clearEditOrderAddBreakdown();
    var confirmBtn = document.getElementById('edit-order-add-confirm-btn');
    var savePosBtn = document.getElementById('edit-order-save-position-btn');
    if (confirmBtn) confirmBtn.classList.add('hidden');
    if (savePosBtn) savePosBtn.classList.add('hidden');
}

function renderEditOrderAddBreakdown(data) {
    var el = document.getElementById('edit-order-add-breakdown');
    if (!el) return;
    var modelName = (data.model || 'Теплица').toString().trim();
    var _titleFull = greenhouseTitle_(modelName, data.width, data.length);
    var basePrice = data.basePrice != null ? Number(data.basePrice) : 0;
    var fmt = typeof formatPrice === 'function' ? formatPrice : function (n) { return n; };
    var subLines = [];
    function pushLines(str) {
        if (!str || !String(str).trim()) return;
        String(str).trim().split(/\r?\n/).forEach(function (s) {
            var t = (s || '').trim();
            if (t) subLines.push(t);
        });
    }
    pushLines(data.foundationText);
    pushLines(data.assemblyText);
    pushLines(data.additionalProductsText);
    pushLines(data.bedsAssemblyText);
    if (typeof editOrderDeliveryCost === 'number' && editOrderDeliveryCost > 0) {
        subLines.push('Доставка - ' + fmt(editOrderDeliveryCost) + ' рублей');
    }
    el.innerHTML = '';
    var title = document.createElement('div');
    title.className = 'edit-order-add-breakdown__title';
    title.textContent = _titleFull + ' - ' + fmt(basePrice) + ' рублей';
    el.appendChild(title);
    if (subLines.length) {
        var list = document.createElement('div');
        list.className = 'edit-order-add-breakdown__list';
        subLines.forEach(function (line) {
            var row = document.createElement('div');
            row.className = 'edit-order-add-breakdown__line';
            row.textContent = line;
            list.appendChild(row);
        });
        el.appendChild(list);
    }
    el.classList.remove('hidden');
}

function openEditOrderAddPanel(index) {
    editOrderEditingIndex = index;
    var panel = document.getElementById('edit-order-add-item-panel');
    var confirmBtn = document.getElementById('edit-order-add-confirm-btn');
    var savePosBtn = document.getElementById('edit-order-save-position-btn');
    var priceEl = document.getElementById('edit-order-add-price');
    var catalogHint = document.getElementById('edit-order-add-catalog-hint');
    if (catalogHint) { catalogHint.textContent = ''; catalogHint.classList.add('hidden'); }
    if (panel) panel.classList.remove('hidden');
    resetEditOrderAddPanelOptions();
    clearEditOrderAddBreakdown();
    if (priceEl) priceEl.textContent = '';
    if (confirmBtn) confirmBtn.classList.add('hidden');
    if (savePosBtn) savePosBtn.classList.add('hidden');
    var city = getEditOrderAddCity();
    if (index != null && index >= 0 && index < editOrderComposition.length) {
        var item = editOrderComposition[index];
        city = item.city || city;
        if (savePosBtn) savePosBtn.classList.remove('hidden');
        modalCityData = [];
        getCityDataForModal(city).then(function (r) {
            if (r && r.data) {
                modalCityData = r.data;
                populateModalAddDropdowns();
                var catalogHint = document.getElementById('edit-order-add-catalog-hint');
                var catalogHintShown = false;
                var formSel = document.getElementById('edit-order-add-form');
                var formVal = (item.form || item.model || 'Теплица').toString().trim() || 'Теплица';
                if (formVal && formSel && !Array.prototype.find.call(formSel.options, function (o) { return o.value === formVal; })) {
                    var formOpt = document.createElement('option');
                    formOpt.value = formVal;
                    formOpt.textContent = formVal;
                    formSel.appendChild(formOpt);
                    catalogHintShown = true;
                }
                setEditOrderSelectValue('edit-order-add-form', item.form || formVal || '');
                onModalAddFormChange();
                var widthSel = document.getElementById('edit-order-add-width');
                var widthVal = item.width != null ? String(item.width) : '';
                if (widthVal && widthSel && !Array.prototype.find.call(widthSel.options, function (o) { return o.value === widthVal; })) {
                    var widthOpt = document.createElement('option');
                    widthOpt.value = widthVal;
                    widthOpt.textContent = widthVal + ' м';
                    widthSel.appendChild(widthOpt);
                }
                setEditOrderSelectValue('edit-order-add-width', item.width);
                onModalAddWidthChange();
                var lengthSel = document.getElementById('edit-order-add-length');
                var itemLen = item.length != null ? parseFloat(item.length) : NaN;
                var isOddLength = !isNaN(itemLen) && itemLen >= 3 && itemLen % 2 === 1;
                var lengthVal = isOddLength ? String(itemLen + 1) : (item.length != null ? String(item.length) : '');
                if (lengthVal && lengthSel && !Array.prototype.find.call(lengthSel.options, function (o) { return o.value === lengthVal; })) {
                    var lengthOpt = document.createElement('option');
                    lengthOpt.value = lengthVal;
                    lengthOpt.textContent = lengthVal + ' м';
                    lengthSel.appendChild(lengthOpt);
                }
                setEditOrderSelectValue('edit-order-add-length', lengthVal || item.length);
                var oddLenCb = document.getElementById('edit-order-add-odd-length');
                if (oddLenCb) {
                    oddLenCb.checked = isOddLength;
                    oddLenCb.disabled = !lengthVal || parseFloat(lengthVal) < ODD_LENGTH_MIN_BILLING;
                }
                onModalAddLengthChange();
                setEditOrderSelectValue('edit-order-add-frame', item.frame);
                setEditOrderSelectValue('edit-order-add-arcStep', String(item.arc_step || '1'));
                setEditOrderSelectValue('edit-order-add-polycarbonate', item.polycarbonate || '');
                if (catalogHint) {
                    if (catalogHintShown) {
                        catalogHint.textContent = 'Данные не подходят под текущий каталог. Показаны сохранённые значения.';
                        catalogHint.classList.remove('hidden');
                    } else {
                        catalogHint.textContent = '';
                        catalogHint.classList.add('hidden');
                    }
                }
                var derived = (item.extras || item.assembly) ? deriveOptionsFromExtrasAssembly(item.extras, item.assembly) : null;
                var opts = item.options && typeof item.options === 'object' && Object.keys(item.options).length > 0 ? item.options : null;
                var merged = {
                    bracing: (derived && derived.bracing) || (opts && opts.bracing) || false,
                    assembly: (derived && derived.assembly) || (opts && opts.assembly) || false,
                    groundHooks: (derived && derived.groundHooks) || (opts && opts.groundHooks) || false,
                    onWood: (derived && derived.onWood) || (opts && opts.onWood) || false,
                    onConcrete: (derived && derived.onConcrete) || (opts && opts.onConcrete) || false,
                    additionalProducts: (opts && opts.additionalProducts && opts.additionalProducts.length) ? opts.additionalProducts : (derived && derived.additionalProducts) || []
                };
                setEditOrderAddPanelOptions(merged);
                if (priceEl) priceEl.textContent = (typeof formatPrice === 'function' ? formatPrice(item.item_total || 0) : item.item_total) + ' ₽';
                var basePriceForResult = item.base_price;
                if ((basePriceForResult == null || isNaN(Number(basePriceForResult))) && (item.extras || item.assembly)) {
                    var extrasSum = parseExtrasAssemblySum(item.extras, item.assembly);
                    var it = item.item_total != null ? Number(item.item_total) : 0;
                    if (extrasSum > 0 && it >= extrasSum) basePriceForResult = Math.max(0, it - extrasSum);
                }
                lastModalCalculationResult = { model: item.model, width: item.width, length: item.length, frame: item.frame, arcStep: item.arc_step, polycarbonate: item.polycarbonate, form: item.form, item_total: item.item_total, base_price: basePriceForResult, extras: item.extras || '', assembly: item.assembly || '' };
            }
        }).catch(function (err) {
            if (typeof console !== 'undefined' && console.error) console.error('getCityDataForModal (edit):', err);
            if (typeof showToast === 'function') showToast('Не удалось загрузить данные по городу.', 'error');
        });
    } else {
        resetModalAddDropdowns();
        var cityForLoad = isKnownCityForEditOrder(city) ? city : '';
        getCityDataForModal(cityForLoad).then(function (r) {
            if (r && r.data) {
                modalCityData = r.data;
                populateModalAddDropdowns();
            }
        }).catch(function (err) {
            if (typeof console !== 'undefined' && console.error) console.error('getCityDataForModal:', err);
            if (typeof showToast === 'function') showToast('Не удалось загрузить данные по городу.', 'error');
        });
    }
}

function closeEditOrderAddPanel() {
    editOrderEditingIndex = null;
    lastModalCalculationResult = null;
    clearEditOrderAddBreakdown();
    var panel = document.getElementById('edit-order-add-item-panel');
    if (panel) panel.classList.add('hidden');
    var priceEl = document.getElementById('edit-order-add-price');
    if (priceEl) priceEl.textContent = '';
    var confirmBtn = document.getElementById('edit-order-add-confirm-btn');
    var savePosBtn = document.getElementById('edit-order-save-position-btn');
    if (confirmBtn) confirmBtn.classList.add('hidden');
    if (savePosBtn) savePosBtn.classList.add('hidden');
    if (typeof updateEditOrderGiftFromTotal === 'function') updateEditOrderGiftFromTotal();
}

function resetModalAddDropdowns() {
    var formSel = document.getElementById('edit-order-add-form');
    if (formSel) formSel.innerHTML = '<option value="">— Выберите модель —</option>';
    var w = document.getElementById('edit-order-add-width');
    if (w) w.innerHTML = '<option value="">— Сначала модель —</option>';
    var l = document.getElementById('edit-order-add-length');
    if (l) l.innerHTML = '<option value="">— Сначала ширину —</option>';
    var f = document.getElementById('edit-order-add-frame');
    if (f) f.innerHTML = '<option value="">— Сначала длину —</option>';
    var p = document.getElementById('edit-order-add-polycarbonate');
    if (p) p.innerHTML = '<option value="">— Выберите поликарбонат —</option>';
    var oddCb = document.getElementById('edit-order-add-odd-length');
    if (oddCb) { oddCb.checked = false; oddCb.disabled = true; }
    modalCityData = [];
}

function populateModalAddDropdowns() {
    if (!modalCityData || modalCityData.length === 0) return;
    var formCategories = Object.keys(availableForms);
    var formsAvailable = formCategories.filter(function (formType) {
        return modalCityData.some(function (item) {
            return availableForms[formType].some(function (form) { return normalizeString(item.form_name) === normalizeString(form.name); });
        });
    });
    formsAvailable.sort(function (a, b) { return (formPriority[a] || 100) - (formPriority[b] || 100); });
    var formSel = document.getElementById('edit-order-add-form');
    if (formSel) {
        formSel.innerHTML = '<option value="">— Модель —</option>';
        formsAvailable.forEach(function (form) {
            if (form && form !== 'Прочие') formSel.innerHTML += '<option value="' + escapeHtml(form) + '">' + escapeHtml(form) + '</option>';
        });
    }
    var rawPolys = modalCityData.map(function (g) { return g.polycarbonate_type; }).filter(Boolean);
    var uniquePoly = [];
    for (var i = 0; i < rawPolys.length; i++) {
        if (uniquePoly.indexOf(rawPolys[i]) === -1) uniquePoly.push(rawPolys[i]);
    }
    var preferredOrder = ['Стандарт 4 мм', 'Люкс 4 мм', 'Премиум 6 мм', 'Без поликарбоната'];
    var orderedPolys = preferredOrder.filter(function (poly) { return uniquePoly.indexOf(poly) !== -1; });
    uniquePoly.forEach(function (poly) {
        if (orderedPolys.indexOf(poly) === -1) orderedPolys.push(poly);
    });
    var polySel = document.getElementById('edit-order-add-polycarbonate');
    if (polySel) {
        polySel.innerHTML = '<option value="">— Поликарбонат —</option>';
        orderedPolys.forEach(function (poly) {
            polySel.innerHTML += '<option value="' + escapeHtml(poly) + '">' + escapeHtml(poly) + '</option>';
        });
    }
    var w = document.getElementById('edit-order-add-width');
    if (w) w.innerHTML = '<option value="">— Сначала модель —</option>';
    var l = document.getElementById('edit-order-add-length');
    if (l) l.innerHTML = '<option value="">— Сначала ширину —</option>';
    var f = document.getElementById('edit-order-add-frame');
    if (f) f.innerHTML = '<option value="">— Сначала длину —</option>';
}

function onModalAddFormChange() {
    var form = document.getElementById('edit-order-add-form') ? document.getElementById('edit-order-add-form').value : '';
    var widthSel = document.getElementById('edit-order-add-width');
    if (!widthSel || !modalCityData.length) return;
    widthSel.innerHTML = '<option value="">— Ширина —</option>';
    if (!form) return;
    var filtered = modalCityData.filter(function (item) { return getFormCategory(item.form_name) === form; });
    var widths = [];
    for (var i = 0; i < filtered.length; i++) {
        var w = filtered[i].width;
        if (widths.indexOf(w) === -1) widths.push(w);
    }
    widths.sort(function (a, b) { return Number(a) - Number(b); });
    widths.forEach(function (w) {
        widthSel.innerHTML += '<option value="' + w + '">' + w + ' м</option>';
    });
    var l = document.getElementById('edit-order-add-length');
    if (l) l.innerHTML = '<option value="">— Сначала ширину —</option>';
    var f = document.getElementById('edit-order-add-frame');
    if (f) f.innerHTML = '<option value="">— Сначала длину —</option>';
    clearEditOrderAddPanelCalculation();
}

function onModalAddWidthChange() {
    var form = document.getElementById('edit-order-add-form') ? document.getElementById('edit-order-add-form').value : '';
    var width = parseFloat(document.getElementById('edit-order-add-width') ? document.getElementById('edit-order-add-width').value : NaN);
    var lengthSel = document.getElementById('edit-order-add-length');
    if (!lengthSel || !modalCityData.length || isNaN(width)) return;
    lengthSel.innerHTML = '<option value="">— Длина —</option>';
    var filtered = modalCityData.filter(function (item) { return getFormCategory(item.form_name) === form && parseFloat(item.width) === width; });
    var lengths = [];
    for (var i = 0; i < filtered.length; i++) {
        var len = filtered[i].length;
        if (lengths.indexOf(len) === -1) lengths.push(len);
    }
    lengths.sort(function (a, b) { return Number(a) - Number(b); });
    lengths.forEach(function (len) {
        lengthSel.innerHTML += '<option value="' + len + '">' + len + ' м</option>';
    });
    var f = document.getElementById('edit-order-add-frame');
    if (f) f.innerHTML = '<option value="">— Сначала длину —</option>';
    var oddCb = document.getElementById('edit-order-add-odd-length');
    if (oddCb) { oddCb.checked = false; oddCb.disabled = true; }
    clearEditOrderAddPanelCalculation();
}

/** С панели «Параметры теплицы» в модалке редактирования: фактическая длина и длина для расчёта цены. */
function getEffectiveLengthFromEditPanel() {
    var lengthEl = document.getElementById('edit-order-add-length');
    var oddEl = document.getElementById('edit-order-add-odd-length');
    var billing = lengthEl && lengthEl.value ? parseFloat(lengthEl.value) : NaN;
    if (isNaN(billing)) return { effective: NaN, billing: NaN };
    var useOdd = oddEl && oddEl.checked && billing >= ODD_LENGTH_MIN_BILLING;
    return { effective: useOdd ? billing - 1 : billing, billing: billing };
}

function onModalAddLengthChange() {
    var form = document.getElementById('edit-order-add-form') ? document.getElementById('edit-order-add-form').value : '';
    var width = parseFloat(document.getElementById('edit-order-add-width') ? document.getElementById('edit-order-add-width').value : NaN);
    var length = parseFloat(document.getElementById('edit-order-add-length') ? document.getElementById('edit-order-add-length').value : NaN);
    var frameSel = document.getElementById('edit-order-add-frame');
    var oddCb = document.getElementById('edit-order-add-odd-length');
    if (oddCb) {
        if (!isNaN(length) && length >= ODD_LENGTH_MIN_BILLING) {
            oddCb.disabled = false;
        } else {
            oddCb.checked = false;
            oddCb.disabled = true;
        }
    }
    if (!frameSel || !modalCityData.length || isNaN(length)) return;
    frameSel.innerHTML = '<option value="">— Каркас —</option>';
    var filtered = modalCityData.filter(function (item) {
        return getFormCategory(item.form_name) === form && parseFloat(item.width) === width && parseFloat(item.length) === length;
    });
    var frameOrder = ['20х20', '40х20', '20х20+20х20', '40х20+20х20', '40х20+40х20'];
    var descToShort = function (desc) {
        if (!desc) return '';
        var clean = desc.replace(/двойная\s*/gi, '').replace(/оцинкованная труба/gi, '').replace(/мм/gi, '').trim().replace(/\s*\+\s*/g, '+');
        if (clean.indexOf('+') !== -1) return clean;
        var m = clean.match(/(20х20|40х20)/gi);
        return m ? m.join(',') : clean;
    };
    var frames = [];
    for (var i = 0; i < filtered.length; i++) {
        var short = descToShort(filtered[i].frame_description);
        if (short && frames.indexOf(short) === -1) frames.push(short);
    }
    frames.sort(function (a, b) {
        var iA = frameOrder.indexOf(a.trim());
        var iB = frameOrder.indexOf(b.trim());
        if (iA === -1 && iB === -1) return String(a).localeCompare(b);
        if (iA === -1) return 1;
        if (iB === -1) return -1;
        return iA - iB;
    });
    frames.forEach(function (fr) {
        frameSel.innerHTML += '<option value="' + escapeHtml(fr) + '">' + escapeHtml(fr) + '</option>';
    });
    clearEditOrderAddPanelCalculation();
}

function setEditOrderFieldValue(id, value) {
    var el = document.getElementById(id);
    if (el) el.value = value;
}

/** Очистить форму редактирования (контакты, состав, подарки). Вызывать при «заказов не найдено», чтобы внизу не висели данные старого заказа. */
function clearEditOrderForm() {
    setEditOrderFieldValue('edit-order-client-name', '');
    setEditOrderFieldValue('edit-order-client-phone', '');
    setEditOrderFieldValue('edit-order-delivery-date', '');
    setEditOrderFieldValue('edit-order-delivery-date-display', '');
    _editOrderCalSelected = '';
    _editOrderCalMonth = null;
    closeEditOrderCalendar();
    setEditOrderFieldValue('edit-order-address-part1', '');
    setEditOrderFieldValue('edit-order-address-part2', '');
    setEditOrderFieldValue('edit-order-address-part3', '');
    var noPlot = document.getElementById('edit-order-no-plot');
    if (noPlot) noPlot.checked = false;
    setEditOrderFieldValue('edit-order-source', '');
    setEditOrderFieldValue('edit-order-comment', '');
    setEditOrderFieldValue('edit-order-gift', '');
    editOrderComposition = [];
    lastLoadedOrderTotalForDisplay = null;
    lastEditOrderManager = '';
    lastLoadedOrderCommercialOffer = '';
    if (typeof currentOrderIdForEdit !== 'undefined') currentOrderIdForEdit = null;
    if (typeof currentOrderCreatedAtForEdit !== 'undefined') currentOrderCreatedAtForEdit = null;
    editOrderGiftSlotsPrev = -1;
    _editOrderLoadedCityRaw = null;
    _editOrderLoadedWarehouseCityKey = null;
    if (typeof renderEditOrderCompositionList === 'function') renderEditOrderCompositionList();
    if (typeof updateEditOrderUndoRedoButtons === 'function') updateEditOrderUndoRedoButtons();
    showEditOrderStep(1);
}

function setEditOrderSelectValue(id, value) {
    var el = document.getElementById(id);
    if (!el) return;
    el.value = value;
    if (el.value !== value && el.options.length) {
        for (var i = 0; i < el.options.length; i++) {
            if (el.options[i].value === value) { el.selectedIndex = i; break; }
        }
    }
}

/** Извлечь height, snowLoad, horizontalTies, equipment из блока commercial_offer. */
function parseCatalogFieldsFromOfferBlock(blockText) {
    if (!blockText || typeof blockText !== 'string') return {};
    var out = {};
    var m = blockText.match(/Высота:\s*([^\n]+)/);
    if (m) out.height = m[1].trim();
    m = blockText.match(/Снеговая нагрузка:\s*([^\n]+)/);
    if (m) out.snowLoad = m[1].trim();
    m = blockText.match(/Горизонтальные стяжки:\s*([^\n]+)/);
    if (m) out.horizontalTies = m[1].trim();
    m = blockText.match(/Комплектация:\s*([^\n]+)/);
    if (m) out.equipment = m[1].trim();
    return out;
}

/** Получить блок теплицы по индексу из commercial_offer (для 2+ разных — блоки разделены «N теплица:»). */
function getGreenhouseBlockFromOffer(offerText, itemIndex) {
    if (!offerText || typeof offerText !== 'string') return '';
    if (offerText.indexOf('1 теплица:') === -1) return offerText;
    var parts = offerText.split(/\d+ теплица:\s*\n/);
    return (parts[itemIndex + 1] || parts[1] || '').trim();
}

/** Преобразовать позицию editOrderComposition в формат calc для generateFullOrderTemplate. */
function editOrderItemToCalc(item, deliveryCost, isFirstOfMultiple, orderTotalForSingle, catalogOverride) {
    var basePrice = (item.base_price != null && !isNaN(Number(item.base_price))) ? Number(item.base_price) : (item.item_total || 0);
    var extrasStr = (item.extras != null ? String(item.extras) : '').trim();
    var assemblyStr = (item.assembly != null ? String(item.assembly) : '').trim();
    var finalTotal = (orderTotalForSingle != null && !isNaN(orderTotalForSingle)) ? orderTotalForSingle : (item.item_total != null ? item.item_total : basePrice);
    var cat = catalogOverride && typeof catalogOverride === 'object' ? catalogOverride : {};
    return {
        model: item.model || 'Теплица',
        width: item.width,
        length: item.length,
        frame: item.frame || '',
        arcStep: item.arc_step != null ? String(item.arc_step) : '1',
        polycarbonate: item.polycarbonate || '',
        basePrice: basePrice,
        snowLoad: (cat.snowLoad && cat.snowLoad.trim()) || 'Не указано',
        height: (cat.height && cat.height.trim()) || 'Не указано',
        horizontalTies: (cat.horizontalTies && cat.horizontalTies.trim()) || 'Не указано',
        equipment: (cat.equipment && cat.equipment.trim()) || 'Не указано',
        foundationText: extrasStr,
        assemblyText: assemblyStr,
        bedsAssemblyText: '',
        additionalProductsText: '',
        deliveryPrice: (isFirstOfMultiple ? (deliveryCost || 0) : 0),
        finalTotalPrice: finalTotal
    };
}

/** Собрать из полей модалки только редактируемые поля для update (частичное обновление). Включает состав и итог (Этап 6). */
function buildOrderPayloadFromEditModal() {
    // raw-preserve: решаем, сохранять raw legacy gift или пересобирать в канонический формат
    var _giftCurrentTier = (typeof getGiftSlotsByTotal === 'function' && typeof getEditOrderCompositionTotal === 'function')
        ? getGiftSlotsByTotal(getEditOrderCompositionTotal()) : 0;
    var _giftTierChanged = _editOrderOriginalGiftRaw !== null && _giftCurrentTier !== _editOrderGiftTierAtOpen;
    if (!_editOrderGiftTouchedByUser && !_giftTierChanged && _editOrderOriginalGiftRaw !== null) {
        // Пользователь не трогал gifts и tier не изменился: вернуть оригинальный raw text в поле
        var _giftElRaw = document.getElementById('edit-order-gift');
        if (_giftElRaw) _giftElRaw.value = _editOrderOriginalGiftRaw;
    } else {
        // Пользователь реально менял gifts или tier изменился: пересобрать в канонический формат
        if (typeof onEditOrderGiftSelectChange === 'function') onEditOrderGiftSelectChange();
    }
    var name = (document.getElementById('edit-order-client-name') && document.getElementById('edit-order-client-name').value) ? document.getElementById('edit-order-client-name').value.trim() : '';
    var phone = (document.getElementById('edit-order-client-phone') && document.getElementById('edit-order-client-phone').value) ? document.getElementById('edit-order-client-phone').value.trim() : '';
    var dateInput = document.getElementById('edit-order-delivery-date');
    var deliveryDate = dateInput ? dateInput.value.trim() : '';
    var addr1 = (document.getElementById('edit-order-address-part1') && document.getElementById('edit-order-address-part1').value) ? document.getElementById('edit-order-address-part1').value.trim() : '';
    var addr2 = (document.getElementById('edit-order-address-part2') && document.getElementById('edit-order-address-part2').value) ? document.getElementById('edit-order-address-part2').value.trim() : '';
    var addr3 = (document.getElementById('edit-order-address-part3') && document.getElementById('edit-order-address-part3').value) ? document.getElementById('edit-order-address-part3').value.trim() : '';
    var noPlot = document.getElementById('edit-order-no-plot') ? document.getElementById('edit-order-no-plot').checked : false;
    var source = document.getElementById('edit-order-source') ? document.getElementById('edit-order-source').value : '';
    var comment = document.getElementById('edit-order-comment') ? document.getElementById('edit-order-comment').value.trim() : '';

    var fullAddress = [addr1, addr2, noPlot ? 'без номера участка' : addr3].filter(Boolean).join(', ');
    var dateForDb = deliveryDate && deliveryDate.indexOf('-') !== -1 ? formatDateRu(deliveryDate) : deliveryDate;
    var warehouseCityKey = (typeof resolveEditOrderCalendarCity_ === 'function') ? (resolveEditOrderCalendarCity_() || '') : '';

    // raw-preserve: решаем по фактическому value, а не только по touched-flag
    // (touched flag ненадёжен: listener мог не сработать при программном вводе)
    var _phoneEffectivelyChanged = _editOrderOriginalPhoneRaw === null
        || phone.trim() !== _editOrderOriginalPhoneRaw.trim();
    var _clientPhoneForPayload;
    if (!_phoneEffectivelyChanged) {
        // значение не менялось — возвращаем literally original raw
        _clientPhoneForPayload = _editOrderOriginalPhoneRaw;
    } else {
        // значение реально изменилось — канонизируем; dual-phone slash-format сохраняется через sanitizePhoneForSave_
        _clientPhoneForPayload = sanitizePhoneForSave_(phone);
    }

    var payload = {
        client_name: name,
        client_phone: _clientPhoneForPayload,
        delivery_date: dateForDb,
        delivery_address: fullAddress,
        warehouse_city_key: warehouseCityKey || null,
        source: source,
        comment: comment
    };

    var giftEl = document.getElementById('edit-order-gift');
    var giftValue = giftEl ? (giftEl.value || '').trim() : '';
    // Финальная граница: если сумма ниже порога — не сохраняем подарок
    var giftTotal = getEditOrderCompositionTotal ? getEditOrderCompositionTotal() : 0;
    if (giftTotal < GIFT_THRESHOLDS.slot1) giftValue = '';
    payload.gift = giftValue;

    var total = getEditOrderCompositionTotal();
    if (editOrderComposition.length === 1) {
        var one = editOrderComposition[0];
        payload.model = one.model;
        payload.width = one.width != null ? String(one.width) : '';
        payload.length = one.length != null ? String(one.length) : '';
        payload.frame = one.frame || '';
        payload.arc_step = one.arc_step != null ? String(one.arc_step) : '';
        payload.polycarbonate = one.polycarbonate || '';
        payload.extras = (one.extras != null ? String(one.extras) : '').trim();
        payload.assembly = (one.assembly != null ? String(one.assembly) : '').trim();
        payload.total = total;
        payload.delivery_cost = editOrderDeliveryCost || 0;
        if (one.base_price != null && !isNaN(Number(one.base_price))) payload.unit_price = Number(one.base_price);
        payload.line_items = null;
    } else if (editOrderComposition.length > 1) {
        payload.line_items = JSON.stringify(editOrderComposition.map(function (item) {
            var row = {
                model: item.model,
                width: item.width,
                length: item.length,
                frame: item.frame,
                arc_step: item.arc_step,
                polycarbonate: item.polycarbonate,
                item_total: item.item_total,
                extras: (item.extras != null ? String(item.extras) : '').trim(),
                assembly: (item.assembly != null ? String(item.assembly) : '').trim(),
                form: item.form || '',
                city: item.city || ''
            };
            if (item.base_price != null && !isNaN(Number(item.base_price))) row.base_price = Number(item.base_price);
            if (item.options && typeof item.options === 'object') row.options = item.options;
            return row;
        }));
        payload.extras = '';
        payload.assembly = '';
        payload.total = total;
        payload.delivery_cost = editOrderDeliveryCost || 0;
    }
    var orderTotal = getEditOrderCompositionTotal ? getEditOrderCompositionTotal() : total;
    var editOrderCart = editOrderComposition.map(function (item, i) {
        var block = getGreenhouseBlockFromOffer(lastLoadedOrderCommercialOffer, i);
        var parsed = parseCatalogFieldsFromOfferBlock(block);
        var catalogOverride = {
            height: (item.height && String(item.height).trim()) ? String(item.height).trim() : (parsed.height || ''),
            snowLoad: (item.snowLoad && String(item.snowLoad).trim()) ? String(item.snowLoad).trim() : (parsed.snowLoad || ''),
            horizontalTies: (item.horizontalTies && String(item.horizontalTies).trim()) ? String(item.horizontalTies).trim() : (parsed.horizontalTies || ''),
            equipment: (item.equipment && String(item.equipment).trim()) ? String(item.equipment).trim() : (parsed.equipment || '')
        };
        return editOrderItemToCalc(item, editOrderDeliveryCost, i === 0, editOrderComposition.length === 1 ? orderTotal : null, catalogOverride);
    });
    // dual-phone: commercial_offer получает фактически сохраняемое значение телефона, а не normalizePhone
    var client = {
        name: name,
        manager: lastEditOrderManager || 'Менеджер',
        deliveryDate: deliveryDate,
        address: fullAddress,
        phone: _clientPhoneForPayload
    };
    var firstCalc = editOrderCart[0];
    payload.commercial_offer = (editOrderCart.length > 0 && typeof generateFullOrderTemplate === 'function') ? generateFullOrderTemplate(firstCalc, client, editOrderCart, giftValue, function () { return orderTotal; }) : '';
    return payload;
}

/** Валидация полей формы редактирования в модалке. Возвращает массив строк с ошибками (пустой — всё ок). */
function validateEditOrderModal() {
    var errors = [];
    var name = document.getElementById('edit-order-client-name') ? document.getElementById('edit-order-client-name').value.trim() : '';
    var phone = document.getElementById('edit-order-client-phone') ? document.getElementById('edit-order-client-phone').value.trim() : '';
    var dateInput = document.getElementById('edit-order-delivery-date');
    var deliveryDate = dateInput ? dateInput.value.trim() : '';
    var addr1 = document.getElementById('edit-order-address-part1') ? document.getElementById('edit-order-address-part1').value.trim() : '';
    var addr2 = document.getElementById('edit-order-address-part2') ? document.getElementById('edit-order-address-part2').value.trim() : '';
    var addr3 = document.getElementById('edit-order-address-part3') ? document.getElementById('edit-order-address-part3').value.trim() : '';
    var noPlot = document.getElementById('edit-order-no-plot') ? document.getElementById('edit-order-no-plot').checked : false;
    var source = document.getElementById('edit-order-source') ? document.getElementById('edit-order-source').value : '';

    if (!name) errors.push('имя клиента');
    // raw-preserve: пропускаем валидацию только если phone фактически не менялся
    var _phoneChangedForValidation = _editOrderOriginalPhoneRaw === null
        || phone.trim() !== _editOrderOriginalPhoneRaw.trim();
    if (_phoneChangedForValidation) {
        if (!isValidPhoneForSave_(phone)) errors.push('телефон: 11 цифр, с 7 (или формат 79111111111 / 79222222222)');
    }
    if (!deliveryDate) errors.push('дата доставки');
    if (typeof isOrderFormAddressRequired === 'function' && isOrderFormAddressRequired()) {
        if (!addr1) errors.push('регион/город');
        if (!addr2) errors.push('улица');
        if (!noPlot && !addr3) errors.push('дом/участок');
    }
    if (!source) errors.push('магазин на Авито');
    if (!editOrderComposition || editOrderComposition.length === 0) errors.push('добавьте хотя бы одну позицию в состав');
    return errors;
}

/** Снять подсветку ошибок со всех полей формы редактирования заказа. */
function clearEditOrderFieldErrors_() {
    var step2 = document.getElementById('edit-order-step2');
    if (!step2) return;
    step2.querySelectorAll('.edit-order-field-error').forEach(function (el) { el.classList.remove('edit-order-field-error'); });
    step2.querySelectorAll('.edit-order-validation-msg').forEach(function (el) { el.textContent = ''; });
}

/** Показать ошибку у поля формы редактирования (wrapperId — id контейнера .edit-order-field, например eo-name). */
function setEditOrderFieldError_(wrapperId, message) {
    var wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;
    wrapper.classList.add('edit-order-field-error');
    var msgEl = wrapper.querySelector('.edit-order-validation-msg');
    if (msgEl) msgEl.textContent = message || '';
}

/** По массиву ошибок из validateEditOrderModal() подсветить соответствующие поля и вывести сообщения. */
function applyEditOrderErrors_(errors) {
    var map = {
        'имя клиента': ['eo-name', 'Введите имя клиента'],
        'телефон: 11 цифр, с 7': ['eo-phone', 'Введите 11 цифр, начиная с 7 (например 79211234567)'],
        'дата доставки': ['eo-date', 'Укажите дату доставки'],
        'регион/город': ['eo-addr1', 'Введите регион и город'],
        'улица': ['eo-addr2', 'Введите улицу'],
        'дом/участок': ['eo-addr3', 'Введите дом и участок'],
        'магазин на Авито': ['eo-source', 'Выберите магазин на Авито'],
        'добавьте хотя бы одну позицию в состав': ['eo-composition', 'Добавьте хотя бы одну позицию в состав']
    };
    for (var i = 0; i < errors.length; i++) {
        var pair = map[errors[i]];
        if (pair) setEditOrderFieldError_(pair[0], pair[1]);
    }
}

/** Начать редактирование заказа: показать «Загрузка…», загрузить заказ, заполнить форму, шаг 2.
 * @param {string} orderId — id заказа в Supabase
 * @param {function} [optFinally] — вызывается по завершении (успех или ошибка), например скрыть оверлей при deep link ?id=
 */
function startEditOrder(orderId, optFinally) {
    if (!orderId) return;
    var hintEl = document.getElementById('edit-order-form-hint');
    try {
        if (hintEl) {
            hintEl.textContent = 'Загрузка заказа...';
            hintEl.className = 'edit-order-hint';
            hintEl.style.display = '';
        }
        showEditOrderStep(2);
        var body = document.getElementById('edit-order-modal-body');
        if (body) body.scrollTop = 0;
    } catch (err) {
        console.error('startEditOrder init:', err);
        if (typeof showToast === 'function') showToast('Ошибка: ' + (err.message || 'не удалось открыть форму'), 'error');
        if (typeof optFinally === 'function') optFinally();
        return;
    }
    fetchOrderById(orderId).then(function (order) {
        if (hintEl) { hintEl.style.display = 'none'; hintEl.textContent = ''; }
        if (!order) {
            if (typeof showToast === 'function') showToast('Заказ не найден', 'error');
            showEditOrderStep(1);
            if (typeof optFinally === 'function') optFinally();
            return;
        }
        var orderStatus = (order.status || '').trim().toLowerCase();
        if (orderStatus === 'cancelled' || orderStatus === 'canceled' || orderStatus === 'отмена') {
            if (typeof showToast === 'function') showToast('Отменённый заказ нельзя редактировать', 'error');
            showEditOrderStep(1);
            if (typeof optFinally === 'function') optFinally();
            return;
        }
        currentOrderIdForEdit = order.id;
        currentOrderCreatedAtForEdit = order.created_at || null;
        clearEditOrderFieldErrors_();
        fillEditOrderForm(order);
        showEditOrderStep(2);
        var titleEl = document.getElementById('edit-order-modal-title');
        if (titleEl) titleEl.textContent = EDIT_ORDER_MODAL_TITLE_BASE + ' · ' + (order.client_phone || '').trim();
        var first = document.getElementById('edit-order-client-name');
        if (first) setTimeout(function () { first.focus(); }, 80);
        if (typeof optFinally === 'function') optFinally();
    }).catch(function (err) {
        console.error('fetchOrderById error:', err);
        var hintEl2 = document.getElementById('edit-order-form-hint');
        if (hintEl2) { hintEl2.style.display = 'none'; hintEl2.textContent = ''; }
        if (typeof showToast === 'function') showToast('Ошибка загрузки заказа', 'error');
        if (hintEl2) {
            hintEl2.textContent = 'Ошибка загрузки: ' + (err.message || 'попробуйте позже');
            hintEl2.className = 'edit-order-hint edit-order-hint--error';
            hintEl2.style.display = '';
        }
        showEditOrderStep(1);
        if (typeof optFinally === 'function') optFinally();
    });
}
window.startEditOrder = startEditOrder;

window.openEditOrderModal = openEditOrderModal;
window.openEditOrderModalWithPhone = openEditOrderModalWithPhone;
window.closeEditOrderModal = closeEditOrderModal;
window.requestCloseEditOrderModal = requestCloseEditOrderModal;
window.searchOrdersByPhone = searchOrdersByPhone;

/** Собрать фокусируемые элементы внутри модалки (видимые: не внутри .hidden). Для ловушки фокуса. */
function getEditOrderModalFocusable(modal) {
    if (!modal) return [];
    var selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    var all = modal.querySelectorAll(selector);
    var out = [];
    for (var i = 0; i < all.length; i++) {
        var el = all[i];
        if (el.offsetParent !== null && !el.closest('.hidden')) out.push(el);
    }
    return out;
}

// Инициализация модального окна «Редактирование заказа» (клик по фону, Escape, Ctrl+Enter, ловушка фокуса, кнопки)
function initEditOrderModal() {
    var lastEditOrderSearchedPhone = '';

    // Кнопка «Редактировать»: делегирование на саму модалку (bubble). Не зависит от inline onclick и не перехватывает до кнопки.
    var modalEl = document.getElementById('edit-order-modal');
    if (modalEl) {
        modalEl.addEventListener('click', function (e) {
            var btn = e.target && e.target.closest && e.target.closest('.edit-order-item-btn');
            if (!btn) return;
            var listEl = document.getElementById('edit-order-list');
            if (!listEl || !listEl.contains(btn)) return;
            e.preventDefault();
            var orderId = btn.getAttribute('data-order-id');
            if (!orderId) return;
            if (typeof startEditOrder === 'function') {
                startEditOrder(orderId);
            } else {
                if (typeof showToast === 'function') showToast('Ошибка: функция редактирования недоступна', 'error');
            }
        }, false);
    }

    document.addEventListener('keydown', function (e) {
        var confirmDialog = document.getElementById('edit-order-close-confirm');
        if (e.key === 'Escape' && confirmDialog && !confirmDialog.classList.contains('hidden')) {
            e.preventDefault();
            hideEditOrderCloseConfirm();
            return;
        }
        var modal = document.getElementById('edit-order-modal');
        if (!modal || modal.classList.contains('hidden')) return;
        if (e.key === 'Escape') {
            e.preventDefault();
            requestCloseEditOrderModal();
            return;
        }
        if (e.ctrlKey && e.key === 'Enter') {
            var body = document.getElementById('edit-order-modal-body');
            if (body && body.getAttribute('data-step') === '2') {
                e.preventDefault();
                var saveBtn = document.getElementById('edit-order-save-btn');
                if (saveBtn) saveBtn.click();
            }
            return;
        }
        if (e.key === 'Tab') {
            var focusable = getEditOrderModalFocusable(modal);
            if (focusable.length === 0) return;
            var current = document.activeElement;
            var idx = focusable.indexOf(current);
            if (idx === -1) return;
            if (e.shiftKey) {
                if (idx === 0) {
                    e.preventDefault();
                    focusable[focusable.length - 1].focus();
                }
            } else {
                if (idx === focusable.length - 1) {
                    e.preventDefault();
                    focusable[0].focus();
                }
            }
        }
    });

    document.addEventListener('click', function (event) {
        var modal = document.getElementById('edit-order-modal');
        if (modal && !modal.classList.contains('hidden') && event.target === modal) {
            requestCloseEditOrderModal();
        }
    });

    window.addEventListener('beforeunload', function (e) {
        var modal = document.getElementById('edit-order-modal');
        if (modal && !modal.classList.contains('hidden') && hasEditOrderUnsavedChanges()) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    function doGoBackToEditOrderList() {
        currentOrderIdForEdit = null;
        currentOrderCreatedAtForEdit = null;
        editOrderCompositionUndoSample = null;
        editOrderCompositionRedoSample = null;
        editOrderStateUndoSample = null;
        editOrderStateRedoSample = null;
        lastSavedEditOrderState = null;
        lastSavedEditOrderFormState = null;
        lastPersistedEditOrderState = null;
        lastPersistedEditOrderFormState = null;
        showEditOrderStep(1);
    }
    function goBackToEditOrderList() {
        if (hasEditOrderUnsavedChanges()) {
            showEditOrderCloseConfirm(function () {
                hideEditOrderCloseConfirm();
                doGoBackToEditOrderList();
            });
            return;
        }
        doGoBackToEditOrderList();
    }

    var confirmSaveBtn = document.getElementById('edit-order-close-confirm-save');
    var confirmStayBtn = document.getElementById('edit-order-close-confirm-stay');
    var confirmDiscardBtn = document.getElementById('edit-order-close-confirm-discard');
    if (confirmSaveBtn) confirmSaveBtn.addEventListener('click', function () {
        hideEditOrderCloseConfirm();
        var saveBtn = document.getElementById('edit-order-save-btn');
        if (saveBtn) saveBtn.click();
    });
    if (confirmStayBtn) confirmStayBtn.addEventListener('click', function () { hideEditOrderCloseConfirm(); });
    if (confirmDiscardBtn) confirmDiscardBtn.addEventListener('click', function () {
        if (typeof editOrderCloseConfirmCallback === 'function') editOrderCloseConfirmCallback();
        else hideEditOrderCloseConfirm();
    });

    var undoBtn = document.getElementById('edit-order-undo-btn');
    if (undoBtn) {
        undoBtn.addEventListener('click', function () {
            if (!editOrderStateUndoSample) return;
            editOrderStateRedoSample = getEditOrderStateSnapshot();
            restoreEditOrderState(editOrderStateUndoSample);
            editOrderStateUndoSample = null;
            lastSavedEditOrderState = getEditOrderStateSnapshot();
            updateEditOrderUndoRedoButtons();
            if (typeof showToast === 'function') showToast('Действие отменено', 'success');
        });
    }
    var redoBtn = document.getElementById('edit-order-redo-btn');
    if (redoBtn) {
        redoBtn.addEventListener('click', function () {
            if (!editOrderStateRedoSample) return;
            editOrderStateUndoSample = getEditOrderStateSnapshot();
            restoreEditOrderState(editOrderStateRedoSample);
            editOrderStateRedoSample = null;
            lastSavedEditOrderState = getEditOrderStateSnapshot();
            updateEditOrderUndoRedoButtons();
            if (typeof showToast === 'function') showToast('Действие возвращено', 'success');
        });
    }

    var saveBtn = document.getElementById('edit-order-save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async function () {
            var hintEl = document.getElementById('edit-order-form-hint');
            if (hintEl) { hintEl.style.display = 'none'; hintEl.textContent = ''; hintEl.className = 'edit-order-hint'; }
            clearEditOrderFieldErrors_();
            var errs = validateEditOrderModal();
            if (errs.length) {
                applyEditOrderErrors_(errs);
                if (hintEl) {
                    hintEl.textContent = 'Заполните: ' + errs.join(', ');
                    hintEl.className = 'edit-order-hint edit-order-hint--error';
                    hintEl.style.display = '';
                }
                if (typeof showToast === 'function') showToast('Заполните все обязательные поля', 'error');
                return;
            }
            var editAddr1 = document.getElementById('edit-order-address-part1') ? document.getElementById('edit-order-address-part1').value.trim() : '';
            var isOldOrder = currentOrderCreatedAtForEdit && String(currentOrderCreatedAtForEdit).slice(0, 10) < '2026-03-09';
            if (editAddr1 && typeof checkAddressInDeliveryRegion === 'function' && !isOldOrder) {
                var editWarehouseCityKey = (typeof resolveEditOrderCalendarCity_ === 'function') ? (resolveEditOrderCalendarCity_() || '') : '';
                var regionCheck = await checkAddressInDeliveryRegion(editAddr1, editWarehouseCityKey);
                if (!regionCheck.inRegion) {
                    setEditOrderFieldError_('eo-addr1', regionCheck.errorMessage || 'Доставка в этот регион не осуществляется.');
                    if (hintEl) {
                        hintEl.textContent = regionCheck.errorMessage || 'Доставка в этот регион не осуществляется.';
                        hintEl.className = 'edit-order-hint edit-order-hint--error';
                        hintEl.style.display = '';
                    }
                    if (typeof showToast === 'function') showToast(regionCheck.errorMessage || 'Доставка в этот регион не осуществляется.', 'error');
                    return;
                }
            }
            if (!currentOrderIdForEdit) {
                if (typeof showToast === 'function') showToast('Ошибка: заказ не выбран', 'error');
                return;
            }
            var statusRes = await supabaseClient.from('orders').select('status').eq('id', currentOrderIdForEdit).maybeSingle();
            if (statusRes.data) {
                var st = (statusRes.data.status || '').trim().toLowerCase();
                if (st === 'cancelled' || st === 'canceled' || st === 'отмена') {
                    if (typeof showToast === 'function') showToast('Отменённый заказ нельзя редактировать', 'error');
                    if (hintEl) { hintEl.textContent = 'Отменённый заказ нельзя редактировать'; hintEl.className = 'edit-order-hint edit-order-hint--error'; hintEl.style.display = ''; }
                    return;
                }
            }
            // Если суб-панель редактирования позиции открыта и есть несохранённый расчёт —
            // автоматически применяем его к составу перед сохранением (баг: пользователь нажал
            // «Рассчитать» но не нажал «Сохранить позицию», а сразу «Сохранить изменения»).
            if (lastModalCalculationResult && editOrderEditingIndex != null &&
                editOrderEditingIndex >= 0 && editOrderEditingIndex < editOrderComposition.length) {
                editOrderComposition[editOrderEditingIndex] = {
                    model: lastModalCalculationResult.model,
                    width: lastModalCalculationResult.width,
                    length: lastModalCalculationResult.length,
                    frame: lastModalCalculationResult.frame,
                    arc_step: lastModalCalculationResult.arcStep,
                    polycarbonate: lastModalCalculationResult.polycarbonate,
                    item_total: lastModalCalculationResult.item_total,
                    base_price: lastModalCalculationResult.base_price,
                    form: lastModalCalculationResult.form,
                    city: (typeof getEditOrderAddCity === 'function') ? getEditOrderAddCity() : (editOrderComposition[editOrderEditingIndex].city || ''),
                    extras: lastModalCalculationResult.extras || '',
                    assembly: lastModalCalculationResult.assembly || '',
                    options: (typeof getEditOrderAddPanelOptionsForStorage === 'function') ? getEditOrderAddPanelOptionsForStorage() : undefined,
                    height: lastModalCalculationResult.height,
                    snowLoad: lastModalCalculationResult.snowLoad,
                    horizontalTies: lastModalCalculationResult.horizontalTies,
                    equipment: lastModalCalculationResult.equipment
                };
                closeEditOrderAddPanel();
                lastModalCalculationResult = null;
                renderEditOrderCompositionList();
            }
            saveBtn.disabled = true;
            var payload = buildOrderPayloadFromEditModal();
            supabaseClient.from('orders').update(payload).eq('id', currentOrderIdForEdit).then(function (res) {
                if (res.error) throw res.error;
                if (typeof showToast === 'function') showToast('Данные по заказу изменены.', 'success');
                if (hintEl) { hintEl.textContent = 'Данные по заказу изменены.'; hintEl.className = 'edit-order-hint'; hintEl.style.display = ''; }
                var justEditedId = currentOrderIdForEdit;
                // 5.4.1: остаёмся на шаге 2 (форме) — менеджер видит результат и может сразу ещё раз поправить.
                // Обновляем lastSaved чтобы форма не считалась «с несохранёнными изменениями».
                lastSavedEditOrderState = getEditOrderStateSnapshot();
                lastSavedEditOrderFormState = getEditOrderFormSnapshot();
                lastPersistedEditOrderState = getEditOrderStateSnapshot();
                lastPersistedEditOrderFormState = getEditOrderFormSnapshot();
                if (typeof updateEditOrderUndoRedoButtons === 'function') updateEditOrderUndoRedoButtons();
                // Обновляем список в фоне (шаг 1), чтобы при возврате данные были актуальны.
                if (lastEditOrderSearchedPhone) {
                    searchOrdersByPhone(lastEditOrderSearchedPhone).then(function (orders) {
                        renderEditOrderList(orders);
                        var searchHint = document.getElementById('edit-order-search-hint');
                        if (searchHint) {
                            searchHint.textContent = orders.length ? 'Найдено заказов: ' + orders.length : '';
                            searchHint.className = 'edit-order-hint';
                            searchHint.style.display = '';
                        }
                    });
                }
            }).catch(function (err) {
                console.error('update order error:', err);
                if (typeof showToast === 'function') showToast('Ошибка сохранения: ' + (err.message || 'попробуйте позже'), 'error');
                if (hintEl) { hintEl.textContent = 'Ошибка: ' + (err.message || 'попробуйте позже'); hintEl.className = 'edit-order-hint edit-order-hint--error'; hintEl.style.display = ''; }
            }).finally(function () {
                saveBtn.disabled = false;
            });
        });
    }

    var cancelOrderBtn = document.getElementById('edit-order-cancel-order-btn');
    if (cancelOrderBtn) {
        cancelOrderBtn.addEventListener('click', function () {
            if (!currentOrderIdForEdit) {
                if (typeof showToast === 'function') showToast('Ошибка: заказ не выбран', 'error');
                return;
            }
            if (!confirm('Вы уверены, что хотите отменить заказ?')) return;
            var reason = prompt('По какой причине отменяем?');
            if (reason === null) return;
            reason = (reason || '').trim();
            if (!reason) {
                if (typeof showToast === 'function') showToast('Укажите причину отмены', 'error');
                return;
            }
            var commentEl = document.getElementById('edit-order-comment');
            var existingComment = (commentEl && commentEl.value) ? commentEl.value.trim() : '';
            var newComment = existingComment + (existingComment ? '\n' : '') + 'Причина отмены: ' + reason;
            cancelOrderBtn.disabled = true;
            supabaseClient.from('orders').update({ status: 'cancelled', comment: newComment }).eq('id', currentOrderIdForEdit).then(function (res) {
                if (res.error) throw res.error;
                if (typeof showToast === 'function') showToast('Заказ отменён. Уведомления отправятся поставщику и ответственному менеджеру.', 'success');
                var phoneToRefresh = lastEditOrderSearchedPhone || '';
                if (!phoneToRefresh) {
                    var phoneInput = document.getElementById('edit-order-client-phone');
                    if (phoneInput) phoneToRefresh = (phoneInput.value || '').trim();
                }
                if (phoneToRefresh && typeof normalizePhone === 'function') phoneToRefresh = normalizePhone(phoneToRefresh);
                if (phoneToRefresh && String(phoneToRefresh).length >= 11 && typeof searchOrdersByPhone === 'function') {
                    searchOrdersByPhone(phoneToRefresh).then(function (orders) {
                        if (typeof renderEditOrderList === 'function') renderEditOrderList(orders);
                        var searchHint = document.getElementById('edit-order-search-hint');
                        if (searchHint) {
                            searchHint.textContent = orders.length ? 'Найдено заказов: ' + orders.length : '';
                            searchHint.className = 'edit-order-hint';
                        }
                    });
                }
                closeEditOrderModal();
            }).catch(function (err) {
                console.error('cancel order error:', err);
                if (typeof showToast === 'function') showToast('Ошибка: ' + (err.message || 'попробуйте позже'), 'error');
            }).finally(function () {
                cancelOrderBtn.disabled = false;
            });
        });
    }

    (function initEditOrderFieldErrorReset() {
        var step2 = document.getElementById('edit-order-step2');
        if (!step2) return;
        var ids = [
            'edit-order-client-name', 'edit-order-client-phone', 'edit-order-delivery-date',
            'edit-order-address-part1', 'edit-order-address-part2', 'edit-order-address-part3',
            'edit-order-no-plot', 'edit-order-source', 'edit-order-comment'
        ];
        function clearThisFieldError() {
            var wrapper = this.closest && this.closest('.edit-order-field');
            if (wrapper) {
                wrapper.classList.remove('edit-order-field-error');
                var msg = wrapper.querySelector('.edit-order-validation-msg');
                if (msg) msg.textContent = '';
            }
        }
        ids.forEach(function (id) {
            var el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', clearThisFieldError);
                el.addEventListener('change', clearThisFieldError);
            }
        });
    })();

    // raw-preserve: фиксируем явное редактирование поля телефона пользователем
    (function () {
        var phoneFieldForTouch = document.getElementById('edit-order-client-phone');
        if (phoneFieldForTouch) {
            phoneFieldForTouch.addEventListener('input', function () { _editOrderPhoneTouchedByUser = true; });
            phoneFieldForTouch.addEventListener('change', function () { _editOrderPhoneTouchedByUser = true; });
        }
    })();

    var addItemBtn = document.getElementById('edit-order-add-item-btn');
    if (addItemBtn) addItemBtn.addEventListener('click', function () { openEditOrderAddPanel(null); });

    var addFormSel = document.getElementById('edit-order-add-form');
    if (addFormSel) addFormSel.addEventListener('change', onModalAddFormChange);
    var addWidthSel = document.getElementById('edit-order-add-width');
    if (addWidthSel) addWidthSel.addEventListener('change', onModalAddWidthChange);
    var addLengthSel = document.getElementById('edit-order-add-length');
    if (addLengthSel) addLengthSel.addEventListener('change', onModalAddLengthChange);
    var addOddLengthCb = document.getElementById('edit-order-add-odd-length');
    if (addOddLengthCb) addOddLengthCb.addEventListener('change', clearEditOrderAddPanelCalculation);
    var addFrameSel = document.getElementById('edit-order-add-frame');
    if (addFrameSel) addFrameSel.addEventListener('change', clearEditOrderAddPanelCalculation);
    var addArcStepSel = document.getElementById('edit-order-add-arcStep');
    if (addArcStepSel) addArcStepSel.addEventListener('change', clearEditOrderAddPanelCalculation);
    var addPolySel = document.getElementById('edit-order-add-polycarbonate');
    if (addPolySel) addPolySel.addEventListener('change', clearEditOrderAddPanelCalculation);

    var editOrderAddPanelRecalcTimer = null;
    function scheduleEditOrderAddPanelRecalc() {
        if (editOrderAddPanelRecalcTimer) clearTimeout(editOrderAddPanelRecalcTimer);
        editOrderAddPanelRecalcTimer = setTimeout(function () {
            editOrderAddPanelRecalcTimer = null;
            var panel = document.getElementById('edit-order-add-item-panel');
            if (panel && !panel.classList.contains('hidden')) runEditOrderAddPanelCalculation();
        }, 250);
    }
    function runEditOrderAddPanelCalculation() {
        var city = getEditOrderAddCity();
        var form = addFormSel ? addFormSel.value.trim() : '';
        var width = parseFloat(addWidthSel ? addWidthSel.value : NaN);
        var lenPair = getEffectiveLengthFromEditPanel();
        var billingLength = lenPair.billing;
        var effectiveLength = lenPair.effective;
        var frame = document.getElementById('edit-order-add-frame') ? document.getElementById('edit-order-add-frame').value.trim() : '';
        var arcStep = parseFloat(document.getElementById('edit-order-add-arcStep') ? document.getElementById('edit-order-add-arcStep').value : NaN);
        var poly = document.getElementById('edit-order-add-polycarbonate') ? document.getElementById('edit-order-add-polycarbonate').value.trim() : '';
        if (!form || isNaN(width) || isNaN(billingLength) || !frame || !poly) return null;
        return (async function () {
            var options = getEditOrderAddPanelOptions(poly);
            var out = await calculateGreenhousePrice(city, form, width, billingLength, frame, poly, isNaN(arcStep) ? 1 : arcStep, options);
            if (!out.ok) {
                if (typeof showToast === 'function') showToast(out.error || 'Ошибка расчёта', 'error');
                if (priceEl) priceEl.textContent = '';
                clearEditOrderAddBreakdown();
                lastModalCalculationResult = null;
                if (typeof updateEditOrderGiftsBlock === 'function') updateEditOrderGiftsBlock(getEditOrderCompositionTotalWithPreview(), true);
                return;
            }
            var data = out.data;
            if (!isNaN(effectiveLength) && effectiveLength !== billingLength) data.length = effectiveLength;
            var itemTotal = (data.basePrice || 0) + (data.assemblyCost || 0) + (data.foundationCost || 0) + (data.additionalProductsCost || 0);
            itemTotal = Math.ceil(itemTotal / 10) * 10;
            var extrasText = [(data.foundationText || ''), (data.additionalProductsText || '')].filter(Boolean).map(function (s) { return String(s).replace(/^\n+/, ''); }).join('\n').trim() || '';
            var assemblyText = [(data.assemblyText || ''), (data.bedsAssemblyText || '')].filter(Boolean).map(function (s) { return String(s).replace(/^\n+/, ''); }).join('\n').trim() || '';
            var basePrice = data.basePrice != null && !isNaN(Number(data.basePrice)) ? Number(data.basePrice) : undefined;
            lastModalCalculationResult = { model: data.model, width: data.width, length: data.length, frame: data.frame, arcStep: data.arcStep, polycarbonate: data.polycarbonate, form: data.form, item_total: itemTotal, base_price: basePrice, extras: extrasText, assembly: assemblyText, height: data.height, snowLoad: data.snowLoad, horizontalTies: data.horizontalTies, equipment: data.equipment };
            if (priceEl) priceEl.textContent = (typeof formatPrice === 'function' ? formatPrice(itemTotal) : itemTotal) + ' ₽';
            renderEditOrderAddBreakdown(data);
            if (typeof updateEditOrderGiftsBlock === 'function') updateEditOrderGiftsBlock(getEditOrderCompositionTotalWithPreview(), true);
            if (editOrderEditingIndex != null && editOrderEditingIndex >= 0 && editOrderComposition.length) {
                if (savePosBtn) savePosBtn.classList.remove('hidden');
                if (confirmAddBtn) confirmAddBtn.classList.add('hidden');
            } else {
                if (confirmAddBtn) confirmAddBtn.classList.remove('hidden');
                if (savePosBtn) savePosBtn.classList.add('hidden');
            }
        })();
    }

    var calcBtn = document.getElementById('edit-order-add-calc-btn');
    var priceEl = document.getElementById('edit-order-add-price');
    var confirmAddBtn = document.getElementById('edit-order-add-confirm-btn');
    var savePosBtn = document.getElementById('edit-order-save-position-btn');
    if (calcBtn) {
        calcBtn.addEventListener('click', async function () {
            var form = addFormSel ? addFormSel.value.trim() : '';
            var width = parseFloat(addWidthSel ? addWidthSel.value : NaN);
            var lenPair = getEffectiveLengthFromEditPanel();
            var billingLength = lenPair.billing;
            var frame = document.getElementById('edit-order-add-frame') ? document.getElementById('edit-order-add-frame').value.trim() : '';
            var poly = document.getElementById('edit-order-add-polycarbonate') ? document.getElementById('edit-order-add-polycarbonate').value.trim() : '';
            if (!form || isNaN(width) || isNaN(billingLength) || !frame || !poly) {
                if (typeof showToast === 'function') showToast('Заполните все параметры теплицы', 'error');
                return;
            }
            await runEditOrderAddPanelCalculation();
        });
    }
    (function attachEditOrderAddOptionsChangeListeners() {
        var panel = document.getElementById('edit-order-add-item-panel');
        if (!panel) return;
        ['bracing', 'assembly', 'ground-hooks', 'on-wood', 'on-concrete'].forEach(function (id) {
            var el = panel.querySelector('#edit-order-add-' + id);
            if (el) el.addEventListener('change', scheduleEditOrderAddPanelRecalc);
        });
        panel.querySelectorAll('.edit-order-add-product-item select').forEach(function (sel) {
            sel.addEventListener('change', scheduleEditOrderAddPanelRecalc);
        });
    })();
    if (confirmAddBtn) {
        confirmAddBtn.addEventListener('click', function () {
            if (!lastModalCalculationResult) return;
            var snap = lastSavedEditOrderState || getEditOrderStateSnapshot();
            editOrderStateUndoSample = { composition: snap.composition.map(function (i) { var o = {}; for (var k in i) if (Object.prototype.hasOwnProperty.call(i, k)) o[k] = i[k]; return o; }), gifts: Object.assign({}, snap.gifts) };
            editOrderStateRedoSample = null;
            editOrderComposition.push({
                model: lastModalCalculationResult.model,
                width: lastModalCalculationResult.width,
                length: lastModalCalculationResult.length,
                frame: lastModalCalculationResult.frame,
                arc_step: lastModalCalculationResult.arcStep,
                polycarbonate: lastModalCalculationResult.polycarbonate,
                item_total: lastModalCalculationResult.item_total,
                base_price: lastModalCalculationResult.base_price,
                form: lastModalCalculationResult.form,
                city: getEditOrderAddCity(),
                extras: lastModalCalculationResult.extras || '',
                assembly: lastModalCalculationResult.assembly || '',
                options: getEditOrderAddPanelOptionsForStorage(),
                height: lastModalCalculationResult.height,
                snowLoad: lastModalCalculationResult.snowLoad,
                horizontalTies: lastModalCalculationResult.horizontalTies,
                equipment: lastModalCalculationResult.equipment
            });
            renderEditOrderCompositionList();
            lastSavedEditOrderState = getEditOrderStateSnapshot();
            updateEditOrderUndoRedoButtons();
            closeEditOrderAddPanel();
            lastModalCalculationResult = null;
            var mainSaveBtn = document.getElementById('edit-order-save-btn');
            if (mainSaveBtn) mainSaveBtn.click();
        });
    }
    if (savePosBtn) {
        savePosBtn.addEventListener('click', function () {
            if (editOrderEditingIndex == null || !lastModalCalculationResult) return;
            var snap = lastSavedEditOrderState || getEditOrderStateSnapshot();
            editOrderStateUndoSample = { composition: snap.composition.map(function (i) { var o = {}; for (var k in i) if (Object.prototype.hasOwnProperty.call(i, k)) o[k] = i[k]; return o; }), gifts: Object.assign({}, snap.gifts) };
            editOrderStateRedoSample = null;
            editOrderComposition[editOrderEditingIndex] = {
                model: lastModalCalculationResult.model,
                width: lastModalCalculationResult.width,
                length: lastModalCalculationResult.length,
                frame: lastModalCalculationResult.frame,
                arc_step: lastModalCalculationResult.arcStep,
                polycarbonate: lastModalCalculationResult.polycarbonate,
                item_total: lastModalCalculationResult.item_total,
                base_price: lastModalCalculationResult.base_price,
                form: lastModalCalculationResult.form,
                city: getEditOrderAddCity(),
                extras: lastModalCalculationResult.extras || '',
                assembly: lastModalCalculationResult.assembly || '',
                options: getEditOrderAddPanelOptionsForStorage(),
                height: lastModalCalculationResult.height,
                snowLoad: lastModalCalculationResult.snowLoad,
                horizontalTies: lastModalCalculationResult.horizontalTies,
                equipment: lastModalCalculationResult.equipment
            };
            renderEditOrderCompositionList();
            lastSavedEditOrderState = getEditOrderStateSnapshot();
            updateEditOrderUndoRedoButtons();
            closeEditOrderAddPanel();
            lastModalCalculationResult = null;
            var mainSaveBtn = document.getElementById('edit-order-save-btn');
            if (mainSaveBtn) mainSaveBtn.click();
        });
    }
    var cancelAddBtn = document.getElementById('edit-order-add-cancel-btn');
    if (cancelAddBtn) cancelAddBtn.addEventListener('click', closeEditOrderAddPanel);

    var searchBtn = document.getElementById('edit-order-search-btn');
    var phoneInput = document.getElementById('edit-order-phone');
    var hintEl = document.getElementById('edit-order-search-hint');
    if (searchBtn && phoneInput) {
        searchBtn.addEventListener('click', function () {
            var phone = (phoneInput.value || '').trim();
            var normalized = normalizePhone(phone);
            if (!hintEl) hintEl = document.getElementById('edit-order-search-hint');
            if (hintEl) { hintEl.style.display = ''; hintEl.textContent = ''; hintEl.className = 'edit-order-hint'; }
            if (!normalized || normalized.length !== 11) {
                if (hintEl) { hintEl.textContent = 'Введите корректный номер телефона (11 цифр, начинается с 7).'; hintEl.className = 'edit-order-hint edit-order-hint--error'; }
                renderEditOrderList([]);
                if (typeof clearEditOrderForm === 'function') clearEditOrderForm();
                return;
            }
            lastEditOrderSearchedPhone = normalized;
            searchBtn.disabled = true;
            if (hintEl) hintEl.textContent = 'Поиск...';
            searchOrdersByPhone(phone).then(function (orders) {
                renderEditOrderList(orders);
                if (orders.length === 0 && typeof clearEditOrderForm === 'function') clearEditOrderForm();
                if (hintEl) {
                    hintEl.textContent = orders.length ? 'Найдено заказов: ' + orders.length : '';
                    hintEl.className = 'edit-order-hint';
                }
            }).catch(function (err) {
                console.error('searchOrdersByPhone error:', err);
                if (hintEl) { hintEl.textContent = 'Ошибка поиска: ' + (err.message || 'попробуйте позже'); hintEl.className = 'edit-order-hint edit-order-hint--error'; }
                renderEditOrderList([]);
                if (typeof clearEditOrderForm === 'function') clearEditOrderForm();
            }).finally(function () {
                searchBtn.disabled = false;
            });
        });
    }
}

// Инициализация модального окна грядок
function initBedsModal() {
    // Закрытие модального окна при клике на фон (не на содержимое)
    document.addEventListener('click', (event) => {
        const modal = document.getElementById('beds-modal');
        if (modal && !modal.classList.contains('hidden')) {
            // Проверяем, что клик был именно на фон модального окна, а не на его содержимое
            if (event.target === modal) {
                closeBedsModal();
            }
        }
    });
    
    // Инициализация счетчика грядок при загрузке
    updateBedsCounter();
}

// Инициализация при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Сбрасываем выбор грядок при загрузке страницы
        selectedBeds = {};
        bedsAssemblyEnabled = false;
        localStorage.removeItem('selectedBeds');
        localStorage.removeItem('bedsAssemblyEnabled');
        
        initBedsModal();
        initEditOrderModal();
    });
} else {
    // Сбрасываем выбор грядок при загрузке страницы
    selectedBeds = {};
    bedsAssemblyEnabled = false;
    localStorage.removeItem('selectedBeds');
    localStorage.removeItem('bedsAssemblyEnabled');
    
    initBedsModal();
    initEditOrderModal();
}

// Инициализация FAQ модального окна
function initFAQModal() {
    // Закрытие модального окна при клике вне его
    document.addEventListener('click', (event) => {
        const modal = document.getElementById('faq-modal');
        if (modal && !modal.classList.contains('hidden')) {
            const modalContent = modal.querySelector('.faq-modal-content');
            if (modalContent && !modalContent.contains(event.target) && event.target === modal) {
                closeFAQModal();
            }
        }
    });
}

// Инициализируем FAQ модальное окно при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFAQModal);
} else {
    initFAQModal();
}

// Инициализация модального окна с информацией о подарках
function initGiftsInfoModal() {
    const modal = document.getElementById('gifts-info-modal');
    if (!modal) return;
    
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeGiftsInfoModal();
        }
    });
}

// Инициализируем модальное окно с информацией о подарках при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGiftsInfoModal);
} else {
    initGiftsInfoModal();
}

// ==================== FAQ (Часто задаваемые вопросы) ====================
// ВАЖНО: FAQ для внутренних нужд (не отправлять клиентам!)

// Данные FAQ с категориями (из Telegram постов и внутренних документов)
const faqData = {
    categories: [
        {
            id: "top",
            name: "🔥 ТОП-ВОПРОСЫ",
            icon: "🔥"
        },
        {
            id: "work",
            name: "Работа с клиентами",
            icon: "💬"
        },
        {
            id: "materials",
            name: "Товары и материалы",
            icon: "🏗️"
        },
        {
            id: "delivery",
            name: "Доставка и сборка",
            icon: "🚚"
        },
        {
            id: "payment",
            name: "Оплата и подарки",
            icon: "💳"
        },
        {
            id: "process",
            name: "Процессы и CRM",
            icon: "📋"
        }
    ],
    items: [
        // ==================== ТОП-ВОПРОСЫ (приоритет 1 - всегда наверху) ====================
        {
            category: "top",
            question: "Как работать с возражением \"Дорого\"?",
            answer: "Алгоритм работы с возражением \"Дорого\":\n\n1. Спокойно принять, не спорить\n2. Уточнить, с чем сравнивает и какие характеристики важны\n3. Если вариант \"дешевле\" — подсветить типичные места экономии:\n   - Тонкий металл (0.6 мм вместо 1 мм)\n   - Слабый каркас (20×20 вместо 40×20)\n   - ПК без УФ-защиты\n4. Показать ценность и последствия \"экономии\"\n5. Дать выбор вариантов, без давления\n\nПримеры фраз:\n- \"Давайте разберёмся, с чем сравниваете? Если у кого-то дешевле, важно смотреть, что внутри.\"\n- \"У нас оцинкованный каркас, качественный поликарбонат, гарантия 15 лет. Часто более дешёвые варианты экономят на этих деталях.\"\n- \"Если поделить стоимость на 10 лет гарантии — это всего по 2000 рублей в год.\""
        },
        {
            category: "top",
            question: "Как правильно заполнить таблицу заказов?",
            answer: "Правила заполнения таблицы заказов:\n\n✅ Номер телефона\n- ВСЕ номера клиента должны совпадать с номером в AMO CRM\n- Если номер отличается, заказ не учтётся при расчёте зарплаты!\n- ВАЖНО: всегда используем номера в формате 79999999999 (без +7, без 8 и дополнительных знаков)\n\n✅ Город доставки\n- Это склад, откуда везём теплицу (обычно указан в калькуляторе в скобках)\n\n✅ Комментарии\n- Особые условия адреса (куда заезжать, препятствия)\n- Если теплица без поликарбоната — \"каркас\"\n- Если теплица на брусе, но не закрепляется — \"сборка на брус клиента, закрепит сам\"\n- Если поликарбонат не стандартный — обязательно \"4 мм люкс\" или \"6 мм премиум\" и прочие важные детали по заказу\n\n✅ Адрес\n- Записываем максимально подробно: область, район, населённый пункт, улица, дом - удобно скопировать из калькулятора\n- Если нет номера дома — узнаём координаты!\n- Если водитель не дозвонится и приедет не туда, он просто уедет\n\n✅ Товар\n- Полное название теплицы, Ширина, длина, каркас (по таблице должно быть понятно, что за теплица)\n- Шаг дуги (0.65 м или 1 м)\n- Сечение каркаса\n\n✅ Дополнительно\n- ВСЕ допы пишем: брус, штыри, оцинкованная лента, форточки и т.д.\n- Подарок — если не укажете, подарок не привезут!\n\n✅ Сборка\n- Указываем ВСЕ работы: сборка теплицы, закрепление к брусу, сборка грядок\n\n✅ Итоговая сумма\n- Проверяем, чтобы сумма билась с теми позициями, что в таблице\n\n✅ Статус заказа\n- Если стоит \"Перенос\", значит склад подтвердил заказ\n- Если клиент вносит изменения — сначала правим в таблице, потом ставим задачу в CRM\n\nВАЖНО:\n- Сначала оформляем заказ в таблице, а потом в CRM!\n- Если заказ неверный — логисты не смогут его отгрузить"
        },
        {
            category: "top",
            question: "Система касаний (5 касаний)",
            answer: "Система 5 касаний для работы с отложенными клиентами:\n\n1 КАСАНИЕ — на следующий день после общения (либо ближайший рабочий)\nТип задачи: \"1 касание\"\nШаблон: \"1 касание\"\nТекст: \"Здравствуйте! Как вам расчет?\n\nПредлагаю сейчас зафиксировать эту стоимость до весны без предоплаты. Если передумаете — просто отменим бронь, это бесплатно.\n\nОформляем?\"\n\n2 КАСАНИЕ — через 2-3 дня после 1-го\nТип задачи: \"2 касание\"\nШаблон: \"2 касание\"\nТекст: \"Напоминаю: чем ближе весна, тем выше цены. Предлагаю зафиксировать зимнюю стоимость сейчас.\nПредоплата не нужна. Если передумаете — просто отмените бронь, это бесплатно и без штрафов.\n\nОформляем?\"\n\n3 КАСАНИЕ — через 7 дней после 2-го\nТип задачи: \"3 касание\"\nШаблон: \"3 касание\"\nТекст: \"Коротко о ситуации: к сезону металл всегда дорожает. Я могу бесплатно заморозить для вас текущую цену.\nРисков нет: вы ничем не обязаны, а оплата только по факту доставки весной.\n\nСтавим в работу?\"\n\n4 КАСАНИЕ — через 30 дней после 3-го\nТип задачи: \"4 касание\"\nШаблон: \"4 касание\"\nТекст: \"Добрый день! Сейчас формируем маршрут доставки в ваш район. Если вопрос с теплицей актуален — лучше занять место в машине заранее, чтобы привезли в удобный день.\n\nВас иметь в виду?\"\n\n5 КАСАНИЕ — в апреле (весенний)\nТип задачи: \"5 касание\"\nШаблон: \"5 касание\"\nТекст: \"Здравствуйте! Весенний сезон стартовал — теплицы уже активно бронируют. Работаем без выходных, без предоплаты.\n\nПодскажите, для вас актуально на какие размеры смотреть — 3×4, 3×6 или 3×8?\"\n\nВАЖНО:\n- Сделки не закрываем просто так — только сопровождаем\n- Каждое касание = шанс на продажу\n- В примечаниях обязательно оставляем комментарии"
        },
        {
            category: "top",
            question: "Как работать с возражением \"Я подумаю\"?",
            answer: "Алгоритм:\n1. Не отпускать в никуда\n2. Предложить зафиксировать цену бесплатно\n3. Объяснить выгоду бронирования\n4. Поставить задачу на напоминание\n\nПримеры фраз:\n- \"Конечно, думать важно! Но чтобы не потерять цену, давайте оформим бронь — это бесплатно и без предоплаты.\"\n- \"Цена фиксируется только при бронировании — если отложить покупку, она может измениться.\"\n- \"Могу зафиксировать цену на пару дней, пока вы думаете.\""
        },
        {
            category: "top",
            question: "Какую теплицу посоветовать клиенту?",
            answer: "🎯 Быстрый выбор теплицы по потребностям клиента:\n\n❄️ СНЕЖНЫЕ РЕГИОНЫ / СУРОВЫЙ КЛИМАТ:\n→ Каплевидная (Стрелка) — максимальная защита от снега, снег не скапливается\n→ Теплица домиком (Дворцовая) — максимальная прочность, для сильных снегопадов\n\n💰 БЮДЖЕТНЫЙ ВАРИАНТ / УМЕРЕННЫЙ КЛИМАТ:\n→ Арочная (Боярская) — доступная цена, простая сборка, снег скатывается\n\n🌱 ВЫСОКИЕ РАСТЕНИЯ / СТЕЛЛАЖИ / КРУГЛОГОДИЧНОЕ ИСПОЛЬЗОВАНИЕ:\n→ Прямостенная (Царская) — максимум полезного пространства, удобно ставить стеллажи\n→ Теплица домиком (Дворцовая) — высокий потолок, эстетичный вид\n\n🏠 МАЛЕНЬКИЙ УЧАСТОК / ОГРАНИЧЕННОЕ ПРОСТРАНСТВО:\n→ Пристенная — экономия места, держит тепло за счет стены\n\n🌞 ЖАРКИЕ РЕГИОНЫ / ПРОФЕССИОНАЛЬНОЕ ВЫРАЩИВАНИЕ:\n→ Теплица по Митлайдеру — естественная вентиляция, нет перегрева, максимум света\n\n📋 АЛГОРИТМ ВЫБОРА:\n1. Уточните регион и климатические условия\n2. Спросите о целях использования (высокие растения, стеллажи, круглогодично?)\n3. Уточните размер участка и бюджет\n4. Предложите 1-2 варианта с обоснованием\n\n💡 ВАЖНО: Всегда объясняйте, почему именно этот тип подходит клиенту!"
        },
        {
            category: "top",
            question: "Как работать с претензиями?",
            answer: "Алгоритм работы с претензиями:\n\n1. Сохраняем спокойствие\n- Не спорим\n- Клиенты часто раздражены, им нужно выговориться\n- Мы — не враги, мы помогаем\n\n2. Узнаём, что не устроило\n- Что именно не понравилось?\n- Что произошло?\n- Попросите прислать фото или видео\n\n3. Отправляем на почту\nЕсли речь про:\n- качество сборки\n- якобы не тот полик\n- не хватает комплектующих\n- \"мне просто не нравится\"\n\n→ Оформляем претензию через шаблон \"претензия\"\n\nПочта: info@teplitsa-rus.ru\nТребования:\n- Фото\n- Номер телефона\n- Описание проблемы (в одном сообщении)\n\n4. Если клиент взрывается\n- Собираем всю информацию\n- Передаём Павлу в телеграмм (только если ситуация реально выходит из-под контроля)\n\n5. Напоминаем клиенту\n- Мы работаем без предоплаты\n- Клиенты обязаны всё проверять до оплаты\n- Если есть недочёты, говорят об этом сразу — это ускоряет решение\n\nВАЖНО:\n- Никогда не игнорим претензии\n- Даже если не знаем ответа — пишем: \"Информацию приняли, ищем решение, вернусь с обратной связью\""
        },
        {
            category: "top",
            question: "Какие контакты использовать для работы?",
            answer: "📞 Прямая линия (для звонков): +7 (495) 085-59-90\n\n💬 Telegram / MAX (только сообщения!): +7 (993) 957-57-90\n\n⚠️ ВАЖНО:\n• Если клиент пытается позвонить на номер Telegram / MAX, в AmoCRM появляется уведомление вида «Клиент +7 (906)… пытался дозвониться на Telegram / MAX». Нужно перезвонить ему через софтфон на обычный номер.\n• Личные номера в работе не используем!\n\n📌 Трудности с Telegram и MAX:\n\nПри работе через Telegram и MAX возникают следующие ограничения:\n• Запреты на первичное обращение к новым клиентам\n• Блокировки аккаунтов\n• Ограничения на поиск контактов по номеру телефона\n\n💡 Решение:\n\nПоэтому при оформлении заказов просим клиентов добавить нас в контакты, и только после этого отправляем заказ в мессенджер.\n\n📋 Алгоритм работы:\n\n1. Для запроса в контакты используем шаблон \"Запрос в контакты\"\n\n2. Текст шаблона для клиента:\n\"Чтобы мы не потерялись и сообщения точно доходили: добавьте наш номер +7 993 957-57-90 в контакты.\n\nПосле добавления мы вышлем вам информацию по заказу — куда удобнее: в Telegram или MAX?\n\nНапишите 'Добавил(а)' и выбранный мессенджер — и сразу отправим.\"\n\n3. После того как клиент добавил контакт и написал \"Добавил(а)\" — отправляем заказ в выбранный мессенджер\n\n⚠️ ВАЖНО для менеджеров:\n\nСоблюдение этого алгоритма критически важно. При регулярном использовании данной схемы аккаунт постепенно \"разогревается\" системой мессенджера, что снижает риск блокировок и ограничений в будущем. Не пренебрегайте этим шагом при работе с каждым клиентом."
        },
        
        // Материалы
        {
            category: "materials",
            question: "Грунтозацепы vs. Брус - в чем разница?",
            answer: "Грунтозацепы:\n• Металлические штыри, вбиваемые в землю для фиксации теплицы.\n• Защищают конструкцию от сноса ветром.\n• Бюджетное и практичное решение, особенно для ветреных регионов.\n\nБрус (деревянное основание):\n• Поднимает теплицу примерно на 10 см → лучшее сохранение тепла и защита от грызунов.\n• Равномерно распределяет нагрузку от снега.\n• Придает дополнительную стабильность конструкции.\n\n✅ Оптимально сочетать брус + грунтозацепы для максимальной надежности.",
            images: ["image/4.png", "image/16.png"]
        },
        {
            category: "materials",
            question: "Какие виды поликарбоната используются?",
            answer: "Используем только прозрачный поликарбонат с защитой UV-400.\n\n1️⃣ Стандарт (4 мм) - Плотность: 0.47 кг/м², Гарантия: 10 лет\n2️⃣ Люкс (4 мм) - Плотность: 0.52 кг/м², Гарантия: 15 лет - двойная защита от ультрафиолета\n3️⃣ Премиум (6 мм) - Плотность: 0.8 кг/м², Гарантия: 15 лет"
        },
        {
            category: "materials",
            question: "Количество листов поликарбоната для теплиц",
            answer: "📐 Размер листа: 2.1 × 6 м\n\nВ таблице указано количество листов поликарбоната для различных моделей теплиц. Данные сгруппированы по типу теплицы, длине и ширине конструкции. Если требуется дополнительное оформление (отдельные листы нужной длины), они также указаны.\n\n1. БОЯРСКАЯ (Арочная)\nРазмеры (ширина): 2,5 м, 3 м, 3,5 м, 4 м\nДлина: 4 м, 6 м, 8 м, 10 м, 12 м\n• 4 м: 2,5 м – 3 листа; 3 м – 3 листа; 3,5 м – 3 листа; 4 м – 4 листа + 1 лист 3 м + 1 лист 4 м\n• 6 м: 2,5 м – 4 листа; 3 м – 4 листа; 3,5 м – 4 листа; 4 м – 6 листов + 1 лист 3 м\n• 8 м: 2,5 м – 5 листов; 3 м – 5 листов; 3,5 м – 5 листов; 4 м – 7 листов + 1 лист 3 м + 1 лист 2 м\n• 10 м: 2,5 м – 6 листов; 3 м – 6 листов; 3,5 м – 6 листов; 4 м – 8 листов + 1 лист 3 м + 1 лист 4 м\n• 12 м: 2,5 м – 7 листов; 3 м – 7 листов; 3,5 м – 7 листов; 4 м – 10 листов + 1 лист 3 м\n\n2. ЦАРСКАЯ (Прямостенная)\nРазмеры (ширина): 2,5 м, 3 м, 3,5 м, 4 м\nДлина: 4 м, 6 м, 8 м, 10 м, 12 м\n• 4 м: 2,5 м – 3 листа; 3 м – 3 листа + 2 листа по 2 м; 3,5 м – 4 листа + 1 лист 2 м; 4 м – 5 листов + 1 лист 3 м + 1 лист 2 м\n• 6 м: 2,5 м – 4 листа; 3 м – 5 листов; 3,5 м – 5 листов + 2 листа по 2 м; 4 м – 7 листов + 1 лист 3 м\n• 8 м: 2,5 м – 5 листов; 3 м – 6 листов + 1 лист 2 м; 3,5 м – 7 листов; 4 м – 8 листов + 1 лист 3 м + 1 лист 4 м\n• 10 м: 2,5 м – 6 листов; 3 м – 7 листов + 2 листа по 2 м; 3,5 м – 8 листов + 1 лист 2 м; 4 м – 10 листов + 1 лист 3 м + 1 лист 2 м\n• 12 м: 2,5 м – 7 листов; 3 м – 9 листов; 3,5 м – 9 листов + 2 листа по 2 м; 4 м – 12 листов + 1 лист 3 м\n\n3. СТРЕЛКА (Каплевидная)\nРазмеры (ширина): 2,5 м, 3 м, 3,5 м\nДлина: 4 м, 6 м, 8 м, 10 м, 12 м\n• 4 м: 2,5 м – 3 листа; 3 м – 3 листа; 3,5 м – 4 листа\n• 6 м: 2,5 м – 4 листа; 3 м – 4 листа; 3,5 м – 5 листов + 1 лист 2 м\n• 8 м: 2,5 м – 5 листов; 3 м – 5 листов; 3,5 м – 6 листов + 1 лист 4 м\n• 10 м: 2,5 м – 6 листов; 3 м – 6 листов; 3,5 м – 8 листов\n• 12 м: 2,5 м – 7 листов; 3 м – 7 листов; 3,5 м – 9 листов + 1 лист 2 м\n\n4. ДОМИК\nРазмеры (ширина): 2,5 м, 3 м, 3,5 м, 4 м\nДлина: 4 м, 6 м, 8 м, 10 м, 12 м\n• 4 м: 2,5 м – 3 листа; 3 м – 3 листа + 1 лист 4 м; 3,5 м – 4 листа + 1 лист 3 м; 4 м – 2 рулона по 6 м + 1 лист 3 м + 2 рулона по 10 м\n• 6 м: 2,5 м – 4 листа; 3 м – 5 листов; 3,5 м – 5 листов + 1 лист 3 м + 1 лист 2 м; 4 м – 2 рулона по 6 м + 1 лист 3 м + 3 рулона по 10 м\n• 8 м: 2,5 м – 5 листов; 3 м – 6 листов + 1 лист 2 м; 3,5 м – 6 листов + 1 лист 4 м + 1 лист 3 м; 4 м – 2 рулона по 6 м + 1 лист 3 м + 4 рулона по 10 м\n• 10 м: 2,5 м – 6 листов; 3 м – 7 листов + 1 лист 4 м; 3,5 м – 8 листов + 1 лист 3 м; 4 м – 2 рулона по 6 м + 1 лист 3 м + 5 рулонов по 10 м\n• 12 м: 2,5 м – 7 листов; 3 м – 9 листов; 3,5 м – 9 листов + 1 лист 3 м + 1 лист 2 м; 4 м – 2 рулона по 6 м + 1 лист 3 м + 6 рулонов по 10 м\n\n5. МИТЛАЙДЕР АРОЧНЫЙ\nРазмеры (ширина): 3 м, 3,5 м\nДлина: 4 м, 6 м, 8 м, 10 м, 12 м\n• 4 м: 3 м – 3 листа + 1 лист 3 м; 3,5 м – 4 листа\n• 6 м: 3 м – 4 листа + 1 лист 3 м; 3,5 м – 4 листа + 1 лист 4 м + 1 лист 3 м\n• 8 м: 3 м – 6 листов; 3,5 м – 5 листов + 2 листа по 4 м\n• 10 м: 3 м – 6 листов + 1 лист 3 м + 1 лист 4 м; 3,5 м – 5 листов + 3 листа по 4 м + 1 лист 3 м\n• 12 м: 3 м – 6 листов + 3 листа по 4 м; 3,5 м – 6 листов + 4 листа по 4 м\n\n6. МИТЛАЙДЕР ПРЯМОСТЕННЫЙ\nРазмеры (ширина): 3 м, 3,5 м\nДлина: 4 м, 6 м, 8 м, 10 м, 12 м\n• 4 м: 3 м – 3 листа + 1 лист 4 м; 3,5 м – 4 листа + 1 лист 2 м\n• 6 м: 3 м – 5 листов; 3,5 м – 5 листов + 1 лист 4 м\n• 8 м: 3 м – 6 листов + 1 лист 2 м; 3,5 м – 7 листов\n• 10 м: 3 м – 7 листов + 1 лист 4 м; 3,5 м – 8 листов + 1 лист 2 м\n• 12 м: 3 м – 9 листов; 3,5 м – 9 листов + 1 лист 4 м\n\n7. ПРИСТЕННАЯ\nРазмеры (ширина): 2,5 м, 3 м\nДлина: 4 м, 6 м, 8 м, 10 м, 12 м\n• 4 м: 2,5 м – 3 листа; 3 м – 3 листа + 1 лист 4 м\n• 6 м: 2,5 м – 4 листа; 3 м – 5 листов\n• 8 м: 2,5 м – 5 листов; 3 м – 6 листов + 1 лист 2 м\n• 10 м: 2,5 м – 6 листов; 3 м – 7 листов + 1 лист 4 м\n• 12 м: 2,5 м – 7 листов; 3 м – 9 листов\n\n8. ПРЕМЬЕР\nРазмеры (ширина): 5 м, 6 м\nДлина: 4 м, 6 м, 8 м, 10 м, 12 м\n• 4 м: 5 м – 6 листов + 1 лист 2 м; 6 м – 6 листов + 1 лист 4 м\n• 6 м: 5 м – 8 листов; 6 м – 8 листов + 1 лист 3 м\n• 8 м: 5 м – 9 листов + 1 лист 4 м; 6 м – 10 листов + 1 лист 2 м\n• 10 м: 5 м – 11 листов + 1 лист 2 м; 6 м – 11 листов + 1 лист 4 м + 1 лист 3 м\n• 12 м: 5 м – 13 листов; 6 м – 14 листов"
        },
        {
            category: "materials",
            question: "Что такое краб-система?",
            answer: "Краб-система — специальные соединители («крабы») для каркаса, крепятся на 4 болтах.\n\nПреимущества:\n• Повышают прочность и устойчивость теплицы к снеговым и ветровым нагрузкам.\n• Равномерно распределяют нагрузку, предотвращают деформации.",
            images: ["image/15.jpg"]
        },
        {
            category: "materials",
            question: "Какие характеристики металла каркаса?",
            answer: "🔩 Сталь горячего цинкования, покрытие 80 мкм (соответствует ГОСТ 9.307-89).\n\nОбеспечивает:\n• Высокую коррозионную стойкость\n• Долгий срок службы"
        },
        {
            category: "materials",
            question: "Где производство?",
            answer: "🏭 Производственные площадки и склады в крупных городах:\nМосква, СПб, Воронеж, Казань, Нижний Новгород, Краснодар, Ярославль, Екатеринбург, Новосибирск.\n\nДоступ туда только у сотрудников, чтобы соблюдать контроль качества. Рабочая схема — через интернет-магазин."
        },
        {
            category: "materials",
            question: "Арочная теплица (Боярская)",
            answer: "📐 Размеры: 2.5м, 3м, 3.5м, 4м (ширина)\n📏 Высота: 2.1м (стандарт), 2.8м (для 4м)\n🔩 Каркас: 20×20, 40×20, двойной\n\n✅ Плюсы:\n• Простая сборка\n• Доступная цена\n• Снег скатывается с дугообразной крыши\n\n❌ Минусы:\n• Меньше полезного пространства по краям\n• Возможны заломы поликарбоната при сильных нагрузках\n\n🎯 Когда выбирать:\nРегионы с умеренными зимами, где снеговая нагрузка не критична",
            images: ["image/7.jpg"]
        },
        {
            category: "materials",
            question: "Каплевидная теплица (Стрелка)",
            answer: "📐 Размеры: 2.5м, 3м, 3.5м\n📏 Высота: 2.4м (стандарт), 2.8м (для 3.5м)\n🔩 Каркас: только 40×20 мм (усиленный)\n\n✅ Плюсы:\n• Снег не скапливается благодаря каплевидной форме\n• Максимальная защита от снега\n• Подходит для сурового климата\n\n❌ Минусы:\n• Дороже арочной\n• Сложнее сборка\n\n🎯 Когда выбирать:\nСнежные регионы, где зимой никого нет и теплица должна выдерживать большие снеговые нагрузки",
            images: ["image/8.jpg"]
        },
        {
            category: "materials",
            question: "Прямостенная теплица (Царская)",
            answer: "📐 Размеры: 2.5м, 3м, 3.5м, 4м\n📏 Высота: 2.1-2.8м\n🔩 Каркас: 40×20 или 40×20+20×20\n\n✅ Плюсы:\n• Максимум полезного пространства\n• Удобно ставить стеллажи\n• Равномерное распределение тепла\n\n❌ Минусы:\n• Снег задерживается на крыше\n• Выше стоимость\n\n🎯 Когда выбирать:\nДля высоких растений, стеллажей, круглогодичного использования",
            images: ["image/9.jpg"]
        },
        {
            category: "materials",
            question: "Теплица домиком (Дворцовая)",
            answer: "📐 Размеры: 2.5м, 3м, 3.5м, 4м\n📏 Высота: 2.2-2.8м (зависит от ширины)\n🔩 Каркас: 40×20 или 40×20+20×20\n\n✅ Плюсы:\n• Максимальная прочность\n• Эстетичный вид\n• Высокий потолок\n\n❌ Минусы:\n• Дороже остальных\n• Сложнее сборка\n\n🎯 Когда выбирать:\nРегионы с сильными снегопадами, круглогодичное использование",
            images: ["image/10.jpg"]
        },
        {
            category: "materials",
            question: "Пристенная теплица",
            answer: "📐 Размеры: 2.5м, 3м\n📏 Высота: 2.5м\n🏗️ Особенности: опирается на здание/забор\n\n✅ Плюсы:\n• Экономия места\n• Держит тепло за счет стены\n\n❌ Минусы:\n• Подходит не для всех участков\n\n🎯 Когда выбирать:\nНебольшие участки, ограниченное пространство, когда нужно максимально эффективно использовать площадь",
            images: ["image/11.jpg"]
        },
        {
            category: "materials",
            question: "Теплица по Митлайдеру",
            answer: "📐 Размеры: 3м, 3.5м\n📏 Высота: 2.4м\n🌬️ Особенности: естественная вентиляция, нет перегрева\n\n✅ Плюсы:\n• Идеально для жарких регионов\n• Максимум света\n• Естественная вентиляция предотвращает перегрев\n\n❌ Минусы:\n• Сложная сборка\n• Дороже арочных\n\n🎯 Когда выбирать:\nЖаркие регионы, профессиональное выращивание, когда важна вентиляция",
            images: ["image/12.jpg"]
        },
        {
            category: "materials",
            question: "Что такое \"усиленная теплица\"?",
            answer: "ВАЖНО: Нет единого определения \"усиленной теплицы\" — у каждого клиента своё понимание.\n\nКто-то считает усиленной:\n- Любую теплицу с трубой 40×20 мм\n- Вариант с шагом дуг 0.65 м\n- Только каркас с двойной дугой 20×20+20×20 или 40×20+20×20\n- а кто-то все вместе\n\nЧто делать, если клиент запрашивает \"усиленную теплицу\"?\n\n1. Не предлагать вариант \"наугад\" — сперва уточнить, что именно клиент имеет в виду:\n   - Вам важно, чтобы был усиленный каркас (например, двойная труба)?\n   - Нужно усиление за счёт частого шага дуг — 0.65 м?\n   - Рассматриваете вариант на трубе 40×20 мм или хотите ещё прочнее?\n\n2. После уточнения сделать расчёт с учётом того, что именно клиент считает усилением\n\n3. Если клиент сам не знает — ориентируем по нагрузке и условиям:\n   - Стандартное усиление: 40×20 мм, шаг 1 м, краб-система\n   - Усиленная конструкция: шаг 0.65 м или двойная дуга\n   - Максимально усиленная: 40×20+20×20, двойная дуга + шаг 0.65 м\n\n💡 Главное — уточнять, а не додумывать за клиента!"
        },
        {
            category: "materials",
            question: "Цельносварной каркас",
            answer: "Что такое цельносварной каркас?\n\nЭто конструкция, где основные элементы теплицы уже сварены на производстве:\n- Дуги идут цельными, без стыков\n- Торцы сразу соединены с дверью и форточкой\n- Вся конструкция собирается на месте только с помощью горизонтальных стяжек, которые фиксируются краб-системой на 4 болта\n\n✅ В чём плюсы цельносварного каркаса?\n\n1. Максимальная прочность — сварные соединения жестче и надёжнее, чем болтовые стыки\n2. Ускоренный монтаж — на сборку уходит меньше времени\n3. Устойчивость к нагрузкам — выдерживает большие снеговые и ветровые нагрузки\n4. Минимум ошибок при сборке — нет сложных соединений\n\n💬 Как объяснять клиенту:\n\"Это уже практически готовая теплица, вам остается просто соединить дуги между собой. Без болтовых стыков каркас прочнее, а установка быстрее.\"",
            images: ["image/13.jpg", "image/14.jpg"]
        },
        {
            category: "materials",
            question: "Краб-система vs болтовое соединение: детальное сравнение",
            answer: "Болтовое соединение / труба в трубу:\n- Самый дешёвый вариант соединения профильной трубы\n- Для крепления используется один болт или саморез\n- Оголяет металл и приводит к быстрому появлению коррозии\n- Со временем болты могут ослабнуть\n- Теплица менее прочная, может шататься и даже разрушиться при сильной нагрузке\n\nКраб-система (4 болта):\n- Самый надёжный вариант соединения каркаса\n- Используется 4 болта, которые прочно фиксируют профиль со всех сторон\n- Металл не повреждается, сохраняется защитный слой оцинковки\n- Каркас становится жестким и устойчивым, сравним по прочности со сварным соединением\n- Каркас не расшатывается со временем\n- Выдерживает высокие снеговые и ветровые нагрузки\n\n📌 Все наши теплицы только на краб-системе!",
            images: ["image/17.png", "image/15.jpg"]
        },
        {
            category: "materials",
            question: "Нечетные размеры теплиц",
            answer: "ВАЖНО: Мы можем делать теплицы НЕЧЁТНОЙ длины!\n\nЕсли клиенту нужна, например, теплица длиной 5 м, 7 м или 9 м.\n\n🚨 Как считать стоимость:\n✅ Стоимость обрезанной теплицы равна цене ближайшей большей длины.\n✅ Теплицу обрежут на производстве и привезут готовой.\n\nПримеры:\n- Клиенту нужна теплица 5 м → считаем цену 6 м\n- Клиенту нужна теплица 7 м → считаем цену 8 м\n- Клиенту нужна теплица 9 м → считаем цену 10 м"
        },
        
        // Доставка и сборка
        {
            category: "delivery",
            question: "В какие города и регионы доставляем?",
            answer: "Работаем только в городах (и их областях/краях), где находятся наши склады:\n\nМосква, Санкт-Петербург, Белгород, Великий Новгород, Владимир, Вологда, Воронеж, Екатеринбург, Иваново, Йошкар-Ола, Казань, Калуга, Кемерово, Кострома, Краснодар, Курск, Липецк, Майкоп, Набережные Челны, Нижний Новгород, Новосибирск, Орел, Рязань, Ставрополь, Тамбов, Тверь, Тула, Ульяновск, Чебоксары, Челябинск, Черкесск, Ярославль.\n\n📌 Правила:\n• Если город есть в списке — доставка по всему региону/области.\n• Если города нет в списке — не доставляем.\n• Самовывоз: не предусмотрен."
        },
        {
            category: "delivery",
            question: "Как рассчитывается стоимость доставки?",
            answer: "💰 Формула стоимости доставки:\n• Тариф зависит от склада: 45 руб/км (Москва, Питер, Тула, Калуга, Рязань, Тверь, Великий Новгород) или 50 руб/км (остальные города). Минимум 1000 руб.\n• Стоимость: тариф × км (расстояние от границы города)."
        },
        {
            category: "delivery",
            question: "Как работает сборка теплиц?",
            answer: "🔧 Правила сборки:\n• Отдельный монтаж (без покупки теплицы у нас) — не осуществляем.\n• Ремонт, заливка фундамента и прочие строительные работы — не оказываем.\n\n🔹 Монтаж на фундамент клиента (закрепят теплицу к фундаменту):\n• Брус (клиентский): +1500 руб\n• Бетон: +2000 руб\n\n📋 Размеры бруса: 100×100 мм, пропитан составом «Неомид» против гниения и вредителей."
        },
        {
            category: "delivery",
            question: "Дополнительно о самовывозе",
            answer: "🚫 Самовывоз не предусмотрен.\n\nЗаказ оформляется онлайн, доставку и сборку (при необходимости) осуществляют наши специалисты."
        },
        {
            category: "delivery",
            question: "Установка на голую землю: почему нельзя",
            answer: "❌ Теплицы на голую землю не устанавливаем!\n\n🚫 Почему нельзя ставить теплицу прямо на грунт?\n\n✔ Неравномерная нагрузка — теплица может проседать или перекоситься и в итоге сломаться\n✔ Риск сдувания ветром — без опоры конструкция нестабильна\n✔ Потеря тепла — без изоляции снизу грунт быстрее промерзает\n\n✅ Как правильно установить теплицу?\n\n📌 На брус — можно купить у нас или подготовить самостоятельно\n📌 На грунтозацепы — металлические штыри для фиксации в земле\n📌 Комбинированный вариант — брус + грунтозацепы для максимальной устойчивости\n📌 На бетонный (ленточный) фундамент — анкерное крепление для долговечности\n\n🔴 Крайний вариант (без гарантии!)\nЕсли клиент не хочет делать нормальное основание, можно поставить теплицу на заранее подготовленные кирпичи или блоки, но мы не несем ответственности за устойчивость конструкции.\n\n📌 Важно перед монтажом:\n✅ Очистить от снега и мусора\n✅ Убедиться, что поверхность ровная\n✅ Выделить место для раскроя поликарбоната\n\n❌ Монтажники не занимаются очисткой участка, укладкой фундамента и строительными работами!"
        },
        {
            category: "delivery",
            question: "Установка vs закрепление: в чём разница?",
            answer: "1️⃣ Почему теплицу нельзя ставить просто на землю?\n\nТеплица должна прочно стоять и не двигаться при ветре или нагрузках. Если просто поставить её на землю:\n❌ Её может снести ветром\n❌ Каркас может со временем деформироваться\n❌ Внутрь могут пролезть грызуны\n❌ Будет теряться тепло\n\nПоэтому любая теплица должна на что-то устанавливаться:\n✔ Наш брус (он продаётся клиенту вместе с теплицей)\n✔ Наши грунтозацепы (они тоже продаются клиенту)\n✔ Фундамент клиента (брус, бетон или что-то другое)\n\n2️⃣ Чем отличается просто установка теплицы от её закрепления?\n\n📌 Установка — это когда сборщики собирают каркас теплицы и просто ставят её на брус или фундамент клиента. Дополнительных креплений нет. Теплица просто стоит на месте.\n\n📌 Закрепление — это когда сборщики жёстко крепят теплицу к основанию, чтобы она не двигалась и не могла сдвинуться ветром.\n\n3️⃣ Что входит в обычную стоимость сборки?\n\n✅ Сборка каркаса теплицы\n✅ Закрепление теплицы к нашему брусу или нашим грунтозацепам (если клиент их заказал)\n\n💰 Эта услуга уже включена в стоимость сборки.\n\n4️⃣ Когда клиент платит дополнительно за закрепление?\n\nЕсли клиент хочет установить теплицу на свой фундамент (не наш), то за закрепление будет доплата:\n💵 +1 500 ₽ — если это его брус\n💵 +2 000 ₽ — если это бетонный фундамент\n\nПочему так?\n🔹 Брус клиента — сборщикам нужно отдельно прикрутить каркас теплицы к его брусу (используют шуруповёрт). Это доп. работа.\n🔹 Бетонный фундамент — сборщики привозят перфоратор, сверлят в бетоне отверстия и закрепляют анкерными болтами. Это сложнее, дольше и требует инструмента.\n\n5️⃣ Можно ли не закреплять теплицу на фундамент клиента?\n\nДа! Если клиент не хочет доплачивать, сборщики просто поставят теплицу на его фундамент, но не будут её крепить."
        },
        {
            category: "delivery",
            question: "Ограничения по доставке в приграничные районы",
            answer: "⛔️ Ограничения по доставке в приграничные районы!\n\n🚛 Доставляем ТОЛЬКО по согласованию, с доплатой и ТОЛЬКО доставку в следующие районы:\n\nБелгородская область: Вейделевка, Вайлуки, Волоконовка, Шебекино, Грайворон, Борисовка.\n\nКурская область: Курчатов, Большое Солдатское и районы близ границы.\n\n⛔ НЕ ВОЗИМ СОВСЕМ в:\n\nБелгородская область: Грайворон, Ровеньки.\n\nКурская область: Суджа, Рыльск (за Льгов).\n\n🔴 Причина: оцепления территорий, высокая вероятность ракетных обстрелов.\n\nБудьте внимательны при оформлении заказов и согласовывайте такие доставки заранее!"
        },
        
        // Оплата и товары
        {
            category: "payment",
            question: "Как происходит оплата?",
            answer: "💳 Способы оплаты: наличные или QR код\n\n📌 Условия:\n• Предоплата: не нужна. Оплата после доставки, а при сборке — после её завершения.\n• Рассрочка: не предоставляется. Но есть опция бесплатного хранения до 1 мая (цена фиксируется сразу)."
        },
        {
            category: "payment",
            question: "Какая гарантия на теплицы?",
            answer: "🛡️ Гарантия: 15 лет\n\nВыдается гарантийный лист с описанием условий."
        },
        {
            category: "payment",
            question: "Что можно купить отдельно от теплицы?",
            answer: "⚠️ Мы НЕ продаем отдельно: дуги, поликарбонат (кроме доп. листов), болты и прочие комплектующие.\n\n✅ Можно купить дополнительные листы поликарбоната дополнительно к текущему заказу (2.1×6 м):\n• Стандарт — 3000 руб\n• Люкс — 3500 руб\n• Премиум — 4000 руб"
        },
        {
            category: "payment",
            question: "Дополнительные товары (цены)",
            answer: "💧 Капельный полив механический: 1690 руб\n💧 Капельный полив автоматический: 4499 руб\n🔩 Оцинкованная лента (30 м): 1990 руб\n🌬️ Паропропускная лента (25 м): 1590 руб\n🪟 Дополнительная форточка: 1490 руб\n🤖 Автомат для форточки: 2590 руб"
        },
        {
            category: "payment",
            question: "Заключаем ли мы договор?",
            answer: "📄 Нет, т.к. не берем предоплату и не видим необходимости в договоре.\n\nПо факту оплаты клиент получает товарный чек."
        },
        {
            category: "payment",
            question: "Можно ли посмотреть теплицу «вживую»?",
            answer: "👀 У нас нет выставочных образцов, работаем только онлайн.\n\nПредлагаем фото. Клиент оплачивает после доставки, может осмотреть теплицу и при желании отказаться без доплат."
        },
        {
            category: "payment",
            question: "Есть ли «каталог»?",
            answer: "📋 Классического каталога нет, подбираем теплицу индивидуально под запросы клиента (размер, тип каркаса, поликарбонат и т.п.).\n\n⚠️ Сайт есть, но давать его не рекомендуется (там общий номер колл-центра, мы не сможем отследить звонок)."
        },
        {
            category: "payment",
            question: "Система подарков (актуальная логика)",
            answer: "📊 Количество подарков по сумме заказа:\n\n• От 35 000 рублей — 1 подарок (по умолчанию: дополнительная форточка)\n• От 55 000 рублей — 2 подарка (по умолчанию: форточка + капельный полив)\n• От 75 000 рублей — 3 подарка (по умолчанию: форточка + капельный полив + автомат для форточки)\n\n🔄 Правила замены подарков:\n\n• Любой подарок можно заменить на 4 грунтозацепа\n• Капельный полив можно заменить на вторую форточку (при условии соблюдения суммы заказа)\n• Максимум 3 подарка — даже если сумма очень большая, больше 3 подарков не будет\n\n⚙️ Особенности:\n\n• \"Автоматическая форточка\" занимает 2 слота подарка — это форточка + автомат в одном подарке. Если вы выбрали её в подарке 1, то подарок 2 автоматически скрывается.\n• Автомат для форточки можно выбрать только если есть дополнительная форточка — либо купленная в разделе \"Дополнительные товары\", либо выбранная в подарках.\n• Если форточка выбрана или куплена, автомат становится доступен во ВСЕХ подарках — можно выбрать автомат в любом доступном подарке.\n\n💡 Примеры:\n\nПример 1: Заказ на 60 000 рублей (2 подарка)\n• Подарок 1: Дополнительная форточка\n• Подарок 2: Капельный полив механический\n\nИли можно заменить:\n• Подарок 1: Автоматическая форточка (форточка + автомат) — подарок 2 скрывается\n• Подарок 2: Недоступен (занят автоматической форточкой)\n\nПример 2: Заказ на 80 000 рублей (3 подарка)\n• Подарок 1: Дополнительная форточка\n• Подарок 2: Капельный полив механический\n• Подарок 3: Автомат для форточки (стал доступен, так как форточка выбрана в подарке 1)\n\nПример 3: Заказ на 80 000 рублей + куплена форточка\n• Куплена дополнительная форточка в разделе \"Дополнительные товары\"\n• Подарок 1: Автомат для форточки (стал доступен во всех подарках)\n• Подарок 2: Капельный полив механический\n• Подарок 3: Автомат для форточки (можно выбрать второй автомат, если нужно)\n\nПример 4: Все подарки заменены на грунтозацепа\n• Подарок 1: 4 грунтозацепа\n• Подарок 2: 4 грунтозацепа\n• Подарок 3: 4 грунтозацепа\n• Итого: 12 грунтозацепов в подарок\n\n⚠️ ВАЖНО: Если не указать подарок в таблице заказов — клиент его не получит!"
        },
        {
            category: "payment",
            question: "Оплата по счету для юрлиц",
            answer: "НОВОЕ: можно оплачивать по счёту (для юрлиц и ИП)\n\nТеперь клиенты могут оплачивать теплицы по счёту — через организацию или ИП. Это удобно для юрлиц, школ, муниципалитетов и других компаний.\n\nУсловия:\n• Минимальный заказ — от 100 000 ₽\n  (т.к. мы выставляем счёт минимум на 100 000 ₽ + 18% сверху)\n• К любой сумме по счёту прибавляется +18%\n  (это включает НДС, сопровождение, расчётные расходы)\n\nПример:\nЕсли заказ на 200 000 ₽, то счёт будет на 236 000 ₽ (200 000 + 18% = 236 000)\n\nВажно:\nЕсли у клиента запрос на оплату по счёту — не оформляйте ничего сами.\nСразу пишите Павлу — он проверит и выставит счёт вручную."
        },
        
        // Работа с клиентами
        {
            category: "work",
            question: "Универсальный скрипт звонка для менеджеров",
            answer: "1. Приветствие\nЗадача: узнать имя и быстро перехватить инициативу\n\n«Здравствуйте! Меня зовут [Имя], компания [Название]. Какую теплицу подбираем – размер, форма?»\n\n2. Выявление потребностей\nЧеткая квалификация клиента и его запроса\n\n«Давайте подберём идеальный вариант. Вы рассматриваете теплицу с поликарбонатом или только каркас? Какие погодные условия? Планируете собирать сами или нужна сборка?»\n\n3. Презентация (ценность перед ценой)\nПоменьше терминов, упор на качество и сравнение, чтобы клиент в голове мысленно купил\n\n«Каркас усиленный – 40×20 мм, горячее цинкование, гарантия 15 лет, не ржавеет.»\n«Поликарбонат Люкс – двойная УФ-защита, плотность 0.72, прослужит дольше.»\n«Шаг дуги 0.65 м – снеговая нагрузка выше, конструкция крепче.»\n\nТолько после объяснения говорим цену.\n\n4. Дополнительные услуги\n\n«Грунтозацепы – фиксируют теплицу в земле, не дадут ветру её унести.»\n«Брус – даёт теплоизоляцию, защищает от грызунов.»\n«Сборка – наши мастера соберут за 3-4 часа, вы не потратите время.»\n\n5. Работа с возражениями\n\n«Дорого» → «Цена зависит от качества – у нас прочный каркас, горячее цинкование и усиленный поликарбонат.»\n\n«У конкурентов дешевле» → «Важно сравнивать не только цену, но и характеристики. У нас поликарбонат плотностью 0.47, а у дешёвых моделей – 0.3.»\n\n«Я подумаю» → «Учтите, что ближе к сезону цены вырастут, а у нас сейчас можно забронировать без предоплаты. И это ключевое – мы без предоплаты работаем. Клиент ничем не рискует.»\n\n6. Закрытие сделки\n\n«Давайте зафиксируем заказ – предоплата не требуется, оплата после доставки. Мы привезём в удобный для вас день.»\n\n7. Финальное подтверждение\n\n«Сейчас отправлю вам все данные в Telegram. Оплата только после доставки. Когда привезут теплицу и установят – проверите, всё ли в порядке, и после этого оплачиваете.»\n\nВАЖНО: ЕСЛИ КЛИЕНТ НЕ КУПИЛ ВО ВРЕМЯ ЗВОНКА - ОТПРАВЛЯЕМ РАСЧЕТ В TELEGRAM!"
        },
        {
            category: "work",
            question: "Возражение \"У конкурентов дешевле\"",
            answer: "Алгоритм:\n1. Не спорить, не оправдываться\n2. Сравнивать характеристики, а не только цену\n3. Показать разницу в материалах\n4. Подчеркнуть долгосрочную выгоду\n\nПримеры фраз:\n- \"Возможно, но важно сравнивать не только цену, но и комплектацию.\"\n- \"Часто в более дешёвых вариантах: поликарбонат тоньше или без УФ-защиты, каркас из менее прочного профиля, соединения не краб-система, а на саморезах.\"\n- \"Мы даём качественный вариант, который простоит долго, а не на один сезон.\""
        },
        {
            category: "work",
            question: "Возражение \"Нужно посоветоваться\"",
            answer: "Алгоритм:\n1. Выявить, с чем связано \"советование\"\n2. Предложить помощь в подготовке аргументов\n3. Зафиксировать цену на время обсуждения\n\nПримеры фраз:\n- \"Обычно в таких ситуациях обсуждают либо цену, либо нюансы установки. Если есть сомнения — можем разобрать, что важно именно вам.\""
        },
        {
            category: "work",
            question: "Возражение \"Доставка/монтаж у конкурентов бесплатные\"",
            answer: "Алгоритм:\n1. Объяснить, что \"бесплатное\" включено в цену\n2. Показать честность нашего расчёта\n3. Подчеркнуть отсутствие скрытых доплат\n\nПримеры фраз:\n- \"Обычно в таких случаях доставка и сборка просто включены в цену. Часто бывает так: теплица стоит дешевле, но в ней тонкий поликарбонат или слабый каркас.\"\n- \"Мы называем цену честно, без скрытых доплат.\""
        },
        {
            category: "work",
            question: "Работа с конфликтными клиентами",
            answer: "Как работать с конфликтными клиентами — без паники\n\nВ пик сезона будет много недовольных. Это нормально. Важно не сломаться, а уметь решать.\n\nВот чёткие принципы:\n\n1. Не спорь. Выслушай.\n- Клиенты часто злятся не на нас, а на ситуацию\n- Не перебивай. Не доказывай\n- Выслушай и уточни, в чём суть\n\n2. Не выноси вердикт сам, если не уверен\n- 90% \"жалоб\" — это обычные недоразумения\n- Разбирайся спокойно. Без обвинений\n\n3. Если реально есть претензия — запускаем шаблон \"Претензия\"\n- Отправляем клиенту инструкцию по оформлению претензии\n- Почта: info@teplitsa-rus.ru\n\n4. Самостоятельность — важное качество хорошего менеджера\n- Если можно решить — реши сам\n- Если чувствуешь, что не справляешься — тогда пиши Павлу с информацией, которую ты уже узнал у клиента\n\n5. Напоминаем клиенту\n- Мы работаем без предоплаты\n- Клиенту важно всё проверить при доставке (или после сборки) и сказать о недочётах до оплаты\n- Так вопрос решится быстрее\n\nГлавное:\n- Недовольные клиенты — это нормально\n- Без них мы не станем лучше\n- Наша задача — не оправдываться, а спокойно решать"
        },
        {
            category: "work",
            question: "Как работать с шаблонами в AMO",
            answer: "⚠️ Важно: Шаблоны — это инструмент, а мы — люди!\n\nПравила работы с шаблонами:\n\n1. Используйте готовые сообщения как базу, дополняйте их конкретикой под запрос клиента\n2. Будьте живыми, но не забывайте логику и структуру\n3. Перед отправкой проверьте, что всё правильно (имя, сумма, дата)\n4. Если нет шаблона на конкретную ситуацию, обратитесь к коллегам или адаптируйте похожий\n\n❌ НЕ делайте:\n- Копировать-вставить бездумно\n- Отправлять шаблон без персонализации\n- Игнорировать контекст диалога\n\n✅ Делайте:\n- Адаптируйте шаблон под конкретного клиента\n- Добавляйте имя клиента, конкретные цифры, даты\n- Проверяйте, что шаблон уместен в данной ситуации"
        },
        
        // Процессы и CRM
        {
            category: "process",
            question: "Как обрабатывать лиды в AmoCRM?",
            answer: "📋 Правила обработки лидов:\n• Действуем по очереди от старых к новым, чтобы никто не остался без ответа.\n• Быстро реагируем, но не теряем в качестве диалога.\n• Не «зависаем» на одном клиенте."
        },
        {
            category: "process",
            question: "Как работать с отзывами?",
            answer: "⭐ Перед тем как запросить отзыв, уточняем, всё ли в порядке и нет ли претензий.\n\nИспользуем шаблон \"Как прошла доставка\". Если клиент отвечает положительно, отправляем шаблон \"Запрос отзыв\" (обязательно вставляем имя клиента) и направляем ссылку на отзыв в том аккаунте, с которого была совершена покупка.\n\n📎 Ссылки на отзывы (Avito):\n\n[REVIEW_LINKS]\n\n⚠️ Если клиент жалуется, лучше не отправлять ссылку на отзыв."
        },
        {
            category: "process",
            question: "Регламент рабочего времени и дисциплины",
            answer: "Регламент рабочего времени и дисциплины менеджеров\n\n1. График работы\n- Работаем по графику 2/2 (время указано московское)\n- Пока у нас в межсезонье с 9 - 18 часов, далее будем работать с 8-20 часов\n\n2. Обязательные действия в начале смены\n- До начала работы менеджер должен написать в общий чат «Доброе утро»\n- Софтфон должен быть активен с начала смены\n- Первый звонок или ответ на сообщение должен быть сделан в первые 10 минут смены\n\n3. Перерывы на обед\n- Обед — по согласованию, чтобы кто-то всегда был на линии\n- Перед уходом на обед пишем в общий чат: «Ухожу на обед»\n- Длительность обеда — до 1 часа\n\n4. Оперативность и связь\n- Отвечать на сообщения в Telegram в течение 10 минут после их отправки\n- Если планируете отойти — предупреждаете в чате\n\n5. Дисциплина и нарушения\n❌ Что считается грубым нарушением:\n- Начало работы позже назначенного времени без предупреждения\n- Необоснованное игнорирование звонков и сообщений\n- Отказ от обработки звонков без веской причины\n- Исчезновение в рабочее время без уведомления"
        }
    ]
};

// Функция открытия модального окна FAQ
function showFAQModal() {
    const modal = document.getElementById('faq-modal');
    if (!modal) {
        console.error("❌ Модальное окно FAQ не найдено!");
        return;
    }
    
    try {
        // Гарантируем, что модальное окно в body
        if (modal.parentElement !== document.body) {
            document.body.appendChild(modal);
        }
        
        // Блокируем прокрутку фона
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        // Убираем класс hidden
        modal.classList.remove('hidden');
        
        // КРИТИЧНО для Safari: принудительно устанавливаем стили для гарантированного отображения
        const isSafari = navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1;
        if (isSafari) {
            // Принудительно устанавливаем стили через inline для Safari
            modal.style.display = 'flex';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            
            // Принудительный reflow для Safari
            void modal.offsetHeight;
        }
        
        // Предотвращаем прокрутку фона при прокрутке внутри модального окна
        const modalBody = modal.querySelector('.faq-modal-body');
        if (modalBody) {
            modalBody.addEventListener('wheel', preventBackgroundScroll, { passive: false });
            modalBody.addEventListener('touchmove', preventBackgroundScroll, { passive: false });
        }
        
        // Рендерим FAQ
        if (typeof renderFAQ === 'function') {
            renderFAQ();
        }
    } catch (error) {
        console.error('❌ Ошибка при открытии FAQ:', error);
    }
}

// Функция предотвращения прокрутки фона
function preventBackgroundScroll(e) {
    const modalBody = e.currentTarget;
    
    // Для wheel событий
    if (e.type === 'wheel') {
        const isScrollingUp = e.deltaY < 0;
        const isScrollingDown = e.deltaY > 0;
        const isAtTop = modalBody.scrollTop <= 0;
        const isAtBottom = modalBody.scrollTop + modalBody.clientHeight >= modalBody.scrollHeight - 1;
        
        // Если прокрутка вверх и мы вверху, или прокрутка вниз и мы внизу - блокируем
        if ((isScrollingUp && isAtTop) || (isScrollingDown && isAtBottom)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }
    
    // Для touchmove событий (мобильные устройства) - просто позволяем прокрутку внутри модального окна
    // overscroll-behavior: contain в CSS должен предотвратить прокрутку фона
}

// Функция закрытия модального окна FAQ
function closeFAQModal() {
    const modal = document.getElementById('faq-modal');
    if (modal) {
        modal.classList.add('hidden');
        
        // Разблокируем прокрутку фона
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        
        // Удаляем обработчики событий
        const modalBody = modal.querySelector('.faq-modal-body');
        if (modalBody) {
            modalBody.removeEventListener('wheel', preventBackgroundScroll);
            modalBody.removeEventListener('touchmove', preventBackgroundScroll);
        }
    }
}

// Функция рендеринга FAQ с категориями
function renderFAQ(selectedCategory = null) {
    const contentDiv = document.getElementById('faq-content');
    if (!contentDiv) return;
    
    // Определяем Safari один раз для всей функции
    const isSafari = navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1;
    
    let html = '';
    
    // Рендерим категории (табы)
    html += '<div class="faq-categories">';
    faqData.categories.forEach(category => {
        const isActive = selectedCategory === category.id || (!selectedCategory && category.id === faqData.categories[0].id);
        html += `
            <button class="faq-category-tab ${isActive ? 'active' : ''}" 
                    onclick="filterFAQByCategory('${category.id}')">
                <span class="faq-category-icon">${category.icon}</span>
                <span class="faq-category-name">${category.name}</span>
            </button>
        `;
    });
    html += '</div>';
    
    // Определяем, какую категорию показывать
    const activeCategory = selectedCategory || faqData.categories[0].id;
    
    // Фильтруем вопросы по категории
    const filteredItems = faqData.items.filter(item => item.category === activeCategory);
    
    // Рендерим вопросы выбранной категории
    html += '<div class="faq-list">';
    
    if (filteredItems.length === 0) {
        html += '<div class="faq-empty">В этой категории пока нет вопросов.</div>';
    } else {
        filteredItems.forEach((item, index) => {
            const faqId = `faq-${activeCategory}-${index}`;
            html += `
                <div class="faq-item">
                    <button class="faq-question" onclick="toggleFAQ('${faqId}')">
                        <span class="faq-icon">❓</span>
                        <span class="faq-question-text">${item.question}</span>
                        <span class="faq-toggle">▼</span>
                    </button>
                    <div class="faq-answer" id="${faqId}" style="display: none;">
                        ${item.images && item.images.length > 0 ? `
                            <div class="faq-images">
                                ${item.images.map((img, imgIndex) => {
                                    // Используем data-атрибут для безопасной передачи пути к изображению
                                    const imgId = `img-${faqId}-${imgIndex}`;
                                    // Экранируем кавычки в пути для безопасного использования в HTML
                                    const escapedImg = img.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                                    return `<img src="${escapedImg}" alt="Иллюстрация" class="faq-image" loading="lazy" data-image-src="${escapedImg}" id="${imgId}">`;
                                }).join('')}
                            </div>
                        ` : ''}
                        <div class="faq-answer-content">${formatFAQAnswerWithReviewLinks(item.answer)}</div>
                    </div>
                </div>
            `;
        });
    }
    
    html += '</div>';
    contentDiv.innerHTML = html;
    
    // Добавляем обработчики кликов для изображений через делегирование событий
    const faqImages = contentDiv.querySelectorAll('.faq-image');
    faqImages.forEach(img => {
        // Убираем стандартное поведение клика (открытие на фоне)
        img.style.cursor = 'pointer';
        img.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Создаем модальное окно для просмотра изображения
            const imageModal = document.createElement('div');
            imageModal.className = 'faq-image-modal';
            imageModal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                z-index: 100000;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
            `;
            
            const image = document.createElement('img');
            image.src = this.src;
            image.style.cssText = `
                max-width: 90%;
                max-height: 90%;
                object-fit: contain;
                border-radius: 8px;
            `;
            
            imageModal.appendChild(image);
            document.body.appendChild(imageModal);
            
            // Закрытие по клику
            imageModal.addEventListener('click', function() {
                document.body.removeChild(imageModal);
            });
        });
    });
    
    // Принудительный reflow после рендеринга для всех браузеров
    // Это заставляет браузер пересчитать размеры элементов
    void contentDiv.offsetHeight;
    
    // Обновляем активную категорию в табах
    updateActiveCategory(activeCategory);
    
    // ДИАГНОСТИКА (только в DEBUG): оставляем возможность быстро включить, но в проде не шумим и не тормозим.
    if (DEBUG && isSafari) {
        debugLog('SAFARI FAQ diag:', {
            faqItems: contentDiv.querySelectorAll('.faq-item').length,
            faqLists: contentDiv.querySelectorAll('.faq-list').length,
            contentOffsetHeight: contentDiv.offsetHeight,
            contentScrollHeight: contentDiv.scrollHeight
        });
    }
}

// Функция фильтрации FAQ по категории
function filterFAQByCategory(categoryId) {
    renderFAQ(categoryId);
}

// Функция обновления активной категории
function updateActiveCategory(activeCategory) {
    const tabs = document.querySelectorAll('.faq-category-tab');
    tabs.forEach(tab => {
        const onclickAttr = tab.getAttribute('onclick');
        if (onclickAttr) {
            const match = onclickAttr.match(/'([^']+)'/);
            if (match && match[1] === activeCategory) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        }
    });
}

// Функция форматирования ответа FAQ с обработкой ссылок на отзывы
function formatFAQAnswerWithReviewLinks(text) {
    if (!text) return '';
    
    // Проверяем, есть ли плейсхолдер для ссылок на отзывы
    if (text.includes('[REVIEW_LINKS]')) {
        const reviewLinks = [
            { name: 'Теплицы от производителя', url: 'https://www.avito.ru/user/review?fid=2_LSfXLXy3YaMN4NgHkcL-uujowHx4ZBZ87DElF8B0nlyL6RdaaYzvyPSWRjp4ZyNE' },
            { name: 'Строй мир', url: 'https://www.avito.ru/user/review?fid=2_LSfXLXy3YaMN4NgHkcL-uujowHx4ZBZ87DElF8B0nlyL6RdaaYzvyPSWRjp4ZyNE' },
            { name: 'Конструктивные решения', url: 'https://www.avito.ru/user/review?fid=2_LSfXLXy3YaMN4NgHkcL-uujowHx4ZBZ87DElF8B0nlyL6RdaaYzvyPSWRjp4ZyNE' }
        ];
        
        const reviewLinksHTML = '<div class="faq-review-links">' +
            reviewLinks.map(link => {
                const escapedUrl = link.url.replace(/'/g, "\\'");
                return `<div class="faq-review-link-card">
                    <span class="faq-review-link-name">${link.name}</span>
                    <button class="faq-review-copy-btn" onclick="copyUrlToClipboard('${escapedUrl}', this)" title="Копировать ссылку на отзыв">
                        📋 Копировать ссылку
                    </button>
                </div>`;
            }).join('') +
            '</div>';
        
        // Разбиваем текст на части до и после плейсхолдера
        const parts = text.split('[REVIEW_LINKS]');
        const beforeLinks = parts[0] || '';
        const afterLinks = parts[1] || '';
        
        // Форматируем части текста отдельно
        const formattedBefore = formatFAQAnswer(beforeLinks);
        const formattedAfter = formatFAQAnswer(afterLinks);
        
        // Собираем результат: форматированный текст до + HTML карточек + форматированный текст после
        return formattedBefore + reviewLinksHTML + formattedAfter;
    }
    
    // Если плейсхолдера нет - просто форматируем текст
    return formatFAQAnswer(text);
}

// Функция форматирования текста ответа FAQ - ПОЛНОСТЬЮ ПЕРЕРАБОТАННАЯ ВЕРСИЯ
function formatFAQAnswer(text) {
    try {
        if (!text) return '';
        
        // Вспомогательная функция для форматирования текста (кавычки, URL)
        function formatText(text) {
            if (!text) return '';
            return text
                .replace(/"([^"]+)"/g, '<strong>"$1"</strong>')
                .replace(/(https?:\/\/[^\s]+)/gi, function(match) {
                    const escaped = match.replace(/'/g, "\\'");
                    return '<a href="' + match + '" target="_blank" rel="noopener noreferrer" class="faq-url-link">' + match + '</a>';
                });
        }
        
        // Разбиваем текст на строки
        const lines = text.split('\n');
        const blocks = [];
        let currentParagraph = [];
        let currentList = [];
        let afterSubheading = false; // Флаг: текст после подзаголовка с двоеточием
        
        function flushParagraph() {
            if (currentParagraph.length > 0) {
                const paraText = currentParagraph.join(' ').trim();
                if (paraText) {
                    blocks.push('<p>' + formatText(paraText) + '</p>');
                }
                currentParagraph = [];
            }
            afterSubheading = false;
        }
        
        function flushList() {
            if (currentList.length > 0) {
                blocks.push('<ul>' + currentList.join('') + '</ul>');
                currentList = [];
            }
        }
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            const indent = line.length - trimmed.length;
            
            // Пустая строка
            if (!trimmed) {
                // Если мы после подзаголовка и в параграфе есть текст - продолжаем собирать
                // (пустая строка внутри параграфа после подзаголовка не закрывает его)
                if (afterSubheading && currentParagraph.length > 0) {
                    // Добавляем пробел вместо пустой строки для объединения текста
                    continue;
                }
                flushList();
                flushParagraph();
                continue;
            }
            
            // ВАЖНО/ВНИМАНИЕ - всегда отдельный блок
            const warningMatch = trimmed.match(/^([-•]\s*)?(ВАЖНО|ВНИМАНИЕ)(:)?\s*(.*)$/i);
            if (warningMatch && indent === 0) {
                flushList();
                flushParagraph();
                const warningText = warningMatch[2];
                const hasColon = warningMatch[3];
                const afterText = (warningMatch[4] || '').trim();
                
                if (!afterText) {
                    blocks.push('<p class="faq-warning">' + trimmed + '</p>');
                } else {
                    blocks.push('<p class="faq-warning">' + warningText + (hasColon ? ':' : '') + '</p>');
                    if (afterText) {
                        currentParagraph.push(afterText);
                    }
                }
                continue;
            }
            
            // Заголовки типа "1 КАСАНИЕ", "2 КАСАНИЕ" (число + слово заглавными)
            if (indent === 0 && /^\d+\s+[А-ЯЁA-Z]/.test(trimmed)) {
                flushList();
                flushParagraph();
                blocks.push('<p class="faq-heading">' + trimmed + '</p>');
                continue;
            }
            
            // Вопросы как заголовки (строка заканчивается "?")
            if (indent === 0 && trimmed.endsWith('?') && trimmed.length < 100) {
                flushList();
                flushParagraph();
                blocks.push('<p class="faq-heading">' + trimmed + '</p>');
                continue;
            }
            
            // Заголовки (1., 2., 3.) - только если после них идет заглавная буква или это короткая строка
            // Если после числа идет обычный текст - это элемент нумерованного списка
            if (indent === 0 && /^\d+[\.\)]\s+/.test(trimmed)) {
                const afterNumber = trimmed.replace(/^\d+[\.\)]\s+/, '');
                // Если после числа идет заглавная буква или это очень короткая строка - это заголовок
                if (/^[А-ЯЁA-Z]/.test(afterNumber) || trimmed.length < 30) {
                    flushList();
                    flushParagraph();
                    blocks.push('<p class="faq-heading">' + trimmed + '</p>');
                    continue;
                } else {
                    // Иначе это элемент нумерованного списка
                    flushParagraph();
                    currentList.push('<li>' + formatText(afterNumber) + '</li>');
                    continue;
                }
            }
            
            // Подзаголовки: текст с двоеточием в конце (Тип задачи:, Шаблон:, Текст:)
            if (indent === 0 && trimmed.endsWith(':') && !trimmed.startsWith('-') && !trimmed.startsWith('•') && trimmed.length < 50 && !trimmed.match(/^[А-ЯЁA-Z]{2,}/)) {
                // Проверяем, что это не заголовок типа "ВАЖНО:" или "1 КАСАНИЕ:"
                flushList();
                flushParagraph();
                blocks.push('<p class="faq-subheading">' + trimmed + '</p>');
                afterSubheading = true; // Следующий текст будет после подзаголовка
                continue;
            }
            
            // Подзаголовки с эмодзи (✅, ❌ и т.д.) - только если нет отступа
            if (indent === 0) {
                const hasEmoji = /^[✅❌📌🎯📐📏🔩🏗️🌬️❄️💰🌱🏠🌞💡⚠️🚨🔴📋🔹💬💵🔧📎⭐📞🪟🤖💧1️⃣2️⃣3️⃣4️⃣5️⃣]+\s+/.test(trimmed);
                
                if (hasEmoji) {
                    // Если это строка с эмодзи и ценой (например, "💧 Капельный полив: 1690 руб")
                    // то это элемент списка, а не подзаголовок
                    if (/руб|₽/.test(trimmed)) {
                        flushParagraph();
                        currentList.push('<li>' + formatText(trimmed) + '</li>');
                        continue;
                    } else {
                        // Иначе это подзаголовок
                        flushList();
                        flushParagraph();
                        blocks.push('<p class="faq-subheading">' + trimmed + '</p>');
                        continue;
                    }
                }
            }
            
            // Элементы списка (начинаются с -, •) - могут быть с отступом (вложенные)
            if (/^[-•]\s+/.test(trimmed)) {
                flushParagraph();
                const itemText = trimmed.replace(/^[-•]\s+/, '').trim();
                if (itemText) {
                    currentList.push('<li>' + formatText(itemText) + '</li>');
                }
                continue;
            }
            
            // Строки с отступом после элемента списка - продолжение элемента
            if (indent >= 2 && currentList.length > 0) {
                const lastItemIndex = currentList.length - 1;
                const lastItem = currentList[lastItemIndex];
                const itemContent = lastItem.replace(/^<li>/, '').replace(/<\/li>$/, '');
                currentList[lastItemIndex] = '<li>' + itemContent + ' ' + formatText(trimmed) + '</li>';
                continue;
            }
            
            // URL (отдельная строка)
            if (/^(https?:\/\/[^\s]+)$/i.test(trimmed)) {
                flushList();
                flushParagraph();
                const escaped = trimmed.replace(/'/g, "\\'");
                blocks.push('<p class="faq-url-line"><a href="' + trimmed + '" target="_blank" rel="noopener noreferrer" class="faq-url-link">' + trimmed + '</a><button class="faq-copy-btn" onclick="copyUrlToClipboard(\'' + escaped + '\', this)" title="Копировать ссылку">📋</button></p>');
                continue;
            }
            
            // Обычный текст - добавляем в параграф
            // Если это текст после подзаголовка с двоеточием, закрываем параграф при следующем заголовке
            flushList();
            currentParagraph.push(trimmed);
        }
        
        // Закрываем оставшиеся блоки
        flushList();
        flushParagraph();
        
        return blocks.join('');
    } catch (error) {
        console.error('Ошибка форматирования FAQ ответа:', error);
        return text ? '<p>' + formatText(text.replace(/\n\n+/g, '</p><p>').replace(/\n/g, ' ')) + '</p>' : '';
    }
}

// Функция переключения FAQ (аккордеон с автоматическим сворачиванием)
function toggleFAQ(faqId) {
    const answer = document.getElementById(faqId);
    if (!answer) return;
    
    const item = answer.closest('.faq-item');
    const toggle = item.querySelector('.faq-toggle');
    
    // Если открываем новый ответ - сворачиваем все остальные
    if (answer.style.display === 'none') {
        // Находим все открытые FAQ элементы в текущей категории
        const allItems = document.querySelectorAll('.faq-item.expanded');
        allItems.forEach(otherItem => {
            if (otherItem !== item) {
                const otherAnswer = otherItem.querySelector('.faq-answer');
                const otherToggle = otherItem.querySelector('.faq-toggle');
                if (otherAnswer && otherAnswer.style.display !== 'none') {
                    otherAnswer.style.display = 'none';
                    otherToggle.textContent = '+';
                    otherItem.classList.remove('expanded');
                }
            }
        });
        
        // Открываем выбранный элемент
        answer.style.display = 'block';
        toggle.textContent = '−';
        item.classList.add('expanded');
    } else {
        // Закрываем текущий элемент
        answer.style.display = 'none';
        toggle.textContent = '+';
        item.classList.remove('expanded');
    }
}

// Функция для переключения FAQ по индексу (используется в поиске)
function toggleFAQAnswer(itemIndex) {
    const answerId = `faq-answer-${itemIndex}`;
    toggleFAQ(answerId);
}

// Функция копирования URL в буфер обмена
function copyUrlToClipboard(url, button) {
    navigator.clipboard.writeText(url).then(function() {
        // Временно меняем иконку на галочку
        const originalText = button.innerHTML;
        button.innerHTML = '✓';
        button.style.background = '#28a745';
        setTimeout(function() {
            button.innerHTML = originalText;
            button.style.background = '';
        }, 1000);
    }).catch(function(err) {
        console.error('Ошибка копирования:', err);
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            const originalText = button.innerHTML;
            button.innerHTML = '✓';
            button.style.background = '#28a745';
            setTimeout(function() {
                button.innerHTML = originalText;
                button.style.background = '';
            }, 1000);
        } catch (err) {
            console.error('Ошибка копирования (fallback):', err);
        }
        document.body.removeChild(textArea);
    });
}

// Функция открытия изображения в полном размере (доступна глобально)
function openImageModal(imageSrc) {
    openImageModalWithGallery([imageSrc], 0);
}

function openImageModalWithGallery(imagesArray, currentIndex) {
    if (!imagesArray || imagesArray.length === 0) return;
    
    let currentIdx = currentIndex || 0;
    if (currentIdx < 0) currentIdx = 0;
    if (currentIdx >= imagesArray.length) currentIdx = imagesArray.length - 1;
    
    // Создаем модальное окно для просмотра изображения поверх всего
    const imageModal = document.createElement('div');
    imageModal.className = 'faq-image-modal';
    imageModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 10px;
        box-sizing: border-box;
    `;
    
    const imageContainer = document.createElement('div');
    imageContainer.style.cssText = `
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    `;
    
    const image = document.createElement('img');
    image.src = imagesArray[currentIdx];
    image.style.cssText = `
        max-width: 95%;
        max-height: 95%;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    `;
    
    // Кнопка закрытия
    const closeBtn = document.createElement('div');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 36px;
        height: 36px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: white;
        cursor: pointer;
        transition: all 0.2s ease;
        z-index: 10;
    `;
    closeBtn.addEventListener('mouseenter', function() {
        this.style.background = 'rgba(255, 255, 255, 0.3)';
    });
    closeBtn.addEventListener('mouseleave', function() {
        this.style.background = 'rgba(255, 255, 255, 0.2)';
    });
    
    // Стрелки навигации (только если больше одного фото)
    let prevBtn = null;
    let nextBtn = null;
    let counterText = null;
    
    // Кнопка скачивания и копирования (всегда показываем)
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        display: flex;
        gap: 8px;
        z-index: 10;
    `;
    
    const downloadBtn = document.createElement('button');
    const currentImagePath = imagesArray[currentIdx];
    const filename = currentImagePath.split('/').pop() || `image_${currentIdx + 1}.jpg`;
    downloadBtn.innerHTML = '📥 Скачать';
    downloadBtn.style.cssText = `
        background: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;
    downloadBtn.addEventListener('mouseenter', function() {
        this.style.background = 'rgba(0, 0, 0, 0.7)';
        this.style.transform = 'scale(1.05)';
    });
    downloadBtn.addEventListener('mouseleave', function() {
        this.style.background = 'rgba(0, 0, 0, 0.5)';
        this.style.transform = 'scale(1)';
    });
    downloadBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        downloadBedImage(currentImagePath, filename);
    });
    
    // Кнопка копирования в буфер обмена
    const copyBtn = document.createElement('button');
    copyBtn.innerHTML = '📋 Копировать';
    copyBtn.style.cssText = `
        background: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;
    copyBtn.addEventListener('mouseenter', function() {
        this.style.background = 'rgba(0, 0, 0, 0.7)';
        this.style.transform = 'scale(1.05)';
    });
    copyBtn.addEventListener('mouseleave', function() {
        this.style.background = 'rgba(0, 0, 0, 0.5)';
        this.style.transform = 'scale(1)';
    });
    copyBtn.addEventListener('click', async function(e) {
        e.stopPropagation();
        await copyImageToClipboard(currentImagePath, copyBtn);
    });
    
    buttonsContainer.appendChild(downloadBtn);
    buttonsContainer.appendChild(copyBtn);
    
    if (imagesArray.length > 1) {
        // Стрелка влево
        prevBtn = document.createElement('div');
        prevBtn.innerHTML = '‹';
        prevBtn.style.cssText = `
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: white;
            cursor: pointer;
            transition: all 0.2s ease;
            z-index: 10;
            user-select: none;
        `;
        prevBtn.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(255, 255, 255, 0.4)';
            this.style.transform = 'translateY(-50%) scale(1.1)';
        });
        prevBtn.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(255, 255, 255, 0.2)';
            this.style.transform = 'translateY(-50%) scale(1)';
        });
        
        // Стрелка вправо
        nextBtn = document.createElement('div');
        nextBtn.innerHTML = '›';
        nextBtn.style.cssText = `
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: white;
            cursor: pointer;
            transition: all 0.2s ease;
            z-index: 10;
            user-select: none;
        `;
        nextBtn.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(255, 255, 255, 0.4)';
            this.style.transform = 'translateY(-50%) scale(1.1)';
        });
        nextBtn.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(255, 255, 255, 0.2)';
            this.style.transform = 'translateY(-50%) scale(1)';
        });
        
        // Счетчик фото
        counterText = document.createElement('div');
        counterText.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.6);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 10;
        `;
        counterText.textContent = `${currentIdx + 1} / ${imagesArray.length}`;
        
        // Функция обновления изображения
        const updateImage = function(newIndex) {
            if (newIndex < 0) newIndex = imagesArray.length - 1;
            if (newIndex >= imagesArray.length) newIndex = 0;
            currentIdx = newIndex;
            image.src = imagesArray[currentIdx];
            counterText.textContent = `${currentIdx + 1} / ${imagesArray.length}`;
            // Обновляем кнопки скачивания и копирования
            const currentImagePath = imagesArray[currentIdx];
            const filename = currentImagePath.split('/').pop() || `image_${currentIdx + 1}.jpg`;
            downloadBtn.onclick = function(e) {
                e.stopPropagation();
                downloadBedImage(currentImagePath, filename);
            };
            copyBtn.onclick = async function(e) {
                e.stopPropagation();
                await copyImageToClipboard(currentImagePath, copyBtn);
            };
        };
        
        prevBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            updateImage(currentIdx - 1);
        });
        
        nextBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            updateImage(currentIdx + 1);
        });
        
        // Навигация клавиатурой
        const keyboardHandler = function(e) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                updateImage(currentIdx - 1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                updateImage(currentIdx + 1);
            }
        };
        document.addEventListener('keydown', keyboardHandler);
        
        // Сохраняем обработчик для удаления при закрытии
        imageModal._keyboardHandler = keyboardHandler;
    }
    
    imageContainer.appendChild(image);
    if (prevBtn) imageContainer.appendChild(prevBtn);
    if (nextBtn) imageContainer.appendChild(nextBtn);
    if (counterText) imageContainer.appendChild(counterText);
    imageContainer.appendChild(buttonsContainer);
    
    imageModal.appendChild(imageContainer);
    imageModal.appendChild(closeBtn);
    document.body.appendChild(imageModal);
    
    // Закрытие по клику на фон или кнопку
    const closeModal = function() {
        if (imageModal._keyboardHandler) {
            document.removeEventListener('keydown', imageModal._keyboardHandler);
        }
        if (imageModal.parentNode) {
            document.body.removeChild(imageModal);
        }
    };
    
    imageModal.addEventListener('click', function(e) {
        if (e.target === imageModal || e.target === closeBtn) {
            closeModal();
        }
    });
    
    // Закрытие по Escape
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

window.openImageModal = openImageModal;
window.openImageModalWithGallery = openImageModalWithGallery;

// Старая функция openImageModal (удаляем, если есть)
function openImageModal_OLD(imageSrc) {
    try {
        // Нормализуем путь к изображению (убираем лишние слеши)
        const normalizedSrc = imageSrc.replace(/\/+/g, '/');
        
        // Создаем модальное окно для изображения
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            cursor: pointer;
        `;
        
        // Создаем контейнер для изображения и индикатора загрузки
        const imgContainer = document.createElement('div');
        imgContainer.style.cssText = `
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            max-width: 90%;
            max-height: 90%;
        `;
        
        // Индикатор загрузки
        const loader = document.createElement('div');
        loader.style.cssText = `
            color: white;
            font-size: 18px;
            padding: 20px;
        `;
        loader.textContent = 'Загрузка изображения...';
        imgContainer.appendChild(loader);
        
        const img = document.createElement('img');
        img.style.cssText = `
            max-width: 100%;
            max-height: 90vh;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            display: none;
        `;
        
        // Обработка успешной загрузки
        img.onload = function() {
            loader.style.display = 'none';
            img.style.display = 'block';
        };
        
        // Обработка ошибки загрузки
        img.onerror = function() {
            loader.innerHTML = `
                <div style="text-align: center; color: #ff6b6b;">
                    <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
                    <div>Не удалось загрузить изображение</div>
                    <div style="font-size: 12px; margin-top: 10px; opacity: 0.7;">${normalizedSrc}</div>
                </div>
            `;
            console.error('Ошибка загрузки изображения:', normalizedSrc);
        };
        
        img.src = normalizedSrc;
        img.alt = 'Иллюстрация';
        
        imgContainer.appendChild(img);
        modal.appendChild(imgContainer);
        document.body.appendChild(modal);
        
        // Закрытие по клику
        modal.addEventListener('click', function(e) {
            // Закрываем только если клик по фону, не по изображению
            if (e.target === modal || e.target === loader) {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }
        });
        
        // Закрытие по Escape
        const closeOnEscape = (e) => {
            if (e.key === 'Escape') {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
                document.removeEventListener('keydown', closeOnEscape);
            }
        };
        document.addEventListener('keydown', closeOnEscape);
        
        // Предотвращаем закрытие при клике на само изображение
        img.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
    } catch (error) {
        console.error('Ошибка при открытии изображения:', error);
        alert('Не удалось открыть изображение: ' + imageSrc);
    }
}

// Функция копирования ответа FAQ
function copyFAQAnswer(faqId) {
    const answer = document.getElementById(faqId);
    const answerContent = answer.querySelector('.faq-answer-content');
    // Получаем текст, заменяя <br> на переносы строк и удаляя HTML теги
    let answerText = answerContent.innerHTML.replace(/<br\s*\/?>/gi, '\n');
    // Удаляем все остальные HTML теги
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = answerText;
    answerText = tempDiv.textContent || tempDiv.innerText || '';
    
    navigator.clipboard.writeText(answerText).then(() => {
        const btn = answer.querySelector('.faq-copy-btn');
        const originalText = btn.textContent;
        btn.textContent = '✅ Скопировано!';
        btn.style.background = '#10b981';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('Ошибка копирования:', err);
        alert('Не удалось скопировать. Попробуйте выделить текст вручную.');
    });
}

// Функция фильтрации FAQ по поисковому запросу
function filterFAQ() {
    const searchInput = document.getElementById('faq-search-input');
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    // Если поиск пустой, показываем все вопросы текущей категории
    if (!searchQuery) {
        const activeTab = document.querySelector('.faq-category-tab.active');
        if (activeTab) {
            const onclickAttr = activeTab.getAttribute('onclick');
            if (onclickAttr) {
                const match = onclickAttr.match(/'([^']+)'/);
                if (match) {
                    renderFAQ(match[1]);
                }
            }
        }
        return;
    }
    
    // Разбиваем запрос на ключевые слова для более гибкого поиска
    const keywords = searchQuery.split(/\s+/).filter(word => word.length > 0);
    
    // Ищем по исходным данным faqData.items, а не по отрендеренным элементам
    const matchingItems = faqData.items.filter(item => {
        const questionText = (item.question || '').toLowerCase();
        const answerText = (item.answer || '').toLowerCase();
        const fullText = questionText + ' ' + answerText;
        
        // Проверяем, содержит ли текст хотя бы одно ключевое слово
        return keywords.some(keyword => fullText.includes(keyword));
    });
    
    // Рендерим найденные результаты
    const contentDiv = document.getElementById('faq-content');
    if (!contentDiv) return;
    
    let html = '';
    
    // Показываем категории (но не делаем их активными при поиске)
    html += '<div class="faq-categories">';
    faqData.categories.forEach(category => {
        html += `
            <button class="faq-category-tab" 
                    onclick="filterFAQByCategory('${category.id}')">
                <span class="faq-category-icon">${category.icon}</span>
                <span class="faq-category-name">${category.name}</span>
            </button>
        `;
    });
    html += '</div>';
    
    // Рендерим найденные вопросы
    html += '<div class="faq-list">';
    
    if (matchingItems.length === 0) {
        html += '<div class="faq-search-empty">Ничего не найдено. Попробуйте другой запрос.</div>';
        } else {
        matchingItems.forEach((item, searchIndex) => {
            // Находим оригинальный индекс в faqData.items для правильной работы toggleFAQAnswer
            const originalIndex = faqData.items.findIndex(originalItem => 
                originalItem.question === item.question && originalItem.answer === item.answer
            );
            const itemIndex = originalIndex >= 0 ? originalIndex : searchIndex + 10000; // Используем большой индекс если не нашли
            
            const answerFormatted = formatFAQAnswer(item.answer || '');
            const hasImages = item.images && item.images.length > 0;
            
            html += `
                <div class="faq-item">
                    <div class="faq-question" onclick="toggleFAQAnswer(${itemIndex})">
                        <span class="faq-question-text">${item.question || 'Вопрос не указан'}</span>
                        <span class="faq-toggle">+</span>
                    </div>
                    <div class="faq-answer" id="faq-answer-${itemIndex}" style="display: none;">
                        <div class="faq-answer-content">${answerFormatted}</div>
                        ${hasImages ? `<div class="faq-images">${item.images.map(img => `<img src="${img}" alt="FAQ image" onclick="openImageModal('${img}')" style="max-width: 100%; cursor: pointer; margin: 10px 0; border-radius: 8px;">`).join('')}</div>` : ''}
                        <button class="faq-copy-btn" onclick="copyFAQAnswer(${itemIndex})">📋 Копировать</button>
                    </div>
                </div>
            `;
        });
    }
    
    html += '</div>';
    
    contentDiv.innerHTML = html;
}

// ==================== ФУНКЦИИ ДЛЯ РАБОТЫ С ГРЯДКАМИ ====================
// selectedBeds и bedsAssemblyEnabled объявлены выше (рядом с orderCart)

// Цены на сборку грядок в зависимости от длины грядки (за 1 грядку)
const BEDS_ASSEMBLY_PRICES = {
    4: 990,   // За сборку 1 грядки длиной 4 м
    6: 1490,  // За сборку 1 грядки длиной 6 м
    8: 1990,  // За сборку 1 грядки длиной 8 м
    10: 2490, // За сборку 1 грядки длиной 10 м
    12: 2990, // За сборку 1 грядки длиной 12 м
    14: 3490, // За сборку 1 грядки длиной 14 м
    16: 3990  // За сборку 1 грядки длиной 16 м
};

// Функция расчета стоимости сборки для всех выбранных грядок
function calculateBedsAssemblyCost(selectedBeds) {
    let totalAssemblyCost = 0;
    Object.keys(selectedBeds).forEach(bedId => {
        const bed = BEDS_DATA.find(b => b.id === bedId);
        if (bed && selectedBeds[bedId] > 0) {
            const bedLength = bed.length;
            const quantity = selectedBeds[bedId];
            const assemblyPricePerBed = BEDS_ASSEMBLY_PRICES[bedLength] || 0;
            totalAssemblyCost += assemblyPricePerBed * quantity;
        }
    });
    return totalAssemblyCost;
}



// Функция открытия модального окна выбора грядок
function showBedsModal() {
    // Проверяем, что выбраны размеры теплицы
    const widthInput = document.getElementById('width');
    const lengthInput = document.getElementById('length');
    
    if (!widthInput || !widthInput.value || !lengthInput || !lengthInput.value) {
        showWarning('Сначала выберите размеры теплицы (ширину и длину)', 'Выбор размеров');
        return;
    }
    
    const modal = document.getElementById('beds-modal');
    if (!modal) {
        showError("Модальное окно грядок не найдено. Обновите страницу.", 'Ошибка');
        return;
    }
    
    // Перемещаем модальное окно в body, если оно не там
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }
    
    // Сбрасываем выбор типа при открытии модального окна
    selectedBedType = null;
    
    // Загружаем выбранные грядки из localStorage
    selectedBeds = JSON.parse(localStorage.getItem('selectedBeds') || '{}');
    
    // Загружаем состояние чекбокса сборки
    bedsAssemblyEnabled = localStorage.getItem('bedsAssemblyEnabled') === 'true';
    
    // Рендерим список грядок (начнется с выбора типа)
    renderBedsSelection();
    
    // Устанавливаем состояние чекбокса сборки и обновляем цену
    setTimeout(() => {
        const assemblyCheckbox = document.getElementById('beds-assembly-checkbox');
        if (assemblyCheckbox) {
            assemblyCheckbox.checked = bedsAssemblyEnabled;
            updateBedsAssemblyPrice();
            assemblyCheckbox.addEventListener('change', function() {
                bedsAssemblyEnabled = this.checked;
                updateBedsAssemblyPrice();
            });
        }
        
        // Добавляем обработчик изменения длины теплицы для обновления цены сборки
        const lengthInput = document.getElementById('length');
        if (lengthInput) {
            // Удаляем старый обработчик, если есть
            lengthInput.removeEventListener('change', updateBedsAssemblyPrice);
            lengthInput.removeEventListener('input', updateBedsAssemblyPrice);
            // Добавляем новый
            lengthInput.addEventListener('change', updateBedsAssemblyPrice);
            lengthInput.addEventListener('input', updateBedsAssemblyPrice);
        }
    }, 100);
    
    // Показываем модальное окно
    modal.classList.remove('hidden');
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('visibility', 'visible', 'important');
    modal.style.setProperty('opacity', '1', 'important');
    modal.style.setProperty('z-index', '99999', 'important');
    
    // Блокируем прокрутку body и html
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Проверяем содержимое модального окна
    const modalContent = modal.querySelector('.beds-modal-content');
    if (modalContent) {
        const contentRect = modalContent.getBoundingClientRect();
        if (contentRect.width === 0 || contentRect.height === 0) {
            modalContent.style.setProperty('width', '600px', 'important');
            modalContent.style.setProperty('min-height', '400px', 'important');
        }
    }
}

// Функция закрытия модального окна грядок
function closeBedsModal() {
    const modal = document.getElementById('beds-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        // Восстанавливаем прокрутку
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
    }
}

// Переменная для хранения выбранного типа грядок (19 = низкие, 38 = высокие)
let selectedBedType = null;

// Функция рендеринга списка грядок
function renderBedsSelection() {
    const container = document.getElementById('beds-selection');
    if (!container) return;
    
    if (BEDS_DATA.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Данные о грядках загружаются...<br><small>Цены будут добавлены после парсинга с сайта</small></div>';
        return;
    }
    
    // Если тип не выбран, показываем выбор типа
    if (selectedBedType === null) {
        renderBedTypeSelection(container);
        return;
    }
    
    // Если тип выбран, показываем выбор характеристик
    renderBedCharacteristics(container);
}

// Функция рендеринга выбора типа грядок (низкие/высокие)
function renderBedTypeSelection(container) {
    let html = '<div class="bed-type-selection">';
    html += '<h3 class="bed-type-title">Выберите тип грядок:</h3>';
    html += '<div class="bed-type-cards">';
    
    // Низкие грядки (19 см)
    html += `
        <div class="bed-type-card" onclick="selectBedType(19)" style="position: relative;">
            <div class="bed-type-image-container">
                <img src="image/18.png" alt="Низкие грядки" class="bed-type-image">
            </div>
            <div class="bed-type-info">
                <h4 class="bed-type-name">Низкие грядки</h4>
                <p class="bed-type-description">Высота 19 см</p>
            </div>
            <div onclick="event.stopPropagation(); downloadBedImage('image/18.png', 'Низкие_грядки_19см.png');" style="
                position: absolute;
                top: 10px;
                right: 10px;
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 6px 10px;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            " onmouseover="this.style.background='rgba(255, 255, 255, 1)'; this.style.boxShadow='0 2px 6px rgba(0, 0, 0, 0.15)'" 
            onmouseout="this.style.background='rgba(255, 255, 255, 0.9)'; this.style.boxShadow='0 2px 4px rgba(0, 0, 0, 0.1)'">
                <span style="font-size: 14px;">📥</span>
                <span style="font-size: 11px; color: rgba(0, 0, 0, 0.5);">скачать фото</span>
            </div>
        </div>
    `;
    
    // Высокие грядки (38 см)
    html += `
        <div class="bed-type-card" onclick="selectBedType(38)" style="position: relative;">
            <div class="bed-type-image-container">
                <img src="image/19.png" alt="Высокие грядки" class="bed-type-image">
            </div>
            <div class="bed-type-info">
                <h4 class="bed-type-name">Высокие грядки</h4>
                <p class="bed-type-description">Высота 38 см</p>
            </div>
            <div onclick="event.stopPropagation(); downloadBedImage('image/19.png', 'Высокие_грядки_38см.png');" style="
                position: absolute;
                top: 10px;
                right: 10px;
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 6px 10px;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            " onmouseover="this.style.background='rgba(255, 255, 255, 1)'; this.style.boxShadow='0 2px 6px rgba(0, 0, 0, 0.15)'" 
            onmouseout="this.style.background='rgba(255, 255, 255, 0.9)'; this.style.boxShadow='0 2px 4px rgba(0, 0, 0, 0.1)'">
                <span style="font-size: 14px;">📥</span>
                <span style="font-size: 11px; color: rgba(0, 0, 0, 0.5);">скачать фото</span>
            </div>
        </div>
    `;
    
    html += '</div>';
    html += '</div>';
    
    // Добавляем секцию с фото компонентов и видео сборки
    const gryadkiData = getProductData('gryadki');
    if (gryadkiData) {
        html += '<div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e1e8ed;">';
        html += '<h3 style="font-size: 18px; font-weight: 600; color: #2c3e50; margin-bottom: 15px; text-align: center;">📸 Компоненты грядок</h3>';
        
        // Компоненты
        if (gryadkiData.components) {
            // Перемычка
            if (gryadkiData.components.peremychka && gryadkiData.components.peremychka.photos.length > 0) {
                html += `<div style="margin-bottom: 16px;">
                    <h4 style="font-size: 15px; font-weight: 600; margin-bottom: 8px; color: #2c3e50;">${gryadkiData.components.peremychka.name}</h4>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">`;
                gryadkiData.components.peremychka.photos.forEach((photo, index) => {
                    const filename = `Перемычка_${index + 1}.jpg`;
                    html += `<div style="position: relative; display: inline-block;">
                        <img src="${photo}" alt="${gryadkiData.components.peremychka.name}" 
                            style="width: 110px; height: 110px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 2px solid #e1e8ed;"
                            onclick="openImageModal('${photo}')"
                            onmouseover="this.style.borderColor='#48bb78'"
                            onmouseout="this.style.borderColor='#e1e8ed'">
                        <button onclick="event.stopPropagation(); downloadBedImage('${photo}', '${filename}');" style="
                            position: absolute;
                            top: 4px;
                            right: 4px;
                            background: rgba(0, 0, 0, 0.3);
                            border: none;
                            border-radius: 4px;
                            padding: 4px;
                            cursor: pointer;
                            font-size: 12px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            width: 24px;
                            height: 24px;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                            transition: all 0.2s;
                            color: white;
                        " onmouseover="this.style.background='rgba(0, 0, 0, 0.5)'; this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(0, 0, 0, 0.3)'; this.style.transform='scale(1)'">
                            <span>📥</span>
                        </button>
                    </div>`;
                });
                html += '</div></div>';
            }
            
            // Уголки
            if (gryadkiData.components.ugolki && gryadkiData.components.ugolki.photos.length > 0) {
                html += `<div style="margin-bottom: 16px;">
                    <h4 style="font-size: 15px; font-weight: 600; margin-bottom: 8px; color: #2c3e50;">${gryadkiData.components.ugolki.name}</h4>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">`;
                gryadkiData.components.ugolki.photos.forEach((photo, index) => {
                    const filename = `Соединительные_уголки_${index + 1}.jpg`;
                    html += `<div style="position: relative; display: inline-block;">
                        <img src="${photo}" alt="${gryadkiData.components.ugolki.name}" 
                            style="width: 110px; height: 110px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 2px solid #e1e8ed;"
                            onclick="openImageModal('${photo}')"
                            onmouseover="this.style.borderColor='#48bb78'"
                            onmouseout="this.style.borderColor='#e1e8ed'">
                        <button onclick="event.stopPropagation(); downloadBedImage('${photo}', '${filename}');" style="
                            position: absolute;
                            top: 4px;
                            right: 4px;
                            background: rgba(0, 0, 0, 0.3);
                            border: none;
                            border-radius: 4px;
                            padding: 4px;
                            cursor: pointer;
                            font-size: 12px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            width: 24px;
                            height: 24px;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                            transition: all 0.2s;
                            color: white;
                        " onmouseover="this.style.background='rgba(0, 0, 0, 0.5)'; this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(0, 0, 0, 0.3)'; this.style.transform='scale(1)'">
                            <span>📥</span>
                        </button>
                    </div>`;
                });
                html += '</div></div>';
            }
            
            // Стенка
            if (gryadkiData.components.stenka && gryadkiData.components.stenka.photos.length > 0) {
                html += `<div style="margin-bottom: 16px;">
                    <h4 style="font-size: 15px; font-weight: 600; margin-bottom: 8px; color: #2c3e50;">${gryadkiData.components.stenka.name}</h4>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">`;
                gryadkiData.components.stenka.photos.forEach((photo, index) => {
                    const filename = `Стенка_грядки_${index + 1}.jpg`;
                    html += `<div style="position: relative; display: inline-block;">
                        <img src="${photo}" alt="${gryadkiData.components.stenka.name}" 
                            style="width: 110px; height: 110px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 2px solid #e1e8ed;"
                            onclick="openImageModal('${photo}')"
                            onmouseover="this.style.borderColor='#48bb78'"
                            onmouseout="this.style.borderColor='#e1e8ed'">
                        <button onclick="event.stopPropagation(); downloadBedImage('${photo}', '${filename}');" style="
                            position: absolute;
                            top: 4px;
                            right: 4px;
                            background: rgba(0, 0, 0, 0.3);
                            border: none;
                            border-radius: 4px;
                            padding: 4px;
                            cursor: pointer;
                            font-size: 12px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            width: 24px;
                            height: 24px;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                            transition: all 0.2s;
                            color: white;
                        " onmouseover="this.style.background='rgba(0, 0, 0, 0.5)'; this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(0, 0, 0, 0.3)'; this.style.transform='scale(1)'">
                            <span>📥</span>
                        </button>
                    </div>`;
                });
                html += '</div></div>';
            }
        }
        
        // Видео сборки
        if (gryadkiData.video && gryadkiData.video.assembly) {
            html += `<div style="text-align: center; margin-top: 15px; padding: 15px; background: #f7fafc; border-radius: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h4 style="font-size: 16px; font-weight: 600; color: #2c3e50; margin: 0;">🎥 ${gryadkiData.video.assembly.name}</h4>
                    <button onclick="downloadVideo('${gryadkiData.video.assembly.path}', '${gryadkiData.video.assembly.name.replace(/\s+/g, '_')}.mp4');" style="
                        background: rgba(0, 0, 0, 0.3);
                        color: white;
                        border: none;
                        border-radius: 4px;
                        padding: 4px 8px;
                        cursor: pointer;
                        font-size: 14px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 32px;
                        height: 32px;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='rgba(0, 0, 0, 0.5)'; this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(0, 0, 0, 0.3)'; this.style.transform='scale(1)'">
                        <span>📥</span>
                    </button>
                </div>
                <video controls style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <source src="${gryadkiData.video.assembly.path}" type="video/mp4">
                    Ваш браузер не поддерживает видео.
                </video>
            </div>`;
        }
        
        html += '</div>';
    }
    
    container.innerHTML = html;
}

// Функция получения размеров теплицы
function getGreenhouseDimensions() {
    const widthInput = document.getElementById('width');
    const lengthInput = document.getElementById('length');
    
    if (!widthInput || !widthInput.value || !lengthInput || !lengthInput.value) {
        return null;
    }
    
    return {
        width: parseFloat(widthInput.value),
        length: parseInt(lengthInput.value)
    };
}

// Функция расчета рекомендуемых грядок
function getRecommendedBeds(height) {
    const dimensions = getGreenhouseDimensions();
    if (!dimensions) return null;
    
    const { width, length } = dimensions;
    
    // Для теплиц шириной 4 м:
    if (width === 4) {
        // Если длина 4 м: только 2 боковые грядки по 1 м шириной, длина 4 м
        if (length === 4) {
            const sideBed = BEDS_DATA.find(b => 
                b.height === height && 
                b.width === 1 && 
                b.length === 4
            );
            
            if (!sideBed) return null;
            
            return {
                center: null, // Нет центральной грядки для 4×4 м
                sides: { bed: sideBed, quantity: 2 }
            };
        }
        
        // Если длина 6 м и больше: 3 грядки по 1 м шириной
        // - 2 боковые: длина = длина теплицы (максимум 12 м)
        // - 1 центральная: длина = длина теплицы - 2 м (минимум 4 м, максимум 12 м)
        const centerBedLength = Math.max(4, length - 2); // Минимум 4 м, иначе длина - 2 м
        const centerBedLengthFinal = Math.min(centerBedLength, 12); // Максимум 12 м
        
        const sideBedLength = Math.min(length, 12); // Максимум 12 м
        
        // Находим центральную грядку (ширина 1 м)
    const centerBed = BEDS_DATA.find(b => 
        b.height === height && 
            b.width === 1 && 
            b.length === centerBedLengthFinal
        );
        
        // Находим боковые грядки (ширина 1 м)
        const sideBed = BEDS_DATA.find(b => 
            b.height === height && 
            b.width === 1 && 
            b.length === sideBedLength
        );
        
        if (!centerBed || !sideBed) return null;
        
        // Проверка проходов: центральная (1 м) + боковые (1 м × 2 = 2 м) = 3 м
        // Остается на проходы: 4 м - 3 м = 1 м
        // Должно быть минимум 0.2 м × 2 = 0.4 м на оба прохода
        const totalBedsWidth = 1 + (1 * 2); // 3 м
        const availableForPassages = width - totalBedsWidth; // 1 м
        const minPassageWidth = 0.2; // 20 см
        const minTotalPassages = minPassageWidth * 2; // 40 см на оба прохода
        
        if (availableForPassages >= minTotalPassages) {
            return {
                center: { bed: centerBed, quantity: 1 },
                sides: { bed: sideBed, quantity: 2 }
            };
        }
        
        // Если не хватает места (не должно быть для 4 м, но на всякий случай)
        return null;
    }
    
    // Для теплиц шириной 3.5 м (длина >= 6 м): 2 боковые по 1 м, центральная 0.8 м
    if (width === 3.5 && length >= 6) {
        const centerBedLength = Math.max(4, length - 2);
        const centerBedLengthFinal = Math.min(centerBedLength, 12);
        const sideBedLength = Math.min(length, 12);
        
        // Находим центральную грядку (ширина 0.8 м)
        const centerBed = BEDS_DATA.find(b => 
            b.height === height && 
            b.width === 0.8 && 
            b.length === centerBedLengthFinal
        );
        
        // Находим боковые грядки (ширина 1 м)
        const sideBed = BEDS_DATA.find(b => 
            b.height === height && 
            b.width === 1 && 
            b.length === sideBedLength
        );
        
        if (!centerBed || !sideBed) return null;
        
        // Проверка проходов: центральная (0.8 м) + боковые (1 м × 2 = 2 м) = 2.8 м
        // Остается на проходы: 3.5 м - 2.8 м = 0.7 м
        // Должно быть минимум 0.2 м × 2 = 0.4 м на оба прохода
        const totalBedsWidth = 0.8 + (1 * 2); // 2.8 м
        const availableForPassages = width - totalBedsWidth; // 0.7 м
        const minPassageWidth = 0.2; // 20 см
        const minTotalPassages = minPassageWidth * 2; // 40 см на оба прохода
        
        if (availableForPassages >= minTotalPassages) {
            return {
                center: { bed: centerBed, quantity: 1 },
                sides: { bed: sideBed, quantity: 2 }
            };
        }
        
        return null;
    }
    
    // Для теплиц шириной 2.5 м: прежняя логика (0.5 м центральная, 0.8 м боковые)
    // Для теплиц шириной 3 м: также прежняя логика
    // Для теплиц длиной 4 м: только 2 боковые грядки по 0.8 м (или 1 м для 4 м ширины)
    if (length === 4 && width !== 4) {
        // Для не-4м теплиц длиной 4 м: 2 боковые по 0.8 м
        const sideBed = BEDS_DATA.find(b => 
            b.height === height && 
            b.width === 0.8 && 
        b.length === 4
    );
    
        if (!sideBed) return null;
        
        return {
            center: null, // Нет центральной грядки для 4 м длины
            sides: { bed: sideBed, quantity: 2 }
        };
    }
    
    // Для теплиц длиной 6 м и больше (ширина 2.5 м, 3 м):
    // - Центральная грядка: длина = длина теплицы - 2 м (чтобы можно было ходить вокруг)
    // - Боковые грядки: длина = длина теплицы (во всю длину)
    // - Ширина центральной: 0.5 м
    // - Ширина боковых: 0.8 м
    // - Проверка: должно оставаться минимум 20 см на проход между грядками
    
    const centerBedLength = Math.max(4, length - 2); // Минимум 4 м, иначе длина - 2 м
    const centerBedLengthFinal = Math.min(centerBedLength, 12); // Максимум 12 м
    
    const sideBedLength = Math.min(length, 12); // Максимум 12 м
    
    // Находим центральную грядку
    const centerBed = BEDS_DATA.find(b => 
        b.height === height && 
        b.width === 0.5 && 
        b.length === centerBedLengthFinal
    );
    
    // Находим боковые грядки
    const sideBed = BEDS_DATA.find(b => 
        b.height === height && 
        b.width === 0.8 && 
        b.length === sideBedLength
    );
    
    if (!centerBed || !sideBed) return null;
    
    // Проверка проходов: центральная (0.5 м) + боковые (0.8 м × 2 = 1.6 м) = 2.1 м
    // Остается на проходы: ширина теплицы - 2.1 м
    // Должно быть минимум 0.2 м × 2 = 0.4 м на оба прохода
    const totalBedsWidth = 0.5 + (0.8 * 2); // 2.1 м
    const availableForPassages = width - totalBedsWidth;
    const minPassageWidth = 0.2; // 20 см
    const minTotalPassages = minPassageWidth * 2; // 40 см на оба прохода
    
    if (availableForPassages < minTotalPassages) {
        // Если не хватает места, пытаемся уменьшить ширину боковых грядок
        // Пробуем 0.65 м вместо 0.8 м
        const sideBedNarrow = BEDS_DATA.find(b => 
            b.height === height && 
            b.width === 0.65 && 
            b.length === sideBedLength
        );
        
        if (sideBedNarrow) {
            const totalBedsWidthNarrow = 0.5 + (0.65 * 2); // 1.8 м
            const availableForPassagesNarrow = width - totalBedsWidthNarrow;
            
            if (availableForPassagesNarrow >= minTotalPassages) {
                return {
                    center: { bed: centerBed, quantity: 1 },
                    sides: { bed: sideBedNarrow, quantity: 2 }
                };
            }
        }
        
        // Если все равно не хватает, возвращаем null (рекомендация не показывается)
        return null;
    }
    
    return {
        center: { bed: centerBed, quantity: 1 },
        sides: { bed: sideBed, quantity: 2 }
    };
}

// Функция выбора типа грядок
function selectBedType(height) {
    selectedBedType = height;
    renderBedsSelection();
}

// Функция возврата к выбору типа
function backToBedTypeSelection() {
    selectedBedType = null;
    renderBedsSelection();
}

// Функция рендеринга выбора характеристик грядок
function renderBedCharacteristics(container) {
    const dimensions = getGreenhouseDimensions();
    if (!dimensions) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Выберите размеры теплицы</div>';
        return;
    }
    
    const { length } = dimensions;
    
    // Фильтруем грядки по выбранному типу и длине (не длиннее теплицы)
    const filteredBeds = BEDS_DATA.filter(bed => 
        bed.height === selectedBedType && 
        bed.length <= length
    );
    
    // Получаем рекомендуемый вариант
    const recommended = getRecommendedBeds(selectedBedType);
    
    let html = '<div class="beds-list">';
    
    // Кнопка "Назад" и корзинка для сброса
    html += `<div class="bed-back-button-container">`;
    html += `<button class="bed-back-button" onclick="backToBedTypeSelection()">← Назад к выбору типа</button>`;
    const totalBedsSelected = Object.values(selectedBeds).reduce((sum, qty) => sum + (qty || 0), 0);
    if (totalBedsSelected > 0) {
        html += `<button class="bed-clear-button" id="bed-clear-button" onclick="clearAllBeds()" title="Сбросить все выбранные грядки">🗑️</button>`;
    }
    html += `</div>`;
    
    // Показываем рекомендуемый вариант
    if (recommended) {
        const sideBed = recommended.sides.bed;
        let centerCost = 0;
        if (recommended.center && recommended.center.bed) {
            centerCost = recommended.center.bed.price * recommended.center.quantity;
        }
        const sideCost = sideBed.price * recommended.sides.quantity;
        const totalBedsCost = centerCost + sideCost;
        
        // Получаем цену сборки для всех грядок (с учетом их длин)
        let assemblyPrice = 0;
        if (recommended.center && recommended.center.bed) {
            const centerAssemblyPrice = BEDS_ASSEMBLY_PRICES[recommended.center.bed.length] || 0;
            assemblyPrice += centerAssemblyPrice * recommended.center.quantity;
        }
        if (recommended.sides && recommended.sides.bed) {
            const sideAssemblyPrice = BEDS_ASSEMBLY_PRICES[recommended.sides.bed.length] || 0;
            assemblyPrice += sideAssemblyPrice * recommended.sides.quantity;
        }
        
        // Итоговая стоимость со сборкой
        const totalWithAssembly = totalBedsCost + assemblyPrice;
        
        // Правильное склонение слова "грядка"
        const getBedWord = (quantity) => {
            if (quantity === 1) return 'грядка';
            if (quantity >= 2 && quantity <= 4) return 'грядки';
            return 'грядок';
        };
        
        html += `<div class="bed-recommended-card">`;
        html += `<div class="bed-recommended-header">`;
        html += `<span class="bed-recommended-icon">⭐</span>`;
        html += `<span class="bed-recommended-title">Рекомендуемый вариант</span>`;
        html += `</div>`;
        html += `<div class="bed-recommended-content">`;
        if (recommended.center && recommended.center.bed) {
            const centerBedWord = getBedWord(recommended.center.quantity);
            const centerBedInfo = `${recommended.center.quantity} ${centerBedWord} по центру ${recommended.center.bed.length} м: ширина ${recommended.center.bed.width} м, высота ${recommended.center.bed.height} см - ${formatPrice(centerCost)} руб.`;
            html += `<div class="bed-recommended-item">${centerBedInfo}</div>`;
        }
        const sideBedWord = getBedWord(recommended.sides.quantity);
        const sideBedInfo = `${recommended.sides.quantity} ${sideBedWord} по бокам ${recommended.sides.bed.length} м: ширина ${recommended.sides.bed.width} м, высота ${recommended.sides.bed.height} см - ${formatPrice(sideCost)} руб.`;
        html += `<div class="bed-recommended-item">${sideBedInfo}</div>`;
        html += `</div>`;
        
        // Предупреждение для спорных размеров (если проходы минимальные)
        const dimensions = getGreenhouseDimensions();
        if (dimensions && recommended.center && recommended.center.bed) {
            const totalBedsWidth = recommended.center.bed.width + (recommended.sides.bed.width * 2);
            const availableForPassages = dimensions.width - totalBedsWidth;
            const passageWidth = availableForPassages / 2;
            if (passageWidth <= 0.25) { // Если проход меньше или равен 25 см
                html += `<div class="bed-recommended-warning">⚠️ Внимание: проходы между грядками будут узкими (${(passageWidth * 100).toFixed(0)} см). Рекомендуем теплицу шире ${(totalBedsWidth + 0.5).toFixed(1)} м для комфортных проходов.</div>`;
            }
        }
        html += `<div class="bed-recommended-actions">`;
        html += `<button class="bed-recommended-btn bed-recommended-btn-secondary" onclick="applyRecommendedBeds(false)">Без сборки: ${formatPrice(totalBedsCost)} руб.</button>`;
        html += `<button class="bed-recommended-btn bed-recommended-btn-primary" onclick="applyRecommendedBeds(true)">Со сборкой: ${formatPrice(totalWithAssembly)} руб.</button>`;
        html += `</div>`;
        html += `</div>`;
    }
    
    // Группируем по ширине
    const groupedBeds = {};
    filteredBeds.forEach(bed => {
        const key = `${bed.width} м`;
        if (!groupedBeds[key]) {
            groupedBeds[key] = [];
        }
        groupedBeds[key].push(bed);
    });
    
    // Сортируем группы по ширине
    const sortedGroups = Object.keys(groupedBeds).sort((a, b) => {
        const aWidth = parseFloat(a);
        const bWidth = parseFloat(b);
        return aWidth - bWidth;
    });
    
    sortedGroups.forEach(groupKey => {
        const beds = groupedBeds[groupKey];
        const width = beds[0].width;
        const height = beds[0].height;
        const groupTitle = `Ширина ${width} м, высота ${height} см`;
        const imagePath = height === 19 ? 'image/18.png' : 'image/19.png';
        
        html += `<div class="bed-group">`;
        html += `<div class="bed-group-header">`;
        html += `<h3 class="bed-group-title">${groupTitle}</h3>`;
        html += `<img src="${imagePath}" alt="${height === 19 ? 'Низкие грядки' : 'Высокие грядки'}" class="bed-group-image">`;
        html += `</div>`;
        
        beds.forEach(bed => {
            const quantity = selectedBeds[bed.id] || 0;
            const priceDisplay = bed.price > 0 ? `${formatPrice(bed.price)} руб.` : 'Цена не указана';
            html += `
                <div class="bed-item">
                    <div class="bed-info">
                        <h4 class="bed-name">${bed.length} м</h4>
                        <div class="bed-price ${bed.price === 0 ? 'bed-price-empty' : ''}">${priceDisplay}</div>
                    </div>
                    <div class="bed-controls">
                        <button class="bed-btn-minus" onclick="changeBedQuantity('${bed.id}', -1)">−</button>
                        <input type="number" class="bed-quantity-input" id="bed-qty-${bed.id}" value="${quantity}" min="0" max="10" readonly>
                        <button class="bed-btn-plus" onclick="changeBedQuantity('${bed.id}', 1)">+</button>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Обновляем счетчик на кнопке
    updateBedsCounter();
}

// Функция изменения количества грядок
function changeBedQuantity(bedId, delta) {
    const currentQty = selectedBeds[bedId] || 0;
    const newQty = Math.max(0, Math.min(10, currentQty + delta));
    selectedBeds[bedId] = newQty;
    
    // Обновляем отображение
    const input = document.getElementById(`bed-qty-${bedId}`);
    if (input) {
        input.value = newQty;
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('selectedBeds', JSON.stringify(selectedBeds));
    
    // Обновляем счетчик
    updateBedsCounter();
    
    // Обновляем корзинку (показываем/скрываем в зависимости от выбранных грядок)
    updateBedsClearButton();
}

// Функция обновления видимости кнопки корзинки
function updateBedsClearButton() {
    const clearButton = document.getElementById('bed-clear-button');
    const container = document.querySelector('.bed-back-button-container');
    
    if (!container) return;
    
    const totalBedsSelected = Object.values(selectedBeds).reduce((sum, qty) => sum + (qty || 0), 0);
    
    if (totalBedsSelected > 0) {
        // Если корзинки нет, добавляем её
        if (!clearButton) {
            const button = document.createElement('button');
            button.className = 'bed-clear-button';
            button.id = 'bed-clear-button';
            button.onclick = clearAllBeds;
            button.title = 'Сбросить все выбранные грядки';
            button.textContent = '🗑️';
            container.appendChild(button);
        }
    } else {
        // Если корзинка есть, но грядок нет - удаляем её
        if (clearButton) {
            clearButton.remove();
        }
    }
}

// Функция обновления счетчика на кнопке
function updateBedsCounter() {
    const badge = document.getElementById('beds-count-badge');
    if (!badge) return;
    
    const totalBeds = Object.values(selectedBeds).reduce((sum, qty) => sum + qty, 0);
    if (totalBeds > 0) {
        badge.textContent = totalBeds;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

// Функция обновления цены сборки грядок в модальном окне
function updateBedsAssemblyPrice() {
    const priceElement = document.getElementById('beds-assembly-price');
    if (!priceElement) return;
    
    const lengthInput = document.getElementById('length');
    if (!lengthInput || !lengthInput.value) {
        priceElement.textContent = 'Укажите длину теплицы для расчета стоимости сборки';
        return;
    }
    
    const length = parseInt(lengthInput.value);
    // Подсчитываем стоимость сборки для всех выбранных грядок
    const selectedBeds = JSON.parse(localStorage.getItem('selectedBeds') || '{}');
    const totalAssemblyCost = calculateBedsAssemblyCost(selectedBeds);
    const totalBedsQuantity = Object.values(selectedBeds).reduce((sum, qty) => sum + (qty || 0), 0);
    
    if (totalBedsQuantity === 0) {
        // Если грядки не выбраны, не показываем цену
        priceElement.textContent = 'Выберите грядки для расчета стоимости сборки';
        return;
    } else if (totalBedsQuantity === 1) {
        priceElement.textContent = `Стоимость сборки за 1 грядку: ${formatPrice(totalAssemblyCost)} рублей`;
    } else {
        priceElement.textContent = `Стоимость сборки за все грядки: ${formatPrice(totalAssemblyCost)} рублей`;
    }
}

// Функция применения выбора грядок
// Функция показа вопроса про сборку грядок в стиле toast
function showBedsAssemblyQuestion(assemblyCost, callback) {
    const container = document.getElementById('toast-container');
    if (!container) {
        // Fallback на confirm, если toast контейнер не найден
        const message = assemblyCost > 0 
            ? `Грядки выбраны. Нужна ли сборка грядок за ${formatPrice(assemblyCost)} рублей?`
            : 'Грядки выбраны. Нужна ли сборка грядок?';
        const result = confirm(message);
        if (callback) callback(result);
        return;
    }
    
    // Создаем модальное overlay для вопроса
    const overlay = document.createElement('div');
    overlay.className = 'toast-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    `;
    
    // Формируем текст вопроса с стоимостью
    const questionText = assemblyCost > 0 
        ? `Нужна ли сборка грядок за ${formatPrice(assemblyCost)} рублей?`
        : 'Нужна ли сборка грядок?';
    
    // Создаем toast-подобное окно с вопросом
    const questionToast = document.createElement('div');
    questionToast.className = 'toast toast-info';
    questionToast.style.cssText = `
        background: #fff;
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        z-index: 10002;
    `;
    
    questionToast.innerHTML = `
        <div class="toast-icon" style="font-size: 24px; margin-bottom: 12px;">❓</div>
        <div class="toast-content">
            <div class="toast-title" style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Грядки выбраны</div>
            <div class="toast-message" style="font-size: 16px; margin-bottom: 20px;">${questionText}</div>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button class="toast-btn-cancel" style="
                    padding: 10px 20px;
                    border: 2px solid #e1e8ed;
                    border-radius: 8px;
                    background: #f8f9fa;
                    color: #5a6c7d;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                ">Нет</button>
                <button class="toast-btn-ok" style="
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
                    color: #fff;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                ">Да</button>
            </div>
        </div>
    `;
    
    // Обработчики кнопок
    const btnCancel = questionToast.querySelector('.toast-btn-cancel');
    const btnOk = questionToast.querySelector('.toast-btn-ok');
    
    const closeQuestion = (result) => {
        overlay.remove();
        if (callback) callback(result);
    };
    
    btnCancel.addEventListener('click', () => closeQuestion(false));
    btnOk.addEventListener('click', () => closeQuestion(true));
    
    // Закрытие по клику на overlay
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeQuestion(false);
        }
    });
    
    overlay.appendChild(questionToast);
    document.body.appendChild(overlay);
}

function applyBedsSelection() {
    // Сохраняем выбранные грядки в localStorage
    localStorage.setItem('selectedBeds', JSON.stringify(selectedBeds));
    
    // Сохраняем состояние чекбокса сборки
    const assemblyCheckbox = document.getElementById('beds-assembly-checkbox');
    const hasSelectedBeds = Object.keys(selectedBeds).length > 0 && 
                            Object.values(selectedBeds).some(qty => qty > 0);
    
    // Сначала закрываем модальное окно с грядками
    closeBedsModal();
    
    if (assemblyCheckbox) {
        bedsAssemblyEnabled = assemblyCheckbox.checked;
        localStorage.setItem('bedsAssemblyEnabled', bedsAssemblyEnabled ? 'true' : 'false');
        
        // Если грядки выбраны, но сборка не выбрана - спрашиваем
        if (hasSelectedBeds && !bedsAssemblyEnabled) {
            // Рассчитываем стоимость сборки для показа в вопросе
            const assemblyCost = calculateBedsAssemblyCost(selectedBeds);
            
            // Показываем вопрос после небольшой задержки, чтобы модальное окно успело закрыться
            setTimeout(() => {
                showBedsAssemblyQuestion(assemblyCost, (userWantsAssembly) => {
                    if (userWantsAssembly) {
                        bedsAssemblyEnabled = true;
                        assemblyCheckbox.checked = true;
                        localStorage.setItem('bedsAssemblyEnabled', 'true');
                        showSuccess('Сборка грядок включена');
                    }
                    
                    // Пересчитываем стоимость
                    if (typeof calculateGreenhouseCost === 'function') {
                        calculateGreenhouseCost();
                    }
                });
            }, 300); // Небольшая задержка для плавного закрытия модального окна
            return;
        }
    }
    
    // Пересчитываем стоимость
    if (typeof calculateGreenhouseCost === 'function') {
        calculateGreenhouseCost();
    }
}

// Делаем функции доступными глобально
window.showFAQModal = showFAQModal;
window.closeFAQModal = closeFAQModal;
window.toggleFAQ = toggleFAQ;
window.copyFAQAnswer = copyFAQAnswer;
window.filterFAQ = filterFAQ;
window.filterFAQByCategory = filterFAQByCategory;
window.splitForAvito = splitForAvito;
window.copyCommercialOffer = copyCommercialOffer;
window.copyKP1 = copyKP1;
window.copyKP2 = copyKP2;
window.showBedsModal = showBedsModal;
window.closeBedsModal = closeBedsModal;
window.changeBedQuantity = changeBedQuantity;
// Функция применения рекомендуемого варианта
function applyRecommendedBeds(withAssembly = false) {
    const recommended = getRecommendedBeds(selectedBedType);
    if (!recommended) return;

    // Очищаем предыдущий выбор грядок этого типа
    Object.keys(selectedBeds).forEach(bedId => {
        const bed = BEDS_DATA.find(b => b.id === bedId);
        if (bed && bed.height === selectedBedType) {
            delete selectedBeds[bedId];
        }
    });

    // Устанавливаем рекомендуемые грядки
    // Для теплиц 4м центральная грядка может быть null
    if (recommended.center && recommended.center.bed) {
        selectedBeds[recommended.center.bed.id] = recommended.center.quantity;
    }
    if (recommended.sides && recommended.sides.bed) {
        selectedBeds[recommended.sides.bed.id] = recommended.sides.quantity;
    }

    // Сохраняем выбранные грядки в localStorage
    localStorage.setItem('selectedBeds', JSON.stringify(selectedBeds || {}));

    // Устанавливаем состояние сборки
    bedsAssemblyEnabled = !!withAssembly;
    localStorage.setItem('bedsAssemblyEnabled', bedsAssemblyEnabled ? 'true' : 'false');

    // Обновляем чекбокс сборки в модальном окне (если он есть)
    const bedsAssemblyCheckbox = document.getElementById('beds-assembly-checkbox');
    if (bedsAssemblyCheckbox) {
        bedsAssemblyCheckbox.checked = bedsAssemblyEnabled;
        updateBedsAssemblyPrice();
    }

    // Обновляем счетчик выбранных грядок
    updateBedsCounter();

    // Закрываем модальное окно
    closeBedsModal();

    // Автоматически пересчитываем стоимость теплицы
    if (typeof calculateGreenhouseCost === 'function') {
        calculateGreenhouseCost();
    }

    // Показываем уведомление
    showSuccess(withAssembly ? 'Рекомендуемые грядки добавлены со сборкой' : 'Рекомендуемые грядки добавлены без сборки');
}

// Функция сброса всех выбранных грядок
function clearAllBeds() {
    // Очищаем все выбранные грядки
    selectedBeds = {};
    
    // Сбрасываем состояние сборки
    bedsAssemblyEnabled = false;
    
    // Сохраняем в localStorage
    localStorage.setItem('selectedBeds', JSON.stringify({}));
    localStorage.setItem('bedsAssemblyEnabled', 'false');
    
    // Обновляем счетчик
    updateBedsCounter();
    
    // Обновляем корзинку
    updateBedsClearButton();
    
    // Обновляем чекбокс сборки в модальном окне
    const bedsAssemblyCheckbox = document.getElementById('beds-assembly-checkbox');
    if (bedsAssemblyCheckbox) {
        bedsAssemblyCheckbox.checked = false;
        updateBedsAssemblyPrice();
    }
    
    // Перерисовываем список грядок
    renderBedsSelection();
    
    // Показываем уведомление
    showSuccess('Все грядки удалены из корзины', 'Грядки удалены');
}

// Функция скачивания одной фотографии грядки
function downloadBedImage(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccess('Фотография скачивается...', 'Скачивание');
}

function downloadVideo(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccess('Видео скачивается...', 'Скачивание');
}

/**
 * Копировать изображение в буфер обмена
 * Поддерживает: Chrome/Edge (Windows, macOS, Android), Safari (macOS, iOS 13.4+), Firefox (Windows, macOS, Android)
 * @param {string} imageUrl - URL изображения
 * @param {HTMLElement} button - Кнопка для обратной связи
 */
async function copyImageToClipboard(imageUrl, button) {
    try {
        // Проверяем базовую поддержку Clipboard API
        if (!navigator.clipboard) {
            showWarning('Ваш браузер не поддерживает копирование изображений. Используйте правый клик → "Копировать изображение"', 'Копирование');
            return;
        }
        
        // Проверяем поддержку ClipboardItem (нужно для изображений)
        if (!window.ClipboardItem) {
            // Fallback для старых браузеров
            showWarning('Ваш браузер не поддерживает копирование изображений. Используйте правый клик → "Копировать изображение"', 'Копирование');
            return;
        }
        
        // Загружаем изображение через fetch для получения Blob
        let response;
        let blobUrl = null; // Для освобождения памяти
        try {
            response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error('Не удалось загрузить изображение');
            }
        } catch (fetchError) {
            // Если fetch не сработал (CORS), используем прямой URL
            response = null;
        }
        
        // Конвертируем изображение в PNG для максимальной совместимости
        // PNG поддерживается лучше, чем JPEG на разных платформах
        const img = new Image();
        
        // Если fetch сработал, используем blob URL для избежания CORS
        if (response) {
            const blob = await response.blob();
            blobUrl = URL.createObjectURL(blob);
            img.src = blobUrl;
        } else {
            // Если fetch не сработал, используем прямой URL
            img.src = imageUrl;
        }
        
        // Ждем загрузки изображения
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error('Ошибка загрузки изображения'));
        });
        
        // Создаем canvas для конвертации
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            throw new Error('Canvas не поддерживается');
        }
        
        // Устанавливаем размеры canvas (ограничиваем максимальный размер для производительности)
        const maxDimension = 4096; // Максимальный размер для совместимости
        let width = img.naturalWidth;
        let height = img.naturalHeight;
        
        if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Рисуем изображение на canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Освобождаем blob URL, если использовали
        if (blobUrl) {
            URL.revokeObjectURL(blobUrl);
        }
        
        // Конвертируем в PNG Blob
        const pngBlob = await new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Не удалось конвертировать изображение'));
                }
            }, 'image/png', 0.95); // Качество 0.95 для баланса размера и качества
        });
        
        // Пробуем скопировать PNG (наиболее совместимый формат)
        try {
            const clipboardItem = new ClipboardItem({
                'image/png': pngBlob
            });
            await navigator.clipboard.write([clipboardItem]);
            
            // Успех!
            const originalText = button.innerHTML;
            button.innerHTML = '✅ Скопировано';
            button.style.background = 'rgba(46, 204, 113, 0.8)';
            showSuccess('Изображение скопировано в буфер обмена!', 'Копирование');
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.background = 'rgba(0, 0, 0, 0.5)';
            }, 2000);
            
            return;
        } catch (pngError) {
            // Если PNG не сработал, пробуем оригинальный формат
            if (DEBUG) console.log('PNG не сработал, пробуем оригинальный формат:', pngError);
            
            // Получаем оригинальный Blob
            let originalBlob;
            if (response) {
                originalBlob = await response.blob();
            } else {
                // Если использовали Image, конвертируем canvas обратно в оригинальный формат
                // Но лучше использовать PNG, который мы уже создали
                throw pngError; // Если PNG не сработал, оригинальный тоже не сработает
            }
            let mimeType = originalBlob.type || 'image/png';
            
            // Нормализуем MIME-тип
            if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
                mimeType = 'image/jpeg';
            } else if (mimeType !== 'image/png' && mimeType !== 'image/gif' && mimeType !== 'image/webp') {
                mimeType = 'image/png'; // Используем PNG как fallback
            }
            
            try {
                const clipboardItem = new ClipboardItem({
                    [mimeType]: originalBlob
                });
                await navigator.clipboard.write([clipboardItem]);
                
                // Успех!
                const originalText = button.innerHTML;
                button.innerHTML = '✅ Скопировано';
                button.style.background = 'rgba(46, 204, 113, 0.8)';
                showSuccess('Изображение скопировано в буфер обмена!', 'Копирование');
                
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.style.background = 'rgba(0, 0, 0, 0.5)';
                }, 2000);
                
                return;
            } catch (originalError) {
                throw new Error('Не удалось скопировать ни PNG, ни оригинальный формат');
            }
        }
        
    } catch (error) {
        console.error('Ошибка при копировании изображения:', error);
        
        // Определяем тип ошибки для более понятного сообщения
        let errorMessage = 'Не удалось скопировать изображение. ';
        
        if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
            errorMessage += 'Проблема с доступом к изображению. ';
        } else if (error.message.includes('permission') || error.name === 'NotAllowedError') {
            errorMessage += 'Нет разрешения на доступ к буферу обмена. ';
        }
        
        errorMessage += 'Используйте правый клик → "Копировать изображение" или кнопку "Скачать"';
        
        showWarning(errorMessage, 'Копирование');
        
        // Сбрасываем кнопку
        const originalText = button.innerHTML;
        button.innerHTML = '❌ Ошибка';
        button.style.background = 'rgba(231, 76, 60, 0.8)';
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = 'rgba(0, 0, 0, 0.5)';
        }, 2000);
    }
}

window.applyBedsSelection = applyBedsSelection;
window.selectBedType = selectBedType;
window.backToBedTypeSelection = backToBedTypeSelection;
window.applyRecommendedBeds = applyRecommendedBeds;
window.clearAllBeds = clearAllBeds;
window.updateBedsClearButton = updateBedsClearButton;
window.downloadBedImage = downloadBedImage;
window.downloadVideo = downloadVideo;

// Функция показа информации о товаре из раздела "Дополнительные товары"
function showProductInfo(productId) {
    let productData = null;
    let productName = '';
    let photos = [];
    let description = '';
    let video = null;
    
    // Маппинг ID товаров на данные
    switch(productId) {
        case 'drip-irrigation-mech':
            const dripData = getProductData('drip-irrigation');
            if (dripData && dripData.mechanical) {
                productData = dripData.mechanical;
                productName = dripData.mechanical.name || 'Капельный полив механический';
                photos = dripData.mechanical.photos || [];
                description = dripData.mechanical.description || dripData.description || '';
            }
            break;
            
        case 'drip-irrigation-auto':
            const dripAutoData = getProductData('drip-irrigation');
            if (dripAutoData && dripAutoData.automatic) {
                productData = dripAutoData.automatic;
                productName = dripAutoData.automatic.name || 'Капельный полив автоматический';
                photos = dripAutoData.automatic.photos || [];
                description = dripAutoData.automatic.description || dripAutoData.description || '';
            }
            break;
            
        case 'thermodrive':
            const thermodriveData = getProductData('thermodrive');
            if (thermodriveData) {
                productData = thermodriveData;
                productName = thermodriveData.name || 'Автомат для форточки';
                photos = thermodriveData.photos || [];
                description = thermodriveData.description || '';
                // Добавляем предупреждение о том, что автомат устанавливается только на дополнительную форточку
                description = '<div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 15px; margin-bottom: 15px; border-radius: 6px;"><strong style="color: #856404;">⚠️ Внимание:</strong> Автомат для форточки устанавливается только на <strong>дополнительную форточку</strong>. Убедитесь, что у вас есть дополнительная форточка (купленная или подаренная), прежде чем выбирать автомат.</div>' + description;
            }
            break;
            
        case 'doors-windows-window':
            const doorsData = getProductData('doors-windows');
            if (doorsData && doorsData.windows) {
                productData = doorsData.windows;
                productName = 'Дополнительная форточка';
                photos = (doorsData.windows.side?.photos || []).concat(doorsData.windows.end?.photos || []);
                description = doorsData.windows.side?.description || doorsData.windows.end?.description || doorsData.description || '';
            }
            break;
            
        case 'tapes-galvanized':
            const tapesData = getProductData('tapes');
            if (tapesData && tapesData.galvanized) {
                productData = tapesData.galvanized;
                productName = tapesData.galvanized.name || 'Оцинкованная лента 30 м';
                photos = tapesData.galvanized.photos || [];
                description = tapesData.galvanized.description || tapesData.description || '';
            }
            break;
            
        case 'tapes-vapor-permeable':
            const tapesVaporData = getProductData('tapes');
            if (tapesVaporData && tapesVaporData.vaporPermeable) {
                productData = tapesVaporData.vaporPermeable;
                productName = tapesVaporData.vaporPermeable.name || 'Паропропускная лента 25 м';
                photos = tapesVaporData.vaporPermeable.photos || [];
                description = tapesVaporData.vaporPermeable.description || tapesVaporData.description || '';
                video = tapesVaporData.vaporPermeable.video || null;
            }
            break;
    }
    
    if (!productData) {
        showWarning("Информация о товаре пока недоступна", "Информация");
        return;
    }
    
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'product-info-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
        box-sizing: border-box;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        max-width: 900px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        padding: 20px;
        position: relative;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
        box-sizing: border-box;
    `;
    
    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #e1e8ed; padding-bottom: 12px;">
            <h2 style="margin: 0; font-size: 20px; color: #2c3e50;">${productName}</h2>
            <button onclick="this.closest('.product-info-modal').remove()" style="
                background: #ef4444;
                color: white;
                border: none;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                font-size: 22px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">×</button>
        </div>
    `;
    
    if (description) {
        // Если описание содержит HTML (например, предупреждение), вставляем как есть, иначе как параграф
        if (description.includes('<div') || description.includes('<strong')) {
            html += description;
        } else {
            html += `<p style="font-size: 15px; color: #4a5568; margin-bottom: 15px; line-height: 1.5;">${description}</p>`;
        }
    }
    
    // Галерея фото
    if (photos && photos.length > 0) {
        // Сохраняем массив фото в глобальную переменную для доступа из onclick
        const photosArrayId = `product_photos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        window[photosArrayId] = photos;
        
        html += `<div style="margin-top: 20px;">
            <h3 style="font-size: 18px; font-weight: 600; color: #2c3e50; margin-bottom: 12px;">📸 Фото</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">`;
        
        photos.forEach((photo, index) => {
            const filename = `${productName.replace(/\s+/g, '_')}_${index + 1}.jpg`;
            html += `
                <div style="position: relative; cursor: pointer; border-radius: 8px; overflow: hidden; border: 2px solid #e1e8ed; transition: all 0.2s;" 
                     onmouseover="this.style.borderColor='#48bb78'; this.style.transform='scale(1.02)'" 
                     onmouseout="this.style.borderColor='#e1e8ed'; this.style.transform='scale(1)'"
                     onclick="openImageModalWithGallery(window['${photosArrayId}'], ${index})">
                    <img src="${photo}" alt="${productName} ${index + 1}" 
                         style="width: 100%; height: 180px; object-fit: cover; display: block;">
                    <button onclick="event.stopPropagation(); downloadBedImage('${photo}', '${filename}');" style="
                        position: absolute;
                        top: 6px;
                        right: 6px;
                        background: rgba(0, 0, 0, 0.3);
                        border: none;
                        border-radius: 4px;
                        padding: 4px 6px;
                        cursor: pointer;
                        font-size: 14px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 28px;
                        height: 28px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                        transition: all 0.2s;
                        color: white;
                    " onmouseover="this.style.background='rgba(0, 0, 0, 0.5)'; this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(0, 0, 0, 0.3)'; this.style.transform='scale(1)'">
                        <span>📥</span>
                    </button>
                </div>
            `;
        });
        
        html += `</div></div>`;
        
        // Очищаем глобальную переменную при закрытии модального окна
        const cleanupHandler = function(e) {
            if (e.target === modal || e.target.closest('button[onclick*="closest"]')) {
                setTimeout(() => {
                    if (window[photosArrayId]) {
                        delete window[photosArrayId];
                    }
                }, 1000);
            }
        };
        modal.addEventListener('click', cleanupHandler);
    }
    
    // Видео (если есть)
    if (video) {
        html += `<div style="text-align: center; margin-top: 20px; padding: 15px; background: #f7fafc; border-radius: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h4 style="font-size: 16px; font-weight: 600; color: #2c3e50; margin: 0;">🎥 Видео</h4>
                <button onclick="downloadVideo('${video}', '${productName.replace(/\s+/g, '_')}.mp4');" style="
                    background: rgba(0, 0, 0, 0.3);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 4px 8px;
                    cursor: pointer;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    transition: all 0.2s;
                " onmouseover="this.style.background='rgba(0, 0, 0, 0.5)'; this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(0, 0, 0, 0.3)'; this.style.transform='scale(1)'">
                    <span>📥</span>
                </button>
            </div>
            <video controls style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <source src="${video}" type="video/mp4">
                Ваш браузер не поддерживает видео.
            </video>
        </div>`;
    }
    
    modalContent.innerHTML = html;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Закрытие по клику на фон
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Закрытие по Escape
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

window.showProductInfo = showProductInfo;

// ==================== ФУНКЦИИ ДЛЯ ПОДАРКОВ ====================

/**
 * Проверяет, занят ли слот подарка из-за выбора "Автоматической форточки" в предыдущих слотах
 * @param {number} giftNumber - Номер подарка (1, 2, 3)
 * @param {Object} selectedGifts - Объект с уже выбранными подарками
 * @returns {boolean} true, если слот занят
 */
function isGiftSlotOccupied(giftNumber, selectedGifts) {
    // Если выбран window-auto в подарке 1, то подарок 2 занят
    if (giftNumber === 2 && selectedGifts['gift-1'] === 'window-auto') {
        return true;
    }
    // Если выбран window-auto в подарке 2, то подарок 3 занят
    if (giftNumber === 3 && selectedGifts['gift-2'] === 'window-auto') {
        return true;
    }
    return false;
}

/**
 * Получает доступные варианты для подарка на основе уже выбранных подарков
 * @param {number} giftNumber - Номер подарка (1, 2, 3)
 * @param {Object} selectedGifts - Объект с уже выбранными подарками
 * @param {boolean} hasAdditionalWindow - Есть ли дополнительная форточка (купленная или в подарке)
 * @param {number} availableGifts - Количество доступных подарков (1, 2 или 3)
 * @returns {Array} Массив вариантов подарков
 */
function getGiftOptions(giftNumber, selectedGifts, hasAdditionalWindow, availableGifts = 3) {
    const options = [];
    
    // Всегда добавляем опцию "Без подарка"
    options.push({ value: '', text: 'Без подарка' });
    
    // Проверяем, выбрана ли форточка в ДРУГИХ подарках (не в текущем)
    const otherGifts = Object.entries(selectedGifts).filter(([key, value]) => key !== `gift-${giftNumber}`);
    const hasWindowInOtherGifts = otherGifts.some(([key, value]) => 
        value === 'window' || value === 'window-auto');
    
    // Проверяем, есть ли форточка (купленная или в любом подарке)
    const hasWindow = hasAdditionalWindow || hasWindowInOtherGifts || 
                     selectedGifts[`gift-${giftNumber}`] === 'window' ||
                     selectedGifts[`gift-${giftNumber}`] === 'window-auto';
    
    if (giftNumber === 1) {
        // Первый слот (slot-model): базовые опции + window-auto если хватает 2 слотов
        options.push({ value: 'window', text: 'Дополнительная форточка' });
        options.push({ value: 'drip-mech', text: 'Капельный полив механический' });
        options.push({ value: 'stakes-4', text: '4 грунтозацепа' });
        if (availableGifts >= 2) {
            options.push({ value: 'window-auto', text: 'Автоматическая форточка (форточка + автомат)' });
        }
    } else if (giftNumber === 2) {
        // Второй слот (slot-model): те же базовые опции
        options.push({ value: 'window', text: 'Дополнительная форточка' });
        options.push({ value: 'drip-mech', text: 'Капельный полив механический' });
        options.push({ value: 'stakes-4', text: '4 грунтозацепа' });
        const hasAutomationInOtherGifts = otherGifts.some(([key, value]) => value === 'window-automation' || value === 'window-auto');
        if (hasWindow && !hasAutomationInOtherGifts) {
            options.push({ value: 'window-automation', text: 'Автомат для форточки' });
        }
        // window-auto: доступен только если есть 2 свободных слота (2 и 3)
        if (availableGifts >= 3 && selectedGifts['gift-1'] !== 'window-auto') {
            options.push({ value: 'window-auto', text: 'Автоматическая форточка (форточка + автомат)' });
        }
    } else if (giftNumber === 3) {
        // Третий слот (slot-model): те же базовые опции, что в 1 и 2
        options.push({ value: 'window', text: 'Дополнительная форточка' });
        options.push({ value: 'drip-mech', text: 'Капельный полив механический' });
        options.push({ value: 'stakes-4', text: '4 грунтозацепа' });
        // Автомат только от 55k и только при наличии форточки
        const hasAutomationInOtherGifts = otherGifts.some(([key, value]) => value === 'window-automation' || value === 'window-auto');
        if (hasWindow && !hasAutomationInOtherGifts) {
            options.push({ value: 'window-automation', text: 'Автомат для форточки' });
        }
        // window-auto в слоте 3 недоступен — занимает 2 слота, слота 4 нет
    }
    
    return options;
}

/**
 * Обновляет блок подарков на основе итоговой суммы заказа
 * @param {number} totalPrice - Итоговая сумма заказа
 * @param {Object} overrideSelectedGifts - Опционально: переопределить выбранные подарки (для немедленного обновления)
 */
function updateGiftsBlock(totalPrice, overrideSelectedGifts = null) {
    const giftsBlock = document.getElementById('gifts-block');
    const giftsInfo = document.getElementById('gifts-info');
    const giftsSelection = document.getElementById('gifts-selection');
    
    if (!giftsBlock || !giftsInfo || !giftsSelection) {
        return;
    }
    
    // Определяем количество доступных подарков
    const availableGifts = getGiftSlotsByTotal(totalPrice);
    const giftTier = availableGifts === 3 ? 'от 75 000 рублей' : availableGifts === 2 ? 'от 55 000 рублей' : availableGifts === 1 ? 'от 35 000 рублей' : '';
    
    // Если подарков нет, скрываем блок
    if (availableGifts === 0) {
        giftsBlock.style.display = 'none';
        return;
    }
    
    // Показываем блок
    giftsBlock.style.display = 'block';
    
    // Обновляем информацию
    giftsInfo.innerHTML = `
        <strong>Вам доступно ${availableGifts} ${availableGifts === 1 ? 'подарок' : availableGifts === 2 ? 'подарка' : 'подарков'}</strong> (${giftTier})
    `;
    
    // ИСПРАВЛЕНО: Упрощены источники данных - используем ТОЛЬКО DOM как источник истины
    // Если передан overrideSelectedGifts, используем его, иначе читаем из DOM
    let finalSelectedGifts = {};
    
    if (overrideSelectedGifts) {
        // Если передан overrideSelectedGifts, используем его
        finalSelectedGifts = { ...overrideSelectedGifts };
    } else {
        // Иначе читаем ТОЛЬКО из DOM (самый надежный источник)
    const existingSelects = document.querySelectorAll('.gift-select');
    existingSelects.forEach(select => {
        const giftItem = select.closest('.gift-item');
        // Сохраняем только видимые элементы с непустыми значениями
        if (giftItem) {
            const computedStyle = window.getComputedStyle(giftItem);
            if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
                if (select.value && select.value.trim() !== '') {
                        finalSelectedGifts[select.id] = select.value;
                }
            }
        }
    });
    
        // Если в DOM ничего не найдено, пробуем localStorage (только для восстановления между сессиями)
        if (Object.keys(finalSelectedGifts).length === 0) {
            const savedGifts = JSON.parse(localStorage.getItem('selectedGifts') || '{}');
            finalSelectedGifts = { ...savedGifts };
        }
    }
    
    // Очищаем подарки, которые больше не доступны (если количество подарков уменьшилось)
    for (let i = availableGifts + 1; i <= 3; i++) {
        delete finalSelectedGifts[`gift-${i}`];
    }
    
    // Также очищаем пустые значения (если пользователь выбрал "Без подарка")
    Object.keys(finalSelectedGifts).forEach(key => {
        if (!finalSelectedGifts[key] || finalSelectedGifts[key].trim() === '') {
            delete finalSelectedGifts[key];
        }
    });
    
    // Проверяем, есть ли дополнительная форточка (купленная или в подарке)
    const additionalWindowQty = parseInt(document.getElementById('additional-window-qty')?.value || '0', 10);
    // Проверяем, выбрана ли форточка в ЛЮБОМ подарке (включая автоматическую форточку)
    const hasWindowInGifts = Object.values(finalSelectedGifts).includes('window') || 
                             Object.values(finalSelectedGifts).includes('window-auto');
    const hasAdditionalWindow = additionalWindowQty > 0 || hasWindowInGifts;
    
    // ВАЖНО: ВСЕГДА полностью пересоздаем блок, чтобы избежать проблем с остатками старых элементов
    // Это гарантирует, что блок всегда соответствует текущему состоянию
    giftsSelection.innerHTML = '';
    
    // Теперь создаем элементы для каждого доступного подарка
    for (let i = 1; i <= availableGifts; i++) {
        // Проверяем, занят ли этот слот из-за выбора "Автоматической форточки" в предыдущем слоте
        if (isGiftSlotOccupied(i, finalSelectedGifts)) {
            continue; // Слот занят - не создаем
        }
        
        const giftItem = document.createElement('div');
        giftItem.className = 'gift-item';
        
        const giftSelect = document.createElement('select');
        giftSelect.id = `gift-${i}`;
        giftSelect.className = 'gift-select';
        
        // Получаем варианты для этого подарка
        const giftOptions = getGiftOptions(i, finalSelectedGifts, hasAdditionalWindow, availableGifts);
        
        // Заполняем select
        giftOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            giftSelect.appendChild(optionElement);
        });
        
        // Восстанавливаем выбранное значение (из finalSelectedGifts)
        if (finalSelectedGifts[`gift-${i}`]) {
            const selectedValue = finalSelectedGifts[`gift-${i}`];
            if (giftSelect.querySelector(`option[value="${selectedValue}"]`)) {
                giftSelect.value = selectedValue;
            }
        }
        
        // Устанавливаем обработчик ПОСЛЕ заполнения опций и восстановления значения
        giftSelect.onchange = () => {
            onGiftChange();
        };
        
        // Создаем структуру
        const giftLabel = document.createElement('div');
        giftLabel.className = 'gift-label';
        
        const giftName = document.createElement('span');
        giftName.className = 'gift-name';
        giftName.textContent = `Подарок ${i}`;
        
        giftLabel.appendChild(giftSelect);
        giftLabel.appendChild(giftName);
        giftItem.appendChild(giftLabel);
        
        giftsSelection.appendChild(giftItem);
    }
    
    // Сохраняем финальные выбранные подарки в localStorage (для восстановления между сессиями)
        localStorage.setItem('selectedGifts', JSON.stringify(finalSelectedGifts));
}

/**
 * ПЕРЕСОБИРАЕТ короткое КП из частей с правильными подарками
 * НОВЫЙ ПОДХОД: вместо удаления/вставки через regex пересобираем КП заново
 * Это надежнее и предотвращает "галлюцинации" при разных комбинациях подарков
 */
function rebuildShortOfferWithGifts(overrideSelectedGifts = null) {
    const shortOfferTextarea = document.getElementById("commercial-offer-short");
    if (!shortOfferTextarea || !shortOfferTextarea.value || shortOfferTextarea.value.trim() === '' || 
        shortOfferTextarea.value.includes("Здесь будет ваше")) {
        return; // Если КП еще не сгенерировано, ничего не делаем
    }
    
    // Читаем текущее КП и разбираем его на части
    let currentOffer = shortOfferTextarea.value;
    
    // ИСПРАВЛЕНО: Удаляем ВСЕ старые блоки подарков перед пересборкой
    // Это устраняет дублирование и "галлюцинации"
    // Удаляем все возможные варианты блока подарков (с любым склонением)
    currentOffer = currentOffer.replace(/\n🎁 Подарок[аи]?[к]?:[\s\S]*?(?=\n+Ближайшая дата доставки|\n+💳|$)/g, '');
    // Также удаляем одиночные строки с 🎁
    currentOffer = currentOffer.replace(/\n🎁[^\n]*\n/g, '');
    // Удаляем множественные пустые строки
    currentOffer = currentOffer.replace(/\n{3,}/g, '\n\n');
    
    // ИСПРАВЛЕНО: Более надежное извлечение частей КП
    // Ищем "Бесплатная заморозка стоимости." - это всегда есть в коротком КП
    const warrantyMatch = currentOffer.match(/Бесплатная заморозка стоимости\./);
    if (!warrantyMatch) {
        // Если не найдено, пробуем найти через "Гарантия 15 лет"
        const guaranteeMatch = currentOffer.match(/Гарантия 15 лет\./);
        if (!guaranteeMatch) {
            return; // Если структура КП неожиданная, не трогаем
        }
        // Используем гарантию как маркер
        const beforeGifts = currentOffer.substring(0, guaranteeMatch.index + guaranteeMatch[0].length);
        const afterGuarantee = currentOffer.substring(guaranteeMatch.index + guaranteeMatch[0].length);
        
        const deliveryMatch = afterGuarantee.match(/Ближайшая дата доставки[^\n]*/);
        let datePart = '';
        if (deliveryMatch) {
            datePart = '\n' + deliveryMatch[0].trim();
            if (!datePart.endsWith('.')) datePart += '.';
        } else {
            const withAssemblyRebuild = !!document.getElementById('assembly')?.checked;
            const dtShort = getDeliveryDateTextForKP(withAssemblyRebuild);
            datePart = dtShort ? '\nБлижайшая дата доставки — ' + dtShort + '.' : '';
        }
        
        // Получаем текст подарков
    let giftsText = '';
    if (overrideSelectedGifts && Object.keys(overrideSelectedGifts).length > 0) {
        giftsText = getGiftsTextFromObject(overrideSelectedGifts);
    } else {
        giftsText = getGiftsText();
    }
    
        // Пересобираем КП: до условий + условия + отступ + подарки (если есть) + отступ + дата
        let newOffer = beforeGifts;
        if (giftsText && giftsText.trim() !== '') {
            // ИСПРАВЛЕНО: Подарки вставляются с одним отступом (пустая строка перед блоком)
            newOffer += '\n' + giftsText.trimStart() + '\n';
        }
        newOffer += datePart;
        shortOfferTextarea.value = newOffer;
        updateCharCounter('commercial-offer-short');
        updateClientOfferFromShort();
        return;
    }
    
    // Часть до условий оплаты (включая "Бесплатная заморозка стоимости.")
    const beforeGifts = currentOffer.substring(0, warrantyMatch.index + warrantyMatch[0].length);
    
    // Часть после условий оплаты (ищем дату доставки, пропуская возможные подарки)
    const afterWarranty = currentOffer.substring(warrantyMatch.index + warrantyMatch[0].length);
    
    // Ищем дату доставки, пропуская возможный блок подарков
    let datePart = '';
    const deliveryMatch = afterWarranty.match(/Ближайшая дата доставки[^\n]*/);
    if (deliveryMatch) {
        datePart = '\n' + deliveryMatch[0].trim();
        if (!datePart.endsWith('.')) datePart += '.';
    } else {
        const withAssemblyRebuild2 = !!document.getElementById('assembly')?.checked;
        const dateTextShort = getDeliveryDateTextForKP(withAssemblyRebuild2);
        datePart = dateTextShort ? '\nБлижайшая дата доставки — ' + dateTextShort + '.' : '';
    }
    
    // Получаем текст подарков
    let giftsText = '';
    if (overrideSelectedGifts && Object.keys(overrideSelectedGifts).length > 0) {
        giftsText = getGiftsTextFromObject(overrideSelectedGifts);
    } else {
        giftsText = getGiftsText();
    }
    
    // Пересобираем КП: до условий + условия + отступ + подарки (если есть) + отступ + дата
    let newOffer = beforeGifts;
    if (giftsText && giftsText.trim() !== '') {
        // Подарки вставляются с отступами: пустая строка перед и после блока подарков
        newOffer += '\n\n' + giftsText.trimStart() + '\n';
    }
    newOffer += datePart;
    
    shortOfferTextarea.value = newOffer;
    updateCharCounter('commercial-offer-short');
    updateClientOfferFromShort();
}

/**
 * ПЕРЕСОБИРАЕТ длинное КП из частей с правильными подарками
 * НОВЫЙ ПОДХОД: вместо удаления/вставки через regex пересобираем КП заново
 */
function rebuildLongOfferWithGifts(overrideSelectedGifts = null) {
    const longOfferTextarea = document.getElementById("commercial-offer");
    if (!longOfferTextarea || !longOfferTextarea.value || 
        longOfferTextarea.value.includes("Здесь будет ваше")) {
        return;
    }
    
    let currentOffer = longOfferTextarea.value;
    
    // Удаление всех старых блоков подарков для предотвращения дублирования
    // Применяем несколько итераций для полной очистки всех вариантов форматирования
    let previousLength = currentOffer.length;
    let iterations = 0;
    const MAX_ITERATIONS = 10; // Защита от бесконечного цикла
    while (iterations < MAX_ITERATIONS) {
        const newOffer = currentOffer.replace(/\n🎁 Подарок[аи]?[к]?:[\s\S]*?(?=\n💳 Без предоплаты|\n🌱 Бесплатное хранение|\n⏳ Предложение|$)/gm, '')
            .replace(/\n🎁[^\n]*\n/g, '')
            .replace(/🎁 Подарок[аи]?[к]?:[\s\S]*?(?=\n💳|\n🌱|\n⏳|$)/gm, '')
            .replace(/🎁[^\n]*/g, '');
        
        if (newOffer.length === previousLength) {
            break; // Больше ничего не удаляется
        }
        currentOffer = newOffer;
        previousLength = newOffer.length;
        iterations++;
    }
    
    // Не удаляем строки по названиям товаров (Дополнительная форточка и т.д.) — это могут быть
    // платные допы из состава. Чистим только блоки с 🎁 (выше).
    
    // Удаляем множественные пустые строки
    currentOffer = currentOffer.replace(/\n{3,}/g, '\n\n');
    
    // Получаем текст подарков
    let giftsText = '';
    if (overrideSelectedGifts && Object.keys(overrideSelectedGifts).length > 0) {
        giftsText = getGiftsTextFromObject(overrideSelectedGifts);
            } else {
        giftsText = getGiftsText();
    }
    
    // Если подарков нет, просто возвращаем КП как есть
    if (!giftsText || giftsText.trim() === '') {
        longOfferTextarea.value = currentOffer;
        return;
    }
    
    // ИСПРАВЛЕНО: Добавляем подарки перед КАЖДЫМ блоком условий оплаты
    // Находим все блоки условий оплаты
    const paymentMatches = [...currentOffer.matchAll(/\n💳 Без предоплаты/g)];
    if (paymentMatches.length === 0) {
        return; // Если структура неожиданная, не трогаем
    }
    
    // Собираем новое КП, добавляя подарки перед каждым блоком условий оплаты
    let newOffer = '';
    let lastIndex = 0;
    
    paymentMatches.forEach((match, index) => {
        // Добавляем часть до блока условий оплаты
        newOffer += currentOffer.substring(lastIndex, match.index);
        
        // Добавляем подарки перед блоком условий оплаты (с одним отступом)
        newOffer += '\n' + giftsText.trimStart() + '\n';
        
        // Находим конец блока условий оплаты (до следующего блока или до конца)
        const nextMatch = paymentMatches[index + 1];
        const endIndex = nextMatch ? nextMatch.index : currentOffer.length;
        
        // Добавляем блок условий оплаты
        newOffer += currentOffer.substring(match.index, endIndex);
        
        lastIndex = endIndex;
    });
    
    // Добавляем оставшуюся часть (если есть)
    if (lastIndex < currentOffer.length) {
        newOffer += currentOffer.substring(lastIndex);
    }
    
    longOfferTextarea.value = newOffer;
    updateCharCounter('commercial-offer');
}

/**
 * Обновляет коммерческие предложения (короткое и длинное КП) с текущими подарками
 * НОВЫЙ ПОДХОД: пересборка КП из частей вместо regex манипуляций
 * @param {Object} overrideSelectedGifts - Опционально: переопределить выбранные подарки
 */
function updateCommercialOffersWithGifts(overrideSelectedGifts = null) {
    // Используем новый подход - пересборка КП из частей
    rebuildShortOfferWithGifts(overrideSelectedGifts);
    rebuildLongOfferWithGifts(overrideSelectedGifts);
}

/**
 * Обработчик изменения выбора подарка
 */
function onGiftChange() {
    // ВАЖНО: Сначала сохраняем выбранные подарки в localStorage (только непустые значения)
    // Это нужно сделать ДО обновления блока подарков, чтобы getGiftsText() мог прочитать актуальные значения
    const selectedGifts = {};
    const giftSelects = document.querySelectorAll('.gift-select');
    giftSelects.forEach(select => {
        // Проверяем, что элемент видим (родительский .gift-item не скрыт)
        const giftItem = select.closest('.gift-item');
        if (giftItem) {
            const computedStyle = window.getComputedStyle(giftItem);
            if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
                return; // Пропускаем скрытые элементы
            }
        }
        
        // Сохраняем только если значение выбрано (не пустое)
        if (select.value && select.value.trim() !== '') {
            selectedGifts[select.id] = select.value;
        } else {
            // Если значение пустое, удаляем из selectedGifts (если было)
            delete selectedGifts[select.id];
        }
    });
    
    // ИСПРАВЛЕНО: Автоматическое объединение форточки + автомат в автоматическую форточку
    // Если выбраны форточка и автомат в разных слотах - объединяем их в автоматическую форточку
    const hasWindow = Object.values(selectedGifts).includes('window');
    const hasAutomation = Object.values(selectedGifts).includes('window-automation');
    
    if (hasWindow && hasAutomation) {
        // Находим слот с форточкой
        const windowSlot = Object.keys(selectedGifts).find(key => selectedGifts[key] === 'window');
        if (windowSlot) {
            // Заменяем форточку на автоматическую форточку
            selectedGifts[windowSlot] = 'window-auto';
            // Удаляем автомат из другого слота
            const automationSlot = Object.keys(selectedGifts).find(key => selectedGifts[key] === 'window-automation');
            if (automationSlot) {
                delete selectedGifts[automationSlot];
                // Очищаем значение в DOM
                const automationSelect = document.getElementById(automationSlot);
                if (automationSelect) {
                    automationSelect.value = '';
                }
            }
            // Обновляем значение в DOM
            const windowSelect = document.getElementById(windowSlot);
            if (windowSelect) {
                windowSelect.value = 'window-auto';
            }
        }
    }
    
    // Сохраняем в localStorage сразу
    localStorage.setItem('selectedGifts', JSON.stringify(selectedGifts));
    
    // ВАЖНО: Сначала скрываем/показываем элементы напрямую через DOM для мгновенной реакции
    const gift2Item = document.querySelector('.gift-item:has(#gift-2)') || 
                     Array.from(document.querySelectorAll('.gift-item')).find(item => item.querySelector('#gift-2'));
    const gift3Item = document.querySelector('.gift-item:has(#gift-3)') || 
                     Array.from(document.querySelectorAll('.gift-item')).find(item => item.querySelector('#gift-3'));
    
    // ИСПРАВЛЕНО: Если выбрана "Автоматическая форточка" в подарке 1, скрываем подарок 2, НО НЕ удаляем его значение
    // Это предотвращает сброс подарка при скрытии слота
    if (selectedGifts['gift-1'] === 'window-auto') {
        // НЕ удаляем gift-2 из selectedGifts - сохраняем его значение
        // Скрываем элемент напрямую через DOM
        if (gift2Item) {
            gift2Item.style.display = 'none';
        }
    } else {
        // Если "Автоматическая форточка" не выбрана в подарке 1, показываем подарок 2 (если он должен быть доступен)
        const availableGifts = getGiftSlotsByTotal(lastCalculatedPrice);
        // Показываем подарок 2 только если доступно 2+ подарка
        if (availableGifts >= 2 && gift2Item) {
            gift2Item.style.display = '';
        }
    }
    
    // ИСПРАВЛЕНО: Если выбрана "Автоматическая форточка" в подарке 2, скрываем подарок 3, НО НЕ удаляем его значение
    if (selectedGifts['gift-2'] === 'window-auto') {
        // НЕ удаляем gift-3 из selectedGifts - сохраняем его значение
        // Скрываем элемент напрямую через DOM
        if (gift3Item) {
            gift3Item.style.display = 'none';
        }
    } else {
        // Если "Автоматическая форточка" не выбрана в подарке 2, показываем подарок 3 (если он должен быть доступен)
        const availableGifts = getGiftSlotsByTotal(lastCalculatedPrice);
        // Показываем подарок 3 только если:
        // 1. Доступно 3 подарка
        // 2. Подарок 1 НЕ занял 2 слота (не выбрана window-auto в подарке 1)
        // 3. Подарок 2 НЕ занял 2 слота (не выбрана window-auto в подарке 2)
        if (availableGifts >= 3 && 
            selectedGifts['gift-1'] !== 'window-auto' && 
            selectedGifts['gift-2'] !== 'window-auto' && 
            gift3Item) {
            gift3Item.style.display = '';
        }
    }
    
    // Сохраняем обновленные подарки в localStorage
    localStorage.setItem('selectedGifts', JSON.stringify(selectedGifts));
    
    // Если выбран автомат для форточки, но нет доп форточки - предупреждаем
    const hasWindowAutomation = Object.values(selectedGifts).includes('window-automation');
    const additionalWindowQty = parseInt(document.getElementById('additional-window-qty')?.value || '0', 10);
    const hasWindowInGifts = Object.values(selectedGifts).includes('window') || 
                            Object.values(selectedGifts).includes('window-auto');
    
    if (hasWindowAutomation && additionalWindowQty === 0 && !hasWindowInGifts) {
        showWarning('Автомат для форточки можно установить только на дополнительную форточку. Выберите дополнительную форточку в подарках или купите её.');
    }
    
    // Получаем текущую итоговую сумму для обновления блока подарков. Если в корзине есть позиции — всегда от «Итого к оплате» (чтобы порог не скакал).
    let totalPrice = (typeof orderCart !== 'undefined' && orderCart.length > 0 && typeof getOrderCartTotal === 'function') ? getOrderCartTotal() : lastCalculatedPrice;
    
    // Если цена не найдена, пытаемся получить из предварительного расчета
    if (isNaN(totalPrice) || totalPrice === 0) {
        // Вызываем предварительный расчет для получения суммы
        if (typeof updateGiftsBlockPreview === 'function') {
            updateGiftsBlockPreview();
            return; // updateGiftsBlockPreview сам вызовет calculateGreenhouseCost
        }
    }
    
    // ИСПРАВЛЕНО: Правильная последовательность обновлений
    // 1. Сначала обновляем блок подарков (пересоздаем DOM с правильными опциями)
    if (totalPrice > 0) {
        updateGiftsBlock(totalPrice, selectedGifts);
    }
    
    // 2. Затем обновляем КП с подарками (один раз, в конце)
    // Используем selectedGifts, которые уже сохранены в localStorage
            updateCommercialOffersWithGifts(selectedGifts);

    // 3. Обновляем отображение подарков в составе заказа слева (order-gifts-display)
    if (typeof updateOrderTotalDisplay_ === 'function') updateOrderTotalDisplay_();
}

/**
 * Обработчик изменения количества дополнительной форточки
 * Обновляет блок подарков, если изменилась возможность выбрать автомат
 */
function onAdditionalWindowChange() {
    var total = (typeof orderCart !== 'undefined' && orderCart.length > 0 && typeof getOrderCartTotal === 'function') ? getOrderCartTotal() : lastCalculatedPrice;
    if (total > 0) updateGiftsBlock(total);
}

/**
 * Получает текст подарков для КП из объекта selectedGifts
 * @param {Object} selectedGifts - Объект с выбранными подарками { 'gift-1': 'window', 'gift-2': 'stakes-4', ... }
 * @returns {string} Текст с информацией о подарках
 */
function getGiftsTextFromObject(selectedGifts) {
    if (!selectedGifts || Object.keys(selectedGifts).length === 0) {
        return '';
    }
    
    // Используем Map для подсчета количества каждого подарка
    const giftCounts = new Map();
    
    // Проходим по всем выбранным подаркам и считаем количество каждого
    Object.keys(selectedGifts).forEach(giftId => {
        const giftValue = selectedGifts[giftId];
        
        // Пропускаем пустые значения
        if (!giftValue || giftValue.trim() === '' || !GIFT_NAMES[giftValue]) {
            return;
        }
        
        // ИСПРАВЛЕНО: Пропускаем подарки, которые скрыты из-за автоматической форточки
        // Если выбран window-auto в подарке 1, пропускаем gift-2 (слот занят)
        if (selectedGifts['gift-1'] === 'window-auto' && giftId === 'gift-2') {
            return;
        }
        // Если выбран window-auto в подарке 2, пропускаем gift-3 (слот занят)
        if (selectedGifts['gift-2'] === 'window-auto' && giftId === 'gift-3') {
            return;
        }
        
        // Увеличиваем счетчик для этого подарка
        const giftName = GIFT_NAMES[giftValue];
        giftCounts.set(giftName, (giftCounts.get(giftName) || 0) + 1);
    });
    
    if (giftCounts.size === 0) {
        return '';
    }
    
    // ИСПРАВЛЕНО: Формируем список подарков в одну строку через запятую
    // Для всех подарков суммируем количество с правильным склонением
    const giftsList = [];
    giftCounts.forEach((count, giftName) => {
        if (count === 1) {
            // Если выбран один раз - просто название
            giftsList.push(giftName);
        } else {
            // Если выбрано несколько раз - суммируем с правильным склонением
            let pluralForm = '';
            
            if (giftName === '4 грунтозацепа') {
                // Специальная обработка для грунтозацепов - умножаем на 4
                const totalStakes = count * 4;
                let stakesWord = 'грунтозацепов';
                if (totalStakes === 1) {
                    stakesWord = 'грунтозацеп';
                } else if (totalStakes >= 2 && totalStakes <= 4) {
                    stakesWord = 'грунтозацепа';
                }
                pluralForm = `${totalStakes} ${stakesWord}`;
            } else if (giftName === 'дополнительная форточка') {
                // 2-4: дополнительные форточки, 5+: дополнительных форточек
                if (count >= 2 && count <= 4) {
                    pluralForm = `${count} дополнительные форточки`;
                } else {
                    pluralForm = `${count} дополнительных форточек`;
                }
            } else if (giftName === 'капельный полив механический') {
                // 2-4: капельных полива механических, 5+: капельных поливов механических
                if (count >= 2 && count <= 4) {
                    pluralForm = `${count} капельных полива механических`;
                } else {
                    pluralForm = `${count} капельных поливов механических`;
                }
            } else if (giftName === 'автомат для форточки') {
                // 2-4: автомата для форточки, 5+: автоматов для форточки
                if (count >= 2 && count <= 4) {
                    pluralForm = `${count} автомата для форточки`;
                } else {
                    pluralForm = `${count} автоматов для форточки`;
                }
            } else if (giftName === 'автоматическая форточка (форточка + автомат)') {
                // 2-4: автоматические форточки, 5+: автоматических форточек
                if (count >= 2 && count <= 4) {
                    pluralForm = `${count} автоматические форточки (форточка + автомат)`;
                } else {
                    pluralForm = `${count} автоматических форточек (форточка + автомат)`;
                }
            } else {
                // Для неизвестных подарков - просто количество
                pluralForm = `${count} ${giftName}`;
            }
            
            giftsList.push(pluralForm);
        }
    });
    
    // ИСПРАВЛЕНО: Упрощенное склонение - всегда "Подарки:" кроме 1 подарка
    const uniqueGiftsCount = giftCounts.size;
    const giftsWord = uniqueGiftsCount === 1 ? 'Подарок' : 'Подарки';
    
    // Форматируем в одну строку через запятую
    return `\n🎁 ${giftsWord}: ${giftsList.join(', ')}`;
}

/**
 * Получает текст подарков для заказа/отображения.
 * Использует localStorage как основной источник (обновляется при каждом onGiftChange),
 * чтобы 3-й слот и др. не терялись при скрытой форме.
 * @returns {string} Текст с префиксом "🎁 Подарки: ..."
 */
function getGiftsTextForOrder() {
    var saved = {};
    try {
        saved = JSON.parse(localStorage.getItem('selectedGifts') || '{}');
    } catch (e) {}
    if (saved && Object.keys(saved).length > 0 && typeof getGiftsTextFromObject === 'function') {
        var fromStorage = getGiftsTextFromObject(saved);
        if (fromStorage && fromStorage.trim()) return fromStorage.trim();
    }
    return (typeof getGiftsText === 'function' ? getGiftsText() : '') || '';
}

/**
 * Получает текст подарков для КП из DOM элементов
 * @returns {string} Текст с информацией о подарках
 */
function getGiftsText() {
    // Читаем выбранные подарки из видимых DOM элементов (более надежно, чем localStorage)
    const giftSelects = document.querySelectorAll('.gift-select');
    
    if (giftSelects.length === 0) {
        return '';
    }
    
    // Используем Map для подсчета количества каждого подарка
    const giftCounts = new Map();
    
    // Используем ID элемента для правильной нумерации (gift-1, gift-2, gift-3)
    // Проверяем только видимые элементы (не скрытые через display: none) и с непустыми значениями
    giftSelects.forEach(select => {
        // Проверяем, что элемент видим (родительский .gift-item не скрыт)
        const giftItem = select.closest('.gift-item');
        if (!giftItem) {
            return; // Пропускаем элементы без родителя
        }
        
        // Проверяем видимость через computed style
        const computedStyle = window.getComputedStyle(giftItem);
        if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
            return; // Пропускаем скрытые элементы
        }
        
        // Проверяем, что значение не пустое и есть в списке подарков
        const giftValue = select.value ? select.value.trim() : '';
        if (!giftValue || !GIFT_NAMES[giftValue]) {
            return; // Пропускаем пустые значения и неизвестные подарки
        }
        
        // Увеличиваем счетчик для этого подарка
        const giftName = GIFT_NAMES[giftValue];
        giftCounts.set(giftName, (giftCounts.get(giftName) || 0) + 1);
    });
    
    if (giftCounts.size === 0) {
        return '';
    }
    
    // ИСПРАВЛЕНО: Формируем список подарков в одну строку через запятую
    // Для всех подарков суммируем количество с правильным склонением
    const giftsList = [];
    giftCounts.forEach((count, giftName) => {
        if (count === 1) {
            // Если выбран один раз - просто название
            giftsList.push(giftName);
        } else {
            // Если выбрано несколько раз - суммируем с правильным склонением
            let pluralForm = '';
            
            if (giftName === '4 грунтозацепа') {
                // Специальная обработка для грунтозацепов - умножаем на 4
                const totalStakes = count * 4;
                let stakesWord = 'грунтозацепов';
                if (totalStakes === 1) {
                    stakesWord = 'грунтозацеп';
                } else if (totalStakes >= 2 && totalStakes <= 4) {
                    stakesWord = 'грунтозацепа';
                }
                pluralForm = `${totalStakes} ${stakesWord}`;
            } else if (giftName === 'дополнительная форточка') {
                // 2-4: дополнительные форточки, 5+: дополнительных форточек
                if (count >= 2 && count <= 4) {
                    pluralForm = `${count} дополнительные форточки`;
                } else {
                    pluralForm = `${count} дополнительных форточек`;
                }
            } else if (giftName === 'капельный полив механический') {
                // 2-4: капельных полива механических, 5+: капельных поливов механических
                if (count >= 2 && count <= 4) {
                    pluralForm = `${count} капельных полива механических`;
                } else {
                    pluralForm = `${count} капельных поливов механических`;
                }
            } else if (giftName === 'автомат для форточки') {
                // 2-4: автомата для форточки, 5+: автоматов для форточки
                if (count >= 2 && count <= 4) {
                    pluralForm = `${count} автомата для форточки`;
                } else {
                    pluralForm = `${count} автоматов для форточки`;
                }
            } else if (giftName === 'автоматическая форточка (форточка + автомат)') {
                // 2-4: автоматические форточки, 5+: автоматических форточек
                if (count >= 2 && count <= 4) {
                    pluralForm = `${count} автоматические форточки (форточка + автомат)`;
                } else {
                    pluralForm = `${count} автоматических форточек (форточка + автомат)`;
                }
            } else {
                // Для неизвестных подарков - просто количество
                pluralForm = `${count} ${giftName}`;
            }
            
            giftsList.push(pluralForm);
        }
    });
    
    // ИСПРАВЛЕНО: Упрощенное склонение - всегда "Подарки:" кроме 1 подарка
    const uniqueGiftsCount = giftCounts.size;
    const giftsWord = uniqueGiftsCount === 1 ? 'Подарок' : 'Подарки';
    
    // Форматируем в одну строку через запятую
    return `\n🎁 ${giftsWord}: ${giftsList.join(', ')}`;
}

/**
 * Предварительное обновление блока подарков на основе текущих параметров
 * Вызывается при изменении параметров без полного расчета
 */
function updateGiftsBlockPreview() {
    // ВАЖНО: При изменении параметров очищаем старые подарки, чтобы не оставались следы
    localStorage.removeItem('selectedGifts');
    
    // Проверяем, что все основные параметры выбраны
    const city = document.getElementById("city")?.value;
    const form = document.getElementById("form")?.value;
    const width = parseFloat(document.getElementById("width")?.value);
    const length = parseFloat(document.getElementById("length")?.value);
    const frame = document.getElementById("frame")?.value;
    const polycarbonate = document.getElementById("polycarbonate")?.value;
    const arcStep = parseFloat(document.getElementById("arcStep")?.value);
    
    // Если не все параметры выбраны, скрываем блок подарков
    if (!city || !form || isNaN(width) || isNaN(length) || !frame || !polycarbonate || isNaN(arcStep)) {
        const giftsBlock = document.getElementById('gifts-block');
        if (giftsBlock) {
            giftsBlock.style.display = 'none';
        }
        // Очищаем блок подарков полностью
        const giftsSelection = document.getElementById('gifts-selection');
        if (giftsSelection) {
            giftsSelection.innerHTML = '';
        }
        return;
    }
    
    // Пытаемся найти базовую цену в текущих данных
    const selectedEntry = currentCityData.find(item => {
        return (
            getFormCategory(item.form_name) === form &&
            parseFloat(item.width) === width &&
            parseFloat(item.length) === length &&
            normalizeString(item.frame_description.replace(/двойная\s*/gi, "")).includes(normalizeString(frame)) &&
            normalizeString(item.polycarbonate_type) === normalizeString(polycarbonate)
        );
    });
    
    if (!selectedEntry) {
        return;
    }
    
    // Рассчитываем примерную сумму (базовая цена + минимальные доплаты)
    let estimatedPrice = selectedEntry.price;
    
    // Надбавка за arcStep 0.65
    if (arcStep === 0.65) {
        const baseEntry = currentCityData.find(item => {
            return (
                getFormCategory(item.form_name) === form &&
                parseFloat(item.width) === width &&
                parseFloat(item.length) === length &&
                normalizeString(item.frame_description).includes(normalizeString(frame)) &&
                (normalizeString(item.polycarbonate_type) === normalizeString("стандарт4мм") ||
                    normalizeString(item.polycarbonate_type) === normalizeString("стандарт 4мм"))
            );
        });
        if (baseEntry) {
            const basePriceStandard = baseEntry.price;
            const additionalCost = 0.25 * basePriceStandard;
            estimatedPrice += additionalCost;
            estimatedPrice = Math.ceil(estimatedPrice / 10) * 10;
        }
    }
    
    // Обновляем блок подарков с примерной суммой
    updateGiftsBlock(estimatedPrice);
}

/**
 * Показывает модальное окно с информацией о логике подарков
 */
function showGiftsInfoModal() {
    const modal = document.getElementById('gifts-info-modal');
    const modalBody = document.getElementById('gifts-info-modal-body');
    
    if (!modal || !modalBody) {
        showError('Модальное окно с информацией о подарках не найдено');
        return;
    }
    
    // Если модальное окно уже открыто, закрываем его (toggle)
    if (!modal.classList.contains('hidden')) {
        closeGiftsInfoModal();
        return;
    }
    
    modalBody.innerHTML = `
        <h3>📊 Количество подарков по сумме заказа:</h3>
        <ul>
            <li><strong>От 35 000 рублей</strong> — 1 подарок (по умолчанию: дополнительная форточка)</li>
            <li><strong>От 55 000 рублей</strong> — 2 подарка (по умолчанию: форточка + капельный полив)</li>
            <li><strong>От 75 000 рублей</strong> — 3 подарка (по умолчанию: форточка + капельный полив + автомат для форточки)</li>
        </ul>
        
        <h3>🔄 Правила замены подарков:</h3>
        <ul>
            <li><strong>Любой подарок можно заменить на 4 грунтозацепа</strong></li>
            <li><strong>Капельный полив можно заменить на вторую форточку</strong> (при условии соблюдения суммы заказа)</li>
            <li><strong>Максимум 3 подарка</strong> — даже если сумма очень большая, больше 3 подарков не будет</li>
        </ul>
        
        <h3>⚙️ Особенности:</h3>
        <ul>
            <li><strong>"Автоматическая форточка" занимает 2 слота подарка</strong> — это форточка + автомат в одном подарке. Если вы выбрали её в подарке 1, то подарок 2 автоматически скрывается.</li>
            <li><strong>Автомат для форточки можно выбрать только если есть дополнительная форточка</strong> — либо купленная в разделе "Дополнительные товары", либо выбранная в подарках.</li>
            <li><strong>Если форточка выбрана или куплена, автомат становится доступен во ВСЕХ подарках</strong> — можно выбрать автомат в любом доступном подарке.</li>
        </ul>
        
        <h3>💡 Примеры:</h3>
        
        <div class="example">
            <strong>Пример 1: Заказ на 60 000 рублей (2 подарка)</strong>
            <ul>
                <li>Подарок 1: Дополнительная форточка</li>
                <li>Подарок 2: Капельный полив механический</li>
            </ul>
            <p>Или можно заменить:</p>
            <ul>
                <li>Подарок 1: Автоматическая форточка (форточка + автомат) — <strong>подарок 2 скрывается</strong></li>
                <li>Подарок 2: Недоступен (занят автоматической форточкой)</li>
            </ul>
        </div>
        
        <div class="example">
            <strong>Пример 2: Заказ на 80 000 рублей (3 подарка)</strong>
            <ul>
                <li>Подарок 1: Дополнительная форточка</li>
                <li>Подарок 2: Капельный полив механический</li>
                <li>Подарок 3: Автомат для форточки (стал доступен, так как форточка выбрана в подарке 1)</li>
            </ul>
        </div>
        
        <div class="example">
            <strong>Пример 3: Заказ на 80 000 рублей + куплена форточка</strong>
            <ul>
                <li>Куплена дополнительная форточка в разделе "Дополнительные товары"</li>
                <li>Подарок 1: Автомат для форточки (стал доступен во всех подарках)</li>
                <li>Подарок 2: Капельный полив механический</li>
                <li>Подарок 3: Автомат для форточки (можно выбрать второй автомат, если нужно)</li>
            </ul>
        </div>
        
        <div class="example">
            <strong>Пример 4: Все подарки заменены на грунтозацепа</strong>
            <ul>
                <li>Подарок 1: 4 грунтозацепа</li>
                <li>Подарок 2: 4 грунтозацепа</li>
                <li>Подарок 3: 4 грунтозацепа</li>
            </ul>
            <p>Итого: 12 грунтозацепов в подарок</p>
        </div>
        
        <h3>❓ Частые вопросы:</h3>
        <ul>
            <li><strong>Почему подарок 2 исчез?</strong> — Вы выбрали "Автоматическую форточку" в подарке 1, она занимает 2 слота (форточка + автомат), поэтому подарок 2 скрывается.</li>
            <li><strong>Можно ли выбрать автомат без форточки?</strong> — Нет, автомат можно установить только на дополнительную форточку. Сначала выберите или купите форточку.</li>
            <li><strong>Сколько максимум подарков?</strong> — Максимум 3 подарка, независимо от суммы заказа.</li>
        </ul>
    `;
    
    modal.classList.remove('hidden');
}

/**
 * Закрывает модальное окно с информацией о подарках
 */
function closeGiftsInfoModal() {
    const modal = document.getElementById('gifts-info-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Добавляет подарки в КП (вызывает полный пересчет стоимости)
 */
function addGiftsToOffer() {
    // Вызываем полный пересчет стоимости, который обновит КП с подарками
    if (typeof calculateGreenhouseCost === 'function') {
        calculateGreenhouseCost();
    } else {
        showError('Ошибка: функция расчета стоимости не найдена');
    }
}

/**
 * Удаляет все выбранные подарки
 */
function removeGifts() {
    // Очищаем выбранные подарки из localStorage
    localStorage.removeItem('selectedGifts');
    
    // Очищаем значения в выпадающих списках
    const giftSelects = document.querySelectorAll('.gift-select');
    giftSelects.forEach(select => {
        select.value = '';
    });
    
    // Обновляем КП, удаляя подарки
    updateCommercialOffersWithGifts({});
    
    // Обновляем блок подарков (если есть сумма для расчета)
    const resultElement = document.getElementById('result');
    if (resultElement && resultElement.textContent) {
        const match = resultElement.textContent.match(/Итоговая стоимость[^\d]*(\d[\d\s]*)/);
        if (match) {
            const priceText = match[1].replace(/\s/g, '');
            const totalPrice = parseFloat(priceText);
            if (!isNaN(totalPrice) && totalPrice > 0) {
                updateGiftsBlock(totalPrice, {});
            }
        }
    }
    
    showSuccess('Подарки удалены');
}

// Делаем функции доступными глобально
window.onAdditionalWindowChange = onAdditionalWindowChange;
window.onGiftChange = onGiftChange;
window.updateGiftsBlockPreview = updateGiftsBlockPreview;
window.updateCommercialOffersWithGifts = updateCommercialOffersWithGifts;
window.showGiftsInfoModal = showGiftsInfoModal;
window.closeGiftsInfoModal = closeGiftsInfoModal;
window.addGiftsToOffer = addGiftsToOffer;
window.removeGifts = removeGifts;

// Обработчик изменения поликарбоната - отключает сборку для теплиц без поликарбоната
function handlePolycarbonateChange() {
    const polycarbonateSelect = document.getElementById("polycarbonate");
    const assemblyCheckbox = document.getElementById('assembly');
    
    if (!polycarbonateSelect || !assemblyCheckbox) {
        return;
    }
    
    const polycarbonateValue = polycarbonateSelect.value.trim();
    const polyNormalized = polycarbonateValue.replace(/\s+/g, "").toLowerCase();
    const isWithoutPolycarbonate = polyNormalized === "безполикарбоната";
    
    if (isWithoutPolycarbonate) {
        // Проверяем, была ли сборка выбрана до этого
        const wasAssemblyChecked = assemblyCheckbox.checked;
        
        // Отключаем чекбокс сборки и снимаем выбор
        assemblyCheckbox.disabled = true;
        assemblyCheckbox.checked = false;
        
        // Добавляем визуальное указание, что сборка недоступна
        const assemblyLabel = assemblyCheckbox.closest('label') || assemblyCheckbox.parentElement;
        if (assemblyLabel) {
            assemblyLabel.style.opacity = '0.5';
            assemblyLabel.style.cursor = 'not-allowed';
        }
        
        // Показываем уведомление, если сборка была выбрана
        if (wasAssemblyChecked) {
            showWarning('Каркасы теплиц не собираем отдельно, доступна только доставка.', 'Сборка недоступна');
        }
    } else {
        // Включаем чекбокс сборки обратно
        assemblyCheckbox.disabled = false;
        const assemblyLabel = assemblyCheckbox.closest('label') || assemblyCheckbox.parentElement;
        if (assemblyLabel) {
            assemblyLabel.style.opacity = '1';
            assemblyLabel.style.cursor = 'pointer';
        }
    }
}

// Обработчик клика на label сборки - показывает уведомление если сборка недоступна
function handleAssemblyLabelClick(event) {
    const assemblyCheckbox = document.getElementById('assembly');
    const polycarbonateSelect = document.getElementById("polycarbonate");
    
    if (!assemblyCheckbox || !polycarbonateSelect) {
        return;
    }
    
    // Проверяем, выбрано ли "Без поликарбоната"
    const polycarbonateValue = polycarbonateSelect.value.trim();
    const polyNormalized = polycarbonateValue.replace(/\s+/g, "").toLowerCase();
    const isWithoutPolycarbonate = polyNormalized === "безполикарбоната";
    
    // Если сборка недоступна (disabled) - показываем уведомление и предотвращаем клик
    if (isWithoutPolycarbonate && assemblyCheckbox.disabled) {
        event.preventDefault();
        event.stopPropagation();
        showWarning('Каркасы теплиц не собираем отдельно, доступна только доставка.', 'Сборка недоступна');
        return false;
    }
}

// Обработчик попытки выбрать сборку для теплицы без поликарбоната
function handleAssemblyChange() {
    const assemblyCheckbox = document.getElementById('assembly');
    const polycarbonateSelect = document.getElementById("polycarbonate");
    
    if (!assemblyCheckbox || !polycarbonateSelect) {
        return;
    }
    
    // Проверяем, выбрано ли "Без поликарбоната"
    const polycarbonateValue = polycarbonateSelect.value.trim();
    const polyNormalized = polycarbonateValue.replace(/\s+/g, "").toLowerCase();
    const isWithoutPolycarbonate = polyNormalized === "безполикарбоната";
    
    // Если выбрано "Без поликарбоната" и пытаются выбрать сборку
    if (isWithoutPolycarbonate && assemblyCheckbox.checked) {
        // Отменяем выбор и показываем уведомление
        assemblyCheckbox.checked = false;
        showWarning('Каркасы теплиц не собираем отдельно, доступна только доставка.', 'Сборка недоступна');
        return;
    }
    
    // Если все нормально - вызываем расчет стоимости
    calculateGreenhouseCost();
    updateDeliveryResultDate();

    if (deliveryDatesFromCalendar) {
        syncOrderCalendarSlotsWithMode();
        var cal = document.getElementById('order-calendar');
        if (cal && cal.classList.contains('open')) {
            if (typeof renderOrderCalendar === 'function') renderOrderCalendar();
        }
    }
}

// Функция показа информации о поликарбонате
function showPolycarbonateInfo() {
    const polycarbonateSelect = document.getElementById("polycarbonate");
    if (!polycarbonateSelect || !polycarbonateSelect.value) {
        showWarning("Сначала выберите тип поликарбоната", "Информация о поликарбонате");
        return;
    }
    
    const polycarbonateValue = polycarbonateSelect.value.trim();
    const polyData = getProductData('polycarbonate');
    
    if (!polyData || !polyData.types) {
        showWarning("Информация о поликарбонате пока недоступна", "Информация");
        return;
    }
    
    // Определяем тип поликарбоната
    let selectedType = null;
    const polyNormalized = polycarbonateValue.replace(/\s+/g, "").toLowerCase();
    
    if (polyNormalized.includes("стандарт") && polyNormalized.includes("4")) {
        selectedType = polyData.types.standard_4mm;
    } else if (polyNormalized.includes("люкс") && polyNormalized.includes("4")) {
        selectedType = polyData.types.lux_4mm;
    } else if (polyNormalized.includes("премиум") && polyNormalized.includes("6")) {
        selectedType = polyData.types.premium_6mm;
    }
    
    if (!selectedType || !selectedType.photos || selectedType.photos.length === 0) {
        showWarning("Фото для выбранного типа поликарбоната пока недоступны", "Информация");
        return;
    }
    
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'polycarbonate-info-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
        box-sizing: border-box;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        max-width: 900px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        padding: 20px;
        position: relative;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
        box-sizing: border-box;
    `;
    
    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #e1e8ed; padding-bottom: 12px;">
            <h2 style="margin: 0; font-size: 20px; color: #2c3e50;">🏠 ${selectedType.name}</h2>
            <button onclick="this.closest('.polycarbonate-info-modal').remove()" style="
                background: #ef4444;
                color: white;
                border: none;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                font-size: 22px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">×</button>
        </div>
    `;
    
    if (selectedType.description) {
        html += `<p style="font-size: 15px; color: #4a5568; margin-bottom: 12px; line-height: 1.5;">${selectedType.description}</p>`;
    }
    
    if (selectedType.weight) {
        html += `<p style="font-size: 14px; color: #718096; margin-bottom: 15px;"><strong>Вес:</strong> ${selectedType.weight}</p>`;
    }
    
    // Галерея фото
    html += `<div style="margin-top: 20px;">
        <h3 style="font-size: 18px; font-weight: 600; color: #2c3e50; margin-bottom: 12px;">📸 Фото</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">`;
    
    // Сохраняем массив фото в глобальную переменную для доступа из onclick
    const photosArrayId = `poly_photos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    window[photosArrayId] = selectedType.photos;
    
    selectedType.photos.forEach((photo, index) => {
        const filename = `${selectedType.name.replace(/\s+/g, '_')}_${index + 1}.jpg`;
        html += `
            <div style="position: relative; cursor: pointer; border-radius: 8px; overflow: hidden; border: 2px solid #e1e8ed; transition: all 0.2s;" 
                 onmouseover="this.style.borderColor='#48bb78'; this.style.transform='scale(1.02)'" 
                 onmouseout="this.style.borderColor='#e1e8ed'; this.style.transform='scale(1)'"
                 onclick="openImageModalWithGallery(window['${photosArrayId}'], ${index})">
                <img src="${photo}" alt="${selectedType.name} ${index + 1}" 
                     style="width: 100%; height: 180px; object-fit: cover; display: block;">
                <button onclick="event.stopPropagation(); downloadBedImage('${photo}', '${filename}');" style="
                    position: absolute;
                    top: 6px;
                    right: 6px;
                    background: rgba(0, 0, 0, 0.3);
                    border: none;
                    border-radius: 4px;
                    padding: 4px 6px;
                    cursor: pointer;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    transition: all 0.2s;
                    color: white;
                " onmouseover="this.style.background='rgba(0, 0, 0, 0.5)'; this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(0, 0, 0, 0.3)'; this.style.transform='scale(1)'">
                    <span>📥</span>
                </button>
            </div>
        `;
    });
    
    // Очищаем глобальную переменную при закрытии модального окна
    modal.addEventListener('click', function(e) {
        if (e.target === modal || e.target.closest('button[onclick*="closest"]')) {
            setTimeout(() => {
                if (window[photosArrayId]) {
                    delete window[photosArrayId];
                }
            }, 1000);
        }
    });
    
    html += `</div></div>`;
    
    // Параметры (если есть)
    if (polyData.parametersImage) {
        html += `<div style="margin-top: 20px; text-align: center;">
            <h3 style="font-size: 18px; font-weight: 600; color: #2c3e50; margin-bottom: 12px;">📐 Параметры</h3>
            <div style="position: relative; display: inline-block;">
                <img src="${polyData.parametersImage}" alt="Параметры поликарбоната" 
                     style="max-width: 100%; border-radius: 8px; cursor: pointer; border: 2px solid #e1e8ed;"
                     onclick="openImageModal('${polyData.parametersImage}')"
                     onmouseover="this.style.borderColor='#48bb78'"
                     onmouseout="this.style.borderColor='#e1e8ed'">
                <button onclick="event.stopPropagation(); downloadBedImage('${polyData.parametersImage}', 'Параметры_поликарбоната.png');" style="
                    position: absolute;
                    top: 6px;
                    right: 6px;
                    background: rgba(0, 0, 0, 0.3);
                    border: none;
                    border-radius: 4px;
                    padding: 4px 6px;
                    cursor: pointer;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    transition: all 0.2s;
                    color: white;
                " onmouseover="this.style.background='rgba(0, 0, 0, 0.5)'; this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(0, 0, 0, 0.3)'; this.style.transform='scale(1)'">
                    <span>📥</span>
                </button>
            </div>
        </div>`;
    }
    
    modalContent.innerHTML = html;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Закрытие по клику на фон
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Закрытие по Escape
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

window.handlePolycarbonateChange = handlePolycarbonateChange;
window.handleAssemblyChange = handleAssemblyChange;
window.handleAssemblyLabelClick = handleAssemblyLabelClick;
window.showPolycarbonateInfo = showPolycarbonateInfo;

// Вызываем проверку при загрузке страницы, если поликарбонат уже выбран
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        if (document.getElementById("polycarbonate") && document.getElementById("polycarbonate").value) {
            handlePolycarbonateChange();
        }
    });
} else {
    // Если страница уже загружена
    if (document.getElementById("polycarbonate") && document.getElementById("polycarbonate").value) {
        handlePolycarbonateChange();
    }
}

/**
 * Показать галерею фотографий теплиц
 * Сначала выбор типа теплицы, затем варианта, затем просмотр фотографий
 */
function showGreenhousesGallery() {
    if (!window.GREENHOUSES_DATA || !window.GREENHOUSES_PHOTOS_LIST) {
        showWarning("Данные о теплицах не загружены", "Ошибка");
        return;
    }
    
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'greenhouses-gallery-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        max-width: 900px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        position: relative;
    `;
    
    // Заголовок
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 20px 25px;
        border-bottom: 2px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f8f9fa;
        border-radius: 12px 12px 0 0;
    `;
    
    const title = document.createElement('h2');
    title.className = 'modal-title';
    title.textContent = '📸 Фотографии теплиц';
    title.style.cssText = `
        margin: 0;
        font-size: 22px;
        color: #2c3e50;
        font-weight: 600;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 32px;
        color: #666;
        cursor: pointer;
        padding: 0;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
    `;
    closeBtn.addEventListener('mouseenter', function() {
        this.style.background = '#e0e0e0';
        this.style.color = '#333';
    });
    closeBtn.addEventListener('mouseleave', function() {
        this.style.background = 'none';
        this.style.color = '#666';
    });
    closeBtn.addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Контейнер для содержимого (будет меняться в зависимости от шага)
    const contentContainer = document.createElement('div');
    contentContainer.style.cssText = `
        padding: 25px;
    `;
    
    // Функция для показа выбора типа теплицы
    function showTypeSelection() {
        contentContainer.innerHTML = '';
        
        const description = document.createElement('p');
        description.textContent = 'Выберите тип теплицы:';
        description.style.cssText = `
            margin: 0 0 20px 0;
            font-size: 16px;
            color: #555;
        `;
        contentContainer.appendChild(description);
        
        const typesGrid = document.createElement('div');
        typesGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
        `;
        
        const allTypes = window.getAllGreenhouseTypes();
        allTypes.forEach(type => {
            // Получаем иконку: сначала проверяем явно указанное фото, иначе первое фото из первого варианта
            let iconPhoto = type.iconPhoto || null;
            if (!iconPhoto) {
                const variantNames = Object.keys(type.variants);
                for (let i = 0; i < variantNames.length; i++) {
                    const photos = window.GREENHOUSES_PHOTOS_LIST[variantNames[i]] || [];
                    if (photos.length > 0) {
                        iconPhoto = photos[0];
                        break;
                    }
                }
            }
            
            const typeCard = document.createElement('div');
            typeCard.style.cssText = `
                background: #f8f9fa;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                padding: 20px;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
                position: relative;
                overflow: hidden;
            `;
            typeCard.addEventListener('mouseenter', function() {
                this.style.borderColor = '#3498db';
                this.style.background = '#e8f4f8';
                this.style.transform = 'translateY(-2px)';
            });
            typeCard.addEventListener('mouseleave', function() {
                this.style.borderColor = '#e0e0e0';
                this.style.background = '#f8f9fa';
                this.style.transform = 'translateY(0)';
            });
            typeCard.addEventListener('click', function() {
                showVariantSelection(type);
            });
            
            // Иконка (фото) если есть
            if (iconPhoto) {
                const iconContainer = document.createElement('div');
                iconContainer.style.cssText = `
                    width: 100%;
                    height: 120px;
                    margin-bottom: 12px;
                    border-radius: 6px;
                    overflow: hidden;
                    background: #e0e0e0;
                `;
                const iconImg = document.createElement('img');
                iconImg.src = iconPhoto;
                iconImg.style.cssText = `
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                `;
                iconImg.onerror = function() {
                    iconContainer.style.display = 'none';
                };
                iconContainer.appendChild(iconImg);
                typeCard.appendChild(iconContainer);
            }
            
            const typeName = document.createElement('div');
            typeName.textContent = type.name;
            typeName.style.cssText = `
                font-size: 18px;
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 8px;
            `;
            
            const typeDesc = document.createElement('div');
            typeDesc.textContent = type.description || '';
            typeDesc.style.cssText = `
                font-size: 13px;
                color: #777;
                line-height: 1.4;
            `;
            
            typeCard.appendChild(typeName);
            typeCard.appendChild(typeDesc);
            typesGrid.appendChild(typeCard);
        });
        
        contentContainer.appendChild(description);
        contentContainer.appendChild(typesGrid);
    }
    
    // Функция для показа выбора варианта теплицы
    function showVariantSelection(type) {
        contentContainer.innerHTML = '';
        
        // Кнопка "Назад"
        const backBtn = document.createElement('button');
        backBtn.innerHTML = '← Назад к типам';
        backBtn.style.cssText = `
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 10px 20px;
            font-size: 14px;
            cursor: pointer;
            margin-bottom: 20px;
            transition: all 0.2s ease;
        `;
        backBtn.addEventListener('mouseenter', function() {
            this.style.background = '#5a6268';
        });
        backBtn.addEventListener('mouseleave', function() {
            this.style.background = '#6c757d';
        });
        backBtn.addEventListener('click', function() {
            showTypeSelection();
        });
        contentContainer.appendChild(backBtn);
        
        const description = document.createElement('p');
        description.innerHTML = `<strong>${type.name}</strong> — выберите вариант:`;
        description.style.cssText = `
            margin: 0 0 20px 0;
            font-size: 16px;
            color: #555;
        `;
        contentContainer.appendChild(description);
        
        const variantsList = document.createElement('div');
        variantsList.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 12px;
        `;
        
        const variants = Object.keys(type.variants);
        variants.forEach(variantName => {
            const variant = type.variants[variantName];
            const photos = window.GREENHOUSES_PHOTOS_LIST[variantName] || [];
            
            // Пропускаем варианты без фотографий
            if (photos.length === 0) {
                return;
            }
            
            const variantCard = document.createElement('div');
            variantCard.style.cssText = `
                background: #f8f9fa;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                padding: 15px;
                cursor: pointer;
                transition: all 0.2s ease;
            `;
            variantCard.addEventListener('mouseenter', function() {
                this.style.borderColor = '#3498db';
                this.style.background = '#e8f4f8';
                this.style.transform = 'translateY(-2px)';
            });
            variantCard.addEventListener('mouseleave', function() {
                this.style.borderColor = '#e0e0e0';
                this.style.background = '#f8f9fa';
                this.style.transform = 'translateY(0)';
            });
            variantCard.addEventListener('click', function() {
                showPhotosGallery(variantName, photos);
            });
            
            const variantNameEl = document.createElement('div');
            variantNameEl.textContent = variantName.replace('ТЕПЛИЦА ', '');
            variantNameEl.style.cssText = `
                font-size: 15px;
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 8px;
            `;
            
            const variantFrame = document.createElement('div');
            variantFrame.textContent = `Каркас: ${variant.frame}`;
            variantFrame.style.cssText = `
                font-size: 13px;
                color: #777;
                margin-bottom: 8px;
            `;
            
            const photosCount = document.createElement('div');
            photosCount.textContent = `📸 ${photos.length} фото`;
            photosCount.style.cssText = `
                font-size: 12px;
                color: #27ae60;
                font-weight: 500;
            `;
            
            variantCard.appendChild(variantNameEl);
            variantCard.appendChild(variantFrame);
            variantCard.appendChild(photosCount);
            variantsList.appendChild(variantCard);
        });
        
        contentContainer.appendChild(variantsList);
    }
    
    // Функция для показа галереи фотографий
    function showPhotosGallery(variantName, photos) {
        contentContainer.innerHTML = '';
        
        // Кнопка "Назад"
        const backBtn = document.createElement('button');
        backBtn.innerHTML = '← Назад к вариантам';
        backBtn.style.cssText = `
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 10px 20px;
            font-size: 14px;
            cursor: pointer;
            margin-bottom: 20px;
            transition: all 0.2s ease;
        `;
        backBtn.addEventListener('mouseenter', function() {
            this.style.background = '#5a6268';
        });
        backBtn.addEventListener('mouseleave', function() {
            this.style.background = '#6c757d';
        });
        backBtn.addEventListener('click', function() {
            // Находим тип теплицы по названию варианта
            const allTypes = window.getAllGreenhouseTypes();
            const type = allTypes.find(t => t.variants[variantName]);
            if (type) {
                showVariantSelection(type);
            } else {
                showTypeSelection();
            }
        });
        contentContainer.appendChild(backBtn);
        
        const description = document.createElement('p');
        description.innerHTML = `<strong>${variantName.replace('ТЕПЛИЦА ', '')}</strong> — ${photos.length} фотографий:`;
        description.style.cssText = `
            margin: 0 0 20px 0;
            font-size: 16px;
            color: #555;
        `;
        contentContainer.appendChild(description);
        
        // Галерея миниатюр
        const galleryGrid = document.createElement('div');
        galleryGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 12px;
        `;
        
        photos.forEach((photoPath, index) => {
            const photoCard = document.createElement('div');
            photoCard.style.cssText = `
                position: relative;
                height: 200px;
                border-radius: 8px;
                overflow: hidden;
                cursor: pointer;
                border: 2px solid #e0e0e0;
                transition: all 0.2s ease;
                background: #f0f0f0;
            `;
            photoCard.addEventListener('mouseenter', function() {
                this.style.borderColor = '#3498db';
                this.style.transform = 'scale(1.05)';
            });
            photoCard.addEventListener('mouseleave', function() {
                this.style.borderColor = '#e0e0e0';
                this.style.transform = 'scale(1)';
            });
            photoCard.addEventListener('click', function(e) {
                // Не открываем галерею при клике на кнопку скачать
                if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                    openImageModalWithGallery(photos, index);
                }
            });
            
            const img = document.createElement('img');
            img.src = photoPath;
            img.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: contain;
            `;
            img.onerror = function() {
                this.style.display = 'none';
                photoCard.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999; font-size: 12px;">Ошибка загрузки</div>';
            };
            
            // Кнопка скачать
            const downloadBtn = document.createElement('button');
            const filename = photoPath.split('/').pop() || `photo_${index + 1}.jpg`;
            downloadBtn.innerHTML = '📥';
            downloadBtn.style.cssText = `
                position: absolute;
                top: 8px;
                right: 8px;
                width: 32px;
                height: 32px;
                background: rgba(0, 0, 0, 0.3);
                border: none;
                border-radius: 6px;
                color: white;
                font-size: 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                z-index: 5;
            `;
            downloadBtn.addEventListener('mouseenter', function() {
                this.style.background = 'rgba(0, 0, 0, 0.6)';
                this.style.transform = 'scale(1.1)';
            });
            downloadBtn.addEventListener('mouseleave', function() {
                this.style.background = 'rgba(0, 0, 0, 0.3)';
                this.style.transform = 'scale(1)';
            });
            downloadBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                downloadBedImage(photoPath, filename);
            });
            
            // Кнопка копирования
            const copyBtn = document.createElement('button');
            copyBtn.innerHTML = '📋';
            copyBtn.style.cssText = `
                position: absolute;
                top: 8px;
                right: 48px;
                width: 32px;
                height: 32px;
                background: rgba(0, 0, 0, 0.3);
                border: none;
                border-radius: 6px;
                color: white;
                font-size: 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                z-index: 5;
            `;
            copyBtn.addEventListener('mouseenter', function() {
                this.style.background = 'rgba(0, 0, 0, 0.6)';
                this.style.transform = 'scale(1.1)';
            });
            copyBtn.addEventListener('mouseleave', function() {
                this.style.background = 'rgba(0, 0, 0, 0.3)';
                this.style.transform = 'scale(1)';
            });
            copyBtn.addEventListener('click', async function(e) {
                e.stopPropagation();
                await copyImageToClipboard(photoPath, copyBtn);
            });
            
            photoCard.appendChild(img);
            photoCard.appendChild(downloadBtn);
            photoCard.appendChild(copyBtn);
            galleryGrid.appendChild(photoCard);
        });
        
        contentContainer.appendChild(galleryGrid);
    }
    
    // Инициализация - показываем выбор типа
    showTypeSelection();
    
    modalContent.appendChild(header);
    modalContent.appendChild(contentContainer);
    modal.appendChild(modalContent);
    
    // Закрытие по клику на фон
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    document.body.appendChild(modal);
}

// Экспорт функции для использования в HTML
if (typeof window !== 'undefined') {
    window.showGreenhousesGallery = showGreenhousesGallery;
}

/**
 * Показать модальное окно с инструкциями по сборке теплиц
 * Простой интерфейс для быстрого поиска и скачивания инструкций
 */
function showInstructionsModal() {
    // Проверяем наличие данных об инструкциях
    if (typeof INSTRUCTIONS_DATA === 'undefined') {
        showError('Данные об инструкциях не загружены', 'Ошибка');
        return;
    }
    
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'instructions-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.className = 'instructions-modal-content';
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        width: 100%;
        max-width: 650px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        position: relative;
    `;
    
    // Заголовок - компактный
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 12px 16px;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f8f9fa;
        border-radius: 12px 12px 0 0;
        position: sticky;
        top: 0;
        z-index: 10;
    `;
    
    const title = document.createElement('h2');
    title.className = 'modal-title';
    title.textContent = '📖 Инструкции по сборке теплиц';
    title.style.cssText = `
        margin: 0;
        font-size: 18px;
        color: #2c3e50;
        font-weight: 600;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 32px;
        color: #666;
        cursor: pointer;
        padding: 0;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
    `;
    closeBtn.addEventListener('mouseenter', function() {
        this.style.background = '#e0e0e0';
        this.style.color = '#333';
    });
    closeBtn.addEventListener('mouseleave', function() {
        this.style.background = 'none';
        this.style.color = '#666';
    });
    closeBtn.addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Поиск - компактный
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = `
        padding: 10px 12px;
        border-bottom: 1px solid #e0e0e0;
        background: #f8f9fa;
        position: sticky;
        top: 70px;
        z-index: 9;
    `;
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '🔍 Поиск по типу теплицы или размеру...';
    searchInput.style.cssText = `
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 13px;
        box-sizing: border-box;
        transition: all 0.15s ease;
        background: white;
    `;
    searchInput.addEventListener('focus', function() {
        this.style.borderColor = '#3498db';
    });
    searchInput.addEventListener('blur', function() {
        this.style.borderColor = '#e0e0e0';
    });
    
    searchContainer.appendChild(searchInput);
    
    // Контейнер для инструкций - компактный
    const contentContainer = document.createElement('div');
    contentContainer.style.cssText = `
        padding: 12px;
    `;
    
    // Функция для отображения всех инструкций
    function renderInstructions(searchTerm = '') {
        contentContainer.innerHTML = '';
        
        const allTypes = window.getAllGreenhouseTypes();
        let hasResults = false;
        let isFirstType = true;
        
        allTypes.forEach(type => {
            const instructions = INSTRUCTIONS_DATA[type.id];
            if (!instructions) return;
            
            // Фильтрация по поисковому запросу
            const searchLower = searchTerm.toLowerCase();
            const typeNameMatch = type.name.toLowerCase().includes(searchLower) || 
                                 type.fullName.toLowerCase().includes(searchLower);
            
            if (searchTerm && !typeNameMatch) {
                // Проверяем, есть ли совпадения в инструкциях
                let hasMatchingInstructions = false;
                for (const size in instructions.instructions) {
                    for (const inst of instructions.instructions[size]) {
                        if (inst.filename.toLowerCase().includes(searchLower) || 
                            size.includes(searchLower)) {
                            hasMatchingInstructions = true;
                            break;
                        }
                    }
                    if (hasMatchingInstructions) break;
                }
                if (!hasMatchingInstructions) return;
            }
            
            hasResults = true;
            
            // Заголовок типа теплицы с фото - более заметный
            const typeHeader = document.createElement('div');
            typeHeader.style.cssText = `
                margin-top: ${isFirstType ? '0' : '20px'};
                margin-bottom: 12px;
                padding: 12px 14px;
                background: linear-gradient(to right, #f0f7ff 0%, #ffffff 100%);
                border-left: 4px solid #3498db;
                border-radius: 6px;
                display: flex;
                align-items: center;
                gap: 14px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            `;
            
            // Фотография теплицы
            let iconPhoto = type.iconPhoto || null;
            if (!iconPhoto) {
                const variantNames = Object.keys(type.variants);
                for (let i = 0; i < variantNames.length; i++) {
                    const photos = window.GREENHOUSES_PHOTOS_LIST[variantNames[i]] || [];
                    if (photos.length > 0) {
                        iconPhoto = photos[0];
                        break;
                    }
                }
            }
            
            if (iconPhoto) {
                const photoContainer = document.createElement('div');
                photoContainer.style.cssText = `
                    width: 80px;
                    height: 80px;
                    min-width: 80px;
                    border-radius: 6px;
                    overflow: hidden;
                    background: #e0e0e0;
                    border: 2px solid #e8e8e8;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                `;
                const photoImg = document.createElement('img');
                photoImg.src = iconPhoto;
                photoImg.style.cssText = `
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                `;
                photoImg.onerror = function() {
                    photoContainer.style.display = 'none';
                };
                photoContainer.appendChild(photoImg);
                typeHeader.appendChild(photoContainer);
            }
            
            const typeInfo = document.createElement('div');
            typeInfo.style.cssText = `
                flex: 1;
            `;
            
            const typeTitle = document.createElement('h3');
            typeTitle.textContent = type.name;
            typeTitle.style.cssText = `
                margin: 0 0 5px 0;
                font-size: 19px;
                color: #2c3e50;
                font-weight: 700;
                letter-spacing: -0.2px;
            `;
            
            const typeDesc = document.createElement('div');
            typeDesc.textContent = type.description || '';
            typeDesc.style.cssText = `
                font-size: 13px;
                color: #5a6c7d;
                line-height: 1.4;
            `;
            
            typeInfo.appendChild(typeTitle);
            typeInfo.appendChild(typeDesc);
            typeHeader.appendChild(typeInfo);
            contentContainer.appendChild(typeHeader);
            
            isFirstType = false;
            
            // Группируем инструкции по размерам
            const sizes = Object.keys(instructions.instructions).sort((a, b) => {
                if (a === 'other') return 1;
                if (b === 'other') return -1;
                return parseFloat(a) - parseFloat(b);
            });
            
            sizes.forEach(size => {
                const sizeInstructions = instructions.instructions[size];
                
                // Заголовок размера - очень компактный, почти незаметный
                const sizeHeader = document.createElement('div');
                sizeHeader.style.cssText = `
                    margin-top: 6px;
                    margin-bottom: 3px;
                    margin-left: 2px;
                    font-size: 10px;
                    font-weight: 500;
                    color: #bdc3c7;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                `;
                sizeHeader.textContent = size === 'other' ? 'Другие размеры' : `${size} м`;
                contentContainer.appendChild(sizeHeader);
                
                // Список инструкций для этого размера - максимально компактный
                sizeInstructions.forEach(inst => {
                    const instCard = document.createElement('div');
                    instCard.style.cssText = `
                        background: white;
                        border: 1px solid #e8e8e8;
                        border-radius: 4px;
                        padding: 7px 10px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 8px;
                        margin-bottom: 3px;
                        transition: all 0.15s ease;
                        width: 100%;
                        box-sizing: border-box;
                    `;
                    instCard.addEventListener('mouseenter', function() {
                        this.style.borderColor = '#3498db';
                        this.style.boxShadow = '0 2px 8px rgba(52, 152, 219, 0.15)';
                        this.style.background = '#f8fbff';
                        this.style.transform = 'translateX(2px)';
                    });
                    instCard.addEventListener('mouseleave', function() {
                        this.style.borderColor = '#e5e5e5';
                        this.style.boxShadow = 'none';
                        this.style.background = 'white';
                        this.style.transform = 'translateX(0)';
                    });
                    
                    // Название файла - занимает только необходимое место
                    const fileName = document.createElement('div');
                    fileName.textContent = inst.filename.replace('.pdf', '');
                    fileName.style.cssText = `
                        font-size: 13px;
                        font-weight: 400;
                        color: #34495e;
                        flex: 1 1 auto;
                        min-width: 0;
                        word-break: break-word;
                        line-height: 1.3;
                    `;
                    
                    // Кнопки действий - сразу после текста
                    const buttonsContainer = document.createElement('div');
                    buttonsContainer.style.cssText = `
                        display: flex;
                        gap: 5px;
                        flex-shrink: 0;
                    `;
                    
                    // Кнопка "Открыть"
                    const openBtn = document.createElement('button');
                    openBtn.innerHTML = '👁️ Открыть';
                    openBtn.style.cssText = `
                        background: #3498db;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        padding: 5px 12px;
                        font-size: 12px;
                        cursor: pointer;
                        transition: all 0.15s ease;
                        font-weight: 500;
                        white-space: nowrap;
                    `;
                    openBtn.addEventListener('mouseenter', function() {
                        this.style.background = '#2980b9';
                    });
                    openBtn.addEventListener('mouseleave', function() {
                        this.style.background = '#3498db';
                    });
                    openBtn.addEventListener('click', function() {
                        window.open(inst.path, '_blank');
                    });
                    
                    // Кнопка "Скачать"
                    const downloadBtn = document.createElement('button');
                    downloadBtn.innerHTML = '📥 Скачать';
                    downloadBtn.style.cssText = `
                        background: #27ae60;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        padding: 5px 12px;
                        font-size: 12px;
                        cursor: pointer;
                        transition: all 0.15s ease;
                        font-weight: 500;
                        white-space: nowrap;
                    `;
                    downloadBtn.addEventListener('mouseenter', function() {
                        this.style.background = '#229954';
                    });
                    downloadBtn.addEventListener('mouseleave', function() {
                        this.style.background = '#27ae60';
                    });
                    downloadBtn.addEventListener('click', function() {
                        const link = document.createElement('a');
                        link.href = inst.path;
                        link.download = inst.filename;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        showSuccess('Инструкция скачивается...', 'Скачивание');
                    });
                    
                    buttonsContainer.appendChild(openBtn);
                    buttonsContainer.appendChild(downloadBtn);
                    
                    instCard.appendChild(fileName);
                    instCard.appendChild(buttonsContainer);
                    contentContainer.appendChild(instCard);
                });
            });
        });
        
        if (!hasResults) {
            const noResults = document.createElement('div');
            noResults.style.cssText = `
                text-align: center;
                padding: 40px;
                color: #999;
                font-size: 16px;
            `;
            noResults.textContent = 'Ничего не найдено';
            contentContainer.appendChild(noResults);
        }
    }
    
    // Обработчик поиска
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            renderInstructions(this.value);
        }, 300);
    });
    
    // Инициализация - показываем все инструкции
    renderInstructions();
    
    modalContent.appendChild(header);
    modalContent.appendChild(searchContainer);
    modalContent.appendChild(contentContainer);
    modal.appendChild(modalContent);
    
    // Закрытие по клику на фон
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Закрытие по Escape
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    document.body.appendChild(modal);
}

// Экспорт функции для использования в HTML
if (typeof window !== 'undefined') {
    window.showInstructionsModal = showInstructionsModal;
}

// ═══════════════════════════════════════════════════════════
//  ОФОРМЛЕНИЕ ЗАКАЗА — отправка в Supabase + генерация КП
// ═══════════════════════════════════════════════════════════

/** Подвал текста заказа: оплата, контакты, доставка (всегда). */
const ORDER_FOOTER_BASE = `ОПЛАТА:
Наличными или по QR-коду — после доставки и проверки.

🚨 Чтобы не потеряться при сбоях мессенджеров в РФ — сохраните номер в контакты.
Telegram/Max (только сообщения, без звонков): +7 993 957-57-90
Для звонков: +7 (495) 085-59-90

🚚 О доставке:
Доставляем в течение дня — точное время заранее назвать не можем, так как маршрут зависит от погодных условий, загруженности дорог и времени на предыдущих адресах.
Перед приездом водитель обязательно свяжется с вами по телефону.`;

/** Блок «О сборке» — выводится только если в заказе выбрана опция сборки. */
const ORDER_FOOTER_ASSEMBLY = `🔧 О сборке:
Если у вас заказана сборка, монтаж начинается сразу в день доставки.
Пожалуйста, подготовьте площадку заранее:
🔸Очистите участок от снега, мусора и кустов
🔸Выровняйте землю
🔸Обеспечьте подъезд и свободный доступ к месту установки`;

/** Нормализация телефона для Supabase и таблиц: строго 11 цифр, с 7 (79211234567). Без + и других символов. 8 в начале → 7. */
function normalizePhone(raw) {
    const digits = (raw || '').replace(/\D/g, '');
    if (digits.length === 11 && digits[0] === '8') return '7' + digits.slice(1);
    if (digits.length === 11 && digits[0] === '7') return digits;
    if (digits.length === 10) return '7' + digits;
    return '';
}

/** Проверка: ровно 11 цифр, первая — 7 (формат 79211234567). */
function isValidPhone11(phone) {
    if (!phone || typeof phone !== 'string') return false;
    const digits = phone.replace(/\D/g, '');
    return digits.length === 11 && digits[0] === '7' && /^\d+$/.test(digits);
}

/**
 * Проверка телефона для сохранения при явном редактировании пользователем.
 * Допускает: одиночный 11-значный номер с 7, либо dual-phone slash-format «num1 / num2».
 * Пробелы вокруг «/» опциональны.
 */
function isValidPhoneForSave_(raw) {
    if (!raw || typeof raw !== 'string') return false;
    const trimmed = raw.trim();
    // Dual-phone slash-format: "79111111111 / 79222222222" (пробелы опциональны)
    const slashIdx = trimmed.indexOf('/');
    if (slashIdx !== -1) {
        const part1 = trimmed.slice(0, slashIdx).trim();
        const part2 = trimmed.slice(slashIdx + 1).trim();
        return isValidPhone11(normalizePhone(part1)) && isValidPhone11(normalizePhone(part2));
    }
    // Single phone
    return isValidPhone11(normalizePhone(trimmed));
}

/**
 * Нормализация телефона для сохранения при явном редактировании.
 * Dual-phone slash-format сохраняется как есть (с нормализацией каждого номера).
 * Single phone — normalizePhone.
 */
function sanitizePhoneForSave_(raw) {
    if (!raw || typeof raw !== 'string') return normalizePhone(raw);
    const trimmed = raw.trim();
    const slashIdx = trimmed.indexOf('/');
    if (slashIdx !== -1) {
        const part1 = normalizePhone(trimmed.slice(0, slashIdx).trim());
        const part2 = normalizePhone(trimmed.slice(slashIdx + 1).trim());
        // Если оба номера валидны — вернуть canonical dual-phone с пробелами
        if (part1 && part2) return part1 + ' / ' + part2;
        // Если только первый валиден — одиночный
        if (part1) return part1;
    }
    return normalizePhone(trimmed);
}

/** Формат телефона для отображения в КП клиенту */
function formatPhoneDisplay(storedPhone) {
    if (!storedPhone) return '';
    const d = storedPhone.replace(/\D/g, '');
    if (d.length === 11 && d[0] === '7') {
        return `+7 ${d.slice(1, 4)} ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9)}`;
    }
    return storedPhone;
}

function formatDateRu(isoDate) {
    if (!isoDate || typeof isoDate !== 'string' || !isoDate.includes('-')) return '—';
    const [y, m, d] = isoDate.split('-');
    return `${d}.${m}.${y}`;
}

function extractCityFromAddress(address) {
    if (!address) return '';
    const parts = address.split(',').map(p => p.trim());
    if (parts.length >= 2) return parts[1];
    return parts[0] || '';
}

/** Блок характеристик теплицы и итога (для превью заказа и для полного шаблона). */
function buildGreenhouseBlock(calc) {
    if (!calc) return '';
    const height = calc.height || 'Не указано';
    const horizontalTies = calc.horizontalTies || 'Не указано';
    const equipment = calc.equipment || 'Не указано';

    let greenhouse = `${(calc.model || '').toUpperCase()} - ${formatPrice(calc.basePrice)} рублей\n`;
    greenhouse += `Каркас: ${calc.frame}\n`;
    greenhouse += `Ширина: ${calc.width} м\n`;
    greenhouse += `Длина: ${calc.length} м\n`;
    greenhouse += `Высота: ${height}\n`;
    greenhouse += `Шаг дуги: ${calc.arcStep} м\n`;
    greenhouse += `Поликарбонат: ${calc.polycarbonate}\n`;
    greenhouse += `Снеговая нагрузка: ${calc.snowLoad}\n`;
    greenhouse += `Горизонтальные стяжки: ${horizontalTies}\n`;
    greenhouse += `Комплектация: ${equipment}\n`;

    if (calc.assemblyText) {
        greenhouse += `${calc.assemblyText.replace(/^\n/, '')}\n`;
    }
    if (calc.foundationText) {
        greenhouse += `${calc.foundationText.replace(/^\n/, '')}\n`;
    }
    if (calc.bedsAssemblyText) {
        greenhouse += `${calc.bedsAssemblyText.replace(/^\n/, '')}\n`;
    }
    if (calc.additionalProductsText) {
        greenhouse += `${calc.additionalProductsText}\n`;
    }
    if (calc.deliveryPrice > 0) {
        greenhouse += `Доставка - ${formatPrice(calc.deliveryPrice)} рублей\n`;
    }

    greenhouse += `\nИтоговая стоимость - ${formatPrice(calc.finalTotalPrice)} рублей\n`;
    return greenhouse;
}

/** Блок для 2+ одинаковых теплиц: описание один раз, позиции с х2/х3, общий итог. */
function buildGreenhouseBlockIdentical(calc, quantity, orderTotal) {
    if (!calc || quantity < 2) return buildGreenhouseBlock(calc);
    const height = calc.height || 'Не указано';
    const horizontalTies = calc.horizontalTies || 'Не указано';
    const equipment = calc.equipment || 'Не указано';

    var delivery = (calc.deliveryPrice || 0);
    var deliveryLine = delivery > 0 ? `\nДоставка - ${formatPrice(delivery)} рублей (1 раз)\n` : '';
    var onePrice = quantity > 0 ? (orderTotal - delivery) / quantity : 0;

    let greenhouse = `${(calc.model || '').toUpperCase()} - ${formatPrice(calc.basePrice)} рублей`;
    if (quantity > 1) greenhouse += ` х${quantity} — ${formatPrice(onePrice * quantity)} рублей`;
    greenhouse += '\n';
    greenhouse += `Каркас: ${calc.frame}\n`;
    greenhouse += `Ширина: ${calc.width} м\n`;
    greenhouse += `Длина: ${calc.length} м\n`;
    greenhouse += `Высота: ${height}\n`;
    greenhouse += `Шаг дуги: ${calc.arcStep} м\n`;
    greenhouse += `Поликарбонат: ${calc.polycarbonate}\n`;
    greenhouse += `Снеговая нагрузка: ${calc.snowLoad}\n`;
    greenhouse += `Горизонтальные стяжки: ${horizontalTies}\n`;
    greenhouse += `Комплектация: ${equipment}\n`;

    if (calc.assemblyText) {
        var aLines = String(calc.assemblyText).trim().split(/\n+/).filter(Boolean);
        aLines.forEach(function (line) {
            var m = line.match(/^(.+?)\s*[-–]\s*([\d\s.]+)\s*рублей?\s*$/i);
            if (m) {
                var p = parseInt(String(m[2]).replace(/\s/g, '').replace(/\./g, ''), 10);
                if (!isNaN(p)) greenhouse += m[1].trim() + ' - ' + formatPrice(p) + ' рублей х' + quantity + ' - ' + formatPrice(p * quantity) + ' рублей\n';
                else greenhouse += line + '\n';
            } else greenhouse += line + '\n';
        });
    }
    if (calc.foundationText) {
        var fLines = String(calc.foundationText).trim().split(/\n+/).filter(Boolean);
        fLines.forEach(function (line) {
            var m = line.match(/^(.+?)\s*[-–]\s*([\d\s.]+)\s*рублей?\s*$/i);
            if (m) {
                var p = parseInt(String(m[2]).replace(/\s/g, '').replace(/\./g, ''), 10);
                if (!isNaN(p)) greenhouse += m[1].trim() + ' - ' + formatPrice(p) + ' рублей х' + quantity + ' - ' + formatPrice(p * quantity) + ' рублей\n';
                else greenhouse += line + '\n';
            } else greenhouse += line + '\n';
        });
    }
    if (calc.bedsAssemblyText) {
        greenhouse += calc.bedsAssemblyText.replace(/^\n/, '').trim() + '\n';
    }
    if (calc.additionalProductsText) {
        var adLines = String(calc.additionalProductsText).trim().split(/\n+/).filter(Boolean);
        adLines.forEach(function (line) {
            var m = line.match(/^(.+?)\s*[-–]\s*([\d\s.]+)\s*рублей?\s*$/i);
            if (m) {
                var p = parseInt(String(m[2]).replace(/\s/g, '').replace(/\./g, ''), 10);
                if (!isNaN(p)) greenhouse += m[1].trim() + ' - ' + formatPrice(p) + ' рублей х' + quantity + ' - ' + formatPrice(p * quantity) + ' рублей\n';
                else greenhouse += line + '\n';
            } else greenhouse += line + '\n';
        });
    }
    greenhouse += deliveryLine;
    greenhouse += `\nИтоговая стоимость — ${formatPrice(orderTotal)} рублей\n`;
    return greenhouse;
}

function generateFullOrderTemplate(calc, client, orderCart, optGiftsText, optOrderTotalFn) {
    const manager = client.manager;
    var displayName = (client.name && String(client.name).trim()) || 'Клиент';
    if (displayName === '2 разные теплицы' || displayName === '2 одинаковые теплицы') displayName = 'Клиент';

    let header = `Здравствуйте, ${displayName}!\n`;
    header += `Меня зовут ${manager}, мы с вами общались и оформили заказ теплицы.\n`;
    header += `Ниже — все детали, проверьте, пожалуйста все ли указано верно?\n`;
    header += `Если что-то нужно изменить — сразу напишите.\n\n`;

    let clientBlock = `ВАШ ЗАКАЗ:\n`;
    clientBlock += `Имя: ${displayName}\n`;
    clientBlock += `Дата доставки: ${formatDateRu(client.deliveryDate)}\n`;
    clientBlock += `Адрес: ${client.address || (calc && calc.address) || '—'}\n`;
    clientBlock += `Телефон: ${formatPhoneDisplay(client.phone)}\n\n`;

    var greenhouse;
    var isIdenticalCart = orderCart && orderCart.length >= 2 && orderCart.every(function (item) {
        var first = orderCart[0];
        return item.model === first.model && item.width === first.width && item.length === first.length && item.frame === first.frame;
    });
    var getTotalFn = (typeof optOrderTotalFn === 'function') ? optOrderTotalFn : (typeof getOrderCartTotal === 'function' ? getOrderCartTotal : null);
    if (isIdenticalCart && orderCart.length >= 2) {
        var orderTotal = getTotalFn ? getTotalFn() : (calc.finalTotalPrice * orderCart.length + (calc.deliveryPrice || 0));
        greenhouse = buildGreenhouseBlockIdentical(calc, orderCart.length, orderTotal);
    } else if (orderCart && orderCart.length >= 2) {
        var orderTotalDiff = getTotalFn ? getTotalFn() : 0;
        var deliveryAmount = (orderCart[0] && (orderCart[0].deliveryPrice || orderCart[0].deliveryCost)) || (lastCalculation && (lastCalculation.deliveryPrice || lastCalculation.deliveryCost)) || 0;
        greenhouse = orderCart.map(function (item, i) {
            var label = (i + 1) + ' теплица';
            return label + ':\n' + buildGreenhouseBlock(item);
        }).join('\n\n') + '\n\nСтоимость доставки - ' + formatPrice(deliveryAmount) + ' рублей\n\nОбщий итог заказа — ' + formatPrice(orderTotalDiff) + ' рублей\n';
    } else {
        greenhouse = buildGreenhouseBlock(calc);
    }

    var giftsText = (optGiftsText !== undefined && optGiftsText !== null) ? String(optGiftsText || '').trim() : (typeof getGiftsTextForOrder === 'function' ? getGiftsTextForOrder() : (typeof getGiftsText === 'function' ? getGiftsText() : ''));
    if (giftsText && giftsText.trim()) greenhouse += '\n' + giftsText.trim() + '\n';

    var hasAssembly = calc && (!!(calc.assemblyText && String(calc.assemblyText).trim()) || !!(calc.bedsAssemblyText && String(calc.bedsAssemblyText).trim()));
    var footer = ORDER_FOOTER_BASE + (hasAssembly ? '\n\n' + ORDER_FOOTER_ASSEMBLY : '');

    return header + clientBlock + greenhouse + '\n' + footer;
}

function toggleOrderForm() {
    const card = document.getElementById('order-card');
    const collapse = document.getElementById('order-collapse');
    if (!card || !collapse) return;

    const isOpen = collapse.classList.contains('open');
    if (isOpen) {
        collapse.classList.remove('open');
        card.classList.remove('open');
    } else {
        collapse.classList.add('open');
        card.classList.add('open');
        // Защита от state leakage: при входе в «Оформление заказа» сбрасываем id редактирования,
        // чтобы отправка формы всегда создавала новый заказ, а не обновляла чужой.
        if (typeof currentOrderIdForEdit !== 'undefined') currentOrderIdForEdit = null;
        if (typeof currentOrderCreatedAtForEdit !== 'undefined') currentOrderCreatedAtForEdit = null;
        syncOrderFormDeliveryDate();
        if (typeof applyOrderFormDefaults === 'function') applyOrderFormDefaults();
        if (typeof updateOrderCartUI === 'function') updateOrderCartUI();
    }
}

/** Привязка логина калькулятора к имени менеджера в форме: Юлия/Ольга — логин = имя; Ирина — логин Manager10 */
var ORDER_FORM_LOGIN_TO_MANAGER = { 'manager10': 'Ирина' };

/** При открытии формы подставляем менеджера по умолчанию = текущий пользователь калькулятора (если есть в списке); источник не выбираем автоматом */
function applyOrderFormDefaults() {
  var managerEl = document.getElementById('order-manager');
  if (!managerEl || managerEl.value !== '') return;
  var savedLogin = typeof localStorage !== 'undefined' ? localStorage.getItem('savedLogin') : null;
  if (!savedLogin || !String(savedLogin).trim()) return;
  var login = savedLogin.trim().toLowerCase();
  var managerValue = ORDER_FORM_LOGIN_TO_MANAGER[login];
  if (managerValue) {
    managerEl.value = managerValue;
    return;
  }
  for (var i = 0; i < managerEl.options.length; i++) {
    var opt = managerEl.options[i];
    if (opt.value && opt.value.toLowerCase() === login) {
      managerEl.value = opt.value;
      break;
    }
  }
}

/** Установить дату доставки по умолчанию «сегодня», если ещё не задана (нет города/даты из калькулятора). */
function setOrderDeliveryDateDefaultToday_() {
    var hidden = document.getElementById('order-delivery-date');
    var display = document.getElementById('order-delivery-date-display');
    if (!hidden || !display || hidden.value) return;
    var now = new Date();
    var dd = String(now.getDate()).padStart(2, '0');
    var mm = String(now.getMonth() + 1).padStart(2, '0');
    var yyyy = now.getFullYear();
    var todayStr = dd + '.' + mm + '.' + yyyy;
    _orderCalSlots = buildDeliverySlots(todayStr);
    if (_orderCalSlots.length > 0) {
        _initCalendarWithDate(_orderCalSlots[0]);
    }
}

/** При открытии формы подставляем дату доставки и адрес из калькулятора */
function syncOrderFormDeliveryDate() {
    try {
        populateOrderDeliveryDate();
        syncOrderFormAddressFromCalculator();
        if (!currentDeliveryDate) {
            setOrderDeliveryDateDefaultToday_();
        }
    } catch (e) {
        console.error('syncOrderFormDeliveryDate error:', e);
    }
}

/* ═══════ Order Calendar Picker ═══════ */

var _orderCalMonth = null;      // {year, month} currently displayed
var _orderCalSlots = [];        // ISO strings of available delivery dates
var _orderCalSelected = '';     // currently selected ISO date
var ORDER_CAL_DAYS_AHEAD = 90;  // generate slots for N days ahead

/** Build available delivery slots: every day from base date for ORDER_CAL_DAYS_AHEAD days */
function buildDeliverySlots(baseDateStr) {
    var slots = [];
    if (!baseDateStr) return slots;
    var iso = deliveryDateDdMmToISO(baseDateStr);
    if (!iso) return slots;
    var parts = iso.split('-');
    var base = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    if (isNaN(base.getTime())) return slots;
    for (var i = 0; i < ORDER_CAL_DAYS_AHEAD; i++) {
        var d = new Date(base.getTime() + i * 86400000);
        slots.push(formatISOLocal(d));
    }
    return slots;
}

function formatISOLocal(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + dd;
}

/** Initialize / refresh the calendar with current delivery date data */
function populateOrderDeliveryDate() {
    var display = document.getElementById('order-delivery-date-display');
    var hidden = document.getElementById('order-delivery-date');
    if (!display || !hidden) return;

    var dateStr = currentDeliveryDate;

    if (!dateStr) {
        var city = typeof resolveCreateWarehouseCityKey_ === 'function' ? (resolveCreateWarehouseCityKey_() || '') : '';
        if (!city) {
            display.value = '';
            display.placeholder = '— Выберите город —';
            hidden.value = '';
            _orderCalSlots = [];
            _orderCalSelected = '';
            return;
        }
        // Не перезаписывать дату, если пользователь уже выбрал её в календаре формы (избегаем сброса 23.04 → первый слот при добавлении в корзину/раскрытии блока).
        if (hidden.value && hidden.value.trim()) return;
        loadDeliveryDate(city).then(function (loaded) {
            if (loaded) {
                _initCalendarWithDate(loaded);
            } else {
                display.value = '';
                display.placeholder = '— Нет даты для города —';
                hidden.value = '';
                _orderCalSlots = [];
            }
        }).catch(function (err) {
            console.error('populateOrderDeliveryDate async error:', err);
            display.value = '';
            display.placeholder = '— Ошибка загрузки —';
        });
        return;
    }

    _initCalendarWithDate(dateStr);
}

function _initCalendarWithDate(dateStr) {
    if (deliveryDatesFromCalendar) {
        syncOrderCalendarSlotsWithMode();
    } else {
        _orderCalSlots = buildDeliverySlots(dateStr);
        selectOrderCalDate(_orderCalSlots.length > 0 ? _orderCalSlots[0] : '');
    }
    var iso = deliveryDatesFromCalendar ? _orderCalSelected : (_orderCalSlots.length > 0 ? _orderCalSlots[0] : '');
    if (iso) {
        var parts = iso.split('-');
        _orderCalMonth = { year: +parts[0], month: +parts[1] - 1 };
    } else {
        var now = getMoscowTodayDateObject();
        _orderCalMonth = { year: now.getFullYear(), month: now.getMonth() };
    }
}

function selectOrderCalDate(iso) {
    _orderCalSelected = iso;
    var display = document.getElementById('order-delivery-date-display');
    var hidden = document.getElementById('order-delivery-date');
    if (display && hidden) {
        hidden.value = iso;
        if (iso) {
            var p = iso.split('-');
            display.value = p[2] + '.' + p[1] + '.' + p[0];
            display.placeholder = '';
        } else {
            display.value = '';
        }
    }
    var dateField = document.getElementById('of-date');
    if (dateField) {
        dateField.classList.remove('order-field-error');
        var msg = dateField.querySelector('.order-validation-msg');
        if (msg) msg.textContent = '';
    }
    if (typeof updateClientOfferFromShort === 'function') updateClientOfferFromShort();
}

function toggleOrderCalendar() {
    var cal = document.getElementById('order-calendar');
    if (!cal) return;
    var isOpen = cal.classList.contains('open');
    if (isOpen) {
        closeOrderCalendar();
        return;
    }
    var display = document.getElementById('order-delivery-date-display');
    if (display) display.classList.add('active');
    if (_orderCalSlots.length === 0) {
        var baseDateStr = currentDeliveryDate || '';
        if (!baseDateStr && display && display.value) {
            var v = display.value.trim();
            if (v && typeof deliveryDateDdMmToISO === 'function' && deliveryDateDdMmToISO(v)) baseDateStr = v;
        }
        if (!baseDateStr) {
            var now = getMoscowTodayDateObject();
            baseDateStr = String(now.getDate()).padStart(2, '0') + '.' + String(now.getMonth() + 1).padStart(2, '0') + '.' + now.getFullYear();
        }
        _initCalendarWithDate(baseDateStr);
    }
    if (!_orderCalMonth) {
        var now = getMoscowTodayDateObject();
        _orderCalMonth = { year: now.getFullYear(), month: now.getMonth() };
        if (_orderCalSelected) {
            var sp = _orderCalSelected.split('-');
            _orderCalMonth = { year: +sp[0], month: +sp[1] - 1 };
        }
    }
    renderOrderCalendar();
    cal.classList.add('open');
}

function closeOrderCalendar() {
    var cal = document.getElementById('order-calendar');
    if (cal) cal.classList.remove('open');
    var display = document.getElementById('order-delivery-date-display');
    if (display) display.classList.remove('active');
}

function orderCalNav(dir) {
    if (!_orderCalMonth) return;
    _orderCalMonth.month += dir;
    if (_orderCalMonth.month > 11) { _orderCalMonth.month = 0; _orderCalMonth.year++; }
    if (_orderCalMonth.month < 0) { _orderCalMonth.month = 11; _orderCalMonth.year--; }
    renderOrderCalendar();
}

function renderOrderCalendar() {
    var grid = document.getElementById('order-cal-grid');
    var titleEl = document.getElementById('order-cal-title');
    if (!grid || !titleEl || !_orderCalMonth) return;
    var todayISO = getTodayMoscowISO();

    var y = _orderCalMonth.year;
    var m = _orderCalMonth.month;
    var monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    titleEl.textContent = monthNames[m] + ' ' + y;

    var firstDay = new Date(y, m, 1);
    var startDow = (firstDay.getDay() + 6) % 7; // Mon=0
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var slotsSet = {};
    for (var i = 0; i < _orderCalSlots.length; i++) slotsSet[_orderCalSlots[i]] = true;
    var assemblyEl = document.getElementById('assembly');
    var withAssembly = assemblyEl ? assemblyEl.checked : false;

    grid.innerHTML = '';

    for (var blank = 0; blank < startDow; blank++) {
        var emptyCell = document.createElement('span');
        emptyCell.className = 'order-cal-day other-month';
        grid.appendChild(emptyCell);
    }

    for (var day = 1; day <= daysInMonth; day++) {
        var cellDate = new Date(y, m, day);
        var cellISO = formatISOLocal(cellDate);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = day;
        btn.className = 'order-cal-day';

        if (deliveryDatesFromCalendar) {
            var cellState = getDeliveryCalendarCellState(cellISO, withAssembly, todayISO);
            if (cellState === 'available') {
                btn.classList.add('available');
                btn.setAttribute('data-date', cellISO);
                btn.onclick = (function(iso) {
                    return function() {
                        selectOrderCalDate(iso);
                        renderOrderCalendar();
                        closeOrderCalendar();
                    };
                })(cellISO);
            } else if (cellState === 'blocked') {
                btn.style.background = '#fee2e2';
                btn.style.color = '#b91c1c';
                btn.style.cursor = 'not-allowed';
                btn.disabled = true;
            } else {
                btn.disabled = true;
            }
        } else if (slotsSet[cellISO]) {
            btn.classList.add('available');
            btn.setAttribute('data-date', cellISO);
            btn.onclick = (function(iso) {
                return function() {
                    selectOrderCalDate(iso);
                    renderOrderCalendar();
                    closeOrderCalendar();
                };
            })(cellISO);
        }
        if (cellISO === _orderCalSelected) btn.classList.add('selected');
        if (!deliveryDatesFromCalendar && cellISO === todayISO) btn.classList.add('today');
        grid.appendChild(btn);
    }
}

// Close calendar on outside click (обёртка основной формы — по id календаря, т.к. первый .order-calendar-wrapper в DOM у модалки)
document.addEventListener('click', function(e) {
    var mainCal = document.getElementById('order-calendar');
    var mainWrapper = mainCal && mainCal.closest ? mainCal.closest('.order-calendar-wrapper') : null;
    if (mainWrapper && !mainWrapper.contains(e.target)) {
        closeOrderCalendar();
    }
    var editWrapper = document.querySelector('.edit-order-calendar-wrapper');
    if (editWrapper && !editWrapper.contains(e.target)) {
        closeEditOrderCalendar();
    }
});

document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'edit-order-add-assembly' && deliveryDatesFromCalendar) {
        syncEditOrderCalendarSlotsWithMode();
        var cal = document.getElementById('edit-order-calendar');
        if (cal && cal.classList.contains('open')) {
            if (typeof renderEditOrderCalendar === 'function') renderEditOrderCalendar();
        }
    }
});

// --- Календарь даты доставки в модалке «Редактирование заказа» (привязка к датам доставки по городу, как в оформлении) ---
var _editOrderCalMonth = null;
var _editOrderCalSelected = '';
var _editOrderCalSlots = [];   // зелёные зоны: слоты из delivery_dates по городу (или fallback)
var EDIT_ORDER_CAL_DAYS_AHEAD = 90;

/** Fallback: 90 дней от сегодня или от выбранной даты (если заказ старый — его дата всё равно доступна). */
function buildEditOrderCalSlotsFallback() {
    var base = getMoscowTodayDateObject();
    if (_editOrderCalSelected) {
        var p = _editOrderCalSelected.split('-');
        if (p.length === 3) {
            var sel = new Date(+p[0], +p[1] - 1, +p[2]);
            if (sel.getTime() < base.getTime()) base = sel;
        }
    }
    var slots = [];
    for (var i = 0; i < EDIT_ORDER_CAL_DAYS_AHEAD; i++) {
        var d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
        slots.push(formatISOLocal(d));
    }
    return slots;
}

function selectEditOrderCalDate(iso) {
    _editOrderCalSelected = iso;
    var display = document.getElementById('edit-order-delivery-date-display');
    var hidden = document.getElementById('edit-order-delivery-date');
    if (display && hidden) {
        hidden.value = iso;
        if (iso) {
            var p = iso.split('-');
            display.value = p[2] + '.' + p[1] + '.' + p[0];
            display.placeholder = '';
        } else {
            display.value = '';
        }
    }
    var dateField = document.getElementById('eo-date');
    if (dateField) {
        dateField.classList.remove('order-field-error');
        var msg = dateField.querySelector('.edit-order-validation-msg');
        if (msg) msg.textContent = '';
    }
}

function toggleEditOrderCalendar() {
    var cal = document.getElementById('edit-order-calendar');
    if (!cal) return;
    var isOpen = cal.classList.contains('open');
    if (isOpen) {
        closeEditOrderCalendar();
        return;
    }
    var display = document.getElementById('edit-order-delivery-date-display');
    if (display) display.classList.add('active');
    if (!_editOrderCalMonth) {
        if (_editOrderCalSelected) {
            var sp = _editOrderCalSelected.split('-');
            _editOrderCalMonth = { year: +sp[0], month: +sp[1] - 1 };
        } else {
            var now = getMoscowTodayDateObject();
            _editOrderCalMonth = { year: now.getFullYear(), month: now.getMonth() };
        }
    }
    // city для edit calendar: primary = orders.city, fallback 1 = line_items[].city, fallback 2 = derive from address
    var canonicalCity = typeof resolveEditOrderCalendarCity_ === 'function'
        ? resolveEditOrderCalendarCity_()
        : null;
    if (canonicalCity && _savedDeliveryDateState === null) {
        _savedDeliveryDateState = {
            date: currentDeliveryDate,
            assembly: typeof currentDeliveryAssemblyDate !== 'undefined' ? currentDeliveryAssemblyDate : null,
            restrictions: typeof currentDeliveryRestrictions !== 'undefined' ? currentDeliveryRestrictions : null,
            fromCalendar: deliveryDatesFromCalendar,
            stateMap: currentDeliveryDateStateMap
        };
    }
    if (canonicalCity) {
        deliveryDatesFromCalendar = false;
        currentDeliveryDateStateMap = Object.create(null);
    }
    _editOrderCalSlots = canonicalCity ? [] : buildEditOrderCalSlotsFallback();
    renderEditOrderCalendar();
    cal.classList.add('open');
    if (canonicalCity && typeof loadDeliveryDate === 'function' && typeof buildDeliverySlots === 'function') {
        loadDeliveryDate(canonicalCity).then(function () {
            if (deliveryDatesFromCalendar) {
                syncEditOrderCalendarSlotsWithMode();
            } else {
                _editOrderCalSlots = currentDeliveryDate ? buildDeliverySlots(currentDeliveryDate) : [];
                if (!_editOrderCalSlots.length) _editOrderCalSlots = buildEditOrderCalSlotsFallback();
            }
            renderEditOrderCalendar();
        }).catch(function () {
            _editOrderCalSlots = buildEditOrderCalSlotsFallback();
            renderEditOrderCalendar();
        });
    }
}

function closeEditOrderCalendar() {
    var cal = document.getElementById('edit-order-calendar');
    if (cal) cal.classList.remove('open');
    var display = document.getElementById('edit-order-delivery-date-display');
    if (display) display.classList.remove('active');
}

function editOrderCalNav(dir) {
    if (!_editOrderCalMonth) return;
    _editOrderCalMonth.month += dir;
    if (_editOrderCalMonth.month > 11) { _editOrderCalMonth.month = 0; _editOrderCalMonth.year++; }
    if (_editOrderCalMonth.month < 0) { _editOrderCalMonth.month = 11; _editOrderCalMonth.year--; }
    renderEditOrderCalendar();
}

function renderEditOrderCalendar() {
    var grid = document.getElementById('edit-order-cal-grid');
    var titleEl = document.getElementById('edit-order-cal-title');
    if (!grid || !titleEl || !_editOrderCalMonth) return;
    var todayISO = getTodayMoscowISO();
    var editCityVal = (document.getElementById('edit-order-address-part1') && document.getElementById('edit-order-address-part1').value) ? document.getElementById('edit-order-address-part1').value.trim() : '';
    var slots = _editOrderCalSlots || [];
    var slotsSet = {};
    for (var i = 0; i < slots.length; i++) slotsSet[slots[i]] = true;
    if (_editOrderCalSelected) slotsSet[_editOrderCalSelected] = true;

    var y = _editOrderCalMonth.year;
    var m = _editOrderCalMonth.month;
    var monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    titleEl.textContent = monthNames[m] + ' ' + y;

    var firstDay = new Date(y, m, 1);
    var startDow = (firstDay.getDay() + 6) % 7;
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var assemblyEditEl = document.getElementById('edit-order-add-assembly');
    var withAssemblyEdit = assemblyEditEl ? assemblyEditEl.checked : false;

    grid.innerHTML = '';
    for (var blank = 0; blank < startDow; blank++) {
        var emptyCell = document.createElement('span');
        emptyCell.className = 'order-cal-day other-month';
        grid.appendChild(emptyCell);
    }
    for (var day = 1; day <= daysInMonth; day++) {
        var cellDate = new Date(y, m, day);
        var cellISO = formatISOLocal(cellDate);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = day;
        btn.className = 'order-cal-day';

        if (deliveryDatesFromCalendar) {
            var editCellState = getDeliveryCalendarCellState(cellISO, withAssemblyEdit, todayISO);
            if (editCellState === 'available') {
                btn.classList.add('available');
                btn.setAttribute('data-date', cellISO);
                btn.onclick = (function(iso) {
                    return function() {
                        selectEditOrderCalDate(iso);
                        renderEditOrderCalendar();
                        closeEditOrderCalendar();
                    };
                })(cellISO);
            } else if (editCellState === 'blocked') {
                btn.style.background = '#fee2e2';
                btn.style.color = '#b91c1c';
                btn.style.cursor = 'not-allowed';
                btn.disabled = true;
            } else {
                btn.disabled = true;
            }
        } else if (slotsSet[cellISO]) {
            btn.classList.add('available');
            btn.setAttribute('data-date', cellISO);
            btn.onclick = (function(iso) {
                return function() {
                    selectEditOrderCalDate(iso);
                    renderEditOrderCalendar();
                    closeEditOrderCalendar();
                };
            })(cellISO);
        }
        if (cellISO === _editOrderCalSelected) btn.classList.add('selected');
        if (!deliveryDatesFromCalendar && cellISO === todayISO) btn.classList.add('today');
        grid.appendChild(btn);
    }
}

/** Подставить адрес доставки из поля калькулятора в 3 поля формы (можно потом править вручную) */
/** Копирует адрес из поля «Введите адрес доставки» в три поля оформления. Та же логика разбора, что и везде: два фрагмента → регион+город (part1). */
function syncOrderFormAddressFromCalculator() {
    const raw = document.getElementById('address')?.value?.trim() || '';
    const p1 = document.getElementById('order-address-part1');
    const p2 = document.getElementById('order-address-part2');
    const p3 = document.getElementById('order-address-part3');
    if (!p1 || !p2 || !p3) return;
    var parsed = parseAddressToParts_(raw);
    p1.value = parsed.part1;
    p2.value = parsed.part2;
    p3.value = parsed.part3;
}

/** "15.02" или "15.02.2026" -> "2026-02-15" */
function deliveryDateDdMmToISO(ddMm) {
    const parts = ddMm.split('.');
    if (parts.length < 2) return null;
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2] || new Date().getFullYear();
    return `${y}-${m}-${d}`;
}

/** "15.02" или "15.02.2026" -> "15.02.2026" для отображения */
function formatDdMmYyyy(ddMm) {
    const parts = ddMm.split('.');
    if (parts.length < 2) return ddMm;
    const y = parts[2] || new Date().getFullYear();
    return parts[0].padStart(2, '0') + '.' + parts[1].padStart(2, '0') + '.' + y;
}

function toggleOrderHouseField() {
    const noPlot = document.getElementById('order-no-plot');
    const part3 = document.getElementById('order-address-part3');
    if (!noPlot || !part3) return;
    if (noPlot.checked) {
        part3.disabled = true;
        part3.value = '';
        part3.removeAttribute('required');
    } else {
        part3.disabled = false;
        part3.setAttribute('required', 'required');
    }
}

/** Доставка обязательна всегда: дата + адрес (регион, улица, дом) нужны и при оформлении, и при редактировании. Исключений нет. */
function isOrderFormAddressRequired() {
    return true;
}

/** Проверить по Supabase, есть ли заказы с этим телефоном за последние 90 дней. Показать неблокирующее предупреждение под полем телефона. */
function checkSimilarOrderWarning() {
    var phoneEl = document.getElementById('order-client-phone');
    var warnEl = document.getElementById('order-similar-order-warning');
    if (!phoneEl || !warnEl) return;
    var raw = (phoneEl.value || '').trim();
    var normalized = typeof normalizePhone === 'function' ? normalizePhone(raw) : raw.replace(/\D/g, '');
    if (typeof isValidPhone11 !== 'function' || !isValidPhone11(normalized)) {
        warnEl.classList.add('hidden');
        warnEl.textContent = '';
        return;
    }
    var fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 90);
    var fromIso = fromDate.toISOString();
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        warnEl.classList.add('hidden');
        return;
    }
    supabaseClient.from('orders').select('id').eq('client_phone', normalized).gte('created_at', fromIso).limit(1).then(function (res) {
        if (res.error) return;
        var count = (res.data && res.data.length) ? 1 : 0;
        if (count > 0) {
            warnEl.textContent = 'По этому номеру за последние 90 дней уже есть заказы. Проверьте, не дубль ли.';
            warnEl.classList.remove('hidden');
        } else {
            warnEl.textContent = '';
            warnEl.classList.add('hidden');
        }
    });
}

function clearOrderFieldErrors_() {
    var collapse = document.getElementById('order-collapse');
    if (collapse) {
        collapse.querySelectorAll('.order-field-error').forEach(function (el) { el.classList.remove('order-field-error'); });
        collapse.querySelectorAll('.order-validation-msg').forEach(function (el) { el.textContent = ''; });
    }
    var w = document.getElementById('order-calc-warning');
    if (w) w.classList.remove('visible');
}

/** Пометить поле ошибкой и показать текст рядом с полем (для формы оформления заказа). */
function setOrderFieldError_(fieldId, message) {
    var wrapper = document.getElementById(fieldId);
    if (!wrapper) return;
    wrapper.classList.add('order-field-error');
    var msgEl = wrapper.querySelector('.order-validation-msg');
    if (msgEl) msgEl.textContent = message || '';
}

function markOrderFieldError_(fieldId) {
    var el = document.getElementById(fieldId);
    if (el) el.classList.add('order-field-error');
}

(function initOrderFieldAutoReset() {
    const ids = [
        'order-client-name', 'order-client-phone', 'order-delivery-date-display',
        'order-address-part1', 'order-address-part2', 'order-address-part3',
        'order-source', 'order-manager'
    ];
    var handler = function () {
        var wrapper = this.closest('.order-field');
        if (wrapper) {
            wrapper.classList.remove('order-field-error');
            var msg = wrapper.querySelector('.order-validation-msg');
            if (msg) msg.textContent = '';
        }
    };
    document.addEventListener('DOMContentLoaded', () => {
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', handler);
                el.addEventListener('change', handler);
            }
        });
        // Телефон: только цифры, ровно до 11 (формат 79211234567). 8 в начале → 7.
        const phoneInput = document.getElementById('order-client-phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function() {
                let digits = this.value.replace(/\D/g, '').slice(0, 11);
                if (digits.length === 11 && digits[0] === '8') digits = '7' + digits.slice(1);
                if (digits.length === 10 && digits[0] !== '7') digits = '7' + digits;
                this.value = digits;
            });
            phoneInput.addEventListener('blur', function () {
                if (typeof checkSimilarOrderWarning === 'function') checkSimilarOrderWarning();
            });
        }
        updateOrderCartUI();

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && e.ctrlKey) {
                var collapse = document.getElementById('order-collapse');
                if (collapse && collapse.classList.contains('open')) {
                    e.preventDefault();
                    if (typeof submitOrder === 'function') submitOrder();
                }
            }
        });
        // Защита от state leakage: при фокусе в любом поле формы «Оформление заказа» сбрасываем id редактирования.
        var orderCollapseEl = document.getElementById('order-collapse');
        if (orderCollapseEl) {
            orderCollapseEl.addEventListener('focusin', function (e) {
                if (e.target && (e.target.matches('input, select, textarea'))) {
                    if (typeof currentOrderIdForEdit !== 'undefined') currentOrderIdForEdit = null;
                    if (typeof currentOrderCreatedAtForEdit !== 'undefined') currentOrderCreatedAtForEdit = null;
                }
            });
        }
    });
})();

// ───── Корзина заказа (несколько разных теплиц в одном заказе) ─────
/** Собрать снимок опций из DOM и localStorage для восстановления в калькуляторе по «Изменить». */
function getOrderCartOptionsSnapshot() {
  var bracingEl = document.getElementById('bracing');
  var groundHooksEl = document.getElementById('ground-hooks');
  var assemblyEl = document.getElementById('assembly');
  var onWoodEl = document.getElementById('on-wood');
  var onConcreteEl = document.getElementById('on-concrete');
  var selectedBeds = {};
  try {
    selectedBeds = JSON.parse(localStorage.getItem('selectedBeds') || '{}');
  } catch (e) {}
  var bedsAssemblyEnabled = localStorage.getItem('bedsAssemblyEnabled') === 'true';
  var additionalProducts = [];
  var productSelects = document.querySelectorAll('.additional-products .product-item select');
  for (var s = 0; s < productSelects.length; s++) {
    var select = productSelects[s];
    var quantity = parseInt(select.value, 10);
    if (quantity > 0) {
      var nameEl = select.parentElement ? select.parentElement.querySelector('.product-name') : null;
      var name_ = nameEl ? nameEl.textContent.trim() : '';
      if (name_.toLowerCase().indexOf('перегородка') !== -1) continue;
      additionalProducts.push({ name: name_, quantity: quantity });
    }
  }
  return {
    bracing: bracingEl ? bracingEl.checked : false,
    groundHooks: groundHooksEl ? groundHooksEl.checked : false,
    assembly: assemblyEl ? assemblyEl.checked : false,
    onWood: onWoodEl ? onWoodEl.checked : false,
    onConcrete: onConcreteEl ? onConcreteEl.checked : false,
    selectedBeds: selectedBeds,
    bedsAssemblyEnabled: bedsAssemblyEnabled,
    additionalProducts: additionalProducts
  };
}

function addToOrderCart() {
  if (!lastCalculation || !lastCalculation.model) return;
  var itemTotal = (lastCalculation.basePrice || 0) + (lastCalculation.assemblyCost || 0) + (lastCalculation.foundationCost || 0) + (lastCalculation.additionalProductsCost || 0);
  var opts = getOrderCartOptionsSnapshot();
  var newItem = {
    model: lastCalculation.model,
    width: lastCalculation.width,
    length: lastCalculation.length,
    frame: lastCalculation.frame,
    arcStep: lastCalculation.arcStep,
    polycarbonate: lastCalculation.polycarbonate,
    basePrice: lastCalculation.basePrice,
    assemblyCost: lastCalculation.assemblyCost,
    foundationCost: lastCalculation.foundationCost,
    additionalProductsCost: lastCalculation.additionalProductsCost,
    deliveryPrice: lastCalculation.deliveryPrice,
    foundationText: lastCalculation.foundationText,
    assemblyText: lastCalculation.assemblyText,
    bedsAssemblyText: lastCalculation.bedsAssemblyText,
    additionalProductsText: lastCalculation.additionalProductsText,
    address: lastCalculation.address,
    city: lastCalculation.city,
    form: lastCalculation.form,
    height: lastCalculation.height,
    snowLoad: lastCalculation.snowLoad,
    equipment: lastCalculation.equipment,
    horizontalTies: lastCalculation.horizontalTies,
    itemTotal: itemTotal,
    finalTotalPrice: itemTotal + (lastCalculation.deliveryPrice || 0),
    bracing: opts.bracing,
    groundHooks: opts.groundHooks,
    assembly: opts.assembly,
    onWood: opts.onWood,
    onConcrete: opts.onConcrete,
    selectedBeds: opts.selectedBeds,
    bedsAssemblyEnabled: opts.bedsAssemblyEnabled,
    additionalProducts: opts.additionalProducts
  };
  if (orderCartEditingIndex !== null && orderCartEditingIndex >= 0 && orderCartEditingIndex < orderCart.length) {
    orderCart[orderCartEditingIndex] = newItem;
    orderCartEditingIndex = null;
    if (typeof showToast === 'function') showToast('Позиция в заказе обновлена', 'success', null, 4000);
  } else {
    orderCart.push(newItem);
    if (typeof showToast === 'function') showToast('Теплица добавлена в заказ', 'success', null, 4000);
  }
  updateOrderCartUI();

  var card = document.getElementById('order-card');
  var collapse = document.getElementById('order-collapse');
  if (card && collapse && !collapse.classList.contains('open')) {
    collapse.classList.add('open');
    card.classList.add('open');
    if (typeof syncOrderFormDeliveryDate === 'function') syncOrderFormDeliveryDate();
    if (typeof updateOrderCartUI === 'function') updateOrderCartUI();
  }

  // Прокрутка к блоку оформления заказа (этап 2.1): пользователя «уводит» к форме и составу
  var scrollTarget = card || collapse;
  if (scrollTarget) {
    var reduceMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollTarget.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }
}

function removeFromOrderCart(index) {
  orderCart.splice(index, 1);
  if (orderCartEditingIndex === index) orderCartEditingIndex = null;
  else if (orderCartEditingIndex !== null && orderCartEditingIndex > index) orderCartEditingIndex--;
  renderOrderCart();
  updateOrderTotalDisplay_();
}

/**
 * Подставить позицию заказа в калькулятор для редактирования (кнопка «Изменить»).
 * Восстанавливает город, форму, размеры, каркас, поликарбонат, шаг дуг, чекбоксы, грядки (localStorage + UI), доп. товары.
 */
async function editOrderCartItem(index) {
  if (!orderCart[index]) return;
  var item = orderCart[index];
  orderCartEditingIndex = index;

  var cityEl = document.getElementById('city');
  var formEl = document.getElementById('form');
  var widthEl = document.getElementById('width');
  var lengthEl = document.getElementById('length');
  var frameEl = document.getElementById('frame');
  var polyEl = document.getElementById('polycarbonate');
  var arcStepEl = document.getElementById('arcStep');
  if (!cityEl || !formEl || !widthEl || !lengthEl || !frameEl || !polyEl || !arcStepEl) return;

  if (cityEl.value !== (item.city || '')) {
    cityEl.value = item.city || '';
    await onCityChange();
  }
  formEl.value = item.form || '';
  onFormChange();
  widthEl.value = item.width != null ? String(item.width) : '';
  onWidthChange();
  lengthEl.value = item.length != null ? String(item.length) : '';
  onLengthChange();
  frameEl.value = (item.frame || '').trim();
  onFrameChange();
  if (polyEl.options.length) {
    var polyVal = (item.polycarbonate || '').trim();
    for (var o = 0; o < polyEl.options.length; o++) {
      if (normalizeString(polyEl.options[o].value) === normalizeString(polyVal)) {
        polyEl.value = polyEl.options[o].value;
        break;
      }
    }
  }
  var arcVal = item.arcStep != null ? String(item.arcStep) : '1';
  if (arcStepEl.querySelector('option[value="' + arcVal.replace(/"/g, '&quot;') + '"]')) arcStepEl.value = arcVal;

  var bracingEl = document.getElementById('bracing');
  var groundHooksEl = document.getElementById('ground-hooks');
  var assemblyEl = document.getElementById('assembly');
  var onWoodEl = document.getElementById('on-wood');
  var onConcreteEl = document.getElementById('on-concrete');
  if (bracingEl) bracingEl.checked = !!item.bracing;
  if (groundHooksEl) groundHooksEl.checked = !!item.groundHooks;
  if (assemblyEl) assemblyEl.checked = !!item.assembly;
  if (onWoodEl) onWoodEl.checked = !!item.onWood;
  if (onConcreteEl) onConcreteEl.checked = !!item.onConcrete;

  var beds = item.selectedBeds && typeof item.selectedBeds === 'object' ? item.selectedBeds : {};
  var bedsAssembly = !!item.bedsAssemblyEnabled;
  try {
    localStorage.setItem('selectedBeds', JSON.stringify(beds));
    localStorage.setItem('bedsAssemblyEnabled', bedsAssembly ? 'true' : 'false');
  } catch (e) {}
  if (typeof selectedBeds !== 'undefined') selectedBeds = beds;
  if (typeof bedsAssemblyEnabled !== 'undefined') bedsAssemblyEnabled = bedsAssembly;
  if (typeof updateBedsCounter === 'function') updateBedsCounter();
  if (typeof updateBedsClearButton === 'function') updateBedsClearButton();

  var productSelects = document.querySelectorAll('.additional-products .product-item select');
  var additionalProducts = item.additionalProducts && Array.isArray(item.additionalProducts) ? item.additionalProducts : [];
  productSelects.forEach(function (select) {
    var nameEl = select.parentElement ? select.parentElement.querySelector('.product-name') : null;
    var name_ = nameEl ? nameEl.textContent.trim() : '';
    var found = additionalProducts.find(function (p) { return (p.name || '').trim() === name_; });
    select.value = found && found.quantity > 0 ? String(found.quantity) : '0';
  });

  var city = (item.city || '').trim();
  var form = (item.form || '').trim();
  var width = parseFloat(item.width);
  var length_ = parseFloat(item.length);
  var frame = (item.frame || '').trim();
  var polycarbonate = (item.polycarbonate || '').trim();
  var arcStep = parseFloat(item.arcStep);
  if (isNaN(arcStep)) arcStep = 1;
  await performCalculation(city, form, width, length_, frame, polycarbonate, arcStep);

  var scrollTarget = document.getElementById('order-add-to-cart-btn');
  if (scrollTarget) {
    var reduceMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollTarget.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }
  if (typeof showToast === 'function') showToast('Измените при необходимости и нажмите «Добавить в заказ» — позиция заменится', 'success', null, 5000);
}

function getOrderCartTotal() {
  if (orderCart.length === 0) return 0;
  var sum = orderCart.reduce(function (acc, item) { return acc + (item.itemTotal || 0); }, 0);
  var delivery = (orderCart[0] && orderCart[0].deliveryPrice) || (lastCalculation && lastCalculation.deliveryPrice) || 0;
  return Math.ceil((sum + delivery) / 10) * 10;
}

function renderOrderCart() {
  var block = document.getElementById('order-cart-block');
  var list = document.getElementById('order-cart-list');
  if (!block || !list) return;
  if (orderCart.length === 0) {
    block.style.display = 'none';
    return;
  }
  block.style.display = '';
  var html = '';
    orderCart.forEach(function (item, i) {
    var text = greenhouseTitle_(item.model, item.width, item.length);
    var basePrice = item.basePrice != null && !isNaN(Number(item.basePrice)) ? Number(item.basePrice) : 0;
    var priceFormatted = typeof formatPrice === 'function' ? formatPrice(basePrice) : basePrice;
    var lines = [];
    function pushLines(str) {
      if (!str || !String(str).trim()) return;
      String(str).trim().split(/\r?\n/).forEach(function (line) {
        var t = line.trim();
        if (t) lines.push(t);
      });
    }
    pushLines(item.foundationText);
    pushLines(item.assemblyText);
    pushLines(item.additionalProductsText);
    pushLines(item.bedsAssemblyText);
    var extrasHtml = '';
    lines.forEach(function (line) {
      extrasHtml += '<div class="edit-order-composition-item__extras-line">' + escapeHtml(line) + '</div>';
    });
    html += buildOrderCompositionItemHtml({ text: text, priceFormatted: priceFormatted, extrasHtml: extrasHtml, index: i, showEditButton: true, showDeleteButton: true });
  });
  var cartDelivery = (orderCart[0] && orderCart[0].deliveryPrice != null) ? orderCart[0].deliveryPrice : (lastCalculation && lastCalculation.deliveryPrice != null ? lastCalculation.deliveryPrice : deliveryCost);
  if (cartDelivery > 0) {
    html += '<div class="edit-order-composition-item"><span class="edit-order-composition-item__text">Доставка</span><span class="edit-order-composition-item__price">' + escapeHtml(typeof formatPrice === 'function' ? formatPrice(cartDelivery) : cartDelivery) + ' ₽</span></div>';
  }
  list.innerHTML = html;
  list.querySelectorAll('.edit-order-composition-item__btn--edit').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var row = this.closest('.edit-order-composition-item');
      if (row) {
        var idx = parseInt(row.getAttribute('data-index'), 10);
        if (!isNaN(idx) && idx >= 0 && typeof editOrderCartItem === 'function') editOrderCartItem(idx);
      }
    });
  });
  list.querySelectorAll('.edit-order-composition-item__btn--del').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var row = this.closest('.edit-order-composition-item');
      if (row) {
        var idx = parseInt(row.getAttribute('data-index'), 10);
        if (!isNaN(idx) && idx >= 0) removeFromOrderCart(idx);
      }
    });
  });
}

function updateOrderCartUI() {
  var addBtn = document.getElementById('order-add-to-cart-btn');
  var canAdd = !!(lastCalculation && lastCalculation.model);
  if (addBtn) {
    addBtn.disabled = !canAdd;
    addBtn.title = canAdd ? 'Добавить текущую комплектацию в заказ' : 'Сначала нажмите «Обновить расчёт» в блоке «Стоимость теплицы»';
  }
  var warn = document.getElementById('order-calc-warning');
  if (warn) warn.classList.toggle('visible', orderCart.length === 0);
  renderOrderCart();
  updateOrderTotalDisplay_();
  if (orderCart.length > 0 && typeof updateGiftsBlock === 'function' && typeof getOrderCartTotal === 'function') updateGiftsBlock(getOrderCartTotal());
  if (typeof updateClientOfferFromShort === 'function') updateClientOfferFromShort();
}

function updateOrderTotalDisplay_() {
  var el = document.getElementById('order-total-display');
  if (!el) return;
  if (orderCart.length > 0) {
    el.textContent = 'Итого к оплате: ' + formatPrice(getOrderCartTotal()) + ' ₽';
  } else {
    el.textContent = 'Итого к оплате: —';
  }
  var giftsEl = document.getElementById('order-gifts-display');
  if (giftsEl && typeof getGiftsTextForOrder === 'function') {
    var giftsText = getGiftsTextForOrder();
    if (giftsText && giftsText.trim()) {
      giftsEl.textContent = giftsText.trim();
      giftsEl.style.display = '';
    } else {
      giftsEl.textContent = '';
      giftsEl.style.display = 'none';
    }
  }
}

/**
 * Собирает объект заказа для Supabase из текущей формы и корзины.
 * Используется и при создании (insert), и при обновлении (update) заказа.
 * @returns {Object} orderData — поля для orders (без id, created_at)
 */
function buildOrderPayloadFromFormAndCart() {
    const clientName = document.getElementById('order-client-name').value.trim();
    const clientPhone = document.getElementById('order-client-phone').value.trim();
    const deliveryDate = document.getElementById('order-delivery-date').value;
    const addr1 = document.getElementById('order-address-part1')?.value?.trim() || '';
    const addr2 = document.getElementById('order-address-part2')?.value?.trim() || '';
    const addr3 = document.getElementById('order-address-part3')?.value?.trim() || '';
    const noPlot = document.getElementById('order-no-plot')?.checked || false;
    const source = document.getElementById('order-source').value;
    const manager = document.getElementById('order-manager').value;
    const comment = document.getElementById('order-comment').value.trim();

    const fullAddress = [addr1, addr2, noPlot ? 'без номера участка' : addr3].filter(Boolean).join(', ');
    var effectiveCalc = orderCart[0];
    var warehouseCityKey = (effectiveCalc && effectiveCalc.city) ? String(effectiveCalc.city).trim() : '';
    const client = { name: clientName, phone: normalizePhone(clientPhone), deliveryDate: deliveryDate, manager: manager, address: fullAddress };
    const commercialOffer = generateFullOrderTemplate(effectiveCalc, client, orderCart);
    const giftsText = (typeof getGiftsTextForOrder === 'function' ? getGiftsTextForOrder() : (typeof getGiftsText === 'function' ? getGiftsText() : '')) || '';
    var totalRounded = getOrderCartTotal();
    // Финальная граница: если сумма ниже порога — не сохраняем подарок (как в buildOrderPayloadFromEditModal)
    var giftForPayload = (totalRounded >= GIFT_THRESHOLDS.slot1) ? giftsText : '';
    var effectiveQuantity = orderCart.length;
    var commentWithQuantity = comment;

    function lineWithQty(text, qty) {
        if (!text || !String(text).trim() || qty < 1) return [];
        var out = [];
        String(text).trim().split(/\n+/).forEach(function (line) {
            line = line.trim();
            if (!line) return;
            var m = line.match(/^(.+?)\s*[-–]\s*([\d\s.]+)\s*рублей?\s*$/i);
            if (m) {
                var price = parseInt(String(m[2]).replace(/\s/g, '').replace(/\./g, ''), 10);
                if (!isNaN(price)) out.push(m[1].trim() + ' - ' + formatPrice(price) + ' рублей х' + qty + ' - ' + formatPrice(price * qty) + ' рублей');
                else out.push(line);
            } else out.push(line);
        });
        return out;
    }

    var extrasForSheet = '';
    var assemblyForSheet = '';
    var lineItemsJson = null;
    var isIdenticalCart = orderCart.length >= 2 && orderCart.every(function (item) {
        var first = orderCart[0];
        return item.model === first.model && item.width === first.width && item.length === first.length && item.frame === first.frame;
    });
    if (orderCart.length >= 2 && !isIdenticalCart) {
        lineItemsJson = JSON.stringify(orderCart.map(function (item) {
            return {
                model: item.model,
                width: item.width,
                length: item.length,
                frame: item.frame,
                arc_step: item.arcStep,
                polycarbonate: item.polycarbonate,
                extras: [(item.foundationText || ''), (item.additionalProductsText || '')].filter(Boolean).map(function (s) { return String(s).replace(/^\n+/, ''); }).join('\n').trim() || '',
                assembly: [(item.assemblyText || ''), (item.bedsAssemblyText || '')].filter(Boolean).map(function (s) { return String(s).replace(/^\n+/, ''); }).join('\n').trim() || '',
                item_total: item.itemTotal || 0
            };
        }));
    }
    if (orderCart.length >= 2 && isIdenticalCart) {
        var qty = orderCart.length;
        var productLines = lineWithQty(effectiveCalc.foundationText, qty).concat(lineWithQty(effectiveCalc.additionalProductsText, qty));
        extrasForSheet = productLines.join('; ');
        var assemblyLines = lineWithQty(effectiveCalc.assemblyText, qty).concat(lineWithQty(effectiveCalc.bedsAssemblyText, qty));
        assemblyForSheet = assemblyLines.join('; ');
    } else if (orderCart.length === 1) {
        extrasForSheet = [(effectiveCalc.foundationText || ''), (effectiveCalc.additionalProductsText || '')].filter(Boolean).map(function (s) { return String(s).replace(/^\n+/, ''); }).join('\n').trim() || '';
        assemblyForSheet = [(effectiveCalc.assemblyText || ''), (effectiveCalc.bedsAssemblyText || '')].filter(Boolean).map(function (s) { return String(s).replace(/^\n+/, ''); }).join('\n').trim() || '';
    }

    const orderData = {
        manager: manager,
        source: source,
        logged_in_user: localStorage.getItem('currentUser') || '',
        client_name: clientName,
        client_phone: normalizePhone(clientPhone),
        delivery_date: deliveryDate && deliveryDate.includes('-') ? formatDateRu(deliveryDate) : deliveryDate,
        delivery_address: fullAddress,
        warehouse_city_key: warehouseCityKey || null,
        city: extractCityFromAddress(fullAddress) || extractCityFromAddress((effectiveCalc && effectiveCalc.address) || '') || (effectiveCalc && effectiveCalc.city) || '',
        model: effectiveCalc.model,
        width: String(effectiveCalc.width || ''),
        length: String(effectiveCalc.length || ''),
        frame: effectiveCalc.frame,
        arc_step: String(effectiveCalc.arcStep || ''),
        polycarbonate: effectiveCalc.polycarbonate,
        unit_price: effectiveCalc.basePrice,
        quantity: effectiveQuantity,
        extras: extrasForSheet,
        gift: giftForPayload || '',
        assembly: assemblyForSheet,
        delivery_cost: (effectiveCalc && effectiveCalc.deliveryPrice) || 0,
        total: totalRounded,
        comment: commentWithQuantity,
        commercial_offer: commercialOffer
    };
    if (lineItemsJson) orderData.line_items = lineItemsJson;
    return orderData;
}

async function submitOrder() {
    const resultDiv = document.getElementById('order-result');
    clearOrderFieldErrors_();

    if (orderCart.length === 0) {
        var w = document.getElementById('order-calc-warning');
        if (w) w.classList.add('visible');
        resultDiv.textContent = '❌ Добавьте теплицу в заказ: нажмите «Добавить в заказ» (после расчёта в блоке «Стоимость теплицы»).';
        resultDiv.className = 'error';
        resultDiv.style.display = '';
        return;
    }

    const clientName = document.getElementById('order-client-name').value.trim();
    const clientPhone = document.getElementById('order-client-phone').value.trim();
    const deliveryDate = document.getElementById('order-delivery-date').value;
    const addr1 = document.getElementById('order-address-part1')?.value?.trim() || '';
    const addr2 = document.getElementById('order-address-part2')?.value?.trim() || '';
    const addr3 = document.getElementById('order-address-part3')?.value?.trim() || '';
    const noPlot = document.getElementById('order-no-plot')?.checked || false;
    const source = document.getElementById('order-source').value;
    const manager = document.getElementById('order-manager').value;
    const comment = document.getElementById('order-comment').value.trim();

    let hasErrors = false;
    const errors = [];

    if (!clientName) {
        setOrderFieldError_('of-name', 'Введите имя клиента');
        errors.push('имя клиента');
        hasErrors = true;
    }

    var phone = normalizePhone(clientPhone);
    if (!isValidPhone11(phone)) {
        setOrderFieldError_('of-phone', 'Введите 11 цифр, начиная с 7 (например 79211234567)');
        errors.push('телефон: ровно 11 цифр, с 7 (например 79211234567)');
        hasErrors = true;
    }

    if (!deliveryDate) {
        setOrderFieldError_('of-date', 'Выберите дату доставки');
        errors.push('дата доставки');
        hasErrors = true;
    }

    if (isOrderFormAddressRequired()) {
        if (!addr1) {
            setOrderFieldError_('of-addr1', 'Введите регион, город или населённый пункт');
            errors.push('регион/город');
            hasErrors = true;
        }
        if (!addr2) {
            setOrderFieldError_('of-addr2', 'Введите улицу');
            errors.push('улица');
            hasErrors = true;
        }
        if (!noPlot && !addr3) {
            setOrderFieldError_('of-addr3', 'Введите дом, корпус или участок');
            errors.push('дом/участок');
            hasErrors = true;
        }
    }

    if (!source) {
        setOrderFieldError_('of-source', 'Выберите магазин на Авито');
        errors.push('магазин на Авито');
        hasErrors = true;
    }
    if (!manager) {
        setOrderFieldError_('of-manager', 'Выберите менеджера');
        errors.push('менеджер');
        hasErrors = true;
    }

    if (hasErrors) {
        resultDiv.textContent = '❌ Заполните: ' + errors.join(', ');
        resultDiv.className = 'error';
        resultDiv.style.display = '';
        const firstErr = document.querySelector('.order-field-error');
        if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    if (addr1 && typeof checkAddressInDeliveryRegion === 'function') {
        var createWarehouseCityKey = (typeof resolveCreateWarehouseCityKey_ === 'function') ? (resolveCreateWarehouseCityKey_() || '') : '';
        var regionCheck = await checkAddressInDeliveryRegion(addr1, createWarehouseCityKey);
        if (!regionCheck.inRegion) {
            setOrderFieldError_('of-addr1', regionCheck.errorMessage || 'Доставка в этот регион не осуществляется.');
            resultDiv.textContent = '❌ ' + (regionCheck.errorMessage || 'Доставка в этот регион не осуществляется.');
            resultDiv.className = 'error';
            resultDiv.style.display = '';
            var firstErrEl = document.querySelector('.order-field-error');
            if (firstErrEl) firstErrEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
    }

    const btn = document.getElementById('order-submit-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Отправка...'; }
    resultDiv.textContent = '⏳ Отправляем заказ...';
    resultDiv.className = 'loading';
    resultDiv.style.display = '';

    const orderData = buildOrderPayloadFromFormAndCart();

    try {
        if (currentOrderIdForEdit) {
            const { error } = await supabaseClient
                .from('orders')
                .update(orderData)
                .eq('id', currentOrderIdForEdit);
            if (error) throw error;

            resultDiv.textContent = '✅ Изменения сохранены.';
            resultDiv.className = 'success';
            currentOrderIdForEdit = null;
            currentOrderCreatedAtForEdit = null;
            if (btn) btn.disabled = false;
            var clientOfferEl = document.getElementById('commercial-offer-client');
            if (clientOfferEl) clientOfferEl.value = orderData.commercial_offer;
            updateCharCounter('commercial-offer-client');
            orderTextFilledBySubmit = true;
            setOfferTab('client');
            return;
        }

        // Бот при /sync выбирает только заказы с status=eq.new — без этого новый заказ не попадёт в синхронизацию.
        orderData.status = 'new';

        const { data, error } = await supabaseClient
            .from('orders')
            .insert([orderData]);

        if (error) throw error;

        resultDiv.innerHTML = '<span class="order-result-message">✅ Заказ оформлен!</span><span class="order-result-celebrate">Ура, готово! 🎉</span><button type="button" class="order-result-edit-btn" tabindex="0">Изменить заказ</button>';
        resultDiv.className = 'success';
        resultDiv.style.display = '';
        if (btn) { btn.textContent = 'Оформить заказ'; btn.disabled = false; }
        var editBtn = resultDiv.querySelector('.order-result-edit-btn');
        if (editBtn && typeof openEditOrderModalWithPhone === 'function') {
            var submittedPhone = phone;
            editBtn.onclick = function () { openEditOrderModalWithPhone(submittedPhone); };
        }

        var clientOfferEl = document.getElementById('commercial-offer-client');
        if (clientOfferEl) clientOfferEl.value = orderData.commercial_offer;
        updateCharCounter('commercial-offer-client');
        orderTextFilledBySubmit = true;
        setOfferTab('client');

        clearingFormAfterSubmit = true;
        document.getElementById('order-client-name').value = '';
        document.getElementById('order-client-phone').value = '';
        var similarWarn = document.getElementById('order-similar-order-warning');
        if (similarWarn) { similarWarn.classList.add('hidden'); similarWarn.textContent = ''; }
        var dateHidden = document.getElementById('order-delivery-date');
        var dateDisplay = document.getElementById('order-delivery-date-display');
        if (dateHidden) dateHidden.value = '';
        if (dateDisplay) { dateDisplay.value = ''; dateDisplay.placeholder = ''; }
        populateOrderDeliveryDate();
        const part3 = document.getElementById('order-address-part3');
        const noPlotCb = document.getElementById('order-no-plot');
        document.getElementById('order-address-part1').value = '';
        document.getElementById('order-address-part2').value = '';
        if (part3) { part3.value = ''; part3.disabled = false; part3.setAttribute('required', 'required'); }
        if (noPlotCb) noPlotCb.checked = false;
        document.getElementById('order-source').value = '';
        document.getElementById('order-manager').value = '';
        document.getElementById('order-comment').value = '';
        orderCart = [];
        orderCartEditingIndex = null;
        updateOrderCartUI();
        clearingFormAfterSubmit = false;

    } catch (err) {
        console.error('Order submit error:', err);
        // Не приписываем вину «интернету»: таймаут, ошибка Supabase или сеть — ответ мог просто не дойти, заказ при этом мог сохраниться.
        var msg = '❌ Не удалось получить ответ от сервера. Заказ мог сохраниться — проверьте в «Редактирование заказа» по телефону. Если заказа нет, нажмите «Оформить заказ» снова.';
        if (err && err.code && typeof err.message === 'string' && err.message.length > 0 && err.message.length < 200) {
            msg = '❌ Ошибка сервера: ' + err.message + '. Проверьте в «Редактирование заказа» по телефону.';
        }
        resultDiv.textContent = msg;
        resultDiv.className = 'error';
        if (btn) { btn.textContent = 'Оформить заказ'; btn.disabled = false; }
    }
}
