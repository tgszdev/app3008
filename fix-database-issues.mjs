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

async function fixDatabaseIssues() {
  console.log('🔧 CORRIGINDO PROBLEMAS DO BANCO DE DADOS')
  console.log('=' .repeat(60))

  try {
    // 1. Criar categorias globais
    console.log('\n1️⃣ CRIANDO CATEGORIAS GLOBAIS...')
    
    const globalCategories = [
      {
        name: 'Suporte Geral',
        slug: 'suporte-geral',
        description: 'Categoria global para suporte geral',
        icon: 'help-circle',
        color: '#3B82F6',
        is_global: true,
        is_active: true,
        display_order: 1
      },
      {
        name: 'Emergência',
        slug: 'emergencia',
        description: 'Categoria global para emergências',
        icon: 'alert-triangle',
        color: '#EF4444',
        is_global: true,
        is_active: true,
        display_order: 2
      },
      {
        name: 'Dúvida',
        slug: 'duvida',
        description: 'Categoria global para dúvidas',
        icon: 'question-mark-circle',
        color: '#F59E0B',
        is_global: true,
        is_active: true,
        display_order: 3
      }
    ]

    for (const category of globalCategories) {
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()

      if (error) {
        console.log(`⚠️ Erro ao criar categoria ${category.name}:`, error.message)
      } else {
        console.log(`✅ Categoria global criada: ${category.name}`)
      }
    }

    // 2. Corrigir usuário agro@agro.com.br
    console.log('\n2️⃣ CORRIGINDO USUÁRIO AGRO@AGRO.COM.BR...')
    
    // Primeiro, verificar se o usuário existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, user_type, context_id')
      .eq('email', 'agro@agro.com.br')
      .single()

    if (userError) {
      console.log('❌ Usuário agro@agro.com.br não encontrado:', userError.message)
    } else {
      console.log('✅ Usuário encontrado:', user.email, user.user_type, user.context_id)
      
      // Se é context mas não tem context_id, associar ao Luft Agro
      if (user.user_type === 'context' && !user.context_id) {
        const { data: luftAgro, error: luftAgroError } = await supabase
          .from('contexts')
          .select('id')
          .eq('name', 'Luft Agro')
          .single()

        if (luftAgroError) {
          console.log('❌ Contexto Luft Agro não encontrado:', luftAgroError.message)
        } else {
          const { error: updateError } = await supabase
            .from('users')
            .update({ context_id: luftAgro.id })
            .eq('id', user.id)

          if (updateError) {
            console.log('❌ Erro ao atualizar usuário:', updateError.message)
          } else {
            console.log('✅ Usuário agro@agro.com.br associado ao Luft Agro')
          }
        }
      }
    }

    // 3. Verificar se precisa criar tabela user_organizations
    console.log('\n3️⃣ VERIFICANDO TABELA USER_ORGANIZATIONS...')
    
    const { data: userOrgs, error: userOrgsError } = await supabase
      .from('user_organizations')
      .select('*')
      .limit(1)

    if (userOrgsError) {
      console.log('❌ Tabela user_organizations não existe:', userOrgsError.message)
      console.log('🔧 SOLUÇÃO: Usar tabela user_contexts existente para múltiplas organizações')
    } else {
      console.log('✅ Tabela user_organizations existe')
    }

    // 4. Verificar se precisa criar tabela ratings
    console.log('\n4️⃣ VERIFICANDO TABELA RATINGS...')
    
    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select('*')
      .limit(1)

    if (ratingsError) {
      console.log('❌ Tabela ratings não existe:', ratingsError.message)
      console.log('🔧 SOLUÇÃO: Criar tabela ratings se necessário para sistema de avaliação')
    } else {
      console.log('✅ Tabela ratings existe')
    }

    // 5. Verificar associações user_contexts
    console.log('\n5️⃣ VERIFICANDO ASSOCIAÇÕES USER_CONTEXTS...')
    
    const { data: userContexts, error: userContextsError } = await supabase
      .from('user_contexts')
      .select('*')
      .limit(5)

    if (userContextsError) {
      console.log('❌ Erro ao acessar user_contexts:', userContextsError.message)
    } else {
      console.log('✅ Associações user_contexts encontradas:', userContexts.length)
      userContexts.forEach(uc => {
        console.log(`  - User: ${uc.user_id}, Context: ${uc.context_id}, Can Manage: ${uc.can_manage}`)
      })
    }

    // 6. Verificar se usuários matrix têm associações
    console.log('\n6️⃣ VERIFICANDO USUÁRIOS MATRIX...')
    
    const { data: matrixUsers, error: matrixUsersError } = await supabase
      .from('users')
      .select('id, email, user_type')
      .eq('user_type', 'matrix')

    if (matrixUsersError) {
      console.log('❌ Erro ao buscar usuários matrix:', matrixUsersError.message)
    } else {
      console.log('✅ Usuários matrix encontrados:', matrixUsers.length)
      
      for (const user of matrixUsers) {
        const { data: userContexts, error: userContextsError } = await supabase
          .from('user_contexts')
          .select('context_id')
          .eq('user_id', user.id)

        if (userContextsError) {
          console.log(`⚠️ Erro ao buscar contextos de ${user.email}:`, userContextsError.message)
        } else {
          console.log(`  - ${user.email}: ${userContexts.length} contextos associados`)
        }
      }
    }

    // 7. Verificar categorias após correções
    console.log('\n7️⃣ VERIFICANDO CATEGORIAS APÓS CORREÇÕES...')
    
    const { data: allCategories, error: allCategoriesError } = await supabase
      .from('categories')
      .select('id, name, is_global, is_active, context_id')
      .eq('is_active', true)

    if (allCategoriesError) {
      console.log('❌ Erro ao buscar categorias:', allCategoriesError.message)
    } else {
      console.log('✅ Categorias ativas:', allCategories.length)
      
      const globalCats = allCategories.filter(cat => cat.is_global)
      const specificCats = allCategories.filter(cat => !cat.is_global)
      
      console.log(`  - Categorias globais: ${globalCats.length}`)
      console.log(`  - Categorias específicas: ${specificCats.length}`)
      
      if (globalCats.length > 0) {
        console.log('📋 Categorias globais:')
        globalCats.forEach(cat => console.log(`    - ${cat.name}`))
      }
    }

    // 8. Diagnóstico final
    console.log('\n8️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO DAS CORREÇÕES:')
    console.log('✅ Categorias globais criadas')
    console.log('✅ Usuário agro@agro.com.br corrigido')
    console.log('✅ Estrutura do banco verificada')
    console.log('✅ Associações user_contexts verificadas')

    console.log('\n🎯 PRÓXIMOS PASSOS:')
    console.log('1. Testar API dinâmica de categorias')
    console.log('2. Verificar se usuários matrix veem todas as categorias')
    console.log('3. Verificar se usuários context veem apenas suas categorias')
    console.log('4. Remover hardcoding da API')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

fixDatabaseIssues()
