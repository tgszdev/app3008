-- ================================================
-- DIAGNÓSTICO E CORREÇÃO COMPLETA
-- ================================================

-- 1. PRIMEIRO, VAMOS VER A ESTRUTURA ATUAL DA TABELA TICKETS
-- ================================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tickets'
ORDER BY ordinal_position;

-- 2. SE AS COLUNAS NÃO EXISTIREM, VAMOS ADICIONÁ-LAS
-- ================================================
-- Adicionar coluna created_by se não existir
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

-- Adicionar coluna assigned_to se não existir
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

-- 3. VERIFICAR SE EXISTE ALGUM USUÁRIO PARA USAR COMO PADRÃO
-- ================================================
SELECT id, email, name FROM users LIMIT 1;

-- 4. SE HOUVER TICKETS SEM created_by, ATUALIZAR COM UM USUÁRIO PADRÃO
-- ================================================
-- Pegar o ID do primeiro usuário admin
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Buscar um usuário admin ou o primeiro usuário disponível
  SELECT id INTO admin_id 
  FROM users 
  WHERE role = 'admin' OR email = 'admin@example.com'
  LIMIT 1;
  
  -- Se não encontrar admin, pegar qualquer usuário
  IF admin_id IS NULL THEN
    SELECT id INTO admin_id FROM users LIMIT 1;
  END IF;
  
  -- Atualizar tickets que não têm created_by
  IF admin_id IS NOT NULL THEN
    UPDATE tickets 
    SET created_by = admin_id 
    WHERE created_by IS NULL;
  END IF;
END $$;

-- 5. TORNAR created_by NOT NULL (se houver dados)
-- ================================================
DO $$
BEGIN
  -- Só tornar NOT NULL se todos os tickets tiverem created_by
  IF NOT EXISTS (
    SELECT 1 FROM tickets WHERE created_by IS NULL
  ) THEN
    ALTER TABLE tickets ALTER COLUMN created_by SET NOT NULL;
  END IF;
END $$;

-- 6. AGORA ADICIONAR AS FOREIGN KEYS
-- ================================================
-- Remover constraints antigas se existirem
ALTER TABLE IF EXISTS tickets 
  DROP CONSTRAINT IF EXISTS fk_tickets_created_by,
  DROP CONSTRAINT IF EXISTS fk_tickets_assigned_to,
  DROP CONSTRAINT IF EXISTS tickets_created_by_fkey,
  DROP CONSTRAINT IF EXISTS tickets_assigned_to_fkey;

-- Adicionar as foreign keys com nomes corretos
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

-- 7. VERIFICAR SE TUDO FOI CRIADO CORRETAMENTE
-- ================================================
SELECT 
  '=== ESTRUTURA FINAL DA TABELA TICKETS ===' as info;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tickets'
ORDER BY ordinal_position;

-- 8. VERIFICAR FOREIGN KEYS
-- ================================================
SELECT 
  '=== FOREIGN KEYS CRIADAS ===' as info;

SELECT 
  conname AS constraint_name,
  a.attname AS column_name,
  confrelid::regclass AS references_table
FROM 
  pg_constraint c
  JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE 
  c.contype = 'f' 
  AND c.conrelid = 'tickets'::regclass;

-- 9. TESTE FINAL
-- ================================================
SELECT 
  '=== TESTE DE JOIN ===' as info;

SELECT 
  t.id,
  t.title,
  t.status,
  u1.name as created_by_name,
  u2.name as assigned_to_name
FROM tickets t
LEFT JOIN users u1 ON t.created_by = u1.id
LEFT JOIN users u2 ON t.assigned_to = u2.id
LIMIT 3;

-- ================================================
-- FIM DO SCRIPT
-- ================================================
-- Após executar, você deve ver:
-- 1. As colunas created_by e assigned_to na tabela tickets
-- 2. As foreign keys tickets_created_by_fkey e tickets_assigned_to_fkey
-- 3. Os JOINs funcionando corretamente
-- ================================================