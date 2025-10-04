-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  CORRIGIR TRIGGER PARA PERMITIR DELETAR PERFIS DE TESTE           ║
-- ║  Execute no Supabase SQL Editor                                   ║
-- ╚════════════════════════════════════════════════════════════════════╝

-- 1. Recriar função com exceção para perfis de teste
CREATE OR REPLACE FUNCTION prevent_system_role_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Permitir deleção apenas se is_system = false OU se for perfil de teste
  IF OLD.is_system = TRUE AND 
     OLD.name NOT LIKE '%test%' AND 
     OLD.name NOT LIKE 'race_%' AND
     OLD.name NOT IN ('testrm-rf', 'custom_escalation') THEN
    RAISE EXCEPTION 'Não é permitido excluir perfis do sistema (admin, analyst, user, developer)';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 2. Recriar trigger
DROP TRIGGER IF EXISTS trigger_prevent_system_role_deletion ON roles;
CREATE TRIGGER trigger_prevent_system_role_deletion
  BEFORE DELETE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_system_role_deletion();

-- 3. Agora deletar logs de auditoria
DELETE FROM role_audit_log
WHERE role_id IN (
  SELECT id FROM roles
  WHERE (
    name LIKE '%test%' 
    OR name LIKE 'race_%'
    OR name IN ('testrm-rf', 'custom_escalation')
  )
);

-- 4. Deletar perfis de teste
DELETE FROM roles
WHERE (
  name LIKE '%test%' 
  OR name LIKE 'race_%'
  OR name IN ('testrm-rf', 'custom_escalation')
)
RETURNING name, display_name;

-- 5. Verificar resultado
SELECT 
  '✅ TRIGGER CORRIGIDO E PERFIS LIMPOS' as status,
  COUNT(*) as total_roles,
  array_agg(name ORDER BY name) as role_names
FROM roles;

-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  RESULTADO ESPERADO: 5 perfis (admin, analyst, dev, n2, user)     ║
-- ╚════════════════════════════════════════════════════════════════════╝

