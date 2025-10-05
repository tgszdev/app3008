-- ========================================
-- HABILITAR EMAIL EM NOTIFICAÇÕES DE COMENTÁRIOS
-- ========================================
-- Este script atualiza as preferências de notificação para
-- habilitar emails quando novos comentários são adicionados

-- 1️⃣ Atualizar usuários existentes
UPDATE user_notification_preferences
SET comment_added = '{"email": true, "push": true, "in_app": true}'::jsonb
WHERE comment_added->>'email' = 'false';

-- 2️⃣ Alterar o padrão da coluna para novos usuários
ALTER TABLE user_notification_preferences
ALTER COLUMN comment_added SET DEFAULT '{"email": true, "push": true, "in_app": true}'::jsonb;

-- 3️⃣ Verificar quantos usuários foram atualizados
SELECT 
  COUNT(*) AS total_users,
  COUNT(*) FILTER (WHERE comment_added->>'email' = 'true') AS email_enabled,
  COUNT(*) FILTER (WHERE comment_added->>'email' = 'false') AS email_disabled
FROM user_notification_preferences;

-- 4️⃣ Criar preferências padrão para usuários sem registro
INSERT INTO user_notification_preferences (user_id, email_enabled, comment_added)
SELECT 
  u.id,
  true,
  '{"email": true, "push": true, "in_app": true}'::jsonb
FROM users u
LEFT JOIN user_notification_preferences p ON u.id = p.user_id
WHERE p.id IS NULL
  AND u.is_active = true;

-- ✅ Resultado esperado:
-- - Todos os usuários existentes agora receberão emails de comentários
-- - Novos usuários terão emails de comentários habilitados por padrão

