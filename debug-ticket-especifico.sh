#!/bin/bash

echo "🔍 DEBUG ESPECÍFICO DO TICKET"
echo "============================="
echo ""

TICKET_ID="de8d0ed1-ae83-4c73-80e6-a4c6c5a380a9"

echo "📋 Testando ticket: $TICKET_ID"
echo ""

# Função para verificar ticket específico
check_specific_ticket() {
    echo "🔍 VERIFICANDO TICKET ESPECÍFICO:"
    echo "--------------------------------"
    
    # Testar escalação manual
    echo "🧪 Escalação manual:"
    curl -s -X POST "https://www.ithostbr.tech/api/test-escalation" \
         -H "Content-Type: application/json" \
         -d "{\"ticket_id\": \"$TICKET_ID\"}" | jq '.'
    echo ""
    
    # Verificar logs
    echo "📋 Logs de escalação:"
    curl -s -X GET "https://www.ithostbr.tech/api/debug-escalation-complete" | \
         jq ".results.tests.escalation_logs.data[] | select(.ticket_id == \"$TICKET_ID\") | {rule_name: .escalation_rules.name, triggered_at, success}"
    echo ""
}

# Função para verificar tickets recentes
check_recent_tickets() {
    echo "📋 TICKETS RECENTES (SEM FILTROS):"
    echo "---------------------------------"
    
    # Verificar tickets elegíveis
    echo "🎯 Tickets elegíveis para escalação:"
    curl -s -X GET "https://www.ithostbr.tech/api/debug-escalation-complete" | \
         jq '.results.tests.eligible_tickets.data[] | {id, title, status, priority, assigned_to, minutes_ago}'
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

echo "🎯 INICIANDO DEBUG ESPECÍFICO..."
echo ""

# Verificar ticket específico
check_specific_ticket

# Verificar tickets recentes
check_recent_tickets

# Executar escalação automática
run_auto_escalation

# Processar e-mails
process_emails

echo "✅ DEBUG ESPECÍFICO FINALIZADO!"
echo "==============================="
echo ""
echo "💡 POSSÍVEIS CAUSAS:"
echo "1. Ticket não tem prioridade 'critical'"
echo "2. Ticket está atribuído a alguém"
echo "3. Ticket não tem status correto"
echo "4. Sistema de proteção ainda ativo"
echo ""
echo "🔧 PARA VERIFICAR:"
echo "Acesse o sistema e verifique:"
echo "- Status do ticket"
echo "- Prioridade do ticket"
echo "- Se está atribuído"
echo "- Quando foi criado"
