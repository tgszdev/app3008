-- =====================================================
-- TESTE IMEDIATO - EXECUÇÃO SEM ESPERAR CRON
-- =====================================================

-- 1. Verificar jobs ativos
SELECT 'JOBS ATIVOS:' as teste;
SELECT * FROM cron.job;

-- 2. EXECUTAR ESCALAÇÃO MANUAL (IMEDIATO)
SELECT 'EXECUÇÃO MANUAL - ESCALAÇÃO:' as teste;
SELECT call_auto_escalation_api();

-- 3. EXECUTAR PROCESSAMENTO DE E-MAILS MANUAL (IMEDIATO)
SELECT 'EXECUÇÃO MANUAL - E-MAILS:' as teste;
SELECT call_process_emails_api();

-- 4. Verificar logs de escalação (RESULTADOS IMEDIATOS)
SELECT 'LOGS DE ESCALAÇÃO (ÚLTIMOS 5):' as teste;
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

-- 5. Verificar notificações criadas (RESULTADOS IMEDIATOS)
SELECT 'NOTIFICAÇÕES CRIADAS (ÚLTIMAS 5):' as teste;
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

-- 6. Verificar comentários criados (RESULTADOS IMEDIATOS)
SELECT 'COMENTÁRIOS CRIADOS (ÚLTIMOS 5):' as teste;
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

-- 7. Verificar execuções dos jobs (SE HOUVER)
SELECT 'EXECUÇÕES DOS JOBS (ÚLTIMAS 5):' as teste;
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
LIMIT 5;

-- 8. Verificar tickets que podem ser escalados AGORA
SELECT 'TICKETS PARA ESCALAÇÃO (CRÍTICOS):' as teste;
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
AND t.priority = 'critical'
AND t.assigned_to IS NULL
ORDER BY t.created_at ASC
LIMIT 5;

-- 9. TESTE ESPECÍFICO - Executar escalação em um ticket específico
SELECT 'TESTE ESPECÍFICO - TICKET MAIS ANTIGO:' as teste;
SELECT 
    t.id,
    t.title,
    t.created_at,
    EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 60 as minutes_ago
FROM tickets t
WHERE t.status IN ('aberto', 'em-progresso', 'open', 'in_progress')
AND t.priority = 'critical'
AND t.assigned_to IS NULL
ORDER BY t.created_at ASC
LIMIT 1;

-- 10. Executar escalação no ticket mais antigo (se existir)
-- SELECT 'EXECUTANDO ESCALAÇÃO NO TICKET MAIS ANTIGO:' as teste;
-- SELECT execute_escalation_for_ticket(
--     (SELECT t.id FROM tickets t 
--      WHERE t.status IN ('aberto', 'em-progresso', 'open', 'in_progress')
--      AND t.priority = 'critical' 
--      AND t.assigned_to IS NULL
--      ORDER BY t.created_at ASC LIMIT 1)
-- );
