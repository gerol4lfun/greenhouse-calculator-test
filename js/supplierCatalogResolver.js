(function (globalScope) {
    'use strict';

    function normalizeString(value) {
        return String(value || '')
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/ё/g, 'е')
            .replace(/"/g, '')
            .trim();
    }

    function isValidFormCategory(value) {
        return value === 'Арочная' || value === 'Каплевидная' || value === 'Домиком';
    }

    function toRuntimePolyLabel(polyValue) {
        var normalized = normalizeString(polyValue);
        if (normalized === 'стандарт4мм' || normalized === 'стандарт4мм') return 'Стандарт 4 мм';
        if (normalized === 'люкс4мм' || normalized === 'люкс4мм') return 'Люкс 4 мм';
        if (normalized === 'премиум6мм' || normalized === 'премиум6мм') return 'Премиум 6 мм';
        return polyValue || '';
    }

    function buildCompatKeyFromMeta(metaRow) {
        return [
            metaRow.supplier_key,
            metaRow.catalog_key,
            metaRow.source_sheet,
            metaRow.source_block_row,
            metaRow.source_price_row,
            metaRow.polycarbonate_text,
        ].join(':');
    }

    function isSupplierCompatRow(row) {
        return !!(row && row.supplier_key && row.catalog_key);
    }

    function resolveCatalogFormCategory(row, fallbackGetFormCategory) {
        if (row && isValidFormCategory(row.form_category)) return row.form_category;
        if (row && isValidFormCategory(row.form_name)) return row.form_name;
        if (typeof fallbackGetFormCategory === 'function') {
            return fallbackGetFormCategory(row && row.form_name ? row.form_name : '');
        }
        return 'Прочие';
    }

    function isMoscowSupplierCatalogCity(cityName) {
        var normalized = normalizeString(cityName);
        return normalized === normalizeString('Москва и МО') ||
            normalized === normalizeString('Москва') ||
            normalized === normalizeString('МСК') ||
            normalized === normalizeString('Московская область');
    }

    function parseWidthVariants(widthVariantsValue) {
        if (!widthVariantsValue) return [];
        if (Array.isArray(widthVariantsValue)) {
            return widthVariantsValue
                .map(function (value) { return Number(value); })
                .filter(function (value) { return Number.isFinite(value); });
        }
        if (typeof widthVariantsValue === 'string') {
            try {
                var parsed = JSON.parse(widthVariantsValue);
                return parseWidthVariants(parsed);
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    function adaptSupplierCatalogRows(compatRows, metaRows) {
        var metaByCompatKey = Object.create(null);
        (metaRows || []).forEach(function (metaRow) {
            var compatKey = metaRow.compat_key || buildCompatKeyFromMeta(metaRow);
            metaByCompatKey[compatKey] = metaRow;
        });

        var runtimeRows = [];

        (compatRows || []).forEach(function (compatRow, index) {
            var compatKey = compatRow.compat_key || [
                compatRow.supplier_key,
                compatRow.catalog_key,
                'Теплицы',
                compatRow.source_block_row,
                compatRow.source_price_row,
                compatRow.source_polycarbonate_text || compatRow.polycarbonate_type,
            ].join(':');
            var metaRow = metaByCompatKey[compatKey] || (metaRows && metaRows[index]) || null;
            var runtimeRow = {
                city_name: compatRow.city_name,
                form_name: metaRow && metaRow.source_model_name ? metaRow.source_model_name : compatRow.form_name,
                form_category: metaRow && isValidFormCategory(metaRow.form_category)
                    ? metaRow.form_category
                    : compatRow.form_name,
                frame_description: compatRow.frame_description,
                polycarbonate_type: toRuntimePolyLabel(compatRow.polycarbonate_type),
                width: compatRow.width,
                length: compatRow.length,
                price: compatRow.price,
                snow_load: compatRow.snow_load || '',
                horizontal_ties: compatRow.horizontal_ties || '',
                equipment: compatRow.equipment || '',
                height: compatRow.height,
                assembly_price: compatRow.assembly_price,
                fastening_display: compatRow.fastening_display || '',
                supplier_key: compatRow.supplier_key,
                catalog_key: compatRow.catalog_key,
                compat_key: compatKey,
                source_model_name: metaRow && metaRow.source_model_name ? metaRow.source_model_name : '',
                polycarbonate_text: metaRow && metaRow.polycarbonate_text ? metaRow.polycarbonate_text : (compatRow.source_polycarbonate_text || ''),
                frame_text: metaRow && metaRow.frame_text ? metaRow.frame_text : compatRow.frame_description,
                fastening_text: metaRow && metaRow.fastening_text ? metaRow.fastening_text : '',
                arc_step_text: metaRow && metaRow.arc_step_text ? metaRow.arc_step_text : '',
                arc_step_m: metaRow && metaRow.arc_step_m ? metaRow.arc_step_m : '',
                width_variants_json: metaRow && metaRow.width_variants_json ? metaRow.width_variants_json : '',
                source_block_row: compatRow.source_block_row,
                source_price_row: compatRow.source_price_row,
                _source: 'supplier_catalog',
            };

            runtimeRows.push(runtimeRow);

            var primaryWidth = Number(runtimeRow.width);
            var widthVariants = parseWidthVariants(runtimeRow.width_variants_json);
            widthVariants.forEach(function (variantWidth) {
                if (!Number.isFinite(variantWidth)) return;
                if (Math.abs(variantWidth - primaryWidth) < 0.001) return;
                runtimeRows.push(Object.assign({}, runtimeRow, {
                    width: variantWidth,
                    compat_key: runtimeRow.compat_key + ':width:' + String(variantWidth),
                    _width_alias_from: primaryWidth,
                }));
            });
        });

        return runtimeRows;
    }

    var api = {
        adaptSupplierCatalogRows: adaptSupplierCatalogRows,
        buildCompatKeyFromMeta: buildCompatKeyFromMeta,
        isMoscowSupplierCatalogCity: isMoscowSupplierCatalogCity,
        isSupplierCompatRow: isSupplierCompatRow,
        resolveCatalogFormCategory: resolveCatalogFormCategory,
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    globalScope.SupplierCatalogResolver = api;
})(typeof window !== 'undefined' ? window : globalThis);
