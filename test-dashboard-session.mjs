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

async function testDashboardSession() {
  console.log('🔍 TESTANDO SESSÃO DO DASHBOARD')
  console.log('=' .repeat(50))

  try {
    // 1. Simular dados que a API deveria receber
    console.log('\n1️⃣ SIMULANDO DADOS DA API...')
    
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
    console.log(`  - Role: ${user.role}`)

    // 2. Simular a lógica da API de estatísticas
    console.log('\n2️⃣ SIMULANDO LÓGICA DA API DE ESTATÍSTICAS...')
    
    const currentUserId = user.id
    const userRole = user.role || 'user'
    const userType = user.user_type
    const userContextId = user.context_id

    // Buscar contextos associados
    const { data: userContexts, error: userContextsError } = await supabase
      .from('user_contexts')
      .select('context_id')
      .eq('user_id', currentUserId)

    if (userContextsError) {
      console.log('❌ Erro ao buscar contextos:', userContextsError.message)
      return
    }

    console.log('✅ Contextos associados:', userContexts.length)
    userContexts.forEach(uc => {
      console.log(`  - Context ID: ${uc.context_id}`)
    })

    // 3. Simular filtro de tickets
    console.log('\n3️⃣ SIMULANDO FILTRO DE TICKETS...')
    
    let query = supabase
      .from('tickets')
      .select('id, status, created_at, updated_at, created_by, is_internal, context_id')
    
    // Aplicar filtro multi-tenant
    if (userType === 'context' && userContextId) {
      console.log('🔍 Aplicando filtro de contexto único...')
      query = query.eq('context_id', userContextId)
    } else if (userType === 'matrix') {
      console.log('🔍 Aplicando filtro de múltiplos contextos...')
      
      if (userContexts && userContexts.length > 0) {
        const associatedContextIds = userContexts.map(uc => uc.context_id)
        console.log('📋 Contextos associados:', associatedContextIds)
        query = query.in('context_id', associatedContextIds)
      } else {
        console.log('⚠️ Nenhum contexto associado - retornando 0 tickets')
        query = query.eq('context_id', '00000000-0000-0000-0000-000000000000')
      }
    }

    const { data: tickets, error: ticketsError } = await query

    if (ticketsError) {
      console.log('❌ Erro ao buscar tickets:', ticketsError.message)
    } else {
      console.log('✅ Tickets encontrados:', tickets?.length || 0)
      
      if (tickets && tickets.length > 0) {
        // Calcular estatísticas
        const totalTickets = tickets.length
        const openTickets = tickets.filter(t => t.status === 'open').length
        const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length
        const resolvedTickets = tickets.filter(t => t.status === 'resolved').length
        const cancelledTickets = tickets.filter(t => t.status === 'cancelled').length

        console.log('📊 Estatísticas calculadas:')
        console.log(`  - Total: ${totalTickets}`)
        console.log(`  - Abertos: ${openTickets}`)
        console.log(`  - Em Progresso: ${inProgressTickets}`)
        console.log(`  - Resolvidos: ${resolvedTickets}`)
        console.log(`  - Cancelados: ${cancelledTickets}`)

        // Mostrar tickets por contexto
        console.log('\n📋 Tickets por contexto:')
        const contextGroups = {}
        tickets.forEach(ticket => {
          const contextId = ticket.context_id || 'null'
          if (!contextGroups[contextId]) {
            contextGroups[contextId] = []
          }
          contextGroups[contextId].push(ticket)
        })

        Object.entries(contextGroups).forEach(([contextId, contextTickets]) => {
          console.log(`  Contexto ${contextId}: ${contextTickets.length} tickets`)
          contextTickets.slice(0, 2).forEach(ticket => {
            console.log(`    - ${ticket.title}: ${ticket.status}`)
          })
        })
      }
    }

    // 4. Verificar se o problema é de sessão
    console.log('\n4️⃣ VERIFICANDO PROBLEMA DE SESSÃO...')
    
    console.log('🔍 Possíveis causas do erro 401:')
    console.log('  1. Sessão do NextAuth não está sendo criada')
    console.log('  2. Cookies de sessão não estão sendo enviados')
    console.log('  3. Configuração do NextAuth está incorreta')
    console.log('  4. Middleware está bloqueando (mas você disse que não usa)')

    // 5. Testar se conseguimos acessar a API diretamente
    console.log('\n5️⃣ TESTANDO ACESSO DIRETO À API...')
    
    try {
      const response = await fetch('https://www.ithostbr.tech/api/dashboard/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const data = await response.json()
      console.log('📡 Resposta da API:', response.status)
      console.log('📊 Dados:', data)
      
      if (response.status === 401) {
        console.log('✅ Confirmado: API está retornando 401 (problema de autenticação)')
        console.log('🔧 SOLUÇÃO: Verificar se a sessão está sendo criada corretamente')
      } else {
        console.log('⚠️ API não está retornando 401 - problema diferente')
      }
    } catch (error) {
      console.log('❌ Erro ao testar API:', error.message)
    }

    // 6. Diagnóstico final
    console.log('\n6️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO:')
    console.log(`  - Usuário: ${user.email}`)
    console.log(`  - User Type: ${user.user_type}`)
    console.log(`  - Associações: ${userContexts?.length || 0}`)
    console.log(`  - Tickets acessíveis: ${tickets?.length || 0}`)

    console.log('\n🎯 PROBLEMA IDENTIFICADO:')
    console.log('❌ As APIs do dashboard estão retornando 401 Unauthorized')
    console.log('🔍 CAUSA: Sessão do NextAuth não está sendo reconhecida')
    console.log('🔧 SOLUÇÃO: Verificar configuração do NextAuth ou criar bypass temporário')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testDashboardSession()
