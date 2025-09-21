-- ========================================
-- CRIAR ROLE DESENVOLVEDOR SE NÃO EXISTIR
-- ========================================

-- Criar a role desenvolvedor com permissão de excluir tickets
INSERT INTO public.roles (name, display_name, description, permissions, is_system)
VALUES (
  'desenvolvedor',
  'Desenvolvedor',
  'Desenvolvedor com permissões avançadas incluindo exclusão de tickets',
  '{
    "tickets_view": true,
    "tickets_create": true,
    "tickets_edit_own": true,
    "tickets_edit_all": true,
    "tickets_delete": true,
    "tickets_assign": true,
    "tickets_close": true,
    "kb_view": true,
    "kb_create": true,
    "kb_edit": true,
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
)
ON CONFLICT (name) DO UPDATE SET
  permissions = EXCLUDED.permissions,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- Verificar se foi criada/atualizada
SELECT 
  '✅ Role desenvolvedor configurada com sucesso!' as status,
  name,
  display_name,
  permissions->>'tickets_delete' as pode_excluir_tickets
FROM public.roles
WHERE name = 'desenvolvedor';