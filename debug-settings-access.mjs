#!/usr/bin/env node

/**
 * DEBUG ESPECÍFICO DO ACESSO ÀS CONFIGURAÇÕES
 * ============================================
 * 
 * Este script verifica:
 * 1. Login com credenciais específicas
 * 2. Permissões para acessar /dashboard/settings
 * 3. Problemas de autorização
 * 4. Verificação de role e permissões
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
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

async function debugSettingsAccess() {
  console.log('🔍 DEBUG ESPECÍFICO DO ACESSO ÀS CONFIGURAÇÕES\n')
  
  const userEmail = 'rodrigues2205@icloud.com'
  const userPassword = 'Nnyq2122@@'
  
  try {
    // 1. VERIFICAR LOGIN COM CREDENCIAIS ESPECÍFICAS
    log('1. VERIFICANDO LOGIN COM CREDENCIAIS ESPECÍFICAS...', 'step')
    
    // Buscar usuário matriz
    const { data: matrixUser, error: matrixError } = await supabase
      .from('matrix_users')
      .select('*')
      .eq('email', userEmail)
      .single()
    
    if (matrixError || !matrixUser) {
      log('❌ Usuário não encontrado em matrix_users', 'error')
      console.log(`   Erro: ${matrixError?.message}`)
      return
    }
    
    log(`✅ Usuário encontrado: ${matrixUser.name}`, 'success')
    console.log(`   Email: ${matrixUser.email}`)
    console.log(`   Role: ${matrixUser.role}`)
    console.log(`   Ativo: ${matrixUser.is_active}`)
    
    // Verificar senha
    log('   Verificando senha...', 'step')
    if (!matrixUser.password_hash) {
      log('❌ Hash de senha não encontrado', 'error')
      return
    }
    
    try {
      const isValidPassword = await bcrypt.compare(userPassword, matrixUser.password_hash)
      if (isValidPassword) {
        log('✅ Senha verificada com sucesso', 'success')
      } else {
        log('❌ Senha incorreta', 'error')
        console.log('   A senha fornecida não confere com o hash no banco')
        return
      }
    } catch (error) {
      log(`❌ Erro ao verificar senha: ${error.message}`, 'error')
      return
    }
    
    // 2. VERIFICAR ROLE E PERMISSÕES ESPECÍFICAS PARA SETTINGS
    log('\n2. VERIFICANDO PERMISSÕES PARA SETTINGS...', 'step')
    
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('name', matrixUser.role)
      .single()
    
    if (roleError) {
      log(`❌ Role não encontrado: ${roleError.message}`, 'error')
      return
    }
    
    log(`✅ Role encontrado: ${roleData.name}`, 'success')
    console.log(`   Descrição: ${roleData.description}`)
    
    // Verificar permissões específicas para settings
    const permissions = roleData.permissions || {}
    const settingsPermissions = [
      'system_settings',
      'system_users',
      'system_roles',
      'system_logs',
      'system_backup'
    ]
    
    log('   Verificando permissões específicas...', 'step')
    settingsPermissions.forEach(permission => {
      const hasPermission = permissions[permission] === true
      if (hasPermission) {
        log(`   ✅ ${permission}: ${hasPermission}`, 'success')
      } else {
        log(`   ❌ ${permission}: ${hasPermission}`, 'error')
      }
    })
    
    // Verificar se tem pelo menos uma permissão de settings
    const hasAnySettingsPermission = settingsPermissions.some(permission => 
      permissions[permission] === true
    )
    
    if (hasAnySettingsPermission) {
      log('✅ Usuário tem permissões para acessar settings', 'success')
    } else {
      log('❌ Usuário NÃO tem permissões para acessar settings', 'error')
      console.log('   Este é provavelmente o motivo do "acesso restrito"')
    }
    
    // 3. VERIFICAR RELACIONAMENTOS E CONTEXTOS
    log('\n3. VERIFICANDO RELACIONAMENTOS E CONTEXTOS...', 'step')
    
    const { data: relationships, error: relError } = await supabase
      .from('matrix_user_contexts')
      .select('*, contexts(name, slug, type)')
      .eq('matrix_user_id', matrixUser.id)
    
    if (relError) {
      log(`❌ Erro ao buscar relacionamentos: ${relError.message}`, 'error')
      return
    }
    
    if (relationships && relationships.length > 0) {
      log(`✅ ${relationships.length} relacionamentos encontrados`, 'success')
      relationships.forEach((rel, index) => {
        console.log(`   ${index + 1}. ${rel.contexts?.name} (${rel.contexts?.type})`)
        console.log(`      Pode gerenciar: ${rel.can_manage ? '✅' : '❌'}`)
      })
    } else {
      log('❌ Nenhum relacionamento encontrado', 'error')
      console.log('   Isso pode causar problemas de acesso')
    }
    
    // 4. SIMULAR DADOS DE SESSÃO COMPLETOS
    log('\n4. SIMULANDO DADOS DE SESSÃO COMPLETOS...', 'step')
    
    const sessionUser = {
      id: matrixUser.id,
      email: matrixUser.email,
      name: matrixUser.name,
      role: matrixUser.role,
      role_name: matrixUser.role,
      department: matrixUser.department,
      avatar_url: matrixUser.avatar_url,
      permissions: permissions,
      userType: 'matrix',
      context_id: relationships?.[0]?.contexts?.id,
      context_name: relationships?.[0]?.contexts?.name,
      context_slug: relationships?.[0]?.contexts?.slug,
      context_type: relationships?.[0]?.contexts?.type,
      availableContexts: relationships?.map(rel => ({
        id: rel.contexts.id,
        name: rel.contexts.name,
        slug: rel.contexts.slug,
        type: rel.contexts.type,
        canManage: rel.can_manage
      })) || []
    }
    
    log('✅ Dados de sessão simulados', 'success')
    console.log('\n📋 DADOS DE SESSÃO:')
    console.log(`   Nome: ${sessionUser.name}`)
    console.log(`   Email: ${sessionUser.email}`)
    console.log(`   Role: ${sessionUser.role}`)
    console.log(`   UserType: ${sessionUser.userType}`)
    console.log(`   Contextos: ${sessionUser.availableContexts.length}`)
    console.log(`   Permissões: ${Object.keys(sessionUser.permissions).length}`)
    
    // 5. VERIFICAR SE O USUÁRIO DEVERIA TER ACESSO
    log('\n5. VERIFICANDO SE USUÁRIO DEVERIA TER ACESSO...', 'step')
    
    const shouldHaveAccess = 
      matrixUser.is_active &&
      matrixUser.role === 'admin' &&
      hasAnySettingsPermission &&
      relationships && relationships.length > 0
    
    if (shouldHaveAccess) {
      log('✅ Usuário DEVERIA ter acesso às configurações', 'success')
      console.log('   Todos os requisitos estão atendidos')
    } else {
      log('❌ Usuário NÃO deveria ter acesso às configurações', 'error')
      console.log('   Alguns requisitos não estão atendidos:')
      console.log(`   - Ativo: ${matrixUser.is_active ? '✅' : '❌'}`)
      console.log(`   - Role admin: ${matrixUser.role === 'admin' ? '✅' : '❌'}`)
      console.log(`   - Permissões settings: ${hasAnySettingsPermission ? '✅' : '❌'}`)
      console.log(`   - Relacionamentos: ${relationships && relationships.length > 0 ? '✅' : '❌'}`)
    }
    
    // 6. DIAGNÓSTICO E SOLUÇÕES
    console.log('\n📊 DIAGNÓSTICO:')
    console.log('=' * 50)
    
    const problems = []
    const solutions = []
    
    if (!matrixUser.is_active) {
      problems.push('❌ Usuário está inativo')
      solutions.push('✅ Ativar usuário no banco de dados')
    }
    
    if (matrixUser.role !== 'admin') {
      problems.push('❌ Usuário não é admin')
      solutions.push('✅ Alterar role para admin no banco de dados')
    }
    
    if (!hasAnySettingsPermission) {
      problems.push('❌ Usuário não tem permissões para settings')
      solutions.push('✅ Adicionar permissões de settings ao role admin')
    }
    
    if (!relationships || relationships.length === 0) {
      problems.push('❌ Usuário não tem relacionamentos com contextos')
      solutions.push('✅ Criar relacionamentos matrix_user_contexts')
    }
    
    if (problems.length > 0) {
      console.log('\n⚠️ PROBLEMAS IDENTIFICADOS:')
      problems.forEach((problem, index) => {
        console.log(`${index + 1}. ${problem}`)
      })
      
      console.log('\n💡 SOLUÇÕES:')
      solutions.forEach((solution, index) => {
        console.log(`${index + 1}. ${solution}`)
      })
    } else {
      console.log('\n✅ NENHUM PROBLEMA IDENTIFICADO')
      console.log('O usuário deveria ter acesso às configurações.')
      console.log('O problema pode estar no código da aplicação.')
    }
    
    // 7. INFORMAÇÕES PARA DEBUG
    console.log('\n🔧 INFORMAÇÕES PARA DEBUG:')
    console.log(`   Email: ${userEmail}`)
    console.log(`   Senha: ${userPassword} (verificada)`)
    console.log(`   Role: ${matrixUser.role}`)
    console.log(`   Permissões settings: ${hasAnySettingsPermission}`)
    console.log(`   Relacionamentos: ${relationships?.length || 0}`)
    
  } catch (error) {
    log(`Erro crítico: ${error.message}`, 'error')
    console.error(error)
  }
}

// Executar debug específico
debugSettingsAccess()
