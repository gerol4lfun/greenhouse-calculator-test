# План до прода

**Дата:** 2026-03-15. **Версия калькулятора:** v271 (историческая отметка в шапке; актуальный этап см. baseline ниже).

---

## Current baseline (2026-03-25)

**Baseline doc:** `docs/STATUS_SNAPSHOT_2026-03-25_NATIVE_LEGACY_V283.md` — главный актуальный snapshot этапа; при расхождении с более старыми секциями этого файла **приоритет у snapshot**.

**CONFIRMED (кратко):** staging **v283** (`scripts.js?v=283`, `APP_VERSION = "v283"` — handoff/curl); цепочка **v281→v282→v283** для согласования `line_items` / `line_items_v2` при native composition edit — **не заявлять шире**, чем в snapshot; **kill switch** live create: по умолчанию **выключено**, **`LIVE_SMOKE_ALLOWED=1`**; **legacy** — **date-only** + UI/блокировки; **native:** create, downstream alignment, **date-only** и **address-only** (где заявлено в snapshot — не меняют товарную часть).

**OPEN:** идентичные строки / FIFO; «грязные» smoke-заказы; supplier path не exhaustive; GAS/SQL без excerpt в чате — **не подтверждено** doc-only проходом.

**What not to claim:** каждый edge case закрыт; legacy **full-edit** безопасен; исторические тестовые заказы как контрольные объекты; exhaustive coverage для всех multi-line сценариев.

**No chaotic live smoke:** live create tests остаются **выключенными по умолчанию**; не использовать «грязные» smoke-заказы как контрольные; спокойный maintenance / documentation — **не** хаотичные дополнительные live-прогоны (см. snapshot §5).

---

## ПРОЕКТНЫЙ РЕЖИМ И ФОКУС (23.03.2026)

**Главный приоритет:** стабилизация existing-order edit перед продом. Existing-order edit **был нестабилен**; critical incident подтверждён. Один узкий путь (existing itemized single-item date-only) — PASS после фиксов.

**Editing rules (направление):** untouched existing/recent order fields → preserve literally; date-only edit → must not recalc item price or delivery; address-only change → may recalc delivery; changing one extra → must not recalc whole greenhouse by new prices.

**Ближайший порядок работ (freeze factual 2026-03-23):**
1. Зафиксировать factual progress as of 2026-03-23.
2. Продолжить controlled smoke для existing-order edit.
3. Следующая проверка: address-only / another order without reload.
4. extra-only / recalc — только после controlled checks. Не go wide.

**Active bug focus (калькулятор):**
- **total collapse on existing order edit** — incident confirmed (79260699646); narrow path date-only — PASS после фиксов; broader coverage still pending.
- **79045355637:** recalc error; save path и recalc path diverge.
- phantom delivery +1000 — calculator-side hypotheses weakened; TG/sheets/diff layer remains more plausible next layer

---

## Confirmed working

