# План до прода

**Дата:** 2026-03-15. **Версия калькулятора:** v271.

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
- **Восстановление подарков в edit-модалке:** баг исправлен. Причина — parseGiftTextToSelected не распознавал текст вида «2 дополнительные форточки» и не разворачивал количество в слоты (id=window). Ручная проверка на заказе 70000000019: после reopen Подарок 1 и Подарок 2 = Дополнительная форточка. Gifts consistency в целом по-прежнему partial — integration e2e gifts-save-reopen не verified в локальном окружении (зависимость от Supabase/waitOrderSuccess).
- **Gifts raw-preserve на legacy existing order:** manual confirmed на заказе 8e803d39-db87-4da1-b420-4325a29e0dfb (client_phone 79266302494, Жирнов Сергей). Меняли только delivery_date; gift остался literally «форточка 1 шт.» — legacy gift не переписывается в канонический формат при edit другого поля.
- **Edit calendar source-of-truth:** manual confirmed. Календарь в edit existing order использует приоритет: orders.city → line_items[].city → fallback derive from address. Alias (МСК, СПБ, Питер) нормализуется. Fix #1 (item.city preserve) и fix #2 (prefix strip) внесены. Кейсы: 8e803d39 (orders.city=МСК); 79000000028 (orders.city="г. Санкт-Петербург") — на актуальном калькуляторе календарь показывает реальные ограничения. Ранее false negative — проверка на неактуальном билде.
- **Логика дат доставки:** Москва в основной форме; Набережные Челны в edit modal со сборкой — подтверждены вручную. Логика основной формы и edit modal выровнена (канонический city key в обоих).

---

## Open issues / suspected issues

- **Phone scope:** dual-phone UI не реализован. Legacy untouched raw-preserve подтверждён. Explicit edit dual-phone, поиск по dual-phone, отдельное поле второго номера — не подтверждены, future step. См. TRUTH_MAP.md.
- **Calendar region→city mapping:** для заказов без orders.city fallback derive из address использует region→canonical mapping (Московская область→Москва и т.п.). Primary fix — source-of-truth (orders.city first) — подтверждён.
- **Адресный контур / display vs warehouse key:** принято решение — вводим orders.warehouse_city_key. См. TRUTH_MAP.md «Архитектурное решение: warehouse_city_key» и раздел ниже.
- **Gifts consistency end-to-end** не закрыт полностью
- **Multi-item сценарии** не закрыты полностью. Кейс «2 одинаковые через quantity=2» manual confirmed (заказ 79000000020). Кейс update заказа с line_items manual confirmed (заказ 79000000018). Flaky автотест create-order-line-items — не считать рабочим автотестом.
- **Auto-sync after edit:** на стороне калькулятора/Supabase change-signal (`orders.updated_at`) подтверждён. Downstream TG/Sheets без ручного /sync — отдельный контур, не входит в scope калькулятора.
- **Cancel flow race:** при слишком раннем нажатии «Отменить заказ» возможна «Ошибка: заказ не выбран».
- **Обычный sync:** не всегда даёт чистую проверку без lock contention
- **Auth migration** всех рабочих калькуляторов ещё не завершена

---

## Current priority

**№1:** Existing-order update flow: калькуляторный edit + updated_at signal подтверждены. Автоматизировать edit в e2e (первый сценарий — смена даты доставки) — следующий шаг.

**№2:** Gifts consistency end-to-end

**№3:** Multi-item scenarios

**№4:** Auth migration map / release safety

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
