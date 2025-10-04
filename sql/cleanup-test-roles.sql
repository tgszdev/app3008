-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  LIMPEZA DE PERFIS DE TESTE                                        ║
-- ║  Remove perfis criados durante testes e mantém apenas os essenciais║
-- ╚════════════════════════════════════════════════════════════════════╝

-- 1. Listar perfis que serão deletados
SELECT 
  id,
  name,
  display_name,
  is_system,
  created_at
FROM roles
WHERE name IN (
  'race_test_0', 'race_test_1', 'race_test_2', 'race_test_3', 'race_test_4',
  'race_test_5', 'race_test_6', 'race_test_7', 'race_test_8', 'race_test_9',
  'array_test', 'string_test', 'xss_test', 'testrm-rf', 
  'duplicate_test', 'empty_test', 'custom_escalation', 'concurrent_test'
)
ORDER BY name;

-- 2. Verificar se há usuários usando esses perfis
SELECT 
  r.name as role_name,
  COUNT(u.id) as users_count
FROM roles r
LEFT JOIN users u ON u.role = r.name
WHERE r.name IN (
  'race_test_0', 'race_test_1', 'race_test_2', 'race_test_3', 'race_test_4',
  'race_test_5', 'race_test_6', 'race_test_7', 'race_test_8', 'race_test_9',
  'array_test', 'string_test', 'xss_test', 'testrm-rf', 
  'duplicate_test', 'empty_test', 'custom_escalation', 'concurrent_test'
)
GROUP BY r.name
HAVING COUNT(u.id) > 0;

-- 3. DELETAR perfis de teste (CUIDADO: Irreversível!)
-- Descomente apenas se tiver certeza
/*
DELETE FROM roles
WHERE name IN (
  'race_test_0', 'race_test_1', 'race_test_2', 'race_test_3', 'race_test_4',
  'race_test_5', 'race_test_6', 'race_test_7', 'race_test_8', 'race_test_9',
  'array_test', 'string_test', 'xss_test', 'testrm-rf', 
  'duplicate_test', 'empty_test', 'custom_escalation', 'concurrent_test'
)
AND NOT EXISTS (
  SELECT 1 FROM users WHERE users.role = roles.name
);
*/

-- 4. Verificar perfis restantes
SELECT 
  id,
  name,
  display_name,
  is_system,
  (SELECT COUNT(*) FROM users WHERE users.role = roles.name) as users_count,
  created_at
FROM roles
ORDER BY is_system DESC, name;

-- 5. Garantir que perfis essenciais existem
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

-- 6. Atualizar 'n2' para ser role de sistema também (se existir)
UPDATE roles
SET is_system = true
WHERE name = 'n2';

-- 7. Resultado final
SELECT 
  '=== PERFIS FINAIS ===' as status,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_system = true) as system_roles,
  COUNT(*) FILTER (WHERE is_system = false) as custom_roles
FROM roles;

-- 8. Listar perfis finais
SELECT 
  name,
  display_name,
  is_system,
  (SELECT COUNT(*) FROM users WHERE users.role = roles.name) as users_count,
  Object_keys(permissions)::text[] as permission_keys_sample
FROM roles
ORDER BY is_system DESC, name;

