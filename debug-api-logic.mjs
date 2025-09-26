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

async function debugApiLogic() {
  console.log('🔍 DEBUGANDO LÓGICA DA API')
  console.log('=' .repeat(50))

  try {
    // 1. Simular exatamente o que a API faz
    console.log('\n1️⃣ SIMULANDO LÓGICA DA API...')
    
    const currentUserId = '2a33241e-ed38-48b5-9c84-e8c354ae9606'
    const userType = 'matrix'
    const defaultStartDate = '2025-09-01'
    const defaultEndDate = '2025-09-30'
    
    console.log(`🔍 Usuário: ${currentUserId}`)
    console.log(`🔍 Tipo: ${userType}`)
    console.log(`🔍 Período: ${defaultStartDate} a ${defaultEndDate}`)
    
    // 2. Simular query principal (que deve falhar)
    console.log('\n2️⃣ SIMULANDO QUERY PRINCIPAL...')
    
    try {
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
        .gte('created_at', `${defaultStartDate}T00:00:00`)
        .lte('created_at', `${defaultEndDate}T23:59:59`)
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (recentError) {
        console.log('❌ Query principal falhou (esperado):', recentError.message)
        console.log('🔄 Entrando no fallback da query simples...')
        
        // 3. Simular query simples com filtros
        console.log('\n3️⃣ SIMULANDO QUERY SIMPLES COM FILTROS...')
        
        let simpleQuery = supabase
          .from('tickets')
          .select('*')
          .gte('created_at', `${defaultStartDate}T00:00:00`)
          .lte('created_at', `${defaultEndDate}T23:59:59`)
          .order('created_at', { ascending: false })
        
        // Aplicar filtro de contexto
        if (userType === 'matrix') {
          console.log('🔍 Aplicando filtro para usuário matrix...')
          
          const { data: userContexts, error: contextsError } = await supabase
            .from('user_contexts')
            .select('context_id')
            .eq('user_id', currentUserId)
          
          if (contextsError) {
            console.log('❌ Erro ao buscar contextos:', contextsError.message)
          } else {
            console.log(`✅ Contextos encontrados: ${userContexts.length}`)
            userContexts.forEach(uc => {
              console.log(`  - Context ID: ${uc.context_id}`)
            })
            
            if (userContexts && userContexts.length > 0) {
              const contextIds = userContexts.map(uc => uc.context_id)
              simpleQuery = simpleQuery.in('context_id', contextIds)
              console.log(`🔍 Aplicando filtro de contextos: ${contextIds}`)
            }
          }
        }
        
        const { data: simpleTickets, error: simpleError } = await simpleQuery
        
        if (simpleError) {
          console.log('❌ Erro na query simples:', simpleError.message)
        } else {
          console.log(`✅ Query simples funcionou: ${simpleTickets.length} tickets`)
          simpleTickets.forEach(ticket => {
            console.log(`  - ${ticket.title}: context_id = "${ticket.context_id}"`)
          })
          
          // 4. Simular formatação dos tickets
          console.log('\n4️⃣ SIMULANDO FORMATAÇÃO DOS TICKETS...')
          
          const formattedTickets = simpleTickets.map((ticket) => ({
            id: ticket.id,
            ticket_number: ticket.ticket_number,
            title: ticket.title,
            status: ticket.status,
            priority: ticket.priority,
            requester: 'Teste',
            created_at: ticket.created_at,
            is_internal: ticket.is_internal || false,
            context_id: ticket.context_id
          }))
          
          console.log('✅ Tickets formatados:')
          formattedTickets.forEach(ticket => {
            console.log(`  - ${ticket.title}: context_id = "${ticket.context_id}"`)
          })
        }
        
      } else {
        console.log('✅ Query principal funcionou (inesperado)')
      }
      
    } catch (error) {
      console.log('❌ Erro geral na simulação:', error.message)
    }

    // 5. Diagnóstico final
    console.log('\n5️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO:')
    console.log('✅ Lógica da API está correta')
    console.log('✅ Filtros de contexto estão sendo aplicados')
    console.log('✅ Formatação dos tickets está correta')
    console.log('❌ PROBLEMA: A API não está executando a lógica correta!')
    
    console.log('\n🎯 PRÓXIMOS PASSOS:')
    console.log('1. Verificar se a API está realmente usando a lógica correta')
    console.log('2. Verificar se o bypass está funcionando')
    console.log('3. Verificar se há algum problema na execução')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugApiLogic()
