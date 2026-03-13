-- RPC для аутентификации (пароль не уходит в браузер)
-- БЕЗОПАСНЫЙ ВАРИАНТ: только authenticate_user и validate_session
-- get_users_for_admin и update_user_login НЕ включать
-- Выполнить в Supabase SQL Editor

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

  IF NOT COALESCE(v_row.is_active, true) THEN
    RETURN NULL;
  END IF;

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
