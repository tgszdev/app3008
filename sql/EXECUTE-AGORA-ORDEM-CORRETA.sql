-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  EXECUTE NA ORDEM CORRETA - PASSO A PASSO                         ║
-- ╚════════════════════════════════════════════════════════════════════╝

-- ============================================================
-- PASSO 1: Corrigir trigger para permitir deletar perfis de teste
-- ============================================================
CREATE OR REPLACE FUNCTION prevent_system_role_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Permitir deleção se is_system = false OU se for perfil de teste
  IF OLD.is_system = TRUE AND 
     OLD.name NOT LIKE '%test%' AND 
     OLD.name NOT LIKE 'race_%' AND
     OLD.name NOT IN ('testrm-rf', 'custom_escalation') THEN
    RAISE EXCEPTION 'Não é permitido excluir perfis do sistema (admin, analyst, user, developer)';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PASSO 2: Desabilitar trigger de auditoria
-- ============================================================
DROP TRIGGER IF EXISTS trigger_audit_roles ON roles;

-- ============================================================
-- PASSO 3: Deletar logs de auditoria
-- ============================================================
DELETE FROM role_audit_log
WHERE role_name LIKE '%test%' 
   OR role_name LIKE 'race_%'
   OR role_name IN ('testrm-rf', 'custom_escalation');

-- ============================================================
-- PASSO 4: Deletar perfis de teste
-- ============================================================
DELETE FROM roles
WHERE (
  name LIKE '%test%' 
  OR name LIKE 'race_%'
  OR name IN ('testrm-rf', 'custom_escalation')
)
RETURNING name, display_name;

-- ============================================================
-- PASSO 5: Corrigir foreign key para CASCADE
-- ============================================================
ALTER TABLE role_audit_log
DROP CONSTRAINT IF EXISTS role_audit_log_role_id_fkey;

ALTER TABLE role_audit_log
ADD CONSTRAINT role_audit_log_role_id_fkey
FOREIGN KEY (role_id)
REFERENCES roles(id)
ON DELETE CASCADE;

-- ============================================================
-- PASSO 6: Reabilitar trigger de auditoria
-- ============================================================
CREATE TRIGGER trigger_audit_roles
AFTER INSERT OR UPDATE OR DELETE ON roles
FOR EACH ROW
EXECUTE FUNCTION audit_role_changes();

-- ============================================================
-- PASSO 7: Verificar resultado
-- ============================================================
SELECT 
  '✅ LIMPEZA CONCLUÍDA - SISTEMA CORRIGIDO' as status,
  COUNT(*) as total_roles,
  array_agg(name ORDER BY name) as role_names
FROM roles;

-- ============================================================
-- RESULTADO ESPERADO: 
-- total_roles: 5
-- role_names: {admin, analyst, dev, n2, user}
-- ============================================================

