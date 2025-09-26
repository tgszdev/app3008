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

async function testDashboardAuth() {
  console.log('🔍 TESTANDO AUTENTICAÇÃO DO DASHBOARD')
  console.log('=' .repeat(50))

  try {
    // 1. Verificar se o usuário existe e tem dados corretos
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

    // 2. Verificar se o usuário tem os campos necessários para a API
    console.log('\n2️⃣ VERIFICANDO CAMPOS NECESSÁRIOS PARA A API...')
    
    const requiredFields = ['id', 'role', 'user_type', 'context_id', 'context_name', 'context_type']
    const missingFields = requiredFields.filter(field => !user[field] && user[field] !== null)
    
    if (missingFields.length > 0) {
      console.log('❌ Campos faltantes:', missingFields.join(', '))
      console.log('🔧 SOLUÇÃO: Atualizar usuário com campos faltantes')
    } else {
      console.log('✅ Todos os campos necessários estão presentes')
    }

    // 3. Verificar associações user_contexts
    console.log('\n3️⃣ VERIFICANDO ASSOCIAÇÕES USER_CONTEXTS...')
    
    const { data: userContexts, error: userContextsError } = await supabase
      .from('user_contexts')
      .select('*')
      .eq('user_id', user.id)

    if (userContextsError) {
      console.log('❌ Erro ao buscar associações:', userContextsError.message)
    } else {
      console.log('✅ Associações encontradas:', userContexts.length)
      userContexts.forEach(uc => {
        console.log(`  - Context ID: ${uc.context_id}`)
        console.log(`  - Can Manage: ${uc.can_manage}`)
      })
    }

    // 4. Simular a lógica da API de estatísticas
    console.log('\n4️⃣ SIMULANDO LÓGICA DA API DE ESTATÍSTICAS...')
    
    const currentUserId = user.id
    const userRole = user.role || 'user'
    const userType = user.user_type
    const userContextId = user.context_id

    console.log('📊 Parâmetros da API:')
    console.log(`  - User ID: ${currentUserId}`)
    console.log(`  - User Role: ${userRole}`)
    console.log(`  - User Type: ${userType}`)
    console.log(`  - User Context ID: ${userContextId || 'null'}`)

    // Simular filtro de tickets
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

        // Mostrar alguns tickets de exemplo
        console.log('\n📋 Tickets de exemplo:')
        tickets.slice(0, 3).forEach(ticket => {
          console.log(`  - ${ticket.title}: ${ticket.status} (context: ${ticket.context_id})`)
        })
      }
    }

    // 5. Verificar se há problema de autenticação
    console.log('\n5️⃣ VERIFICANDO PROBLEMA DE AUTENTICAÇÃO...')
    
    // O problema pode estar na sessão do NextAuth
    console.log('🔍 Possíveis causas do erro 401:')
    console.log('  1. Sessão do NextAuth não está sendo criada corretamente')
    console.log('  2. Middleware está bloqueando a requisição')
    console.log('  3. Configuração do NextAuth está incorreta')
    console.log('  4. Cookies de sessão não estão sendo enviados')

    // 6. Testar se a API funciona sem autenticação (temporariamente)
    console.log('\n6️⃣ TESTANDO API SEM AUTENTICAÇÃO...')
    
    try {
      // Testar se conseguimos acessar a API diretamente
      const response = await fetch('https://www.ithostbr.tech/api/dashboard/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Não enviar cookies de autenticação
        }
      })
      
      const data = await response.json()
      console.log('📡 Resposta da API:', response.status, data)
      
      if (response.status === 401) {
        console.log('✅ Confirmado: API está retornando 401 (problema de autenticação)')
      } else {
        console.log('⚠️ API não está retornando 401 - problema diferente')
      }
    } catch (error) {
      console.log('❌ Erro ao testar API:', error.message)
    }

    // 7. Diagnóstico final
    console.log('\n7️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO:')
    console.log(`  - Usuário: ${user.email}`)
    console.log(`  - User Type: ${user.user_type}`)
    console.log(`  - Associações: ${userContexts?.length || 0}`)
    console.log(`  - Tickets acessíveis: ${tickets?.length || 0}`)
    console.log(`  - Campos faltantes: ${missingFields.length}`)

    if (missingFields.length > 0) {
      console.log('\n🔧 SOLUÇÃO 1: Atualizar campos faltantes do usuário')
    }
    
    console.log('\n🔧 SOLUÇÃO 2: Verificar configuração do NextAuth')
    console.log('🔧 SOLUÇÃO 3: Verificar middleware de autenticação')
    console.log('🔧 SOLUÇÃO 4: Verificar cookies de sessão')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testDashboardAuth()
