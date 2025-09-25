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

async function fixUserAgroMultiOrg() {
  console.log('🔧 CORRIGINDO USUÁRIO agro@agro.com.br PARA MÚLTIPLAS ORGANIZAÇÕES')
  console.log('=' .repeat(70))

  try {
    // 1. Verificar usuário atual
    console.log('\n1️⃣ VERIFICANDO USUÁRIO ATUAL...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'agro@agro.com.br')
      .single()

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError)
      return
    }

    console.log('✅ Usuário atual:')
    console.log('  - User Type:', user.user_type)
    console.log('  - Context ID:', user.context_id)

    // 2. Atualizar usuário para matrix (pode ver múltiplas organizações)
    console.log('\n2️⃣ ATUALIZANDO USUÁRIO PARA MATRIX...')
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        user_type: 'matrix',
        context_id: null, // Matrix users não têm contexto fixo
        context_name: null,
        context_type: null
      })
      .eq('email', 'agro@agro.com.br')
      .select()
      .single()

    if (updateError) {
      console.error('❌ Erro ao atualizar usuário:', updateError)
      return
    }

    console.log('✅ Usuário atualizado para matrix:')
    console.log('  - User Type:', updatedUser.user_type)
    console.log('  - Context ID:', updatedUser.context_id)

    // 3. Verificar se existe tabela user_contexts
    console.log('\n3️⃣ VERIFICANDO TABELA USER_CONTEXTS...')
    const { data: userContexts, error: userContextsError } = await supabase
      .from('user_contexts')
      .select('*')
      .eq('user_id', user.id)

    if (userContextsError) {
      console.log('⚠️ Tabela user_contexts não encontrada ou erro:', userContextsError.message)
      
      // 4. Criar tabela user_contexts se não existir
      console.log('\n4️⃣ CRIANDO TABELA USER_CONTEXTS...')
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS user_contexts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          context_id UUID NOT NULL REFERENCES contexts(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, context_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_user_contexts_user_id ON user_contexts(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_contexts_context_id ON user_contexts(context_id);
      `
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
      
      if (createError) {
        console.log('⚠️ Não foi possível criar tabela via RPC, tentando método alternativo')
        // Tentar criar via SQL direto
        console.log('📋 SQL para executar manualmente no Supabase Dashboard:')
        console.log(createTableSQL)
      } else {
        console.log('✅ Tabela user_contexts criada com sucesso')
      }
    } else {
      console.log('✅ Tabela user_contexts existe, contextos associados:', userContexts.length)
    }

    // 5. Associar usuário a múltiplos contextos
    console.log('\n5️⃣ ASSOCIANDO USUÁRIO A MÚLTIPLOS CONTEXTOS...')
    
    // Buscar todos os contextos ativos
    const { data: allContexts, error: contextsError } = await supabase
      .from('contexts')
      .select('*')
      .eq('is_active', true)

    if (contextsError) {
      console.error('❌ Erro ao buscar contextos:', contextsError)
      return
    }

    console.log('✅ Contextos disponíveis:')
    allContexts.forEach(ctx => {
      console.log(`  - ${ctx.name} (${ctx.type}) - ID: ${ctx.id}`)
    })

    // Associar usuário a todos os contextos (simulando múltiplas organizações)
    for (const context of allContexts) {
      const { data: association, error: assocError } = await supabase
        .from('user_contexts')
        .upsert({
          user_id: user.id,
          context_id: context.id
        })
        .select()

      if (assocError) {
        console.log(`⚠️ Erro ao associar ${context.name}:`, assocError.message)
      } else {
        console.log(`✅ Associado a ${context.name}`)
      }
    }

    // 6. Verificar categorias que o usuário DEVERIA ver agora
    console.log('\n6️⃣ VERIFICANDO CATEGORIAS APÓS CORREÇÃO...')
    
    // Categorias globais
    const { data: globalCategories, error: globalError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_global', true)
      .eq('is_active', true)

    console.log('✅ Categorias globais:', globalCategories?.length || 0)

    // Categorias de todos os contextos associados
    const contextIds = allContexts.map(ctx => ctx.id)
    const { data: allContextCategories, error: allContextError } = await supabase
      .from('categories')
      .select('*')
      .in('context_id', contextIds)
      .eq('is_active', true)

    console.log('✅ Categorias de todos os contextos:', allContextCategories?.length || 0)
    allContextCategories?.forEach(cat => {
      const contextName = allContexts.find(ctx => ctx.id === cat.context_id)?.name || 'Desconhecido'
      console.log(`  - ${cat.name} (${contextName})`)
    })

    // 7. Diagnóstico final
    console.log('\n7️⃣ DIAGNÓSTICO FINAL...')
    const totalGlobal = globalCategories?.length || 0
    const totalContext = allContextCategories?.length || 0

    console.log(`📊 RESUMO:`)
    console.log(`  - Usuário: ${updatedUser.email}`)
    console.log(`  - Tipo: ${updatedUser.user_type}`)
    console.log(`  - Categorias globais: ${totalGlobal}`)
    console.log(`  - Categorias de contextos: ${totalContext}`)
    console.log(`  - Total que o usuário DEVERIA ver: ${totalGlobal + totalContext}`)

    if (totalContext > 0) {
      console.log('✅ CORRETO: Usuário matrix vendo categorias de múltiplos contextos')
    } else {
      console.log('❌ PROBLEMA: Usuário matrix não vendo categorias de contextos')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

fixUserAgroMultiOrg()