- **Центр истины:** greenhouse-calculator-main/docs/
- **Версия калькулятора:** v271; auth текущей версии переведён на RPC
- auth работает
- базовый create работает; create до таблицы доезжает
- comment update через priority sync подтверждён
- merge auto-comment + manual-comment работает
- local-safe e2e пакет собран
- **Gifts threshold** на главной форме подтверждён (total > 35k → gift в payload; total < 35k → пустой)
- **UX подарков:** выбор в селекте применяет без второго клика; подтверждение — в составе заказа слева
- create / sync / table / priority sync по comment подтверждены на реальном заказе
- mergeCommentD_ в TG/GAS-контуре работает на сценарии с 2 одинаковыми теплицами + ручным comment
- cancelled нельзя редактировать
- commercial_offer при edit пересобирается
- deep link ?id= для заказа есть
- **Existing-order edit по deep link:** работает. Локальный operator/e2e маршрут: base URL `http://localhost:3000`, deep link `/?editPhone=<phone>`. GitHub Pages / неверный base URL для этого сценария не использовать.
- **orders.updated_at change-signal:** подтверждён. Edit existing order реально обновляет `orders.updated_at` в Supabase (DB-side trigger). Калькулятор не пишет `updated_at` в payload — обновление идёт автоматически при любом UPDATE.
- **Подтверждённый кейс existing-order edit:** phone `79000000018`, id `ced4fafd-1602-4aae-874d-70f0f97150e3`. Before: delivery_date `19.03.2026`, updated_at `2026-03-14T13:35:11.610827+00:00`. After: delivery_date `16.03.2026`, updated_at `2026-03-15T09:35:06.334595+00:00`.
- **Existing-order update через калькулятор:** manual confirmed на заказе 70000000019. Менялось только поле даты доставки; после reopen в калькуляторе новая дата сохранилась. Новая дата дошла в Google Sheets; в Telegram пришло «Заказ изменён» с корректным diff по дате (старая → новая). Это manual confirmed, не auto verified. Downstream TG/Sheets — подтверждено в TG-контуре отдельно.
- **Existing multi-item identical-order update:** manual confirmed на заказе 79000000020. Менялось только `delivery_date` (18.03.2026). quantity=2, line_items=NULL; delivery_date обновился; quantity/status/gift/comment/city/commercial_offer не уехали. Подтверждает только кейс «2 одинаковые позиции через quantity=2».
- **Existing line_items-order update:** manual confirmed на заказе 79000000018. Менялось только `delivery_date`; line_items сохранился; quantity/status/comment/commercial_offer не уехали. Manual confirmed, не auto verified.
- **Existing cancel flow:** manual confirmed на заказе 79000000066. status: synced → cancelled; comment получил дописку с причиной отмены; quantity, delivery_date, line_items, commercial_offer не изменились; обычный edit-path после cancel блокируется. Manual confirmed, не auto verified.
- **Legacy active date-only smoke + gifts retest (2026-03-24):** live smoke on 2 real active orders (79276687505, 79178183702) after backup/restore. delivery_date changed; total did not collapse; delivery_cost stayed 1000; composition not broken; TG notification OK; both restored from backup. Gifts phantom UI minimal fix applied; live retest 79276687505 — ложный toast больше не появляется; date-only edit сохранён; restore успешен. See docs/AUDIT_2026-03-24_LEGACY_ACTIVE_LIVE_SMOKE_AND_GIFTS_RETEST.md.
- **Восстановление подарков в edit-модалке:** баг исправлен. Причина — parseGiftTextToSelected не распознавал текст вида «2 дополнительные форточки» и не разворачивал количество в слоты (id=window). Ручная проверка на заказе 70000000019: после reopen Подарок 1 и Подарок 2 = Дополнительная форточка. Gifts consistency в целом по-прежнему partial — integration e2e gifts-save-reopen не verified в локальном окружении (зависимость от Supabase/waitOrderSuccess).
- **Gifts raw-preserve на legacy existing order:** manual confirmed на заказе 8e803d39-db87-4da1-b420-4325a29e0dfb (client_phone 79266302494, Жирнов Сергей). Меняли только delivery_date; gift остался literally «форточка 1 шт.» — legacy gift не переписывается в канонический формат при edit другого поля.
- **Phantom diff fix (15.03.2026):** при edit existing order, если менеджер менял только дату — diff только по дате. delivery_address и client_phone (dual-phone) не пересобираются, не нормализуются; untouched legacy fields сохраняются literally. Реализовано: _editOrderOriginalAddressRaw, _editOrderAddressTouchedByUser; phone — при !touched всегда original.
- **Dual-phone support (15.03.2026):** UI reveal-on-demand (create/edit единый паттерн): по умолчанию второе поле скрыто; «+ Добавить доп. номер» — компактное вторичное действие; при двух номерах в edit — второе поле раскрыто. Storage: "num1" или "num1 / num2". Поиск по любому номеру. Untouched raw-preserve. Legacy не backfill.
- **Edit calendar source-of-truth:** manual confirmed. Календарь в edit existing order использует приоритет: orders.city → line_items[].city → fallback derive from address. Alias (МСК, СПБ, Питер) нормализуется. Fix #1 (item.city preserve) и fix #2 (prefix strip) внесены. Кейсы: 8e803d39 (orders.city=МСК); 79000000028 (orders.city="г. Санкт-Петербург") — на актуальном калькуляторе календарь показывает реальные ограничения. Ранее false negative — проверка на неактуальном билде.
- **PGRST204 incident (15.03.2026) — confirmed:** prod-schema проблема; колонка warehouse_city_key отсутствовала; добавлена вручную; NOTIFY pgrst; save восстановлен; rollback payload rejected.
- **Логика дат доставки:** Москва в основной форме; Набережные Челны в edit modal со сборкой — подтверждены вручную. Логика основной формы и edit modal выровнена (канонический city key в обоих).
- **Edit-calendar city resolve fix (15.03.2026):** canonicalCity=1 bug исправлен. Root cause: numeric candidate ("1" — номер участка) из address fallback. Фикс: isRejectableNumericCityCandidate_, fallback resolveRegionToCanonicalCity_(p1). Ivan case manual confirmed: canonicalCity=Москва, withAssembly=true, stateMapCountForMonth>0, календарь не all-green.
- **Staging (19.03.2026):** greenhouse-calculator-test на GitHub Pages; staging smoke passed: page load, auth, delivery in-zone (Москва), out-of-zone (Владивосток), map. См. tg_calculator/TEST_HANDOFF_2026-03-19.md.

