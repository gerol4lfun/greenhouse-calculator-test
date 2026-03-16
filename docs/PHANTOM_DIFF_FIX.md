# Phantom diff fix — «Заказ изменён»

## A. Confirmed current notification diff path

```
syncUpdatedOrders (4_sheets.gs)
  → getOldOrderRowsFromSheet_(mgrSheet, ord)  → oldRows (from sheet)
  → updateOrderInSheets_(ord, ...)
  → notifySupplierOrderUpdated_(ord, oldRows)
    → buildOrderUpdateDiffMessage_(order, oldRowOrRows)
```

- **Before:** `oldRows` — строки из листа (getOldOrderRowsFromSheet_), индексы 0..21 = A..V
- **After:** `order` — заказ из Supabase (текущее состояние)
- **Diff:** buildOrderUpdateDiffMessage_ сравнивает oldRows (before) с order (after)

## B. Where stale "before" snapshot comes from

`oldRows` берётся из **листа** (getOldOrderRowsFromSheet_). Лист может быть устаревшим:

1. Предыдущий sync не успел обновить этот заказ (order не попал в top-500, sync failed, etc.)
2. Иван добавил Грунтозацепы в калькуляторе → Supabase обновился
3. Sync ещё не отработал → в листе старые данные (без допов)
4. Менеджер меняет только дату → Supabase обновляется
5. Sync запускается, читает лист → oldRows = stale (без Грунтозацепов)
6. Diff: sheet (stale) vs Supabase (актуально) → phantom «Добавили допы», «Итого 30 470 → 30 970»

## C. Primary root cause

**Лист — ненадёжный источник для "before".** Diff сравнивает stale sheet с актуальным Supabase → ложные изменения.

## D. Minimal fix plan

1. При успешной записи в лист сохранять `order` в ScriptProperties как `order_snap_<id>`
2. При построении diff: если есть snapshot — использовать его как "before", иначе fallback на лист
3. Snapshot = последнее записанное состояние → корректный baseline для следующего diff

## E. Unified diff

Фикс внесён в `тг бот заказы теплицы/src/4_sheets.gs`. Изменения:

- `SHEETS_CODE_VERSION` → v127
- Новая функция `orderToOldRowsForDiff_(order)` — конвертирует order в формат oldRows
- В `syncUpdatedOrders`: читать `order_snap_<id>`, при наличии использовать как oldRows для diff
- После успешного update: сохранять `order_snap_<id>`
- gift restore по-прежнему использует oldRowsSheet (лист)

## F. What to verify manually after fix

1. **Сценарий Ивана:** заказ с Грунтозацепами 6 шт, итого 30 970 ₽. Менеджер меняет только дату доставки (17.03 → 18.03). Сохранить.
2. **Ожидание:** уведомление «Заказ изменён» содержит только:
   - `• Дата доставки: 17.03.2026 → 18.03.2026`
3. **Не должно быть:** «Добавили допы: Грунтозацепы 6 шт», «Итого: 30 470 → 30 970»
4. **Первый update после деплоя:** если snapshot ещё нет, diff может использовать лист (fallback). Второй и последующие updates — уже со snapshot.
5. Проверить, что при реальном добавлении допов diff по-прежнему показывает «Добавили допы».
