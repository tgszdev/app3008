-- ========================================
-- DEBUG: VERIFICAR ROLE N1 E POLÍTICAS
-- ========================================

-- 1. Verificar se a role N1 existe
SELECT * FROM roles WHERE name = 'n1';

-- 2. Verificar TODAS as roles no banco
SELECT id, name, display_name, is_system, created_at 
FROM roles 
ORDER BY created_at DESC;

-- 3. Verificar se RLS (Row Level Security) está habilitado na tabela roles
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'roles';

-- 4. Listar TODAS as políticas (policies) da tabela roles
SELECT 
    pol.polname as policy_name,
    pol.polcmd as command,
    CASE pol.polcmd 
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END as operation,
    pol.polpermissive as is_permissive,
    pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
    pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression,
    pol.polroles::regrole[] as roles
FROM pg_policy pol
WHERE pol.polrelid = 'public.roles'::regclass;

-- 5. Verificar permissões do usuário anônimo (anon) e autenticado (authenticated)
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
AND table_name = 'roles'
ORDER BY grantee, privilege_type;

-- 6. Verificar se existe alguma função/trigger que possa estar interferindo
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'roles';

-- 7. Testar inserção direta (se você for admin do Supabase)
-- DESCOMENTE e execute se quiser criar a role N1 diretamente
/*
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
) ON CONFLICT (name) DO NOTHING;
*/

-- 8. Verificar se após inserir, a role existe
-- SELECT * FROM roles WHERE name = 'n1';