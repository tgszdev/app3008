-- Criar tabela roles se não existir
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice para busca rápida por nome
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para todos os usuários autenticados
CREATE POLICY "Roles podem ser lidas por usuários autenticados" ON public.roles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir insert/update/delete apenas para admins
CREATE POLICY "Apenas admins podem modificar roles" ON public.roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Inserir roles padrão do sistema (se não existirem)
INSERT INTO public.roles (name, display_name, description, permissions, is_system)
VALUES 
  (
    'admin',
    'Administrador',
    'Acesso total ao sistema',
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
      "kb_delete": true,
      "kb_manage_categories": true,
      "timesheets_view_own": true,
      "timesheets_view_all": true,
      "timesheets_create": true,
      "timesheets_edit_own": true,
      "timesheets_edit_all": true,
      "timesheets_approve": true,
      "timesheets_analytics": true,
      "system_settings": true,
      "system_users": true,
      "system_roles": true,
      "system_backup": true,
      "system_logs": true
    }'::jsonb,
    true
  ),
  (
    'analyst',
    'Analista',
    'Pode gerenciar tickets e criar conteúdo',
    '{
      "tickets_view": true,
      "tickets_create": true,
      "tickets_edit_own": true,
      "tickets_edit_all": true,
      "tickets_delete": false,
      "tickets_assign": true,
      "tickets_close": true,
      "kb_view": true,
      "kb_create": true,
      "kb_edit": true,
      "kb_delete": false,
      "kb_manage_categories": false,
      "timesheets_view_own": true,
      "timesheets_view_all": true,
      "timesheets_create": true,
      "timesheets_edit_own": true,
      "timesheets_edit_all": false,
      "timesheets_approve": true,
      "timesheets_analytics": false,
      "system_settings": false,
      "system_users": false,
      "system_roles": false,
      "system_backup": false,
      "system_logs": false
    }'::jsonb,
    true
  ),
  (
    'user',
    'Usuário',
    'Pode criar tickets e visualizar conteúdo',
    '{
      "tickets_view": true,
      "tickets_create": true,
      "tickets_edit_own": true,
      "tickets_edit_all": false,
      "tickets_delete": false,
      "tickets_assign": false,
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
    true
  )
ON CONFLICT (name) DO NOTHING;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();