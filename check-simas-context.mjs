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

async function checkSimasContext() {
  console.log('🔍 VERIFICANDO CONTEXTO DO USUÁRIO SIMAS')
  console.log('=' .repeat(50))

  try {
    // 1. Buscar usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'simas@simas.com.br')
      .single()

    if (userError) {
      console.log('❌ Usuário não encontrado:', userError.message)
      return
    }

    console.log('✅ Usuário encontrado:', user.email)
    console.log('📊 Dados atuais:')
    console.log(`  - User Type: ${user.user_type}`)
    console.log(`  - Context ID: ${user.context_id || 'null'}`)
    console.log(`  - Role: ${user.role}`)

    // 2. Verificar associações user_contexts
    console.log('\n🔗 ASSOCIAÇÕES USER_CONTEXTS...')
    
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
        console.log(`  - Created: ${uc.created_at}`)
      })
    }

    // 3. Verificar contexto "Simas Log"
    console.log('\n🏢 CONTEXTO "SIMAS LOG"...')
    
    const { data: simasLog, error: simasLogError } = await supabase
      .from('contexts')
      .select('*')
      .eq('name', 'Simas Log')
      .single()

    if (simasLogError) {
      console.log('❌ Contexto "Simas Log" não encontrado:', simasLogError.message)
    } else {
      console.log('✅ Contexto "Simas Log" encontrado:')
      console.log(`  - ID: ${simasLog.id}`)
      console.log(`  - Nome: ${simasLog.name}`)
      console.log(`  - Tipo: ${simasLog.type}`)
      console.log(`  - Ativo: ${simasLog.is_active}`)
    }

    // 4. Verificar se o usuário está associado ao contexto correto
    console.log('\n🔍 VERIFICANDO ASSOCIAÇÃO...')
    
    if (userContexts && userContexts.length > 0) {
      const simasLogAssociation = userContexts.find(uc => uc.context_id === simasLog.id)
      
      if (simasLogAssociation) {
        console.log('✅ Usuário está associado ao contexto "Simas Log"')
        console.log(`  - Context ID: ${simasLogAssociation.context_id}`)
        console.log(`  - Can Manage: ${simasLogAssociation.can_manage}`)
      } else {
        console.log('❌ Usuário NÃO está associado ao contexto "Simas Log"')
        console.log('🔧 SOLUÇÃO: Associar usuário ao contexto via user_contexts')
      }
    }

    // 5. Verificar se o context_id do usuário está correto
    console.log('\n🎯 VERIFICANDO CONTEXT_ID DO USUÁRIO...')
    
    if (user.context_id === simasLog.id) {
      console.log('✅ Usuário tem context_id correto')
    } else {
      console.log('❌ Usuário NÃO tem context_id correto')
      console.log(`  - Atual: ${user.context_id || 'null'}`)
      console.log(`  - Esperado: ${simasLog.id}`)
      console.log('🔧 SOLUÇÃO: Atualizar context_id do usuário')
    }

    // 6. Verificar categorias que devem aparecer
    console.log('\n📋 CATEGORIAS QUE DEVEM APARECER...')
    
    // Categorias globais
    const { data: globalCats, error: globalCatsError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_global', true)
      .eq('is_active', true)

    if (globalCatsError) {
      console.log('❌ Erro ao buscar categorias globais:', globalCatsError.message)
    } else {
      console.log('✅ Categorias globais:', globalCats.length)
      globalCats.forEach(cat => {
        console.log(`  - ${cat.name}`)
      })
    }

    // Categorias específicas do contexto
    const { data: contextCats, error: contextCatsError } = await supabase
      .from('categories')
      .select('*')
      .eq('context_id', simasLog.id)
      .eq('is_active', true)

    if (contextCatsError) {
      console.log('❌ Erro ao buscar categorias do contexto:', contextCatsError.message)
    } else {
      console.log('✅ Categorias específicas do contexto:', contextCats.length)
      contextCats.forEach(cat => {
        console.log(`  - ${cat.name}`)
      })
    }

    // 7. Diagnóstico final
    console.log('\n🔟 DIAGNÓSTICO FINAL...')
    
    const issues = []
    const solutions = []
    
    if (!user.context_id) {
      issues.push('❌ Usuário não tem context_id')
      solutions.push('🔧 Atualizar context_id do usuário para o ID do contexto "Simas Log"')
    }
    
    if (user.context_id !== simasLog.id) {
      issues.push('❌ Usuário tem context_id incorreto')
      solutions.push('🔧 Corrigir context_id do usuário')
    }
    
    if (!userContexts || userContexts.length === 0) {
      issues.push('❌ Usuário não tem associações user_contexts')
      solutions.push('🔧 Criar associação user_contexts')
    }

    console.log('📊 RESUMO:')
    console.log(`  - Usuário: ${user.email}`)
    console.log(`  - User Type: ${user.user_type}`)
    console.log(`  - Context ID: ${user.context_id || 'null'}`)
    console.log(`  - Contexto Esperado: ${simasLog.id}`)
    console.log(`  - Associações: ${userContexts?.length || 0}`)
    console.log(`  - Categorias globais: ${globalCats?.length || 0}`)
    console.log(`  - Categorias específicas: ${contextCats?.length || 0}`)

    if (issues.length > 0) {
      console.log('\n🚨 PROBLEMAS:')
      issues.forEach(issue => console.log(`  ${issue}`))
      
      console.log('\n🔧 SOLUÇÕES:')
      solutions.forEach(solution => console.log(`  ${solution}`))
    } else {
      console.log('\n✅ ESTRUTURA OK')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

checkSimasContext()
