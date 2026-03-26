# Status snapshot — native vs legacy, v283 (2026-03-25)

**Роль этого файла:** зафиксировать этап **2026-03-25** с жёстким разделением **CONFIRMED / OPEN / KNOWN LIMITS / CURRENT WORKING RULES / WHAT SHOULD NOT BE CLAIMED**, с **дополнением 2026-03-26** (живое downstream-подтверждение).

**Evidence scope:** утверждения ниже с пометкой **CONFIRMED** опираются на **подтверждённые факты из чата / handoff этого этапа** (curl, SQL, live-результаты, описанные коммиты), **не** на другие markdown-доки как доказательство. Где отдельный факт **не** подтверждён в этом чате — указано **NOT CONFIRMED**.

**Обновлено по содержанию:** 2026-03-26 — §1.I и правки §3 (что остаётся OPEN после живого TG).

---

## 1. CONFIRMED FACTS

### A. New orders

- **CONFIRMED:** live create для new/native orders был подтверждён (POST в Supabase).
- **CONFIRMED:** у новых заказов в БД присутствовали/ожидались поля: `delivery_date`, `delivery_cost`, `total`, `line_items_v2`, `price_snapshot_at`, `pricing_snapshot_version`.
- **CONFIRMED:** new-order create flow **больше не трактуется как основной блокер** на текущем этапе.

### B. Downstream / telegram_bot_main / Supabase

- **CONFIRMED (handoff этапа):** `fetchNewOrders` и `fetchOrdersByIds_` обновлены так, чтобы запрашивать `line_items_v2`.
- **CONFIRMED (handoff этапа):** `validateOrderForSheet_` обновлён: состав валиден, если есть **model** или **line_items** или **line_items_v2**.
- **CONFIRMED (handoff этапа):** представление `active_orders` в Supabase вручную обновлено, чтобы включать `line_items_v2`.
- **CONFIRMED:** это закрыло **format gap** между new/native заказами калькулятора и downstream-валидацией.

**NOT CONFIRMED в этом doc-only проходе:** повторная проверка по актуальному GAS/SQL без отдельного excerpt в чате — **не выполнялась**.

### C. Legacy gate

- **CONFIRMED:** legacy-заказы **намеренно** ограничены **редактированием только даты** (date-only).
- **CONFIRMED:** полное редактирование состава для legacy **не** входит в поддерживаемый workflow.
- **CONFIRMED:** добавлены UI notice / blocking logic / date-only path.
- **CONFIRMED:** safe-тесты для native-vs-legacy edit gates достигли **passing** состояния.

### D. Native date-only / address-only

- **CONFIRMED (staging):** date-only edit меняет **только дату**, не доставку и не товарную часть.
- **CONFIRMED (staging):** address-only edit меняет **доставку**, не товарную часть.

### E. Live create kill switch

- **CONFIRMED:** live create tests **по умолчанию отключены**.
- **CONFIRMED:** kill switch требует **`LIVE_SMOKE_ALLOWED=1`**.
- **CONFIRMED:** live create projects/specs **удалены или пропускаются по умолчанию**, чтобы не создавать случайные реальные заказы.

### F. Native composition edit — баг и цепочка фиксов

- **CONFIRMED:** существовал баг: **`line_items` / totals обновлялись, а `line_items_v2` оставались устаревшими в БД**.
- **CONFIRMED:** staging сначала отдавал старый bundle; затем обновления прошли через **v281 → v282 → v283**.
- **CONFIRMED на staging (curl):** `scripts.js?v=283`, **`APP_VERSION = "v283"`**.

### G. Final status after v283

- **CONFIRMED (SQL в рамках этапа / handoff):** итоговый проверенный SQL показал **`line_items_array_len = 2`**, **`greenhouse_lines_in_v2 = 2`**.
- **CONFIRMED:** для текущего этапа это трактуется как **PASS** по согласованности native composition edit между `line_items` и `line_items_v2`.

**NOT CONFIRMED в этом чате (строгая граница):** если конкретный SQL-dump для конкретного `order_id` **не** был приложен в этом чате — считать строку G **stage narrative**, не автоматическим доказательством для всех заказов.

### H. Playwright / GitHub Pages test baseline (2026-03-25)

**CONFIRMED для этого этапа (живые прогоны против test Pages):**

- **BASE_URL (канон):** `https://gerol4lfun.github.io/greenhouse-calculator-test/` (с trailing slash).
- **Native composition — PASS:** spec `e2e/staging-existing-native-composition-smoke.spec.js`, project **`staging-existing-native-composition`**. Эталонные order id: **single-line** `STAGING_SINGLELINE_ORDER_ID` = `9aac35ca-9d2e-4291-a6aa-e89528278687`; **two-line** `STAGING_EXISTING_ORDER_ID` = `d8357800-b2c9-4cff-a0a5-0a4f5068d3ff`.
- **Legacy date-only — PASS:** spec `e2e/edit-order.spec.js`, project **`edit-order-legacy`**, тест **`existing-order-date-only-integrity`**, `TEST_ORDER_ID` = `121033f7-72f3-48b3-a833-d52444f5424e`.
- **Legacy PATCH (date-only) contract:** в теле **обязателен** `delivery_date`; поля **`line_items` и `model` не обязательны** (server path date-only).
- **UX:** для native зафиксирован сценарий **одного финального сохранения** после правок состава; пошаговый **save-position как единственный пользовательский путь** — **не** считается каноническим сценарием.

