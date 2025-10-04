-- Verificar TODOS os perfis e ver se admin foi deletado acidentalmente
SELECT 
  id,
  name, 
  display_name, 
  is_system,
  created_at,
  (SELECT COUNT(*) FROM users WHERE users.role::text = roles.name) as users_count
FROM roles 
ORDER BY name;

-- Verificar se admin foi deletado nos logs
SELECT * FROM role_audit_log 
WHERE role_name = 'admin' 
ORDER BY changed_at DESC 
LIMIT 5;

-- Recriar perfis de sistema se não existirem
INSERT INTO roles (name, display_name, description, permissions, is_system)
VALUES 
  ('admin', 'Administrador', 'Acesso total ao sistema', '{}', true),
  ('dev', 'Desenvolvedor', 'Desenvolvimento e correções', '{}', true),
  ('analyst', 'Analista', 'Gerenciamento de tickets e conteúdo', '{}', true),
  ('user', 'Usuário', 'Acesso básico ao sistema', '{}', true)
ON CONFLICT (name) DO UPDATE
SET 
  is_system = true,
  updated_at = CURRENT_TIMESTAMP;

-- Ver resultado final
SELECT 
  COUNT(*) as total_roles,
  COUNT(*) FILTER (WHERE is_system = true) as system_roles,
  COUNT(*) FILTER (WHERE is_system = false) as custom_roles,
  array_agg(name ORDER BY name) as all_roles
FROM roles;

-- Listar todos
SELECT name, display_name, is_system, 
       (SELECT COUNT(*) FROM users WHERE users.role::text = roles.name) as users_count
FROM roles 
ORDER BY is_system DESC, name;

