-- Corrigir políticas RLS para categorias
-- Permitir que usuários context vejam suas categorias específicas + globais

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view categories" ON categories;
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can view global categories" ON categories;

-- Criar nova política para categorias
CREATE POLICY "Users can view categories" ON categories
FOR SELECT
USING (
  -- Categorias globais são visíveis para todos
  is_global = true
  OR
  -- Categorias específicas são visíveis para usuários do contexto
  (
    context_id IS NOT NULL 
    AND context_id IN (
      SELECT context_id 
      FROM users 
      WHERE id = auth.uid()
    )
  )
  OR
  -- Usuários matrix podem ver todas as categorias
  (
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'matrix'
    )
  )
);

-- Verificar se a política foi criada
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'categories';
