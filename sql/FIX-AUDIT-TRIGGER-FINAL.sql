-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  SOLUÇÃO FINAL: Corrigir Foreign Key para CASCADE                 ║
-- ║  Execute no Supabase SQL Editor                                   ║
-- ╚════════════════════════════════════════════════════════════════════╝

-- PASSO 1: Remover constraint antiga
ALTER TABLE role_audit_log
DROP CONSTRAINT IF EXISTS role_audit_log_role_id_fkey;

-- PASSO 2: Adicionar constraint com CASCADE
ALTER TABLE role_audit_log
ADD CONSTRAINT role_audit_log_role_id_fkey
FOREIGN KEY (role_id)
REFERENCES roles(id)
ON DELETE CASCADE;  -- ← Deleta logs automaticamente quando role é deletado

-- PASSO 3: Agora pode deletar perfis normalmente!
DELETE FROM roles
WHERE (
  name LIKE '%test%' 
  OR name LIKE 'race_%'
  OR name IN ('testrm-rf', 'custom_escalation')
)
RETURNING name, display_name;

-- PASSO 4: Verificar resultado
SELECT 
  '✅ FOREIGN KEY CORRIGIDA - PERFIS DELETADOS' as status,
  COUNT(*) as total_roles,
  array_agg(name ORDER BY name) as role_names
FROM roles;

-- PASSO 5: Testar a constraint
SELECT 
  constraint_name,
  table_name,
  delete_rule
FROM information_schema.referential_constraints
WHERE constraint_name = 'role_audit_log_role_id_fkey';

-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  AGORA deletar perfis via TELA também funcionará!                 ║
-- ╚════════════════════════════════════════════════════════════════════╝

