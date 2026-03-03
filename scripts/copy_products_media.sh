#!/bin/bash
# Скрипт для копирования фото и видео из "Доп. инф-ция 2" в структуру проекта
# Использование: ./scripts/copy_products_media.sh
# Автоматически исправляет ориентацию изображений на основе EXIF данных

SOURCE_DIR="Доп. инф-ция 2"
TARGET_IMAGE_DIR="image/products"
TARGET_VIDEO_DIR="video/products"

echo "📁 Копирование медиа-файлов из $SOURCE_DIR..."

# Функция для копирования и исправления ориентации изображения
copy_and_fix_image() {
    local source="$1"
    local target="$2"
    
    # Копируем файл
    cp "$source" "$target" 2>/dev/null
    
    # Если это изображение, исправляем ориентацию
    if [[ "$target" =~ \.(jpg|jpeg|png|JPG|JPEG|PNG)$ ]]; then
        # Применяем автоматическую коррекцию ориентации
        sips -O "$target" > /dev/null 2>&1
    fi
}

# ========== ГРЯДКИ ==========
echo "🌱 Копирование фото грядок..."
copy_and_fix_image "$SOURCE_DIR/Грядки/Перемычка/photo_.jpg" "$TARGET_IMAGE_DIR/gryadki/peremychka_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Грядки/Перемычка/photo_1.jpg" "$TARGET_IMAGE_DIR/gryadki/peremychka_2.jpg"

copy_and_fix_image "$SOURCE_DIR/Грядки/Соединительные уголки/photo_.jpg" "$TARGET_IMAGE_DIR/gryadki/ugolki_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Грядки/Соединительные уголки/photo_1.jpg" "$TARGET_IMAGE_DIR/gryadki/ugolki_2.jpg"
copy_and_fix_image "$SOURCE_DIR/Грядки/Соединительные уголки/photo_2.jpg" "$TARGET_IMAGE_DIR/gryadki/ugolki_3.jpg"
copy_and_fix_image "$SOURCE_DIR/Грядки/Соединительные уголки/photo_3.jpg" "$TARGET_IMAGE_DIR/gryadki/ugolki_4.jpg"
copy_and_fix_image "$SOURCE_DIR/Грядки/Соединительные уголки/photo_4.jpg" "$TARGET_IMAGE_DIR/gryadki/ugolki_5.jpg"

copy_and_fix_image "$SOURCE_DIR/Грядки/Стенка грядки/photo_.jpg" "$TARGET_IMAGE_DIR/gryadki/stenka_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Грядки/Стенка грядки/photo_1.jpg" "$TARGET_IMAGE_DIR/gryadki/stenka_2.jpg"
copy_and_fix_image "$SOURCE_DIR/Грядки/Стенка грядки/photo_2.jpg" "$TARGET_IMAGE_DIR/gryadki/stenka_3.jpg"

# Видео сборки грядок
# Видео сборки грядок (не изображение, просто копируем)
cp "$SOURCE_DIR/Грядки/Сборка высоких грядок.mp4" "$TARGET_VIDEO_DIR/gryadki_assembly.mp4" 2>/dev/null

# ========== ПОЛИКАРБОНАТ ==========
echo "🏠 Копирование фото поликарбоната..."
# 4мм Стандарт
copy_and_fix_image "$SOURCE_DIR/Поликарбонат/4мм Стандарт/photo_.jpg" "$TARGET_IMAGE_DIR/polycarbonate/standard_4mm_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Поликарбонат/4мм Стандарт/photo_1.jpg" "$TARGET_IMAGE_DIR/polycarbonate/standard_4mm_2.jpg"
copy_and_fix_image "$SOURCE_DIR/Поликарбонат/4мм Стандарт/photo_2.jpg" "$TARGET_IMAGE_DIR/polycarbonate/standard_4mm_3.jpg"
copy_and_fix_image "$SOURCE_DIR/Поликарбонат/4мм Стандарт/photo_3.jpg" "$TARGET_IMAGE_DIR/polycarbonate/standard_4mm_4.jpg"
copy_and_fix_image "$SOURCE_DIR/Поликарбонат/4мм Стандарт/photo_4.jpg" "$TARGET_IMAGE_DIR/polycarbonate/standard_4mm_5.jpg"
copy_and_fix_image "$SOURCE_DIR/Поликарбонат/4мм Стандарт/photo_5.jpg" "$TARGET_IMAGE_DIR/polycarbonate/standard_4mm_6.jpg"

