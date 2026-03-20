# Root Cause Audit: legacy single-item comment-only save still changes total

**Дата:** 2026-03-20  
**Bug:** comment-only save overwrites total (41480 → 43980)  
**Контур:** greenhouse-calculator-main

---

## Answers to specific questions

**A) Why comment updates correctly but total still changes**  
Comment is read from DOM (7316) and always sent in payload (7342). Total is recomputed from composition (7293) and overwrites DB; it does not use persisted `order.total`.

**B) Why unit_price stays 0 while total becomes 43980**  
`payload.unit_price` is set only when `one.base_price` is valid (7365). Legacy with `unit_price=0` → `base_price` undefined → unit_price omitted from payload → DB value preserved. `payload.total` is always sent → overwrites DB.

**C) Is payload.total from persisted legacy snapshot or current recomputed composition**  
**Current recomputed.** Always `compositionForPayload.reduce(...) + deliveryCostForPayload` (7293). Never from `order.total` or `lastLoadedOrderTotalForDisplay`.

---

## A. Confirmed code facts

1. **buildOrderPayloadFromEditModal** (7288–7415): `totalForPayload = compositionForPayload.reduce((s,i)=>s+(i.item_total||0),0) + deliveryCostForPayload` (7293). `payload.total = totalForPayload` (7348, 7364).

2. **usePersistedForPayload** (7290): `!(_editOrderCompositionTouchedByUser) && lastPersistedEditOrderState != null`. When true: `compositionForPayload = lastPersistedEditOrderState.composition`, `deliveryCostForPayload = _editOrderDeliveryCostAtPanelOpen ?? editOrderDeliveryCost`.

3. **fillEditOrderForm** (6225–6371) legacy path (line_items null, order.model):
   - 6317: `item_total: tot` (tot = parseOrderPrice_(order.total))
   - 6340–6341: `else if (editOrderDeliveryCost > 0 && order.total != null)` → `editOrderComposition[0].item_total = Math.max(0, tot - editOrderDeliveryCost)`
   - 6369: `lastPersistedEditOrderState = getEditOrderStateSnapshot()`

4. **getEditOrderStateSnapshot** (880–885): `composition: editOrderCompositionClone()` — shallow copy of `editOrderComposition`.

5. **unit_price** (7365): `payload.unit_price = Number(one.base_price)` only when `one.base_price != null && !isNaN(Number(one.base_price))`. For legacy with `unit_price=0`, `base_price` can be `undefined` → unit_price not set in payload → DB value preserved.

6. **comment** (7316, 7342): read from DOM `edit-order-comment`, always included in payload.

---

## B. Exact total overwrite path on comment-only save

**Path:** `buildOrderPayloadFromEditModal` line 7293 → 7348 → 7364.

```
totalForPayload = compositionForPayload.reduce((s,i)=>s+(i.item_total||0),0) + deliveryCostForPayload
payload.total = totalForPayload
```

For 43980: `sum(item_total) + deliveryCostForPayload = 43980`. With `delivery_cost=2500`: `sum(item_total) = 41480` → composition has `item_total = 41480` (full order total) instead of `38980` (total − delivery).

**Source of composition:** `compositionForPayload = usePersistedForPayload ? lastPersistedEditOrderState.composition : editOrderComposition` (7291).

---

## C. Why unit_price stays 0 while total changes

- `payload.unit_price` set only when `one.base_price` is valid (7365).
- Legacy with `unit_price=0`, `line_items=null` → `flatBasePrice = undefined` (6316) → `base_price: undefined` in composition.
- Payload omits `unit_price` → Supabase update does not touch column → DB value stays 0.
- `payload.total` is always sent → overwrites DB.

---

## D. Most likely root cause

**payload.total always comes from current recomputed composition, never from persisted legacy total.**

- `payload.total` is never taken from `order.total` or `lastLoadedOrderTotalForDisplay`.
- It is always `sum(compositionForPayload.item_total) + deliveryCostForPayload` (7293).
- For correct 41480: composition must have `item_total = 38980` (from fillEditOrderForm 6340–6341).
- For wrong 43980: composition has `item_total = 41480` (full total) → sum 41480 + delivery 2500 = 43980.

**Gap:** The `else if` at 6340–6341 should set `item_total = tot - editOrderDeliveryCost` when `editOrderDeliveryCost > 0`. If it runs, we get 38980. Exact scenario where it does not run but we still get `deliveryCostForPayload = 2500` is not confirmed in code.

---

## E. Minimal safe fix direction

1. **Legacy single-item, composition untouched:** when `usePersistedForPayload` and composition comes from persisted state, consider using `lastLoadedOrderTotalForDisplay` (or equivalent persisted total) instead of recomputing from composition, when `line_items === null` and composition was never touched.
2. **Alternative:** ensure `fillEditOrderForm` always sets `item_total = tot - editOrderDeliveryCost` for legacy single-item when `delivery_cost > 0`; verify no path leaves `item_total = tot`.
3. **Guard:** for comment-only (or other form-only) saves, optionally skip sending `total` when composition and delivery were not touched — requires schema/API support.

---

## F. Exact files / functions / line ranges

| Location | Function / variable | Lines |
|----------|---------------------|-------|
| scripts.js | `buildOrderPayloadFromEditModal` | 7288–7415 |
| scripts.js | `totalForPayload`, `compositionForPayload`, `deliveryCostForPayload` | 7290–7293 |
| scripts.js | `payload.total = total` | 7348, 7364 |
| scripts.js | `fillEditOrderForm` legacy branch | 6313–6342 |
| scripts.js | `editOrderComposition[0].item_total` assignment | 6338, 6341 |
| scripts.js | `lastPersistedEditOrderState = getEditOrderStateSnapshot()` | 6369, 7789 |
| scripts.js | `getEditOrderStateSnapshot`, `editOrderCompositionClone` | 880–865 |
| scripts.js | `usePersistedForPayload` logic | 7290–7292 |
| scripts.js | `payload.unit_price` (conditional) | 7365 |

---

## G. Fix and verification (2026-03-20)

**Fix:** In `buildOrderPayloadFromEditModal`, when `usePersistedForPayload && compositionForPayload.length === 1 && lastLoadedOrderTotalForDisplay != null`, use `lastLoadedOrderTotalForDisplay` for `payload.total` instead of recomputing from composition.

**Verified PASS on safe legacy clone (2026-03-20):**
- Baseline: delivery_date=18.04.2026, delivery_cost=2500, total=41480, unit_price=0, line_items=null
- After comment-only save: comment="comment smoke 2026-03-20 v2"; delivery_date, delivery_cost, total, unit_price, line_items unchanged
