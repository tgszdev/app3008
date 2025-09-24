-- =====================================================
-- SCRIPT PARA EXECUTAR NO SUPABASE DASHBOARD
-- OBJETIVO: Identificar o problema "operator does not exist: integer ~~ text"
-- =====================================================

-- 1. VERIFICAR ESTRUTURA DA TABELA TICKETS
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR CONSTRAINTS DA TABELA TICKETS
-- =====================================================
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'tickets')
ORDER BY conname;

-- 3. VERIFICAR TRIGGERS DA TABELA TICKETS
-- =====================================================
SELECT 
    tgname as trigger_name,
    tgtype as trigger_type,
    tgenabled as enabled,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgrelid = (SELECT oid FROM pg_class WHERE relname = 'tickets')
ORDER BY tgname;

-- 4. VERIFICAR SEQUÊNCIA DO TICKET_NUMBER
-- =====================================================
SELECT 
    schemaname,
    sequencename,
    last_value,
    start_value,
    increment_by,
    max_value,
    min_value
FROM pg_sequences 
WHERE sequencename LIKE '%ticket%';

-- 5. TESTE DE INSERÇÃO MÍNIMA (DEVE FALHAR)
-- =====================================================
-- Este teste deve falhar com o erro "operator does not exist: integer ~~ text"
INSERT INTO tickets (title, description, created_by) 
VALUES ('Teste Mínimo', 'Descrição mínima', '3b855060-50d4-4eef-abf5-4eec96934159');

-- 6. TESTE DE INSERÇÃO COM STATUS E PRIORITY (DEVE FALHAR)
-- =====================================================
-- Este teste deve falhar com o erro "operator does not exist: integer ~~ text"
INSERT INTO tickets (title, description, status, priority, created_by) 
VALUES ('Teste com Status', 'Descrição com status', 'open', 'medium', '3b855060-50d4-4eef-abf5-4eec96934159');

-- 7. TESTE DE INSERÇÃO COM CONTEXT_ID (DEVE FALHAR)
-- =====================================================
-- Este teste deve falhar com o erro "operator does not exist: integer ~~ text"
INSERT INTO tickets (title, description, context_id, created_by) 
VALUES ('Teste com Context', 'Descrição com context', '6486088e-72ae-461b-8b03-32ca84918882', '3b855060-50d4-4eef-abf5-4eec96934159');

-- 8. TESTE DE INSERÇÃO COM CATEGORY_ID (DEVE FALHAR)
-- =====================================================
-- Este teste deve falhar com o erro "operator does not exist: integer ~~ text"
INSERT INTO tickets (title, description, category_id, created_by) 
VALUES ('Teste com Category ID', 'Descrição com category_id', '56bafee4-4a49-44ff-b1f3-6dc48fb2476e', '3b855060-50d4-4eef-abf5-4eec96934159');

-- 9. TESTE DE INSERÇÃO COM ASSIGNED_TO (DEVE FALHAR)
-- =====================================================
-- Este teste deve falhar com o erro "operator does not exist: integer ~~ text"
INSERT INTO tickets (title, description, assigned_to, created_by) 
VALUES ('Teste com Assigned', 'Descrição com assigned_to', '2a33241e-ed38-48b5-9c84-e8c354ae9606', '3b855060-50d4-4eef-abf5-4eec96934159');

-- 10. TESTE DE INSERÇÃO COM IS_INTERNAL (DEVE FALHAR)
-- =====================================================
-- Este teste deve falhar com o erro "operator does not exist: integer ~~ text"
INSERT INTO tickets (title, description, is_internal, created_by) 
VALUES ('Teste com Internal', 'Descrição com is_internal', false, '3b855060-50d4-4eef-abf5-4eec96934159');

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
-- 
-- Execute este script no Supabase Dashboard para:
-- 1. Verificar a estrutura da tabela tickets
-- 2. Identificar constraints e triggers problemáticos
-- 3. Testar inserções que devem falhar
-- 
-- O erro "operator does not exist: integer ~~ text" deve
-- aparecer em todos os testes de inserção, indicando que
-- o problema está em algum constraint/trigger que é executado
-- independentemente dos campos inseridos.
-- =====================================================
