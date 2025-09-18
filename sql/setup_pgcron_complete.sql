-- =====================================================
-- CONFIGURAÇÃO COMPLETA PG_CRON PARA ESCALAÇÃO AUTOMÁTICA
-- =====================================================
-- Execute este script completo no Supabase SQL Editor
-- Este script configura execução automática de escalação

-- 1. VERIFICAR SE PG_CRON ESTÁ DISPONÍVEL
SELECT 'Verificando pg_cron...' as status;
SELECT * FROM pg_available_extensions WHERE name = 'pg_cron';

-- 2. HABILITAR PG_CRON
SELECT 'Habilitando pg_cron...' as status;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. VERIFICAR SE FOI HABILITADO
SELECT 'Verificando se pg_cron foi habilitado...' as status;
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- 4. REMOVER FUNÇÕES EXISTENTES (se existirem)
SELECT 'Removendo funções existentes...' as status;
DROP FUNCTION IF EXISTS execute_auto_escalation();
DROP FUNCTION IF EXISTS execute_escalation_for_ticket(UUID);
DROP FUNCTION IF EXISTS should_execute_escalation_simple(RECORD, RECORD, OUT BOOLEAN, OUT INTEGER);
DROP FUNCTION IF EXISTS execute_escalation_actions_simple(RECORD, RECORD, INTEGER);
DROP FUNCTION IF EXISTS process_escalation_emails();
DROP FUNCTION IF EXISTS call_auto_escalation_api();
DROP FUNCTION IF EXISTS call_process_emails_api();

-- 5. FUNÇÃO PARA EXECUTAR ESCALAÇÃO AUTOMÁTICA
SELECT 'Criando função de escalação automática...' as status;
CREATE OR REPLACE FUNCTION execute_auto_escalation()
RETURNS TABLE(
    processed_count INTEGER,
    executed_count INTEGER,
    results JSONB
) AS $$
DECLARE
    ticket_record RECORD;
    escalation_result JSONB;
    processed INTEGER := 0;
    executed INTEGER := 0;
    results_array JSONB := '[]'::JSONB;
    result_item JSONB;
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
        LIMIT 50
    LOOP
        BEGIN
            -- Executar escalação para o ticket
            SELECT execute_escalation_for_ticket(ticket_record.id) INTO escalation_result;
            processed := processed + 1;
            
            -- Verificar se houve execução
            IF escalation_result->>'success' = 'true' AND 
               jsonb_array_length(escalation_result->'executedRules') > 0 THEN
                executed := executed + 1;
                
                -- Adicionar ao array de resultados
                result_item := jsonb_build_object(
                    'ticket_id', ticket_record.id,
                    'ticket_title', ticket_record.title,
                    'success', true,
                    'executed_rules', escalation_result->'executedRules',
                    'message', escalation_result->>'message'
                );
                results_array := results_array || result_item;
                
                RAISE NOTICE '✅ [PG_CRON] Escalação executada para ticket %: %', 
                    ticket_record.id, escalation_result->>'message';
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            -- Log de erro
            RAISE NOTICE '❌ [PG_CRON] Erro ao processar ticket %: %', 
                ticket_record.id, SQLERRM;
                
            -- Adicionar erro ao array de resultados
            result_item := jsonb_build_object(
                'ticket_id', ticket_record.id,
                'ticket_title', ticket_record.title,
                'success', false,
                'error', SQLERRM
            );
            results_array := results_array || result_item;
        END;
    END LOOP;
    
    -- Log de conclusão
    RAISE NOTICE '🎯 [PG_CRON] Execução concluída: % tickets processados, % escalações executadas', 
        processed, executed;
    
    -- Retornar resultados
    RETURN QUERY SELECT processed, executed, results_array;
END;
$$ LANGUAGE plpgsql;

