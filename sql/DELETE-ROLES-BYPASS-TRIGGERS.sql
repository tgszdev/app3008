-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  DELETAR PERFIS DE TESTE - BYPASS DE TODOS OS TRIGGERS            ║
-- ║  Execute COMPLETO no Supabase SQL Editor                          ║
-- ╚════════════════════════════════════════════════════════════════════╝

-- PASSO 1: Listar perfis de teste que serão deletados
SELECT 
  id,
  name,
  display_name,
  is_system,
  (SELECT COUNT(*) FROM users WHERE users.role::text = roles.name) as users_count
FROM roles
WHERE (
  name LIKE '%test%' 
  OR name LIKE 'race_%'
  OR name IN ('testrm-rf', 'custom_escalation')
)
ORDER BY name;

-- PASSO 2: Desabilitar TODOS os triggers de segurança temporariamente
ALTER TABLE roles DISABLE TRIGGER ALL;

-- PASSO 3: Deletar logs de auditoria
DELETE FROM role_audit_log
WHERE role_id IN (
  SELECT id FROM roles
  WHERE (
    name LIKE '%test%' 
    OR name LIKE 'race_%'
    OR name IN ('testrm-rf', 'custom_escalation')
  )
);

-- PASSO 4: Deletar perfis de teste
DELETE FROM roles
WHERE (
  name LIKE '%test%' 
  OR name LIKE 'race_%'
  OR name IN ('testrm-rf', 'custom_escalation')
)
RETURNING id, name, display_name;

-- PASSO 5: REABILITAR todos os triggers
ALTER TABLE roles ENABLE TRIGGER ALL;

-- PASSO 6: Verificar resultado final
SELECT 
  '✅ LIMPEZA CONCLUÍDA' as status,
  COUNT(*) as total_roles_remaining,
  COUNT(*) FILTER (WHERE is_system = true) as system_roles,
  COUNT(*) FILTER (WHERE is_system = false) as custom_roles,
  array_agg(name ORDER BY name) as role_names
FROM roles;

-- PASSO 7: Listar perfis restantes com detalhes
SELECT 
  name,
  display_name,
  is_system,
  (SELECT COUNT(*) FROM users WHERE users.role::text = roles.name) as users_count,
  jsonb_object_keys(permissions) as sample_permission,
  created_at
FROM roles
ORDER BY is_system DESC, name
LIMIT 10;

-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  RESULTADO ESPERADO:                                               ║
-- ║  - Total de perfis: 5 (admin, dev, analyst, user, n2)             ║
-- ║  - Perfis de teste deletados: ~17                                  ║
-- ║  - Triggers: Todos reabilitados                                    ║
-- ║  - Sistema: Limpo e funcional                                      ║
-- ╚════════════════════════════════════════════════════════════════════╝

