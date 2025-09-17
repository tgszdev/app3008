#!/bin/bash

# Script para testar escalação via API usando curl
# Uso: ./test-escalation-api.sh <TICKET_ID>

TICKET_ID=$1
API_BASE_URL=${NEXTAUTH_URL:-"http://localhost:3000"}

if [ -z "$TICKET_ID" ]; then
    echo "❌ Uso: $0 <TICKET_ID>"
    echo "   Exemplo: $0 123e4567-e89b-12d3-a456-426614174000"
    exit 1
fi

echo "🧪 Testando sistema de escalação via API..."
echo "   API Base: $API_BASE_URL"
echo "   Ticket ID: $TICKET_ID"
echo ""

# 1. Verificar se o ticket existe
echo "1️⃣ Verificando ticket #$TICKET_ID..."
TICKET_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE_URL/api/tickets?id=$TICKET_ID")
HTTP_CODE=$(echo "$TICKET_RESPONSE" | tail -n1)
TICKET_DATA=$(echo "$TICKET_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ Erro ao buscar ticket: HTTP $HTTP_CODE"
    echo "$TICKET_DATA"
    exit 1
fi

echo "✅ Ticket encontrado"
echo "$TICKET_DATA" | jq -r '.[0] | "   Título: \(.title)\n   Status: \(.status)\n   Prioridade: \(.priority)\n   Criado em: \(.created_at)\n   Atribuído para: \(.assigned_to_user.name // "Não atribuído")"'

# 2. Verificar regras de escalação
echo ""
echo "2️⃣ Verificando regras de escalação..."
RULES_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE_URL/api/escalation")
HTTP_CODE=$(echo "$RULES_RESPONSE" | tail -n1)
RULES_DATA=$(echo "$RULES_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ Erro ao buscar regras: HTTP $HTTP_CODE"
    echo "$RULES_DATA"
    exit 1
fi

RULES_COUNT=$(echo "$RULES_DATA" | jq '. | length')
echo "✅ Encontradas $RULES_COUNT regras de escalação"

if [ "$RULES_COUNT" -gt 0 ]; then
    echo "$RULES_DATA" | jq -r '.[] | "   - \(.name) (\(.time_threshold) \(.time_unit))"'
else
    echo "⚠️ Nenhuma regra de escalação encontrada!"
    echo "   Crie regras em /dashboard/settings → Escalação por Tempo"
    exit 1
fi

# 3. Executar escalação manualmente
echo ""
echo "3️⃣ Executando escalação manualmente..."
ESCALATION_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "{\"ticket_id\":\"$TICKET_ID\",\"force_execution\":true}" \
    "$API_BASE_URL/api/escalation/execute")

HTTP_CODE=$(echo "$ESCALATION_RESPONSE" | tail -n1)
ESCALATION_DATA=$(echo "$ESCALATION_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ Erro ao executar escalação: HTTP $HTTP_CODE"
    echo "$ESCALATION_DATA"
    exit 1
fi

echo "✅ Escalação executada!"
echo "$ESCALATION_DATA" | jq '.'

echo ""
echo "🎉 Teste de escalação concluído!"
