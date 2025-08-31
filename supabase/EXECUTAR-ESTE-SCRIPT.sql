-- ================================================
-- SCRIPT SIMPLES - EXECUTAR ESTE!
-- ================================================
-- Execute cada bloco separadamente se der erro
-- ================================================

-- BLOCO 1: Adicionar colunas que faltam
-- ================================================
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assigned_to UUID;

-- BLOCO 2: Preencher created_by com um valor padrão
-- ================================================
UPDATE tickets 
SET created_by = (SELECT id FROM users LIMIT 1)
WHERE created_by IS NULL;

-- BLOCO 3: Tornar created_by obrigatório
-- ================================================
ALTER TABLE tickets ALTER COLUMN created_by SET NOT NULL;

-- BLOCO 4: Criar as foreign keys
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

-- BLOCO 5: Verificar se funcionou
-- ================================================
SELECT 
  t.id,
  t.title,
  u.name as created_by_name
FROM tickets t
LEFT JOIN users u ON t.created_by = u.id
LIMIT 1;