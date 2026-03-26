# LIVE INCIDENTS — 2026-03-19 — CALC

**Контур:** greenhouse-calculator-main  
**Дата:** 2026-03-19 (обновлено 2026-03-24)  
**Scope:** только симптомы, связанные с калькулятором. Без предложений по исправлению кода.

---

## Status sync 2026-03-24 (docs-only)

- **Legacy active date-only live smoke — PASS:** 2 real active orders (79276687505, 79178183702) backed up in Supabase; date-only edit tested; delivery_date changed; total did not collapse; delivery_cost stayed 1000; composition not broken; TG notification OK; both restored from backup. Final restored: e939569d/79178183702/11.04.2026/1000/71730; 121033f7/79276687505/25.04.2026/1000/53850.
- **Gifts phantom UI (2026-03-24) — FIXED:** minimal diff (resetEditOrderSessionState_ + fillEditOrderForm hydrate skipNotice=true); payload/save не менялись. Live retest 79276687505: ложный toast больше не появляется; date-only save OK. Broader gifts path — не claim fully fixed.
- **TG notification (2026-03-24):** confirmed 79276687505 — корректное уведомление только о смене даты. OPEN observation: часть других edit без видимых уведомлений; not confirmed bug; separate audit in telegram_bot_main.
- Do not claim legacy fully fixed. Do not claim gifts fully fixed. Do not claim notify-path fully reliable. See docs/AUDIT_2026-03-24_LEGACY_ACTIVE_LIVE_SMOKE_AND_GIFTS_RETEST.md.

---

## Status sync 2026-03-23 (docs-only)

- **Existing-order edit:** critical incident existed; total collapse на 79260699646 (Сергей Николаевич). Заказ несколько раз restored из manual backup.
- **Narrow path verified PASS (23.03.2026):** existing itemized single-item → date-only edit → save. Модалка 56 020; save прошёл; total не схлопнулся; line_items сохранились. **Broader coverage still pending.** Do not present as «existing-order edit fully fixed».
- **4-smoke plan:** был запущен; временно остановлен после critical failures; после фиксов один критичный путь (Sergey/date-only) дал PASS; remaining smoke coverage still not complete.
- **Create-order storage for new orders — RESOLVED (23.03.2026):** line_items_v2 + legacy compatibility fixed. Manual PASS: single-item, 2 identical, 2 different, 3-item mixed. Residual risk: low — non-blocking for create path.

### Legacy/manual open-edit total collapse (2026-03-23)

| Status | REPRODUCED, FIX APPLIED, PARTIALLY VERIFIED |
|--------|---------------------------------------------|
| **Before fix** | quick preview correct (31 470); after «Редактировать» inside modal total collapsed to 1 000, without save |
| **After fix** | canonical repro (79202431340, order b983110f) opens with correct total 31 470 |
| **Still open** | broader legacy validation; legacy add/remove option checks |

Do not write that entire legacy is fully fixed. Do not write that gifts are resolved globally.

### Confirmed incidents 2026-03-23

| # | client_phone | order_id | action | result | remediation |
|---|--------------|----------|--------|--------|-------------|
| INC-011 | 79260699646 | 6a936a8b-8bb4-401a-9276-3e67f202e35b | date-only edit 28.04.2026→29.04.2026 | total collapsed 56 020→2 550 | order restored from manual backup (несколько раз) |
| INC-012 | 79045355637 | — | added timber base + assembly | save path showed success; «Обновить расчёт» error «Заполните все параметры теплицы» | order restored back |

**Incident chain preserved.** INC-011: after fixes, narrow path date-only PASS verified. Save path и recalc path diverge; recalc path для legacy/non-catalog broken.

**Not confirmed:** Supabase "not found" screenshot — UI had extra empty id filter; не evidence of missing-order bug.

---

## Status sync 2026-03-22 (docs-only)

- **Existing single-item main save catalog blocker — RESOLVED by safe mode:** safe mode для legacy single-item внедрён (commits f6a1f47, bced390, d54e24d). Вместо legacy greenhouse form показывается summary-card; default save path не требует current catalog match. Order 5f9a1c7b — manual verification: add extra window, total 62470→63960; старые допы/сборка сохранены. **Note:** full explicit greenhouse-replacement flow («Изменить теплицу» unlock/catalog path) still not fully proven.

---

## Status sync 2026-03-21 10:52 MSK (docs-only)

