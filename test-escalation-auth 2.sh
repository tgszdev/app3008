#!/bin/bash

# Script para testar escalação com autenticação
# Uso: ./test-escalation-auth.sh

echo "🧪 Testando sistema de escalação com autenticação..."
echo ""

# URL base da API
API_URL="https://www.ithostbr.tech"

echo "⚠️ As APIs requerem autenticação. Vamos testar de outras formas:"
echo ""

echo "1️⃣ Verificando se o sistema está funcionando..."
echo "   Testando endpoint público:"
HEALTH=$(curl -s -w "\n%{http_code}" "$API_URL/api/test")
HTTP_CODE=$(echo "$HEALTH" | tail -n1)
HEALTH_DATA=$(echo "$HEALTH" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Sistema está funcionando (HTTP $HTTP_CODE)"
    echo "$HEALTH_DATA" | jq '.' 2>/dev/null || echo "$HEALTH_DATA"
else
    echo "   ❌ Sistema com problemas (HTTP $HTTP_CODE)"
    echo "$HEALTH_DATA"
fi
echo ""

echo "2️⃣ Verificando se as tabelas de escalação existem..."
echo "   (Isso requer acesso ao banco de dados)"
echo ""

echo "3️⃣ Formas de testar a escalação:"
echo ""
echo "   📱 MÉTODO 1 - Via Interface Web:"
echo "   1. Acesse: https://www.ithostbr.tech/dashboard/settings"
echo "   2. Vá em 'Escalação por Tempo'"
echo "   3. Crie uma regra de escalação"
echo "   4. Crie um novo ticket"
echo "   5. Aguarde o tempo configurado"
echo "   6. Verifique se a escalação executou"
echo ""

echo "   🔧 MÉTODO 2 - Via Supabase Dashboard:"
echo "   1. Acesse o Supabase Dashboard"
echo "   2. Vá em SQL Editor"
echo "   3. Execute:"
echo "      SELECT * FROM escalation_rules WHERE is_active = true;"
echo "   4. Execute:"
echo "      SELECT * FROM escalation_logs ORDER BY triggered_at DESC LIMIT 10;"
echo ""

echo "   🧪 MÉTODO 3 - Teste Manual:"
echo "   1. Crie um ticket com prioridade alta"
echo "   2. Configure uma regra de escalação para 1 minuto"
echo "   3. Aguarde 1 minuto"
echo "   4. Verifique se:"
echo "      - Comentário foi adicionado"
echo "      - Email foi enviado"
echo "      - Prioridade foi aumentada"
echo ""

echo "   📊 MÉTODO 4 - Verificar Logs:"
echo "   1. Acesse o Vercel Dashboard"
echo "   2. Vá em Functions → Logs"
echo "   3. Procure por:"
echo "      - 'Executando escalação para ticket'"
echo "      - 'Email enviado com sucesso'"
echo "      - 'Comentário adicionado'"
echo ""

echo "4️⃣ Comandos SQL para verificar:"
echo ""
echo "   -- Verificar regras de escalação:"
echo "   SELECT id, name, time_threshold, time_unit, is_active FROM escalation_rules;"
echo ""
echo "   -- Verificar logs de escalação:"
echo "   SELECT * FROM escalation_logs ORDER BY triggered_at DESC LIMIT 5;"
echo ""
echo "   -- Verificar tickets recentes:"
echo "   SELECT id, title, status, priority, created_at FROM tickets ORDER BY created_at DESC LIMIT 5;"
echo ""

echo "🎉 Instruções de teste fornecidas!"
echo ""
echo "💡 DICA: O mais fácil é testar via interface web criando um ticket e uma regra de escalação."
