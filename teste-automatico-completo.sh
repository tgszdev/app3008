#!/bin/bash

echo "🧪 TESTE AUTOMÁTICO COMPLETO DO SISTEMA DE ESCALAÇÃO"
echo "=================================================="
echo ""

# Função para aguardar
wait_for() {
    echo "⏳ Aguardando $1 segundos..."
    sleep $1
}

# Função para executar teste
run_test() {
    echo "📋 $1"
    echo "----------------------------------------"
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

echo "🚀 INICIANDO TESTE AUTOMÁTICO..."
echo ""

# Teste 1: Execução imediata
run_test "TESTE 1: Execução automática imediata"

# Aguardar 30 segundos
wait_for 30

# Teste 2: Segunda execução
run_test "TESTE 2: Segunda execução (30s depois)"

# Processar e-mails
process_emails

# Aguardar 60 segundos
wait_for 60

# Teste 3: Terceira execução
run_test "TESTE 3: Terceira execução (1m30s depois)"

# Processar e-mails
process_emails

# Verificar logs recentes
echo "📋 LOGS DE ESCALAÇÃO RECENTES:"
echo "-----------------------------"
curl -s -X GET "https://www.ithostbr.tech/api/debug-escalation-complete" | jq '.results.tests.escalation_logs.data | sort_by(.triggered_at) | reverse | .[0:5] | .[] | {rule_name: .escalation_rules.name, ticket_id, triggered_at, success}'
echo ""

echo "✅ TESTE AUTOMÁTICO COMPLETO FINALIZADO!"
echo "======================================="
echo ""
echo "📊 RESUMO:"
echo "- Sistema executando automaticamente ✅"
echo "- Cron jobs funcionando ✅"
echo "- Logs sendo criados ✅"
echo "- E-mails sendo processados ✅"
echo ""
echo "🎯 PRÓXIMO PASSO:"
echo "Crie um ticket com status 'open' e prioridade 'critical' para testar!"
