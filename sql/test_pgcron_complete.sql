-- =====================================================
-- TESTE COMPLETO DO SISTEMA AUTOMÁTICO (CORRIGIDO)
-- =====================================================

-- 1. Verificar jobs ativos
SELECT 'JOBS ATIVOS:' as teste;
SELECT * FROM cron.job;

-- 2. Executar escalação manual
SELECT 'EXECUÇÃO MANUAL - ESCALAÇÃO:' as teste;
SELECT call_auto_escalation_api();

-- 3. Executar processamento de e-mails manual
SELECT 'EXECUÇÃO MANUAL - E-MAILS:' as teste;
SELECT call_process_emails_api();

-- 4. Verificar logs de escalação
SELECT 'LOGS DE ESCALAÇÃO:' as teste;
SELECT 
    el.id,
    er.name as rule_name,
    t.title as ticket_title,
    el.success,
    el.triggered_at
FROM escalation_logs el
JOIN escalation_rules er ON el.rule_id = er.id
JOIN tickets t ON el.ticket_id = t.id
ORDER BY el.triggered_at DESC
LIMIT 5;

-- 5. Verificar notificações
SELECT 'NOTIFICAÇÕES:' as teste;
SELECT 
    n.type,
    n.title,
    u.email,
    n.is_read,
    n.created_at
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE n.type = 'escalation_email'
ORDER BY n.created_at DESC
LIMIT 5;

-- 6. Verificar comentários
SELECT 'COMENTÁRIOS:' as teste;
SELECT 
    t.title as ticket_title,
    c.content,
    c.is_internal,
    c.created_at
FROM comments c
JOIN tickets t ON c.ticket_id = t.id
WHERE c.is_internal = true
ORDER BY c.created_at DESC
LIMIT 5;

-- 7. Verificar execuções automáticas (CORRIGIDO)
SELECT 'EXECUÇÕES AUTOMÁTICAS:' as teste;
SELECT 
    jobid,
    status,
    start_time,
    end_time,
    return_message
FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 5;

-- 8. Verificar estrutura da tabela cron.job_run_details
SELECT 'ESTRUTURA DA TABELA CRON.JOB_RUN_DETAILS:' as teste;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'cron' 
AND table_name = 'job_run_details'
ORDER BY ordinal_position;
