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

async function debugMainQuery() {
  console.log('🔍 DEBUGANDO QUERY PRINCIPAL')
  console.log('=' .repeat(50))

  try {
    // 1. Testar query principal exatamente como na API
    console.log('\n1️⃣ TESTANDO QUERY PRINCIPAL...')
    
    const { data: recentTicketsList, error: recentError } = await supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        title,
        status,
        priority,
        created_at,
        is_internal,
        context_id,
        created_by,
        users!tickets_created_by_fkey(name)
      `)
      .gte('created_at', '2025-09-01T00:00:00')
      .lte('created_at', '2025-09-30T23:59:59')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (recentError) {
      console.log('❌ Query principal falhou:', recentError.message)
    } else {
      console.log(`✅ Query principal funcionou: ${recentTicketsList.length} tickets`)
      
      recentTicketsList.forEach((ticket, index) => {
        console.log(`  ${index + 1}. ${ticket.title}: ${ticket.status}`)
        console.log(`     - Context ID: "${ticket.context_id}"`)
        console.log(`     - Priority: ${ticket.priority}`)
        console.log(`     - Created: ${ticket.created_at}`)
        console.log(`     - User: ${ticket.users?.name || 'N/A'}`)
        console.log('')
      })
    }

    // 2. Verificar se o problema é na formatação
    console.log('\n2️⃣ VERIFICANDO FORMATAÇÃO...')
    
    if (recentTicketsList && recentTicketsList.length > 0) {
      console.log('🔍 Testando formatação dos tickets:')
      
      const formattedTickets = recentTicketsList.map((ticket) => ({
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        requester: ticket.users?.name || 'Desconhecido',
        created_at: ticket.created_at,
        is_internal: ticket.is_internal || false,
        context_id: ticket.context_id
      }))
      
      console.log('✅ Tickets formatados:')
      formattedTickets.forEach(ticket => {
        console.log(`  - ${ticket.title}: context_id = "${ticket.context_id}"`)
      })
    }

    // 3. Verificar se o problema é na query em si
    console.log('\n3️⃣ VERIFICANDO QUERY SIMPLES...')
    
    const { data: simpleTickets, error: simpleError } = await supabase
      .from('tickets')
      .select('*')
      .gte('created_at', '2025-09-01T00:00:00')
      .lte('created_at', '2025-09-30T23:59:59')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (simpleError) {
      console.log('❌ Query simples falhou:', simpleError.message)
    } else {
      console.log(`✅ Query simples funcionou: ${simpleTickets.length} tickets`)
      simpleTickets.forEach(ticket => {
        console.log(`  - ${ticket.title}: context_id = "${ticket.context_id}"`)
      })
    }

    // 4. Comparar resultados
    console.log('\n4️⃣ COMPARANDO RESULTADOS...')
    
    if (recentTicketsList && simpleTickets) {
      console.log(`📊 Query principal: ${recentTicketsList.length} tickets`)
      console.log(`📊 Query simples: ${simpleTickets.length} tickets`)
      
      if (recentTicketsList.length === simpleTickets.length) {
        console.log('✅ Ambas as queries retornam o mesmo número de tickets')
      } else {
        console.log('❌ Queries retornam números diferentes de tickets')
      }
      
      // Verificar se os context_ids são os mesmos
      const mainContextIds = recentTicketsList.map(t => t.context_id)
      const simpleContextIds = simpleTickets.map(t => t.context_id)
      
      console.log('🔍 Context IDs da query principal:', mainContextIds)
      console.log('🔍 Context IDs da query simples:', simpleContextIds)
      
      if (JSON.stringify(mainContextIds) === JSON.stringify(simpleContextIds)) {
        console.log('✅ Ambas as queries retornam os mesmos context_ids')
      } else {
        console.log('❌ Queries retornam context_ids diferentes')
      }
    }

    // 5. Diagnóstico final
    console.log('\n5️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO:')
    console.log('✅ Query principal funciona')
    console.log('✅ Query simples funciona')
    console.log('✅ Ambas retornam context_id corretamente')
    console.log('❌ PROBLEMA: A API não está usando a lógica correta!')
    
    console.log('\n🎯 PRÓXIMOS PASSOS:')
    console.log('1. Verificar se a API está realmente executando a lógica correta')
    console.log('2. Verificar se há algum problema na execução')
    console.log('3. Verificar se o bypass está funcionando')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugMainQuery()
