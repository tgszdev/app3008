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

async function analyzeDashboardFilter() {
  console.log('🔍 ANÁLISE DO FILTRO DE CLIENTE NO DASHBOARD')
  console.log('=' .repeat(60))

  try {
    // 1. Verificar usuário rodrigues2205@icloud.com
    console.log('\n1️⃣ VERIFICANDO USUÁRIO RODRIGUES2205@ICLOUD.COM...')
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'rodrigues2205@icloud.com')
      .single()

    if (userError) {
      console.log('❌ Usuário não encontrado:', userError.message)
      return
    }

    console.log('✅ Usuário encontrado:')
    console.log(`  - ID: ${user.id}`)
    console.log(`  - Email: ${user.email}`)
    console.log(`  - User Type: ${user.user_type}`)
    console.log(`  - Context ID: ${user.context_id || 'null'}`)
    console.log(`  - Role: ${user.role}`)

    // 2. Verificar associações do usuário
    console.log('\n2️⃣ ASSOCIAÇÕES DO USUÁRIO...')
    
    const { data: userContexts, error: userContextsError } = await supabase
      .from('user_contexts')
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .eq('user_id', user.id)

    if (userContextsError) {
      console.log('❌ Erro ao buscar associações:', userContextsError.message)
    } else {
      console.log('✅ Associações encontradas:', userContexts.length)
      userContexts.forEach(uc => {
        console.log(`  - ${uc.contexts.name}: ${uc.contexts.type} (${uc.contexts.id})`)
        console.log(`    Can Manage: ${uc.can_manage}`)
      })
    }

    // 3. Verificar todos os contextos disponíveis
    console.log('\n3️⃣ CONTEXTOS DISPONÍVEIS...')
    
    const { data: allContexts, error: allContextsError } = await supabase
      .from('contexts')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (allContextsError) {
      console.log('❌ Erro ao buscar contextos:', allContextsError.message)
    } else {
      console.log('✅ Contextos ativos:', allContexts.length)
      allContexts.forEach(ctx => {
        console.log(`  - ${ctx.name}: ${ctx.type} (${ctx.id})`)
      })
    }

    // 4. Verificar tickets por contexto
    console.log('\n4️⃣ TICKETS POR CONTEXTO...')
    
    for (const context of allContexts) {
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, title, status, priority, created_at')
        .eq('context_id', context.id)
        .order('created_at', { ascending: false })

      if (ticketsError) {
        console.log(`❌ Erro ao buscar tickets de ${context.name}:`, ticketsError.message)
      } else {
        console.log(`✅ ${context.name}: ${tickets.length} tickets`)
        if (tickets.length > 0) {
          tickets.slice(0, 3).forEach(ticket => {
            console.log(`    - ${ticket.title}: ${ticket.status} (${ticket.priority})`)
          })
          if (tickets.length > 3) {
            console.log(`    ... e mais ${tickets.length - 3} tickets`)
          }
        }
      }
    }

    // 5. Verificar tickets do Luft Agro especificamente
    console.log('\n5️⃣ TICKETS DO LUFT AGRO...')
    
    const { data: luftAgro, error: luftAgroError } = await supabase
      .from('contexts')
      .select('*')
      .eq('name', 'Luft Agro')
      .single()

    if (luftAgroError) {
      console.log('❌ Contexto Luft Agro não encontrado:', luftAgroError.message)
    } else {
      console.log('✅ Contexto Luft Agro encontrado:', luftAgro.id)
      
      const { data: luftTickets, error: luftTicketsError } = await supabase
        .from('tickets')
        .select('id, title, status, priority, created_at')
        .eq('context_id', luftAgro.id)
        .order('created_at', { ascending: false })

      if (luftTicketsError) {
        console.log('❌ Erro ao buscar tickets do Luft Agro:', luftTicketsError.message)
      } else {
        console.log('✅ Tickets do Luft Agro:', luftTickets.length)
        luftTickets.forEach(ticket => {
          console.log(`  - ${ticket.title}: ${ticket.status} (${ticket.priority})`)
        })
      }
    }

    // 6. Verificar tickets do contexto "Teste"
    console.log('\n6️⃣ TICKETS DO CONTEXTO "TESTE"...')
    
    const { data: testeContext, error: testeContextError } = await supabase
      .from('contexts')
      .select('*')
      .eq('name', 'Teste ')
      .single()

    if (testeContextError) {
      console.log('❌ Contexto Teste não encontrado:', testeContextError.message)
    } else {
      console.log('✅ Contexto Teste encontrado:', testeContext.id)
      
      const { data: testeTickets, error: testeTicketsError } = await supabase
        .from('tickets')
        .select('id, title, status, priority, created_at')
        .eq('context_id', testeContext.id)
        .order('created_at', { ascending: false })

      if (testeTicketsError) {
        console.log('❌ Erro ao buscar tickets do Teste:', testeTicketsError.message)
      } else {
        console.log('✅ Tickets do Teste:', testeTickets.length)
        testeTickets.forEach(ticket => {
          console.log(`  - ${ticket.title}: ${ticket.status} (${ticket.priority})`)
        })
      }
    }

    // 7. Verificar estatísticas por contexto
    console.log('\n7️⃣ ESTATÍSTICAS POR CONTEXTO...')
    
    for (const context of allContexts) {
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('status')
        .eq('context_id', context.id)

      if (ticketsError) {
        console.log(`❌ Erro ao buscar estatísticas de ${context.name}:`, ticketsError.message)
      } else {
        const statusCounts = {}
        tickets.forEach(ticket => {
          statusCounts[ticket.status] = (statusCounts[ticket.status] || 0) + 1
        })
        
        console.log(`✅ ${context.name}:`)
        console.log(`    Total: ${tickets.length} tickets`)
        Object.entries(statusCounts).forEach(([status, count]) => {
          console.log(`    - ${status}: ${count}`)
        })
      }
    }

    // 8. Testar API do dashboard
    console.log('\n8️⃣ TESTANDO API DO DASHBOARD...')
    
    try {
      // Testar API de estatísticas
      const statsResponse = await fetch('https://www.ithostbr.tech/api/dashboard/stats')
      const statsData = await statsResponse.json()
      
      if (statsResponse.ok) {
        console.log('✅ API de estatísticas funcionando')
        console.log('📊 Dados retornados:', Object.keys(statsData))
      } else {
        console.log('❌ API de estatísticas com erro:', statsResponse.status, statsData)
      }

      // Testar API de analytics
      const analyticsResponse = await fetch('https://www.ithostbr.tech/api/dashboard/analytics')
      const analyticsData = await analyticsResponse.json()
      
      if (analyticsResponse.ok) {
        console.log('✅ API de analytics funcionando')
        console.log('📊 Dados retornados:', Object.keys(analyticsData))
      } else {
        console.log('❌ API de analytics com erro:', analyticsResponse.status, analyticsData)
      }

    } catch (error) {
      console.log('❌ Erro ao testar APIs:', error.message)
    }

    // 9. Diagnóstico final
    console.log('\n9️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO:')
    console.log(`  - Usuário: ${user.email}`)
    console.log(`  - User Type: ${user.user_type}`)
    console.log(`  - Associações: ${userContexts?.length || 0}`)
    console.log(`  - Contextos disponíveis: ${allContexts?.length || 0}`)
    
    // Verificar se o usuário tem acesso aos contextos corretos
    const accessibleContexts = userContexts?.map(uc => uc.contexts.name) || []
    console.log(`  - Contextos acessíveis: ${accessibleContexts.join(', ')}`)
    
    // Verificar se há tickets nos contextos acessíveis
    let totalTickets = 0
    for (const uc of userContexts || []) {
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id')
        .eq('context_id', uc.context_id)
      
      totalTickets += tickets?.length || 0
    }
    
    console.log(`  - Total de tickets acessíveis: ${totalTickets}`)

    if (userContexts && userContexts.length > 0) {
      console.log('\n✅ USUÁRIO TEM ASSOCIAÇÕES CORRETAS')
      console.log('O problema pode estar no frontend do dashboard ou na lógica de filtro.')
    } else {
      console.log('\n❌ USUÁRIO NÃO TEM ASSOCIAÇÕES')
      console.log('O usuário precisa ser associado aos contextos para ver os dados.')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

analyzeDashboardFilter()
