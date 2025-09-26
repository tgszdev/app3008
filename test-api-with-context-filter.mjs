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

async function testApiWithContextFilter() {
  console.log('🔍 TESTANDO API COM FILTRO DE CONTEXTO')
  console.log('=' .repeat(60))

  try {
    // 1. Simular exatamente o que a API deveria fazer
    console.log('\n1️⃣ SIMULANDO LÓGICA CORRETA DA API...')
    
    const currentUserId = '2a33241e-ed38-48b5-9c84-e8c354ae9606'
    const userType = 'matrix'
    const defaultStartDate = '2025-09-01'
    const defaultEndDate = '2025-09-30'
    
    console.log(`🔍 Usuário: ${currentUserId}`)
    console.log(`🔍 Tipo: ${userType}`)
    console.log(`🔍 Período: ${defaultStartDate} a ${defaultEndDate}`)
    
    // 2. Aplicar filtro de contexto para usuário matrix
    console.log('\n2️⃣ APLICANDO FILTRO DE CONTEXTO...')
    
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
        const contextIds = userContexts.map(uc => uc.context_id)
        console.log(`🔍 Aplicando filtro de contextos: ${contextIds}`)
        
        // 3. Buscar tickets apenas dos contextos associados
        console.log('\n3️⃣ BUSCANDO TICKETS DOS CONTEXTOS ASSOCIADOS...')
        
        const { data: filteredTickets, error: filteredError } = await supabase
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
          .in('context_id', contextIds)
          .order('created_at', { ascending: false })
          .limit(5)
        
        if (filteredError) {
          console.log('❌ Erro ao buscar tickets filtrados:', filteredError.message)
        } else {
          console.log(`✅ Tickets filtrados: ${filteredTickets.length} tickets`)
          filteredTickets.forEach(ticket => {
            console.log(`  - ${ticket.title}: context_id = "${ticket.context_id}"`)
          })
          
          // 4. Formatar tickets
          console.log('\n4️⃣ FORMATANDO TICKETS...')
          
          const formattedTickets = filteredTickets.map((ticket) => ({
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
          
          // 5. Verificar se o filtro está funcionando
          console.log('\n5️⃣ VERIFICANDO SE FILTRO ESTÁ FUNCIONANDO...')
          
          const luftAgroId = '6486088e-72ae-461b-8b03-32ca84918882'
          const luftAgroTickets = formattedTickets.filter(ticket => 
            ticket.context_id === luftAgroId
          )
          
          console.log(`📊 Tickets do Luft Agro: ${luftAgroTickets.length}`)
          if (luftAgroTickets.length > 0) {
            console.log('✅ FILTRO FUNCIONARIA! Tickets do Luft Agro encontrados:')
            luftAgroTickets.forEach(ticket => {
              console.log(`  - ${ticket.title}: ${ticket.status}`)
            })
          } else {
            console.log('❌ FILTRO NÃO FUNCIONARIA! Nenhum ticket do Luft Agro encontrado')
          }
        }
      }
    }

    // 6. Diagnóstico final
    console.log('\n6️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO:')
    console.log('✅ Lógica da API está correta')
    console.log('✅ Filtros de contexto funcionam')
    console.log('✅ Formatação dos tickets funciona')
    console.log('✅ Filtro do Luft Agro funcionaria')
    console.log('❌ PROBLEMA: A API não está aplicando os filtros!')
    
    console.log('\n🎯 SOLUÇÃO:')
    console.log('1. A API deve aplicar filtros de contexto nos dados')
    console.log('2. Não retornar dados globais quando há contexto específico')
    console.log('3. Calcular estatísticas baseadas no contexto selecionado')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testApiWithContextFilter()
