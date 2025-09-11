-- ========================================
-- CORRIGIR POLÍTICAS DA TABELA ROLES
-- ========================================

-- 1. Primeiro, remover políticas problemáticas existentes
DROP POLICY IF EXISTS "Roles podem ser lidas por usuários autenticados" ON public.roles;
DROP POLICY IF EXISTS "Apenas admins podem modificar roles" ON public.roles;

-- 2. Desabilitar RLS temporariamente para garantir acesso
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;

-- 3. Criar a role N1 se não existir
INSERT INTO public.roles (name, display_name, description, permissions, is_system)
VALUES (
  'n1',
  'Suporte N1',
  'Suporte de primeiro nível',
  '{
    "tickets_view": true,
    "tickets_create": true,
    "tickets_edit_own": true,
    "tickets_edit_all": false,
    "tickets_delete": true,
    "tickets_assign": true,
    "tickets_close": false,
    "kb_view": true,
    "kb_create": false,
    "kb_edit": false,
    "kb_delete": false,
    "kb_manage_categories": false,
    "timesheets_view_own": true,
    "timesheets_view_all": false,
    "timesheets_create": true,
    "timesheets_edit_own": true,
    "timesheets_edit_all": false,
    "timesheets_approve": false,
    "timesheets_analytics": false,
    "system_settings": false,
    "system_users": false,
    "system_roles": false,
    "system_backup": false,
    "system_logs": false
  }'::jsonb,
  false
) ON CONFLICT (name) DO UPDATE SET
  permissions = EXCLUDED.permissions,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- 4. Re-habilitar RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 5. Criar política mais permissiva para SELECT (leitura)
-- TODOS os usuários autenticados podem LER roles
CREATE POLICY "Anyone can read roles" ON public.roles
  FOR SELECT 
  USING (true);  -- Permite leitura para todos

-- 6. Criar política para INSERT/UPDATE/DELETE
-- Apenas admins podem modificar
CREATE POLICY "Only admins can modify roles" ON public.roles
  FOR ALL 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE role = 'admin'
    )
  );

-- 7. Garantir permissões corretas para o role 'anon' (usuário anônimo do Supabase)
GRANT SELECT ON public.roles TO anon;
GRANT SELECT ON public.roles TO authenticated;

-- 8. Garantir que service_role tem acesso total (usado pelo backend)
GRANT ALL ON public.roles TO service_role;

-- 9. Verificar se a role N1 foi criada
SELECT 
  name,
  display_name,
  permissions->>'tickets_delete' as pode_excluir,
  permissions->>'tickets_assign' as pode_atribuir
FROM public.roles 
WHERE name = 'n1';

-- 10. Verificar todas as roles
SELECT name, display_name, is_system FROM public.roles ORDER BY name;