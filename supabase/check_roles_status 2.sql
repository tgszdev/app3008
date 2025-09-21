-- ========================================
-- SCRIPT DE VERIFICAÇÃO DO SISTEMA DE ROLES
-- ========================================

-- 1. Verificar se a tabela roles existe e sua estrutura
SELECT 
  'Tabela roles existe' as status,
  COUNT(*) as total_roles
FROM public.roles;

-- 2. Listar todas as roles cadastradas
SELECT 
  name,
  display_name,
  description,
  is_system,
  created_at
FROM public.roles
ORDER BY is_system DESC, name;

-- 3. Verificar permissões de cada role (exemplo: tickets_delete)
SELECT 
  name,
  display_name,
  permissions->>'tickets_delete' as pode_excluir_tickets,
  permissions->>'tickets_assign' as pode_atribuir_tickets,
  permissions->>'tickets_edit_all' as pode_editar_todos_tickets
FROM public.roles
ORDER BY name;

-- 4. Verificar usuários e suas roles
SELECT 
  u.email,
  u.role as role_padrao,
  u.role_name as role_customizada,
  COALESCE(u.role_name, u.role) as role_efetiva,
  r.display_name as nome_role
FROM public.users u
LEFT JOIN public.roles r ON r.name = COALESCE(u.role_name, u.role)
WHERE u.role != 'user' OR u.role_name IS NOT NULL
ORDER BY u.email;

-- 5. Contar usuários por role
SELECT 
  COALESCE(u.role_name, u.role) as role,
  r.display_name,
  COUNT(*) as total_usuarios
FROM public.users u
LEFT JOIN public.roles r ON r.name = COALESCE(u.role_name, u.role)
GROUP BY COALESCE(u.role_name, u.role), r.display_name
ORDER BY total_usuarios DESC;

-- 6. Verificar se existe a role "desenvolvedor"
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.roles WHERE name = 'desenvolvedor') 
    THEN '✅ Role desenvolvedor EXISTE no banco'
    ELSE '❌ Role desenvolvedor NÃO existe no banco'
  END as status_desenvolvedor;

-- 7. Se a role desenvolvedor existir, mostrar suas permissões
SELECT 
  name,
  display_name,
  permissions
FROM public.roles
WHERE name = 'desenvolvedor';