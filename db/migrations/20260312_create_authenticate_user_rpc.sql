-- RPC для аутентификации (пароль не уходит в браузер)
-- Выполнить в Supabase SQL Editor
-- После внедрения: удалить policy "Allow anon to read active users" на таблице users

-- authenticate_user: логин + проверка пароля на сервере
-- Возвращает user_id, login, password_version, is_active или null при ошибке
-- TODO: перевести на hash (bcrypt) — сейчас plain text для быстрого перехода
DROP FUNCTION IF EXISTS authenticate_user(TEXT, TEXT);

CREATE OR REPLACE FUNCTION authenticate_user(p_login TEXT, p_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
BEGIN
  SELECT id, login, password, password_version, is_active
  INTO v_row
  FROM users
  WHERE login = p_login
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Неактивный пользователь
  IF NOT COALESCE(v_row.is_active, true) THEN
    RETURN NULL;
  END IF;

  -- Сравнение пароля (plain text, TODO: заменить на crypt/verify)
  IF TRIM(COALESCE(v_row.password, '')) <> TRIM(COALESCE(p_password, '')) THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'user_id', v_row.id,
    'login', v_row.login,
    'password_version', COALESCE(v_row.password_version, 0),
    'is_active', v_row.is_active
  );
END;
$$;

GRANT EXECUTE ON FUNCTION authenticate_user(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION authenticate_user(TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION authenticate_user IS 'Аутентификация: проверка пароля на сервере. Пароль в браузер не возвращается. TODO: перевести на bcrypt.';


-- validate_session: проверка сессии (для checkPasswordVersion)
-- Возвращает user_id, password_version, is_active или null
DROP FUNCTION IF EXISTS validate_session(TEXT, TEXT);

CREATE OR REPLACE FUNCTION validate_session(p_login TEXT, p_password_version TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
BEGIN
  SELECT id, password_version, is_active
  INTO v_row
  FROM users
  WHERE login = p_login
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF NOT COALESCE(v_row.is_active, true) THEN
    RETURN NULL;
  END IF;

  IF COALESCE(v_row.password_version::text, '0') <> COALESCE(p_password_version, '') THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'user_id', v_row.id,
    'password_version', COALESCE(v_row.password_version, 0),
    'is_active', v_row.is_active
  );
END;
$$;

GRANT EXECUTE ON FUNCTION validate_session(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION validate_session(TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION validate_session IS 'Проверка сессии: login + password_version. Для checkPasswordVersion.';


-- get_users_for_admin: список пользователей для админ-панели (без password)
DROP FUNCTION IF EXISTS get_users_for_admin();

CREATE OR REPLACE FUNCTION get_users_for_admin()
RETURNS TABLE(user_id UUID, login TEXT, is_active BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.login, COALESCE(u.is_active, true)
  FROM users u
  ORDER BY u.login;
END;
$$;

GRANT EXECUTE ON FUNCTION get_users_for_admin() TO anon;
GRANT EXECUTE ON FUNCTION get_users_for_admin() TO authenticated;

COMMENT ON FUNCTION get_users_for_admin IS 'Список пользователей для админ-панели. Без password.';


-- update_user_login: смена логина (для админ-панели)
DROP FUNCTION IF EXISTS update_user_login(UUID, TEXT);

CREATE OR REPLACE FUNCTION update_user_login(p_user_id UUID, p_new_login TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE users
  SET login = p_new_login, updated_at = NOW()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Пользователь с id % не найден', p_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION update_user_login(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION update_user_login(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION update_user_login IS 'Смена логина пользователя. Для админ-панели.';
