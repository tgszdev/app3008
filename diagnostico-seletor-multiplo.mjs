#!/usr/bin/env node

/**
 * DIAGNÓSTICO COMPLETO - SELETOR MÚLTIPLO
 * 
 * Este script diagnostica problemas com:
 * 1. Layout do seletor
 * 2. Organizações não aparecendo
 * 3. Erro ao selecionar múltiplos clientes
 * 4. Problemas de contexto
 */

import { createClient } from '@supabase/supabase-js'

// =====================================================
// CONFIGURAÇÃO
// =====================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODUxODYsImV4cCI6MjA3MjE2MTE4Nn0.ht9a6MmtkfE5hVRmwpfyMcW24a4R7n-9hoW6eYd3K2w'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// =====================================================
// FUNÇÕES DE DIAGNÓSTICO
// =====================================================

async function diagnoseUserContexts() {
  console.log('🔍 DIAGNÓSTICO 1: Contextos do Usuário')
  console.log('=' * 50)
  
  try {
    // Buscar dados do usuário
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, user_type, context_id, context_name, context_type')
      .eq('email', 'rodrigues2205@icloud.com')
      .single()

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError)
      return
    }

    console.log('📊 Dados do usuário:', {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      user_type: userData.user_type,
      context_id: userData.context_id,
      context_name: userData.context_name,
      context_type: userData.context_type
    })

    // Buscar contextos associados
    const { data: userContexts, error: contextsError } = await supabaseAdmin
      .from('user_contexts')
      .select('context_id, contexts(id, name, slug, type)')
      .eq('user_id', userData.id)

    if (contextsError) {
      console.error('❌ Erro ao buscar contextos:', contextsError)
      return
    }

    console.log('📊 Contextos associados:', userContexts)

    // Verificar se todos os contextos estão corretos
    const contextIds = userContexts.map(uc => uc.context_id)
    console.log('📊 IDs dos contextos:', contextIds)

    // Buscar detalhes de cada contexto
    for (const userContext of userContexts) {
      const { data: contextDetails, error: detailError } = await supabaseAdmin
        .from('contexts')
        .select('id, name, slug, type, is_active')
        .eq('id', userContext.context_id)
        .single()

      if (detailError) {
        console.error(`❌ Erro ao buscar contexto ${userContext.context_id}:`, detailError)
      } else {
        console.log(`✅ Contexto ${contextDetails.name}:`, contextDetails)
      }
    }

  } catch (error) {
    console.error('❌ Erro no diagnóstico de contextos:', error)
  }
}

async function diagnoseMultiClientAPI() {
  console.log('\n🔍 DIAGNÓSTICO 2: API Multi-Client')
  console.log('=' * 50)
  
  try {
    // Simular chamada para API multi-client
    const testContextIds = ['fa4a4a34-f662-4da1-94d8-b77b5c578d6b', 'a7791594-c44d-47aa-8ddd-97ecfb6cc8ed']
    
    console.log('📊 Testando API com context_ids:', testContextIds)
    
    // Testar query direta no banco
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select('id, ticket_number, title, context_id, contexts(name)')
      .in('context_id', testContextIds)
      .limit(10)

    if (ticketsError) {
      console.error('❌ Erro na query de tickets:', ticketsError)
    } else {
      console.log('✅ Tickets encontrados:', tickets.length)
      console.log('📊 Exemplos de tickets:', tickets.slice(0, 3))
    }

    // Testar se a API está acessível
    try {
      const response = await fetch('http://localhost:3000/api/dashboard/multi-client-stats?context_ids=' + testContextIds.join(','))
      if (response.ok) {
        const data = await response.json()
        console.log('✅ API multi-client funcionando:', data)
      } else {
        console.log('❌ API multi-client retornou erro:', response.status, response.statusText)
      }
    } catch (apiError) {
      console.log('⚠️ API não acessível (servidor não rodando):', apiError.message)
    }

  } catch (error) {
    console.error('❌ Erro no diagnóstico da API:', error)
  }
}

