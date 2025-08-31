-- ================================================
-- SCRIPT DE DIAGNÓSTICO DO BANCO DE DADOS
-- ================================================
-- Execute este script para verificar o estado atual do banco
-- ================================================

-- 1. VERIFICAR SE AS TABELAS EXISTEM
-- ================================================
SELECT 
  'TABELAS EXISTENTES:' as info;

SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('users', 'tickets', 'ticket_comments', 'ticket_attachments', 'ticket_history')
    THEN '✅ OK'
    ELSE '❌ Faltando'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'tickets', 'ticket_comments', 'ticket_attachments', 'ticket_history')
ORDER BY table_name;

-- 2. VERIFICAR ESTRUTURA DA TABELA TICKETS
-- ================================================
SELECT 
  '---' as separator,
  'COLUNAS DA TABELA TICKETS:' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tickets'
ORDER BY ordinal_position;

-- 3. VERIFICAR FOREIGN KEYS EXISTENTES
-- ================================================
SELECT 
  '---' as separator,
  'FOREIGN KEYS NA TABELA TICKETS:' as info;

SELECT 
  conname AS constraint_name,
  a.attname AS column_name,
  confrelid::regclass AS references_table,
  af.attname AS references_column
FROM 
  pg_constraint c
  JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
  JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE 
  c.contype = 'f' 
  AND c.conrelid = 'tickets'::regclass;

-- 4. VERIFICAR QUANTIDADE DE REGISTROS
-- ================================================
SELECT 
  '---' as separator,
  'QUANTIDADE DE REGISTROS:' as info;

SELECT 
  'users' as tabela,
  COUNT(*) as total
FROM users
UNION ALL
SELECT 
  'tickets' as tabela,
  COUNT(*) as total
FROM tickets
ORDER BY tabela;

-- 5. TESTAR QUERY COM JOIN SIMPLES
-- ================================================
SELECT 
  '---' as separator,
  'TESTE DE JOIN (deve funcionar sempre):' as info;

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

-- 6. VERIFICAR SE RLS ESTÁ ATIVO
-- ================================================
SELECT 
  '---' as separator,
  'STATUS DO RLS (Row Level Security):' as info;

SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'tickets', 'ticket_comments', 'ticket_attachments', 'ticket_history');

-- 7. VERIFICAR POLÍTICAS DE SEGURANÇA
-- ================================================
SELECT 
  '---' as separator,
  'POLÍTICAS DE SEGURANÇA ATIVAS:' as info;

SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'tickets')
ORDER BY tablename, policyname;

-- ================================================
-- RESUMO DO DIAGNÓSTICO
-- ================================================
-- Se tudo estiver OK, você deve ver:
-- ✅ 5 tabelas criadas
-- ✅ Foreign keys com nomes terminados em _fkey
-- ✅ RLS ativado nas tabelas
-- ✅ Políticas de segurança configuradas
-- ✅ JOINs funcionando corretamente
-- ================================================