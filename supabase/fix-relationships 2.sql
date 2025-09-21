-- ================================================
-- SCRIPT PARA CORRIGIR RELACIONAMENTOS NO SUPABASE
-- ================================================
-- Este script corrige o erro: "Could not find a relationship between 'tickets' and 'users'"
-- Execute no SQL Editor do Supabase
-- ================================================

-- 1. PRIMEIRO, REMOVER CONSTRAINTS ANTIGAS (se existirem)
-- ================================================
ALTER TABLE IF EXISTS tickets 
  DROP CONSTRAINT IF EXISTS fk_tickets_created_by,
  DROP CONSTRAINT IF EXISTS fk_tickets_assigned_to,
  DROP CONSTRAINT IF EXISTS tickets_created_by_fkey,
  DROP CONSTRAINT IF EXISTS tickets_assigned_to_fkey;

-- 2. ADICIONAR AS FOREIGN KEYS COM NOMES ESPECÍFICOS
-- ================================================
-- IMPORTANTE: O Supabase usa o padrão de nome "_fkey" para reconhecer relações
ALTER TABLE tickets
  ADD CONSTRAINT tickets_created_by_fkey 
    FOREIGN KEY (created_by) 
    REFERENCES users(id) 
    ON DELETE CASCADE,
  ADD CONSTRAINT tickets_assigned_to_fkey 
    FOREIGN KEY (assigned_to) 
    REFERENCES users(id) 
    ON DELETE SET NULL;

-- 3. VERIFICAR SE AS RELAÇÕES FORAM CRIADAS
-- ================================================
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  a.attname AS column_name,
  confrelid::regclass AS foreign_table_name,
  af.attname AS foreign_column_name
FROM 
  pg_constraint c
  JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
  JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE 
  c.contype = 'f' 
  AND c.conrelid = 'tickets'::regclass;

-- 4. TESTAR A QUERY QUE O SISTEMA USA
-- ================================================
-- Esta é a query que o sistema usa para buscar tickets com relações
SELECT 
  t.*,
  created_by_user.id as creator_id,
  created_by_user.name as creator_name,
  created_by_user.email as creator_email,
  assigned_to_user.id as assignee_id,
  assigned_to_user.name as assignee_name,
  assigned_to_user.email as assignee_email
FROM tickets t
LEFT JOIN users created_by_user ON t.created_by = created_by_user.id
LEFT JOIN users assigned_to_user ON t.assigned_to = assigned_to_user.id
LIMIT 1;

-- 5. ALTERNATIVA: Usar a sintaxe do Supabase com "!"
-- ================================================
-- O Supabase usa esta sintaxe especial para joins
-- Teste se funciona após criar as foreign keys:
/*
  SELECT * FROM tickets
  SELECT 
    *,
    created_by_user:users!tickets_created_by_fkey(id, name, email),
    assigned_to_user:users!tickets_assigned_to_fkey(id, name, email)
  FROM tickets;
*/

-- ================================================
-- RESULTADO ESPERADO:
-- ================================================
-- Você deve ver 2 constraints listadas:
-- 1. tickets_created_by_fkey -> users(id)
-- 2. tickets_assigned_to_fkey -> users(id)
-- ================================================