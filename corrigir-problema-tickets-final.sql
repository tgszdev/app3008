-- =====================================================
-- CORREÇÃO DEFINITIVA DO PROBLEMA: operator does not exist: integer ~~ text
-- PROBLEMA: Erro na inserção de tickets mesmo com dados mínimos
-- CAUSA: Problema estrutural na tabela tickets
-- SOLUÇÃO: Verificar e corrigir constraints/triggers problemáticos
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
    min_value,
    cache_value
FROM pg_sequences 
WHERE sequencename LIKE '%ticket%';

-- 5. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO TICKET_NUMBER
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'ticket_number';

-- 6. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO CREATED_BY
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'created_by';

-- 7. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO CONTEXT_ID
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'context_id';

-- 8. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO CATEGORY_ID
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'category_id';

-- 9. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO ASSIGNED_TO
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'assigned_to';

-- 10. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO PRIORITY
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'priority';

-- 11. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO STATUS
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'status';

-- 12. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO CATEGORY
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'category';

-- 13. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO IS_INTERNAL
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'is_internal';

-- 14. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO DUE_DATE
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'due_date';

-- 15. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO RESOLUTION_NOTES
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'resolution_notes';

-- 16. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO RESOLVED_AT
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'resolved_at';

-- 17. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO CLOSED_AT
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'closed_at';

-- 18. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO UPDATED_BY
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'updated_by';

-- 19. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO FIRST_RESPONSE_AT
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'first_response_at';

-- 20. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO SATISFACTION_RATING
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'satisfaction_rating';

-- 21. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO RATED_AT
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'rated_at';

-- 22. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO ASSIGNED_TO_MATRIX_USER
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'assigned_to_matrix_user';

-- 23. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO REQUESTER_CONTEXT_USER_ID
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'requester_context_user_id';

-- =====================================================
-- FIM DO SCRIPT DE DIAGNÓSTICO
-- =====================================================
-- 
-- Execute este script no Supabase Dashboard para identificar
-- qual campo está causando o problema de casting de tipos.
-- 
-- O erro "operator does not exist: integer ~~ text" indica
-- que há uma comparação entre tipos incompatíveis em algum
-- constraint, trigger ou função.
-- =====================================================
