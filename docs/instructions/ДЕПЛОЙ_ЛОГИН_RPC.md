# Деплой: переход логина на RPC (пароль не в браузере)

**Дата:** 12.03.2026. **Версия калькулятора:** v270.

---

## Порядок внедрения

### Шаг 1. Выполнить SQL в Supabase

В Supabase → SQL Editor выполнить **по порядку**:

1. `db/migrations/20260312_create_authenticate_user_rpc.sql` — создаёт RPC:
   - `authenticate_user(p_login, p_password)` — логин
   - `validate_session(p_login, p_password_version)` — проверка сессии
   - `get_users_for_admin()` — список пользователей для админки
   - `update_user_login(p_user_id, p_new_login)` — смена логина

### Шаг 2. Задеплоить калькулятор

Обновить `js/scripts.js` (v270) и `index.html` (?v=270). Push в greenhouse-calculator, деплой на GitHub Pages.

### Шаг 3. Проверить логин

Войти в калькулятор, проверить checkPasswordVersion (подождать 30 сек или переключить вкладку), открыть админ-панель, сменить пароль/логин.

### Шаг 4. Удалить policy на users

**Только после успешной проверки шага 3.**

Выполнить в Supabase SQL Editor:

```
db/migrations/20260312_drop_users_anon_read_policy.sql
```

Удаляет policy **"Allow anon to read active users"** на таблице `users`. После этого anon не может читать users через PostgREST. Все операции идут через RPC.

---

## Policy для удаления

| Policy | Таблица | Действие |
|--------|---------|----------|
| **Allow anon to read active users** | users | DROP POLICY |

Проверка: `SELECT * FROM pg_policies WHERE tablename = 'users';`

---

## TODO (отдельные этапы)

- **Хеширование паролей:** в RPC `authenticate_user` заменить plain text на `crypt(p_password, password_hash) = password_hash`; в `update_user_password` — хешировать перед записью.
- **RLS на users:** после удаления policy anon не читает users. При необходимости добавить RLS для других ролей.
