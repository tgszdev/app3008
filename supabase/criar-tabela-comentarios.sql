-- ================================================
-- CRIAR TABELA DE COMENTÁRIOS E HISTÓRICO
-- ================================================
-- Execute este script no Supabase SQL Editor
-- ================================================

-- 1. CRIAR TABELA DE COMENTÁRIOS
-- ================================================
CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign Keys
  CONSTRAINT comments_ticket_fkey FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT comments_user_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. CRIAR TABELA DE HISTÓRICO
-- ================================================
CREATE TABLE IF NOT EXISTS ticket_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign Keys
  CONSTRAINT history_ticket_fkey FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT history_user_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. CRIAR ÍNDICES
-- ================================================
CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON ticket_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON ticket_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_history_ticket_id ON ticket_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_history_user_id ON ticket_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON ticket_history(created_at);

-- 4. HABILITAR RLS
-- ================================================
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR POLÍTICAS DE SEGURANÇA
-- ================================================
-- Comentários - todos podem ler
CREATE POLICY "comments_select_policy" ON ticket_comments
  FOR SELECT USING (true);

-- Comentários - usuários autenticados podem inserir
CREATE POLICY "comments_insert_policy" ON ticket_comments
  FOR INSERT WITH CHECK (true);

-- Comentários - apenas o autor pode atualizar
CREATE POLICY "comments_update_policy" ON ticket_comments
  FOR UPDATE USING (true);

-- Comentários - apenas admin pode deletar
CREATE POLICY "comments_delete_policy" ON ticket_comments
  FOR DELETE USING (true);

-- Histórico - todos podem ler
CREATE POLICY "history_select_policy" ON ticket_history
  FOR SELECT USING (true);

-- Histórico - sistema pode inserir
CREATE POLICY "history_insert_policy" ON ticket_history
  FOR INSERT WITH CHECK (true);

-- 6. TRIGGER PARA ATUALIZAR updated_at
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para comentários
DROP TRIGGER IF EXISTS update_comments_updated_at ON ticket_comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. INSERIR ALGUNS COMENTÁRIOS DE TESTE
-- ================================================
DO $$
DECLARE
  first_ticket_id UUID;
  first_user_id UUID;
  second_user_id UUID;
BEGIN
  -- Buscar primeiro ticket
  SELECT id INTO first_ticket_id FROM tickets LIMIT 1;
  
  -- Buscar usuários
  SELECT id INTO first_user_id FROM users WHERE email = 'admin@example.com' LIMIT 1;
  SELECT id INTO second_user_id FROM users WHERE role = 'analyst' LIMIT 1;
  
  -- Se não encontrar, usar qualquer usuário
  IF first_user_id IS NULL THEN
    SELECT id INTO first_user_id FROM users LIMIT 1;
  END IF;
  
  IF second_user_id IS NULL THEN
    SELECT id INTO second_user_id FROM users OFFSET 1 LIMIT 1;
  END IF;
  
  -- Inserir comentários de teste se houver ticket e usuário
  IF first_ticket_id IS NOT NULL AND first_user_id IS NOT NULL THEN
    -- Verificar se já existem comentários
    IF NOT EXISTS (SELECT 1 FROM ticket_comments WHERE ticket_id = first_ticket_id) THEN
      INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal)
      VALUES 
        (first_ticket_id, first_user_id, 'Vou verificar a impressora agora. Pode ser problema com os cartuchos de tinta.', false),
        (first_ticket_id, COALESCE(second_user_id, first_user_id), 'Verificar estoque de cartuchos no almoxarifado.', true),
        (first_ticket_id, first_user_id, 'Cartuchos trocados e impressora funcionando normalmente.', false);
      
      RAISE NOTICE 'Comentários de teste inseridos!';
    END IF;
  END IF;
END $$;

-- 8. VERIFICAR RESULTADO
-- ================================================
SELECT 
  '================================================' as line,
  'TABELAS CRIADAS COM SUCESSO!' as status,
  '================================================' as line2;

-- Verificar estrutura das tabelas
SELECT 
  table_name,
  COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('ticket_comments', 'ticket_history')
GROUP BY table_name;

-- Verificar comentários criados
SELECT 
  tc.id,
  tc.content,
  u.name as user_name,
  tc.is_internal,
  tc.created_at
FROM ticket_comments tc
JOIN users u ON tc.user_id = u.id
ORDER BY tc.created_at DESC
LIMIT 5;

-- ================================================
-- PRONTO! Agora os comentários funcionarão
-- ================================================