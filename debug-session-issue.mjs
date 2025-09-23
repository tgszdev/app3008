#!/usr/bin/env node

/**
 * DEBUG ESPECÍFICO DO PROBLEMA DE SESSÃO
 * =======================================
 * 
 * Este script testa:
 * 1. Login com credenciais específicas
 * 2. Verifica se a sessão está sendo criada
 * 3. Testa a estrutura da sessão
 * 4. Identifica por que o usuário aparece como undefined
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

async function debugSessionIssue() {
  console.log('🔍 DEBUG ESPECÍFICO DO PROBLEMA DE SESSÃO\n')
  
  const userEmail = 'rodrigues2205@icloud.com'
  const userPassword = 'Nnyq2122@@'
  
  try {
    // 1. SIMULAR O PROCESSO COMPLETO DE LOGIN
    log('1. SIMULANDO PROCESSO COMPLETO DE LOGIN...', 'step')
    
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
    
    // 2. SIMULAR A FUNÇÃO AUTHORIZE DO AUTH-HYBRID.TS
    log('\n2. SIMULANDO FUNÇÃO AUTHORIZE...', 'step')
    
    // Simular o que o auth-hybrid.ts faria
    const authUser = {
      id: matrixUser.id,
      email: matrixUser.email,
      name: matrixUser.name,
      role: matrixUser.role,
      role_name: matrixUser.role,
      department: matrixUser.department,
      avatar_url: matrixUser.avatar_url,
      permissions: {}, // Será preenchido depois
      userType: 'matrix'
    }
    
    log('✅ AuthUser criado', 'success')
    console.log(`   Nome: ${authUser.name}`)
    console.log(`   Email: ${authUser.email}`)
    console.log(`   Role: ${authUser.role}`)
    console.log(`   UserType: ${authUser.userType}`)
    
    // 3. SIMULAR O JWT CALLBACK
    log('\n3. SIMULANDO JWT CALLBACK...', 'step')
    
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
    
    log('✅ Token criado', 'success')
    console.log(`   Token ID: ${token.id}`)
    console.log(`   Token Role: ${token.role}`)
    console.log(`   Token UserType: ${token.userType}`)
    
    // 4. SIMULAR O SESSION CALLBACK
    log('\n4. SIMULANDO SESSION CALLBACK...', 'step')
    
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
    
    log('✅ Sessão criada', 'success')
    
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
    console.log(`   session.user.permissions: ${JSON.stringify(session.user.permissions)}`)
    
    // 6. TESTAR VERIFICAÇÕES ESPECÍFICAS
    log('\n6. TESTANDO VERIFICAÇÕES ESPECÍFICAS...', 'step')
    
    // Testar se o nome não é undefined
    const isNameUndefined = !session.user.name || session.user.name === 'undefined'
    console.log(`   Nome é undefined: ${isNameUndefined}`)
    
    if (isNameUndefined) {
      log('❌ PROBLEMA: Nome do usuário está undefined', 'error')
    } else {
      log('✅ Nome do usuário está correto', 'success')
    }
    
    // Testar se o role não é undefined
    const isRoleUndefined = !session.user.role || session.user.role === 'undefined'
    console.log(`   Role é undefined: ${isRoleUndefined}`)
    
    if (isRoleUndefined) {
      log('❌ PROBLEMA: Role do usuário está undefined', 'error')
    } else {
      log('✅ Role do usuário está correto', 'success')
    }
    
    // Testar se é admin
    const isAdmin = session.user.role === 'admin'
    console.log(`   É admin: ${isAdmin}`)
    
    if (isAdmin) {
      log('✅ Usuário é admin', 'success')
    } else {
      log('❌ Usuário NÃO é admin', 'error')
    }
    
    // 7. VERIFICAR PROBLEMAS POTENCIAIS
    log('\n7. VERIFICANDO PROBLEMAS POTENCIAIS...', 'step')
    
    const problems = []
    
    if (isNameUndefined) {
      problems.push('❌ Nome do usuário está undefined')
    }
    
    if (isRoleUndefined) {
      problems.push('❌ Role do usuário está undefined')
    }
    
    if (!isAdmin) {
      problems.push('❌ Usuário não é admin')
    }
    
    if (problems.length > 0) {
      console.log('\n⚠️ PROBLEMAS IDENTIFICADOS:')
      problems.forEach((problem, index) => {
        console.log(`${index + 1}. ${problem}`)
      })
      
      console.log('\n💡 POSSÍVEIS CAUSAS:')
      console.log('1. Problema na função authorize do auth-hybrid.ts')
      console.log('2. Problema no JWT callback')
      console.log('3. Problema no session callback')
      console.log('4. Problema na estrutura da sessão')
      console.log('5. Problema no banco de dados')
      
      console.log('\n🔧 SOLUÇÕES:')
      console.log('1. Verificar se o auth-hybrid.ts está sendo usado')
      console.log('2. Verificar se a sessão está sendo criada corretamente')
      console.log('3. Verificar se o banco de dados está correto')
      console.log('4. Verificar se não há cache do navegador')
    } else {
      console.log('\n✅ NENHUM PROBLEMA IDENTIFICADO')
      console.log('A estrutura da sessão está correta.')
      console.log('O problema pode estar em outro lugar.')
    }
    
    // 8. INFORMAÇÕES PARA DEBUG
    console.log('\n🔧 INFORMAÇÕES PARA DEBUG:')
    console.log(`   Email: ${userEmail}`)
    console.log(`   Senha: ${userPassword} (verificada)`)
    console.log(`   Nome: ${session.user.name}`)
    console.log(`   Role: ${session.user.role}`)
    console.log(`   UserType: ${session.user.userType}`)
    console.log(`   É admin: ${isAdmin}`)
    console.log(`   Nome undefined: ${isNameUndefined}`)
    console.log(`   Role undefined: ${isRoleUndefined}`)
    
  } catch (error) {
    log(`Erro crítico: ${error.message}`, 'error')
    console.error(error)
  }
}

// Executar debug
debugSessionIssue()