# 4мм Люкс и 6мм Премиум (одна папка для обоих типов)
copy_and_fix_image "$SOURCE_DIR/Поликарбонат/4мм Люкс и 6мм Премиум/photo_.jpg" "$TARGET_IMAGE_DIR/polycarbonate/lux_4mm_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Поликарбонат/4мм Люкс и 6мм Премиум/photo_1.jpg" "$TARGET_IMAGE_DIR/polycarbonate/lux_4mm_2.jpg"
copy_and_fix_image "$SOURCE_DIR/Поликарбонат/4мм Люкс и 6мм Премиум/photo_2.jpg" "$TARGET_IMAGE_DIR/polycarbonate/lux_4mm_3.jpg"
copy_and_fix_image "$SOURCE_DIR/Поликарбонат/4мм Люкс и 6мм Премиум/photo_3.jpg" "$TARGET_IMAGE_DIR/polycarbonate/lux_4mm_4.jpg"
copy_and_fix_image "$SOURCE_DIR/Поликарбонат/4мм Люкс и 6мм Премиум/photo_4.jpg" "$TARGET_IMAGE_DIR/polycarbonate/lux_4mm_5.jpg"
copy_and_fix_image "$SOURCE_DIR/Поликарбонат/4мм Люкс и 6мм Премиум/photo_5.jpg" "$TARGET_IMAGE_DIR/polycarbonate/lux_4mm_6.jpg"
copy_and_fix_image "$SOURCE_DIR/Поликарбонат/4мм Люкс и 6мм Премиум/photo_6.jpg" "$TARGET_IMAGE_DIR/polycarbonate/lux_4mm_7.jpg"
# Премиум 6мм использует те же фото что и Люкс 4мм (в одной папке)
copy_and_fix_image "$SOURCE_DIR/Поликарбонат/4мм Люкс и 6мм Премиум/photo_.jpg" "$TARGET_IMAGE_DIR/polycarbonate/premium_6mm_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Поликарбонат/4мм Люкс и 6мм Премиум/photo_1.jpg" "$TARGET_IMAGE_DIR/polycarbonate/premium_6mm_2.jpg"
copy_and_fix_image "$SOURCE_DIR/Поликарбонат/4мм Люкс и 6мм Премиум/photo_2.jpg" "$TARGET_IMAGE_DIR/polycarbonate/premium_6mm_3.jpg"
copy_and_fix_image "$SOURCE_DIR/Поликарбонат/4мм Люкс и 6мм Премиум/photo_3.jpg" "$TARGET_IMAGE_DIR/polycarbonate/premium_6mm_4.jpg"
copy_and_fix_image "$SOURCE_DIR/Поликарбонат/4мм Люкс и 6мм Премиум/photo_4.jpg" "$TARGET_IMAGE_DIR/polycarbonate/premium_6mm_5.jpg"
copy_and_fix_image "$SOURCE_DIR/Поликарбонат/4мм Люкс и 6мм Премиум/photo_5.jpg" "$TARGET_IMAGE_DIR/polycarbonate/premium_6mm_6.jpg"
copy_and_fix_image "$SOURCE_DIR/Поликарбонат/4мм Люкс и 6мм Премиум/photo_6.jpg" "$TARGET_IMAGE_DIR/polycarbonate/premium_6mm_7.jpg"

# Параметры
copy_and_fix_image "$SOURCE_DIR/Поликарбонат/Параметры.png" "$TARGET_IMAGE_DIR/polycarbonate/parameters.png"

