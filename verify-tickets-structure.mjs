#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyTicketsStructure() {
  console.log('🔍 VERIFICANDO ESTRUTURA E DADOS DOS TICKETS')
  console.log('=' .repeat(60))

  try {
    // 1. Verificar estrutura da tabela tickets
    console.log('\n1️⃣ VERIFICANDO ESTRUTURA DA TABELA TICKETS...')
    
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .limit(5)

    if (ticketsError) {
      console.log('❌ Erro ao buscar tickets:', ticketsError.message)
      return
    }

    if (tickets && tickets.length > 0) {
      console.log('✅ Estrutura da tabela tickets:')
      const sampleTicket = tickets[0]
      console.log('📋 Campos disponíveis:', Object.keys(sampleTicket))
      
      console.log('\n📊 Exemplo de ticket:')
      console.log(`  - ID: ${sampleTicket.id}`)
      console.log(`  - Título: ${sampleTicket.title}`)
      console.log(`  - Status: ${sampleTicket.status}`)
      console.log(`  - Prioridade: ${sampleTicket.priority}`)
      console.log(`  - Context ID: ${sampleTicket.context_id}`)
      console.log(`  - Created At: ${sampleTicket.created_at}`)
      console.log(`  - Created By: ${sampleTicket.created_by}`)
      console.log(`  - Is Internal: ${sampleTicket.is_internal}`)
    }

    // 2. Verificar tickets por contexto
    console.log('\n2️⃣ VERIFICANDO TICKETS POR CONTEXTO...')
    
    const { data: contexts, error: contextsError } = await supabase
      .from('contexts')
      .select('id, name, type')
      .order('name')

    if (contextsError) {
      console.log('❌ Erro ao buscar contextos:', contextsError.message)
    } else {
      console.log('✅ Contextos encontrados:', contexts.length)
      
      for (const context of contexts) {
        const { data: contextTickets, error: contextTicketsError } = await supabase
          .from('tickets')
          .select('id, title, status, priority, created_at')
          .eq('context_id', context.id)
          .order('created_at', { ascending: false })

        if (contextTicketsError) {
          console.log(`❌ Erro ao buscar tickets de ${context.name}:`, contextTicketsError.message)
        } else {
          console.log(`📊 ${context.name} (${context.type}): ${contextTickets.length} tickets`)
          
          if (contextTickets.length > 0) {
            contextTickets.slice(0, 3).forEach(ticket => {
              console.log(`    - ${ticket.title}: ${ticket.status} (${ticket.priority})`)
            })
            if (contextTickets.length > 3) {
              console.log(`    ... e mais ${contextTickets.length - 3} tickets`)
            }
          }
        }
      }
    }

    // 3. Verificar tickets do Luft Agro especificamente
    console.log('\n3️⃣ VERIFICANDO TICKETS DO LUFT AGRO...')
    
    const luftAgroId = '6486088e-72ae-461b-8b03-32ca84918882'
    const { data: luftTickets, error: luftError } = await supabase
      .from('tickets')
      .select('*')
      .eq('context_id', luftAgroId)
      .order('created_at', { ascending: false })

    if (luftError) {
      console.log('❌ Erro ao buscar tickets do Luft Agro:', luftError.message)
    } else {
      console.log('✅ Tickets do Luft Agro:', luftTickets.length)
      
      if (luftTickets.length > 0) {
        luftTickets.forEach(ticket => {
          console.log(`  - ${ticket.title}: ${ticket.status} (${ticket.priority})`)
          console.log(`    ID: ${ticket.id}`)
          console.log(`    Context ID: ${ticket.context_id}`)
          console.log(`    Created: ${ticket.created_at}`)
          console.log(`    Created By: ${ticket.created_by}`)
          console.log(`    Is Internal: ${ticket.is_internal}`)
          console.log('')
        })
      }
    }

    // 4. Verificar tickets do Teste
    console.log('\n4️⃣ VERIFICANDO TICKETS DO TESTE...')
    
    const testeId = 'a7791594-c44d-47aa-8ddd-97ecfb6cc8ed'
    const { data: testeTickets, error: testeError } = await supabase
      .from('tickets')
      .select('*')
      .eq('context_id', testeId)
      .order('created_at', { ascending: false })

    if (testeError) {
      console.log('❌ Erro ao buscar tickets do Teste:', testeError.message)
    } else {
      console.log('✅ Tickets do Teste:', testeTickets.length)
      
      if (testeTickets.length > 0) {
        testeTickets.forEach(ticket => {
          console.log(`  - ${ticket.title}: ${ticket.status} (${ticket.priority})`)
          console.log(`    ID: ${ticket.id}`)
          console.log(`    Context ID: ${ticket.context_id}`)
          console.log(`    Created: ${ticket.created_at}`)
          console.log(`    Created By: ${ticket.created_by}`)
          console.log(`    Is Internal: ${ticket.is_internal}`)
          console.log('')
        })
      }
    }

    // 5. Verificar tickets sem contexto
    console.log('\n5️⃣ VERIFICANDO TICKETS SEM CONTEXTO...')
    
    const { data: noContextTickets, error: noContextError } = await supabase
      .from('tickets')
      .select('id, title, status, context_id, created_at')
      .is('context_id', null)
      .order('created_at', { ascending: false })

    if (noContextError) {
      console.log('❌ Erro ao buscar tickets sem contexto:', noContextError.message)
    } else {
      console.log('✅ Tickets sem contexto:', noContextTickets.length)
      
      if (noContextTickets.length > 0) {
        noContextTickets.slice(0, 5).forEach(ticket => {
          console.log(`  - ${ticket.title}: ${ticket.status} (Context: ${ticket.context_id})`)
        })
      }
    }

    // 6. Verificar distribuição por status
    console.log('\n6️⃣ VERIFICANDO DISTRIBUIÇÃO POR STATUS...')
    
    const { data: statusDistribution, error: statusError } = await supabase
      .from('tickets')
      .select('status')
      .not('context_id', 'is', null)

    if (statusError) {
      console.log('❌ Erro ao buscar distribuição por status:', statusError.message)
    } else {
      const statusCounts = {}
      statusDistribution.forEach(ticket => {
        statusCounts[ticket.status] = (statusCounts[ticket.status] || 0) + 1
      })
      
      console.log('✅ Distribuição por status:')
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count} tickets`)
      })
    }

    // 7. Verificar tickets do período atual (setembro 2025)
    console.log('\n7️⃣ VERIFICANDO TICKETS DO PERÍODO ATUAL...')
    
    const startDate = '2025-09-01T00:00:00'
    const endDate = '2025-09-30T23:59:59'
    
    const { data: periodTickets, error: periodError } = await supabase
      .from('tickets')
      .select('id, title, status, context_id, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })

    if (periodError) {
      console.log('❌ Erro ao buscar tickets do período:', periodError.message)
    } else {
      console.log(`✅ Tickets do período (${startDate} a ${endDate}):`, periodTickets.length)
      
      if (periodTickets.length > 0) {
        periodTickets.slice(0, 10).forEach(ticket => {
          console.log(`  - ${ticket.title}: ${ticket.status} (Context: ${ticket.context_id})`)
        })
      }
    }

    // 8. Diagnóstico final
    console.log('\n8️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO DA VERIFICAÇÃO:')
    console.log('✅ Estrutura da tabela tickets verificada')
    console.log('✅ Tickets por contexto verificados')
    console.log('✅ Tickets do Luft Agro verificados')
    console.log('✅ Tickets do Teste verificados')
    console.log('✅ Tickets sem contexto verificados')
    console.log('✅ Distribuição por status verificada')
    console.log('✅ Tickets do período atual verificados')
    
    console.log('\n🎯 POSSÍVEIS PROBLEMAS:')
    console.log('1. Tickets sem context_id podem causar problemas no filtro')
    console.log('2. Status inconsistentes podem afetar as estatísticas')
    console.log('3. Datas fora do período podem não aparecer no filtro')
    console.log('4. Tickets internos podem estar sendo filtrados incorretamente')
    
    console.log('\n🔧 RECOMENDAÇÕES:')
    console.log('1. Verificar se todos os tickets têm context_id válido')
    console.log('2. Verificar se os status estão padronizados')
    console.log('3. Verificar se as datas estão no formato correto')
    console.log('4. Verificar se o filtro está considerando todos os campos necessários')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

verifyTicketsStructure()
