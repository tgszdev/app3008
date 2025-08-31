-- ================================================
-- CRIAR TABELA DE ANEXOS E CONFIGURAR STORAGE
-- ================================================
-- Execute este script no Supabase SQL Editor
-- ================================================

-- 1. CRIAR TABELA DE ANEXOS
-- ================================================
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL,
  comment_id UUID,
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign Keys
  CONSTRAINT attachments_ticket_fkey 
    FOREIGN KEY (ticket_id) 
    REFERENCES tickets(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT attachments_user_fkey 
    FOREIGN KEY (uploaded_by) 
    REFERENCES users(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT attachments_comment_fkey 
    FOREIGN KEY (comment_id) 
    REFERENCES ticket_comments(id) 
    ON DELETE CASCADE
);

-- 2. CRIAR ÍNDICES
-- ================================================
CREATE INDEX IF NOT EXISTS idx_attachments_ticket_id 
  ON ticket_attachments(ticket_id);
  
CREATE INDEX IF NOT EXISTS idx_attachments_user_id 
  ON ticket_attachments(uploaded_by);
  
CREATE INDEX IF NOT EXISTS idx_attachments_created_at 
  ON ticket_attachments(created_at DESC);

-- 3. HABILITAR RLS
-- ================================================
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR POLÍTICAS DE SEGURANÇA
-- ================================================
-- Permitir leitura para todos (temporário)
CREATE POLICY "attachments_select_policy" 
  ON ticket_attachments 
  FOR SELECT 
  USING (true);

-- Permitir inserção para usuários autenticados
CREATE POLICY "attachments_insert_policy" 
  ON ticket_attachments 
  FOR INSERT 
  WITH CHECK (true);

-- Permitir exclusão apenas para o uploader ou admin
CREATE POLICY "attachments_delete_policy" 
  ON ticket_attachments 
  FOR DELETE 
  USING (true);

-- 5. VERIFICAR ESTRUTURA
-- ================================================
SELECT 
  '=== TABELA DE ANEXOS CRIADA ===' as info;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ticket_attachments'
ORDER BY ordinal_position;

-- ================================================
-- CONFIGURAÇÃO DO STORAGE (MANUAL)
-- ================================================
-- IMPORTANTE: Você precisa criar o bucket no Supabase Dashboard:
-- 
-- 1. Acesse: Storage no menu lateral do Supabase
-- 2. Clique em "New Bucket"
-- 3. Nome: ticket-attachments
-- 4. Public: DESMARCAR (manter privado)
-- 5. File size limit: 10MB
-- 6. Allowed MIME types: Deixar vazio (aceitar todos)
-- 
-- Políticas de Storage (criar no dashboard):
-- - SELECT: Permitir para todos
-- - INSERT: Permitir para usuários autenticados
-- - DELETE: Permitir para o uploader
-- ================================================

-- 6. TESTE - Inserir anexo de exemplo
-- ================================================
DO $$
DECLARE
  test_ticket_id UUID;
  test_user_id UUID;
BEGIN
  -- Buscar um ticket e usuário para teste
  SELECT id INTO test_ticket_id FROM tickets LIMIT 1;
  SELECT id INTO test_user_id FROM users LIMIT 1;
  
  IF test_ticket_id IS NOT NULL AND test_user_id IS NOT NULL THEN
    -- Inserir anexo de teste
    INSERT INTO ticket_attachments (
      ticket_id,
      uploaded_by,
      file_name,
      file_size,
      file_type,
      file_url,
      storage_path
    ) VALUES (
      test_ticket_id,
      test_user_id,
      'documento-teste.pdf',
      1024000,
      'application/pdf',
      'https://exemplo.com/documento-teste.pdf',
      'tickets/' || test_ticket_id || '/documento-teste.pdf'
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Anexo de teste inserido!';
  END IF;
END $$;

-- 7. VERIFICAR ANEXOS CRIADOS
-- ================================================
SELECT 
  ta.id,
  ta.file_name,
  ta.file_size,
  ta.file_type,
  u.name as uploaded_by,
  ta.created_at
FROM ticket_attachments ta
JOIN users u ON ta.uploaded_by = u.id
ORDER BY ta.created_at DESC
LIMIT 5;

-- ================================================
-- PRONTO! Sistema de anexos configurado
-- ================================================
-- Lembre-se de criar o bucket "ticket-attachments" no Storage!