# ========== КАПЕЛЬНЫЙ ПОЛИВ ==========
echo "💧 Копирование фото капельного полива..."
# Автоматический
mkdir -p "$TARGET_IMAGE_DIR/drip-irrigation"
copy_and_fix_image "$SOURCE_DIR/Капельный полив/Автомат/photo_.jpg" "$TARGET_IMAGE_DIR/drip-irrigation/auto_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Капельный полив/Автомат/photo_1.jpg" "$TARGET_IMAGE_DIR/drip-irrigation/auto_2.jpg"
copy_and_fix_image "$SOURCE_DIR/Капельный полив/Автомат/photo_2.jpg" "$TARGET_IMAGE_DIR/drip-irrigation/auto_3.jpg"
copy_and_fix_image "$SOURCE_DIR/Капельный полив/Автомат/photo_3.jpg" "$TARGET_IMAGE_DIR/drip-irrigation/auto_4.jpg"
copy_and_fix_image "$SOURCE_DIR/Капельный полив/Автомат/photo_4.jpg" "$TARGET_IMAGE_DIR/drip-irrigation/auto_5.jpg"
copy_and_fix_image "$SOURCE_DIR/Капельный полив/Автомат/photo_5.jpg" "$TARGET_IMAGE_DIR/drip-irrigation/auto_6.jpg"
copy_and_fix_image "$SOURCE_DIR/Капельный полив/Автомат/photo_6.jpg" "$TARGET_IMAGE_DIR/drip-irrigation/auto_7.jpg"

# Механический
copy_and_fix_image "$SOURCE_DIR/Капельный полив/Механический/photo_.jpg" "$TARGET_IMAGE_DIR/drip-irrigation/mech_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Капельный полив/Механический/photo_1.jpg" "$TARGET_IMAGE_DIR/drip-irrigation/mech_2.jpg"

# ========== ЛЕНТЫ ==========
echo "📏 Копирование фото лент..."
mkdir -p "$TARGET_IMAGE_DIR/tapes"
# Оцинкованная лента
copy_and_fix_image "$SOURCE_DIR/Ленты/Оцинкованная лента/photo_.jpg" "$TARGET_IMAGE_DIR/tapes/galvanized_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Ленты/Оцинкованная лента/Оцинкованная лента.jpg" "$TARGET_IMAGE_DIR/tapes/galvanized_2.jpg"
copy_and_fix_image "$SOURCE_DIR/Ленты/Оцинкованная лента/photo_2.jpg" "$TARGET_IMAGE_DIR/tapes/galvanized_3.jpg"
copy_and_fix_image "$SOURCE_DIR/Ленты/Оцинкованная лента/photo_3.jpg" "$TARGET_IMAGE_DIR/tapes/galvanized_4.jpg"
copy_and_fix_image "$SOURCE_DIR/Ленты/Оцинкованная лента/photo_4.jpg" "$TARGET_IMAGE_DIR/tapes/galvanized_5.jpg"

# Паропропускная лента
copy_and_fix_image "$SOURCE_DIR/Ленты/Паропропускная лента/Паропропускная 1.jpg" "$TARGET_IMAGE_DIR/tapes/vapor_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Ленты/Паропропускная лента/Паропропускная 2.jpg" "$TARGET_IMAGE_DIR/tapes/vapor_2.jpg"
copy_and_fix_image "$SOURCE_DIR/Ленты/Паропропускная лента/Изображение WhatsApp 2025-09-22 в 10.52.07_e6787531.jpg" "$TARGET_IMAGE_DIR/tapes/vapor_3.jpg"

# Видео паропропускной ленты
cp "$SOURCE_DIR/Ленты/Паропропускная лента/Видео WhatsApp 2025-09-22 в 10.54.02_35b31f9c.mp4" "$TARGET_VIDEO_DIR/tapes_vapor.mp4" 2>/dev/null || \
find "$SOURCE_DIR/Ленты/Паропропускная лента" -name "*.mp4" -type f -exec cp {} "$TARGET_VIDEO_DIR/tapes_vapor.mp4" \; 2>/dev/null

