#!/usr/bin/env node

import axios from 'axios'

async function testApiSatisfaction() {
  console.log('🔍 Testando API de satisfação diretamente...\n')

  try {
    // Testar a API multi-client-analytics
    const response = await axios.get('https://www.ithostbr.tech/api/dashboard/multi-client-analytics', {
      params: {
        context_ids: '6486088e-72ae-461b-8b03-32ca84918882,18031594-558a-4f45-847c-b1d2b58087f0,85879bd8-d1d1-416b-ae55-e564687af28b',
        start_date: '2025-09-09',
        end_date: '2025-10-09'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log('📊 Status da resposta:', response.status)
    console.log('📊 Dados da API:')
    console.log('  - Total de tickets:', response.data.consolidated?.total_tickets)
    console.log('  - Taxa de satisfação:', response.data.consolidated?.performance_metrics?.satisfactionRate)
    console.log('  - Taxa de resolução:', response.data.consolidated?.performance_metrics?.resolutionRate)
    console.log('  - Tempo médio de resolução:', response.data.consolidated?.avg_resolution_time)
    
    console.log('\n📊 Detalhes dos clientes:')
    response.data.clients?.forEach((client, index) => {
      console.log(`  ${index + 1}. ${client.context.name}: ${client.tickets.length} tickets`)
    })

    console.log('\n✅ Teste concluído!')

  } catch (error) {
    console.error('❌ Erro ao testar API:', error.response?.status, error.response?.data || error.message)
  }
}

// Executar teste
testApiSatisfaction()

