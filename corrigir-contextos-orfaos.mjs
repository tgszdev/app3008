#!/usr/bin/env node

/**
 * CORRIGIR CONTEXTOS ÓRFÃOS
 * 
 * Este script corrige as associações user_contexts que estão órfãs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function corrigirContextosOrfaos() {
  console.log('🔧 CORRIGINDO CONTEXTOS ÓRFÃOS')
  console.log('=' * 50)
  
  try {
    // 1. Buscar todas as associações
    console.log('🔍 Buscando todas as associações...')
    
    const { data: allAssociations, error: allError } = await supabaseAdmin
      .from('user_contexts')
      .select('user_id, context_id')
    
    if (allError) {
      console.error('❌ Erro ao buscar associações:', allError)
      return
    }
    
    console.log(`📊 Total de associações: ${allAssociations.length}`)
    
    // 2. Verificar quais contextos existem
    const contextIds = [...new Set(allAssociations.map(assoc => assoc.context_id))]
    console.log('📊 Context IDs únicos:', contextIds)
    
    const { data: existingContexts, error: contextError } = await supabaseAdmin
      .from('contexts')
      .select('id, name')
      .in('id', contextIds)
    
    if (contextError) {
      console.error('❌ Erro ao verificar contextos existentes:', contextError)
      return
    }
    
    console.log('✅ Contextos que existem:', existingContexts.map(c => c.name))
    
    // 3. Identificar contextos órfãos
    const existingContextIds = existingContexts.map(ctx => ctx.id)
    const orphanedContextIds = contextIds.filter(id => !existingContextIds.includes(id))
    
    if (orphanedContextIds.length > 0) {
      console.log('🗑️ Contextos órfãos encontrados:', orphanedContextIds)
      
      // Remover associações com contextos órfãos
      const { error: deleteError } = await supabaseAdmin
        .from('user_contexts')
        .delete()
        .in('context_id', orphanedContextIds)
      
      if (deleteError) {
        console.error('❌ Erro ao remover associações órfãs:', deleteError)
      } else {
        console.log('✅ Associações órfãs removidas com sucesso')
      }
    } else {
      console.log('✅ Nenhum contexto órfão encontrado')
    }
    
    // 5. Verificar integridade final
    console.log('\n🔍 VERIFICAÇÃO FINAL')
    console.log('=' * 30)
    
    const { data: userContexts, error: finalError } = await supabaseAdmin
      .from('user_contexts')
      .select('user_id, context_id, contexts(id, name, type)')
      .eq('user_id', '2a33241e-ed38-48b5-9c84-e8c354ae9606')
    
    if (finalError) {
      console.error('❌ Erro na verificação final:', finalError)
    } else {
      console.log('✅ Contextos do usuário após correção:')
      userContexts.forEach(uc => {
        if (uc.contexts) {
          console.log(`  - ${uc.contexts.name} (${uc.contexts.type})`)
        } else {
          console.log(`  - ❌ Contexto órfão: ${uc.context_id}`)
        }
      })
    }
    
  } catch (error) {
    console.error('❌ Erro durante correção:', error)
  }
}

// Executar correção
corrigirContextosOrfaos().catch(console.error)
