#!/bin/bash

# Script para testar execução automática de escalação
# Simula o que um cron job faria

echo "🔄 Testando execução automática de escalação..."
echo "⏰ Timestamp: $(date)"
echo ""

# Fazer chamada para a API de execução automática
echo "📡 Fazendo chamada para API..."
curl -X POST "https://www.ithostbr.tech/api/escalation/auto-execute" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Test-Auto-Escalation/1.0" \
  -w "\n\n⏱️  Tempo total: %{time_total}s\n" \
  -s

echo ""
echo "✅ Teste concluído!"