# ========== ТЕРМОПРИВОД (АВТОМАТ ДЛЯ ФОРТОЧКИ) ==========
echo "🌡️ Копирование фото термопривода..."
mkdir -p "$TARGET_IMAGE_DIR/thermodrive"
copy_and_fix_image "$SOURCE_DIR/Термопривод (Автомат для форточки)/Фото термопривода/photo_.jpg" "$TARGET_IMAGE_DIR/thermodrive/photo_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Термопривод (Автомат для форточки)/Фото термопривода/photo_1.jpg" "$TARGET_IMAGE_DIR/thermodrive/photo_2.jpg"
copy_and_fix_image "$SOURCE_DIR/Термопривод (Автомат для форточки)/Фото термопривода/photo_2.jpg" "$TARGET_IMAGE_DIR/thermodrive/photo_3.jpg"
copy_and_fix_image "$SOURCE_DIR/Термопривод (Автомат для форточки)/Фото термопривода/photo_3.jpg" "$TARGET_IMAGE_DIR/thermodrive/photo_4.jpg"
copy_and_fix_image "$SOURCE_DIR/Термопривод (Автомат для форточки)/Фото термопривода/photo_4.jpg" "$TARGET_IMAGE_DIR/thermodrive/photo_5.jpg"
copy_and_fix_image "$SOURCE_DIR/Термопривод (Автомат для форточки)/Фото термопривода/photo_5.jpg" "$TARGET_IMAGE_DIR/thermodrive/photo_6.jpg"
copy_and_fix_image "$SOURCE_DIR/Термопривод (Автомат для форточки)/Фото термопривода/photo_6.jpg" "$TARGET_IMAGE_DIR/thermodrive/photo_7.jpg"

# ========== ДВЕРИ И ФОРТОЧКИ ==========
echo "🚪 Копирование фото дверей и форточек..."
mkdir -p "$TARGET_IMAGE_DIR/doors-windows"
# Двери
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Двери/Фото дверей/photo_.jpg" "$TARGET_IMAGE_DIR/doors-windows/door_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Двери/Фото дверей/photo_1.jpg" "$TARGET_IMAGE_DIR/doors-windows/door_2.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Двери/Фото дверей/photo_2.jpg" "$TARGET_IMAGE_DIR/doors-windows/door_3.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Двери/Фото дверей/photo_3.jpg" "$TARGET_IMAGE_DIR/doors-windows/door_4.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Двери/Фото дверей/photo_4.jpg" "$TARGET_IMAGE_DIR/doors-windows/door_5.jpg"

# Фурнитура дверей
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Двери/Фурнитура дверей/photo_.jpg" "$TARGET_IMAGE_DIR/doors-windows/door_furniture_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Двери/Фурнитура дверей/photo_1.jpg" "$TARGET_IMAGE_DIR/doors-windows/door_furniture_2.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Двери/Фурнитура дверей/photo_2.jpg" "$TARGET_IMAGE_DIR/doors-windows/door_furniture_3.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Двери/Фурнитура дверей/photo_3.jpg" "$TARGET_IMAGE_DIR/doors-windows/door_furniture_4.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Двери/Фурнитура дверей/photo_4.jpg" "$TARGET_IMAGE_DIR/doors-windows/door_furniture_5.jpg"

# Боковые форточки
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Боковые форточки/photo_.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_side_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Боковые форточки/photo_1.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_side_2.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Боковые форточки/photo_2.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_side_3.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Боковые форточки/photo_3.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_side_4.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Боковые форточки/photo_4.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_side_5.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Боковые форточки/photo_5.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_side_6.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Боковые форточки/photo_6.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_side_7.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Боковые форточки/photo_7.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_side_8.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Боковые форточки/photo_8.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_side_9.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Боковые форточки/photo_9.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_side_10.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Боковые форточки/photo_10.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_side_11.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Боковые форточки/photo_11.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_side_12.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Боковые форточки/photo_12.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_side_13.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Боковые форточки/photo_13.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_side_14.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Боковые форточки/photo_14.png" "$TARGET_IMAGE_DIR/doors-windows/window_side_15.jpg"

# Торцевые форточки
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Торцевых форточки/photo_.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_end_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Торцевых форточки/photo_1.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_end_2.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Торцевых форточки/photo_2.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_end_3.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Торцевых форточки/photo_3.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_end_4.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Торцевых форточки/photo_4.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_end_5.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Торцевых форточки/photo_5.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_end_6.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Торцевых форточки/photo_6.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_end_7.jpg"

