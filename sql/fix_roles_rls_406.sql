-- =====================================================
-- CORREÇÃO DEFINITIVA DO ERRO 406 NA TABELA ROLES
-- =====================================================
-- Erro 406 (Not Acceptable) no Supabase indica problema com RLS
-- Este script corrige as políticas de forma definitiva

-- 1. PRIMEIRO: Verificar o estado atual
SELECT 
  'Estado atual da tabela roles' as info,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'roles';

-- 2. Verificar se a role n1 existe
SELECT 
  'Verificando role n1' as info,
  name, 
  display_name,
  is_system,
  created_at,
  updated_at
FROM public.roles 
WHERE name = 'n1';

-- 3. DESABILITAR RLS TEMPORARIAMENTE (para testar)
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;

-- 4. Testar novamente
SELECT 
  'Teste após desabilitar RLS' as info,
  COUNT(*) as total_roles,
  COUNT(CASE WHEN name = 'n1' THEN 1 END) as tem_n1
FROM public.roles;

-- 5. LIMPAR TODAS AS POLICIES ANTIGAS
DROP POLICY IF EXISTS "Roles podem ser lidas por usuários autenticados" ON public.roles;
DROP POLICY IF EXISTS "Apenas admins podem modificar roles" ON public.roles;
DROP POLICY IF EXISTS "roles_select_policy" ON public.roles;
DROP POLICY IF EXISTS "roles_insert_policy" ON public.roles;
DROP POLICY IF EXISTS "roles_update_policy" ON public.roles;
DROP POLICY IF EXISTS "roles_delete_policy" ON public.roles;
DROP POLICY IF EXISTS "permitir_leitura_roles" ON public.roles;
DROP POLICY IF EXISTS "permitir_modificacao_roles_admin" ON public.roles;
DROP POLICY IF EXISTS "public_read_roles" ON public.roles;
DROP POLICY IF EXISTS "admin_manage_roles" ON public.roles;

-- 6. CRIAR POLICY SIMPLES E PERMISSIVA PARA LEITURA
-- IMPORTANTE: Esta policy permite que QUALQUER PESSOA leia roles
-- Isso é necessário porque o sistema precisa verificar permissões
CREATE POLICY "allow_public_read_roles" 
ON public.roles 
FOR SELECT 
USING (true);  -- Permite leitura pública (sem restrições)

-- 7. CRIAR POLICY PARA ADMIN GERENCIAR ROLES
CREATE POLICY "allow_admin_manage_roles" 
ON public.roles 
FOR ALL 
USING (
  -- Permite se o usuário for admin OU se estiver usando service_role
  auth.role() = 'service_role' OR
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE role = 'admin'
  )
)
WITH CHECK (
  -- Permite se o usuário for admin OU se estiver usando service_role
  auth.role() = 'service_role' OR
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE role = 'admin'
  )
);

-- 8. RE-HABILITAR RLS COM AS NOVAS POLICIES
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 9. VERIFICAR POLICIES CRIADAS
SELECT 
  'Policies ativas na tabela roles' as info,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'roles'
ORDER BY policyname;

-- 10. TESTE FINAL
SELECT 
  'Teste final com RLS habilitado' as info,
  name,
  display_name,
  is_system
FROM public.roles
ORDER BY name;

-- 11. INFORMAÇÕES IMPORTANTES
SELECT 
  '
  IMPORTANTE:
  -----------
  1. Execute este script no Supabase SQL Editor
  2. Se o erro 406 persistir, deixe RLS desabilitado temporariamente:
     ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
  3. Certifique-se de que SUPABASE_SERVICE_ROLE_KEY está configurado no .env.local
  4. O cliente supabaseAdmin deve usar a service_role key, não a anon key
  ' as instrucoes;