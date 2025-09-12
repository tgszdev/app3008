-- ====================================================================
-- VERIFICAR CONSTRAINTS E FOREIGN KEYS
-- ====================================================================

-- 1. Verificar todas as foreign keys da tabela sessions
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    confrelid::regclass as referenced_table
FROM pg_constraint 
WHERE conrelid = 'public.sessions'::regclass
AND contype = 'f';

-- 2. Verificar se existe alguma constraint antiga com nome diferente
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'sessions' 
AND tc.constraint_type = 'FOREIGN KEY';

-- 3. Verificar quantos usuários existem no sistema
SELECT COUNT(*) as total_users FROM public.users;

-- 4. Verificar se há sessões órfãs (sem usuário correspondente)
SELECT 
    COUNT(*) as orphan_sessions,
    'Sessões sem usuário correspondente' as description
FROM public.sessions s
LEFT JOIN public.users u ON s."userId" = u.id
WHERE u.id IS NULL;

-- 5. Remover constraint antiga se existir e recriar corretamente
DO $$
BEGIN
    -- Remover constraints antigas
    ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS fk_sessions_user;
    ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_userId_fkey;
    ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_userid_fkey;
    
    -- Criar constraint correta
    ALTER TABLE public.sessions 
        ADD CONSTRAINT sessions_userId_fkey 
        FOREIGN KEY ("userId") 
        REFERENCES public.users(id) 
        ON DELETE CASCADE;
        
    RAISE NOTICE 'Foreign key recriada com sucesso!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao recriar foreign key: %', SQLERRM;
END $$;

-- 6. Verificar estrutura final
SELECT 
    'VERIFICAÇÃO FINAL' as status,
    conname as constraint_name
FROM pg_constraint 
WHERE conrelid = 'public.sessions'::regclass
AND contype = 'f';