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

async function analyzeDatabaseStructure() {
  console.log('🔍 ANÁLISE COMPLETA DA ESTRUTURA DO BANCO')
  console.log('=' .repeat(60))

  try {
    // 1. Verificar todas as tabelas existentes
    console.log('\n1️⃣ TABELAS EXISTENTES...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name')

    if (tablesError) {
      console.error('❌ Erro ao buscar tabelas:', tablesError)
    } else {
      console.log('✅ Tabelas encontradas:', tables.length)
      tables.forEach(table => {
        console.log(`  - ${table.table_name} (${table.table_type})`)
      })
    }

    // 2. Verificar estrutura da tabela users
    console.log('\n2️⃣ ESTRUTURA DA TABELA USERS...')
    const { data: userColumns, error: userColumnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'users')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    if (userColumnsError) {
      console.error('❌ Erro ao buscar colunas da tabela users:', userColumnsError)
    } else {
      console.log('✅ Colunas da tabela users:')
      userColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
      })
    }

    // 3. Verificar estrutura da tabela contexts
    console.log('\n3️⃣ ESTRUTURA DA TABELA CONTEXTS...')
    const { data: contextColumns, error: contextColumnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'contexts')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    if (contextColumnsError) {
      console.error('❌ Erro ao buscar colunas da tabela contexts:', contextColumnsError)
    } else {
      console.log('✅ Colunas da tabela contexts:')
      contextColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
      })
    }

    // 4. Verificar estrutura da tabela categories
    console.log('\n4️⃣ ESTRUTURA DA TABELA CATEGORIES...')
    const { data: categoryColumns, error: categoryColumnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'categories')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    if (categoryColumnsError) {
      console.error('❌ Erro ao buscar colunas da tabela categories:', categoryColumnsError)
    } else {
      console.log('✅ Colunas da tabela categories:')
      categoryColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
      })
    }

    // 5. Verificar se existe tabela user_contexts
    console.log('\n5️⃣ VERIFICANDO TABELA USER_CONTEXTS...')
    const { data: userContexts, error: userContextsError } = await supabase
      .from('user_contexts')
      .select('*')
      .limit(1)

    if (userContextsError) {
      console.log('❌ Tabela user_contexts não existe ou erro:', userContextsError.message)
    } else {
      console.log('✅ Tabela user_contexts existe')
      
      // Verificar estrutura da tabela user_contexts
      const { data: userContextColumns, error: userContextColumnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'user_contexts')
        .eq('table_schema', 'public')
        .order('ordinal_position')

      if (userContextColumnsError) {
        console.error('❌ Erro ao buscar colunas da tabela user_contexts:', userContextColumnsError)
      } else {
        console.log('✅ Colunas da tabela user_contexts:')
        userContextColumns.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
        })
      }
    }

    // 6. Verificar se existe tabela user_organizations
    console.log('\n6️⃣ VERIFICANDO TABELA USER_ORGANIZATIONS...')
    const { data: userOrgs, error: userOrgsError } = await supabase
      .from('user_organizations')
      .select('*')
      .limit(1)

    if (userOrgsError) {
      console.log('❌ Tabela user_organizations não existe ou erro:', userOrgsError.message)
    } else {
      console.log('✅ Tabela user_organizations existe')
    }

    // 7. Verificar relacionamentos (foreign keys)
    console.log('\n7️⃣ VERIFICANDO RELACIONAMENTOS (FOREIGN KEYS)...')
    const { data: foreignKeys, error: foreignKeysError } = await supabase
      .from('information_schema.key_column_usage')
      .select('table_name, column_name, referenced_table_name, referenced_column_name')
      .eq('table_schema', 'public')
      .not('referenced_table_name', 'is', null)
      .order('table_name')

    if (foreignKeysError) {
      console.error('❌ Erro ao buscar foreign keys:', foreignKeysError)
    } else {
      console.log('✅ Foreign keys encontradas:')
      foreignKeys.forEach(fk => {
        console.log(`  - ${fk.table_name}.${fk.column_name} -> ${fk.referenced_table_name}.${fk.referenced_column_name}`)
      })
    }

    // 8. Verificar índices
    console.log('\n8️⃣ VERIFICANDO ÍNDICES...')
    const { data: indexes, error: indexesError } = await supabase
      .from('pg_indexes')
      .select('tablename, indexname, indexdef')
      .eq('schemaname', 'public')
      .order('tablename')

    if (indexesError) {
      console.error('❌ Erro ao buscar índices:', indexesError)
    } else {
      console.log('✅ Índices encontrados:')
      indexes.forEach(idx => {
        console.log(`  - ${idx.tablename}: ${idx.indexname}`)
      })
    }

    // 9. Verificar políticas RLS
    console.log('\n9️⃣ VERIFICANDO POLÍTICAS RLS...')
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, permissive, roles, cmd, qual')
      .eq('schemaname', 'public')
      .order('tablename')

    if (policiesError) {
      console.error('❌ Erro ao buscar políticas RLS:', policiesError)
    } else {
      console.log('✅ Políticas RLS encontradas:')
      policies.forEach(policy => {
        console.log(`  - ${policy.tablename}: ${policy.policyname} (${policy.cmd})`)
      })
    }

    // 10. Verificar dados de exemplo
    console.log('\n🔟 VERIFICANDO DADOS DE EXEMPLO...')
    
    // Usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, user_type, context_id')
      .limit(3)

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError)
    } else {
      console.log('✅ Usuários de exemplo:')
      users.forEach(user => {
        console.log(`  - ${user.email}: ${user.user_type} (context: ${user.context_id || 'null'})`)
      })
    }

    // Contextos
    const { data: contexts, error: contextsError } = await supabase
      .from('contexts')
      .select('id, name, type, is_active')
      .limit(3)

    if (contextsError) {
      console.error('❌ Erro ao buscar contextos:', contextsError)
    } else {
      console.log('✅ Contextos de exemplo:')
      contexts.forEach(ctx => {
        console.log(`  - ${ctx.name}: ${ctx.type} (ativo: ${ctx.is_active})`)
      })
    }

    // Categorias
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, context_id, is_global, is_active')
      .limit(3)

    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias:', categoriesError)
    } else {
      console.log('✅ Categorias de exemplo:')
      categories.forEach(cat => {
        console.log(`  - ${cat.name}: ${cat.is_global ? 'Global' : 'Específica'} (context: ${cat.context_id || 'null'})`)
      })
    }

    // 11. Diagnóstico final
    console.log('\n1️⃣1️⃣ DIAGNÓSTICO FINAL...')
    
    const issues = []
    
    // Verificar se user_contexts existe
    if (userContextsError) {
      issues.push('❌ Tabela user_contexts não existe - necessária para múltiplas organizações')
    }
    
    // Verificar se user_organizations existe
    if (userOrgsError) {
      issues.push('❌ Tabela user_organizations não existe - alternativa para múltiplas organizações')
    }
    
    // Verificar se há categorias globais
    const { data: globalCats, error: globalCatsError } = await supabase
      .from('categories')
      .select('id')
      .eq('is_global', true)
      .eq('is_active', true)

    if (globalCatsError || globalCats.length === 0) {
      issues.push('❌ Não há categorias globais - necessárias para fallback')
    }
    
    // Verificar se há usuários sem contexto
    const { data: usersWithoutContext, error: usersWithoutContextError } = await supabase
      .from('users')
      .select('id, email, user_type, context_id')
      .eq('user_type', 'context')
      .is('context_id', null)

    if (usersWithoutContextError) {
      console.log('⚠️ Erro ao verificar usuários sem contexto:', usersWithoutContextError.message)
    } else if (usersWithoutContext.length > 0) {
      issues.push(`❌ ${usersWithoutContext.length} usuários context sem contexto associado`)
    }

    console.log('📊 RESUMO DA ANÁLISE:')
    console.log(`  - Tabelas encontradas: ${tables?.length || 0}`)
    console.log(`  - Foreign keys: ${foreignKeys?.length || 0}`)
    console.log(`  - Índices: ${indexes?.length || 0}`)
    console.log(`  - Políticas RLS: ${policies?.length || 0}`)
    console.log(`  - Usuários: ${users?.length || 0}`)
    console.log(`  - Contextos: ${contexts?.length || 0}`)
    console.log(`  - Categorias: ${categories?.length || 0}`)
    console.log(`  - Categorias globais: ${globalCats?.length || 0}`)

    if (issues.length > 0) {
      console.log('\n🚨 PROBLEMAS IDENTIFICADOS:')
      issues.forEach(issue => console.log(`  ${issue}`))
    } else {
      console.log('\n✅ ESTRUTURA DO BANCO OK')
    }

    console.log('\n🎯 RECOMENDAÇÕES:')
    if (userContextsError) {
      console.log('1. Criar tabela user_contexts para múltiplas organizações')
    }
    if (globalCats?.length === 0) {
      console.log('2. Criar pelo menos uma categoria global')
    }
    if (usersWithoutContext?.length > 0) {
      console.log('3. Associar usuários context a contextos específicos')
    }
    console.log('4. Implementar autenticação real na API')
    console.log('5. Remover hardcoding da API de categorias')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

analyzeDatabaseStructure()
