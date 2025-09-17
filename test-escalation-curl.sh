#!/bin/bash

# Script simples para testar escalação
# Uso: ./test-escalation-curl.sh

echo "🧪 Testando sistema de escalação..."
echo ""

# URL base da API
API_URL="https://www.ithostbr.tech"

# 1. Verificar regras de escalação
echo "1️⃣ Verificando regras de escalação..."
echo "curl -s '$API_URL/api/escalation'"
echo ""

RULES=$(curl -s "$API_URL/api/escalation")
echo "Resposta:"
echo "$RULES" | jq '.' 2>/dev/null || echo "$RULES"
echo ""

# 2. Listar alguns tickets para teste
echo "2️⃣ Listando tickets recentes..."
echo "curl -s '$API_URL/api/tickets' | head -5"
echo ""

TICKETS=$(curl -s "$API_URL/api/tickets" | head -20)
echo "Resposta (primeiros tickets):"
echo "$TICKETS" | jq '.[0:3] | .[] | {id, title, status, priority, created_at}' 2>/dev/null || echo "$TICKETS"
echo ""

# 3. Instruções para teste manual
echo "3️⃣ Para testar escalação manualmente:"
echo ""
echo "   a) Pegue um ID de ticket da lista acima"
echo "   b) Execute:"
echo "      curl -X POST '$API_URL/api/escalation/execute' \\"
echo "           -H 'Content-Type: application/json' \\"
echo "           -d '{\"ticket_id\":\"SEU_TICKET_ID_AQUI\",\"force_execution\":true}'"
echo ""
echo "   c) Ou use o script:"
echo "      ./test-escalation-api.sh SEU_TICKET_ID_AQUI"
echo ""

echo "🎉 Script de verificação concluído!"
