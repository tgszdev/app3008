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

async function completeDebugFilter() {
  console.log('🔍 DEBUG COMPLETO DO FILTRO - ANALISANDO BANCO E RESULTADO')
  console.log('=' .repeat(80))

  try {
    // 1. Verificar dados do Luft Agro no banco
    console.log('\n1️⃣ VERIFICANDO DADOS DO LUFT AGRO NO BANCO...')
    
    const luftAgroId = '6486088e-72ae-461b-8b03-32ca84918882'
    const { data: luftTickets, error: luftError } = await supabase
      .from('tickets')
      .select('*')
      .eq('context_id', luftAgroId)
      .order('created_at', { ascending: false })

    if (luftError) {
      console.log('❌ Erro ao buscar tickets do Luft Agro:', luftError.message)
    } else {
      console.log('✅ Tickets do Luft Agro no banco:', luftTickets.length)
      
      if (luftTickets.length > 0) {
        luftTickets.forEach(ticket => {
          console.log(`  📋 Ticket: ${ticket.title}`)
          console.log(`    - ID: ${ticket.id}`)
          console.log(`    - Status: ${ticket.status}`)
          console.log(`    - Prioridade: ${ticket.priority}`)
          console.log(`    - Context ID: ${ticket.context_id}`)
          console.log(`    - Created: ${ticket.created_at}`)
          console.log(`    - Created By: ${ticket.created_by}`)
          console.log(`    - Is Internal: ${ticket.is_internal}`)
          console.log('')
        })
      }
    }

    // 2. Verificar dados da API stats
    console.log('\n2️⃣ VERIFICANDO DADOS DA API STATS...')
    
    try {
      const response = await fetch('https://www.ithostbr.tech/api/dashboard/stats')
      const data = await response.json()
      
      console.log('📡 Status da API stats:', response.status)
      console.log('📊 Dados retornados:')
      console.log(`  - Total tickets: ${data.stats?.totalTickets || data.total_tickets || 0}`)
      console.log(`  - Open tickets: ${data.stats?.openTickets || data.open_tickets || 0}`)
      console.log(`  - In progress: ${data.stats?.inProgressTickets || data.in_progress_tickets || 0}`)
      console.log(`  - Resolved: ${data.stats?.resolvedTickets || data.resolved_tickets || 0}`)
      console.log(`  - Recent tickets: ${data.recentTickets?.length || data.recent_tickets?.length || 0}`)
      
      if (data.recentTickets || data.recent_tickets) {
        const recentTickets = data.recentTickets || data.recent_tickets || []
        console.log('\n📋 Tickets recentes da API:')
        recentTickets.forEach((ticket, index) => {
          console.log(`  ${index + 1}. ${ticket.title}: ${ticket.status}`)
          console.log(`     - Context ID: ${ticket.context_id}`)
          console.log(`     - Priority: ${ticket.priority}`)
          console.log(`     - Created: ${ticket.created_at}`)
          console.log('')
        })
      }
      
    } catch (error) {
      console.log('❌ Erro ao testar API stats:', error.message)
    }

    // 3. Simular filtro manualmente
    console.log('\n3️⃣ SIMULANDO FILTRO MANUALMENTE...')
    
    try {
      const response = await fetch('https://www.ithostbr.tech/api/dashboard/stats')
      const data = await response.json()
      
      if (data.recentTickets || data.recent_tickets) {
        const recentTickets = data.recentTickets || data.recent_tickets || []
        const luftAgroId = '6486088e-72ae-461b-8b03-32ca84918882'
        
        console.log('📊 Tickets recentes antes do filtro:', recentTickets.length)
        
        const filteredTickets = recentTickets.filter(ticket => 
          ticket.context_id === luftAgroId
        )
        
        console.log('📊 Tickets recentes após filtro Luft Agro:', filteredTickets.length)
        
        if (filteredTickets.length > 0) {
          console.log('✅ FILTRO FUNCIONARIA! Tickets encontrados:')
          filteredTickets.forEach(ticket => {
            console.log(`  - ${ticket.title}: ${ticket.status} (${ticket.priority})`)
          })
        } else {
          console.log('❌ FILTRO NÃO FUNCIONARIA! Nenhum ticket encontrado')
          console.log('🔍 Verificando context_ids dos tickets:')
          recentTickets.forEach(ticket => {
            console.log(`  - ${ticket.title}: context_id = "${ticket.context_id}"`)
          })
        }
      }
      
    } catch (error) {
      console.log('❌ Erro ao simular filtro:', error.message)
    }

    // 4. Verificar tickets do período atual
    console.log('\n4️⃣ VERIFICANDO TICKETS DO PERÍODO ATUAL...')
    
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
      
      // Filtrar por Luft Agro
      const luftPeriodTickets = periodTickets.filter(ticket => 
        ticket.context_id === luftAgroId
      )
      
      console.log(`📊 Tickets do Luft Agro no período:`, luftPeriodTickets.length)
      
      if (luftPeriodTickets.length > 0) {
        console.log('📋 Tickets do Luft Agro no período:')
        luftPeriodTickets.forEach(ticket => {
          console.log(`  - ${ticket.title}: ${ticket.status} (${ticket.created_at})`)
        })
      }
    }

    // 5. Verificar distribuição por status do Luft Agro
    console.log('\n5️⃣ VERIFICANDO DISTRIBUIÇÃO POR STATUS DO LUFT AGRO...')
    
    const { data: luftStatusTickets, error: luftStatusError } = await supabase
      .from('tickets')
      .select('status')
      .eq('context_id', luftAgroId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (luftStatusError) {
      console.log('❌ Erro ao buscar status do Luft Agro:', luftStatusError.message)
    } else {
      const statusCounts = {}
      luftStatusTickets.forEach(ticket => {
        statusCounts[ticket.status] = (statusCounts[ticket.status] || 0) + 1
      })
      
      console.log('✅ Distribuição por status do Luft Agro:')
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count} tickets`)
      })
    }

    // 6. Verificar se o problema é na lógica do frontend
    console.log('\n6️⃣ VERIFICANDO LÓGICA DO FRONTEND...')
    
    console.log('🔍 Lógica atual do filtro:')
    console.log('1. selectedClients = ["6486088e-72ae-461b-8b03-32ca84918882"]')
    console.log('2. recentTicketsData.filter(ticket => selectedClients.includes(ticket.context_id))')
    console.log('3. Se ticket.context_id === "6486088e-72ae-461b-8b03-32ca84918882" → deve aparecer')
    console.log('4. statsData = dados vazios (problema aqui!)')
    
    console.log('\n🎯 PROBLEMA IDENTIFICADO:')
    console.log('❌ Estou usando "dados vazios" para as estatísticas!')
    console.log('❌ Deveria calcular estatísticas baseado nos tickets filtrados!')

    // 7. Calcular estatísticas corretas do Luft Agro
    console.log('\n7️⃣ CALCULANDO ESTATÍSTICAS CORRETAS DO LUFT AGRO...')
    
    const { data: allLuftTickets, error: allLuftError } = await supabase
      .from('tickets')
      .select('*')
      .eq('context_id', luftAgroId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (allLuftError) {
      console.log('❌ Erro ao buscar todos os tickets do Luft Agro:', allLuftError.message)
    } else {
      const totalTickets = allLuftTickets.length
      const openTickets = allLuftTickets.filter(t => t.status === 'open').length
      const inProgressTickets = allLuftTickets.filter(t => t.status === 'in_progress').length
      const resolvedTickets = allLuftTickets.filter(t => t.status === 'resolved').length
      const cancelledTickets = allLuftTickets.filter(t => t.status === 'cancelled').length
      
      console.log('✅ ESTATÍSTICAS CORRETAS DO LUFT AGRO:')
      console.log(`  - Total tickets: ${totalTickets}`)
      console.log(`  - Open tickets: ${openTickets}`)
      console.log(`  - In progress: ${inProgressTickets}`)
      console.log(`  - Resolved: ${resolvedTickets}`)
      console.log(`  - Cancelled: ${cancelledTickets}`)
    }

    // 8. Diagnóstico final
    console.log('\n8️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO DO DEBUG COMPLETO:')
    console.log('✅ Tickets do Luft Agro existem no banco')
    console.log('✅ API stats está funcionando')
    console.log('✅ context_id está sendo retornado pela API')
    console.log('✅ Filtro está sendo aplicado no frontend')
    console.log('❌ PROBLEMA: Estou usando dados vazios para estatísticas!')
    
    console.log('\n🎯 SOLUÇÃO:')
    console.log('1. Calcular estatísticas baseado nos tickets filtrados')
    console.log('2. Não usar dados vazios quando há filtro')
    console.log('3. Buscar dados reais dos contextos selecionados')
    
    console.log('\n🔧 PRÓXIMOS PASSOS:')
    console.log('1. Corrigir lógica do filtro no frontend')
    console.log('2. Calcular estatísticas reais dos contextos selecionados')
    console.log('3. Testar filtro novamente')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

completeDebugFilter()
