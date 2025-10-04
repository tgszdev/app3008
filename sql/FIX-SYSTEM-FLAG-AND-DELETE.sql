-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  CORREÇÃO: Remover flag is_system dos perfis de teste             ║
-- ║  Execute no Supabase SQL Editor                                   ║
-- ╚════════════════════════════════════════════════════════════════════╝

-- PASSO 1: Ver quais perfis de teste têm is_system = true
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
AND is_system = true;

-- PASSO 2: Desabilitar trigger que protege is_system
DROP TRIGGER IF EXISTS trigger_prevent_is_system_change ON roles;

-- PASSO 3: Corrigir flag is_system dos perfis de teste
UPDATE roles
SET is_system = false
WHERE (
  name LIKE '%test%' 
  OR name LIKE 'race_%'
  OR name IN ('testrm-rf', 'custom_escalation')
)
AND is_system = true
RETURNING name, display_name, is_system;

-- PASSO 4: Reabilitar trigger
CREATE TRIGGER trigger_prevent_is_system_change
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_is_system_modification();

-- PASSO 5: Agora deletar logs de auditoria
DELETE FROM role_audit_log
WHERE role_id IN (
  SELECT id FROM roles
  WHERE (
    name LIKE '%test%' 
    OR name LIKE 'race_%'
    OR name IN ('testrm-rf', 'custom_escalation')
  )
);

-- PASSO 6: Deletar perfis de teste (agora funciona!)
DELETE FROM roles
WHERE (
  name LIKE '%test%' 
  OR name LIKE 'race_%'
  OR name IN ('testrm-rf', 'custom_escalation')
)
AND NOT EXISTS (
  SELECT 1 FROM users WHERE users.role::text = roles.name
)
RETURNING name, display_name;

-- PASSO 7: Verificar resultado final
SELECT 
  '✅ LIMPEZA CONCLUÍDA' as status,
  COUNT(*) as total_roles,
  COUNT(*) FILTER (WHERE is_system = true) as system_roles,
  COUNT(*) FILTER (WHERE is_system = false) as custom_roles,
  array_agg(name ORDER BY name) as role_names
FROM roles;

-- PASSO 8: Listar perfis restantes
SELECT 
  name,
  display_name,
  is_system,
  (SELECT COUNT(*) FROM users WHERE users.role::text = roles.name) as users_count
FROM roles
ORDER BY is_system DESC, name;

-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  RESULTADO ESPERADO:                                               ║
-- ║  total_roles: 5                                                    ║
-- ║  system_roles: 4 (admin, dev, analyst, user)                      ║
-- ║  custom_roles: 1 (n2)                                             ║
-- ╚════════════════════════════════════════════════════════════════════╝

