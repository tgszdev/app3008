-- ====================================================================
-- SCRIPT DE VERIFICAÇÃO COMPLETA DO SISTEMA DE SESSÃO ÚNICA
-- ====================================================================
-- Execute este script no Supabase SQL Editor para verificar o status

-- 1. VERIFICAR TABELAS
SELECT 
    'TABELAS' as categoria,
    tablename as item,
    CASE 
        WHEN tablename IN ('sessions', 'accounts', 'users', 'verification_tokens') 
        THEN '✅ Existe' 
        ELSE '❌ Não encontrada' 
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('sessions', 'accounts', 'users', 'verification_tokens')

UNION ALL

-- 2. VERIFICAR TRIGGER
SELECT 
    'TRIGGER' as categoria,
    tgname as item,
    '✅ Configurado' as status
FROM pg_trigger 
WHERE tgname = 'trigger_enforce_single_session'

UNION ALL

-- 3. VERIFICAR FUNÇÃO DO TRIGGER
SELECT 
    'FUNÇÃO' as categoria,
    proname as item,
    '✅ Criada' as status
FROM pg_proc 
WHERE proname = 'invalidate_old_user_sessions'

UNION ALL

-- 4. VERIFICAR ÍNDICES
SELECT 
    'ÍNDICE' as categoria,
    indexname as item,
    '✅ Criado' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname IN ('sessions_user_id_idx', 'sessions_session_token_idx', 'sessions_expires_idx')

UNION ALL

-- 5. CONTAR SESSÕES ATIVAS
SELECT 
    'SESSÕES ATIVAS' as categoria,
    'Total de sessões não expiradas' as item,
    COUNT(*)::text || ' sessão(ões)' as status
FROM public.sessions 
WHERE expires > NOW()

UNION ALL

-- 6. VERIFICAR SESSÕES POR USUÁRIO
SELECT 
    'SESSÕES POR USUÁRIO' as categoria,
    COALESCE(u.email, s."userId") as item,
    COUNT(*)::text || ' sessão(ões)' as status
FROM public.sessions s
LEFT JOIN public.users u ON s."userId" = u.id
WHERE s.expires > NOW()
GROUP BY COALESCE(u.email, s."userId")
HAVING COUNT(*) > 0

ORDER BY categoria, item;

-- ====================================================================
-- TESTE DO TRIGGER (OPCIONAL - DESCOMENTE PARA TESTAR)
-- ====================================================================
/*
-- Criar duas sessões para o mesmo usuário para testar o trigger
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
BEGIN
    -- Inserir primeira sessão
    INSERT INTO public.sessions (id, "sessionToken", "userId", expires)
    VALUES (gen_random_uuid(), 'test_token_1_' || NOW()::text, test_user_id, NOW() + INTERVAL '1 day');
    
    -- Esperar 1 segundo
    PERFORM pg_sleep(1);
    
    -- Inserir segunda sessão (deve invalidar a primeira)
    INSERT INTO public.sessions (id, "sessionToken", "userId", expires)
    VALUES (gen_random_uuid(), 'test_token_2_' || NOW()::text, test_user_id, NOW() + INTERVAL '1 day');
    
    -- Verificar resultado
    RAISE NOTICE 'Sessões ativas para usuário teste: %', 
        (SELECT COUNT(*) FROM public.sessions WHERE "userId" = test_user_id AND expires > NOW());
    
    -- Limpar dados de teste
    DELETE FROM public.sessions WHERE "userId" = test_user_id;
END $$;
*/