-- =====================================================
-- DIAGNÓSTICO FOCADO NO PROBLEMA: operator does not exist: integer ~~ text
-- OBJETIVO: Identificar exatamente qual campo está causando o problema
-- =====================================================

-- 1. VERIFICAR ESTRUTURA BÁSICA DA TABELA TICKETS
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

-- 2. VERIFICAR APENAS OS CAMPOS QUE PODEM CAUSAR PROBLEMA DE CASTING
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND table_schema = 'public'
    AND (
        column_name IN ('ticket_number', 'created_by', 'context_id', 'category_id', 'assigned_to', 'updated_by', 'assigned_to_matrix_user', 'requester_context_user_id')
        OR data_type LIKE '%int%'
        OR data_type LIKE '%serial%'
        OR column_default LIKE '%nextval%'
    )
ORDER BY column_name;

-- 3. VERIFICAR CONSTRAINTS QUE PODEM CAUSAR PROBLEMA
-- =====================================================
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'tickets')
    AND (
        pg_get_constraintdef(oid) LIKE '%integer%'
        OR pg_get_constraintdef(oid) LIKE '%text%'
        OR pg_get_constraintdef(oid) LIKE '%uuid%'
        OR pg_get_constraintdef(oid) LIKE '%~~%'
    )
ORDER BY conname;

-- 4. VERIFICAR TRIGGERS QUE PODEM CAUSAR PROBLEMA
-- =====================================================
SELECT 
    tgname as trigger_name,
    tgtype as trigger_type,
    tgenabled as enabled,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgrelid = (SELECT oid FROM pg_class WHERE relname = 'tickets')
    AND (
        pg_get_triggerdef(oid) LIKE '%integer%'
        OR pg_get_triggerdef(oid) LIKE '%text%'
        OR pg_get_triggerdef(oid) LIKE '%uuid%'
        OR pg_get_triggerdef(oid) LIKE '%~~%'
    )
ORDER BY tgname;

-- 5. VERIFICAR SEQUÊNCIA DO TICKET_NUMBER
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

-- 6. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO TICKET_NUMBER ESPECIFICAMENTE
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'ticket_number';

-- 7. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO CREATED_BY ESPECIFICAMENTE
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'created_by';

-- 8. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO CONTEXT_ID ESPECIFICAMENTE
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'context_id';

-- 9. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO CATEGORY_ID ESPECIFICAMENTE
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'category_id';

-- 10. VERIFICAR SE HÁ ALGUM PROBLEMA COM O CAMPO ASSIGNED_TO ESPECIFICAMENTE
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'tickets' 
    AND column_name = 'assigned_to';

-- =====================================================
-- FIM DO DIAGNÓSTICO FOCADO
-- =====================================================
-- 
-- Este script foca especificamente nos campos que podem
-- estar causando o problema de casting de tipos.
-- 
-- O erro "operator does not exist: integer ~~ text" indica
-- que há uma comparação entre tipos incompatíveis.
-- =====================================================
