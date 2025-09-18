-- =====================================================
-- CONFIGURAÇÃO PG_CRON SIMPLIFICADA
-- =====================================================
-- Script simplificado para configurar execução automática
-- usando pg_cron + chamadas para as APIs existentes

-- 1. Verificar se pg_cron está habilitado
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- 2. Habilitar pg_cron (se não estiver habilitado)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Função para chamar API de escalação automática
CREATE OR REPLACE FUNCTION call_auto_escalation_api()
RETURNS TEXT AS $$
DECLARE
    api_url TEXT := 'https://www.ithostbr.tech/api/escalation/auto-execute';
    response TEXT;
BEGIN
    -- Log de início
    RAISE NOTICE '🔄 [PG_CRON] Chamando API de escalação automática...';
    
    -- Simular chamada para API (em produção, usar http extension)
    -- Por enquanto, vamos executar a lógica diretamente
    PERFORM execute_auto_escalation_direct();
    
    RETURN 'Escalação automática executada via pg_cron';
END;
$$ LANGUAGE plpgsql;

-- 4. Função para chamar API de processamento de e-mails
CREATE OR REPLACE FUNCTION call_process_emails_api()
RETURNS TEXT AS $$
DECLARE
    api_url TEXT := 'https://www.ithostbr.tech/api/escalation/process-emails';
    response TEXT;
BEGIN
    -- Log de início
    RAISE NOTICE '📧 [PG_CRON] Chamando API de processamento de e-mails...';
    
    -- Simular chamada para API (em produção, usar http extension)
    -- Por enquanto, vamos executar a lógica diretamente
    PERFORM process_escalation_emails_direct();
    
    RETURN 'Processamento de e-mails executado via pg_cron';
END;
$$ LANGUAGE plpgsql;

-- 5. Função para executar escalação diretamente
CREATE OR REPLACE FUNCTION execute_auto_escalation_direct()
RETURNS VOID AS $$
DECLARE
    ticket_record RECORD;
    processed INTEGER := 0;
    executed INTEGER := 0;
BEGIN
    -- Log de início
    RAISE NOTICE '🔄 [PG_CRON] Iniciando execução automática de escalação - %', NOW();
    
    -- Buscar tickets que podem precisar de escalação
    FOR ticket_record IN
        SELECT 
            t.id,
            t.title,
            t.status,
            t.priority,
            t.created_at,
            t.updated_at,
            t.assigned_to
        FROM tickets t
        WHERE t.status IN ('aberto', 'em-progresso', 'open', 'in_progress')
        ORDER BY t.created_at ASC
        LIMIT 20
    LOOP
        BEGIN
            -- Verificar se precisa de escalação
            IF should_escalate_ticket(ticket_record) THEN
                -- Executar escalação
                PERFORM execute_ticket_escalation(ticket_record);
                executed := executed + 1;
                
                RAISE NOTICE '✅ [PG_CRON] Escalação executada para ticket %: %', 
                    ticket_record.id, ticket_record.title;
            END IF;
            
            processed := processed + 1;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ [PG_CRON] Erro ao processar ticket %: %', 
                ticket_record.id, SQLERRM;
        END;
    END LOOP;
    
    -- Log de conclusão
    RAISE NOTICE '🎯 [PG_CRON] Execução concluída: % tickets processados, % escalações executadas', 
        processed, executed;
END;
$$ LANGUAGE plpgsql;

-- 6. Função para verificar se ticket precisa de escalação
CREATE OR REPLACE FUNCTION should_escalate_ticket(ticket_data RECORD)
RETURNS BOOLEAN AS $$
DECLARE
    rule_record RECORD;
    time_elapsed INTEGER;
    current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Buscar regras ativas
    FOR rule_record IN
        SELECT * FROM escalation_rules 
        WHERE is_active = true 
        ORDER BY priority ASC
    LOOP
        -- Calcular tempo decorrido
        time_elapsed := EXTRACT(EPOCH FROM (current_time - ticket_data.created_at)) / 60;
        
        -- Verificar se atende aos critérios da regra
        IF time_elapsed >= rule_record.time_threshold THEN
            -- Verificar condições específicas
            IF check_rule_conditions(ticket_data, rule_record) THEN
                RETURN true;
            END IF;
        END IF;
    END LOOP;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- 7. Função para verificar condições da regra
