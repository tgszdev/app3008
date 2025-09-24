#!/usr/bin/env node

/**
 * DEBUG SELETOR - ORGANIZAÇÕES NÃO APARECENDO
 * 
 * Este script verifica por que as organizações não estão aparecendo no seletor
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function debugSeletorOrganizacoes() {
  console.log('🔍 DEBUG SELETOR - ORGANIZAÇÕES NÃO APARECENDO')
  console.log('=' * 60)
  
  try {
    // 1. Verificar dados do usuário
    console.log('👤 VERIFICANDO DADOS DO USUÁRIO')
    console.log('-' * 40)
    
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

    // 2. Verificar contextos associados
    console.log('\n🏢 VERIFICANDO CONTEXTOS ASSOCIADOS')
    console.log('-' * 40)
    
    const { data: userContexts, error: contextsError } = await supabaseAdmin
      .from('user_contexts')
      .select('context_id, contexts(id, name, slug, type, is_active)')
      .eq('user_id', userData.id)

    if (contextsError) {
      console.error('❌ Erro ao buscar contextos:', contextsError)
      return
    }

    console.log(`📊 Total de contextos associados: ${userContexts.length}`)
    userContexts.forEach((uc, index) => {
      if (uc.contexts) {
        console.log(`  ${index + 1}. ${uc.contexts.name} (${uc.contexts.type}) - Ativo: ${uc.contexts.is_active}`)
      } else {
        console.log(`  ${index + 1}. ❌ Contexto órfão: ${uc.context_id}`)
      }
    })

    // 3. Verificar se todos os contextos estão ativos
    console.log('\n✅ VERIFICANDO CONTEXTOS ATIVOS')
    console.log('-' * 40)
    
    const activeContexts = userContexts.filter(uc => uc.contexts && uc.contexts.is_active)
    const inactiveContexts = userContexts.filter(uc => uc.contexts && !uc.contexts.is_active)
    
    console.log(`📊 Contextos ativos: ${activeContexts.length}`)
    activeContexts.forEach(uc => {
      console.log(`  ✅ ${uc.contexts.name} (${uc.contexts.type})`)
    })
    
    if (inactiveContexts.length > 0) {
      console.log(`📊 Contextos inativos: ${inactiveContexts.length}`)
      inactiveContexts.forEach(uc => {
        console.log(`  ❌ ${uc.contexts.name} (${uc.contexts.type})`)
      })
    }

    // 4. Simular o que o OrganizationContext deveria retornar
    console.log('\n🔄 SIMULANDO ORGANIZATION CONTEXT')
    console.log('-' * 40)
    
    const availableContexts = activeContexts.map(uc => ({
      id: uc.contexts.id,
      name: uc.contexts.name,
      slug: uc.contexts.slug,
      type: uc.contexts.type
    }))
    
    console.log('📊 AvailableContexts que deveria ser retornado:')
    availableContexts.forEach((ctx, index) => {
      console.log(`  ${index + 1}. ${ctx.name} (${ctx.type}) - ID: ${ctx.id}`)
    })

    // 5. Verificar se há problemas no contexto
    console.log('\n🔍 VERIFICANDO PROBLEMAS NO CONTEXTO')
    console.log('-' * 40)
    
    const isMatrixUser = userData.user_type === 'matrix'
    const hasMultipleContexts = availableContexts.length > 1
    
    console.log(`📊 isMatrixUser: ${isMatrixUser}`)
    console.log(`📊 hasMultipleContexts: ${hasMultipleContexts}`)
    console.log(`📊 availableContexts.length: ${availableContexts.length}`)
    
    if (!isMatrixUser) {
      console.log('❌ PROBLEMA: Usuário não é matrix user')
    }
    
    if (!hasMultipleContexts) {
      console.log('❌ PROBLEMA: Usuário não tem múltiplos contextos')
    }
    
    if (availableContexts.length === 0) {
      console.log('❌ PROBLEMA: Nenhum contexto disponível')
    }

    // 6. Verificar se o MultiClientSelector deveria aparecer
    console.log('\n🎯 VERIFICANDO SE SELETOR DEVERIA APARECER')
    console.log('-' * 40)
    
    const shouldShowSelector = isMatrixUser && availableContexts.length > 0
    console.log(`📊 Deveria mostrar seletor: ${shouldShowSelector}`)
    
    if (shouldShowSelector) {
      console.log('✅ Seletor deveria aparecer')
    } else {
      console.log('❌ Seletor NÃO deveria aparecer')
      if (!isMatrixUser) {
        console.log('   - Motivo: Usuário não é matrix user')
      }
      if (availableContexts.length === 0) {
        console.log('   - Motivo: Nenhum contexto disponível')
      }
    }

    // 7. Verificar se há problemas de carregamento
    console.log('\n⏳ VERIFICANDO PROBLEMAS DE CARREGAMENTO')
    console.log('-' * 40)
    
    console.log('📊 Possíveis problemas:')
    console.log('1. Context não está carregando availableContexts')
    console.log('2. Context não está fazendo join correto com user_contexts')
    console.log('3. Context não está filtrando por is_active')
    console.log('4. Context não está atualizando quando dados mudam')
    
    // 8. Sugestões de correção
    console.log('\n🔧 SUGESTÕES DE CORREÇÃO')
    console.log('-' * 40)
    
    console.log('1. ✅ Verificar se OrganizationContext está fazendo join correto')
    console.log('2. ✅ Verificar se está filtrando por is_active = true')
    console.log('3. ✅ Verificar se está recarregando quando dados mudam')
    console.log('4. ✅ Verificar se MultiClientSelector está recebendo availableContexts')
    console.log('5. ✅ Verificar se há problemas de estado no React')

  } catch (error) {
    console.error('❌ Erro durante debug:', error)
  }
}

// Executar debug
debugSeletorOrganizacoes().catch(console.error)
