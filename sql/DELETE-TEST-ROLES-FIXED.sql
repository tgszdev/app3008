-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  DELETAR PERFIS DE TESTE - VERSÃO CORRIGIDA                       ║
-- ║  Correção: Cast para lidar com tipo ENUM user_role                ║
-- ╚════════════════════════════════════════════════════════════════════╝

-- PASSO 1: Deletar logs de auditoria (JÁ EXECUTADO ✅)

-- PASSO 2: Deletar perfis de teste (CORRIGIDO)
DELETE FROM roles
WHERE (
  name LIKE '%test%' 
  OR name LIKE 'race_%'
  OR name IN ('testrm-rf', 'custom_escalation')
)
AND NOT EXISTS (
  -- Cast do ENUM para TEXT para comparação
  SELECT 1 FROM users WHERE users.role::text = roles.name
)
RETURNING name, display_name;

-- PASSO 3: Verificar resultado
SELECT 
  COUNT(*) as total_roles_remaining,
  COUNT(*) FILTER (WHERE is_system = true) as system_roles,
  COUNT(*) FILTER (WHERE is_system = false) as custom_roles
FROM roles;

-- PASSO 4: Listar perfis restantes
SELECT 
  name,
  display_name,
  is_system,
  (SELECT COUNT(*) FROM users WHERE users.role::text = roles.name) as users_count,
  created_at
FROM roles
ORDER BY is_system DESC, name;

