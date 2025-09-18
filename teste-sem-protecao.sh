#!/bin/bash

echo "🧪 TESTE SEM PROTEÇÃO DE RE-ESCALAÇÃO"
echo "===================================="
echo ""

TICKET_ID="de8d0ed1-ae83-4c73-80e6-a4c6c5a380a9"

echo "📋 Testando ticket: $TICKET_ID"
echo ""

# Função para testar escalação manual
test_manual_escalation() {
    echo "🧪 TESTE 1: Escalação manual"
    echo "---------------------------"
    curl -s -X POST "https://www.ithostbr.tech/api/test-escalation" \
         -H "Content-Type: application/json" \
         -d "{\"ticket_id\": \"$TICKET_ID\"}" | jq '.'
    echo ""
}

# Função para processar e-mails
process_emails() {
    echo "📧 PROCESSANDO E-MAILS:"
    echo "----------------------"
    curl -s -X POST "https://www.ithostbr.tech/api/escalation/process-emails" | jq '.'
    echo ""
}

# Função para verificar logs
check_logs() {
    echo "📋 LOGS DE ESCALAÇÃO PARA ESTE TICKET:"
    echo "-------------------------------------"
    curl -s -X GET "https://www.ithostbr.tech/api/debug-escalation-complete" | \
         jq ".results.tests.escalation_logs.data[] | select(.ticket_id == \"$TICKET_ID\") | {rule_name: .escalation_rules.name, triggered_at, success}" | \
         sort -k3
    echo ""
}

# Função para verificar notificações
check_notifications() {
    echo "📧 NOTIFICAÇÕES PARA ESTE TICKET:"
    echo "--------------------------------"
    curl -s -X GET "https://www.ithostbr.tech/api/debug-escalation-complete" | \
         jq ".results.tests.notifications.data[] | select(.data.ticket_id == \"$TICKET_ID\") | {id, type, title, is_read, created_at}"
    echo ""
}

echo "🎯 INICIANDO TESTES..."
echo ""

# Teste 1: Escalação manual
test_manual_escalation

# Processar e-mails
process_emails

# Verificar logs
check_logs

# Verificar notificações
check_notifications

echo "✅ TESTES FINALIZADOS!"
echo "====================="
echo ""
echo "💡 EXPLICAÇÃO:"
echo "O sistema tem proteção contra re-escalação por 30 minutos."
echo "Se o ticket foi escalado às 22:47, só pode ser escalado novamente às 23:17."
echo ""
echo "⏰ PRÓXIMA ESCALAÇÃO POSSÍVEL:"
echo "Timestamp da última escalação: 2025-09-18T22:47:55.643+00:00"
echo "Próxima escalação possível: 2025-09-18T23:17:55.643+00:00"
echo ""
echo "🔄 PARA TESTAR NOVAMENTE:"
echo "Aguarde até 23:17 ou crie um novo ticket."
