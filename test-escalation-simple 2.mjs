#!/usr/bin/env node

// Script simples para testar escalação via API
import fetch from 'node-fetch'

// Configurações
const API_BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'
const TICKET_ID = process.argv[2] // ID do ticket como parâmetro

async function testEscalation() {
  console.log('🧪 Testando sistema de escalação via API...\n')

  if (!TICKET_ID) {
    console.log('❌ Uso: node test-escalation-simple.mjs <TICKET_ID>')
    console.log('   Exemplo: node test-escalation-simple.mjs 123e4567-e89b-12d3-a456-426614174000')
    return
  }

  try {
    // 1. Verificar se o ticket existe
    console.log(`1️⃣ Verificando ticket #${TICKET_ID}...`)
    
    const ticketResponse = await fetch(`${API_BASE_URL}/api/tickets?id=${TICKET_ID}`)
    if (!ticketResponse.ok) {
      console.error(`❌ Erro ao buscar ticket: ${ticketResponse.status} ${ticketResponse.statusText}`)
      return
    }
    
    const tickets = await ticketResponse.json()
    if (!tickets || tickets.length === 0) {
      console.error(`❌ Ticket #${TICKET_ID} não encontrado`)
      return
    }
    
    const ticket = tickets[0]
    console.log(`✅ Ticket encontrado:`)
    console.log(`   Título: ${ticket.title}`)
    console.log(`   Status: ${ticket.status}`)
    console.log(`   Prioridade: ${ticket.priority}`)
    console.log(`   Criado em: ${new Date(ticket.created_at).toLocaleString('pt-BR')}`)
    console.log(`   Atribuído para: ${ticket.assigned_to_user?.name || 'Não atribuído'}`)
    
    // Calcular tempo decorrido
    const now = new Date()
    const createdAt = new Date(ticket.created_at)
    const timeElapsed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60)) // em minutos
    console.log(`   Tempo decorrido: ${timeElapsed} minutos (${Math.floor(timeElapsed / 60)}h ${timeElapsed % 60}m)`)

    // 2. Verificar regras de escalação
    console.log('\n2️⃣ Verificando regras de escalação...')
    
    const rulesResponse = await fetch(`${API_BASE_URL}/api/escalation`)
    if (!rulesResponse.ok) {
      console.error(`❌ Erro ao buscar regras: ${rulesResponse.status} ${rulesResponse.statusText}`)
      return
    }
    
    const rules = await rulesResponse.json()
    console.log(`✅ Encontradas ${rules?.length || 0} regras de escalação`)
    
    if (rules && rules.length > 0) {
      rules.forEach((rule, index) => {
        console.log(`   ${index + 1}. ${rule.name} (${rule.time_threshold} ${rule.time_unit})`)
        console.log(`      Condições: ${JSON.stringify(rule.conditions)}`)
        console.log(`      Ações: ${JSON.stringify(rule.actions)}`)
      })
    } else {
      console.log('⚠️ Nenhuma regra de escalação encontrada!')
      console.log('   Crie regras em /dashboard/settings → Escalação por Tempo')
      return
    }

    // 3. Executar escalação manualmente
    console.log('\n3️⃣ Executando escalação manualmente...')
    
    const escalationResponse = await fetch(`${API_BASE_URL}/api/escalation/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticket_id: TICKET_ID,
        force_execution: true
      })
    })
    
    if (!escalationResponse.ok) {
      console.error(`❌ Erro ao executar escalação: ${escalationResponse.status} ${escalationResponse.statusText}`)
      const errorText = await escalationResponse.text()
      console.error(`   Detalhes: ${errorText}`)
      return
    }
    
    const result = await escalationResponse.json()
    console.log(`✅ Escalação executada!`)
    console.log(`   Resultado:`, JSON.stringify(result, null, 2))

    // 4. Verificar logs de escalação
    console.log('\n4️⃣ Verificando logs de escalação...')
    
    // Buscar logs via Supabase diretamente (simplificado)
    console.log('   📋 Logs de escalação podem ser verificados no banco de dados')
    console.log('   Tabela: escalation_logs')

    console.log('\n🎉 Teste de escalação concluído!')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar teste
testEscalation()
  .then(() => {
    console.log('\n✅ Script concluído')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Erro fatal:', error.message)
    process.exit(1)
  })
