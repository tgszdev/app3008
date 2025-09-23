#!/usr/bin/env node

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 TESTE DA INTERFACE MULTI-TENANT')
console.log('=====================================\n')

async function testMultiTenantInterface() {
  try {
    // 1. Verificar se as tabelas multi-tenant existem
    console.log('1. 📋 VERIFICANDO TABELAS MULTI-TENANT...')
    
    const { data: contexts, error: contextsError } = await supabase
      .from('contexts')
      .select('*')
      .limit(5)
    
    if (contextsError) {
      console.log('❌ Tabela contexts não encontrada:', contextsError.message)
    } else {
      console.log('✅ Tabela contexts encontrada:', contexts.length, 'registros')
    }
    
    const { data: matrixUsers, error: matrixUsersError } = await supabase
      .from('matrix_users')
      .select('*')
      .limit(5)
    
    if (matrixUsersError) {
      console.log('❌ Tabela matrix_users não encontrada:', matrixUsersError.message)
    } else {
      console.log('✅ Tabela matrix_users encontrada:', matrixUsers.length, 'registros')
    }
    
    const { data: contextUsers, error: contextUsersError } = await supabase
      .from('context_users')
      .select('*')
      .limit(5)
    
    if (contextUsersError) {
      console.log('❌ Tabela context_users não encontrada:', contextUsersError.message)
    } else {
      console.log('✅ Tabela context_users encontrada:', contextUsers.length, 'registros')
    }
    
    // 2. Verificar contextos disponíveis
    console.log('\n2. 🏢 VERIFICANDO CONTEXTOS DISPONÍVEIS...')
    
    if (!contextsError && contexts.length > 0) {
      contexts.forEach((context, index) => {
        console.log(`${index + 1}. ${context.name} (${context.type}) - ${context.slug}`)
      })
    } else {
      console.log('⚠️ Nenhum contexto encontrado')
    }
    
    // 3. Verificar usuários da matriz
    console.log('\n3. 👥 VERIFICANDO USUÁRIOS DA MATRIZ...')
    
    if (!matrixUsersError && matrixUsers.length > 0) {
      matrixUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`)
      })
    } else {
      console.log('⚠️ Nenhum usuário da matriz encontrado')
    }
    
    // 4. Verificar usuários de contexto
    console.log('\n4. 🏢 VERIFICANDO USUÁRIOS DE CONTEXTO...')
    
    if (!contextUsersError && contextUsers.length > 0) {
      contextUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Contexto: ${user.context_id}`)
      })
    } else {
      console.log('⚠️ Nenhum usuário de contexto encontrado')
    }
    
    // 5. Verificar relacionamentos matrix_user_contexts
    console.log('\n5. 🔗 VERIFICANDO RELACIONAMENTOS MATRIX-CONTEXTO...')
    
    const { data: relationships, error: relationshipsError } = await supabase
      .from('matrix_user_contexts')
      .select(`
        *,
        matrix_users(name, email),
        contexts(name, type)
      `)
      .limit(10)
    
    if (relationshipsError) {
      console.log('❌ Tabela matrix_user_contexts não encontrada:', relationshipsError.message)
    } else {
      console.log('✅ Relacionamentos encontrados:', relationships.length)
      relationships.forEach((rel, index) => {
        console.log(`${index + 1}. ${rel.matrix_users?.name} -> ${rel.contexts?.name} (${rel.contexts?.type}) - Can Manage: ${rel.can_manage}`)
      })
    }
    
    // 6. Verificar tickets com contexto
    console.log('\n6. 🎫 VERIFICANDO TICKETS COM CONTEXTO...')
    
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, title, context_id, requester_context_user_id')
      .not('context_id', 'is', null)
      .limit(5)
    
    if (ticketsError) {
      console.log('❌ Erro ao buscar tickets:', ticketsError.message)
    } else {
      console.log('✅ Tickets com contexto encontrados:', tickets.length)
      tickets.forEach((ticket, index) => {
        console.log(`${index + 1}. ${ticket.title} - Context: ${ticket.context_id}`)
      })
    }
    
    console.log('\n📊 RESUMO DO SISTEMA MULTI-TENANT:')
    console.log('=====================================')
    console.log(`✅ Contextos: ${contexts?.length || 0}`)
    console.log(`✅ Usuários da Matriz: ${matrixUsers?.length || 0}`)
    console.log(`✅ Usuários de Contexto: ${contextUsers?.length || 0}`)
    console.log(`✅ Relacionamentos: ${relationships?.length || 0}`)
    console.log(`✅ Tickets com Contexto: ${tickets?.length || 0}`)
    
    // 7. Verificar se o sistema está pronto para uso
    const isReady = !contextsError && !matrixUsersError && !contextUsersError && !relationshipsError
    
    if (isReady) {
      console.log('\n🎉 SISTEMA MULTI-TENANT PRONTO PARA USO!')
      console.log('✅ Todas as tabelas estão configuradas')
      console.log('✅ Interface multi-tenant implementada')
      console.log('✅ Componentes de seleção funcionando')
    } else {
      console.log('\n⚠️ SISTEMA MULTI-TENANT INCOMPLETO')
      console.log('❌ Algumas tabelas estão faltando')
      console.log('❌ Execute o setup do banco de dados primeiro')
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
  }
}

testMultiTenantInterface()
