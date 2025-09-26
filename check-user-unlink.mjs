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

async function checkUserUnlink() {
  console.log('🔍 VERIFICANDO DESVINCULAÇÃO DO USUÁRIO SIMAS@SIMAS.COM.BR')
  console.log('=' .repeat(70))

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

    // 2. Verificar associações user_contexts
    console.log('\n2️⃣ ASSOCIAÇÕES USER_CONTEXTS...')
    
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
          console.log(`  - Can Manage: ${uc.can_manage}`)
          console.log(`  - Created: ${uc.created_at}`)
        })
      }
    }

    // 3. Verificar se context_id foi removido
    console.log('\n3️⃣ VERIFICANDO CONTEXT_ID DO USUÁRIO...')
    
    if (user.context_id === null) {
      console.log('✅ Context_id foi removido (null)')
    } else {
      console.log('❌ Context_id ainda existe:', user.context_id)
      console.log('🔧 SOLUÇÃO: Remover context_id do usuário')
    }

    // 4. Verificar todas as organizações/contextos
    console.log('\n4️⃣ VERIFICANDO TODAS AS ORGANIZAÇÕES...')
    
    const { data: allContexts, error: allContextsError } = await supabase
      .from('contexts')
      .select('*')
      .eq('type', 'organization')
      .eq('is_active', true)

    if (allContextsError) {
      console.log('❌ Erro ao buscar organizações:', allContextsError.message)
    } else {
      console.log('✅ Organizações encontradas:', allContexts.length)
      allContexts.forEach(ctx => {
        console.log(`  - ${ctx.name}: ${ctx.id}`)
      })
    }

    // 5. Verificar se o usuário está associado a alguma organização
    console.log('\n5️⃣ VERIFICANDO ASSOCIAÇÕES COM ORGANIZAÇÕES...')
    
    if (userContexts && userContexts.length > 0) {
      for (const uc of userContexts) {
        const { data: context, error: contextError } = await supabase
          .from('contexts')
          .select('*')
          .eq('id', uc.context_id)
          .single()

        if (contextError) {
          console.log(`❌ Erro ao buscar contexto ${uc.context_id}:`, contextError.message)
        } else {
          console.log(`❌ Usuário ainda associado a: ${context.name} (${context.type})`)
        }
      }
    } else {
      console.log('✅ Usuário não está associado a nenhuma organização')
    }

    // 6. Verificar categorias que devem aparecer (apenas globais)
    console.log('\n6️⃣ VERIFICANDO CATEGORIAS QUE DEVEM APARECER...')
    
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

    // Categorias específicas (não devem aparecer)
    const { data: specificCats, error: specificCatsError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_global', false)
      .eq('is_active', true)

    if (specificCatsError) {
      console.log('❌ Erro ao buscar categorias específicas:', specificCatsError.message)
    } else {
      console.log('✅ Categorias específicas:', specificCats.length)
      console.log('⚠️ Estas categorias NÃO devem aparecer para o usuário desvinculado')
    }

    // 7. Testar API de categorias
    console.log('\n7️⃣ TESTANDO API DE CATEGORIAS...')
    
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
          console.log('❌ PROBLEMA: API está retornando categorias específicas para usuário desvinculado!')
          specificCategories.slice(0, 3).forEach(cat => {
            console.log(`  - ${cat.name}: ${cat.context_id}`)
          })
        } else {
          console.log('✅ API está funcionando corretamente (apenas categorias globais)')
        }
      } else {
        console.log('❌ API com erro:', response.status, data)
      }
    } catch (error) {
      console.log('❌ Erro ao testar API:', error.message)
    }

    // 8. Diagnóstico final
    console.log('\n8️⃣ DIAGNÓSTICO FINAL...')
    
    const issues = []
    const solutions = []
    
    if (user.context_id !== null) {
      issues.push('❌ Usuário ainda tem context_id')
      solutions.push('🔧 Remover context_id do usuário')
    }
    
    if (userContexts && userContexts.length > 0) {
      issues.push('❌ Usuário ainda tem associações user_contexts')
      solutions.push('🔧 Remover associações user_contexts')
    }

    console.log('📊 RESUMO:')
    console.log(`  - Usuário: ${user.email}`)
    console.log(`  - User Type: ${user.user_type}`)
    console.log(`  - Context ID: ${user.context_id || 'null'}`)
    console.log(`  - Associações: ${userContexts?.length || 0}`)
    console.log(`  - Categorias globais: ${globalCats?.length || 0}`)
    console.log(`  - Categorias específicas: ${specificCats?.length || 0}`)

    if (issues.length > 0) {
      console.log('\n🚨 PROBLEMAS IDENTIFICADOS:')
      issues.forEach(issue => console.log(`  ${issue}`))
      
      console.log('\n🔧 SOLUÇÕES NECESSÁRIAS:')
      solutions.forEach(solution => console.log(`  ${solution}`))
      
      console.log('\n⚠️ CONCLUSÃO:')
      console.log('A desvinculação via frontend NÃO foi refletida corretamente no banco de dados!')
    } else {
      console.log('\n✅ DESVINCULAÇÃO REALIZADA COM SUCESSO!')
      console.log('O usuário foi desvinculado de todas as organizações e o banco foi atualizado corretamente.')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

checkUserUnlink()
