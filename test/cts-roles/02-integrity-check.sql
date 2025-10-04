-- ====================================================================
-- CTS ROLES - FASE 5: Verificação de Integridade
-- ====================================================================
-- Executar no Supabase SQL Editor
-- Duração: ~30 segundos
-- ====================================================================

-- 1. VERIFICAR INTEGRIDADE REFERENCIAL
SELECT 
  u.id,
  u.email,
  u.role,
  r.name as role_exists,
  CASE 
    WHEN r.name IS NOT NULL THEN '✅ OK'
    ELSE '❌ ROLE NÃO EXISTE'
  END as status
FROM users u
LEFT JOIN roles r ON u.role = r.name
WHERE u.email LIKE 'test_%@test.com'
ORDER BY u.role;

-- ✅ Esperado: Todos com '✅ OK'

-- ====================================================================

-- 2. VERIFICAR PERMISSÕES AUSENTES
SELECT 
  name,
  display_name,
  CASE 
    WHEN permissions ? 'tickets_create_internal' AND
         permissions ? 'organizations_view' AND
         permissions ? 'sla_view' AND
         permissions ? 'satisfaction_view_results' AND
         permissions ? 'comments_moderate' AND
         permissions ? 'reports_export' AND
         permissions ? 'api_access' AND
         permissions ? 'notifications_send_broadcast' 
    THEN '✅ TODAS PRESENTES'
    ELSE '❌ PERMISSÕES FALTANDO'
  END as permission_status
FROM roles
ORDER BY name;

-- ✅ Esperado: Todos com '✅ TODAS PRESENTES'

-- ====================================================================

-- 3. VERIFICAR ESTRUTURA DE PERMISSÕES
SELECT 
  name,
  jsonb_typeof(permissions) as type,
  CASE 
    WHEN jsonb_typeof(permissions) = 'object' THEN '✅ OK'
    ELSE '❌ TIPO INVÁLIDO: ' || jsonb_typeof(permissions)
  END as status
FROM roles
ORDER BY name;

-- ✅ Esperado: Todos com type='object' e status='✅ OK'

-- ====================================================================

-- 4. VERIFICAR VALORES BOOLEANOS
WITH invalid_values AS (
  SELECT 
    name,
    key,
    value
  FROM roles, jsonb_each(permissions)
  WHERE value::text NOT IN ('true', 'false')
)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ TODOS OS VALORES SÃO BOOLEAN'
    ELSE '❌ ENCONTRADOS ' || COUNT(*) || ' VALORES INVÁLIDOS'
  END as boolean_check,
  COUNT(*) as invalid_count
FROM invalid_values;

-- ✅ Esperado: '✅ TODOS OS VALORES SÃO BOOLEAN' com invalid_count=0

-- Se houver valores inválidos, listar:
SELECT 
  name,
  key as permission,
  value as invalid_value
FROM roles, jsonb_each(permissions)
WHERE value::text NOT IN ('true', 'false')
ORDER BY name, key;

-- ✅ Esperado: Nenhum resultado (query vazia)

-- ====================================================================

-- 5. VERIFICAR PERMISSÕES DUPLICADAS
WITH permission_list AS (
  SELECT 
    name,
    jsonb_object_keys(permissions) as permission_key
  FROM roles
)
SELECT 
  name,
  permission_key,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 1 THEN '❌ DUPLICADO'
    ELSE '✅ OK'
  END as status
FROM permission_list
GROUP BY name, permission_key
HAVING COUNT(*) > 1;

-- ✅ Esperado: Nenhum resultado (sem duplicatas)

-- ====================================================================

-- 6. VERIFICAR CONSISTÊNCIA ENTRE PERFIS

