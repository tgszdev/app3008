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

async function debugUserAgro2() {
  console.log('🔍 DEBUG: Usuário agro2@agro.com.br')
  console.log('=' .repeat(50))

  try {
    // 1. Verificar dados do usuário
    console.log('\n1️⃣ VERIFICANDO DADOS DO USUÁRIO...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'agro2@agro.com.br')
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

    // 2. Verificar contexto do usuário
    console.log('\n2️⃣ VERIFICANDO CONTEXTO DO USUÁRIO...')
    const { data: context, error: contextError } = await supabase
      .from('contexts')
      .select('*')
      .eq('id', user.context_id)
      .single()

    if (contextError) {
      console.error('❌ Erro ao buscar contexto:', contextError)
      return
    }

    console.log('✅ Contexto encontrado:')
    console.log('  - ID:', context.id)
    console.log('  - Nome:', context.name)
    console.log('  - Slug:', context.slug)
    console.log('  - Tipo:', context.type)
    console.log('  - Is Active:', context.is_active)

    // 3. Verificar categorias que o usuário DEVERIA ver
    console.log('\n3️⃣ VERIFICANDO CATEGORIAS QUE O USUÁRIO DEVERIA VER...')
    
    // Categorias globais
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

    // Categorias específicas do contexto
    const { data: contextCategories, error: contextCatError } = await supabase
      .from('categories')
      .select('*')
      .eq('context_id', user.context_id)
      .eq('is_active', true)

    if (contextCatError) {
      console.error('❌ Erro ao buscar categorias do contexto:', contextCatError)
    } else {
      console.log('✅ Categorias do contexto:', contextCategories.length)
      contextCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${context.name})`)
      })
    }

    // 4. Verificar todas as categorias (o que está sendo retornado atualmente)
    console.log('\n4️⃣ VERIFICANDO TODAS AS CATEGORIAS (ATUAL)...')
    const { data: allCategories, error: allError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)

    if (allError) {
      console.error('❌ Erro ao buscar todas as categorias:', allError)
    } else {
      console.log('✅ Todas as categorias ativas:', allCategories.length)
      allCategories.forEach(cat => {
        const isGlobal = cat.is_global
        const isUserContext = cat.context_id === user.context_id
        console.log(`  - ${cat.name} (${isGlobal ? 'Global' : isUserContext ? context.name : 'Outro contexto'})`)
      })
    }

    // 5. Verificar se há categorias de outros contextos
    console.log('\n5️⃣ VERIFICANDO CATEGORIAS DE OUTROS CONTEXTOS...')
    const { data: otherContexts, error: otherError } = await supabase
      .from('contexts')
      .select('id, name')
      .neq('id', user.context_id)

    if (otherError) {
      console.error('❌ Erro ao buscar outros contextos:', otherError)
    } else {
      console.log('✅ Outros contextos encontrados:', otherContexts.length)
      otherContexts.forEach(ctx => {
        console.log(`  - ${ctx.name} (ID: ${ctx.id})`)
      })
    }

    // 6. Verificar categorias de outros contextos
    console.log('\n6️⃣ VERIFICANDO CATEGORIAS DE OUTROS CONTEXTOS...')
    const otherContextIds = otherContexts?.map(ctx => ctx.id) || []
    
    if (otherContextIds.length > 0) {
      const { data: otherCategories, error: otherCatError } = await supabase
        .from('categories')
        .select('*')
        .in('context_id', otherContextIds)
        .eq('is_active', true)

      if (otherCatError) {
        console.error('❌ Erro ao buscar categorias de outros contextos:', otherCatError)
      } else {
        console.log('✅ Categorias de outros contextos:', otherCategories.length)
        otherCategories.forEach(cat => {
          const otherContext = otherContexts.find(ctx => ctx.id === cat.context_id)
          console.log(`  - ${cat.name} (${otherContext?.name || 'Desconhecido'})`)
        })
      }
    }

    // 7. Diagnóstico final
    console.log('\n7️⃣ DIAGNÓSTICO FINAL...')
    const totalGlobal = globalCategories?.length || 0
    const totalContext = contextCategories?.length || 0
    const totalOther = allCategories?.filter(cat => 
      !cat.is_global && cat.context_id !== user.context_id
    ).length || 0

    console.log(`📊 RESUMO:`)
    console.log(`  - Categorias globais: ${totalGlobal}`)
    console.log(`  - Categorias do contexto (${context.name}): ${totalContext}`)
    console.log(`  - Categorias de outros contextos: ${totalOther}`)
    console.log(`  - Total que o usuário DEVERIA ver: ${totalGlobal + totalContext}`)
    console.log(`  - Total que está sendo retornado: ${allCategories?.length || 0}`)

    if (totalOther > 0) {
      console.log('❌ PROBLEMA: Usuário está vendo categorias de outros contextos!')
      console.log('🔧 SOLUÇÃO: Corrigir filtro na API de categorias')
    } else {
      console.log('✅ CORRETO: Usuário vendo apenas suas categorias')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugUserAgro2()
