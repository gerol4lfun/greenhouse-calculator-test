# Деплой auth-RPC: безопасный релиз

**Дата:** 12.03.2026. **Версия:** v271.

---

## 1. Что меняем в коде

| Файл | Изменение |
|------|-----------|
| `js/scripts.js` | `authenticate()` → RPC `authenticate_user` |
| `js/scripts.js` | `checkPasswordVersion()` → RPC `validate_session` |
| `js/scripts.js` | `ADMIN_PANEL_DISABLED = true` — кнопка «Админ-панель» скрыта |
| `js/scripts.js` | `loadUsersForAdmin`, `changeUserPassword`, `toggleAdminPanel` — guard по `ADMIN_PANEL_DISABLED` |
| `index.html` | `?v=271` для scripts.js |
| `package.json` | `_projectVersion: "v271"` |

---

## 2. Что временно отключаем в админке

| Элемент | Действие |
|---------|----------|
| Кнопка «Админ-панель» | Всегда скрыта (`ADMIN_PANEL_DISABLED = true`) |
| `toggleAdminPanel()` | При вызове — сообщение «Админ-панель временно недоступна» |
| `loadUsersForAdmin()` | Не вызывается (early return) |
| `changeUserPassword()` | Не вызывается (early return) |

**Смена логина/пароля:** вручную через Supabase SQL Editor (см. раздел 6).

---

## 3. Порядок внедрения

### Шаг 1. SQL в Supabase

**1.1. Отозвать доступ к update_user_password** (если функция уже есть — миграция 20260215):

```sql
REVOKE EXECUTE ON FUNCTION update_user_password(TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION update_user_password(TEXT, TEXT) FROM authenticated;
```

**1.2. Удалить или отозвать** get_users_for_admin, update_user_login (если созданы):

```sql
DROP FUNCTION IF EXISTS get_users_for_admin();
DROP FUNCTION IF EXISTS update_user_login(UUID, TEXT);
```

**1.3. Применить** `db/migrations/20260312_create_authenticate_user_rpc_SAFE.sql`:
- `authenticate_user(p_login, p_password)`
- `validate_session(p_login, p_password_version)`

**Не выполнять:** `20260312_create_authenticate_user_rpc.sql` (содержит небезопасные admin RPC).

### Шаг 2. Деплой калькулятора

Push v271: `scripts.js`, `index.html`, `package.json`. Деплой на GitHub Pages.

### Шаг 3. Проверка

- Вход в калькулятор
- checkPasswordVersion (переключить вкладку, подождать 30 сек)
- Кнопка «Админ-панель» не отображается

### Шаг 4. Удалить policy

Выполнить `db/migrations/20260312_drop_users_anon_read_policy.sql`:

```sql
DROP POLICY IF EXISTS "Allow anon to read active users" ON users;
```

### Шаг 5. Финальная проверка

- Вход работает
- checkPasswordVersion работает
- Прямой `.from('users')` с anon key больше не возвращает данные

---

## 4. Policy для удаления

| Policy | Таблица |
|--------|---------|
| **Allow anon to read active users** | users |

---

## 5. Diff / patch-plan

```
scripts.js:
+ const ADMIN_PANEL_DISABLED = true;
  authenticate() → supabase.rpc('authenticate_user', {...})
  checkPasswordVersion() → supabase.rpc('validate_session', {...})
  toggleAdminPanel() → if (ADMIN_PANEL_DISABLED) showWarning(...); return;
  loadUsersForAdmin() → if (ADMIN_PANEL_DISABLED) return;
  changeUserPassword() → if (ADMIN_PANEL_DISABLED) return;
  initializeCalculator: admin button hidden when ADMIN_PANEL_DISABLED
  setTimeout admin check: admin button hidden when ADMIN_PANEL_DISABLED
```

---

## 6. Ручная смена логина/пароля (пока админка отключена)

**Supabase → SQL Editor**

### Смена пароля

```sql
-- Сменить пароль пользователя с логином 'admin'
UPDATE users 
SET password = 'новый_пароль',
    password_version = COALESCE(password_version, 0) + 1,
    updated_at = NOW()
WHERE login = 'admin';
```

### Смена логина

```sql
-- Сменить логин пользователя
UPDATE users 
SET login = 'новый_логин',
    updated_at = NOW()
WHERE login = 'старый_логин';
```

### Деактивация пользователя

```sql
UPDATE users SET is_active = false, updated_at = NOW() WHERE login = 'логин';
```

### Добавление пользователя

```sql
INSERT INTO users (login, password, password_version, is_active, created_at, updated_at)
VALUES ('логин', 'пароль', 1, true, NOW(), NOW());
```

---

## 7. Включение админки позже

1. Создать безопасные admin RPC с проверкой `p_caller_login` + `p_caller_password_version` = admin.
2. Обновить `loadUsersForAdmin` и `changeUserPassword` для вызова новых RPC.
3. Поставить `ADMIN_PANEL_DISABLED = false`.