# Фурнитура для форточек
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Фурнитура для форточек/photo_.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_furniture_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Фурнитура для форточек/photo_1.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_furniture_2.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Фурнитура для форточек/photo_2.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_furniture_3.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Фурнитура для форточек/photo_3.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_furniture_4.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Фурнитура для форточек/photo_4.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_furniture_5.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Фурнитура для форточек/photo_5.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_furniture_6.jpg"
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Фурнитура для форточек/photo_6.jpg" "$TARGET_IMAGE_DIR/doors-windows/window_furniture_7.jpg"

# Размеры форточек
copy_and_fix_image "$SOURCE_DIR/Двери, форточки/Форточки/Размеры форточек.png" "$TARGET_IMAGE_DIR/doors-windows/window_sizes.png"

# ========== РАСХОДНИКИ ==========
echo "🔧 Копирование фото расходников..."
mkdir -p "$TARGET_IMAGE_DIR/consumables"
# Анкера
copy_and_fix_image "$SOURCE_DIR/Расходники/Анкера/Фото анкеров/photo_.jpg" "$TARGET_IMAGE_DIR/consumables/anchors_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Расходники/Анкера/Фото анкеров/photo_1.jpg" "$TARGET_IMAGE_DIR/consumables/anchors_2.jpg"

# Болты для крабов
copy_and_fix_image "$SOURCE_DIR/Расходники/Болты для крабов МС5.8/photo_.jpg" "$TARGET_IMAGE_DIR/consumables/bolts_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Расходники/Болты для крабов МС5.8/photo_1.jpg" "$TARGET_IMAGE_DIR/consumables/bolts_2.jpg"

# Крабы Т-образные
copy_and_fix_image "$SOURCE_DIR/Расходники/Крабы/Т-образные/photo_.png" "$TARGET_IMAGE_DIR/consumables/crab_t_1.png"
copy_and_fix_image "$SOURCE_DIR/Расходники/Крабы/Т-образные/photo_1.jpg" "$TARGET_IMAGE_DIR/consumables/crab_t_2.jpg"

# Крабы Х-образные
copy_and_fix_image "$SOURCE_DIR/Расходники/Крабы/Х-образные/photo_.png" "$TARGET_IMAGE_DIR/consumables/crab_x_1.png"
copy_and_fix_image "$SOURCE_DIR/Расходники/Крабы/Х-образные/photo_1.jpg" "$TARGET_IMAGE_DIR/consumables/crab_x_2.jpg"

# Саморез малый
find "$SOURCE_DIR/Расходники/Саморез малый" -type f \( -name "*.jpg" -o -name "*.png" \) -exec cp {} "$TARGET_IMAGE_DIR/consumables/screw_small_1.jpg" \; 2>/dev/null

# Саморезы для крепления бруса
copy_and_fix_image "$SOURCE_DIR/Расходники/Саморезы для крепления бруса (основания к брусу)/photo_.jpg" "$TARGET_IMAGE_DIR/consumables/screw_bracing_1.jpg"

# Саморезы кровельные
copy_and_fix_image "$SOURCE_DIR/Расходники/Саморезы кровельные (для поликарбоната)/photo_.jpg" "$TARGET_IMAGE_DIR/consumables/screw_roofing_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Расходники/Саморезы кровельные (для поликарбоната)/photo_1.jpg" "$TARGET_IMAGE_DIR/consumables/screw_roofing_2.jpg"