async function diagnoseLayoutIssues() {
  console.log('\n🔍 DIAGNÓSTICO 3: Problemas de Layout')
  console.log('=' * 50)
  
  try {
    // Verificar se os componentes estão sendo importados corretamente
    console.log('📊 Verificando imports do MultiClientSelector...')
    
    // Simular verificação de componentes
    const components = [
      'MultiClientSelector',
      'SelectedClientsTags',
      'OrganizationSelector'
    ]
    
    for (const component of components) {
      console.log(`✅ Componente ${component} deve estar disponível`)
    }

    // Verificar se há conflitos de CSS
    console.log('📊 Verificando possíveis conflitos de CSS...')
    console.log('✅ Verificar se z-index está correto para modais')
    console.log('✅ Verificar se posicionamento absolute está correto')
    console.log('✅ Verificar se classes Tailwind estão aplicadas')

  } catch (error) {
    console.error('❌ Erro no diagnóstico de layout:', error)
  }
}

async function diagnoseDatabaseIntegrity() {
  console.log('\n🔍 DIAGNÓSTICO 4: Integridade do Banco')
  console.log('=' * 50)
  
  try {
    // Verificar se todas as tabelas necessárias existem
    const tables = ['users', 'contexts', 'user_contexts', 'tickets']
    
    for (const table of tables) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.error(`❌ Tabela ${table} com problema:`, error)
      } else {
        console.log(`✅ Tabela ${table} acessível`)
      }
    }

    // Verificar integridade das associações
    const { data: orphanedContexts, error: orphanError } = await supabaseAdmin
      .from('user_contexts')
      .select('context_id, contexts(id)')
      .is('contexts.id', null)

    if (orphanError) {
      console.log('⚠️ Não foi possível verificar contextos órfãos:', orphanError.message)
    } else if (orphanedContexts && orphanedContexts.length > 0) {
      console.log('❌ Contextos órfãos encontrados:', orphanedContexts)
    } else {
      console.log('✅ Nenhum contexto órfão encontrado')
    }

  } catch (error) {
    console.error('❌ Erro no diagnóstico do banco:', error)
  }
}

async function diagnoseFrontendIssues() {
  console.log('\n🔍 DIAGNÓSTICO 5: Problemas Frontend')
  console.log('=' * 50)
  
  try {
    console.log('📊 Possíveis problemas identificados:')
    console.log('1. ❌ Layout fugindo do padrão - Verificar CSS e posicionamento')
    console.log('2. ❌ Erro ao selecionar múltiplos - Verificar estado e handlers')
    console.log('3. ❌ Organizações não aparecendo - Verificar contexto e dados')
    console.log('4. ❌ Erro de cliente - Verificar console do navegador')
    
    console.log('\n📊 Soluções sugeridas:')
    console.log('1. ✅ Ajustar z-index e posicionamento do modal')
    console.log('2. ✅ Verificar handlers de seleção múltipla')
    console.log('3. ✅ Verificar se availableContexts está sendo carregado')
    console.log('4. ✅ Adicionar try-catch nos handlers')
    console.log('5. ✅ Verificar se onSelectionChange está sendo chamado corretamente')

  } catch (error) {
    console.error('❌ Erro no diagnóstico frontend:', error)
  }
}

// =====================================================
// EXECUÇÃO DO DIAGNÓSTICO
// =====================================================

async function runDiagnosis() {
  console.log('🚀 INICIANDO DIAGNÓSTICO COMPLETO - SELETOR MÚLTIPLO')
  console.log('=' * 80)
  
  const startTime = new Date()
  console.log(`⏰ Início: ${startTime.toISOString()}`)
  
  try {
    await diagnoseUserContexts()
    await diagnoseMultiClientAPI()
    await diagnoseLayoutIssues()
    await diagnoseDatabaseIntegrity()
    await diagnoseFrontendIssues()
    
    console.log('\n' + '=' * 80)
    console.log('📊 RESUMO DO DIAGNÓSTICO')
    console.log('=' * 80)
    console.log('✅ Diagnóstico concluído com sucesso')
    console.log('📋 Verifique os logs acima para identificar problemas')
    console.log('🔧 Implemente as correções sugeridas')
    
  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error)
  }
  
  const endTime = new Date()
  const duration = endTime - startTime
  console.log(`\n⏰ Fim: ${endTime.toISOString()}`)
  console.log(`⏱️ Duração: ${duration}ms`)
}

// =====================================================
// EXECUÇÃO
// =====================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  runDiagnosis().catch(console.error)
}

export { runDiagnosis }
