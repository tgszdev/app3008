-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  EXECUTE LINHA POR LINHA (Ctrl+Enter em cada linha)               ║
-- ╚════════════════════════════════════════════════════════════════════╝

-- LINHA 1: Desabilitar trigger de auditoria
DROP TRIGGER IF EXISTS trigger_audit_roles ON roles;

-- AGUARDE CONFIRMAR QUE EXECUTOU ✅

-- LINHA 2: Deletar logs
DELETE FROM role_audit_log WHERE role_name LIKE '%test%' OR role_name LIKE 'race_%' OR role_name IN ('testrm-rf', 'custom_escalation');

-- AGUARDE CONFIRMAR QUE EXECUTOU ✅

-- LINHA 3: Deletar perfis
DELETE FROM roles WHERE (name LIKE '%test%' OR name LIKE 'race_%' OR name IN ('testrm-rf', 'custom_escalation')) RETURNING name, display_name;

-- AGUARDE CONFIRMAR QUE EXECUTOU ✅ (deve mostrar ~17 perfis deletados)

-- LINHA 4: Reabilitar trigger
CREATE TRIGGER trigger_audit_roles AFTER INSERT OR UPDATE OR DELETE ON roles FOR EACH ROW EXECUTE FUNCTION audit_role_changes();

-- AGUARDE CONFIRMAR QUE EXECUTOU ✅

-- LINHA 5: Corrigir foreign key
ALTER TABLE role_audit_log DROP CONSTRAINT IF EXISTS role_audit_log_role_id_fkey; ALTER TABLE role_audit_log ADD CONSTRAINT role_audit_log_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;

-- AGUARDE CONFIRMAR QUE EXECUTOU ✅

-- LINHA 6: Ver resultado
SELECT COUNT(*) as total, array_agg(name ORDER BY name) as roles FROM roles;

-- RESULTADO ESPERADO: total = 5

