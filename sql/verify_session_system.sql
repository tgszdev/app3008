-- ============================================
-- VERIFICAÇÃO DO SISTEMA DE SESSÃO ÚNICA
-- Execute este script para verificar se tudo foi criado
-- ============================================

-- 1. Verificar se as tabelas existem
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('sessions', 'accounts', 'verification_tokens') 
    THEN '✅ Criada' 
    ELSE '❌ Não encontrada' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('sessions', 'accounts', 'verification_tokens')
ORDER BY table_name;

-- 2. Verificar se o trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  '✅ Trigger ativo' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name = 'trigger_enforce_single_session';

-- 3. Verificar índices
SELECT 
  indexname,
  tablename,
  '✅ Índice criado' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'sessions';

-- 4. Verificar RLS
SELECT 
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS Ativo' 
    ELSE '❌ RLS Inativo' 
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('sessions', 'accounts', 'verification_tokens');

-- 5. Status geral do sistema
SELECT * FROM public.check_session_system_status();

-- 6. Mensagem final
SELECT '🎉 VERIFICAÇÃO COMPLETA - Se todas as linhas mostram ✅, o sistema está pronto!' as resultado;