-- Todos os perfis devem ter as mesmas 72 chaves (mas valores diferentes)
WITH role_keys AS (
  SELECT 
    name,
    jsonb_object_keys(permissions) as permission_key
  FROM roles
),
key_counts AS (
  SELECT 
    permission_key,
    COUNT(DISTINCT name) as role_count
  FROM role_keys
  GROUP BY permission_key
)
SELECT 
  permission_key,
  role_count,
  CASE 
    WHEN role_count = (SELECT COUNT(*) FROM roles) THEN '✅ PRESENTE EM TODOS'
    ELSE '❌ FALTANDO EM ' || ((SELECT COUNT(*) FROM roles) - role_count)::text || ' perfis'
  END as status
FROM key_counts
WHERE role_count != (SELECT COUNT(*) FROM roles)
ORDER BY role_count, permission_key;

-- ✅ Esperado: Nenhum resultado (todas as permissões em todos os perfis)

-- ====================================================================

-- 7. VERIFICAR PERMISSÕES CONFLITANTES

-- User NÃO deve ter permissões admin
SELECT 
  name,
  permissions->>'system_users' as can_manage_users,
  permissions->>'system_roles' as can_manage_roles,
  permissions->>'api_access' as has_api_access,
  CASE 
    WHEN name = 'user' AND 
         permissions->>'system_users' = 'false' AND
         permissions->>'system_roles' = 'false' AND
         permissions->>'api_access' = 'false'
    THEN '✅ CORRETO'
    WHEN name = 'user' 
    THEN '❌ USER TEM PERMISSÕES ADMIN'
    ELSE '✅ OK'
  END as validation
FROM roles
WHERE name = 'user';

-- ✅ Esperado: '✅ CORRETO'

-- Developer NÃO deve ter permissões de sistema
SELECT 
  name,
  permissions->>'system_settings' as settings,
  permissions->>'system_users' as users,
  permissions->>'system_roles' as roles,
  permissions->>'api_access' as api,
  CASE 
    WHEN name = 'developer' AND 
         permissions->>'system_settings' = 'false' AND
         permissions->>'system_users' = 'false' AND
         permissions->>'system_roles' = 'false' AND
         permissions->>'api_access' = 'false'
    THEN '✅ CORRETO'
    WHEN name = 'developer' 
    THEN '❌ DEVELOPER TEM PERMISSÕES SISTEMA'
    ELSE '✅ OK'
  END as validation
FROM roles
WHERE name = 'developer';

-- ✅ Esperado: '✅ CORRETO'

-- ====================================================================

-- 8. RESUMO FINAL DE INTEGRIDADE
SELECT 
  '========================================' as linha
UNION ALL
SELECT '     RESUMO DE INTEGRIDADE          '
UNION ALL
SELECT '========================================'
UNION ALL
SELECT 'Perfis válidos: ' || COUNT(*)::text
FROM roles
WHERE jsonb_typeof(permissions) = 'object'
UNION ALL
SELECT 'Integridade referencial: ' || CASE 
  WHEN (SELECT COUNT(*) FROM users u LEFT JOIN roles r ON u.role = r.name WHERE r.name IS NULL AND u.email LIKE 'test_%@test.com') = 0 
  THEN '✅ OK' 
  ELSE '❌ FALHA' 
END
UNION ALL
SELECT 'Valores booleanos: ' || CASE 
  WHEN (SELECT COUNT(*) FROM roles, jsonb_each(permissions) WHERE value::text NOT IN ('true', 'false')) = 0 
  THEN '✅ OK' 
  ELSE '❌ FALHA' 
END
UNION ALL
SELECT 'Permissões consistentes: ' || CASE 
  WHEN (SELECT COUNT(*) FROM (
    SELECT permission_key, COUNT(DISTINCT name) as role_count
    FROM roles, jsonb_object_keys(permissions) as permission_key
    GROUP BY permission_key
    HAVING COUNT(DISTINCT name) != (SELECT COUNT(*) FROM roles)
  ) as inconsistent) = 0 
  THEN '✅ OK' 
  ELSE '❌ FALHA' 
END
UNION ALL
SELECT '========================================';

-- ✅ Esperado:
-- Perfis válidos: 4
-- Integridade referencial: ✅ OK
-- Valores booleanos: ✅ OK
-- Permissões consistentes: ✅ OK