- **Phantom +1000 reopen — НЕ закрыт.** Новый подтверждённый симптом на реальном заказе: 79227144004; date 11.04.2026→12.04.2026; total 46 470→47 470. Root cause **НЕ подтверждён.** Suspected: dirty baseline / delivery baseline / cross-contour — не confirmed.
- **Literal-preserve / price-lock (проектный курс):** date-only edit / comment-only edit / opening existing order → не должен менять цену. Исторически согласованные деньги — locked snapshot.
- **Open:** phantom +1000 still open; root cause not confirmed; `public.orders` transitional; `orders_live_v2` future direction, not switched.

---

## Status sync 2026-03-20 (docs-only)

- **Delivery probe:** targeted probe on existing order with non-zero delivery passed; payload stable (`delivery_cost=1350`, `total=36070`). Phantom delivery leak into payload **not reproduced** in checked calculator-side probe. See AUDIT_2026-03-20_PHANTOM_DELIVERY_PROBE.md.
- **Gift / INC-002:** read-only audit showed gift «2 дополнительные форточки» **does not explain +1000** in checked calculator code path. See AUDIT_2026-03-20_INC002_GIFT_PLUS1000_READONLY.md.
- **Conclusion:** calculator-side hypotheses weakened; issue not globally closed. TG/sheets/diff layer remains the more plausible next layer.

---

## Симптомы в scope

- edit existing order — странное поведение при сохранении
- странные diff по сумме (phantom diff)
- возможная лишняя доставка / +1000
- подарок/форточка и цена
- несоответствие «что видел менеджер в калькуляторе» vs «что попало в таблицу/бот»

---

## INC-001: 79778008067 — edit, шаг 0.65, дата 28.03

| Поле | Содержание |
|------|-------------|
| **Confirmed facts** | Менеджер менял шаг 0.65 и дату 28.03; по заказу пришло ≥2 уведомлений «Заказ изменён»; суммы на скринах: 31 990 → 33 990, затем 33 990 → 34 990; изменения вели себя непонятно/частично |
| **Open questions** | Почему два уведомления? Корректна ли цепочка сумм? Сохранился ли шаг 0.65 в payload? |
| **Evidence needed** | Supabase: orders по client_phone 79778008067 — line_items, arc_step, delivery_date, total, updated_at; payload при каждом save; таблица — строка до/после sync |
| **Cross-contour** | Diff и уведомления — TG; payload и save — CALC |

---

## INC-002: 79290202519 — подарок «2 форточки», +1000

| Поле | Содержание |
|------|-------------|
| **Confirmed facts** | Уведомление про подарок «2 дополнительные форточки»; сумма 60 990 → 61 990; подозрение на лишнюю тысячу |
| **Open questions** | Откуда +1000? Gift не должен добавлять платную составляющую; возможен дубль delivery_cost или другой платный компонент |
| **Evidence needed** | Supabase: order — gift, delivery_cost, total, base_price, extras, assembly; калькулятор: preview total при выборе «2 форточки»; таблица — разбивка по колонкам |
| **Cross-contour** | TG строит diff; CALC — источник payload |
| **2026-03-20 audit** | Gift «2 дополнительные форточки» does not explain +1000 in checked calculator code path. TG/sheets/diff layer remains more plausible next layer. See AUDIT_2026-03-20_INC002_GIFT_PLUS1000_READONLY.md. |

---

## INC-003: Кейс 62 900 vs 63 900 (ID не подтверждён)

| Поле | Содержание |
|------|-------------|
| **Confirmed facts** | Менеджер сообщил: калькулятор показывал ~62 900; в таблицу ушло 63 900; предположение — доставка продублировалась |
| **Open questions** | Order ID не подтверждён; мог ли дубль delivery_cost попасть в payload? Или ошибка парсинга при sync? |
| **Evidence needed** | Order ID; Supabase row; скрин калькулятора с итогом; строка таблицы с разбивкой (доставка отдельно) |
| **Cross-contour** | CALC — payload; TG/Sheets — sync, парсинг |
| **2026-03-20 audit** | Phantom delivery leak into payload not reproduced in checked calculator-side probe. TG/sheets/diff layer remains more plausible next layer. See AUDIT_2026-03-20_PHANTOM_DELIVERY_PROBE.md. |

---

## INC-004: 79106546690 — изменения/расхождение

| Поле | Содержание |
|------|-------------|
| **Confirmed facts** | Фигурировал в сообщениях как кейс с изменениями/расхождением |
| **Open questions** | Конкретика по материалам не подтверждена |
| **Evidence needed** | Полный контекст: что меняли, что ожидали, что получили |
| **Cross-contour** | Возможен CALC + TG |

---

## INC-007: 79084774012 — добавление теплицы

| Поле | Содержание |
|------|-------------|
| **Confirmed facts** | Добавили ещё одну теплицу; в таблице изменили по новой цене; бот создал связанный тикет/change-order |
| **Open questions** | Корректна ли новая цена? Правильно ли пересчитался total? |
| **Evidence needed** | line_items до/после; total; commercial_offer; аудит бизнес-корректности |
| **Cross-contour** | CALC — add position, save; TG — тикет, «Заказ изменён» |

