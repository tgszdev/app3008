-- Criar tabela para armazenar permissões de categorias por perfil
CREATE TABLE IF NOT EXISTS kb_role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role VARCHAR(50) UNIQUE NOT NULL,
  allowed_categories UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Desabilitar RLS para simplificar
ALTER TABLE kb_role_permissions DISABLE ROW LEVEL SECURITY;

-- Inserir permissões padrão (todas as categorias para todos os perfis)
INSERT INTO kb_role_permissions (role, allowed_categories) VALUES
  ('admin', '{}'),
  ('analyst', '{}'),
  ('user', '{}')
ON CONFLICT (role) DO NOTHING;

-- Comentário: Por padrão, array vazio significa que todas as categorias são permitidas
-- Se quiser restringir, adicione os IDs das categorias permitidas no array