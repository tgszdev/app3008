-- ================================================
-- SCRIPT SEGURO - CORRIGIR TABELA TICKETS SEM ERROS
-- ================================================
-- Execute cada bloco separadamente para identificar problemas
-- ================================================

-- BLOCO 1: Ver estrutura atual da tabela
-- ================================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tickets'
ORDER BY ordinal_position;

-- BLOCO 2: Ver quantos registros existem
-- ================================================
SELECT COUNT(*) as total_tickets FROM tickets;

-- BLOCO 3: Adicionar colunas que faltam (uma por vez para não dar erro)
-- ================================================
-- Category
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tickets' 
      AND column_name = 'category'
  ) THEN
    ALTER TABLE tickets ADD COLUMN category TEXT DEFAULT 'general';
  END IF;
END $$;

-- Priority
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tickets' 
      AND column_name = 'priority'
  ) THEN
    ALTER TABLE tickets ADD COLUMN priority TEXT DEFAULT 'medium';
  END IF;
END $$;

-- Status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tickets' 
      AND column_name = 'status'
  ) THEN
    ALTER TABLE tickets ADD COLUMN status TEXT DEFAULT 'open';
  END IF;
END $$;

-- Title
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tickets' 
      AND column_name = 'title'
  ) THEN
    ALTER TABLE tickets ADD COLUMN title TEXT DEFAULT 'Ticket sem título';
  END IF;
END $$;

-- Description
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tickets' 
      AND column_name = 'description'
  ) THEN
    ALTER TABLE tickets ADD COLUMN description TEXT DEFAULT 'Sem descrição';
  END IF;
END $$;

-- Created_by
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tickets' 
      AND column_name = 'created_by'
  ) THEN
    ALTER TABLE tickets ADD COLUMN created_by UUID;
  END IF;
END $$;

-- Assigned_to
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tickets' 
      AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE tickets ADD COLUMN assigned_to UUID;
  END IF;
END $$;

-- Ticket_number
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tickets' 
      AND column_name = 'ticket_number'
  ) THEN
    ALTER TABLE tickets ADD COLUMN ticket_number SERIAL;
  END IF;
END $$;

-- Created_at
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tickets' 
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE tickets ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Updated_at
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tickets' 
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE tickets ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Resolution_notes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tickets' 
      AND column_name = 'resolution_notes'
  ) THEN
    ALTER TABLE tickets ADD COLUMN resolution_notes TEXT;
  END IF;
END $$;

-- Due_date
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tickets' 
      AND column_name = 'due_date'
  ) THEN
    ALTER TABLE tickets ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Resolved_at
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tickets' 
      AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE tickets ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Closed_at
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tickets' 
      AND column_name = 'closed_at'
  ) THEN
    ALTER TABLE tickets ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- BLOCO 4: Atualizar valores NULL com valores padrão
-- ================================================
-- Atualizar category
UPDATE tickets SET category = 'general' WHERE category IS NULL;

-- Atualizar priority
UPDATE tickets SET priority = 'medium' WHERE priority IS NULL;

-- Atualizar status
UPDATE tickets SET status = 'open' WHERE status IS NULL;

-- Atualizar title
UPDATE tickets SET title = 'Ticket sem título' WHERE title IS NULL OR title = '';

-- Atualizar description
UPDATE tickets SET description = 'Sem descrição' WHERE description IS NULL OR description = '';

-- Atualizar created_at
UPDATE tickets SET created_at = NOW() WHERE created_at IS NULL;

-- Atualizar updated_at
UPDATE tickets SET updated_at = NOW() WHERE updated_at IS NULL;

-- BLOCO 5: Atualizar created_by com um usuário válido
-- ================================================
DO $$
DECLARE
  default_user_id UUID;
BEGIN
  -- Buscar um usuário para usar como padrão
  SELECT id INTO default_user_id 
  FROM users 
  WHERE email = 'admin@example.com' 
     OR role = 'admin'
     OR email LIKE '%@%'
  LIMIT 1;
  
  -- Se encontrou um usuário, atualizar tickets sem created_by
  IF default_user_id IS NOT NULL THEN
    UPDATE tickets 
    SET created_by = default_user_id 
    WHERE created_by IS NULL;
    
    RAISE NOTICE 'Tickets atualizados com created_by: %', default_user_id;
  ELSE
    RAISE NOTICE 'AVISO: Nenhum usuário encontrado para usar como created_by';
  END IF;
END $$;

-- BLOCO 6: Adicionar constraints de validação
-- ================================================
-- Remover constraints antigas
ALTER TABLE tickets 
  DROP CONSTRAINT IF EXISTS tickets_status_check,
  DROP CONSTRAINT IF EXISTS tickets_priority_check;

-- Adicionar novas constraints
DO $$
BEGIN
  -- Constraint para status
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tickets_status_check'
  ) THEN
    ALTER TABLE tickets 
    ADD CONSTRAINT tickets_status_check 
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'));
  END IF;
  
  -- Constraint para priority
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tickets_priority_check'
  ) THEN
    ALTER TABLE tickets 
    ADD CONSTRAINT tickets_priority_check 
    CHECK (priority IN ('low', 'medium', 'high', 'critical'));
  END IF;
END $$;

-- BLOCO 7: Criar foreign keys (se created_by não for NULL)
-- ================================================
DO $$
DECLARE
  has_null_created_by BOOLEAN;
BEGIN
  -- Verificar se existe algum created_by NULL
  SELECT EXISTS(SELECT 1 FROM tickets WHERE created_by IS NULL) INTO has_null_created_by;
  
  IF NOT has_null_created_by THEN
    -- Remover constraints antigas
    ALTER TABLE tickets 
      DROP CONSTRAINT IF EXISTS tickets_created_by_fkey,
      DROP CONSTRAINT IF EXISTS tickets_assigned_to_fkey;
    
    -- Criar foreign keys
    ALTER TABLE tickets
      ADD CONSTRAINT tickets_created_by_fkey 
        FOREIGN KEY (created_by) 
        REFERENCES users(id) 
        ON DELETE CASCADE;
    
    ALTER TABLE tickets
      ADD CONSTRAINT tickets_assigned_to_fkey 
        FOREIGN KEY (assigned_to) 
        REFERENCES users(id) 
        ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign keys criadas com sucesso!';
  ELSE
    RAISE NOTICE 'AVISO: Existem tickets sem created_by. Foreign keys não foram criadas.';
  END IF;
END $$;

-- BLOCO 8: Verificação final
-- ================================================
SELECT 
  '=== ESTRUTURA FINAL ===' as info;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tickets'
ORDER BY ordinal_position;

-- BLOCO 9: Teste de consulta
-- ================================================
SELECT 
  '=== TESTE DE CONSULTA ===' as info;

SELECT 
  t.id,
  COALESCE(t.ticket_number, 0) as ticket_number,
  COALESCE(t.title, 'Sem título') as title,
  COALESCE(t.category, 'general') as category,
  COALESCE(t.status, 'open') as status,
  COALESCE(t.priority, 'medium') as priority,
  u.name as created_by_name
FROM tickets t
LEFT JOIN users u ON t.created_by = u.id
LIMIT 5;

-- ================================================
-- FIM DO SCRIPT
-- ================================================
-- Se algum bloco der erro, execute os próximos
-- O importante é ter as colunas criadas
-- ================================================