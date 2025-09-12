-- ====================================================================
-- TESTE DO SISTEMA DE SESSÃO ÚNICA COM USUÁRIO REAL
-- ====================================================================

-- Primeiro, vamos verificar quais usuários existem no sistema
SELECT id, email, name FROM public.users LIMIT 5;

-- Agora vamos fazer o teste com um usuário real
DO $$
DECLARE
    test_user_id UUID;
    test_user_email TEXT;
    session1_id TEXT := gen_random_uuid()::text;
    session2_id TEXT := gen_random_uuid()::text;
    session3_id TEXT := gen_random_uuid()::text;
BEGIN
    -- Pegar o ID de um usuário real (preferencialmente o seu)
    SELECT id, email INTO test_user_id, test_user_email
    FROM public.users 
    WHERE email = 'rodrigues2205@icloud.com'
    LIMIT 1;
    
    -- Se não encontrar, pegar qualquer usuário
    IF test_user_id IS NULL THEN
        SELECT id, email INTO test_user_id, test_user_email
        FROM public.users 
        LIMIT 1;
    END IF;
    
    -- Se ainda não tiver usuário, criar um temporário
    IF test_user_id IS NULL THEN
        test_user_id := gen_random_uuid();
        INSERT INTO public.users (id, email, name, created_at)
        VALUES (test_user_id, 'teste@example.com', 'Usuário Teste', NOW());
        test_user_email := 'teste@example.com';
    END IF;
    
    RAISE NOTICE '=== TESTE DE SESSÃO ÚNICA ===';
    RAISE NOTICE 'Testando com usuário: % (%)', test_user_email, test_user_id;
    RAISE NOTICE '';
    
    -- Limpar sessões antigas deste usuário
    DELETE FROM public.sessions WHERE "userId" = test_user_id;
    
    -- TESTE 1: Criar primeira sessão
    RAISE NOTICE '1️⃣ Criando PRIMEIRA sessão...';
    INSERT INTO public.sessions (id, "sessionToken", "userId", expires)
    VALUES (session1_id, 'TEST_SESSION_1_' || NOW()::text, test_user_id, NOW() + INTERVAL '1 day');
    
    RAISE NOTICE '✅ Sessões ativas: %', 
        (SELECT COUNT(*) FROM public.sessions WHERE "userId" = test_user_id AND expires > NOW());
    
    -- Pausa
    PERFORM pg_sleep(1);
    
    -- TESTE 2: Criar segunda sessão (deve invalidar a primeira)
    RAISE NOTICE '';
    RAISE NOTICE '2️⃣ Criando SEGUNDA sessão (deve invalidar a primeira)...';
    INSERT INTO public.sessions (id, "sessionToken", "userId", expires)
    VALUES (session2_id, 'TEST_SESSION_2_' || NOW()::text, test_user_id, NOW() + INTERVAL '1 day');
    
    RAISE NOTICE '✅ Sessões ativas: %', 
        (SELECT COUNT(*) FROM public.sessions WHERE "userId" = test_user_id AND expires > NOW());
    
    -- Verificar se a primeira foi invalidada
    RAISE NOTICE '📊 Primeira sessão foi expirada? %',
        (SELECT CASE 
            WHEN expires <= NOW() THEN 'SIM ✅' 
            ELSE 'NÃO ❌' 
        END 
        FROM public.sessions WHERE id = session1_id);
    
    -- Pausa
    PERFORM pg_sleep(1);
    
    -- TESTE 3: Criar terceira sessão
    RAISE NOTICE '';
    RAISE NOTICE '3️⃣ Criando TERCEIRA sessão (deve invalidar a segunda)...';
    INSERT INTO public.sessions (id, "sessionToken", "userId", expires)
    VALUES (session3_id, 'TEST_SESSION_3_' || NOW()::text, test_user_id, NOW() + INTERVAL '1 day');
    
    RAISE NOTICE '✅ Sessões ativas: %', 
        (SELECT COUNT(*) FROM public.sessions WHERE "userId" = test_user_id AND expires > NOW());
    
    -- Verificar se a segunda foi invalidada
    RAISE NOTICE '📊 Segunda sessão foi expirada? %',
        (SELECT CASE 
            WHEN expires <= NOW() THEN 'SIM ✅' 
            ELSE 'NÃO ❌' 
        END 
        FROM public.sessions WHERE id = session2_id);
    
    -- RESULTADO FINAL
    RAISE NOTICE '';
    RAISE NOTICE '=== RESULTADO FINAL ===';
    IF (SELECT COUNT(*) FROM public.sessions WHERE "userId" = test_user_id AND expires > NOW()) = 1 THEN
        RAISE NOTICE '✅✅✅ SUCESSO! Sistema funcionando!';
        RAISE NOTICE 'Apenas 1 sessão ativa, como esperado.';
        RAISE NOTICE '';
        RAISE NOTICE '🎯 ISSO SIGNIFICA QUE:';
        RAISE NOTICE '- Quando você fizer login em um novo dispositivo';
        RAISE NOTICE '- O login anterior será automaticamente desconectado';
        RAISE NOTICE '- Garantindo apenas 1 sessão ativa por vez!';
    ELSE
        RAISE NOTICE '❌ PROBLEMA DETECTADO!';
        RAISE NOTICE 'Encontradas % sessões ativas para o mesmo usuário.',
            (SELECT COUNT(*) FROM public.sessions WHERE "userId" = test_user_id AND expires > NOW());
        RAISE NOTICE 'O trigger pode não estar funcionando corretamente.';
    END IF;
    
    -- Limpar dados de teste
    RAISE NOTICE '';
    RAISE NOTICE '🧹 Limpando sessões de teste...';
    DELETE FROM public.sessions WHERE "userId" = test_user_id AND "sessionToken" LIKE 'TEST_%';
    
    -- Se criamos um usuário teste, remover
    IF test_user_email = 'teste@example.com' THEN
        DELETE FROM public.users WHERE id = test_user_id;
    END IF;
    
    RAISE NOTICE '✅ Teste concluído!';
    
END $$;

-- Verificar trigger
SELECT 
    'TRIGGER STATUS' as info,
    tgname as trigger_name,
    tgenabled as enabled,
    CASE 
        WHEN tgenabled = 'O' THEN '✅ Ativo'
        WHEN tgenabled = 'D' THEN '❌ Desativado'
        ELSE '⚠️ Status desconhecido'
    END as status
FROM pg_trigger 
WHERE tgname = 'trigger_enforce_single_session';