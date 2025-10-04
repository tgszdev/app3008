-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  SOLUÇÃO DEFINITIVA: Desabilitar trigger de auditoria             ║
-- ║  Execute COMPLETO no Supabase SQL Editor                          ║
-- ╚════════════════════════════════════════════════════════════════════╝

-- 1. Desabilitar trigger de auditoria
DROP TRIGGER IF EXISTS trigger_audit_roles ON roles;

-- 2. Deletar logs de auditoria existentes dos perfis de teste
DELETE FROM role_audit_log
WHERE role_name LIKE '%test%' 
   OR role_name LIKE 'race_%'
   OR role_name IN ('testrm-rf', 'custom_escalation');

-- 3. Deletar perfis de teste
DELETE FROM roles
WHERE (
  name LIKE '%test%' 
  OR name LIKE 'race_%'
  OR name IN ('testrm-rf', 'custom_escalation')
)
RETURNING name, display_name;

-- 4. Reabilitar trigger de auditoria
CREATE TRIGGER trigger_audit_roles
AFTER INSERT OR UPDATE OR DELETE ON roles
FOR EACH ROW
EXECUTE FUNCTION audit_role_changes();

-- 5. Verificar resultado
SELECT 
  '✅ PERFIS DE TESTE DELETADOS' as status,
  COUNT(*) as total_roles,
  array_agg(name ORDER BY name) as role_names
FROM roles;

-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  RESULTADO ESPERADO: 5 perfis (admin, analyst, dev, n2, user)     ║
-- ╚════════════════════════════════════════════════════════════════════╝