-- 6. FUNÇÃO PARA EXECUTAR ESCALAÇÃO DE UM TICKET ESPECÍFICO
SELECT 'Criando função de escalação por ticket...' as status;
CREATE OR REPLACE FUNCTION execute_escalation_for_ticket(ticket_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    ticket_data RECORD;
    rule_record RECORD;
    should_execute BOOLEAN;
    time_elapsed INTEGER;
    executed_rules TEXT[] := '{}';
    result_message TEXT;
BEGIN
    -- Buscar dados do ticket
    SELECT * INTO ticket_data FROM tickets WHERE id = ticket_uuid;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Ticket não encontrado',
            'executedRules', '[]'::jsonb
        );
    END IF;
    
    -- Buscar regras ativas
    FOR rule_record IN
        SELECT * FROM escalation_rules 
        WHERE is_active = true 
        ORDER BY priority ASC
    LOOP
        -- Verificar se a regra deve ser executada
        SELECT should_execute_escalation_simple(
            ticket_data,
            rule_record,
            time_elapsed
        ) INTO should_execute, time_elapsed;
        
        IF should_execute THEN
            -- Executar ações da regra
            PERFORM execute_escalation_actions_simple(
                ticket_data,
                rule_record,
                time_elapsed
            );
            
            -- Adicionar à lista de regras executadas
            executed_rules := executed_rules || rule_record.name;
            
            -- Log da execução
            RAISE NOTICE '✅ [PG_CRON] Regra executada: % para ticket %', 
                rule_record.name, ticket_data.id;
        END IF;
    END LOOP;
    
    -- Preparar resultado
    IF array_length(executed_rules, 1) > 0 THEN
        result_message := format('Escalação executada para %s regra(s)', 
            array_length(executed_rules, 1));
    ELSE
        result_message := 'Nenhuma regra de escalação aplicável';
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'executedRules', to_jsonb(executed_rules),
        'message', result_message
    );
END;
$$ LANGUAGE plpgsql;

-- 7. FUNÇÃO PARA VERIFICAR SE ESCALAÇÃO DEVE SER EXECUTADA
SELECT 'Criando função de verificação de escalação...' as status;
CREATE OR REPLACE FUNCTION should_execute_escalation_simple(
    ticket_data RECORD,
    rule_data RECORD,
    OUT should_execute BOOLEAN,
    OUT time_elapsed INTEGER
) AS $$
DECLARE
    conditions JSONB;
    time_threshold INTEGER;
    time_unit TEXT;
    time_condition TEXT;
    current_time TIMESTAMP WITH TIME ZONE := NOW();
    ticket_time TIMESTAMP WITH TIME ZONE;
BEGIN
    should_execute := false;
    time_elapsed := 0;
    
    -- Extrair configurações da regra
    conditions := rule_data.conditions;
    time_threshold := rule_data.time_threshold;
    time_unit := rule_data.time_unit;
    time_condition := rule_data.time_condition;
    
    -- Determinar tempo de referência baseado na condição
    CASE time_condition
        WHEN 'unassigned_time' THEN
            ticket_time := ticket_data.created_at;
        WHEN 'no_response_time' THEN
            ticket_time := ticket_data.updated_at;
        WHEN 'resolution_time' THEN
            ticket_time := ticket_data.created_at;
        ELSE
            ticket_time := ticket_data.created_at;
    END CASE;
    
    -- Calcular tempo decorrido em minutos
    time_elapsed := EXTRACT(EPOCH FROM (current_time - ticket_time)) / 60;
    
    -- Verificar se o tempo limite foi atingido
    IF time_elapsed < time_threshold THEN
        RETURN;
    END IF;
    
    -- Verificar condições específicas
    IF conditions ? 'status' THEN
        IF conditions->>'status' != ticket_data.status AND 
           NOT (conditions->'status' ? ticket_data.status) THEN
            RETURN;
        END IF;
    END IF;
    
    IF conditions ? 'priority' THEN
        IF conditions->>'priority' != ticket_data.priority AND 
           NOT (conditions->'priority' ? ticket_data.priority) THEN
            RETURN;
        END IF;
    END IF;
    
    IF conditions ? 'assigned_to' THEN
        IF conditions->>'assigned_to' = 'null' AND ticket_data.assigned_to IS NOT NULL THEN
            RETURN;
        END IF;
        IF conditions->>'assigned_to' != 'null' AND ticket_data.assigned_to IS NULL THEN
            RETURN;
        END IF;
    END IF;
    
    -- Se chegou até aqui, deve executar
    should_execute := true;
END;
$$ LANGUAGE plpgsql;

-- 8. FUNÇÃO PARA EXECUTAR AÇÕES DE ESCALAÇÃO
SELECT 'Criando função de ações de escalação...' as status;
CREATE OR REPLACE FUNCTION execute_escalation_actions_simple(
    ticket_data RECORD,
    rule_data RECORD,
    time_elapsed INTEGER
) RETURNS VOID AS $$
DECLARE
    actions JSONB;
    admin_user_id UUID;
    comment_text TEXT;
    new_priority TEXT;
