-- Corrigir políticas RLS para users
-- Permitir que usuários possam ver seus próprios dados

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can view users" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Criar nova política para users
CREATE POLICY "Users can view their own data" ON users
FOR SELECT
USING (
  -- Usuários podem ver seus próprios dados
  id = auth.uid()
  OR
  -- Usuários matrix podem ver todos os usuários
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
WHERE tablename = 'users';
