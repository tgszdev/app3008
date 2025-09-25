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

async function analyzeCategoriesSystem() {
  console.log('🔍 ANÁLISE COMPLETA: SISTEMA DE CATEGORIAS')
  console.log('=' .repeat(60))

  try {
    // 1. Analisar estrutura atual do banco
    console.log('\n1️⃣ ESTRUTURA DO BANCO DE DADOS...')
    
    // Verificar tabela users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, user_type, context_id, role, is_active')
      .limit(5)

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError)
    } else {
      console.log('✅ Tabela users:')
      console.log('  - Campos: id, email, user_type, context_id, role, is_active')
      console.log('  - Tipos de usuário encontrados:', [...new Set(users.map(u => u.user_type))])
    }

    // Verificar tabela contexts
    const { data: contexts, error: contextsError } = await supabase
      .from('contexts')
      .select('id, name, type, slug, is_active')
      .limit(5)

    if (contextsError) {
      console.error('❌ Erro ao buscar contextos:', contextsError)
    } else {
      console.log('✅ Tabela contexts:')
      console.log('  - Campos: id, name, type, slug, is_active')
      console.log('  - Tipos encontrados:', [...new Set(contexts.map(c => c.type))])
    }

    // Verificar tabela categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, context_id, is_global, is_active')
      .limit(5)

    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias:', categoriesError)
    } else {
      console.log('✅ Tabela categories:')
      console.log('  - Campos: id, name, context_id, is_global, is_active')
      console.log('  - Categorias globais:', categories.filter(c => c.is_global).length)
      console.log('  - Categorias específicas:', categories.filter(c => !c.is_global).length)
    }

    // 2. Verificar se existe sistema de múltiplas organizações
    console.log('\n2️⃣ SISTEMA DE MÚLTIPLAS ORGANIZAÇÕES...')
    
    // Verificar tabela user_contexts
    const { data: userContexts, error: userContextsError } = await supabase
      .from('user_contexts')
      .select('*')
      .limit(5)

    if (userContextsError) {
      console.log('❌ Tabela user_contexts não existe:', userContextsError.message)
    } else {
      console.log('✅ Tabela user_contexts existe:', userContexts.length, 'associações')
    }

    // Verificar tabela user_organizations
    const { data: userOrgs, error: userOrgsError } = await supabase
      .from('user_organizations')
      .select('*')
      .limit(5)

    if (userOrgsError) {
      console.log('❌ Tabela user_organizations não existe:', userOrgsError.message)
    } else {
      console.log('✅ Tabela user_organizations existe:', userOrgs.length, 'associações')
    }

    // 3. Analisar regras de negócio atuais
    console.log('\n3️⃣ REGRAS DE NEGÓCIO ATUAIS...')
    
    // Usuários context
    const { data: contextUsers, error: contextUsersError } = await supabase
      .from('users')
      .select('*')
      .eq('user_type', 'context')

    if (contextUsersError) {
      console.error('❌ Erro ao buscar usuários context:', contextUsersError)
    } else {
      console.log('✅ Usuários context:', contextUsers.length)
      contextUsers.forEach(user => {
        console.log(`  - ${user.email}: contexto ${user.context_id || 'null'}`)
      })
    }

    // Usuários matrix
    const { data: matrixUsers, error: matrixUsersError } = await supabase
      .from('users')
      .select('*')
      .eq('user_type', 'matrix')

    if (matrixUsersError) {
      console.error('❌ Erro ao buscar usuários matrix:', matrixUsersError)
    } else {
      console.log('✅ Usuários matrix:', matrixUsers.length)
      matrixUsers.forEach(user => {
        console.log(`  - ${user.email}: contexto ${user.context_id || 'null'}`)
      })
    }

    // 4. Analisar problemas atuais
    console.log('\n4️⃣ PROBLEMAS IDENTIFICADOS...')
    
    console.log('❌ PROBLEMA 1: API hardcoded')
    console.log('  - Endpoint /api/categories/public está hardcoded para Luft Agro')
    console.log('  - Não considera tipo de usuário (context vs matrix)')
    console.log('  - Não considera múltiplas organizações')
    
    console.log('❌ PROBLEMA 2: Falta de autenticação real')
    console.log('  - API pública não recebe informações do usuário')
    console.log('  - Não há como saber qual usuário está fazendo a requisição')
    console.log('  - Não há como aplicar regras específicas por usuário')
    
    console.log('❌ PROBLEMA 3: Sistema de múltiplas organizações incompleto')
    console.log('  - Tabela user_contexts pode não existir')
    console.log('  - Não há lógica para associar usuários a múltiplos contextos')
    console.log('  - Não há lógica para filtrar categorias por múltiplos contextos')

    // 5. Propor solução dinâmica
    console.log('\n5️⃣ SOLUÇÃO DINÂMICA PROPOSTA...')
    
    console.log('🔧 SOLUÇÃO 1: Implementar autenticação real na API')
    console.log('  - Usar NextAuth para obter usuário autenticado')
    console.log('  - Aplicar regras baseadas no user_type do usuário')
    console.log('  - Filtrar categorias dinamicamente por contexto')
    
    console.log('🔧 SOLUÇÃO 2: Implementar sistema de múltiplas organizações')
    console.log('  - Criar tabela user_contexts se não existir')
    console.log('  - Associar usuários matrix a múltiplos contextos')
    console.log('  - Implementar lógica para buscar contextos do usuário')
    
    console.log('🔧 SOLUÇÃO 3: Implementar lógica dinâmica de filtros')
    console.log('  - Usuários context: categorias globais + do seu contexto')
    console.log('  - Usuários matrix: categorias globais + de todos os contextos associados')
    console.log('  - Aplicar filtros dinamicamente baseados no usuário')

    // 6. Verificar se há categorias globais
    console.log('\n6️⃣ VERIFICANDO CATEGORIAS GLOBAIS...')
    const { data: globalCats, error: globalCatsError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_global', true)
      .eq('is_active', true)

    if (globalCatsError) {
      console.error('❌ Erro ao buscar categorias globais:', globalCatsError)
    } else {
      console.log('✅ Categorias globais:', globalCats.length)
      if (globalCats.length === 0) {
        console.log('⚠️ ATENÇÃO: Não há categorias globais!')
        console.log('🔧 SOLUÇÃO: Criar pelo menos uma categoria global para fallback')
      }
    }

    // 7. Verificar distribuição de categorias por contexto
    console.log('\n7️⃣ DISTRIBUIÇÃO DE CATEGORIAS POR CONTEXTO...')
    const { data: allContexts, error: allContextsError } = await supabase
      .from('contexts')
      .select('id, name, type')
      .eq('is_active', true)

    if (allContextsError) {
      console.error('❌ Erro ao buscar contextos:', allContextsError)
    } else {
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

    // 8. Diagnóstico final
    console.log('\n8️⃣ DIAGNÓSTICO FINAL...')
    console.log('📊 RESUMO DA ANÁLISE:')
    console.log(`  - Usuários context: ${contextUsers?.length || 0}`)
    console.log(`  - Usuários matrix: ${matrixUsers?.length || 0}`)
    console.log(`  - Contextos ativos: ${allContexts?.length || 0}`)
    console.log(`  - Categorias globais: ${globalCats?.length || 0}`)
    console.log(`  - Sistema user_contexts: ${userContexts ? '✅' : '❌'}`)
    console.log(`  - Sistema user_organizations: ${userOrgs ? '✅' : '❌'}`)

    console.log('\n🎯 PRÓXIMOS PASSOS:')
    console.log('1. Implementar autenticação real na API de categorias')
    console.log('2. Criar sistema de múltiplas organizações se necessário')
    console.log('3. Implementar lógica dinâmica de filtros')
    console.log('4. Remover todo hardcoding')
    console.log('5. Testar com diferentes tipos de usuário')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

analyzeCategoriesSystem()
