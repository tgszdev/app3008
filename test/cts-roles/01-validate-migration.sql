-- ====================================================================
-- CTS ROLES - FASE 1: Validação de Migration
-- ====================================================================
-- Executar no Supabase SQL Editor APÓS aplicar migration via UI
-- Duração: ~1 minuto
-- ====================================================================

-- 1. CRIAR BACKUP
CREATE TABLE IF NOT EXISTS roles_backup_pre_v2 AS
SELECT * FROM roles;

SELECT 'Backup criado com ' || COUNT(*) || ' perfis' as resultado
FROM roles_backup_pre_v2;

-- ====================================================================

-- 2. VERIFICAR SE NOVAS PERMISSÕES EXISTEM
SELECT 
  name,
  display_name,
  permissions->>'tickets_create_internal' as tickets_internal,
  permissions->>'tickets_change_status' as tickets_status,
  permissions->>'tickets_view_internal' as tickets_view_internal,
  permissions->>'tickets_export' as tickets_export,
  permissions->>'tickets_bulk_actions' as tickets_bulk,
  permissions->>'organizations_view' as org_view,
  permissions->>'sla_view' as sla_view,
  permissions->>'satisfaction_view_results' as satisfaction,
  permissions->>'comments_moderate' as comments,
  permissions->>'reports_export' as reports,
  permissions->>'api_access' as api,
  permissions->>'notifications_send_broadcast' as notifications
FROM roles
ORDER BY name;

-- ✅ Esperado: Todas as colunas com 'true' ou 'false' (não null)

-- ====================================================================

-- 3. CONTAR TOTAL DE PERMISSÕES POR PERFIL
WITH permission_counts AS (
  SELECT 
    name,
    display_name,
    jsonb_object_keys(permissions) as permission_key
  FROM roles
)
SELECT 
  name,
  display_name,
  COUNT(*) as total_permissions,
  CASE 
    WHEN COUNT(*) = 72 THEN '✅ CORRETO'
    WHEN COUNT(*) = 24 THEN '⚠️ NÃO MIGRADO'
    ELSE '❌ ERRO: ' || COUNT(*)::text || ' permissões'
  END as status
FROM permission_counts
GROUP BY name, display_name
ORDER BY name;

-- ✅ Esperado: Todos com 72 permissões e status '✅ CORRETO'

-- ====================================================================

-- 4. VERIFICAR VALORES POR TIPO DE PERFIL

-- 4.1 ADMIN (deve ter TODAS = true)
SELECT 
  name,
  COUNT(*) as total_permissions,
  COUNT(*) FILTER (WHERE value::text = 'true') as true_count,
  COUNT(*) FILTER (WHERE value::text = 'false') as false_count,
  CASE 
    WHEN COUNT(*) FILTER (WHERE value::text = 'true') = 72 THEN '✅ ADMIN CORRETO'
    ELSE '❌ ERRO: ' || COUNT(*) FILTER (WHERE value::text = 'true')::text || ' true de 72'
  END as status
FROM roles, jsonb_each(permissions)
WHERE name = 'admin'
GROUP BY name;

-- ✅ Esperado: 72 true, 0 false, status '✅ ADMIN CORRETO'

-- 4.2 DEVELOPER (deve ter ~35 true)
SELECT 
  name,
  COUNT(*) as total_permissions,
  COUNT(*) FILTER (WHERE value::text = 'true') as true_count,
  COUNT(*) FILTER (WHERE value::text = 'false') as false_count,
  CASE 
    WHEN COUNT(*) FILTER (WHERE value::text = 'true') BETWEEN 33 AND 37 THEN '✅ DEVELOPER CORRETO'
    ELSE '⚠️ VERIFICAR: ' || COUNT(*) FILTER (WHERE value::text = 'true')::text || ' true'
  END as status
FROM roles, jsonb_each(permissions)
WHERE name = 'developer'
GROUP BY name;

-- ✅ Esperado: ~35 true, ~37 false, status '✅ DEVELOPER CORRETO'

-- 4.3 ANALYST (deve ter ~43 true)
SELECT 
  name,
  COUNT(*) as total_permissions,
  COUNT(*) FILTER (WHERE value::text = 'true') as true_count,
  COUNT(*) FILTER (WHERE value::text = 'false') as false_count,
  CASE 
    WHEN COUNT(*) FILTER (WHERE value::text = 'true') BETWEEN 41 AND 45 THEN '✅ ANALYST CORRETO'
    ELSE '⚠️ VERIFICAR: ' || COUNT(*) FILTER (WHERE value::text = 'true')::text || ' true'
  END as status
