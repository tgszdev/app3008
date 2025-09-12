-- ====================================================================
-- VERIFICAÇÃO APÓS CORREÇÃO DOS NOMES DAS COLUNAS
-- ====================================================================

-- 1. VERIFICAR ESTRUTURA DA TABELA SESSIONS
SELECT 
    'ESTRUTURA SESSIONS' as categoria,
    column_name as item,
    data_type as status
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'sessions'
ORDER BY ordinal_position

UNION ALL

-- 2. VERIFICAR TODAS AS TABELAS NECESSÁRIAS
SELECT 
    'TABELAS' as categoria,
    tablename as item,
    '✅ Existe' as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('sessions', 'accounts', 'users', 'verification_tokens')

UNION ALL

-- 3. VERIFICAR TRIGGER
SELECT 
    'TRIGGER' as categoria,
    tgname as item,
    '✅ Configurado' as status
FROM pg_trigger 
WHERE tgname = 'trigger_enforce_single_session'

UNION ALL

-- 4. VERIFICAR ÍNDICES
SELECT 
    'ÍNDICE' as categoria,
    indexname as item,
    '✅ Criado' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'sessions_%'

ORDER BY categoria, item;