# План до прода

**Дата:** 2026-03-14. **Версия калькулятора:** v271.

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
- **Existing-order update через калькулятор:** manual confirmed на заказе 70000000019. Менялось только поле даты доставки; после reopen в калькуляторе новая дата сохранилась. Новая дата дошла в Google Sheets; в Telegram пришло «Заказ изменён» с корректным diff по дате (старая → новая). Это manual confirmed, не auto verified.
- **Existing multi-item identical-order update:** manual confirmed на заказе 79000000020. Менялось только `delivery_date` (18.03.2026). quantity=2, line_items=NULL; delivery_date обновился; quantity/status/gift/comment/city/commercial_offer не уехали. Подтверждает только кейс «2 одинаковые позиции через quantity=2».
- **Existing line_items-order update:** manual confirmed на заказе 79000000018. Менялось только `delivery_date`; line_items сохранился; quantity/status/comment/commercial_offer не уехали. Manual confirmed, не auto verified.
- **Existing cancel flow:** manual confirmed на заказе 79000000066. status: synced → cancelled; comment получил дописку с причиной отмены; quantity, delivery_date, line_items, commercial_offer не изменились; обычный edit-path после cancel блокируется. Manual confirmed, не auto verified.
- **Восстановление подарков в edit-модалке:** баг исправлен. Причина — parseGiftTextToSelected не распознавал текст вида «2 дополнительные форточки» и не разворачивал количество в слоты (id=window). Ручная проверка на заказе 70000000019: после reopen Подарок 1 и Подарок 2 = Дополнительная форточка. Gifts consistency в целом по-прежнему partial — integration e2e gifts-save-reopen не verified в локальном окружении (зависимость от Supabase/waitOrderSuccess).
- **Логика дат доставки:** Москва в основной форме; Набережные Челны в edit modal со сборкой — подтверждены вручную. Логика основной формы и edit modal выровнена (канонический city key в обоих).

---

## Open issues / suspected issues

- **Gifts consistency end-to-end** не закрыт полностью
- **Multi-item сценарии** не закрыты полностью. Кейс «2 одинаковые через quantity=2» manual confirmed (заказ 79000000020). Кейс update заказа с line_items manual confirmed (заказ 79000000018). Flaky автотест create-order-line-items — не считать рабочим автотестом.
- **Auto-sync after edit** без ручного /sync не confirmed; по факту не сработал.
- **Cancel flow race:** при слишком раннем нажатии «Отменить заказ» возможна «Ошибка: заказ не выбран».
- **Обычный sync:** не всегда даёт чистую проверку без lock contention
- **Auth migration** всех рабочих калькуляторов ещё не завершена

---

## Current priority

**№1:** Existing-order update flow без создания новых тестовых заказов: автоматизировать edit существующего тестового заказа (первый сценарий — смена даты доставки)

**№2:** Gifts consistency end-to-end

**№3:** Multi-item scenarios

**№4:** Auth migration map / release safety

---

## Красное (обязательно до прода)

1. **Smoke checklist** — пройти docs/SMOKE_CHECKLIST.md перед выкладкой.
2. **Автотесты** — local-safe 5 тестов зелёные (см. docs/AUTOTEST_PLAN.md, раздел 2.1). Integration-тесты — на стенде при наличии Supabase.
Сценарий existing-order update на заказе 70000000019 подтверждён вручную, но ещё не auto verified.
3. **Аудит авторизации** — проверить: вход/выход, сессия, защита админ-панели, пароли в Supabase.
4. **Синхрон калькулятор ↔ TG-проект** — заказы из калькулятора доезжают в Supabase; бот (тг бот заказы теплицы) читает и отображает. Проверить create → Supabase → бот.
5. **Версии** — scripts.js APP_VERSION, package.json _projectVersion, index.html ?v= — синхронны.

---

## Жёлтое (важно, можно после основного)

1. **Обновить legacy** — FAQ (пороги 50k → 55k), telegram-bot README/version, КОНТЕКСТ версия в шапке. См. LEGACY_MAP.md.
2. **Документация** — TRUTH_MAP, LEGACY_MAP, PREPROD_PLAN, SMOKE_CHECKLIST актуальны.

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
