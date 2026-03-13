# Аудит авторизации калькулятора

**Дата:** 2026-03-12. **Обновлено:** v271 — логин через RPC, пароль не в браузере.

---

## 1. Как работает вход (после v271)

| Элемент | Источник |
|---------|----------|
| **Логин** | DOM `#login` |
| **Пароль** | DOM `#password` → только в RPC, в браузер не возвращается |
| **Проверка пароля** | RPC `authenticate_user(p_login, p_password)` — на сервере |
| **Проверка сессии** | RPC `validate_session(p_login, p_password_version)` |
| **Клиент** | `supabase.rpc('authenticate_user', {...})` — пароль в ответе нет |
| **Сессия** | localStorage: `savedLogin`, `passwordVersion`, `userId`, `ADMIN_KEY` |

**Цепочка:** браузер → `supabase.rpc('authenticate_user', {p_login, p_password})` → RPC сравнивает пароль на сервере → возвращает `{user_id, login, password_version, is_active}` или null.

---

## 2. Что опасно

| Риск | Факт |
|------|------|
| **Пароли в открытом виде** | Поле `password` в `users` — plain text. Читается и сравнивается на клиенте. |
| **Чтение users из браузера** | Запрос идёт с anon key. Если RLS на `users` выключен или разрешает SELECT — любой может прочитать все пароли. |
| **Обход проверки** | Вся логика в JS. Можно изменить код или вызвать Supabase напрямую с anon key. |
| **Сессия в localStorage** | Нет серверной сессии. XSS даёт доступ к `savedLogin`, `passwordVersion`. |
| **Anon key в коде** | Жёстко прописан в scripts.js. Любой может делать запросы к Supabase от имени приложения. |
| **Смена пароля** | RPC `update_user_password` или прямой `.update()` на `users`. Пароль пишется в БД в открытом виде. |

**RLS:** В миграциях нет политик для `users`. По умолчанию в Supabase при выключенном RLS таблица доступна для чтения/записи. Нужно проверить в Supabase Dashboard.

---

## 3. Что обязательно исправить до прода

**Красное:**

1. **Проверить RLS на `users`**  
   В Supabase: Table Editor → users → RLS. Если RLS выключен — включить и запретить SELECT/UPDATE для `anon`. Иначе все пароли читаемы.

2. **Убрать чтение `password` на клиенте**  
   Пароль не должен приходить в браузер. Нужен серверный слой проверки (RPC или Edge Function).

3. **Хранить пароли в хеше**  
   В БД — только хеш (bcrypt/argon2). Сравнение — только на сервере.

---

## 4. Что можно отложить

**Жёлтое:**

- Сессия в localStorage — при XSS уязвимо, но требует отдельной уязвимости.
- Anon key в коде — типично для SPA, риск при утечке кода.
- Периодическая проверка `password_version` — ок, но зависит от п.1–3.

**Зелёное:**

- Логика `checkPasswordVersion`, разлогин при смене пароля.
- RPC `update_user_password` (SECURITY DEFINER) — подходит для смены пароля, если пароль будет хешироваться внутри RPC.

---

## 5. Самый безопасный следующий шаг

**Минимальный вариант без отдельного сервера:**

1. **Supabase**  
   - Включить RLS на `users`.  
   - Политика: `anon` не может делать SELECT/UPDATE/INSERT на `users`.

2. **RPC для входа**  
   - Создать `authenticate_user(p_login TEXT, p_password TEXT)`  
   - SECURITY DEFINER, внутри: читает `users`, сравнивает пароль (или хеш), возвращает `{user_id, password_version, is_active}` или null.  
   - `GRANT EXECUTE TO anon`.

3. **Клиент**  
   - Убрать `.from('users').select(..., password, ...)`.  
   - Вызывать только `supabase.rpc('authenticate_user', {p_login, p_password})`.  
   - По ответу сохранять в localStorage `userId`, `passwordVersion`, `savedLogin`.

4. **Пароли в БД**  
   - Постепенно перевести на хеш: в RPC `authenticate_user` проверять хеш; в `update_user_password` — хешировать пароль перед записью.

**Без п.1** — при включённом RLS и открытом SELECT для anon пароли остаются доступны. Первый шаг — проверить RLS в Supabase.

---

## Чек-лист перед прода

- [ ] RLS на `users` включен и блокирует anon
- [ ] Пароль не читается на клиенте (есть RPC auth)
- [ ] Пароли в БД хранятся в виде хеша (или план миграции)
