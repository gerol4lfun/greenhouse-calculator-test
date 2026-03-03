-- RPC для смены пароля пользователя (обходит RLS благодаря SECURITY DEFINER)
-- Вызывается из админ-панели. После обновления password_version пользователь будет разлогинен при следующей проверке.
-- Выполнить в Supabase SQL Editor

DROP FUNCTION IF EXISTS update_user_password(TEXT, TEXT);

CREATE OR REPLACE FUNCTION update_user_password(p_login TEXT, p_new_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE users
  SET 
    password = p_new_password,
    password_version = COALESCE(password_version, 0) + 1
  WHERE login = p_login;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Пользователь с логином % не найден', p_login;
  END IF;
END;
$$;

-- Разрешаем вызов для anon (калькулятор использует anon key)
GRANT EXECUTE ON FUNCTION update_user_password(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION update_user_password(TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION update_user_password IS 'Смена пароля пользователя. Увеличивает password_version — сессии на других устройствах истекут при следующей проверке.';
