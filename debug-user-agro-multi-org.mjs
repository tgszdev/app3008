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

async function debugUserAgroMultiOrg() {
  console.log('🔍 DEBUG: Usuário agro@agro.com.br - Múltiplas Organizações')
  console.log('=' .repeat(60))

  try {
    // 1. Verificar dados do usuário
    console.log('\n1️⃣ VERIFICANDO DADOS DO USUÁRIO...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'agro@agro.com.br')
      .single()

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError)
      return
    }

    console.log('✅ Usuário encontrado:')
    console.log('  - ID:', user.id)
    console.log('  - Email:', user.email)
    console.log('  - Nome:', user.name)
    console.log('  - User Type:', user.user_type)
    console.log('  - Context ID:', user.context_id)
    console.log('  - Role:', user.role)
    console.log('  - Is Active:', user.is_active)

    // 2. Verificar se há múltiplas organizações vinculadas
    console.log('\n2️⃣ VERIFICANDO MÚLTIPLAS ORGANIZAÇÕES...')
    
    // Verificar tabela de associações de usuário-organização
    const { data: userOrgs, error: userOrgsError } = await supabase
      .from('user_organizations')
      .select(`
        *,
        organization:context_id(id, name, type, slug)
      `)
      .eq('user_id', user.id)

    if (userOrgsError) {
      console.log('⚠️ Tabela user_organizations não encontrada ou erro:', userOrgsError.message)
    } else {
      console.log('✅ Associações usuário-organização:', userOrgs.length)
      userOrgs.forEach(assoc => {
        console.log(`  - ${assoc.organization?.name || 'Desconhecida'} (${assoc.organization?.type || 'N/A'})`)
      })
    }

    // 3. Verificar contextos disponíveis
    console.log('\n3️⃣ VERIFICANDO TODOS OS CONTEXTOS...')
    const { data: allContexts, error: contextsError } = await supabase
      .from('contexts')
      .select('*')
      .eq('is_active', true)

    if (contextsError) {
      console.error('❌ Erro ao buscar contextos:', contextsError)
      return
    }

    console.log('✅ Todos os contextos ativos:')
    allContexts.forEach(ctx => {
      console.log(`  - ${ctx.name} (${ctx.type}) - ID: ${ctx.id}`)
    })

    // 4. Verificar categorias por contexto
    console.log('\n4️⃣ VERIFICANDO CATEGORIAS POR CONTEXTO...')
    
    for (const context of allContexts) {
      const { data: contextCategories, error: contextCatError } = await supabase
        .from('categories')
        .select('*')
        .eq('context_id', context.id)
        .eq('is_active', true)

      if (contextCatError) {
        console.log(`❌ Erro ao buscar categorias de ${context.name}:`, contextCatError.message)
      } else {
        console.log(`✅ ${context.name}: ${contextCategories.length} categorias`)
        contextCategories.forEach(cat => {
          console.log(`    - ${cat.name}`)
        })
      }
    }

    // 5. Verificar categorias globais
    console.log('\n5️⃣ VERIFICANDO CATEGORIAS GLOBAIS...')
    const { data: globalCategories, error: globalError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_global', true)
      .eq('is_active', true)

    if (globalError) {
      console.error('❌ Erro ao buscar categorias globais:', globalError)
    } else {
      console.log('✅ Categorias globais:', globalCategories.length)
      globalCategories.forEach(cat => {
        console.log(`  - ${cat.name} (Global)`)
      })
    }

    // 6. Verificar se o usuário é matrix
    console.log('\n6️⃣ VERIFICANDO SE USUÁRIO É MATRIX...')
    if (user.user_type === 'matrix') {
      console.log('✅ Usuário é MATRIX - deveria ver todas as categorias')
      
      // Verificar se há contextos associados ao usuário matrix
      const { data: matrixContexts, error: matrixError } = await supabase
        .from('user_contexts')
        .select(`
          *,
          context:context_id(id, name, type, slug)
        `)
        .eq('user_id', user.id)

      if (matrixError) {
        console.log('⚠️ Tabela user_contexts não encontrada ou erro:', matrixError.message)
      } else {
        console.log('✅ Contextos associados ao usuário matrix:', matrixContexts.length)
        matrixContexts.forEach(assoc => {
          console.log(`  - ${assoc.context?.name || 'Desconhecido'} (${assoc.context?.type || 'N/A'})`)
        })
      }
    } else {
      console.log('❌ Usuário NÃO é matrix - deveria ver apenas categorias do seu contexto')
    }

    // 7. Testar API atual
    console.log('\n7️⃣ TESTANDO API ATUAL...')
    const { data: apiCategories, error: apiError } = await supabase
      .from('categories')
      .select('*')
      .or('is_global.eq.true,context_id.eq.6486088e-72ae-461b-8b03-32ca84918882')
      .eq('is_active', true)

    if (apiError) {
      console.error('❌ Erro na API atual:', apiError)
    } else {
      console.log('✅ API atual retorna:', apiCategories.length, 'categorias')
      apiCategories.forEach(cat => {
        const contextName = allContexts.find(ctx => ctx.id === cat.context_id)?.name || 'Global'
        console.log(`  - ${cat.name} (${contextName})`)
      })
    }

    // 8. Diagnóstico final
    console.log('\n8️⃣ DIAGNÓSTICO FINAL...')
    console.log(`📊 RESUMO:`)
    console.log(`  - Usuário: ${user.email}`)
    console.log(`  - Tipo: ${user.user_type}`)
    console.log(`  - Contexto principal: ${user.context_id}`)
    console.log(`  - Categorias globais: ${globalCategories?.length || 0}`)
    console.log(`  - Total de contextos: ${allContexts.length}`)
    console.log(`  - API atual retorna: ${apiCategories?.length || 0} categorias`)

    if (user.user_type === 'matrix') {
      console.log('🔧 SOLUÇÃO: Usuário matrix deveria ver todas as categorias ativas')
    } else {
      console.log('🔧 SOLUÇÃO: Usuário context deveria ver apenas categorias globais + do seu contexto')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugUserAgroMultiOrg()
