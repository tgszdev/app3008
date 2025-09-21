-- Script para criar tabela de categorias no Supabase
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50), -- Nome do ícone (ex: 'computer', 'network', 'printer')
  color VARCHAR(7), -- Cor hexadecimal (ex: '#3B82F6')
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE
    ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir categorias padrão
INSERT INTO categories (name, slug, description, icon, color, display_order) VALUES
  ('Geral', 'geral', 'Questões gerais e diversas', 'help-circle', '#6B7280', 1),
  ('Hardware', 'hardware', 'Problemas com equipamentos físicos', 'cpu', '#EF4444', 2),
  ('Software', 'software', 'Problemas com programas e aplicativos', 'code', '#3B82F6', 3),
  ('Rede', 'rede', 'Problemas de conectividade e rede', 'wifi', '#10B981', 4),
  ('Impressora', 'impressora', 'Problemas com impressoras e scanners', 'printer', '#F59E0B', 5),
  ('E-mail', 'email', 'Problemas com e-mail e comunicação', 'mail', '#8B5CF6', 6),
  ('Segurança', 'seguranca', 'Questões de segurança e acesso', 'shield', '#DC2626', 7),
  ('Telefonia', 'telefonia', 'Problemas com telefones e VOIP', 'phone', '#06B6D4', 8),
  ('Sistema', 'sistema', 'Problemas com sistemas operacionais', 'monitor', '#0EA5E9', 9),
  ('Backup', 'backup', 'Questões sobre backup e recuperação', 'database', '#059669', 10)
ON CONFLICT (slug) DO NOTHING;

-- Adicionar coluna category_id na tabela tickets se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE tickets ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
    
    -- Migrar dados existentes da coluna category (texto) para category_id
    UPDATE tickets t
    SET category_id = c.id
    FROM categories c
    WHERE LOWER(t.category) = c.slug OR LOWER(t.category) = LOWER(c.name);
    
    -- Criar categoria 'Outros' para tickets sem categoria correspondente
    INSERT INTO categories (name, slug, description, icon, color, display_order)
    VALUES ('Outros', 'outros', 'Outras categorias não listadas', 'more-horizontal', '#94A3B8', 999)
    ON CONFLICT (slug) DO NOTHING;
    
    -- Atualizar tickets sem categoria para 'Outros'
    UPDATE tickets t
    SET category_id = c.id
    FROM categories c
    WHERE t.category_id IS NULL AND c.slug = 'outros';
  END IF;
END $$;

-- Criar índice na nova coluna
CREATE INDEX IF NOT EXISTS idx_tickets_category_id ON tickets(category_id);

-- Comentários sobre a tabela
COMMENT ON TABLE categories IS 'Tabela de categorias para classificação de tickets';
COMMENT ON COLUMN categories.name IS 'Nome da categoria exibido para o usuário';
COMMENT ON COLUMN categories.slug IS 'Identificador único URL-friendly';
COMMENT ON COLUMN categories.icon IS 'Nome do ícone Lucide React ou FontAwesome';
COMMENT ON COLUMN categories.color IS 'Cor hexadecimal para a categoria';
COMMENT ON COLUMN categories.display_order IS 'Ordem de exibição (menor número aparece primeiro)';

-- Garantir que a tabela seja acessível via API do Supabase
GRANT ALL ON categories TO authenticated;
GRANT SELECT ON categories TO anon;