---

## INC-009: 79227144004 — Phantom +1000 reopen (21.03.2026)

| Поле | Содержание |
|------|-------------|
| **Confirmed facts** | Date changed 11.04.2026 → 12.04.2026; total changed 46 470 → 47 470; симптом по скрину |
| **Open questions** | Root cause НЕ подтверждён; suspected dirty baseline / delivery baseline / cross-contour — не confirmed |
| **Evidence needed** | Root cause investigation; baseline/delivery audit |
| **Cross-contour** | CALC + TG; не claim closed |
| **Status** | confirmed symptom; root cause NOT confirmed |

---

## INC-010: 5f9a1c7b — Existing single-item main save catalog blocker (22.03.2026)

| Поле | Содержание |
|------|-------------|
| **Confirmed facts** | Order id 5f9a1c7b-b6fd-463e-a326-e313223835d4. model: ТЕПЛИЦА ЦАРСКАЯ ЛЮКС 3М ПРЯМОСТЕННАЯ; extras: Грунтозацепы 14 шт; assembly: Сборка и установка; delivery_cost: 1000; total before: 62470. |
| **Resolved by** | Safe mode for legacy single-item (commits f6a1f47, bced390, d54e24d). Summary-card UI; default save не требует catalog. Manual verification: add extra window → total 63960; старые допы/сборка сохранены. |
| **Note** | Full «Изменить теплицу» unlock/catalog flow — not fully proven. |
| **Cross-contour** | CALC only |
| **Status** | resolved by safe mode; manual verification evidence |

---

## Общие open questions (CALC)

1. **Phantom diff (legacy composition):** при «Рассчитать» без «Сохранить позицию» — canonical model перезаписывает legacy; diff в TG показывает «Убрали/Добавили». См. PHANTOM_DIFF_LEGACY_COMPOSITION_AUDIT.md.
2. **Stale sheet baseline:** oldRows из листа может быть устаревшим → phantom diff. См. PHANTOM_DIFF_FIX.md (snapshot).
2a. **Stale form / mixed order state (verified 2026-03-20):** scenario: order A open in edit form, user searched order B from search field inside open modal. Old expanded form collapsed correctly; stale form no longer remained visible.
3. **Delivery_cost при single-item edit:** EOD 18.03 — fix для 79500273936 (delivery_cost = 0). Smoke ещё не подтверждён live.
4. **Legacy single-item total double-count (20.03.2026) — RESOLVED, verified 2026-03-20:** line_items=null, unit_price=0, delivery_cost>0 при date-only save увеличивал total. Root cause: fillEditOrderForm ставил item_total=order.total; buildOrderPayloadFromEditModal добавлял delivery_cost повторно. Fix: item_total = total - delivery_cost при delivery_cost>0. Retest PASS on safe clone: delivery_date changed, total=41480, delivery_cost=2500, unit_price=0, line_items=null preserved.
5. **Legacy single-item comment-only total overwrite (20.03.2026) — RESOLVED, verified 2026-03-20:** comment-only save мог перезаписывать total (41480→43980). Fix: use lastLoadedOrderTotalForDisplay when usePersistedForPayload && single-item. Retest PASS on safe clone: comment changed, total=41480, delivery_cost=2500, unit_price=0, line_items=null preserved.
6. **Inline vs modal delivery date mismatch (20.03.2026) — RESOLVED for checked edit-order cases, verified 2026-03-20:** inline calendar used order city; modal used default Moscow/SPB. Fix: showDeliveryDatesModal(initialCity); edit-order link «даты по городам» passes order city. Manual PASS: order without assembly, non-default city; order with assembly, non-default city. Do not claim all calendar edge cases solved; legacy assembly format, city normalization edge cases remain open.
7. **Phantom +1000 (21.03.2026) — OPEN, NOT closed:** Reopen на 79227144004 (date 11.04→12.04, total 46 470→47 470). Root cause not confirmed. See INC-009.

---

## What evidence is still needed from table/Supabase

| Источник | Что проверить |
|----------|---------------|
| **Supabase orders** | client_phone, total, delivery_cost, gift, line_items (JSON), arc_step, updated_at |
| **Google Sheets** | Строки по телефонам — колонки доставки, итога, состава |
| **Script Properties (GAS)** | fp_*, order_snap_* — для понимания baseline diff |
| **Скрины калькулятора** | Итог перед save, блок подарков, блок доставки |

---

*Документ создан 2026-03-19. Do not propose fixes. Только симптоматика и evidence.*
