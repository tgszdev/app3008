-- =====================================================
-- TESTE FINAL DO SISTEMA AUTOMÁTICO (COLUNAS CORRETAS)
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

-- 7. Verificar execuções automáticas (COLUNAS CORRETAS)
SELECT 'EXECUÇÕES AUTOMÁTICAS:' as teste;
SELECT 
    jobid,
    runid,
    command,
    status,
    start_time,
    end_time,
    return_message
FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;

-- 8. Verificar tickets que podem precisar de escalação
SELECT 'TICKETS PARA ESCALAÇÃO:' as teste;
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

-- 9. Verificar regras ativas
SELECT 'REGRAS ATIVAS:' as teste;
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
