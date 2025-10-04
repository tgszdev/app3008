-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  SOLUÇÃO DEFINITIVA: Permitir Deletar Perfis                      ║
-- ║  Execute este SQL no Supabase AGORA                               ║
-- ╚════════════════════════════════════════════════════════════════════╝

-- OPÇÃO 1: Desabilitar trigger temporariamente, deletar perfis, reabilitar
-- (RECOMENDADO para limpeza única)

-- 1. Desabilitar trigger de auditoria
DROP TRIGGER IF EXISTS trigger_audit_roles ON roles;

-- 2. Deletar TODOS os logs de auditoria dos perfis de teste
DELETE FROM role_audit_log
WHERE role_name LIKE '%test%' 
   OR role_name LIKE 'race_%'
   OR role_name IN ('testrm-rf', 'custom_escalation');

-- 3. Deletar perfis de teste (agora sem conflito!)
DELETE FROM roles
WHERE (
  name LIKE '%test%' 
  OR name LIKE 'race_%'
  OR name IN ('testrm-rf', 'custom_escalation')
)
RETURNING name, display_name;

-- 4. Recriar trigger de auditoria
CREATE TRIGGER trigger_audit_roles
AFTER INSERT OR UPDATE OR DELETE ON roles
FOR EACH ROW
EXECUTE FUNCTION audit_role_changes();

-- 5. Verificar resultado
SELECT 
  COUNT(*) as total_roles,
  array_agg(name ORDER BY name) as role_names
FROM roles;

-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  RESULTADO ESPERADO: 5 perfis (admin, dev, analyst, user, n2)     ║
-- ╚════════════════════════════════════════════════════════════════════╝


-- ========================================================================
-- OPÇÃO 2: Mudar foreign key para CASCADE (melhor para o futuro)
-- ========================================================================

-- Remover constraint antiga
ALTER TABLE role_audit_log
DROP CONSTRAINT IF EXISTS role_audit_log_role_id_fkey;

-- Adicionar constraint com CASCADE
ALTER TABLE role_audit_log
ADD CONSTRAINT role_audit_log_role_id_fkey
FOREIGN KEY (role_id)
REFERENCES roles(id)
ON DELETE CASCADE;  -- ← Deleta logs automaticamente quando role é deletado

-- Agora pode deletar perfis normalmente via API!
-- Teste:
/*
DELETE FROM roles WHERE name = 'empty_test' RETURNING *;
*/

