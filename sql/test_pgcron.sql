-- =====================================================
-- SCRIPT DE TESTE PARA PG_CRON
-- =====================================================
-- Use este script para testar as funções antes de configurar os jobs

-- 1. Testar função de escalação automática
SELECT call_auto_escalation_api();

-- 2. Testar função de processamento de e-mails
SELECT call_process_emails_api();

-- 3. Verificar logs de escalação
SELECT 
    el.id,
    el.rule_id,
    er.name as rule_name,
    el.ticket_id,
    t.title as ticket_title,
    el.escalation_type,
    el.time_elapsed,
    el.success,
    el.triggered_at
FROM escalation_logs el
JOIN escalation_rules er ON el.rule_id = er.id
JOIN tickets t ON el.ticket_id = t.id
ORDER BY el.triggered_at DESC
LIMIT 10;

-- 4. Verificar notificações criadas
SELECT 
    n.id,
    n.type,
    n.title,
    n.message,
    n.is_read,
    u.email,
    u.name,
    n.created_at
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE n.type = 'escalation_email'
ORDER BY n.created_at DESC
LIMIT 10;

-- 5. Verificar comentários criados
SELECT 
    c.id,
    c.ticket_id,
    t.title as ticket_title,
    c.content,
    c.is_internal,
    u.name as author_name,
    c.created_at
FROM comments c
JOIN tickets t ON c.ticket_id = t.id
JOIN users u ON c.user_id = u.id
WHERE c.is_internal = true
ORDER BY c.created_at DESC
LIMIT 10;

-- 6. Verificar tickets que podem precisar de escalação
SELECT 
    t.id,
    t.title,
    t.status,
    t.priority,
    t.assigned_to,
    t.created_at,
    EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 60 as minutes_ago
FROM tickets t
WHERE t.status IN ('aberto', 'em-progresso', 'open', 'in_progress')
ORDER BY t.created_at ASC
LIMIT 10;

-- 7. Verificar regras ativas
SELECT 
    id,
    name,
    is_active,
    time_condition,
    time_threshold,
    time_unit,
    conditions,
    actions
FROM escalation_rules
WHERE is_active = true
ORDER BY priority ASC;

-- 8. Testar função específica de escalação
-- SELECT execute_auto_escalation_direct();

-- 9. Testar função específica de e-mails
-- SELECT process_escalation_emails_direct();

-- =====================================================
-- COMANDOS PARA MONITORAMENTO
-- =====================================================

-- Verificar jobs pg_cron configurados
-- SELECT * FROM cron.job;

-- Verificar execuções dos jobs
-- SELECT 
--     jobid,
--     jobname,
--     status,
--     start_time,
--     end_time,
--     return_message
-- FROM cron.job_run_details 
-- ORDER BY start_time DESC 
-- LIMIT 10;

-- Verificar logs do PostgreSQL
-- SELECT 
--     log_time,
--     log_level,
--     message
-- FROM pg_log 
-- WHERE message LIKE '%PG_CRON%' 
-- ORDER BY log_time DESC 
-- LIMIT 10;
