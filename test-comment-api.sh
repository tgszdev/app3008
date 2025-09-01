#!/bin/bash

# Script para testar a API de comentários diretamente
# Uso: ./test-comment-api.sh <ticket_id> <user_id> <auth_token>

TICKET_ID=${1:-"seu-ticket-id-aqui"}
USER_ID=${2:-"seu-user-id-aqui"}
AUTH_TOKEN=${3:-"seu-token-aqui"}
API_URL="https://app3008-two.vercel.app/api/tickets/comments"

echo "Testando API de comentários..."
echo "Ticket ID: $TICKET_ID"
echo "User ID: $USER_ID"
echo ""

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$AUTH_TOKEN" \
  -d '{
    "ticket_id": "'$TICKET_ID'",
    "user_id": "'$USER_ID'",
    "content": "Teste de comentário via API para verificar notificações - '"$(date)"'"
  }' \
  -v

echo ""
echo "Teste concluído. Verifique:"
echo "1. Os logs do servidor no Vercel"
echo "2. Sua caixa de email"
echo "3. As notificações in-app no sino"