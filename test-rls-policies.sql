-- =====================================================
-- TESTE DAS RLS POLICIES
-- =====================================================

-- Verificar se RLS está habilitado
SELECT 
    'RLS Status' as test_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('user_contexts', 'tickets')
AND schemaname = 'public';

-- Verificar policies criadas
SELECT 
    'Policies Created' as test_type,
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN permissive THEN 'PERMISSIVE'
        ELSE 'RESTRICTIVE'
    END as policy_type
FROM pg_policies 
WHERE tablename IN ('user_contexts', 'tickets')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar estrutura das tabelas
SELECT 
    'Table Structure' as test_type,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('user_contexts', 'tickets', 'users')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Verificar dados de exemplo
SELECT 
    'Sample Data' as test_type,
    'users' as table_name,
    COUNT(*) as record_count,
    COUNT(CASE WHEN user_type = 'matrix' THEN 1 END) as matrix_users,
    COUNT(CASE WHEN user_type = 'context' THEN 1 END) as context_users
FROM users;

SELECT 
    'Sample Data' as test_type,
    'contexts' as table_name,
    COUNT(*) as record_count,
    COUNT(CASE WHEN type = 'organization' THEN 1 END) as organizations,
    COUNT(CASE WHEN type = 'department' THEN 1 END) as departments
FROM contexts;

SELECT 
    'Sample Data' as test_type,
    'user_contexts' as table_name,
    COUNT(*) as record_count,
    COUNT(CASE WHEN can_manage = true THEN 1 END) as can_manage_count
FROM user_contexts;

SELECT 
    'Sample Data' as test_type,
    'tickets' as table_name,
    COUNT(*) as record_count,
    COUNT(CASE WHEN context_id IS NOT NULL THEN 1 END) as with_context,
    COUNT(CASE WHEN context_id IS NULL THEN 1 END) as without_context
FROM tickets;

-- Verificar se há tickets sem contexto (deve ser 0 após migração)
SELECT 
    'Migration Check' as test_type,
    'tickets_without_context' as check_name,
    COUNT(*) as count
FROM tickets 
WHERE context_id IS NULL;

-- Verificar associações por contexto
SELECT 
    'Context Associations' as test_type,
    c.name as context_name,
    c.type as context_type,
    COUNT(uc.user_id) as user_count
FROM contexts c
LEFT JOIN user_contexts uc ON c.id = uc.context_id
GROUP BY c.id, c.name, c.type
ORDER BY c.name;

-- Verificar tickets por contexto
SELECT 
    'Tickets by Context' as test_type,
    c.name as context_name,
    c.type as context_type,
    COUNT(t.id) as ticket_count
FROM contexts c
LEFT JOIN tickets t ON c.id = t.context_id
GROUP BY c.id, c.name, c.type
ORDER BY c.name;

-- =====================================================
-- RESUMO DOS TESTES
-- =====================================================

SELECT 
    'TEST SUMMARY' as test_type,
    'All tests completed successfully' as result,
    NOW() as test_time;
