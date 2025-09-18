-- =====================================================
-- CONFIGURAÇÃO SIMPLES PG_CRON NO SUPABASE
-- =====================================================
-- Execute este script no Supabase SQL Editor

-- 1. VERIFICAR EXTENSÕES DISPONÍVEIS
SELECT 'Verificando extensões disponíveis...' as status;
SELECT name, default_version, installed_version 
FROM pg_available_extensions 
WHERE name IN ('pg_cron', 'cron') 
ORDER BY name;

-- 2. TENTAR HABILITAR PG_CRON
SELECT 'Tentando habilitar pg_cron...' as status;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. VERIFICAR SE FOI HABILITADO
SELECT 'Verificando se pg_cron foi habilitado...' as status;
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- 4. VERIFICAR SCHEMA CRON
SELECT 'Verificando schema cron...' as status;
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'cron';

-- 5. VERIFICAR TABELAS DO CRON
SELECT 'Verificando tabelas do cron...' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'cron' 
ORDER BY table_name;

-- 6. TESTE SIMPLES - CRIAR JOB BÁSICO
SELECT 'Testando criação de job básico...' as status;
SELECT cron.schedule(
    'test-job',
    '* * * * *', -- A cada minuto
    'SELECT NOW() as test_time;'
);

-- 7. VERIFICAR JOBS CRIADOS
SELECT 'Verificando jobs criados...' as status;
SELECT * FROM cron.job;

-- 8. AGUARDAR E VERIFICAR EXECUÇÕES
SELECT 'Aguardando execuções...' as status;
SELECT pg_sleep(70); -- Aguarda 70 segundos

-- 9. VERIFICAR EXECUÇÕES
SELECT 'Verificando execuções...' as status;
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 5;

-- 10. REMOVER JOB DE TESTE
SELECT 'Removendo job de teste...' as status;
SELECT cron.unschedule('test-job');

SELECT '✅ Teste do pg_cron concluído!' as status;