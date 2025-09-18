#!/bin/bash

echo "🔍 DEBUG COMPLETO DO SISTEMA AUTOMÁTICO DE ESCALAÇÃO"
echo "=================================================="
echo ""

# 1. Verificar status do sistema
echo "📋 1. STATUS DO SISTEMA:"
echo "----------------------"
curl -s -X GET "https://www.ithostbr.tech/api/debug-escalation-complete" | jq '.results.tests | {escalation_rules: (.escalation_rules.success), escalation_logs: (.escalation_logs.success), email_config: (.email_config.success)}'
echo ""

# 2. Verificar configuração das regras
echo "📋 2. CONFIGURAÇÃO DAS REGRAS:"
echo "-----------------------------"
curl -s -X GET "https://www.ithostbr.tech/api/debug-escalation-complete" | jq '.results.tests.escalation_rules.data[] | select(.name == "Escalação - 1h sem atribuição") | {name, time_threshold, time_unit, conditions, actions: {send_email: .actions.send_email_notification, notify: .actions.notify_supervisor}}'
echo ""

# 3. Verificar configuração de e-mail
echo "📋 3. CONFIGURAÇÃO DE E-MAIL:"
echo "----------------------------"
curl -s -X GET "https://www.ithostbr.tech/api/debug-escalation-complete" | jq '.results.tests.email_config.data.value | {from, host, port, secure}'
echo ""

# 4. Executar escalação automática
echo "📋 4. EXECUTANDO ESCALAÇÃO AUTOMÁTICA:"
echo "------------------------------------"
curl -s -X GET "https://www.ithostbr.tech/api/escalation/auto-execute" | jq '.'
echo ""

# 5. Processar e-mails
echo "📋 5. PROCESSANDO E-MAILS:"
echo "-------------------------"
curl -s -X POST "https://www.ithostbr.tech/api/escalation/process-emails" | jq '.'
echo ""

# 6. Verificar logs recentes
echo "📋 6. LOGS DE ESCALAÇÃO RECENTES:"
echo "-------------------------------"
curl -s -X GET "https://www.ithostbr.tech/api/debug-escalation-complete" | jq '.results.tests.escalation_logs.data | sort_by(.triggered_at) | reverse | .[0:3] | .[] | {rule_name: .escalation_rules.name, ticket_id, triggered_at, success}'
echo ""

echo "✅ DEBUG COMPLETO FINALIZADO!"
echo "============================="
