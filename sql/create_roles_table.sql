-- Criar tabela de roles (perfis de usuário)
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, -- Nome interno (admin, analyst, user, etc)
    display_name VARCHAR(100) NOT NULL, -- Nome de exibição (Administrador, Analista, etc)
    description TEXT,
    permissions JSONB DEFAULT '{}', -- Permissões em formato JSON
    is_system BOOLEAN DEFAULT false, -- Se é um role do sistema (não pode ser deletado)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir roles padrão do sistema
INSERT INTO public.roles (name, display_name, description, permissions, is_system) VALUES 
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
    }',
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
    }',
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
    }',
    true
)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    updated_at = CURRENT_TIMESTAMP;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_system ON public.roles(is_system);

-- Adicionar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Conceder permissões
GRANT ALL ON public.roles TO authenticated;
GRANT ALL ON public.roles TO service_role;

-- RLS (Row Level Security)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Política para leitura (todos os usuários autenticados podem ver roles)
CREATE POLICY "Roles são visíveis para todos os usuários autenticados" ON public.roles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para inserção, atualização e deleção (apenas admins)
CREATE POLICY "Apenas admins podem gerenciar roles" ON public.roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Comentários
COMMENT ON TABLE public.roles IS 'Tabela de perfis/roles de usuário com suas permissões';
COMMENT ON COLUMN public.roles.name IS 'Nome interno do perfil (usado no código)';
COMMENT ON COLUMN public.roles.display_name IS 'Nome de exibição do perfil';
COMMENT ON COLUMN public.roles.permissions IS 'Objeto JSON com todas as permissões do perfil';
COMMENT ON COLUMN public.roles.is_system IS 'Se é um perfil do sistema que não pode ser deletado';