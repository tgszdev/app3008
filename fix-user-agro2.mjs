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

async function fixUserAgro2() {
  console.log('🔧 CORRIGINDO USUÁRIO agro2@agro.com.br')
  console.log('=' .repeat(50))

  try {
    // 1. Verificar contextos disponíveis
    console.log('\n1️⃣ VERIFICANDO CONTEXTOS DISPONÍVEIS...')
    const { data: contexts, error: contextsError } = await supabase
      .from('contexts')
      .select('*')
      .eq('is_active', true)

    if (contextsError) {
      console.error('❌ Erro ao buscar contextos:', contextsError)
      return
    }

    console.log('✅ Contextos disponíveis:')
    contexts.forEach(ctx => {
      console.log(`  - ${ctx.name} (${ctx.type}) - ID: ${ctx.id}`)
    })

    // 2. Encontrar contexto do Luft Agro
    const luftAgroContext = contexts.find(ctx => 
      ctx.name.toLowerCase().includes('luft') || 
      ctx.name.toLowerCase().includes('agro')
    )

    if (!luftAgroContext) {
      console.error('❌ Contexto do Luft Agro não encontrado')
      return
    }

    console.log(`\n✅ Contexto do Luft Agro encontrado: ${luftAgroContext.name}`)

    // 3. Atualizar usuário agro2@agro.com.br
    console.log('\n2️⃣ ATUALIZANDO USUÁRIO agro2@agro.com.br...')
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        context_id: luftAgroContext.id,
        context_name: luftAgroContext.name,
        context_type: luftAgroContext.type
      })
      .eq('email', 'agro2@agro.com.br')
      .select()
      .single()

    if (updateError) {
      console.error('❌ Erro ao atualizar usuário:', updateError)
      return
    }

    console.log('✅ Usuário atualizado:')
    console.log('  - Context ID:', updatedUser.context_id)
    console.log('  - Context Name:', updatedUser.context_name)
    console.log('  - Context Type:', updatedUser.context_type)

    // 4. Verificar categorias que o usuário DEVERIA ver agora
    console.log('\n3️⃣ VERIFICANDO CATEGORIAS APÓS CORREÇÃO...')
    
    // Categorias globais
    const { data: globalCategories, error: globalError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_global', true)
      .eq('is_active', true)

    console.log('✅ Categorias globais:', globalCategories?.length || 0)

    // Categorias específicas do contexto
    const { data: contextCategories, error: contextCatError } = await supabase
      .from('categories')
      .select('*')
      .eq('context_id', luftAgroContext.id)
      .eq('is_active', true)

    console.log('✅ Categorias do contexto Luft Agro:', contextCategories?.length || 0)
    contextCategories?.forEach(cat => {
      console.log(`  - ${cat.name}`)
    })

    // 5. Verificar se há categorias de outros contextos
    const { data: otherCategories, error: otherError } = await supabase
      .from('categories')
      .select('*')
      .neq('context_id', luftAgroContext.id)
      .eq('is_global', false)
      .eq('is_active', true)

    console.log('✅ Categorias de outros contextos:', otherCategories?.length || 0)

    // 6. Diagnóstico final
    console.log('\n4️⃣ DIAGNÓSTICO FINAL...')
    const totalGlobal = globalCategories?.length || 0
    const totalContext = contextCategories?.length || 0
    const totalOther = otherCategories?.length || 0

    console.log(`📊 RESUMO:`)
    console.log(`  - Categorias globais: ${totalGlobal}`)
    console.log(`  - Categorias do Luft Agro: ${totalContext}`)
    console.log(`  - Categorias de outros contextos: ${totalOther}`)
    console.log(`  - Total que o usuário DEVERIA ver: ${totalGlobal + totalContext}`)

    if (totalOther > 0) {
      console.log('⚠️ ATENÇÃO: Ainda há categorias de outros contextos ativas')
      console.log('🔧 PRÓXIMO PASSO: Corrigir API de categorias para filtrar corretamente')
    } else {
      console.log('✅ CORRETO: Usuário configurado corretamente')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

fixUserAgro2()
