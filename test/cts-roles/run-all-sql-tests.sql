-- ====================================================================
-- CTS ROLES - EXECUÇÃO COMPLETA DE TODOS OS TESTES SQL
-- ====================================================================
-- Executar este arquivo INTEIRO no Supabase SQL Editor
-- Duração: ~5 minutos
-- ====================================================================

\timing on

-- ====================================================================
-- FASE 0: PREPARAÇÃO
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FASE 0: PREPARAÇÃO';
  RAISE NOTICE '========================================';
END $$;

-- Limpar usuários de teste antigos
DELETE FROM users WHERE email LIKE 'test_%@test.com';

-- Criar usuários de teste
INSERT INTO users (id, email, name, password, role, user_type, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'test_admin@test.com', 'Test Admin', 
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCy', 'admin', 'matrix', NOW()),
  ('00000000-0000-0000-0000-000000000002', 'test_developer@test.com', 'Test Developer',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCy', 'developer', 'matrix', NOW()),
  ('00000000-0000-0000-0000-000000000003', 'test_analyst@test.com', 'Test Analyst',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCy', 'analyst', 'matrix', NOW()),
  ('00000000-0000-0000-0000-000000000004', 'test_user@test.com', 'Test User',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCy', 'user', 'matrix', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- Verificar usuários criados
SELECT '✅ Usuários de teste criados:' as status;
SELECT id, email, name, role, user_type FROM users WHERE email LIKE 'test_%@test.com' ORDER BY role;

-- ====================================================================
-- FASE 1: VALIDAÇÃO DE MIGRATION
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FASE 1: VALIDAÇÃO DE MIGRATION';
  RAISE NOTICE '========================================';
END $$;

-- Criar backup
CREATE TABLE IF NOT EXISTS roles_backup_cts AS SELECT * FROM roles;

SELECT '✅ Backup criado com ' || COUNT(*) || ' perfis' as status FROM roles_backup_cts;

-- Teste 1.1: Verificar total de permissões por perfil
SELECT '📊 TESTE 1.1: Total de permissões por perfil' as test_name;
WITH permission_counts AS (
  SELECT name, display_name, jsonb_object_keys(permissions) as key FROM roles
)
SELECT 
  name,
  display_name,
  COUNT(*) as total_permissions,
  CASE 
    WHEN COUNT(*) = 72 THEN '✅ PASSOU'
    WHEN COUNT(*) = 24 THEN '⚠️ NÃO MIGRADO'
    ELSE '❌ FALHOU: ' || COUNT(*)::text || ' permissões'
  END as result
FROM permission_counts
GROUP BY name, display_name
ORDER BY name;

-- Teste 1.2: Admin deve ter TODAS = true
SELECT '📊 TESTE 1.2: Admin com todas permissões true' as test_name;
SELECT 
  name,
  COUNT(*) FILTER (WHERE value::text = 'true') as true_count,
  CASE 
    WHEN COUNT(*) FILTER (WHERE value::text = 'true') = 72 THEN '✅ PASSOU'
    ELSE '❌ FALHOU: ' || COUNT(*) FILTER (WHERE value::text = 'true')::text || ' de 72'
  END as result
FROM roles, jsonb_each(permissions)
WHERE name = 'admin'
GROUP BY name;

-- Teste 1.3: Developer (~35 true)
SELECT '📊 TESTE 1.3: Developer com ~35 permissões true' as test_name;
SELECT 
  name,
  COUNT(*) FILTER (WHERE value::text = 'true') as true_count,
  CASE 
    WHEN COUNT(*) FILTER (WHERE value::text = 'true') BETWEEN 30 AND 40 THEN '✅ PASSOU'
    ELSE '⚠️ VERIFICAR: ' || COUNT(*) FILTER (WHERE value::text = 'true')::text
  END as result
FROM roles, jsonb_each(permissions)
WHERE name = 'developer'
GROUP BY name;

-- Teste 1.4: Analyst (~43 true)
SELECT '📊 TESTE 1.4: Analyst com ~43 permissões true' as test_name;
SELECT 
  name,
  COUNT(*) FILTER (WHERE value::text = 'true') as true_count,
  CASE 
    WHEN COUNT(*) FILTER (WHERE value::text = 'true') BETWEEN 38 AND 48 THEN '✅ PASSOU'
    ELSE '⚠️ VERIFICAR: ' || COUNT(*) FILTER (WHERE value::text = 'true')::text
  END as result
FROM roles, jsonb_each(permissions)
WHERE name = 'analyst'
GROUP BY name;

-- Teste 1.5: User (~13 true)
SELECT '📊 TESTE 1.5: User com ~13 permissões true' as test_name;
SELECT 
  name,
  COUNT(*) FILTER (WHERE value::text = 'true') as true_count,
  CASE 
    WHEN COUNT(*) FILTER (WHERE value::text = 'true') BETWEEN 10 AND 16 THEN '✅ PASSOU'
    ELSE '⚠️ VERIFICAR: ' || COUNT(*) FILTER (WHERE value::text = 'true')::text
  END as result
FROM roles, jsonb_each(permissions)
WHERE name = 'user'
GROUP BY name;

-- Teste 1.6: Verificar novas permissões existem
SELECT '📊 TESTE 1.6: Novas permissões V2.0 presentes' as test_name;
SELECT 
  name,
  CASE 
    WHEN permissions ? 'tickets_create_internal' AND
         permissions ? 'organizations_view' AND
         permissions ? 'sla_view' AND
         permissions ? 'satisfaction_view_results' AND
         permissions ? 'comments_moderate' AND
         permissions ? 'reports_export' AND
         permissions ? 'api_access' 
    THEN '✅ PASSOU'
    ELSE '❌ FALHOU: Permissões faltando'
  END as result
FROM roles
ORDER BY name;

-- ====================================================================
-- FASE 5: INTEGRIDADE DE DADOS
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FASE 5: INTEGRIDADE DE DADOS';
  RAISE NOTICE '========================================';
END $$;

-- Teste 5.1: Integridade referencial
SELECT '📊 TESTE 5.1: Integridade referencial users<->roles' as test_name;
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASSOU: Todos os usuários têm role válido'
    ELSE '❌ FALHOU: ' || COUNT(*) || ' usuários com role inválido'
  END as result
FROM users u
LEFT JOIN roles r ON u.role = r.name
WHERE r.name IS NULL AND u.email LIKE 'test_%@test.com';

-- Teste 5.2: Estrutura de permissões
SELECT '📊 TESTE 5.2: Estrutura de permissões (deve ser object)' as test_name;
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASSOU: Todas as permissões são objects'
    ELSE '❌ FALHOU: ' || COUNT(*) || ' perfis com estrutura inválida'
  END as result
FROM roles
WHERE jsonb_typeof(permissions) != 'object';

-- Teste 5.3: Valores booleanos
SELECT '📊 TESTE 5.3: Valores booleanos válidos' as test_name;
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASSOU: Todos os valores são boolean'
    ELSE '❌ FALHOU: ' || COUNT(*) || ' valores inválidos'
  END as result
FROM roles, jsonb_each(permissions)
WHERE value::text NOT IN ('true', 'false');

-- Teste 5.4: Permissões consistentes entre perfis
SELECT '📊 TESTE 5.4: Consistência de permissões entre perfis' as test_name;
WITH key_counts AS (
  SELECT 
    jsonb_object_keys(permissions) as key,
    COUNT(DISTINCT name) as role_count
  FROM roles
  GROUP BY jsonb_object_keys(permissions)
)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASSOU: Todos os perfis têm as mesmas chaves'
    ELSE '❌ FALHOU: ' || COUNT(*) || ' chaves inconsistentes'
  END as result
FROM key_counts
WHERE role_count != (SELECT COUNT(*) FROM roles);

-- Teste 5.5: Permissões específicas - Tickets Internos
SELECT '📊 TESTE 5.5: Permissões de Tickets Internos' as test_name;
SELECT 
  name,
  permissions->>'tickets_create_internal' as can_create,
  CASE 
    WHEN name = 'admin' AND permissions->>'tickets_create_internal' = 'true' THEN '✅ PASSOU'
    WHEN name = 'developer' AND permissions->>'tickets_create_internal' = 'true' THEN '✅ PASSOU'
    WHEN name = 'analyst' AND permissions->>'tickets_create_internal' = 'true' THEN '✅ PASSOU'
    WHEN name = 'user' AND permissions->>'tickets_create_internal' = 'false' THEN '✅ PASSOU'
    ELSE '❌ FALHOU'
  END as result
FROM roles
ORDER BY name;

-- Teste 5.6: Permissões específicas - Organizações
SELECT '📊 TESTE 5.6: Permissões de Organizações' as test_name;
SELECT 
  name,
  permissions->>'organizations_create' as can_create,
  CASE 
    WHEN name = 'admin' AND permissions->>'organizations_create' = 'true' THEN '✅ PASSOU'
    WHEN name IN ('developer', 'analyst') AND permissions->>'organizations_create' = 'false' THEN '✅ PASSOU'
    WHEN name = 'user' AND permissions->>'organizations_view' = 'false' THEN '✅ PASSOU'
    ELSE '❌ FALHOU'
  END as result
FROM roles
ORDER BY name;

-- Teste 5.7: Permissões específicas - API (APENAS ADMIN)
SELECT '📊 TESTE 5.7: Permissões de API (apenas admin)' as test_name;
SELECT 
  name,
  permissions->>'api_access' as has_api,
  CASE 
    WHEN name = 'admin' AND permissions->>'api_access' = 'true' THEN '✅ PASSOU'
    WHEN name != 'admin' AND permissions->>'api_access' = 'false' THEN '✅ PASSOU'
    ELSE '❌ FALHOU'
  END as result
FROM roles
ORDER BY name;

-- Teste 5.8: User NÃO deve ter permissões admin
SELECT '📊 TESTE 5.8: User sem permissões de admin' as test_name;
SELECT 
  name,
  CASE 
    WHEN permissions->>'system_users' = 'false' AND
         permissions->>'system_roles' = 'false' AND
         permissions->>'api_access' = 'false' AND
         permissions->>'organizations_create' = 'false'
    THEN '✅ PASSOU'
    ELSE '❌ FALHOU: User tem permissões admin'
  END as result
FROM roles
WHERE name = 'user';

-- ====================================================================
-- RESUMO FINAL
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESUMO FINAL';
  RAISE NOTICE '========================================';
END $$;

SELECT 
  '╔════════════════════════════════════════╗' as linha
UNION ALL SELECT '║     RESUMO DO CTS - TESTES SQL       ║'
UNION ALL SELECT '╠════════════════════════════════════════╣'
UNION ALL SELECT '║ Total de Perfis: ' || LPAD(COUNT(*)::text, 19, ' ') || ' ║'
FROM roles
UNION ALL SELECT '║ Perfis com 72 permissões: ' || LPAD((SELECT COUNT(*)::text FROM (
  SELECT name FROM roles, jsonb_object_keys(permissions) GROUP BY name HAVING COUNT(*) = 72
) as x), 12, ' ') || ' ║'
UNION ALL SELECT '║ Admin com todas true: ' || LPAD(CASE 
  WHEN (SELECT COUNT(*) FILTER (WHERE value::text = 'true') FROM roles, jsonb_each(permissions) WHERE name = 'admin') = 72 
  THEN '✅ SIM' ELSE '❌ NÃO' END, 15, ' ') || ' ║'
UNION ALL SELECT '║ Integridade: ' || LPAD(CASE 
  WHEN (SELECT COUNT(*) FROM roles, jsonb_each(permissions) WHERE value::text NOT IN ('true', 'false')) = 0
  THEN '✅ OK' ELSE '❌ ERRO' END, 26, ' ') || ' ║'
UNION ALL SELECT '║ Usuários de teste: ' || LPAD((SELECT COUNT(*)::text FROM users WHERE email LIKE 'test_%@test.com'), 18, ' ') || ' ║'
UNION ALL SELECT '╚════════════════════════════════════════╝';

-- Contar testes passados
WITH test_results AS (
  SELECT 
    CASE 
      WHEN (SELECT COUNT(*) FROM roles, jsonb_object_keys(permissions) GROUP BY name HAVING COUNT(*) = 72) = 4 THEN 1 ELSE 0 
    END +
    CASE 
      WHEN (SELECT COUNT(*) FILTER (WHERE value::text = 'true') FROM roles, jsonb_each(permissions) WHERE name = 'admin') = 72 THEN 1 ELSE 0
    END +
    CASE 
      WHEN (SELECT COUNT(*) FROM roles, jsonb_each(permissions) WHERE value::text NOT IN ('true', 'false')) = 0 THEN 1 ELSE 0
    END +
    CASE 
      WHEN (SELECT COUNT(*) FROM users u LEFT JOIN roles r ON u.role = r.name WHERE r.name IS NULL AND u.email LIKE 'test_%@test.com') = 0 THEN 1 ELSE 0
    END +
    CASE 
      WHEN (SELECT COUNT(*) FROM roles WHERE jsonb_typeof(permissions) != 'object') = 0 THEN 1 ELSE 0
    END as passed_tests
)
SELECT 
  'Testes Passados: ' || passed_tests || '/5 (' || ROUND((passed_tests::numeric / 5 * 100), 1) || '%)' as final_result
FROM test_results;

\timing off

-- FIM DOS TESTES SQL
-- Próximo: Executar testes de API via Node.js

