-- ================================================
-- CRIAR/CORRIGIR ESTRUTURA COMPLETA DA TABELA TICKETS
-- ================================================
-- Este script cria a tabela tickets do zero ou adiciona as colunas faltantes
-- ================================================

-- 1. VERIFICAR SE A TABELA TICKETS EXISTE
-- ================================================
DO $$
BEGIN
  -- Se a tabela não existir, criar ela completa
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'tickets'
  ) THEN
    CREATE TABLE tickets (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      ticket_number SERIAL UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
      category TEXT NOT NULL DEFAULT 'general',
      created_by UUID NOT NULL,
      assigned_to UUID,
      resolution_notes TEXT,
      resolved_at TIMESTAMP WITH TIME ZONE,
      closed_at TIMESTAMP WITH TIME ZONE,
      due_date TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Tabela tickets criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela tickets já existe, verificando colunas...';
  END IF;
END $$;

-- 2. ADICIONAR COLUNAS FALTANTES (se a tabela já existir)
-- ================================================

-- Adicionar ticket_number se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'ticket_number'
  ) THEN
    ALTER TABLE tickets ADD COLUMN ticket_number SERIAL UNIQUE NOT NULL;
    RAISE NOTICE 'Coluna ticket_number adicionada';
  END IF;
END $$;

-- Adicionar title se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'title'
  ) THEN
    ALTER TABLE tickets ADD COLUMN title TEXT NOT NULL DEFAULT 'Sem título';
    RAISE NOTICE 'Coluna title adicionada';
  END IF;
END $$;

-- Adicionar description se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'description'
  ) THEN
    ALTER TABLE tickets ADD COLUMN description TEXT NOT NULL DEFAULT 'Sem descrição';
    RAISE NOTICE 'Coluna description adicionada';
  END IF;
END $$;

-- Adicionar status se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'status'
  ) THEN
    ALTER TABLE tickets ADD COLUMN status TEXT NOT NULL DEFAULT 'open' 
      CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'));
    RAISE NOTICE 'Coluna status adicionada';
  END IF;
END $$;

-- Adicionar priority se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'priority'
  ) THEN
    ALTER TABLE tickets ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium' 
      CHECK (priority IN ('low', 'medium', 'high', 'critical'));
    RAISE NOTICE 'Coluna priority adicionada';
  END IF;
END $$;

-- Adicionar category se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'category'
  ) THEN
    ALTER TABLE tickets ADD COLUMN category TEXT NOT NULL DEFAULT 'general';
    RAISE NOTICE 'Coluna category adicionada';
  END IF;
END $$;

-- Adicionar created_by se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE tickets ADD COLUMN created_by UUID;
    RAISE NOTICE 'Coluna created_by adicionada';
  END IF;
END $$;

-- Adicionar assigned_to se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE tickets ADD COLUMN assigned_to UUID;
    RAISE NOTICE 'Coluna assigned_to adicionada';
  END IF;
END $$;

-- Adicionar created_at se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE tickets ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Coluna created_at adicionada';
  END IF;
END $$;

-- Adicionar updated_at se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE tickets ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Coluna updated_at adicionada';
  END IF;
END $$;

-- 3. PREENCHER created_by COM UM USUÁRIO PADRÃO (se estiver NULL)
-- ================================================
DO $$
DECLARE
  default_user_id UUID;
BEGIN
  -- Buscar o admin ou qualquer usuário
  SELECT id INTO default_user_id 
  FROM users 
  WHERE email = 'admin@example.com' OR role = 'admin'
  LIMIT 1;
  
  -- Se não encontrar admin, pegar qualquer usuário
  IF default_user_id IS NULL THEN
    SELECT id INTO default_user_id FROM users LIMIT 1;
  END IF;
  
  -- Atualizar tickets sem created_by
  IF default_user_id IS NOT NULL THEN
    UPDATE tickets 
    SET created_by = default_user_id 
    WHERE created_by IS NULL;
    RAISE NOTICE 'Tickets atualizados com created_by padrão';
  END IF;
END $$;

-- 4. TORNAR created_by NOT NULL
-- ================================================
DO $$
BEGIN
  -- Verificar se pode tornar NOT NULL
  IF NOT EXISTS (SELECT 1 FROM tickets WHERE created_by IS NULL) THEN
    ALTER TABLE tickets ALTER COLUMN created_by SET NOT NULL;
    RAISE NOTICE 'Coluna created_by definida como NOT NULL';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Não foi possível tornar created_by NOT NULL';
END $$;

-- 5. REMOVER CONSTRAINTS ANTIGAS
-- ================================================
ALTER TABLE tickets 
  DROP CONSTRAINT IF EXISTS fk_tickets_created_by,
  DROP CONSTRAINT IF EXISTS fk_tickets_assigned_to,
  DROP CONSTRAINT IF EXISTS tickets_created_by_fkey,
  DROP CONSTRAINT IF EXISTS tickets_assigned_to_fkey;

-- 6. CRIAR AS FOREIGN KEYS CORRETAS
-- ================================================
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

-- 7. CRIAR ÍNDICES PARA PERFORMANCE
-- ================================================
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);

-- 8. VERIFICAÇÃO FINAL
-- ================================================
SELECT 
  '========================================' as separator,
  'ESTRUTURA FINAL DA TABELA TICKETS' as info,
  '========================================' as separator2;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tickets'
ORDER BY ordinal_position;

SELECT 
  '========================================' as separator,
  'FOREIGN KEYS CRIADAS' as info,
  '========================================' as separator2;

SELECT 
  conname AS constraint_name
FROM pg_constraint 
WHERE conrelid = 'tickets'::regclass 
  AND contype = 'f';

-- ================================================
-- SUCESSO! A tabela tickets está pronta para uso
-- ================================================