CREATE OR REPLACE FUNCTION check_rule_conditions(ticket_data RECORD, rule_data RECORD)
RETURNS BOOLEAN AS $$
DECLARE
    conditions JSONB;
BEGIN
    conditions := rule_data.conditions;
    
    -- Verificar status
    IF conditions ? 'status' THEN
        IF conditions->>'status' != ticket_data.status AND 
           NOT (conditions->'status' ? ticket_data.status) THEN
            RETURN false;
        END IF;
    END IF;
    
    -- Verificar prioridade
    IF conditions ? 'priority' THEN
        IF conditions->>'priority' != ticket_data.priority AND 
           NOT (conditions->'priority' ? ticket_data.priority) THEN
            RETURN false;
        END IF;
    END IF;
    
    -- Verificar atribuição
    IF conditions ? 'assigned_to' THEN
        IF conditions->>'assigned_to' = 'null' AND ticket_data.assigned_to IS NOT NULL THEN
            RETURN false;
        END IF;
        IF conditions->>'assigned_to' != 'null' AND ticket_data.assigned_to IS NULL THEN
            RETURN false;
        END IF;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 8. Função para executar escalação do ticket
CREATE OR REPLACE FUNCTION execute_ticket_escalation(ticket_data RECORD)
RETURNS VOID AS $$
DECLARE
    rule_record RECORD;
    admin_user_id UUID;
    comment_text TEXT;
BEGIN
    -- Buscar usuário admin para comentários
    SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
    IF admin_user_id IS NULL THEN
        admin_user_id := '00000000-0000-0000-0000-000000000000';
    END IF;
    
    -- Buscar regra aplicável
    FOR rule_record IN
        SELECT * FROM escalation_rules 
        WHERE is_active = true 
        ORDER BY priority ASC
    LOOP
        -- Verificar se a regra se aplica
        IF check_rule_conditions(ticket_data, rule_record) THEN
            -- Executar ações da regra
            PERFORM execute_rule_actions(ticket_data, rule_record, admin_user_id);
            
            -- Log da execução
            INSERT INTO escalation_logs (
                rule_id,
                ticket_id,
                escalation_type,
                time_elapsed,
                conditions_met,
                actions_executed,
                success,
                triggered_at
            ) VALUES (
                rule_record.id,
                ticket_data.id,
                rule_record.time_condition,
                EXTRACT(EPOCH FROM (NOW() - ticket_data.created_at)) / 60,
                rule_record.conditions,
                rule_record.actions,
                true,
                NOW()
            );
            
            EXIT; -- Executar apenas a primeira regra aplicável
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 9. Função para executar ações da regra
CREATE OR REPLACE FUNCTION execute_rule_actions(
    ticket_data RECORD, 
    rule_data RECORD, 
    admin_user_id UUID
) RETURNS VOID AS $$
DECLARE
    actions JSONB;
    comment_text TEXT;
    new_priority TEXT;
