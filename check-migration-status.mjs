#!/usr/bin/env node

/**
 * VERIFICAÇÃO DO STATUS DA MIGRAÇÃO
 * ==================================
 * 
 * Este script verifica:
 * 1. Quais usuários foram migrados
 * 2. Status das tabelas multi-tenant
 * 3. Relacionamentos criados
 * 4. O que ainda precisa ser migrado
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
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

async function checkMigrationStatus() {
  console.log('🔍 VERIFICANDO STATUS DA MIGRAÇÃO MULTI-TENANT\n')
  
  try {
    // =====================================================
    // 1. VERIFICAR CONTEXTOS CRIADOS
    // =====================================================
    
    log('1. VERIFICANDO CONTEXTOS...', 'step')
    
    const { data: contexts, error: contextsError } = await supabase
      .from('contexts')
      .select('*')
    
    if (contextsError) {
      log(`Erro ao buscar contextos: ${contextsError.message}`, 'error')
      return
    }
    
    log(`Contextos encontrados: ${contexts?.length || 0}`, 'success')
    
    if (contexts && contexts.length > 0) {
      console.log('\n🏢 CONTEXTOS EXISTENTES:')
      contexts.forEach((context, index) => {
        console.log(`${index + 1}. ${context.name} (${context.type})`)
        console.log(`   Slug: ${context.slug}`)
        console.log(`   Ativo: ${context.is_active ? '✅' : '❌'}`)
        console.log(`   SLA: ${context.sla_hours}h`)
        console.log(`   Criado: ${context.created_at}`)
      })
    }
    
    // =====================================================
    // 2. VERIFICAR USUÁRIOS MATRIZ MIGRADOS
    // =====================================================
    
    log('\n2. VERIFICANDO USUÁRIOS MATRIZ...', 'step')
    
    const { data: matrixUsers, error: matrixUsersError } = await supabase
      .from('matrix_users')
      .select('*')
    
    if (matrixUsersError) {
      log(`Erro ao buscar usuários matriz: ${matrixUsersError.message}`, 'error')
      return
    }
    
    log(`Usuários matriz encontrados: ${matrixUsers?.length || 0}`, 'success')
    
    if (matrixUsers && matrixUsers.length > 0) {
      console.log('\n👑 USUÁRIOS MATRIZ:')
      matrixUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`)
        console.log(`   Role: ${user.role}`)
        console.log(`   Departamento: ${user.department || 'N/A'}`)
        console.log(`   Ativo: ${user.is_active ? '✅' : '❌'}`)
        console.log(`   Último login: ${user.last_login || 'Nunca'}`)
      })
    }
    
    // =====================================================
    // 3. VERIFICAR USUÁRIOS CONTEXTO
    // =====================================================
    
    log('\n3. VERIFICANDO USUÁRIOS CONTEXTO...', 'step')
    
    const { data: contextUsers, error: contextUsersError } = await supabase
      .from('context_users')
      .select('*, contexts(name, slug)')
    
    if (contextUsersError) {
      log(`Erro ao buscar usuários contexto: ${contextUsersError.message}`, 'error')
      return
    }
    
    log(`Usuários contexto encontrados: ${contextUsers?.length || 0}`, 'success')
    
    if (contextUsers && contextUsers.length > 0) {
      console.log('\n🏢 USUÁRIOS CONTEXTO:')
      contextUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`)
        console.log(`   Role: ${user.role}`)
        console.log(`   Contexto: ${user.contexts?.name || 'N/A'}`)
        console.log(`   Ativo: ${user.is_active ? '✅' : '❌'}`)
      })
    }
    
    // =====================================================
    // 4. VERIFICAR RELACIONAMENTOS MATRIZ-CONTEXTO
    // =====================================================
    
    log('\n4. VERIFICANDO RELACIONAMENTOS...', 'step')
    
    const { data: relationships, error: relationshipsError } = await supabase
      .from('matrix_user_contexts')
      .select('*, matrix_users(name, email), contexts(name, slug)')
    
    if (relationshipsError) {
      log(`Erro ao buscar relacionamentos: ${relationshipsError.message}`, 'error')
      return
    }
    
    log(`Relacionamentos encontrados: ${relationships?.length || 0}`, 'success')
    
    if (relationships && relationships.length > 0) {
      console.log('\n🔗 RELACIONAMENTOS MATRIZ-CONTEXTO:')
      relationships.forEach((rel, index) => {
        console.log(`${index + 1}. ${rel.matrix_users?.name} → ${rel.contexts?.name}`)
        console.log(`   Pode gerenciar: ${rel.can_manage ? '✅' : '❌'}`)
        console.log(`   Criado: ${rel.created_at}`)
      })
    }
    
    // =====================================================
    // 5. VERIFICAR USUÁRIOS ORIGINAIS NÃO MIGRADOS
    // =====================================================
    
    log('\n5. VERIFICANDO USUÁRIOS ORIGINAIS...', 'step')
    
    const { data: originalUsers, error: originalUsersError } = await supabase
      .from('users')
      .select('*')
    
    if (originalUsersError) {
      log(`Erro ao buscar usuários originais: ${originalUsersError.message}`, 'error')
      return
    }
    
    log(`Usuários originais: ${originalUsers?.length || 0}`, 'success')
    
    // Verificar quais não foram migrados
    const migratedEmails = new Set()
    
    if (matrixUsers) {
      matrixUsers.forEach(user => migratedEmails.add(user.email))
    }
    if (contextUsers) {
      contextUsers.forEach(user => migratedEmails.add(user.email))
    }
    
    const notMigrated = originalUsers?.filter(user => !migratedEmails.has(user.email)) || []
    
    console.log(`\n📋 USUÁRIOS NÃO MIGRADOS: ${notMigrated.length}`)
    if (notMigrated.length > 0) {
      notMigrated.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`)
      })
    }
    
    // =====================================================
    // 6. RELATÓRIO FINAL
    // =====================================================
    
    console.log('\n📊 RELATÓRIO FINAL:')
    console.log('=' * 50)
    console.log(`✅ Contextos criados: ${contexts?.length || 0}`)
    console.log(`✅ Usuários matriz migrados: ${matrixUsers?.length || 0}`)
    console.log(`✅ Usuários contexto migrados: ${contextUsers?.length || 0}`)
    console.log(`✅ Relacionamentos criados: ${relationships?.length || 0}`)
    console.log(`📋 Usuários originais: ${originalUsers?.length || 0}`)
    console.log(`⚠️ Usuários não migrados: ${notMigrated.length}`)
    
    if (notMigrated.length > 0) {
      console.log('\n💡 RECOMENDAÇÃO:')
      console.log('Execute: node migrate-existing-users.mjs')
      console.log('Para migrar os usuários restantes')
    } else {
      console.log('\n🎉 MIGRAÇÃO COMPLETA!')
    }
    
  } catch (error) {
    log(`Erro crítico: ${error.message}`, 'error')
    console.error(error)
  }
}

// Executar verificação
checkMigrationStatus()
