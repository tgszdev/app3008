#!/bin/bash

echo "🔍 VERIFICADOR DE TICKET ESPECÍFICO"
echo "=================================="
echo ""

# Função para verificar ticket
check_ticket() {
    local ticket_id=$1
    echo "📋 Verificando ticket: $ticket_id"
    echo "--------------------------------"
    
    # Testar escalação manual
    echo "🧪 Testando escalação manual:"
    curl -s -X POST "https://www.ithostbr.tech/api/test-escalation" \
         -H "Content-Type: application/json" \
         -d "{\"ticket_id\": \"$ticket_id\"}" | jq '.'
    echo ""
    
    # Verificar logs
    echo "📋 Verificando logs de escalação:"
    curl -s -X GET "https://www.ithostbr.tech/api/debug-escalation-complete" | \
         jq ".results.tests.escalation_logs.data[] | select(.ticket_id == \"$ticket_id\") | {rule_name: .escalation_rules.name, triggered_at, success}"
    echo ""
}

# Função para listar tickets recentes
list_recent_tickets() {
    echo "📋 TICKETS RECENTES:"
    echo "-------------------"
    curl -s -X GET "https://www.ithostbr.tech/api/debug-escalation-complete" | \
         jq '.results.tests.tickets.data | sort_by(.created_at) | reverse | .[0:5] | .[] | {id, title, status, priority, assigned_to, created_at}'
    echo ""
}

# Função para executar escalação automática
run_auto_escalation() {
    echo "🚨 EXECUTANDO ESCALAÇÃO AUTOMÁTICA:"
    echo "----------------------------------"
    curl -s -X GET "https://www.ithostbr.tech/api/escalation/auto-execute" | jq '.'
    echo ""
}

# Função para processar e-mails
process_emails() {
    echo "📧 PROCESSANDO E-MAILS:"
    echo "----------------------"
    curl -s -X POST "https://www.ithostbr.tech/api/escalation/process-emails" | jq '.'
    echo ""
}

echo "🎯 INICIANDO VERIFICAÇÃO..."
echo ""

# Listar tickets recentes
list_recent_tickets

# Executar escalação automática
run_auto_escalation

# Processar e-mails
process_emails

echo "✅ VERIFICAÇÃO FINALIZADA!"
echo "=========================="
echo ""
echo "💡 DICAS:"
echo "1. Se não há tickets recentes, o ticket pode não ter sido criado"
echo "2. Se há tickets mas não são escalados, verifique as condições"
echo "3. Se há escalação mas não há e-mails, verifique as notificações"
echo ""
echo "🔧 PARA TESTAR MANUALMENTE:"
echo "curl -X POST \"https://www.ithostbr.tech/api/test-escalation\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"ticket_id\": \"SEU_TICKET_ID\"}'"
