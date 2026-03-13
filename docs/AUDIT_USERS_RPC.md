# Аудит: users-related RPC и доступ anon

**Дата:** 12.03.2026. **Код не менялся.**

---

## 1. Список функций, связанных с users

| Функция | Миграция | Таблица | GRANT anon |
|---------|----------|---------|------------|
| **authenticate_user(p_login, p_password)** | 20260312_SAFE | users (SELECT) | ✓ (нужен) |
| **validate_session(p_login, p_password_version)** | 20260312_SAFE | users (SELECT) | ✓ (нужен) |
| **update_user_password(p_login, p_new_password)** | **20260215** | users (UPDATE) | ✓ **ОПАСНО** |
| **get_users_for_admin()** | 20260312 (full) | users (SELECT) | ✓ (если создана) |
| **update_user_login(p_user_id, p_new_login)** | 20260312 (full) | users (UPDATE) | ✓ (если создана) |

---

## 2. Какие опасны

| Функция | Риск |
|---------|------|
| **update_user_password** | Любой с anon key может сменить пароль любому пользователю. Миграция 20260215 уже применена — функция, скорее всего, есть в Supabase. |
| **get_users_for_admin** | Любой может получить список id, login, is_active. Опасна, если создана (полный 20260312). |
| **update_user_login** | Любой может сменить логин любому. Опасна, если создана. |

**authenticate_user** и **validate_session** — приемлемы: проверяют пароль/сессию, не дают произвольного доступа.

---

## 3. Какие GRANT EXECUTE надо убрать

### update_user_password (критично)

```sql
REVOKE EXECUTE ON FUNCTION update_user_password(TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION update_user_password(TEXT, TEXT) FROM authenticated;
```

После этого вызов из калькулятора (anon key) перестанет работать. Админка отключена, вызовов нет — отзыв безопасен.

### get_users_for_admin (если создана)

```sql
REVOKE EXECUTE ON FUNCTION get_users_for_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION get_users_for_admin() FROM authenticated;
```

### update_user_login (если создана)

```sql
REVOKE EXECUTE ON FUNCTION update_user_login(UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION update_user_login(UUID, TEXT) FROM authenticated;
```

---

## 4. Что обязательно сделать до удаления policy

1. **Проверить в Supabase**, какие функции есть:
   ```sql
   SELECT routine_name, routine_type 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name IN ('update_user_password', 'get_users_for_admin', 'update_user_login', 'authenticate_user', 'validate_session');
   ```

2. **Отозвать GRANT для update_user_password** (если функция есть):
   ```sql
   REVOKE EXECUTE ON FUNCTION update_user_password(TEXT, TEXT) FROM anon;
   REVOKE EXECUTE ON FUNCTION update_user_password(TEXT, TEXT) FROM authenticated;
   ```

3. **Удалить get_users_for_admin и update_user_login**, если они созданы и не используются:
   ```sql
   DROP FUNCTION IF EXISTS get_users_for_admin();
   DROP FUNCTION IF EXISTS update_user_login(UUID, TEXT);
   ```
   Либо отозвать GRANT (если функции нужны для будущей безопасной админки).

4. **Применить SAFE RPC** (authenticate_user, validate_session), если ещё не применены.

5. **Задеплоить клиент** v271 (ADMIN_PANEL_DISABLED = true).

6. **Удалить policy** "Allow anon to read active users".

---

## 5. Порядок действий (итог)

| # | Действие |
|---|----------|
| 1 | Supabase: проверить наличие update_user_password, get_users_for_admin, update_user_login |
| 2 | REVOKE EXECUTE для update_user_password FROM anon, authenticated |
| 3 | DROP или REVOKE для get_users_for_admin, update_user_login (если есть) |
| 4 | Применить 20260312_create_authenticate_user_rpc_SAFE.sql |
| 5 | Деплой калькулятора v271 |
| 6 | DROP POLICY "Allow anon to read active users" |

---

## 6. Другие RPC (не users)

| Функция | Связь с users | GRANT anon |
|---------|---------------|------------|
| get_knowledge_base | Нет | Нет в миграции |
| update_delivery_dates_row | Нет | Только service_role |

В рамках этого аудита не рассматриваются.