FROM roles, jsonb_each(permissions)
WHERE name = 'analyst'
GROUP BY name;

-- ✅ Esperado: ~43 true, ~29 false, status '✅ ANALYST CORRETO'

-- 4.4 USER (deve ter ~13 true)
SELECT 
  name,
  COUNT(*) as total_permissions,
  COUNT(*) FILTER (WHERE value::text = 'true') as true_count,
  COUNT(*) FILTER (WHERE value::text = 'false') as false_count,
  CASE 
    WHEN COUNT(*) FILTER (WHERE value::text = 'true') BETWEEN 11 AND 15 THEN '✅ USER CORRETO'
    ELSE '⚠️ VERIFICAR: ' || COUNT(*) FILTER (WHERE value::text = 'true')::text || ' true'
  END as status
FROM roles, jsonb_each(permissions)
WHERE name = 'user'
GROUP BY name;

-- ✅ Esperado: ~13 true, ~59 false, status '✅ USER CORRETO'

-- ====================================================================

-- 5. VERIFICAR PERMISSÕES ESPECÍFICAS POR CATEGORIA

-- Tickets
SELECT 
  name,
  permissions->>'tickets_view' as view,
  permissions->>'tickets_create_internal' as create_internal,
  permissions->>'tickets_export' as export,
  permissions->>'tickets_bulk_actions' as bulk,
  CASE 
    WHEN name = 'admin' AND 
         permissions->>'tickets_create_internal' = 'true' AND
         permissions->>'tickets_export' = 'true' AND
         permissions->>'tickets_bulk_actions' = 'true' THEN '✅'
    WHEN name = 'developer' AND 
         permissions->>'tickets_create_internal' = 'true' AND
         permissions->>'tickets_export' = 'true' AND
         permissions->>'tickets_bulk_actions' = 'false' THEN '✅'
    WHEN name = 'analyst' AND 
         permissions->>'tickets_create_internal' = 'true' AND
         permissions->>'tickets_export' = 'true' AND
         permissions->>'tickets_bulk_actions' = 'true' THEN '✅'
    WHEN name = 'user' AND 
         permissions->>'tickets_create_internal' = 'false' AND
         permissions->>'tickets_export' = 'false' AND
         permissions->>'tickets_bulk_actions' = 'false' THEN '✅'
    ELSE '❌'
  END as tickets_status
FROM roles
ORDER BY name;

-- Organizações
SELECT 
  name,
  permissions->>'organizations_view' as view,
  permissions->>'organizations_create' as create,
  permissions->>'organizations_edit' as edit,
  permissions->>'organizations_delete' as delete,
  CASE 
    WHEN name = 'admin' AND permissions->>'organizations_create' = 'true' THEN '✅'
    WHEN name IN ('developer', 'analyst') AND 
         permissions->>'organizations_view' = 'true' AND
         permissions->>'organizations_create' = 'false' THEN '✅'
    WHEN name = 'user' AND permissions->>'organizations_view' = 'false' THEN '✅'
    ELSE '❌'
  END as org_status
FROM roles
ORDER BY name;

-- API/Integrações (APENAS ADMIN)
SELECT 
  name,
  permissions->>'api_access' as api,
  permissions->>'api_create_token' as create_token,
  permissions->>'integrations_manage' as integrations,
  CASE 
    WHEN name = 'admin' AND permissions->>'api_access' = 'true' THEN '✅'
    WHEN name != 'admin' AND permissions->>'api_access' = 'false' THEN '✅'
    ELSE '❌'
  END as api_status
FROM roles
ORDER BY name;

-- ====================================================================

-- 6. RESUMO FINAL
SELECT 
  '========================================' as linha
UNION ALL
SELECT '        RESUMO DA MIGRATION         '
UNION ALL
SELECT '========================================'
UNION ALL
SELECT 'Total de Perfis: ' || COUNT(*)::text
FROM roles
UNION ALL
SELECT 'Perfis com 72 permissões: ' || COUNT(*)::text
FROM (
  SELECT name, COUNT(*) as perm_count
  FROM roles, jsonb_object_keys(permissions)
  GROUP BY name
  HAVING COUNT(*) = 72
) as correct_roles
UNION ALL
SELECT 'Admin com todas true: ' || CASE 
  WHEN (SELECT COUNT(*) FILTER (WHERE value::text = 'true') FROM roles, jsonb_each(permissions) WHERE name = 'admin') = 72 
  THEN '✅ SIM' 
  ELSE '❌ NÃO' 
END
UNION ALL
SELECT '========================================';

-- ✅ Esperado:
-- Total de Perfis: 4
-- Perfis com 72 permissões: 4
-- Admin com todas true: ✅ SIM

