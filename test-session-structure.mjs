#!/usr/bin/env node

/**
 * TESTE DA ESTRUTURA DA SESSÃO
 * =============================
 * 
 * Este script testa:
 * 1. Login completo com NextAuth
 * 2. Estrutura da sessão retornada
 * 3. Verificação de permissões
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

async function testSessionStructure() {
  console.log('🧪 TESTANDO ESTRUTURA DA SESSÃO\n')
  
  const userEmail = 'rodrigues2205@icloud.com'
  const userPassword = 'Nnyq2122@@'
  
  try {
    // 1. SIMULAR O PROCESSO DE LOGIN DO AUTH-HYBRID.TS
    log('1. SIMULANDO PROCESSO DE LOGIN...', 'step')
    
    // Buscar usuário matriz
    const { data: matrixUser, error: matrixError } = await supabase
      .from('matrix_users')
      .select('*')
      .eq('email', userEmail)
      .single()
    
    if (matrixError || !matrixUser) {
      log('❌ Usuário não encontrado em matrix_users', 'error')
      return
    }
    
    log(`✅ Usuário encontrado: ${matrixUser.name}`, 'success')
    
    // Verificar senha
    const isValidPassword = await bcrypt.compare(userPassword, matrixUser.password_hash)
    if (!isValidPassword) {
      log('❌ Senha incorreta', 'error')
      return
    }
    
    log('✅ Senha verificada', 'success')
    
    // 2. BUSCAR PERMISSÕES
    log('\n2. BUSCANDO PERMISSÕES...', 'step')
    
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('permissions')
      .eq('name', matrixUser.role)
      .single()
    
    let userPermissions = {}
    if (roleData?.permissions) {
      userPermissions = roleData.permissions
      log('✅ Permissões encontradas no banco', 'success')
    } else {
      log('❌ Permissões não encontradas no banco', 'error')
    }
    
    // 3. BUSCAR CONTEXTOS
    log('\n3. BUSCANDO CONTEXTOS...', 'step')
    
    const { data: relationships, error: relError } = await supabase
      .from('matrix_user_contexts')
      .select('*, contexts(name, slug, type)')
      .eq('matrix_user_id', matrixUser.id)
    
    if (relError) {
      log(`❌ Erro ao buscar contextos: ${relError.message}`, 'error')
      return
    }
    
    log(`✅ ${relationships?.length || 0} contextos encontrados`, 'success')
    
    // 4. SIMULAR ESTRUTURA DA SESSÃO COMPLETA
    log('\n4. SIMULANDO ESTRUTURA DA SESSÃO...', 'step')
    
    // Simular o que o auth-hybrid.ts retorna
    const authUser = {
      id: matrixUser.id,
      email: matrixUser.email,
      name: matrixUser.name,
      role: matrixUser.role,
      role_name: matrixUser.role,
      department: matrixUser.department,
      avatar_url: matrixUser.avatar_url,
      permissions: userPermissions,
      userType: 'matrix'
    }
    
    // Simular o que o JWT callback retorna
    const token = {
      id: authUser.id,
      role: authUser.role,
      role_name: authUser.role_name,
      department: authUser.department,
      avatar_url: authUser.avatar_url,
      permissions: authUser.permissions,
      userType: authUser.userType,
      sessionToken: `${authUser.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    }
    
    // Simular o que o session callback retorna
    const session = {
      user: {
        id: token.id,
        email: authUser.email,
        name: authUser.name,
        role: token.role,
        role_name: token.role_name,
        department: token.department,
        avatar_url: token.avatar_url,
        permissions: token.permissions,
        userType: token.userType
      },
      sessionToken: token.sessionToken
    }
    
    log('✅ Estrutura da sessão simulada', 'success')
    
    // 5. VERIFICAR ESTRUTURA DA SESSÃO
    log('\n5. VERIFICANDO ESTRUTURA DA SESSÃO...', 'step')
    
    console.log('\n📋 ESTRUTURA DA SESSÃO:')
    console.log(`   session.user.id: ${session.user.id}`)
    console.log(`   session.user.email: ${session.user.email}`)
    console.log(`   session.user.name: ${session.user.name}`)
    console.log(`   session.user.role: ${session.user.role}`)
    console.log(`   session.user.role_name: ${session.user.role_name}`)
    console.log(`   session.user.department: ${session.user.department}`)
    console.log(`   session.user.userType: ${session.user.userType}`)
    console.log(`   session.user.permissions: ${Object.keys(session.user.permissions || {}).length} permissões`)
    
    // 6. TESTAR VERIFICAÇÃO DE ADMIN
    log('\n6. TESTANDO VERIFICAÇÃO DE ADMIN...', 'step')
    
    const isAdmin = session.user.role === 'admin'
    const isAdminAlt = session.user.role_name === 'admin'
    const hasAdminPermissions = session.user.permissions?.system_settings === true
    
    console.log(`   session.user.role === 'admin': ${isAdmin}`)
    console.log(`   session.user.role_name === 'admin': ${isAdminAlt}`)
    console.log(`   session.user.permissions.system_settings: ${hasAdminPermissions}`)
    
    if (isAdmin) {
      log('✅ Usuário é admin (role)', 'success')
    } else {
      log('❌ Usuário NÃO é admin (role)', 'error')
    }
    
    if (hasAdminPermissions) {
      log('✅ Usuário tem permissões de admin', 'success')
    } else {
      log('❌ Usuário NÃO tem permissões de admin', 'error')
    }
    
    // 7. TESTAR VERIFICAÇÃO DA PÁGINA SETTINGS
    log('\n7. TESTANDO VERIFICAÇÃO DA PÁGINA SETTINGS...', 'step')
    
    // Simular a verificação que a página faz
    const pageCheck = session?.user?.role === 'admin'
    
    console.log(`   Verificação da página: ${pageCheck}`)
    
    if (pageCheck) {
      log('✅ Página settings DEVERIA permitir acesso', 'success')
    } else {
      log('❌ Página settings NÃO deveria permitir acesso', 'error')
      console.log('   Este é o motivo do "acesso restrito"')
    }
    
    // 8. VERIFICAR PROBLEMAS POTENCIAIS
    log('\n8. VERIFICANDO PROBLEMAS POTENCIAIS...', 'step')
    
    const problems = []
    
    if (!session.user.role) {
      problems.push('❌ session.user.role está undefined')
    }
    
    if (session.user.role !== 'admin') {
      problems.push('❌ session.user.role não é admin')
    }
    
    if (!session.user.permissions) {
      problems.push('❌ session.user.permissions está undefined')
    }
    
    if (!session.user.permissions?.system_settings) {
      problems.push('❌ session.user.permissions.system_settings é false')
    }
    
    if (problems.length > 0) {
      console.log('\n⚠️ PROBLEMAS IDENTIFICADOS:')
      problems.forEach((problem, index) => {
        console.log(`${index + 1}. ${problem}`)
      })
    } else {
      console.log('\n✅ NENHUM PROBLEMA IDENTIFICADO')
      console.log('A estrutura da sessão está correta.')
      console.log('O problema pode estar em outro lugar.')
    }
    
    // 9. INFORMAÇÕES PARA DEBUG
    console.log('\n🔧 INFORMAÇÕES PARA DEBUG:')
    console.log(`   Email: ${userEmail}`)
    console.log(`   Role: ${session.user.role}`)
    console.log(`   Role Name: ${session.user.role_name}`)
    console.log(`   User Type: ${session.user.userType}`)
    console.log(`   Permissões: ${Object.keys(session.user.permissions || {}).length}`)
    console.log(`   System Settings: ${session.user.permissions?.system_settings}`)
    
  } catch (error) {
    log(`Erro crítico: ${error.message}`, 'error')
    console.error(error)
  }
}

// Executar teste
testSessionStructure()
