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

async function fixUserContextRemoval() {
  console.log('🔧 CORRIGINDO REMOÇÃO DE CONTEXTO DO USUÁRIO')
  console.log('=' .repeat(60))

  try {
    // 1. Buscar usuário simas@simas.com.br
    console.log('\n1️⃣ BUSCANDO USUÁRIO SIMAS@SIMAS.COM.BR...')
    
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

    // 2. Verificar associações user_contexts
    console.log('\n2️⃣ VERIFICANDO ASSOCIAÇÕES USER_CONTEXTS...')
    
    const { data: userContexts, error: userContextsError } = await supabase
      .from('user_contexts')
      .select('*')
      .eq('user_id', user.id)

    if (userContextsError) {
      console.log('❌ Erro ao buscar associações:', userContextsError.message)
    } else {
      console.log('✅ Associações encontradas:', userContexts.length)
      if (userContexts.length === 0) {
        console.log('✅ Usuário foi desvinculado de todas as organizações!')
      } else {
        console.log('❌ Usuário ainda tem associações:')
        userContexts.forEach(uc => {
          console.log(`  - Context ID: ${uc.context_id}`)
        })
      }
    }

    // 3. Remover context_id do usuário
    console.log('\n3️⃣ REMOVENDO CONTEXT_ID DO USUÁRIO...')
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ context_id: null })
      .eq('id', user.id)

    if (updateError) {
      console.log('❌ Erro ao remover context_id:', updateError.message)
      return
    }

    console.log('✅ Context_id do usuário removido!')

    // 4. Verificar se a atualização foi aplicada
    console.log('\n4️⃣ VERIFICANDO ATUALIZAÇÃO...')
    
    const { data: updatedUser, error: updatedUserError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'simas@simas.com.br')
      .single()

    if (updatedUserError) {
      console.log('❌ Erro ao verificar usuário atualizado:', updatedUserError.message)
    } else {
      console.log('✅ Usuário atualizado:')
      console.log(`  - Email: ${updatedUser.email}`)
      console.log(`  - User Type: ${updatedUser.user_type}`)
      console.log(`  - Context ID: ${updatedUser.context_id || 'null'}`)
      console.log(`  - Role: ${updatedUser.role}`)
    }

    // 5. Verificar categorias que devem aparecer (apenas globais)
    console.log('\n5️⃣ VERIFICANDO CATEGORIAS QUE DEVEM APARECER...')
    
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

    // 6. Testar API de categorias
    console.log('\n6️⃣ TESTANDO API DE CATEGORIAS...')
    
    try {
      const response = await fetch('https://www.ithostbr.tech/api/categories/public?active_only=true')
      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ API funcionando:', data.length, 'categorias')
        
        // Filtrar apenas categorias globais (usuário desvinculado)
        const globalCategories = data.filter(cat => cat.is_global)
        
        console.log('📋 Categorias que devem aparecer para o usuário desvinculado:', globalCategories.length)
        globalCategories.forEach(cat => {
          console.log(`  - ${cat.name}: Global`)
        })
        
        // Verificar se há categorias específicas (não devem aparecer)
        const specificCategories = data.filter(cat => !cat.is_global)
        console.log('⚠️ Categorias específicas que NÃO devem aparecer:', specificCategories.length)
        
        if (specificCategories.length > 0) {
          console.log('❌ PROBLEMA: API ainda está retornando categorias específicas!')
          console.log('🔧 SOLUÇÃO: A API precisa ser corrigida para filtrar por usuário autenticado')
        } else {
          console.log('✅ API está funcionando corretamente (apenas categorias globais)')
        }
      } else {
        console.log('❌ API com erro:', response.status, data)
      }
    } catch (error) {
      console.log('❌ Erro ao testar API:', error.message)
    }

    // 7. Diagnóstico final
    console.log('\n7️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO DAS CORREÇÕES:')
    console.log(`  - Usuário: ${updatedUser.email}`)
    console.log(`  - User Type: ${updatedUser.user_type}`)
    console.log(`  - Context ID: ${updatedUser.context_id || 'null'}`)
    console.log(`  - Associações: ${userContexts?.length || 0}`)
    console.log(`  - Categorias globais: ${globalCats?.length || 0}`)

    if (updatedUser.context_id === null) {
      console.log('\n✅ DESVINCULAÇÃO COMPLETA!')
      console.log('O usuário foi desvinculado de todas as organizações e o context_id foi removido.')
      console.log('Agora o usuário deve ver apenas categorias globais.')
    } else {
      console.log('\n❌ DESVINCULAÇÃO AINDA INCOMPLETA!')
      console.log('Verificar se a atualização foi aplicada corretamente.')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

fixUserContextRemoval()