# ========== УГОЛОК ОЦИНКОВАННЫЙ ==========
echo "📐 Копирование фото уголка..."
mkdir -p "$TARGET_IMAGE_DIR/corner"
copy_and_fix_image "$SOURCE_DIR/Уголок оцинкованный/Фото уголка/photo_.jpg" "$TARGET_IMAGE_DIR/corner/photo_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Уголок оцинкованный/Фото уголка/photo_1.jpg" "$TARGET_IMAGE_DIR/corner/photo_2.jpg"
copy_and_fix_image "$SOURCE_DIR/Уголок оцинкованный/Фото уголка/photo_2.png" "$TARGET_IMAGE_DIR/corner/photo_3.jpg"
copy_and_fix_image "$SOURCE_DIR/Уголок оцинкованный/Фото уголка/photo_3.jpg" "$TARGET_IMAGE_DIR/corner/photo_4.jpg"
copy_and_fix_image "$SOURCE_DIR/Уголок оцинкованный/Фото уголка/photo_4.jpg" "$TARGET_IMAGE_DIR/corner/photo_5.jpg"
copy_and_fix_image "$SOURCE_DIR/Уголок оцинкованный/Фото уголка/photo_5.jpg" "$TARGET_IMAGE_DIR/corner/photo_6.jpg"
copy_and_fix_image "$SOURCE_DIR/Уголок оцинкованный/Фото уголка/photo_6.jpg" "$TARGET_IMAGE_DIR/corner/photo_7.jpg"
copy_and_fix_image "$SOURCE_DIR/Уголок оцинкованный/Фото уголка/photo_7.jpg" "$TARGET_IMAGE_DIR/corner/photo_8.jpg"
copy_and_fix_image "$SOURCE_DIR/Уголок оцинкованный/Фото уголка/photo_8.jpg" "$TARGET_IMAGE_DIR/corner/photo_9.jpg"
copy_and_fix_image "$SOURCE_DIR/Уголок оцинкованный/Фото уголка/photo_9.jpg" "$TARGET_IMAGE_DIR/corner/photo_10.jpg"
copy_and_fix_image "$SOURCE_DIR/Уголок оцинкованный/Фото уголка/photo_10.jpg" "$TARGET_IMAGE_DIR/corner/photo_11.jpg"
copy_and_fix_image "$SOURCE_DIR/Уголок оцинкованный/Фото уголка/photo_11.jpg" "$TARGET_IMAGE_DIR/corner/photo_12.jpg"

# ========== ФУНДАМЕНТ ==========
echo "🏗️ Копирование фото фундамента..."
mkdir -p "$TARGET_IMAGE_DIR/foundation"
# Брус
copy_and_fix_image "$SOURCE_DIR/Фундамент/Брус/photo_1.jpg" "$TARGET_IMAGE_DIR/foundation/bracing_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Фундамент/Брус/photo_2.jpg" "$TARGET_IMAGE_DIR/foundation/bracing_2.jpg"
copy_and_fix_image "$SOURCE_DIR/Фундамент/Брус/photo_3.jpg" "$TARGET_IMAGE_DIR/foundation/bracing_3.jpg"
copy_and_fix_image "$SOURCE_DIR/Фундамент/Брус/photo_4.jpg" "$TARGET_IMAGE_DIR/foundation/bracing_4.jpg"

# Грунтозацепы
copy_and_fix_image "$SOURCE_DIR/Фундамент/Грунтозацепы/photo_.jpg" "$TARGET_IMAGE_DIR/foundation/ground_hooks_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Фундамент/Грунтозацепы/photo_1.jpg" "$TARGET_IMAGE_DIR/foundation/ground_hooks_2.jpg"

# Пластины и уголки
copy_and_fix_image "$SOURCE_DIR/Фундамент/Пластины и уголки для крепления бруса/photo_.jpg" "$TARGET_IMAGE_DIR/foundation/plates_1.jpg"

# ========== СЛЕДЫ ОТ ТРУБОГИБА ==========
echo "📐 Копирование фото следов от трубогиба..."
mkdir -p "$TARGET_IMAGE_DIR/pipe-bends"
copy_and_fix_image "$SOURCE_DIR/Следы от трубогиба/Фото/photo_.jpg" "$TARGET_IMAGE_DIR/pipe-bends/photo_1.jpg"
copy_and_fix_image "$SOURCE_DIR/Следы от трубогиба/Фото/photo_1.jpg" "$TARGET_IMAGE_DIR/pipe-bends/photo_2.jpg"
copy_and_fix_image "$SOURCE_DIR/Следы от трубогиба/Фото/photo_2.jpg" "$TARGET_IMAGE_DIR/pipe-bends/photo_3.jpg"

echo "✅ Копирование завершено!"
echo "📝 Следующий шаг: заполнить описания в js/products-data.js"
