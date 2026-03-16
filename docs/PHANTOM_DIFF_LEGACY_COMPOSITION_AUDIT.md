# Phantom diff по составу/названию legacy позиции — root cause audit

## A. Confirmed current composition/title path

### 1. Load existing line_items / composition
- **Источник:** Supabase `orders.line_items` (JSON string)
- **Функция:** `hydrateEditOrderForm_` (scripts.js ~6244–6270)
- **Действие:** `JSON.parse(order.line_items)` → `editOrderComposition.push({ model: item.model, width, length, frame, extras, assembly, ... })`
- **Результат:** legacy `model` сохраняется как есть (без нормализации)

### 2. Hydration в edit form
- **Display:** `renderEditOrderCompositionList` → `greenhouseTitle_(item.model, item.width, item.length)` (строка 6654)
- **greenhouseTitle_** — только для отображения: «ТЕПЛИЦА БОЯРСКАЯ ЛЮКС 2.5М» + 2.5, 6 → «ТЕПЛИЦА БОЯРСКАЯ ЛЮКС 2.5×6 м»
- **editOrderComposition** не меняется, `item.model` остаётся legacy

### 3. Payload build on save
- **Функция:** `buildOrderPayloadFromEditModal` (7288–7315)
- **Действие:** `payload.line_items = JSON.stringify(editOrderComposition.map(item => ({ model: item.model, ... })))`
- **Результат:** в payload уходит `item.model` из `editOrderComposition` без дополнительной нормализации

### 4. Compare/diff path (в боте, 4_sheets.gs)
- **before:** `oldRows` (sheet или snapshot) → `positionLabelFromSheetRow_`, `positionKeyFromSheetRow_`, `collectExtrasFromRows_`
- **after:** `order` из Supabase → `positionLabelFromLineItem_`, `positionKeyFromLineItem_`, `collectExtrasFromOrder_`
- **Ключ позиции:** `model|width|length|frame` — при изменении `model` позиция считается «убрана» и «добавлена» → phantom diff

---

## B. Where untouched legacy composition/title can be normalized

### Основное место: панель «Изменить» + расчёт

1. **Открытие панели** (`openEditOrderAddPanel`, ~6821–6901):
   - `lastModalCalculationResult = { model: item.model, ... }` — legacy сохраняется
   - Dropdown form: `item.form || item.model` — legacy может попасть в селект

2. **Клик «Рассчитать»** (`runEditOrderAddPanelCalculation`, ~7898–7937):
   - `calculateGreenhousePrice(city, form, width, length, frame, poly, ...)` → `data.model = selectedEntry.form_name`
   - `selectedEntry.form_name` — каноничное имя из таблицы `prices` (например, «Теплица Боярская Люкс 2.5М»)
   - `lastModalCalculationResult = { model: data.model, ... }` — **подмена legacy на canonical**

3. **Сохранение без «Сохранить позицию»** (7680–7703):
   - Если `lastModalCalculationResult && editOrderEditingIndex` → `editOrderComposition[editOrderEditingIndex]` перезаписывается из `lastModalCalculationResult`
   - В payload уходит уже canonical `model` → phantom diff в TG

4. **extras/assembly:**
   - При расчёте: `extrasText`/`assemblyText` из `data.foundationText`, `data.assemblyText` (формат «Грунтозацепы 6 шт - 1 500 рублей»)
   - Legacy может быть «Грунтозацепы 6 шт» или «Грунтозацепы 6 шт - 1500 руб»
   - Разный формат → возможный phantom diff по допам

---

## C. Primary root cause

**Нормализация происходит в payload build path**, но не в самом `buildOrderPayloadFromEditModal`, а через перезапись `editOrderComposition` из `lastModalCalculationResult` перед сохранением.

Цепочка:
1. Менеджер открывает «Изменить» по legacy-позиции
2. Нажимает «Рассчитать» (или срабатывает recalc при изменении опций)
3. `runEditOrderAddPanelCalculation` → `data.model = selectedEntry.form_name` (canonical)
4. `lastModalCalculationResult` = canonical
5. Менеджер нажимает «Сохранить изменения» без «Сохранить позицию»
6. Блок 7680–7703 перезаписывает позицию из `lastModalCalculationResult`
7. Payload уходит с canonical `model` вместо legacy
8. Бот сравнивает sheet (legacy) vs Supabase (canonical) → phantom «Убрали / Добавили»

**Hydration:** legacy сохраняется корректно.  
**Payload build:** сам по себе не нормализует, но получает уже перезаписанные данные.  
**Diff path:** реагирует на изменение строки `model` и показывает phantom diff.

---

## D. One minimal fix to try first

**Не перезаписывать позицию из `lastModalCalculationResult` при «Сохранить изменения», если менеджер не нажимал «Сохранить позицию».**

Сейчас: при `lastModalCalculationResult && editOrderEditingIndex` позиция всегда перезаписывается.

Предложение: ввести флаг `_editOrderPositionExplicitlySaved`:
- `true` — только после клика «Сохранить позицию»
- При «Сохранить изменения» перезаписывать позицию только если `_editOrderPositionExplicitlySaved === true`
- Сбрасывать флаг при закрытии панели и при открытии другой позиции

Так сохраняется правило: «если менеджер не менял позицию руками (не нажимал «Сохранить позицию»), система не переписывает её название/формат».

---

## E. One manual test after fix

1. Взять legacy-заказ с позицией в старом формате (например, «Теплица Боярская 2.5М» в `model`).
2. Открыть редактирование, нажать «Изменить» на этой позиции.
3. Нажать «Рассчитать» (чтобы `lastModalCalculationResult` стал canonical).
4. **Не** нажимать «Сохранить позицию».
5. Изменить только дату доставки.
6. Нажать «Сохранить изменения».
7. **Ожидание:** уведомление «Заказ изменён» содержит только изменение даты, без «Убрали / Добавили» по позиции.
8. **Проверка обратного сценария:** нажать «Сохранить позицию» → «Сохранить изменения» → diff должен показывать изменение позиции (если canonical отличается от legacy).
