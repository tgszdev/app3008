-- ================================================
-- CORRIGIR ERRO DE ATUALIZAÇÃO DE STATUS
-- ================================================
-- Execute este script no Supabase SQL Editor
-- ================================================

-- 1. VERIFICAR SE A TABELA ticket_history EXISTE
-- ================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'ticket_history'
  ) THEN
    -- Criar tabela de histórico
    CREATE TABLE ticket_history (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      ticket_id UUID NOT NULL,
      user_id UUID,
      action TEXT NOT NULL,
      field_name TEXT,
      old_value TEXT,
      new_value TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Criar índices
    CREATE INDEX idx_history_ticket_id ON ticket_history(ticket_id);
    CREATE INDEX idx_history_user_id ON ticket_history(user_id);
    CREATE INDEX idx_history_created_at ON ticket_history(created_at);
    
    -- Habilitar RLS
    ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;
    
    -- Política permissiva
    CREATE POLICY "Allow all for history" ON ticket_history FOR ALL USING (true);
    
    RAISE NOTICE 'Tabela ticket_history criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela ticket_history já existe';
  END IF;
END $$;

-- 2. ADICIONAR FOREIGN KEYS (se não existirem)
-- ================================================
DO $$
BEGIN
  -- Verificar se as foreign keys existem
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'history_ticket_fkey'
  ) THEN
    ALTER TABLE ticket_history
      ADD CONSTRAINT history_ticket_fkey 
      FOREIGN KEY (ticket_id) 
      REFERENCES tickets(id) 
      ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'history_user_fkey'
  ) THEN
    ALTER TABLE ticket_history
      ADD CONSTRAINT history_user_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES users(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- 3. TESTAR ATUALIZAÇÃO DE TICKET
-- ================================================
-- Pegar um ticket para teste
DO $$
DECLARE
  test_ticket_id UUID;
  test_user_id UUID;
BEGIN
  -- Pegar o primeiro ticket
  SELECT id INTO test_ticket_id FROM tickets LIMIT 1;
  
  -- Pegar um usuário admin
  SELECT id INTO test_user_id FROM users WHERE role = 'admin' LIMIT 1;
  
  IF test_ticket_id IS NOT NULL THEN
    -- Tentar atualizar o status
    UPDATE tickets 
    SET 
      status = CASE 
        WHEN status = 'open' THEN 'in_progress'
        WHEN status = 'in_progress' THEN 'resolved'
        WHEN status = 'resolved' THEN 'closed'
        ELSE 'open'
      END,
      updated_at = NOW()
    WHERE id = test_ticket_id;
    
    -- Inserir no histórico
    IF test_user_id IS NOT NULL THEN
      INSERT INTO ticket_history (
        ticket_id, 
        user_id, 
        action, 
        field_name, 
        old_value, 
        new_value
      ) VALUES (
        test_ticket_id,
        test_user_id,
        'status_changed',
        'status',
        'open',
        'in_progress'
      );
    END IF;
    
    RAISE NOTICE 'Teste de atualização executado com sucesso!';
  END IF;
END $$;

-- 4. VERIFICAR ESTRUTURA FINAL
-- ================================================
SELECT 
  '=== VERIFICAÇÃO FINAL ===' as info;

-- Verificar se a tabela ticket_history existe
SELECT 
  EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'ticket_history'
  ) as history_table_exists;

-- Verificar permissões na tabela tickets
SELECT 
  has_table_privilege('tickets', 'UPDATE') as can_update_tickets,
  has_table_privilege('ticket_history', 'INSERT') as can_insert_history;

-- Ver um ticket de exemplo
SELECT 
  id,
  title,
  status,
  updated_at
FROM tickets
LIMIT 1;

-- ================================================
-- PRONTO! Agora a atualização de status deve funcionar
-- ================================================