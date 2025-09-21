-- ================================================
-- CRIAR TODAS AS COLUNAS FALTANTES NA TABELA TICKETS
-- ================================================
-- Execute este script COMPLETO no Supabase SQL Editor
-- ================================================

-- 1. VERIFICAR ESTRUTURA ATUAL
-- ================================================
SELECT 
  '=== COLUNAS ATUAIS NA TABELA TICKETS ===' as info;

SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tickets'
ORDER BY ordinal_position;

-- 2. ADICIONAR TODAS AS COLUNAS QUE PODEM ESTAR FALTANDO
-- ================================================

-- Adicionar category
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Adicionar priority  
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

-- Adicionar status
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';

-- Adicionar title
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Sem título';

-- Adicionar description
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT 'Sem descrição';

-- Adicionar created_by
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Adicionar assigned_to
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS assigned_to UUID;

-- Adicionar ticket_number
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS ticket_number SERIAL;

-- Adicionar resolution_notes
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- Adicionar due_date
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

-- Adicionar resolved_at
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;

-- Adicionar closed_at
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;

-- Adicionar created_at
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Adicionar updated_at
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. PREENCHER created_by COM VALOR PADRÃO (se estiver NULL)
-- ================================================
UPDATE tickets 
SET created_by = (
  SELECT id FROM users 
  WHERE email = 'admin@example.com' 
  OR role = 'admin' 
  LIMIT 1
)
WHERE created_by IS NULL;

-- 4. ADICIONAR CONSTRAINTS DE VALIDAÇÃO
-- ================================================

-- Remover constraints antigas se existirem
ALTER TABLE tickets 
  DROP CONSTRAINT IF EXISTS tickets_status_check,
  DROP CONSTRAINT IF EXISTS tickets_priority_check;

-- Adicionar constraint para status
ALTER TABLE tickets 
ADD CONSTRAINT tickets_status_check 
CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'));

-- Adicionar constraint para priority
ALTER TABLE tickets 
ADD CONSTRAINT tickets_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- 5. TORNAR COLUNAS OBRIGATÓRIAS
-- ================================================

-- Tornar created_by NOT NULL (se tiver dados)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM tickets WHERE created_by IS NULL) THEN
    ALTER TABLE tickets ALTER COLUMN created_by SET NOT NULL;
  END IF;
END $$;

-- Tornar title NOT NULL
ALTER TABLE tickets ALTER COLUMN title SET NOT NULL;

-- Tornar description NOT NULL  
ALTER TABLE tickets ALTER COLUMN description SET NOT NULL;

-- Tornar status NOT NULL
ALTER TABLE tickets ALTER COLUMN status SET NOT NULL;

-- Tornar priority NOT NULL
ALTER TABLE tickets ALTER COLUMN priority SET NOT NULL;

-- Tornar category NOT NULL
ALTER TABLE tickets ALTER COLUMN category SET NOT NULL;

-- 6. CRIAR FOREIGN KEYS (se não existirem)
-- ================================================

-- Remover foreign keys antigas
ALTER TABLE tickets 
  DROP CONSTRAINT IF EXISTS tickets_created_by_fkey,
  DROP CONSTRAINT IF EXISTS tickets_assigned_to_fkey;

-- Criar foreign keys com nomes corretos
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
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

-- 8. VERIFICAÇÃO FINAL
-- ================================================
SELECT 
  '=== ESTRUTURA FINAL DA TABELA TICKETS ===' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tickets'
ORDER BY ordinal_position;

-- 9. TESTAR SE TUDO FUNCIONA
-- ================================================
SELECT 
  '=== TESTE DE CONSULTA ===' as info;

SELECT 
  t.id,
  t.ticket_number,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.category,
  t.created_at,
  u1.name as created_by_name,
  u2.name as assigned_to_name
FROM tickets t
LEFT JOIN users u1 ON t.created_by = u1.id
LEFT JOIN users u2 ON t.assigned_to = u2.id
ORDER BY t.created_at DESC
LIMIT 5;

-- ================================================
-- SUCESSO! Todas as colunas necessárias foram criadas
-- ================================================
-- Agora o sistema deve funcionar completamente:
-- ✅ Listar tickets
-- ✅ Criar novos tickets
-- ✅ Editar tickets
-- ✅ Filtrar por categoria, status, prioridade
-- ================================================