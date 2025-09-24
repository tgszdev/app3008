-- =====================================================
-- SCHEMA PARA CATEGORIAS POR CONTEXTO
-- =====================================================

-- 1. Adicionar coluna context_id à tabela categories existente
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS context_id UUID REFERENCES contexts(id) ON DELETE CASCADE;

-- 2. Adicionar coluna is_global para categorias globais
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;

-- 3. Adicionar coluna parent_category_id para hierarquia
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- 4. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_categories_context_id ON categories(context_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_global ON categories(is_global);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_category_id);

-- 5. Atualizar categorias existentes para serem globais
UPDATE categories 
SET is_global = true, context_id = NULL 
WHERE context_id IS NULL;

-- 6. Criar função para verificar se categoria pode ser usada em contexto
CREATE OR REPLACE FUNCTION can_use_category_in_context(
  category_id UUID,
  target_context_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Categorias globais podem ser usadas em qualquer contexto
  IF EXISTS (
    SELECT 1 FROM categories 
    WHERE id = category_id AND is_global = true
  ) THEN
    RETURN true;
  END IF;
  
  -- Categorias específicas só podem ser usadas no seu contexto
  IF EXISTS (
    SELECT 1 FROM categories 
    WHERE id = category_id AND context_id = target_context_id
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar função para listar categorias disponíveis para um contexto
CREATE OR REPLACE FUNCTION get_categories_for_context(
  target_context_id UUID
) RETURNS TABLE (
  id UUID,
  name VARCHAR,
  slug VARCHAR,
  description TEXT,
  icon VARCHAR,
  color VARCHAR,
  is_active BOOLEAN,
  display_order INTEGER,
  is_global BOOLEAN,
  context_id UUID,
  parent_category_id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.description,
    c.icon,
    c.color,
    c.is_active,
    c.display_order,
    c.is_global,
    c.context_id,
    c.parent_category_id,
    c.created_at,
    c.updated_at
  FROM categories c
  WHERE 
    c.is_active = true 
    AND (
      c.is_global = true 
      OR c.context_id = target_context_id
    )
  ORDER BY c.display_order ASC, c.name ASC;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar RLS policies para categorias
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy para usuários matrix (podem ver todas as categorias)
CREATE POLICY "Matrix users can view all categories" ON categories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'matrix'
    )
  );

-- Policy para usuários context (podem ver categorias globais + do seu contexto)
CREATE POLICY "Context users can view global and their context categories" ON categories
  FOR SELECT
  TO authenticated
  USING (
    is_global = true 
    OR context_id = (
      SELECT users.context_id 
      FROM users 
      WHERE users.id = auth.uid()
    )
  );

-- Policy para criação (apenas admins)
CREATE POLICY "Admins can create categories" ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy para atualização (apenas admins)
CREATE POLICY "Admins can update categories" ON categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy para exclusão (apenas admins)
CREATE POLICY "Admins can delete categories" ON categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 9. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();

-- 10. Criar view para facilitar consultas
CREATE OR REPLACE VIEW categories_with_context AS
SELECT 
  c.*,
  ctx.name as context_name,
  ctx.type as context_type,
  ctx.slug as context_slug,
  parent.name as parent_category_name
FROM categories c
LEFT JOIN contexts ctx ON c.context_id = ctx.id
LEFT JOIN categories parent ON c.parent_category_id = parent.id;

-- 11. Comentários para documentação
COMMENT ON COLUMN categories.context_id IS 'ID do contexto (organização/departamento) - NULL para categorias globais';
COMMENT ON COLUMN categories.is_global IS 'Se true, categoria pode ser usada em qualquer contexto';
COMMENT ON COLUMN categories.parent_category_id IS 'ID da categoria pai para hierarquia';
COMMENT ON FUNCTION can_use_category_in_context IS 'Verifica se uma categoria pode ser usada em um contexto específico';
COMMENT ON FUNCTION get_categories_for_context IS 'Retorna categorias disponíveis para um contexto (globais + específicas)';
COMMENT ON VIEW categories_with_context IS 'View com informações completas das categorias incluindo contexto e hierarquia';
