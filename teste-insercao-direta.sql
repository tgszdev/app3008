-- =====================================================
-- TESTE DE INSERÇÃO DIRETA PARA IDENTIFICAR O PROBLEMA
-- OBJETIVO: Testar inserção com diferentes combinações de campos
-- =====================================================

-- 1. TESTE DE INSERÇÃO MÍNIMA
-- =====================================================
-- Este teste deve falhar com o erro "operator does not exist: integer ~~ text"
INSERT INTO tickets (title, description, created_by) 
VALUES ('Teste Mínimo', 'Descrição mínima', '3b855060-50d4-4eef-abf5-4eec96934159');

-- 2. TESTE DE INSERÇÃO COM STATUS E PRIORITY
-- =====================================================
-- Este teste deve falhar com o erro "operator does not exist: integer ~~ text"
INSERT INTO tickets (title, description, status, priority, created_by) 
VALUES ('Teste com Status', 'Descrição com status', 'open', 'medium', '3b855060-50d4-4eef-abf5-4eec96934159');

-- 3. TESTE DE INSERÇÃO COM CATEGORY
-- =====================================================
-- Este teste deve falhar com o erro "operator does not exist: integer ~~ text"
INSERT INTO tickets (title, description, category, created_by) 
VALUES ('Teste com Category', 'Descrição com category', 'general', '3b855060-50d4-4eef-abf5-4eec96934159');

-- 4. TESTE DE INSERÇÃO COM CONTEXT_ID
-- =====================================================
-- Este teste deve falhar com o erro "operator does not exist: integer ~~ text"
INSERT INTO tickets (title, description, context_id, created_by) 
VALUES ('Teste com Context', 'Descrição com context', '6486088e-72ae-461b-8b03-32ca84918882', '3b855060-50d4-4eef-abf5-4eec96934159');

-- 5. TESTE DE INSERÇÃO COM CATEGORY_ID
-- =====================================================
-- Este teste deve falhar com o erro "operator does not exist: integer ~~ text"
INSERT INTO tickets (title, description, category_id, created_by) 
VALUES ('Teste com Category ID', 'Descrição com category_id', '56bafee4-4a49-44ff-b1f3-6dc48fb2476e', '3b855060-50d4-4eef-abf5-4eec96934159');

-- 6. TESTE DE INSERÇÃO COM ASSIGNED_TO
-- =====================================================
-- Este teste deve falhar com o erro "operator does not exist: integer ~~ text"
INSERT INTO tickets (title, description, assigned_to, created_by) 
VALUES ('Teste com Assigned', 'Descrição com assigned_to', '2a33241e-ed38-48b5-9c84-e8c354ae9606', '3b855060-50d4-4eef-abf5-4eec96934159');

-- 7. TESTE DE INSERÇÃO COM IS_INTERNAL
-- =====================================================
-- Este teste deve falhar com o erro "operator does not exist: integer ~~ text"
INSERT INTO tickets (title, description, is_internal, created_by) 
VALUES ('Teste com Internal', 'Descrição com is_internal', false, '3b855060-50d4-4eef-abf5-4eec96934159');

-- 8. TESTE DE INSERÇÃO COM DUE_DATE
-- =====================================================
-- Este teste deve falhar com o erro "operator does not exist: integer ~~ text"
INSERT INTO tickets (title, description, due_date, created_by) 
VALUES ('Teste com Due Date', 'Descrição com due_date', '2025-12-31', '3b855060-50d4-4eef-abf5-4eec96934159');

-- 9. TESTE DE INSERÇÃO COM RESOLUTION_NOTES
-- =====================================================
-- Este teste deve falhar com o erro "operator does not exist: integer ~~ text"
INSERT INTO tickets (title, description, resolution_notes, created_by) 
VALUES ('Teste com Resolution', 'Descrição com resolution_notes', 'Notas de resolução', '3b855060-50d4-4eef-abf5-4eec96934159');

-- 10. TESTE DE INSERÇÃO COM UPDATED_BY
-- =====================================================
-- Este teste deve falhar com o erro "operator does not exist: integer ~~ text"
INSERT INTO tickets (title, description, updated_by, created_by) 
VALUES ('Teste com Updated By', 'Descrição com updated_by', '2a33241e-ed38-48b5-9c84-e8c354ae9606', '3b855060-50d4-4eef-abf5-4eec96934159');

-- =====================================================
-- FIM DOS TESTES DE INSERÇÃO
-- =====================================================
-- 
-- Execute estes testes um por vez para identificar
-- qual campo específico está causando o problema.
-- 
-- O erro "operator does not exist: integer ~~ text" deve
-- aparecer em todos os testes, indicando que o problema
-- está em algum constraint/trigger que é executado
-- independentemente dos campos inseridos.
-- =====================================================
