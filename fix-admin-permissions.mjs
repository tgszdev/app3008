#!/usr/bin/env node

/**
 * CORREÇÃO DAS PERMISSÕES DE ADMIN
 * =================================
 * 
 * Este script corrige:
 * 1. Permissões de admin no relacionamento
 * 2. Acesso total aos contextos
 * 3. Verifica se está funcionando
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})

function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const icons = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    step: '🔄'
  }
  console.log(`${icons[type]} [${timestamp}] ${message}`)
}

async function fixAdminPermissions() {
  console.log('🔧 CORRIGINDO PERMISSÕES DE ADMIN\n')
  
  const userEmail = 'rodrigues2205@icloud.com'
  
  try {
    // 1. Buscar usuário matriz
    log('1. Buscando usuário matriz...', 'step')
    
    const { data: matrixUser, error: matrixError } = await supabase
      .from('matrix_users')
      .select('*')
      .eq('email', userEmail)
      .single()
    
    if (matrixError || !matrixUser) {
      log('❌ Usuário não encontrado em matrix_users', 'error')
      return
    }
    
    log(`✅ Usuário encontrado: ${matrixUser.name} (${matrixUser.role})`, 'success')
    
    // 2. Buscar todos os contextos
    log('\n2. Buscando contextos...', 'step')
    
    const { data: contexts, error: contextsError } = await supabase
      .from('contexts')
      .select('*')
    
    if (contextsError) {
      log(`❌ Erro ao buscar contextos: ${contextsError.message}`, 'error')
      return
    }
    
    log(`✅ ${contexts?.length || 0} contextos encontrados`, 'success')
    
    if (contexts) {
      contexts.forEach((context, index) => {
        console.log(`   ${index + 1}. ${context.name} (${context.type}) - ${context.slug}`)
      })
    }
    
    // 3. Verificar relacionamentos atuais
    log('\n3. Verificando relacionamentos atuais...', 'step')
    
    const { data: currentRelations, error: relError } = await supabase
      .from('matrix_user_contexts')
      .select('*, contexts(name, slug)')
      .eq('matrix_user_id', matrixUser.id)
    
    if (relError) {
      log(`❌ Erro ao buscar relacionamentos: ${relError.message}`, 'error')
      return
    }
    
    log(`✅ ${currentRelations?.length || 0} relacionamentos atuais`, 'success')
    
    if (currentRelations) {
      currentRelations.forEach((rel, index) => {
        console.log(`   ${index + 1}. ${rel.contexts?.name} - Pode gerenciar: ${rel.can_manage ? '✅' : '❌'}`)
      })
    }
    
    // 4. Corrigir relacionamentos existentes
    log('\n4. Corrigindo relacionamentos existentes...', 'step')
    
    if (currentRelations && currentRelations.length > 0) {
      for (const rel of currentRelations) {
        if (!rel.can_manage) {
          const { error: updateError } = await supabase
            .from('matrix_user_contexts')
            .update({ can_manage: true })
            .eq('id', rel.id)
          
          if (updateError) {
            log(`❌ Erro ao atualizar relacionamento: ${updateError.message}`, 'error')
          } else {
            log(`✅ Relacionamento corrigido: ${rel.contexts?.name}`, 'success')
          }
        }
      }
    }
    
    // 5. Criar relacionamentos para contextos que não têm
    log('\n5. Criando relacionamentos faltantes...', 'step')
    
    if (contexts) {
      for (const context of contexts) {
        // Verificar se já existe relacionamento
        const existingRel = currentRelations?.find(rel => rel.context_id === context.id)
        
        if (!existingRel) {
          const { error: insertError } = await supabase
            .from('matrix_user_contexts')
            .insert({
              matrix_user_id: matrixUser.id,
              context_id: context.id,
              can_manage: true
            })
          
          if (insertError) {
            log(`❌ Erro ao criar relacionamento para ${context.name}: ${insertError.message}`, 'error')
          } else {
            log(`✅ Relacionamento criado: ${context.name}`, 'success')
          }
        }
      }
    }
    
    // 6. Verificar resultado final
    log('\n6. Verificando resultado final...', 'step')
    
    const { data: finalRelations, error: finalError } = await supabase
      .from('matrix_user_contexts')
      .select('*, contexts(name, slug)')
      .eq('matrix_user_id', matrixUser.id)
    
    if (finalError) {
      log(`❌ Erro ao verificar resultado: ${finalError.message}`, 'error')
      return
    }
    
    log(`✅ ${finalRelations?.length || 0} relacionamentos finais`, 'success')
    
    if (finalRelations) {
      console.log('\n📊 RELACIONAMENTOS FINAIS:')
      finalRelations.forEach((rel, index) => {
        console.log(`${index + 1}. ${rel.contexts?.name} - Pode gerenciar: ${rel.can_manage ? '✅' : '❌'}`)
      })
    }
    
    // 7. Verificar se todos têm can_manage = true
    const allCanManage = finalRelations?.every(rel => rel.can_manage) || false
    
    if (allCanManage) {
      console.log('\n🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!')
      console.log('✅ Todas as permissões de admin foram corrigidas')
      console.log('✅ Você agora tem acesso total a todos os contextos')
      console.log('\n📋 PRÓXIMOS PASSOS:')
      console.log('1. Faça logout do sistema')
      console.log('2. Faça login novamente')
      console.log('3. Verifique se o dashboard está funcionando')
      console.log('4. Teste as funcionalidades de admin')
    } else {
      console.log('\n⚠️ ALGUNS RELACIONAMENTOS AINDA PRECISAM SER CORRIGIDOS')
      console.log('Execute o script novamente se necessário')
    }
    
  } catch (error) {
    log(`Erro crítico: ${error.message}`, 'error')
    console.error(error)
  }
}

// Executar correção
fixAdminPermissions()