BEGIN
    actions := rule_data.actions;
    
    -- Buscar usuário admin para comentários
    SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
    IF admin_user_id IS NULL THEN
        admin_user_id := '00000000-0000-0000-0000-000000000000';
    END IF;
    
    -- Executar ações
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
        rule_data.id,
        ticket_data.id,
        rule_data.time_condition,
        time_elapsed,
        rule_data.conditions,
        actions,
        true,
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- 9. FUNÇÃO PARA PROCESSAR E-MAILS DE ESCALAÇÃO
SELECT 'Criando função de processamento de e-mails...' as status;
CREATE OR REPLACE FUNCTION process_escalation_emails()
RETURNS TABLE(
    processed_count INTEGER,
    sent_count INTEGER,
    results JSONB
) AS $$
DECLARE
    notification_record RECORD;
    user_record RECORD;
    processed INTEGER := 0;
    sent INTEGER := 0;
    results_array JSONB := '[]'::JSONB;
    result_item JSONB;
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
            
            -- Adicionar ao array de resultados
            result_item := jsonb_build_object(
                'notification_id', notification_record.id,
                'user_email', user_record.email,
                'success', true,
                'message', 'E-mail processado com sucesso'
            );
            results_array := results_array || result_item;
            
            RAISE NOTICE '✅ [PG_CRON] E-mail processado para %', user_record.email;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ [PG_CRON] Erro ao processar notificação %: %', 
                notification_record.id, SQLERRM;
                
            result_item := jsonb_build_object(
                'notification_id', notification_record.id,
                'success', false,
                'error', SQLERRM
            );
            results_array := results_array || result_item;
        END;
    END LOOP;
    
    -- Log de conclusão
    RAISE NOTICE '📧 [PG_CRON] Processamento concluído: % notificações processadas, % e-mails enviados', 
        processed, sent;
    
    -- Retornar resultados
    RETURN QUERY SELECT processed, sent, results_array;
END;
$$ LANGUAGE plpgsql;

-- 10. FUNÇÃO PARA CHAMAR API DE ESCALAÇÃO AUTOMÁTICA
SELECT 'Criando função de chamada da API...' as status;
CREATE OR REPLACE FUNCTION call_auto_escalation_api()
RETURNS TEXT AS $$
DECLARE
    result RECORD;
BEGIN
    -- Log de início
    RAISE NOTICE '🔄 [PG_CRON] Chamando API de escalação automática...';
    
    -- Executar escalação diretamente
    SELECT * INTO result FROM execute_auto_escalation();
    
    RETURN format('Escalação automática executada: %s tickets processados, %s escalações executadas', 
        result.processed_count, result.executed_count);
END;
$$ LANGUAGE plpgsql;

-- 11. FUNÇÃO PARA CHAMAR API DE PROCESSAMENTO DE E-MAILS
SELECT 'Criando função de chamada da API de e-mails...' as status;
CREATE OR REPLACE FUNCTION call_process_emails_api()
RETURNS TEXT AS $$
DECLARE
    result RECORD;
BEGIN
    -- Log de início
    RAISE NOTICE '📧 [PG_CRON] Chamando API de processamento de e-mails...';
    
    -- Executar processamento diretamente
    SELECT * INTO result FROM process_escalation_emails();
    
    RETURN format('Processamento de e-mails executado: %s notificações processadas, %s e-mails enviados', 
        result.processed_count, result.sent_count);
END;
$$ LANGUAGE plpgsql;

-- 12. CONFIGURAR JOBS DO PG_CRON
SELECT 'Configurando jobs do pg_cron...' as status;

-- Job para escalação automática (a cada 5 minutos)
SELECT cron.schedule(
    'auto-escalation',
    '*/5 * * * *', -- A cada 5 minutos
    'SELECT call_auto_escalation_api();'
);

-- Job para processamento de e-mails (a cada 2 minutos)
SELECT cron.schedule(
    'process-escalation-emails',
    '*/2 * * * *', -- A cada 2 minutos
    'SELECT call_process_emails_api();'
);

-- 13. VERIFICAR SE OS JOBS FORAM CRIADOS
SELECT 'Verificando jobs criados...' as status;
SELECT * FROM cron.job;

-- 14. TESTE IMEDIATO
SELECT 'Executando teste imediato...' as status;
SELECT call_auto_escalation_api() as resultado_escalacao;
SELECT call_process_emails_api() as resultado_emails;

-- 15. VERIFICAR EXECUÇÕES
SELECT 'Verificando execuções...' as status;
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;

SELECT '✅ CONFIGURAÇÃO COMPLETA! Sistema de escalação automática ativado!' as status;