---

## RESOLVED (15.03.2026)

| # | Что | Подтверждение |
|---|-----|---------------|
| 1 | **Edit-calendar city resolve bug** | canonicalCity=1 fixed; numeric candidate reject; Ivan case manual confirmed |
| 2 | **canonicalCity=1** | resolveEditOrderCalendarCity_ теперь отбрасывает "1"/"64"/"2" и использует resolveRegionToCanonicalCity_(p1) |
| 3 | **Ivan case** | edit-calendar показывает ограничения (не all-green); withAssembly=true; stateMapCountForMonth>0 |
| 4 | **all-green fix** | verified |
| 5 | **Wrong save path guard** | main form submit blocked when edit modal open; Ivan case verified |
| 6 | **Ivan dual-phone preserve** | verified |
| 7 | **Legacy composition/title phantom diff fix** | verified on Svetlana (change only date → diff only date in TG) |
| 8 | **Passive mutation major branches** | contained |
| 9 | **Legacy single-item total double-count (20.03.2026)** | fillEditOrderForm: при delivery_cost>0 item_total = total - delivery_cost. Safe-clone retest PASS. **Contradicted by real-base 2026-03-23:** 79260699646 date-only collapse 56 020→2 550; fix not proven sufficient. |
| 10 | **Stale form / mixed order state (verified 2026-03-20)** | Order A open, user searched order B from modal search → old form collapsed correctly; stale form no longer visible |
| 11 | **Legacy single-item comment-only total overwrite (20.03.2026)** | buildOrderPayloadFromEditModal: use lastLoadedOrderTotalForDisplay when usePersistedForPayload && single-item; retest PASS: comment-only save preserves total=41480, delivery_cost=2500 |
| 12 | **Inline vs modal delivery date mismatch (20.03.2026)** | showDeliveryDatesModal(initialCity); edit-order link «даты по городам» passes order city; manual PASS: non-default city with/without assembly. Resolved for checked edit-order cases. |

---

## UNDER DOUBT / NOT REPRODUCED

| # | Что | Статус |
|---|-----|--------|
| 1 | **Date mismatch 28→27** | Audit показал: syncEditOrderCalendarSlotsWithMode может заменять выбранную дату на getNearestAvailableDate при «недоступной» дате для режима. Живой воспроизводимый кейс не подтверждён → code fix не вносился. |
| 2 | **Rare legacy scenarios** | вне уже проверенных кейсов |

---

## Completed (2026-03-22)

| # | Что | Статус |
|---|-----|--------|
| 13 | **Safe mode for legacy single-item** | В main: f6a1f47, bced390, d54e24d. locked snapshot path; current catalog не обязателен для default save. **Not proven sufficient on real-base:** 2026-03-23 smoke — total collapse. |
| 14 | **Summary-card UI** | Вместо legacy greenhouse form — summary-card с названием, размером, ценой, статусом «🔒 Цена зафиксирована», CTA «Изменить теплицу». |

## line_items_v2 rollout (23.03.2026) — create path PASS

**Create path for new orders:** stabilized, manual PASS.

**Closed:** dangerous merge identical items removed; each greenhouse stored separately in line_items_v2; legacy line_items restored for identical/multi-item create; top-level extras/assembly aggregated from real items; stale text leak in addToOrderCart fixed.

**Open:** edit-path; TG downstream reading/migration; legacy historical orders; low residual risk (partial stale text mismatch in rare checkbox/recalc edge cases, non-blocking).

