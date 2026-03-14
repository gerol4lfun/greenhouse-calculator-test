# План auth-RPC v2: безопасный вариант

**Дата:** 12.03.2026. **Причина:** admin RPC (get_users_for_admin, update_user_login) небезопасны — доступны любому с anon key.

---

## 1. Что оставляем в релизе

| RPC | Назначение | Безопасность |
|-----|------------|--------------|
| **authenticate_user(p_login, p_password)** | Логин, пароль не уходит в браузер | Приемлемо: проверяет пароль, возвращает только user_id, login, password_version, is_active |
| **validate_session(p_login, p_password_version)** | checkPasswordVersion | Приемлемо: проверяет сессию по login+version, не раскрывает чувствительных данных |

**GRANT:** anon, authenticated — оба нужны (калькулятор использует anon key).

---

## 2. Что вырезаем / откладываем

| RPC | Причина |
|-----|---------|
| **get_users_for_admin()** | Любой с anon key может вызвать и получить список всех пользователей (id, login, is_active). Нет проверки, что вызов делает admin. |
| **update_user_login(p_user_id, p_new_login)** | Любой может сменить логин любому пользователю. Нет проверки прав. |

**Примечание:** `update_user_password(p_login, p_new_password)` — уже существует, та же проблема (любой может сменить пароль любому). Отдельная задача — добавить проверку admin.

---

## 3. Обновлённый SQL-план

### Шаг 1. Выполнить только auth RPC (без admin)

Файл: `db/migrations/20260312_create_authenticate_user_rpc_SAFE.sql` (см. ниже)

Содержит **только**:
- `authenticate_user(p_login, p_password)`
- `validate_session(p_login, p_password_version)`

**Не создавать:** get_users_for_admin, update_user_login.

### Шаг 2. Клиентский код

- `authenticate()` → `supabase.rpc('authenticate_user', {...})` ✓
- `checkPasswordVersion()` → `supabase.rpc('validate_session', {...})` ✓
- `loadUsersForAdmin()` → **вернуть** `.from('users').select('id, login, is_active')` (откат к старому)
- `changeUserPassword()` → смена логина: **вернуть** `.from('users').update({ login })` (откат)

### Шаг 3. Policy

**НЕ удалять** policy "Allow anon to read active users" в этом релизе.

Причина: loadUsersForAdmin и changeUserPassword (login update) всё ещё используют `.from('users')`. Без policy они сломаются.

**Файл `20260312_drop_users_anon_read_policy.sql` — НЕ выполнять.**

### Шаг 4. Итог

- Пароль в браузер не приходит (login через RPC).
- checkPasswordVersion не читает users напрямую.
- Policy остаётся → anon по-прежнему может читать users через PostgREST (в т.ч. password). Прямые вызовы API остаются уязвимыми.
- Админка работает: loadUsersForAdmin и changeUserLogin — через .from('users').

---

## 4. Риски, если оставить admin RPC как сейчас

| Риск | Описание |
|------|----------|
| **Утечка списка пользователей** | get_users_for_admin() — любой может получить id, login, is_active всех пользователей |
| **Подмена логина** | update_user_login() — любой может сменить логин любому (в т.ч. admin → другой) |
| **Подмена пароля** | update_user_password() (уже есть) — любой может сменить пароль любому |
| **Эскалация** | Злоумышленник с anon key может заблокировать admin, сменив ему логин/пароль |

---

## 5. Безопасный вариант admin RPC (для следующего этапа)

Если нужно убрать policy и при этом сохранить админку:

**Идея:** передавать в RPC `p_caller_login` и `p_caller_password_version` из localStorage. RPC проверяет: существует пользователь с login=p_caller_login, password_version=p_caller_password_version, is_active, и **login = 'admin'**. Только тогда выполняет действие.

```sql
-- Пример: get_users_for_admin(p_caller_login, p_caller_password_version)
-- В начале функции:
IF NOT EXISTS (
  SELECT 1 FROM users 
  WHERE login = p_caller_login 
    AND password_version::text = p_caller_password_version 
    AND is_active 
    AND LOWER(TRIM(login)) = 'admin'
) THEN
  RETURN; -- или RAISE EXCEPTION
END IF;
```

**Ограничение:** проверка по session (login+password_version). Если сессия украдена — злоумышленник может выдать себя за admin. Но это лучше, чем "любой без проверки".

---

## 6. Ответы на вопросы

**Можно ли безопасно выпускать auth-фикс без admin RPC?**  
Да. Логин и checkPasswordVersion переходят на RPC. Пароль не уходит в браузер в нашем клиенте. Policy остаётся — полное закрытие дыры откладывается.

**Что сломается/не сломается в админке?**  
- **Не сломается:** если откатить loadUsersForAdmin и changeUserPassword к .from('users'), сохранить policy.  
- **Сломается:** если оставить вызовы get_users_for_admin и update_user_login в коде, но не создавать эти RPC — ошибки при открытии админки и смене логина.

**Вывод:** откат loadUsersForAdmin и changeUserPassword к `.from('users')` + policy остаётся. Админка работает. Дыра (anon может читать users) остаётся до этапа с безопасными admin RPC.
