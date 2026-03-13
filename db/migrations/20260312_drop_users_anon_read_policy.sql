-- Выполнить ПОСЛЕ внедрения RPC (authenticate_user, validate_session, get_users_for_admin)
-- и деплоя клиентского кода. Иначе логин и checkPasswordVersion перестанут работать.

-- Удаление policy, которая позволяла anon читать users (в т.ч. password)
DROP POLICY IF EXISTS "Allow anon to read active users" ON users;

-- Проверить: SELECT * FROM pg_policies WHERE tablename = 'users';
-- После удаления anon не должен иметь доступа к users через PostgREST.
-- Все операции идут через RPC: authenticate_user, validate_session, get_users_for_admin, update_user_login, update_user_password.
