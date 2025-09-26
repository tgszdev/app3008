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

async function diagnoseSimasUser() {
  console.log('🔍 DIAGNÓSTICO: USUÁRIO SIMAS@SIMAS.COM.BR')
  console.log('=' .repeat(60))

  try {
    // 1. Verificar dados do usuário
    console.log('\n1️⃣ DADOS DO USUÁRIO SIMAS@SIMAS.COM.BR...')
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'simas@simas.com.br')
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
    console.log(`  - Is Active: ${user.is_active}`)

    // 2. Verificar contexto associado
    console.log('\n2️⃣ CONTEXTO ASSOCIADO...')
    
    if (user.context_id) {
      const { data: context, error: contextError } = await supabase
        .from('contexts')
        .select('*')
        .eq('id', user.context_id)
        .single()

      if (contextError) {
        console.log('❌ Contexto não encontrado:', contextError.message)
      } else {
        console.log('✅ Contexto encontrado:')
        console.log(`  - Nome: ${context.name}`)
        console.log(`  - Tipo: ${context.type}`)
        console.log(`  - Slug: ${context.slug}`)
        console.log(`  - Ativo: ${context.is_active}`)
      }
    } else {
      console.log('❌ Usuário não tem contexto associado!')
    }

    // 3. Verificar associações user_contexts
    console.log('\n3️⃣ ASSOCIAÇÕES USER_CONTEXTS...')
    
    const { data: userContexts, error: userContextsError } = await supabase
      .from('user_contexts')
      .select('*')
      .eq('user_id', user.id)

    if (userContextsError) {
      console.log('❌ Erro ao buscar associações:', userContextsError.message)
    } else {
      console.log('✅ Associações encontradas:', userContexts.length)
      userContexts.forEach(uc => {
        console.log(`  - Context ID: ${uc.context_id}, Can Manage: ${uc.can_manage}`)
      })
    }

    // 4. Verificar todas as categorias
    console.log('\n4️⃣ TODAS AS CATEGORIAS...')
    
    const { data: allCategories, error: allCategoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order')

    if (allCategoriesError) {
      console.log('❌ Erro ao buscar categorias:', allCategoriesError.message)
    } else {
      console.log('✅ Categorias ativas encontradas:', allCategories.length)
      allCategories.forEach(cat => {
        console.log(`  - ${cat.name}: ${cat.is_global ? 'Global' : 'Específica'} (context: ${cat.context_id || 'null'})`)
      })
    }

    // 5. Verificar categorias globais
    console.log('\n5️⃣ CATEGORIAS GLOBAIS...')
    
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

    // 6. Verificar categorias específicas do contexto do usuário
    console.log('\n6️⃣ CATEGORIAS ESPECÍFICAS DO CONTEXTO...')
    
    if (user.context_id) {
      const { data: contextCats, error: contextCatsError } = await supabase
        .from('categories')
        .select('*')
        .eq('context_id', user.context_id)
        .eq('is_active', true)

      if (contextCatsError) {
        console.log('❌ Erro ao buscar categorias do contexto:', contextCatsError.message)
      } else {
        console.log('✅ Categorias do contexto:', contextCats.length)
        contextCats.forEach(cat => {
          console.log(`  - ${cat.name}: ${cat.is_global ? 'Global' : 'Específica'}`)
        })
      }
    }

    // 7. Verificar se categoria "Emergência" foi alterada
    console.log('\n7️⃣ VERIFICANDO CATEGORIA "EMERGÊNCIA"...')
    
    const { data: emergencia, error: emergenciaError } = await supabase
      .from('categories')
      .select('*')
      .eq('name', 'Emergência')
      .single()

    if (emergenciaError) {
      console.log('❌ Categoria "Emergência" não encontrada:', emergenciaError.message)
    } else {
      console.log('✅ Categoria "Emergência" encontrada:')
      console.log(`  - ID: ${emergencia.id}`)
      console.log(`  - Nome: ${emergencia.name}`)
      console.log(`  - Is Global: ${emergencia.is_global}`)
      console.log(`  - Context ID: ${emergencia.context_id || 'null'}`)
      console.log(`  - Is Active: ${emergencia.is_active}`)
    }

    // 8. Verificar categoria "Simas"
    console.log('\n8️⃣ VERIFICANDO CATEGORIA "SIMAS"...')
    
    const { data: simas, error: simasError } = await supabase
      .from('categories')
      .select('*')
      .eq('name', 'Simas')
      .single()

    if (simasError) {
      console.log('❌ Categoria "Simas" não encontrada:', simasError.message)
    } else {
      console.log('✅ Categoria "Simas" encontrada:')
      console.log(`  - ID: ${simas.id}`)
      console.log(`  - Nome: ${simas.name}`)
      console.log(`  - Is Global: ${simas.is_global}`)
      console.log(`  - Context ID: ${simas.context_id || 'null'}`)
      console.log(`  - Is Active: ${simas.is_active}`)
    }

    // 9. Verificar contexto "Simas Log"
    console.log('\n9️⃣ VERIFICANDO CONTEXTO "SIMAS LOG"...')
    
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

    // 10. Simular lógica da API
    console.log('\n🔟 SIMULANDO LÓGICA DA API...')
    
    let expectedCategories = []
    
    // Categorias globais
    if (globalCats && globalCats.length > 0) {
      expectedCategories = [...globalCats]
      console.log(`✅ Categorias globais que devem aparecer: ${globalCats.length}`)
    }
    
    // Categorias específicas do contexto
    if (user.context_id) {
      const { data: contextCats, error: contextCatsError } = await supabase
        .from('categories')
        .select('*')
        .eq('context_id', user.context_id)
        .eq('is_active', true)

      if (contextCats && contextCats.length > 0) {
        expectedCategories = [...expectedCategories, ...contextCats]
        console.log(`✅ Categorias específicas que devem aparecer: ${contextCats.length}`)
      }
    }
    
    console.log(`✅ Total de categorias que devem aparecer: ${expectedCategories.length}`)
    expectedCategories.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.is_global ? 'Global' : 'Específica'}`)
    })

    // 11. Verificar se há problemas na API
    console.log('\n1️⃣1️⃣ VERIFICANDO API DE CATEGORIAS...')
    
    try {
      const response = await fetch('https://www.ithostbr.tech/api/categories/public?active_only=true')
      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ API funcionando:', data.length, 'categorias')
        console.log('📋 Categorias retornadas pela API:')
        data.forEach(cat => {
          console.log(`  - ${cat.name}: ${cat.is_global ? 'Global' : 'Específica'} (context: ${cat.context_id || 'null'})`)
        })
      } else {
        console.log('❌ API com erro:', response.status, data)
      }
    } catch (error) {
      console.log('❌ Erro ao testar API:', error.message)
    }

    // 12. Diagnóstico final
    console.log('\n1️⃣2️⃣ DIAGNÓSTICO FINAL...')
    
    const issues = []
    
    if (!user.context_id) {
      issues.push('❌ Usuário não tem contexto associado')
    }
    
    if (emergencia && emergencia.is_global) {
      issues.push('❌ Categoria "Emergência" ainda é global (deveria ser específica)')
    }
    
    if (!simas) {
      issues.push('❌ Categoria "Simas" não encontrada')
    }
    
    if (!simasLog) {
      issues.push('❌ Contexto "Simas Log" não encontrado')
    }
    
    if (user.context_id && simasLog && user.context_id !== simasLog.id) {
      issues.push('❌ Usuário não está associado ao contexto "Simas Log"')
    }

    console.log('📊 RESUMO DO DIAGNÓSTICO:')
    console.log(`  - Usuário: ${user.email} (${user.user_type})`)
    console.log(`  - Contexto: ${user.context_id || 'null'}`)
    console.log(`  - Categorias globais: ${globalCats?.length || 0}`)
    console.log(`  - Categorias específicas: ${expectedCategories.length}`)
    console.log(`  - Total esperado: ${expectedCategories.length}`)

    if (issues.length > 0) {
      console.log('\n🚨 PROBLEMAS IDENTIFICADOS:')
      issues.forEach(issue => console.log(`  ${issue}`))
    } else {
      console.log('\n✅ ESTRUTURA OK - Verificar API')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

diagnoseSimasUser()
