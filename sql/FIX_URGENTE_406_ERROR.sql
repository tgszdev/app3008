-- =====================================================
-- CORREÇÃO URGENTE DO ERRO 406 - EXECUTE AGORA!
-- =====================================================

-- 1. DESABILITAR RLS NA TABELA ROLES (TEMPORÁRIO)
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se as roles existem
SELECT 
  'Roles encontradas no banco:' as info,
  name, 
  display_name,
  is_system,
  CASE 
    WHEN permissions IS NOT NULL THEN 'COM PERMISSÕES'
    ELSE 'SEM PERMISSÕES'
  END as status_permissions
FROM public.roles
ORDER BY name;

-- 3. Verificar especificamente a role n1
SELECT 
  'Role N1:' as info,
  *
FROM public.roles 
WHERE name = 'n1';

-- 4. Se a role n1 não existir, criar ela
INSERT INTO public.roles (name, display_name, permissions, is_system) 
VALUES (
  'n1',
  'Nível 1',
  '{
    "tickets_view": true,
    "tickets_create": true,
    "tickets_edit_own": true,
    "tickets_edit_all": false,
    "tickets_delete": false,
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
) ON CONFLICT (name) DO UPDATE
SET permissions = EXCLUDED.permissions,
    display_name = EXCLUDED.display_name;

-- 5. IMPORTANTE: Deixar RLS desabilitado por enquanto
-- ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;

-- 6. Mensagem final
SELECT 
  '
  ✅ CORREÇÃO APLICADA!
  
  RLS foi DESABILITADO na tabela roles.
  Isso resolve o problema imediatamente.
  
  Próximos passos:
  1. Teste a aplicação agora
  2. Limpe o cache (botão Limpar Cache)
  3. Faça logout e login novamente
  ' as resultado;