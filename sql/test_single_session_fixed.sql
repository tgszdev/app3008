-- ====================================================================
-- TESTE DO SISTEMA DE SESSÃO ÚNICA (VERSÃO CORRIGIDA)
-- ====================================================================

-- Limpar dados de teste anteriores
DELETE FROM public.sessions WHERE "sessionToken" LIKE 'TEST_%';

-- Criar um usuário de teste temporário
DO $$
DECLARE
    test_user_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    session1_id TEXT := gen_random_uuid()::text;
    session2_id TEXT := gen_random_uuid()::text;
    session3_id TEXT := gen_random_uuid()::text;
BEGIN
    -- Limpar sessões antigas do usuário teste
    DELETE FROM public.sessions WHERE "userId" = test_user_id;
    
    RAISE NOTICE '=== INICIANDO TESTE DO TRIGGER DE SESSÃO ÚNICA ===';
    RAISE NOTICE '';
    
    -- TESTE 1: Criar primeira sessão
    RAISE NOTICE '1️⃣ Criando PRIMEIRA sessão para o usuário...';
    INSERT INTO public.sessions (id, "sessionToken", "userId", expires)
    VALUES (session1_id, 'TEST_SESSION_1', test_user_id, NOW() + INTERVAL '1 day');
    
    RAISE NOTICE '✅ Sessões ativas: %', 
        (SELECT COUNT(*) FROM public.sessions WHERE "userId" = test_user_id AND expires > NOW());
    RAISE NOTICE '';
    
    -- Pequena pausa
    PERFORM pg_sleep(1);
    
    -- TESTE 2: Criar segunda sessão (deve invalidar a primeira)
    RAISE NOTICE '2️⃣ Criando SEGUNDA sessão para o mesmo usuário...';
    INSERT INTO public.sessions (id, "sessionToken", "userId", expires)
    VALUES (session2_id, 'TEST_SESSION_2', test_user_id, NOW() + INTERVAL '1 day');
    
    RAISE NOTICE '✅ Sessões ativas: %', 
        (SELECT COUNT(*) FROM public.sessions WHERE "userId" = test_user_id AND expires > NOW());
    RAISE NOTICE '📊 Status da primeira sessão: %',
        (SELECT CASE 
            WHEN expires > NOW() THEN 'ATIVA ❌ (ERRO - deveria estar expirada!)' 
            ELSE 'EXPIRADA ✅ (Correto!)' 
        END 
        FROM public.sessions WHERE id = session1_id);
    RAISE NOTICE '';
    
    -- Pequena pausa
    PERFORM pg_sleep(1);
    
    -- TESTE 3: Criar terceira sessão (deve invalidar a segunda)
    RAISE NOTICE '3️⃣ Criando TERCEIRA sessão para o mesmo usuário...';
    INSERT INTO public.sessions (id, "sessionToken", "userId", expires)
    VALUES (session3_id, 'TEST_SESSION_3', test_user_id, NOW() + INTERVAL '1 day');
    
    RAISE NOTICE '✅ Sessões ativas: %', 
        (SELECT COUNT(*) FROM public.sessions WHERE "userId" = test_user_id AND expires > NOW());
    RAISE NOTICE '📊 Status da segunda sessão: %',
        (SELECT CASE 
            WHEN expires > NOW() THEN 'ATIVA ❌ (ERRO - deveria estar expirada!)' 
            ELSE 'EXPIRADA ✅ (Correto!)' 
        END 
        FROM public.sessions WHERE id = session2_id);
    RAISE NOTICE '';
    
    -- RESULTADO FINAL
    RAISE NOTICE '=== RESULTADO FINAL DO TESTE ===';
    IF (SELECT COUNT(*) FROM public.sessions WHERE "userId" = test_user_id AND expires > NOW()) = 1 THEN
        RAISE NOTICE '✅✅✅ SUCESSO! Sistema de sessão única está funcionando corretamente!';
        RAISE NOTICE 'Apenas 1 sessão ativa por usuário, como esperado.';
    ELSE
        RAISE NOTICE '❌❌❌ ERRO! Sistema não está funcionando corretamente!';
        RAISE NOTICE 'Múltiplas sessões ativas encontradas para o mesmo usuário.';
    END IF;
    
    -- Mostrar detalhes das sessões
    RAISE NOTICE '';
    RAISE NOTICE '📋 Detalhes das sessões de teste:';
    FOR session1_id IN 
        SELECT id FROM public.sessions WHERE "userId" = test_user_id ORDER BY created_at
    LOOP
        RAISE NOTICE 'Sessão: % | Status: %',
            (SELECT "sessionToken" FROM public.sessions WHERE id = session1_id),
            (SELECT CASE WHEN expires > NOW() THEN 'ATIVA' ELSE 'EXPIRADA' END 
             FROM public.sessions WHERE id = session1_id);
    END LOOP;
    
    -- Limpar dados de teste
    RAISE NOTICE '';
    RAISE NOTICE '🧹 Limpando dados de teste...';
    DELETE FROM public.sessions WHERE "userId" = test_user_id;
    RAISE NOTICE '✅ Dados de teste removidos.';
    
END $$;

-- Verificar se o trigger existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_enforce_single_session')
        THEN E'\n✅ TRIGGER CONFIRMADO: trigger_enforce_single_session está instalado e ativo!'
        ELSE E'\n❌ TRIGGER NÃO ENCONTRADO: Execute o script create_single_session_system.sql primeiro!'
    END as status;