**SQL:** ALTER TABLE orders ADD COLUMN IF NOT EXISTS для line_items_v2, price_snapshot_at, pricing_snapshot_version.

## Open issues / suspected issues

- **Full «Изменить теплицу» unlock-flow (22.03.2026) — open next step:** отдельный и полностью проверенный unlock/catalog path для кнопки «Изменить теплицу» — не считать fully closed; не было отдельной полной ручной проверки. Не смешивать с multi-item / x2.
- **Date mismatch 28→27 (15.03.2026) — under doubt:** кейс «перенести на 28 марта» → в «Заказ изменён» фигурировала 27.03. Аудит выявил потенциально опасное место: syncEditOrderCalendarSlotsWithMode при «недоступной» дате для режима сборки заменяет выбранную дату на getNearestAvailableDate. Живой воспроизводимый кейс не подтверждён → code fix не вносился.
- **Phone scope:** dual-phone UI и search реализованы и приняты. См. TRUTH_MAP.md «Phone scope» и CHANGELOG «Dual-phone UI + untouched legacy (doc-only)».
- **Calendar region→city mapping:** для заказов без orders.city fallback derive из address использует region→canonical mapping (Московская область→Москва и т.п.). Primary fix — source-of-truth (orders.city first) — подтверждён.
- **Адресный контур / display vs warehouse key:** принято решение — вводим orders.warehouse_city_key. См. TRUTH_MAP.md «Архитектурное решение: warehouse_city_key» и раздел ниже.
- **Gifts consistency end-to-end** не закрыт полностью
- **Gifts phantom UI / dirty-state (2026-03-24):** FIXED minimal diff. Был read-only audit; узкий fix: resetEditOrderSessionState_ + fillEditOrderForm hydrate skipNotice=true. Payload/save не менялись. Live retest 79276687505 — ложный toast больше не появляется. Broader gifts path — не claim fully fixed.
- **Multi-item сценарии** не закрыты полностью.
- **Inline vs modal delivery date mismatch** — resolved for checked edit-order cases (20.03.2026). Fix: modal receives initialCity from edit context. Remains open: legacy assembly format edge cases; city normalization edge cases; full calendar edge-case coverage not claimed.
- **Broad legacy/recent stabilization** — не равно full legacy support; проверенные кейсы (date-only, comment-only на safe clone) не покрывают все legacy сценарии. Кейс «2 одинаковые через quantity=2» manual confirmed (заказ 79000000020). Кейс update заказа с line_items manual confirmed (заказ 79000000018). Flaky автотест create-order-line-items — не считать рабочим автотестом.
- **Auto-sync after edit:** на стороне калькулятора/Supabase change-signal (`orders.updated_at`) подтверждён. Downstream TG/Sheets без ручного /sync — отдельный контур, не входит в scope калькулятора.
- **Cancel flow race:** при слишком раннем нажатии «Отменить заказ» возможна «Ошибка: заказ не выбран».
- **Обычный sync:** не всегда даёт чистую проверку без lock contention
- **Auth migration** всех рабочих калькуляторов ещё не завершена

---

## Tomorrow first-check (16.03.2026)

1. **Date mismatch 28→27:** проверить — менеджер реально сохранил 27.03 или есть рассинхрон выбора/сохранения даты в MOVE_DATE e2e path. Запрос был «28 марта», в «Заказ изменён» ушло 17.03 → 27.03.
2. **Existing-order save:** smoke — edit по телефону, смена даты, save. Должно проходить без PGRST204.

---

## Current priority (23.03.2026)

**P0:** legacy/manual order opens in edit without total collapse. Fix applied; canonical repro verified (79202431340).

**P1:** legacy/manual date-only save.

**P2:** legacy/manual add/remove one common option (assembly OR timber base OR ground anchors).

**P3:** broader legacy/manual coverage.

**Not now:** gifts cleanup for old manual orders; multi-item identical greenhouse extras; beds; TG/notify related tails.

**Background:** Recalc path для legacy/non-catalog — diverges from save path (79045355637); не расширять scope. Auth migration map — отдельно.

---

## Красное (обязательно до прода)