BEGIN
    actions := rule_data.actions;
    
    -- Adicionar comentário
    IF actions ? 'add_comment' AND actions->>'add_comment' != 'false' THEN
        comment_text := COALESCE(
            actions->>'add_comment',
            'Comentário de escalação automática'
        );
        
        -- Adicionar comentário
        INSERT INTO comments (
            ticket_id,
            user_id,
            content,
            is_internal,
            created_at,
            updated_at
        ) VALUES (
            ticket_data.id,
            admin_user_id,
            comment_text,
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '💬 [PG_CRON] Comentário adicionado ao ticket %', ticket_data.id;
    END IF;
    
    -- Aumentar prioridade
    IF actions ? 'increase_priority' AND actions->>'increase_priority' = 'true' THEN
        CASE ticket_data.priority
            WHEN 'low' THEN new_priority := 'medium';
            WHEN 'medium' THEN new_priority := 'high';
            WHEN 'high' THEN new_priority := 'critical';
            ELSE new_priority := ticket_data.priority;
        END CASE;
        
        IF new_priority != ticket_data.priority THEN
            UPDATE tickets 
            SET priority = new_priority, updated_at = NOW()
            WHERE id = ticket_data.id;
            
            RAISE NOTICE '⬆️ [PG_CRON] Prioridade aumentada para % no ticket %', 
                new_priority, ticket_data.id;
        END IF;
    END IF;
    
    -- Criar notificação para e-mail
    IF actions ? 'send_email_notification' AND actions->>'send_email_notification' = 'true' THEN
        -- Buscar destinatários
        IF actions ? 'notify_supervisor' AND actions->'notify_supervisor' ? 'recipients' THEN
            -- Criar notificação para cada destinatário
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                data,
                is_read,
                created_at
            )
            SELECT 
                recipient_id,
                'escalation_email',
                'Escalação de Ticket - ' || rule_data.name,
                'Um ticket foi escalado automaticamente e precisa de atenção.',
                jsonb_build_object(
                    'ticket_id', ticket_data.id,
                    'ticket_title', ticket_data.title,
                    'rule_name', rule_data.name,
                    'escalation_type', rule_data.time_condition
                ),
                false,
                NOW()
            FROM jsonb_array_elements_text(actions->'notify_supervisor'->'recipients') AS recipient_id;
            
            RAISE NOTICE '📧 [PG_CRON] Notificações de e-mail criadas para ticket %', ticket_data.id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 10. Função para processar e-mails diretamente
CREATE OR REPLACE FUNCTION process_escalation_emails_direct()
RETURNS VOID AS $$
DECLARE
    notification_record RECORD;
    user_record RECORD;
    processed INTEGER := 0;
    sent INTEGER := 0;
BEGIN
    -- Log de início
    RAISE NOTICE '📧 [PG_CRON] Iniciando processamento de e-mails de escalação...';
    
    -- Buscar notificações pendentes
    FOR notification_record IN
        SELECT * FROM notifications 
        WHERE type = 'escalation_email' 
        AND is_read = false
        ORDER BY created_at ASC
        LIMIT 10
    LOOP
        BEGIN
            processed := processed + 1;
            
            -- Buscar dados do usuário
            SELECT email, name INTO user_record 
            FROM users 
            WHERE id = notification_record.user_id;
            
            IF NOT FOUND OR user_record.email IS NULL THEN
                RAISE NOTICE '❌ [PG_CRON] Usuário não encontrado ou sem e-mail para notificação %', 
                    notification_record.id;
                CONTINUE;
            END IF;
            
            -- Marcar como processado (em produção, integrar com serviço de e-mail)
            UPDATE notifications 
            SET is_read = true, updated_at = NOW()
            WHERE id = notification_record.id;
            
            sent := sent + 1;
            
            RAISE NOTICE '✅ [PG_CRON] E-mail processado para %', user_record.email;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ [PG_CRON] Erro ao processar notificação %: %', 
                notification_record.id, SQLERRM;
        END;
    END LOOP;
    
    -- Log de conclusão
    RAISE NOTICE '📧 [PG_CRON] Processamento concluído: % notificações processadas, % e-mails enviados', 
        processed, sent;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMANDOS PARA CONFIGURAR PG_CRON
-- =====================================================
-- Execute estes comandos separadamente após criar as funções:

-- 1. Configurar job para escalação automática (a cada 5 minutos)
-- SELECT cron.schedule(
--     'auto-escalation',
--     '*/5 * * * *',
--     'SELECT call_auto_escalation_api();'
-- );

-- 2. Configurar job para processamento de e-mails (a cada 2 minutos)
-- SELECT cron.schedule(
--     'process-escalation-emails',
--     '*/2 * * * *',
--     'SELECT call_process_emails_api();'
-- );

-- 3. Verificar jobs configurados
-- SELECT * FROM cron.job;

-- 4. Verificar execuções dos jobs
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- 5. Para remover jobs (se necessário)
-- SELECT cron.unschedule('auto-escalation');
-- SELECT cron.unschedule('process-escalation-emails');

-- =====================================================
-- INSTRUÇÕES DE EXECUÇÃO
-- =====================================================
-- 1. Execute este script no Supabase SQL Editor
-- 2. Execute os comandos SELECT cron.schedule() separadamente
-- 3. Verifique se os jobs foram criados
-- 4. Monitore as execuções
-- =====================================================