**Норма продукта (этот baseline):** **native** — допускается **composition edit**; **legacy** — **только date-only**, без полного редактирования состава через калькулятор.

### I. Live downstream — Telegram notify (2026-03-26) — **CONFIRMED (narrow)**

**Scope:** один согласованный заказ, один сценарий явного изменения состава (native), операционный контур production/staging как у команды в момент проверки.

**CONFIRMED:**

- **order_id:** `9aac35ca-9d2e-4291-a6aa-e89528278687` (эталон **native single-line** из §1.H).
- **phone:** `79000000033`.
- После сохранения изменения состава в калькуляторе и прохождения sync пришло уведомление в Telegram в стиле **«Заказ изменён»**, с фактическим текстом, совпадающим по сути с:
  - **«Заказ изменён · 79000000033»**;
  - **«Добавили: ТЕПЛИЦА БОЯРСКАЯ 2.5x6, ТЕПЛИЦА БОЯРСКАЯ 2.5x6»**;
  - **«Итого: 20 480 ₽ → 56 460 ₽»**.

**Интерпретация:** это принимается как **живое подтверждение** сквозной цепочки **calculator → PATCH (Supabase) → sync → Telegram notify (supplier diff path)** для **этого** `order_id` и **этого** типа изменения.

**NOT CONFIRMED / не расширять автоматически:** другие заказы; другие типы diff; все комбинации повторных правок; отсутствие дедуп/fp edge cases; analytics; полнота таблиц для всех сценариев — см. §3–§4.

---

## 2. CURRENT WORKING RULES

- **LEGACY orders:**
  - редактирование **только даты** (date-only);
  - **нет** поддерживаемого полного редактирования состава через калькулятор.

- **NATIVE / NEW orders:**
  - **create** поддерживается;
  - **date-only edit** поддерживается;
  - **address-only edit** поддерживается;
  - **composition edit** поддерживается на текущем этапе **после результата v283**;
  - при **date-only** неизменная доставка должна оставаться неизменной;
  - смена адреса **может** пересчитать доставку;
  - **товарная часть** не должна меняться при **date-only** или **address-only** (без смены состава);
  - целевой UX правок состава: **одно главное сохранение** (см. §1.H); отдельный только **save-position**-flow — **не** канон пользователя.

---

## 3. OPEN / KNOWN LIMITS

Включать как **open**, не как **resolved**:

- идентичные строки / FIFO — **не** задокументировано здесь как полностью решённое;
- «грязные» smoke/test-заказы от ранних live-прогонов **существуют**;
- live create tests **должны** оставаться **отключёнными по умолчанию**;
- legacy full-edit **намеренно не** поддерживается;
- **не** заявлять, что supplier path проверен **исчерпывающе** для всех сценариев, если это **явно** не подтверждено в этом чате;
- **повторные подряд правки** одного заказа, **все** edge-кейсы repeated edits — **не** считать полностью закрытыми;
- **полная** надёжность downstream (каждый сценарий sync, fp-дедуп, каждая вариация supplier diff, каждое сочетание baseline sheet vs snap) — **не** считать доказанной только из §1.I;
- **analytics paths** и полнота операционных отчётов — **open**;
- **каждая** возможная вариация текста diff / «Заказ изменён» — **не** считать исчерпывающе покрытой.

**Уточнение после 2026-03-26:** узкий **живой** кейс уведомления по составу для `9aac35ca-9d2e-4291-a6aa-e89528278687` — **CONFIRMED** в §1.I. Глобальное утверждение «уведомления + Sheets всегда корректны для всех заказов» — **по-прежнему NOT CLAIMED** без отдельной выборки.

---

## 4. WHAT SHOULD NOT BE CLAIMED

**Явно NOT CONFIRMED / не заявлять без отдельного доказательства:**

- что **каждый** edge case решён;
- что legacy **full edit** безопасен;
- что все исторические «грязные» тестовые заказы пригодны как **контрольные** объекты;
- что **каждый** возможный multi-line / identical-line сценарий полностью закрыт.

---

## 5. NEXT PRACTICAL STEP

Коротко и прагматично:

- держать live create tests **выключенными по умолчанию**;
- **не** использовать «грязные» smoke-заказы как контрольные объекты;
- использовать **текущий результат** как рабочий baseline;
- перейти к **спокойному** maintenance / cleanup / documentation, **не** к хаотичным дополнительным live smoke-прогонам.

---

## META

- Этот файл — **doc-only snapshot** этапа. Обновление **2026-03-25:** добавлен §1.H (E2E baseline / эталонные `order id`) и уточнены §2–§3 — **без изменений коду продукта и без новых тестовых файлов**.
- Обновление **2026-03-26:** добавлен §1.I (живое TG downstream), уточнён §3 — **без изменений коду продукта**.
