-- =====================================================
-- CORREÇÃO DO LOOP DE E-MAILS
-- =====================================================
-- Execute este script no Supabase SQL Editor

-- 1. PARAR O LOOP - MARCAR TODAS AS NOTIFICAÇÕES COMO PROCESSADAS
SELECT 'Marcando todas as notificações de escalação como processadas...' as status;

UPDATE notifications 
SET is_read = true
WHERE type = 'escalation_email' 
AND is_read = false;

-- 2. VERIFICAR QUANTAS NOTIFICAÇÕES FORAM MARCADAS
SELECT 'Verificando notificações processadas...' as status;
SELECT COUNT(*) as notificacoes_processadas
FROM notifications 
WHERE type = 'escalation_email' 
AND is_read = true;

-- 3. VERIFICAR NOTIFICAÇÕES PENDENTES (deve ser 0)
SELECT 'Verificando notificações pendentes...' as status;
SELECT COUNT(*) as notificacoes_pendentes
FROM notifications 
WHERE type = 'escalation_email' 
AND is_read = false;

-- 4. VERIFICAR LOGS DE ESCALAÇÃO RECENTES
SELECT 'Verificando logs de escalação recentes...' as status;
SELECT 
    el.id,
    el.ticket_id,
    t.title as ticket_title,
    er.name as rule_name,
    el.triggered_at,
    el.success
FROM escalation_logs el
JOIN tickets t ON el.ticket_id = t.id
JOIN escalation_rules er ON el.rule_id = er.id
WHERE el.triggered_at >= NOW() - INTERVAL '1 hour'
ORDER BY el.triggered_at DESC
LIMIT 10;

-- 5. VERIFICAR TICKETS QUE FORAM ESCALADOS RECENTEMENTE
SELECT 'Verificando tickets escalados recentemente...' as status;
SELECT 
    t.id,
    t.title,
    t.status,
    t.priority,
    t.assigned_to,
    t.created_at,
    t.updated_at
FROM tickets t
WHERE t.updated_at >= NOW() - INTERVAL '1 hour'
AND t.status IN ('aberto', 'em-progresso', 'open', 'in_progress')
ORDER BY t.updated_at DESC
LIMIT 10;

-- 6. LIMPAR LOGS DE ESCALAÇÃO MUITO ANTIGOS (opcional)
SELECT 'Limpando logs de escalação antigos...' as status;
DELETE FROM escalation_logs 
WHERE triggered_at < NOW() - INTERVAL '7 days';

-- 7. VERIFICAR CONFIGURAÇÃO DAS REGRAS
SELECT 'Verificando configuração das regras...' as status;
SELECT 
    id,
    name,
    is_active,
    time_threshold,
    time_unit,
    time_condition,
    conditions,
    actions
FROM escalation_rules 
WHERE is_active = true
ORDER BY priority ASC;

SELECT '✅ Correção do loop de e-mails concluída!' as status;