1. **Smoke checklist** — пройти docs/SMOKE_CHECKLIST.md перед выкладкой.
2. **Автотесты** — local-safe 5 тестов зелёные (см. docs/AUTOTEST_PLAN.md, раздел 2.1). Integration-тесты — на стенде при наличии Supabase. existing-order-paid-extra: добавлен, unstable / not gate (edit-order.spec.js).
3. **Аудит авторизации** — проверить: вход/выход, сессия, защита админ-панели, пароли в Supabase.
4. **Синхрон калькулятор ↔ TG-проект** — заказы из калькулятора доезжают в Supabase; бот (тг бот заказы теплицы) читает и отображает. Проверить create → Supabase → бот.
5. **Версии** — scripts.js APP_VERSION, package.json _projectVersion, index.html ?v= — синхронны.

---

## Жёлтое (важно, можно после основного)

1. **Обновить legacy** — FAQ (пороги 50k → 55k), telegram-bot README/version, КОНТЕКСТ версия в шапке. См. LEGACY_MAP.md.
2. **Документация** — TRUTH_MAP, LEGACY_MAP, PREPROD_PLAN, SMOKE_CHECKLIST актуальны.

---

## Backlog (калькуляторный контур)

**Назначение:** задачи/идеи, которые не потерять. Категории: suspected bug, high-value UX, medium UX, feature/backlog.

### Suspected bug / высокий приоритет

| # | Описание | Зачем | Проверить позже |
|---|----------|-------|-----------------|
| 1 | **Доставка не попадает в графу «Доставка» в таблице** — заказ оформляется через новый калькулятор, в таблице появляется, но доставка не в отдельной графе, хотя в тексте заказа доставка есть. | Data loss / некорректный парсинг в downstream (Sheets/TG). | **Важно:** может быть hosted-only / Яндекс-зависимая история; на localhost может не воспроизводиться. Требует отдельной проверки на рабочем хосте. |

### High-value UX / высокий приоритет

| # | Описание | Зачем | Проверить позже |
|---|----------|-------|-----------------|
| 2 | **Кнопка «Добавить такую же теплицу»** — быстро дублировать текущую позицию без ручного пересбора. | Частый сценарий: клиент берёт 2 одинаковые теплицы. Сокращает клики и ошибки. | UX flow: после расчёта — кнопка рядом с «Добавить в заказ»; дублирует параметры в корзину. |

### Medium priority UX

| # | Описание | Зачем | Проверить позже |
|---|----------|-------|-----------------|
| 3 | **Улучшить вёрстку блока доставки и ближайших дат** — после расчёта логика работает, но layout можно сделать компактнее и аккуратнее. | Визуальная ясность, экономия места. | Текущий блок — изучить; предложить более компактный layout без изменения логики. |

### Feature / backlog

| # | Описание | Зачем | Проверить позже |
|---|----------|-------|-----------------|
| 4 | **Поликарбонат отдельной позицией** — возможность покупать листы поликарбоната отдельно, не только как часть теплицы. | Сценарий: докупить листы на старую теплицу или заказать отдельно. | Отдельная форма/позиция в корзине; цены из prices; не блокирует текущий create flow. |

---

## Auth migration for all calculators

Таблица `users` общая для всех калькуляторов. Новый калькулятор (v271+) работает через RPC auth (см. docs/AUTH_AUDIT.md). Старые рабочие версии ещё логинятся по старой схеме — читают `users` напрямую. Удаление policy «Allow anon to read active users» сломало вход в старых версиях; policy временно возвращена, работа восстановлена.

**Правило:** policy не удалять, пока не обновлены все реально используемые рабочие калькуляторы.

**Полный переход:**
1. Выявить все рабочие калькуляторы/ссылки, которыми пользуются менеджеры.
2. Определить, какие на новом auth (RPC), какие на старом (читают users).
3. Обновить все рабочие версии до RPC auth.
4. Проверить вход на каждой рабочей версии.
5. Только после этого окончательно убрать policy.

**MIGRATION CHECKLIST:**
- [ ] Собрать список всех рабочих ссылок/калькуляторов
- [ ] Определить текущую версию каждого
- [ ] Определить схему auth: старая (читает users) / новая (RPC)
- [ ] Обновить рабочие старые версии
- [ ] Проверить логин менеджерами
- [ ] Удалить policy «Allow anon to read active users» окончательно

