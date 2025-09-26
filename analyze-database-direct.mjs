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

async function analyzeDatabaseDirect() {
  console.log('🔍 ANÁLISE DIRETA DA ESTRUTURA DO BANCO')
  console.log('=' .repeat(60))

  try {
    // 1. Verificar tabelas existentes testando cada uma
    console.log('\n1️⃣ VERIFICANDO TABELAS EXISTENTES...')
    
    const tablesToCheck = [
      'users', 'contexts', 'categories', 'tickets', 'comments', 'attachments',
      'user_contexts', 'user_organizations', 'escalation_actions', 'kb_articles',
      'timesheets', 'ratings', 'notifications', 'sessions', 'ticket_history'
    ]

    const existingTables = []
    const missingTables = []

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)

        if (error) {
          if (error.message.includes('Could not find the table')) {
            missingTables.push(table)
          } else {
            console.log(`⚠️ Tabela ${table} existe mas com erro:`, error.message)
            existingTables.push(table)
          }
        } else {
          existingTables.push(table)
        }
      } catch (err) {
        missingTables.push(table)
      }
    }

    console.log('✅ Tabelas existentes:', existingTables.length)
    existingTables.forEach(table => console.log(`  - ${table}`))
    
    console.log('❌ Tabelas faltantes:', missingTables.length)
    missingTables.forEach(table => console.log(`  - ${table}`))

    // 2. Verificar estrutura da tabela users
    console.log('\n2️⃣ ESTRUTURA DA TABELA USERS...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (usersError) {
      console.error('❌ Erro ao acessar tabela users:', usersError)
    } else {
      console.log('✅ Tabela users acessível')
      if (users.length > 0) {
        console.log('📋 Campos da tabela users:')
        Object.keys(users[0]).forEach(field => {
          console.log(`  - ${field}: ${typeof users[0][field]}`)
        })
      }
    }

    // 3. Verificar estrutura da tabela contexts
    console.log('\n3️⃣ ESTRUTURA DA TABELA CONTEXTS...')
    const { data: contexts, error: contextsError } = await supabase
      .from('contexts')
      .select('*')
      .limit(1)

    if (contextsError) {
      console.error('❌ Erro ao acessar tabela contexts:', contextsError)
    } else {
      console.log('✅ Tabela contexts acessível')
      if (contexts.length > 0) {
        console.log('📋 Campos da tabela contexts:')
        Object.keys(contexts[0]).forEach(field => {
          console.log(`  - ${field}: ${typeof contexts[0][field]}`)
        })
      }
    }

    // 4. Verificar estrutura da tabela categories
    console.log('\n4️⃣ ESTRUTURA DA TABELA CATEGORIES...')
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(1)

    if (categoriesError) {
      console.error('❌ Erro ao acessar tabela categories:', categoriesError)
    } else {
      console.log('✅ Tabela categories acessível')
      if (categories.length > 0) {
        console.log('📋 Campos da tabela categories:')
        Object.keys(categories[0]).forEach(field => {
          console.log(`  - ${field}: ${typeof categories[0][field]}`)
        })
      }
    }

    // 5. Verificar tabela user_contexts
    console.log('\n5️⃣ VERIFICANDO TABELA USER_CONTEXTS...')
    const { data: userContexts, error: userContextsError } = await supabase
      .from('user_contexts')
      .select('*')
      .limit(1)

    if (userContextsError) {
      console.log('❌ Tabela user_contexts não existe:', userContextsError.message)
    } else {
      console.log('✅ Tabela user_contexts existe')
      if (userContexts.length > 0) {
        console.log('📋 Campos da tabela user_contexts:')
        Object.keys(userContexts[0]).forEach(field => {
          console.log(`  - ${field}: ${typeof userContexts[0][field]}`)
        })
      }
    }

    // 6. Verificar dados de exemplo
    console.log('\n6️⃣ DADOS DE EXEMPLO...')
    
    // Usuários
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, email, user_type, context_id, role, is_active')
      .limit(5)

    if (allUsersError) {
      console.error('❌ Erro ao buscar usuários:', allUsersError)
    } else {
      console.log('✅ Usuários encontrados:', allUsers.length)
      allUsers.forEach(user => {
        console.log(`  - ${user.email}: ${user.user_type} (context: ${user.context_id || 'null'})`)
      })
    }

    // Contextos
    const { data: allContexts, error: allContextsError } = await supabase
      .from('contexts')
      .select('id, name, type, slug, is_active')
      .limit(5)

    if (allContextsError) {
      console.error('❌ Erro ao buscar contextos:', allContextsError)
    } else {
      console.log('✅ Contextos encontrados:', allContexts.length)
      allContexts.forEach(ctx => {
        console.log(`  - ${ctx.name}: ${ctx.type} (ativo: ${ctx.is_active})`)
      })
    }

    // Categorias
    const { data: allCategories, error: allCategoriesError } = await supabase
      .from('categories')
      .select('id, name, context_id, is_global, is_active')
      .limit(5)

    if (allCategoriesError) {
      console.error('❌ Erro ao buscar categorias:', allCategoriesError)
    } else {
      console.log('✅ Categorias encontradas:', allCategories.length)
      allCategories.forEach(cat => {
        console.log(`  - ${cat.name}: ${cat.is_global ? 'Global' : 'Específica'} (context: ${cat.context_id || 'null'})`)
      })
    }

    // 7. Verificar categorias globais
    console.log('\n7️⃣ VERIFICANDO CATEGORIAS GLOBAIS...')
    const { data: globalCats, error: globalCatsError } = await supabase
      .from('categories')
      .select('id, name, is_global, is_active')
      .eq('is_global', true)
      .eq('is_active', true)

    if (globalCatsError) {
      console.error('❌ Erro ao buscar categorias globais:', globalCatsError)
    } else {
      console.log('✅ Categorias globais:', globalCats.length)
      if (globalCats.length === 0) {
        console.log('⚠️ ATENÇÃO: Não há categorias globais!')
      } else {
        globalCats.forEach(cat => {
          console.log(`  - ${cat.name}`)
        })
      }
    }

    // 8. Verificar usuários sem contexto
    console.log('\n8️⃣ VERIFICANDO USUÁRIOS SEM CONTEXTO...')
    const { data: usersWithoutContext, error: usersWithoutContextError } = await supabase
      .from('users')
      .select('id, email, user_type, context_id')
      .eq('user_type', 'context')
      .is('context_id', null)

    if (usersWithoutContextError) {
      console.log('⚠️ Erro ao verificar usuários sem contexto:', usersWithoutContextError.message)
    } else {
      console.log('✅ Usuários context sem contexto:', usersWithoutContext.length)
      if (usersWithoutContext.length > 0) {
        usersWithoutContext.forEach(user => {
          console.log(`  - ${user.email}: ${user.user_type} (context: ${user.context_id || 'null'})`)
        })
      }
    }

    // 9. Verificar distribuição de categorias por contexto
    console.log('\n9️⃣ DISTRIBUIÇÃO DE CATEGORIAS POR CONTEXTO...')
    if (allContexts && allContexts.length > 0) {
      for (const context of allContexts) {
        const { data: contextCats, error: contextCatsError } = await supabase
          .from('categories')
          .select('id, name')
          .eq('context_id', context.id)
          .eq('is_active', true)

        if (contextCatsError) {
          console.log(`❌ Erro ao buscar categorias de ${context.name}:`, contextCatsError.message)
        } else {
          console.log(`✅ ${context.name}: ${contextCats.length} categorias`)
        }
      }
    }

    // 10. Diagnóstico final
    console.log('\n🔟 DIAGNÓSTICO FINAL...')
    
    const issues = []
    const recommendations = []
    
    // Verificar se user_contexts existe
    if (userContextsError) {
      issues.push('❌ Tabela user_contexts não existe - necessária para múltiplas organizações')
      recommendations.push('🔧 Criar tabela user_contexts para associar usuários matrix a múltiplos contextos')
    }
    
    // Verificar se há categorias globais
    if (globalCats?.length === 0) {
      issues.push('❌ Não há categorias globais - necessárias para fallback')
      recommendations.push('🔧 Criar pelo menos uma categoria global')
    }
    
    // Verificar se há usuários sem contexto
    if (usersWithoutContext?.length > 0) {
      issues.push(`❌ ${usersWithoutContext.length} usuários context sem contexto associado`)
      recommendations.push('🔧 Associar usuários context a contextos específicos')
    }

    console.log('📊 RESUMO DA ANÁLISE:')
    console.log(`  - Tabelas existentes: ${existingTables.length}`)
    console.log(`  - Tabelas faltantes: ${missingTables.length}`)
    console.log(`  - Usuários: ${allUsers?.length || 0}`)
    console.log(`  - Contextos: ${allContexts?.length || 0}`)
    console.log(`  - Categorias: ${allCategories?.length || 0}`)
    console.log(`  - Categorias globais: ${globalCats?.length || 0}`)
    console.log(`  - Usuários sem contexto: ${usersWithoutContext?.length || 0}`)

    if (issues.length > 0) {
      console.log('\n🚨 PROBLEMAS IDENTIFICADOS:')
      issues.forEach(issue => console.log(`  ${issue}`))
    } else {
      console.log('\n✅ ESTRUTURA DO BANCO OK')
    }

    if (recommendations.length > 0) {
      console.log('\n🎯 RECOMENDAÇÕES:')
      recommendations.forEach(rec => console.log(`  ${rec}`))
    }

    // 11. Verificar se há tickets
    console.log('\n1️⃣1️⃣ VERIFICANDO TABELA TICKETS...')
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, title, status, priority, context_id')
      .limit(3)

    if (ticketsError) {
      console.log('❌ Erro ao acessar tabela tickets:', ticketsError.message)
    } else {
      console.log('✅ Tabela tickets acessível:', tickets.length, 'tickets encontrados')
      if (tickets.length > 0) {
        tickets.forEach(ticket => {
          console.log(`  - ${ticket.title}: ${ticket.status} (context: ${ticket.context_id || 'null'})`)
        })
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

analyzeDatabaseDirect()
