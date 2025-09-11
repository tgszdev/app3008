-- =====================================================
-- CORREÇÃO DE POLICIES PARA TABELA ROLES
-- =====================================================

-- 1. Verificar se RLS está habilitado
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'roles';

-- 2. Desabilitar RLS temporariamente para debug
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se a role n1 existe
SELECT 
  name, 
  display_name,
  is_system,
  permissions->>'tickets_delete' as pode_excluir
FROM public.roles 
WHERE name = 'n1';

-- 4. Se preferir manter RLS, criar policies corretas
-- Primeiro, remover policies antigas
DROP POLICY IF EXISTS "Roles podem ser lidas por usuários autenticados" ON public.roles;
DROP POLICY IF EXISTS "Apenas admins podem modificar roles" ON public.roles;
DROP POLICY IF EXISTS "roles_select_policy" ON public.roles;
DROP POLICY IF EXISTS "roles_insert_policy" ON public.roles;
DROP POLICY IF EXISTS "roles_update_policy" ON public.roles;
DROP POLICY IF EXISTS "roles_delete_policy" ON public.roles;

-- 5. Criar nova policy que permite QUALQUER usuário autenticado ler roles
-- Isso é necessário para o sistema de permissões funcionar
CREATE POLICY "permitir_leitura_roles" 
ON public.roles 
FOR SELECT 
USING (true);  -- Permite TODOS lerem (necessário para verificar permissões)

-- 6. Criar policy para modificação (apenas admins)
CREATE POLICY "permitir_modificacao_roles_admin" 
ON public.roles 
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

-- 7. Re-habilitar RLS com as novas policies
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 8. Testar se está funcionando
SELECT 
  'Teste de acesso à tabela roles' as teste,
  COUNT(*) as total_roles,
  COUNT(CASE WHEN name = 'n1' THEN 1 END) as tem_n1
FROM public.roles;

-- 9. Verificar policies ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'roles';

-- 10. SOLUÇÃO ALTERNATIVA: Se ainda não funcionar, deixar RLS desabilitado
-- COMENTAR/DESCOMENTAR conforme necessário:
-- ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;