#!/bin/bash

echo "🌍 DIAGNÓSTICO DE FUSO HORÁRIO"
echo "=============================="
echo ""

# Função para verificar hora local
check_local_time() {
    echo "🕐 HORA LOCAL (SISTEMA):"
    echo "----------------------"
    echo "Data/Hora: $(date)"
    echo "Timezone: $(date +%Z)"
    echo "UTC Offset: $(date +%z)"
    echo ""
}

# Função para verificar hora do Supabase
check_supabase_time() {
    echo "🕐 HORA DO SUPABASE (API):"
    echo "-------------------------"
    curl -s -X GET "https://www.ithostbr.tech/api/debug-escalation-complete" | \
         jq -r '.results.timestamp' | \
         xargs -I {} date -d "{}" 2>/dev/null || echo "Erro ao converter timestamp"
    echo ""
}

# Função para verificar hora do Vercel
check_vercel_time() {
    echo "🕐 HORA DO VERCEL (SERVIDOR):"
    echo "----------------------------"
    echo "Timestamp UTC: $(curl -s -X GET "https://www.ithostbr.tech/api/debug-escalation-complete" | jq -r '.results.timestamp')"
    echo ""
}

# Função para verificar tickets recentes
check_recent_tickets() {
    echo "📋 TICKETS RECENTES (TIMESTAMPS):"
    echo "--------------------------------"
    curl -s -X GET "https://www.ithostbr.tech/api/debug-escalation-complete" | \
         jq '.results.tests.eligible_tickets.data[] | select(.id == "de8d0ed1-ae83-4c73-80e6-a4c6c5a380a9") | {id, title, created_at, minutes_ago}'
    echo ""
}

# Função para verificar logs de escalação
check_escalation_logs() {
    echo "📋 LOGS DE ESCALAÇÃO (TIMESTAMPS):"
    echo "---------------------------------"
    curl -s -X GET "https://www.ithostbr.tech/api/debug-escalation-complete" | \
         jq '.results.tests.escalation_logs.data[] | select(.ticket_id == "de8d0ed1-ae83-4c73-80e6-a4c6c5a380a9") | {rule_name: .escalation_rules.name, triggered_at, success}'
    echo ""
}

echo "🎯 INICIANDO DIAGNÓSTICO..."
echo ""

# Verificar hora local
check_local_time

# Verificar hora do Supabase
check_supabase_time

# Verificar hora do Vercel
check_vercel_time

# Verificar tickets recentes
check_recent_tickets

# Verificar logs de escalação
check_escalation_logs

echo "✅ DIAGNÓSTICO FINALIZADO!"
echo "=========================="
echo ""
echo "💡 POSSÍVEIS CAUSAS:"
echo "1. Supabase configurado em UTC (correto)"
echo "2. Vercel servidor em UTC (correto)"
echo "3. Cliente local em -03 (Brasil)"
echo "4. Tickets sendo criados com timestamp futuro"
echo ""
echo "🔧 SOLUÇÕES:"
echo "1. Verificar configuração de timezone no Supabase"
echo "2. Verificar configuração de timezone no Vercel"
echo "3. Ajustar código para usar timezone local"
echo "4. Verificar se há problema de sincronização"
