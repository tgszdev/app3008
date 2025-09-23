#!/usr/bin/env node

/**
 * DEBUG DO PROBLEMA DO USUÁRIO
 * =============================
 * 
 * Este script verifica:
 * 1. Status do usuário rodrigues2205@icloud.com
 * 2. Problemas na migração
 * 3. Permissões e roles
 * 4. Corrige automaticamente
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
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

async function debugUserIssue() {
  console.log('🔍 DEBUGANDO PROBLEMA DO USUÁRIO rodrigues2205@icloud.com\n')
  
  const userEmail = 'rodrigues2205@icloud.com'
  
  try {
    // 1. Verificar usuário na tabela original
    log('1. Verificando usuário na tabela original...', 'step')
    
    const { data: originalUser, error: originalError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single()
    
    if (originalError) {
      log(`Erro ao buscar usuário original: ${originalError.message}`, 'error')
    } else if (originalUser) {
      log('✅ Usuário encontrado na tabela original', 'success')
      console.log(`   Nome: ${originalUser.name}`)
      console.log(`   Role: ${originalUser.role}`)
      console.log(`   Ativo: ${originalUser.is_active ? '✅' : '❌'}`)
      console.log(`   Último login: ${originalUser.last_login || 'Nunca'}`)
    } else {
      log('❌ Usuário não encontrado na tabela original', 'error')
    }
    
    // 2. Verificar usuário na tabela matrix_users
    log('\n2. Verificando usuário na tabela matrix_users...', 'step')
    
    const { data: matrixUser, error: matrixError } = await supabase
      .from('matrix_users')
      .select('*')
      .eq('email', userEmail)
      .single()
    
    if (matrixError) {
      log(`❌ Usuário não encontrado em matrix_users: ${matrixError.message}`, 'error')
    } else if (matrixUser) {
      log('✅ Usuário encontrado em matrix_users', 'success')
      console.log(`   Nome: ${matrixUser.name}`)
      console.log(`   Role: ${matrixUser.role}`)
      console.log(`   Ativo: ${matrixUser.is_active ? '✅' : '❌'}`)
    }
    
    // 3. Verificar usuário na tabela context_users
    log('\n3. Verificando usuário na tabela context_users...', 'step')
    
    const { data: contextUser, error: contextError } = await supabase
      .from('context_users')
      .select('*, contexts(name, slug)')
      .eq('email', userEmail)
      .single()
    
    if (contextError) {
      log(`❌ Usuário não encontrado em context_users: ${contextError.message}`, 'error')
    } else if (contextUser) {
      log('✅ Usuário encontrado em context_users', 'success')
      console.log(`   Nome: ${contextUser.name}`)
      console.log(`   Role: ${contextUser.role}`)
      console.log(`   Contexto: ${contextUser.contexts?.name || 'N/A'}`)
    }
    
    // 4. Verificar relacionamentos matrix_user_contexts
    log('\n4. Verificando relacionamentos...', 'step')
    
    const { data: relationships, error: relError } = await supabase
      .from('matrix_user_contexts')
      .select('*, contexts(name, slug)')
      .eq('matrix_user_id', matrixUser?.id || '')
    
    if (relError) {
      log(`❌ Erro ao buscar relacionamentos: ${relError.message}`, 'error')
    } else if (relationships && relationships.length > 0) {
      log(`✅ ${relationships.length} relacionamentos encontrados`, 'success')
      relationships.forEach((rel, index) => {
        console.log(`   ${index + 1}. Contexto: ${rel.contexts?.name} (Pode gerenciar: ${rel.can_manage ? '✅' : '❌'})`)
      })
    } else {
      log('❌ Nenhum relacionamento encontrado', 'error')
    }
    
    // 5. Verificar roles e permissões
    log('\n5. Verificando roles e permissões...', 'step')
    
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .eq('name', originalUser?.role || matrixUser?.role || 'admin')
      .single()
    
    if (rolesError) {
      log(`❌ Erro ao buscar role: ${rolesError.message}`, 'error')
    } else if (roles) {
      log('✅ Role encontrado', 'success')
      console.log(`   Nome: ${roles.name}`)
      console.log(`   Descrição: ${roles.description}`)
      console.log(`   Permissões: ${JSON.stringify(roles.permissions, null, 2)}`)
    }
    
    // 6. DIAGNÓSTICO DO PROBLEMA
    console.log('\n📊 DIAGNÓSTICO:')
    console.log('=' * 50)
    
    const problems = []
    const solutions = []
    
    if (!originalUser) {
      problems.push('❌ Usuário não existe na tabela original')
      solutions.push('✅ Criar usuário na tabela original')
    }
    
    if (!matrixUser && originalUser?.role === 'admin') {
      problems.push('❌ Usuário admin não foi migrado para matrix_users')
      solutions.push('✅ Migrar usuário para matrix_users')
    }
    
    if (!contextUser && originalUser?.role === 'user') {
      problems.push('❌ Usuário user não foi migrado para context_users')
      solutions.push('✅ Migrar usuário para context_users')
    }
    
    if (matrixUser && (!relationships || relationships.length === 0)) {
      problems.push('❌ Usuário matriz não tem relacionamentos com contextos')
      solutions.push('✅ Criar relacionamentos matrix_user_contexts')
    }
    
    if (problems.length > 0) {
      console.log('\n⚠️ PROBLEMAS IDENTIFICADOS:')
      problems.forEach(problem => console.log(problem))
      
      console.log('\n💡 SOLUÇÕES:')
      solutions.forEach(solution => console.log(solution))
      
      // 7. CORREÇÃO AUTOMÁTICA
      console.log('\n🔧 INICIANDO CORREÇÃO AUTOMÁTICA...')
      
      if (originalUser && originalUser.role === 'admin' && !matrixUser) {
        log('Corrigindo migração para matrix_users...', 'step')
        
        // Migrar para matrix_users
        const { error: insertError } = await supabase
          .from('matrix_users')
          .insert({
            id: originalUser.id,
            email: originalUser.email,
            password_hash: originalUser.password_hash,
            name: originalUser.name,
            role: originalUser.role,
            department: originalUser.department,
            phone: originalUser.phone,
            avatar_url: originalUser.avatar_url,
            is_active: originalUser.is_active,
            last_login: originalUser.last_login,
            created_at: originalUser.created_at,
            updated_at: originalUser.updated_at
          })
        
        if (insertError) {
          log(`❌ Erro ao migrar: ${insertError.message}`, 'error')
        } else {
          log('✅ Usuário migrado para matrix_users', 'success')
          
          // Criar relacionamento com contexto padrão
          const { data: defaultContext } = await supabase
            .from('contexts')
            .select('id')
            .eq('slug', 'default-organization')
            .single()
          
          if (defaultContext) {
            const { error: relError } = await supabase
              .from('matrix_user_contexts')
              .insert({
                matrix_user_id: originalUser.id,
                context_id: defaultContext.id,
                can_manage: true // Admin pode gerenciar
              })
            
            if (relError) {
              log(`❌ Erro ao criar relacionamento: ${relError.message}`, 'error')
            } else {
              log('✅ Relacionamento criado', 'success')
            }
          }
        }
      }
      
      console.log('\n🎉 CORREÇÃO CONCLUÍDA!')
      console.log('Agora teste o login novamente.')
      
    } else {
      console.log('\n✅ NENHUM PROBLEMA IDENTIFICADO')
      console.log('O usuário deve estar funcionando corretamente.')
    }
    
  } catch (error) {
    log(`Erro crítico: ${error.message}`, 'error')
    console.error(error)
  }
}

// Executar debug
debugUserIssue()