**Критерий завершения:** Auth migration считается завершённой, когда все реально используемые калькуляторы переведены на RPC auth, на рабочих ссылках менеджеры успешно входят, старая схема входа нигде не используется, и policy можно удалить без остановки работы.

---

## Зелёное (не трогаем сейчас)

1. **Подарки / slot model** — стабилизированный контур. Не менять без причины.
2. **giftCore / единая архитектура подарков** — до прода не делать. Решение — отдельно.
3. **База знаний** — не интегрирована. Не приоритет.
4. **UI gift в preview-карточке** — не приоритет.
5. **Ручной пересчёт vs live-preview** — открытый хвост. Не блокирует прод.
6. **Новые тестовые create-заказы** — в обычном цикле больше не создаём; используем уже существующие тестовые заказы. Отмена тестовых заказов — только отдельным шагом.

---

## Операционные ограничения live-прогонов (боевой контур)

- В рабочее время не запускать live create-flow тесты в боевом контуре.
- Для proof-run использовать только уже существующие тестовые заказы.
- create / new order testing — только после рабочего дня или в отдельном тестовом контуре.
- existing-order edit proof-run допустим только по согласованному тестовому заказу.

---

## warehouse_city_key: rollout plan и legacy strategy

**Rollout plan (макс. 5 шагов):**
1. ~~Добавить nullable колонку `orders.warehouse_city_key`. Без backfill.~~ **Готово.** Migration: `20260315_add_warehouse_city_key_to_orders.sql`. Схема подготовлена. Поле пока не используется как runtime source of truth. Следующий шаг: write-path для create/edit.
2. ~~На create/edit начать записывать warehouse_city_key (create — из canonical city dropdown/nearestCity; edit — из resolved canonical key).~~ **Готово.** Write-path create/edit уже пишет warehouse_city_key. Readers пока legacy-first. Следующий шаг: перевести readers на warehouse_city_key first с safe fallback.
3. ~~Переключить delivery readers на prefer warehouse_city_key с fallback: create calendar, edit calendar, тариф, region availability.~~ **Готово.** Readers переведены: create calendar, edit calendar, region availability. Tariff отдельно не меняли — уже использует канонический nearestCity.name. Safe fallback: warehouse_city_key → orders.city → line_items[].city → derive from address. Яндекс-контур и address UI не рефакторились. Следующий шаг: точечная ручная проверка и стабилизация, не новый рефакторинг.
4. Legacy fallback реализован в шаге 3. Если warehouse_city_key пуст — orders.city → line_items[].city → derive from address.
5. После стабилизации решить, нужен ли точечный backfill (не массовая миграция всего мира).

**Legacy strategy (без массовой миграции):**
- Новые create-заказы: всегда писать warehouse_city_key.
- Existing order при edit/save: если key отсутствует — вычислить и сохранить.
- Старые untouched заказы: читать через fallback, не ломать.
- orders.city и delivery_address не удалять, не переиспользовать как truth во время перехода.

---

## Критичные инварианты (не ломать)

- gifts = slots; fixed bundles не истина.
- cancelled не редактируется.
- платные допы не пропадают из КП.
- slot count только от total / preview total.
- выбор подарка меняет только содержимое слота.

---

## Техлид: работа с Cursor (зафиксировано 12.03.2026)

**Правила:** одна задача — один промт; явные границы «что не трогать»; требовать diff + команды + фактический результат; не принимать пересказ без доказательств.

**Антипаттерны:** несколько задач в одном промте; «заодно порефакторим»; смешивание greenhouse-calculator-main и тг бот заказы теплицы; создание новых md без необходимости.

**Шаблон точечного фикса:**
```
Задача: [конкретное действие]. Работать только в: [папка]. Не трогать: [зоны].
В ответе: список файлов, unified diff, команды проверки, фактический результат, статус (passed/failed/partial).
```

**Шаблон обновления docs:**
```
Обновить [PREPROD_PLAN | TRUTH_MAP | ...]. Новых md не создавать.
Зафиксировать только подтверждённые факты.
```

**Следующий test target:** прогон local-safe 5 тестов (команда в AUTOTEST_PLAN, раздел 2.1). При наличии тестового стенда с Supabase — прогон integration, в т.ч. gifts-save-reopen; до зелёного прогона gifts-save-reopen не считать verified.
