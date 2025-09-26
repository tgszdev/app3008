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

async function verifyCategoriesApiSync() {
  console.log('🔍 VERIFICANDO SINCRONIZAÇÃO API DE CATEGORIAS → BANCO')
  console.log('=' .repeat(70))

  try {
    // 1. Verificar todas as categorias no banco
    console.log('\n1️⃣ CATEGORIAS NO BANCO DE DADOS...')
    
    const { data: allCategories, error: allCategoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('display_order')

    if (allCategoriesError) {
      console.log('❌ Erro ao buscar categorias:', allCategoriesError.message)
      return
    }

    console.log('✅ Categorias encontradas no banco:', allCategories.length)
    
    // Separar por tipo
    const globalCats = allCategories.filter(cat => cat.is_global)
    const specificCats = allCategories.filter(cat => !cat.is_global)
    const activeCats = allCategories.filter(cat => cat.is_active)
    const inactiveCats = allCategories.filter(cat => !cat.is_active)

    console.log('📊 Distribuição:')
    console.log(`  - Globais: ${globalCats.length}`)
    console.log(`  - Específicas: ${specificCats.length}`)
    console.log(`  - Ativas: ${activeCats.length}`)
    console.log(`  - Inativas: ${inactiveCats.length}`)

    // 2. Verificar categorias globais
    console.log('\n2️⃣ CATEGORIAS GLOBAIS...')
    if (globalCats.length > 0) {
      globalCats.forEach(cat => {
        console.log(`  - ${cat.name}: ${cat.is_active ? 'Ativa' : 'Inativa'} (context: ${cat.context_id || 'null'})`)
      })
    } else {
      console.log('⚠️ Nenhuma categoria global encontrada!')
    }

    // 3. Verificar categorias específicas por contexto
    console.log('\n3️⃣ CATEGORIAS ESPECÍFICAS POR CONTEXTO...')
    
    // Agrupar por contexto
    const contextGroups = {}
    specificCats.forEach(cat => {
      const contextId = cat.context_id || 'null'
      if (!contextGroups[contextId]) {
        contextGroups[contextId] = []
      }
      contextGroups[contextId].push(cat)
    })

    Object.entries(contextGroups).forEach(([contextId, cats]) => {
      console.log(`\n  Contexto ${contextId}:`)
      cats.forEach(cat => {
        console.log(`    - ${cat.name}: ${cat.is_active ? 'Ativa' : 'Inativa'}`)
      })
    })

    // 4. Verificar contextos existentes
    console.log('\n4️⃣ CONTEXTOS EXISTENTES...')
    
    const { data: contexts, error: contextsError } = await supabase
      .from('contexts')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (contextsError) {
      console.log('❌ Erro ao buscar contextos:', contextsError.message)
    } else {
      console.log('✅ Contextos ativos:', contexts.length)
      contexts.forEach(ctx => {
        console.log(`  - ${ctx.name}: ${ctx.type} (${ctx.id})`)
      })
    }

    // 5. Verificar se há categorias órfãs (sem contexto válido)
    console.log('\n5️⃣ VERIFICANDO CATEGORIAS ÓRFÃS...')
    
    const orphanCats = specificCats.filter(cat => {
      if (!cat.context_id) return true
      return !contexts.some(ctx => ctx.id === cat.context_id)
    })

    if (orphanCats.length > 0) {
      console.log('❌ Categorias órfãs encontradas:', orphanCats.length)
      orphanCats.forEach(cat => {
        console.log(`  - ${cat.name}: context_id ${cat.context_id} (contexto não existe)`)
      })
    } else {
      console.log('✅ Nenhuma categoria órfã encontrada')
    }

    // 6. Testar API de categorias
    console.log('\n6️⃣ TESTANDO API DE CATEGORIAS...')
    
    try {
      // Testar API pública
      console.log('📡 Testando API pública...')
      const publicResponse = await fetch('https://www.ithostbr.tech/api/categories/public?active_only=true')
      const publicData = await publicResponse.json()
      
      if (publicResponse.ok) {
        console.log('✅ API pública funcionando:', publicData.length, 'categorias')
        
        // Verificar se retorna todas as categorias ativas
        const activeCatsFromApi = publicData.filter(cat => cat.is_active)
        console.log(`  - Categorias ativas na API: ${activeCatsFromApi.length}`)
        console.log(`  - Categorias ativas no banco: ${activeCats.length}`)
        
        if (activeCatsFromApi.length === activeCats.length) {
          console.log('✅ API pública sincronizada com banco')
        } else {
          console.log('❌ API pública não está sincronizada com banco')
        }
      } else {
        console.log('❌ API pública com erro:', publicResponse.status, publicData)
      }

      // Testar API dinâmica
      console.log('\n📡 Testando API dinâmica...')
      const dynamicResponse = await fetch('https://www.ithostbr.tech/api/categories/dynamic?active_only=true')
      const dynamicData = await dynamicResponse.json()
      
      if (dynamicResponse.ok) {
        console.log('✅ API dinâmica funcionando:', dynamicData.length, 'categorias')
        
        // Verificar se filtra corretamente
        const globalCatsFromApi = dynamicData.filter(cat => cat.is_global)
        const specificCatsFromApi = dynamicData.filter(cat => !cat.is_global)
        
        console.log(`  - Categorias globais na API: ${globalCatsFromApi.length}`)
        console.log(`  - Categorias específicas na API: ${specificCatsFromApi.length}`)
      } else {
        console.log('❌ API dinâmica com erro:', dynamicResponse.status, dynamicData)
      }

    } catch (error) {
      console.log('❌ Erro ao testar APIs:', error.message)
    }

    // 7. Verificar operações recentes
    console.log('\n7️⃣ VERIFICANDO OPERAÇÕES RECENTES...')
    
    // Buscar categorias criadas recentemente
    const recentCats = allCategories.filter(cat => {
      const createdAt = new Date(cat.created_at)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return createdAt > oneDayAgo
    })

    if (recentCats.length > 0) {
      console.log('✅ Categorias criadas nas últimas 24h:', recentCats.length)
      recentCats.forEach(cat => {
        console.log(`  - ${cat.name}: ${cat.is_global ? 'Global' : 'Específica'} (${cat.created_at})`)
      })
    } else {
      console.log('ℹ️ Nenhuma categoria criada nas últimas 24h')
    }

    // 8. Verificar integridade dos dados
    console.log('\n8️⃣ VERIFICANDO INTEGRIDADE DOS DADOS...')
    
    const issues = []
    
    // Verificar se há categorias sem nome
    const catsWithoutName = allCategories.filter(cat => !cat.name || cat.name.trim() === '')
    if (catsWithoutName.length > 0) {
      issues.push(`❌ ${catsWithoutName.length} categorias sem nome`)
    }
    
    // Verificar se há categorias sem slug
    const catsWithoutSlug = allCategories.filter(cat => !cat.slug || cat.slug.trim() === '')
    if (catsWithoutSlug.length > 0) {
      issues.push(`❌ ${catsWithoutSlug.length} categorias sem slug`)
    }
    
    // Verificar se há categorias específicas sem contexto
    const specificCatsWithoutContext = specificCats.filter(cat => !cat.context_id)
    if (specificCatsWithoutContext.length > 0) {
      issues.push(`❌ ${specificCatsWithoutContext.length} categorias específicas sem contexto`)
    }
    
    // Verificar se há categorias globais com contexto
    const globalCatsWithContext = globalCats.filter(cat => cat.context_id)
    if (globalCatsWithContext.length > 0) {
      issues.push(`❌ ${globalCatsWithContext.length} categorias globais com contexto`)
    }

    if (issues.length > 0) {
      console.log('🚨 PROBLEMAS DE INTEGRIDADE:')
      issues.forEach(issue => console.log(`  ${issue}`))
    } else {
      console.log('✅ Dados íntegros')
    }

    // 9. Diagnóstico final
    console.log('\n9️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO:')
    console.log(`  - Total de categorias: ${allCategories.length}`)
    console.log(`  - Categorias globais: ${globalCats.length}`)
    console.log(`  - Categorias específicas: ${specificCats.length}`)
    console.log(`  - Categorias ativas: ${activeCats.length}`)
    console.log(`  - Categorias inativas: ${inactiveCats.length}`)
    console.log(`  - Contextos ativos: ${contexts?.length || 0}`)
    console.log(`  - Categorias órfãs: ${orphanCats.length}`)
    console.log(`  - Problemas de integridade: ${issues.length}`)

    if (issues.length === 0 && orphanCats.length === 0) {
      console.log('\n✅ SINCRONIZAÇÃO PERFEITA!')
      console.log('A API de categorias está refletindo corretamente no banco de dados.')
    } else {
      console.log('\n⚠️ PROBLEMAS IDENTIFICADOS!')
      console.log('Verificar e corrigir os problemas listados acima.')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

verifyCategoriesApiSync()
