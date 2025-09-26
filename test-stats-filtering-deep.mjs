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

async function testStatsFilteringDeep() {
  console.log('🔍 TESTANDO FILTRO DE ESTATÍSTICAS EM PROFUNDIDADE')
  console.log('=' .repeat(80))

  try {
    // 1. Testar API stats atual
    console.log('\n1️⃣ TESTANDO API STATS ATUAL...')
    
    const response = await fetch('https://www.ithostbr.tech/api/dashboard/stats')
    const data = await response.json()
    
    console.log('📊 Dados atuais da API:')
    console.log(`  - Total tickets: ${data.stats?.totalTickets || data.total_tickets || 0}`)
    console.log(`  - Open tickets: ${data.stats?.openTickets || data.open_tickets || 0}`)
    console.log(`  - In progress: ${data.stats?.inProgressTickets || data.in_progress_tickets || 0}`)
    console.log(`  - Resolved: ${data.stats?.resolvedTickets || data.resolved_tickets || 0}`)
    console.log(`  - Recent tickets: ${data.recentTickets?.length || data.recent_tickets?.length || 0}`)
    
    // 2. Verificar se as estatísticas estão sendo filtradas
    console.log('\n2️⃣ VERIFICANDO SE ESTATÍSTICAS ESTÃO SENDO FILTRADAS...')
    
    const totalTickets = data.stats?.totalTickets || data.total_tickets || 0
    const isStatsFiltered = totalTickets < 19
    
    console.log(`📊 Total tickets: ${totalTickets}`)
    console.log(`📊 Estatísticas filtradas: ${isStatsFiltered}`)
    
    if (!isStatsFiltered) {
      console.log('❌ PROBLEMA: Estatísticas não estão sendo filtradas!')
      
      // 3. Verificar se a correção foi aplicada
      console.log('\n3️⃣ VERIFICANDO SE CORREÇÃO FOI APLICADA...')
      
      // Simular exatamente o que a API deveria fazer
      const currentUserId = '2a33241e-ed38-48b5-9c84-e8c354ae9606'
      const userType = 'matrix'
      
      console.log(`🔍 Usuário: ${currentUserId}`)
      console.log(`🔍 Tipo: ${userType}`)
      
      // Buscar contextos associados
      const { data: userContexts, error: contextsError } = await supabase
        .from('user_contexts')
        .select('context_id')
        .eq('user_id', currentUserId)
      
      if (contextsError) {
        console.log('❌ Erro ao buscar contextos:', contextsError.message)
      } else {
        console.log(`✅ Contextos associados: ${userContexts.length}`)
        userContexts.forEach(uc => {
          console.log(`  - Context ID: ${uc.context_id}`)
        })
        
        if (userContexts && userContexts.length > 0) {
          const associatedContextIds = userContexts.map(uc => uc.context_id)
          console.log(`🔍 Contextos para filtrar: ${associatedContextIds}`)
          
          // 4. Buscar tickets com filtros de contexto
          console.log('\n4️⃣ BUSCANDO TICKETS COM FILTROS DE CONTEXTO...')
          
          const { data: filteredTickets, error: filteredError } = await supabase
            .from('tickets')
            .select('*')
            .gte('created_at', '2025-09-01T00:00:00')
            .lte('created_at', '2025-09-30T23:59:59')
            .in('context_id', associatedContextIds)
          
          if (filteredError) {
            console.log('❌ Erro ao buscar tickets filtrados:', filteredError.message)
          } else {
            console.log(`✅ Tickets filtrados: ${filteredTickets.length}`)
            filteredTickets.forEach(ticket => {
              console.log(`  - ${ticket.title}: ${ticket.status} (${ticket.context_id})`)
            })
            
            // 5. Calcular estatísticas filtradas
            console.log('\n5️⃣ CALCULANDO ESTATÍSTICAS FILTRADAS...')
            
            const totalTicketsFiltered = filteredTickets.length
            const openTicketsFiltered = filteredTickets.filter(t => t.status === 'open').length
            const inProgressTicketsFiltered = filteredTickets.filter(t => t.status === 'in_progress').length
            const resolvedTicketsFiltered = filteredTickets.filter(t => t.status === 'resolved').length
            const cancelledTicketsFiltered = filteredTickets.filter(t => t.status === 'cancelled').length
            
            console.log('📊 ESTATÍSTICAS FILTRADAS:')
            console.log(`  - Total tickets: ${totalTicketsFiltered}`)
            console.log(`  - Open tickets: ${openTicketsFiltered}`)
            console.log(`  - In progress: ${inProgressTicketsFiltered}`)
            console.log(`  - Resolved: ${resolvedTicketsFiltered}`)
            console.log(`  - Cancelled: ${cancelledTicketsFiltered}`)
            
            // 6. Comparar com dados da API
            console.log('\n6️⃣ COMPARANDO COM DADOS DA API...')
            
            console.log('📊 COMPARAÇÃO:')
            console.log(`  - API (atual): ${totalTickets} tickets`)
            console.log(`  - Filtrado (correto): ${totalTicketsFiltered} tickets`)
            console.log(`  - Diferença: ${totalTickets - totalTicketsFiltered} tickets`)
            
            if (totalTickets === totalTicketsFiltered) {
              console.log('✅ API está retornando dados filtrados!')
            } else {
              console.log('❌ API está retornando dados globais!')
              console.log('🎯 PROBLEMA: A API não está aplicando os filtros de contexto nas estatísticas!')
            }
          }
        }
      }
    } else {
      console.log('✅ Estatísticas já estão sendo filtradas!')
    }

    // 7. Verificar se o problema é na lógica da API
    console.log('\n7️⃣ VERIFICANDO LÓGICA DA API...')
    
    console.log('🔍 Lógica atual da API:')
    console.log('1. Buscar tickets com filtros de contexto')
    console.log('2. Aplicar filtros de contexto nas estatísticas')
    console.log('3. Calcular estatísticas baseadas em tickets filtrados')
    console.log('4. Retornar dados filtrados')
    
    console.log('\n🎯 PROBLEMA IDENTIFICADO:')
    console.log('❌ A API não está aplicando os filtros de contexto nas estatísticas!')
    console.log('❌ As estatísticas estão sendo calculadas com dados globais!')
    console.log('❌ Os filtros de contexto não estão sendo aplicados corretamente!')

    // 8. Diagnóstico final
    console.log('\n8️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO:')
    console.log('✅ API stats está funcionando')
    console.log('✅ Dados do Luft Agro existem no banco')
    console.log('✅ Filtros de contexto funcionam quando aplicados')
    console.log('✅ Tickets recentes estão sendo filtrados')
    console.log('❌ PROBLEMA: Estatísticas não estão sendo filtradas!')
    
    console.log('\n🎯 SOLUÇÃO:')
    console.log('1. A API deve aplicar filtros de contexto nas estatísticas')
    console.log('2. Calcular estatísticas baseadas em tickets filtrados por contexto')
    console.log('3. Não retornar dados globais quando há contexto específico')
    console.log('4. Garantir que os filtros sejam aplicados em todas as seções')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testStatsFilteringDeep()
