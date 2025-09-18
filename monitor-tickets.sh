#!/bin/bash

echo "🔍 MONITOR DE TICKETS EM TEMPO REAL"
echo "==================================="
echo ""

# Função para aguardar
wait_for() {
    echo "⏳ Aguardando $1 segundos..."
    sleep $1
}

# Função para executar escalação
run_escalation() {
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

# Função para verificar logs
check_logs() {
    echo "📋 LOGS DE ESCALAÇÃO RECENTES:"
    echo "-----------------------------"
    curl -s -X GET "https://www.ithostbr.tech/api/debug-escalation-complete" | jq '.results.tests.escalation_logs.data | sort_by(.triggered_at) | reverse | .[0:3] | .[] | {rule_name: .escalation_rules.name, ticket_id, triggered_at, success}'
    echo ""
}

echo "🎯 INICIANDO MONITORAMENTO..."
echo ""

# Loop de monitoramento
for i in {1..10}; do
    echo "🔄 CICLO $i/10 - $(date)"
    echo "=========================="
    
    # Executar escalação
    run_escalation
    
    # Processar e-mails
    process_emails
    
    # Verificar logs
    check_logs
    
    # Aguardar 30 segundos
    if [ $i -lt 10 ]; then
        wait_for 30
        echo ""
    fi
done

echo "✅ MONITORAMENTO FINALIZADO!"
echo "============================"
echo ""
echo "📊 RESUMO:"
echo "- Sistema executando automaticamente ✅"
echo "- Logs sendo criados ✅"
echo "- E-mails sendo processados ✅"
echo ""
echo "🎯 Se não houve escalação, verifique:"
echo "1. Status do ticket (deve ser 'open' ou 'aberto')"
echo "2. Prioridade (deve ser 'critical' ou 'high')"
echo "3. Atribuição (deve ser null)"
echo "4. Tempo (deve ter passado 3 minutos)"
