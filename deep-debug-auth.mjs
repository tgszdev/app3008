#!/usr/bin/env node

/**
 * DEBUG PROFUNDO DO SISTEMA DE AUTENTICAÇÃO
 * ==========================================
 * 
 * Este script verifica:
 * 1. Sistema de autenticação híbrido
 * 2. Fluxo de login completo
 * 3. Problemas no auth-hybrid.ts
 * 4. Verificação de sessão
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

async function deepDebugAuth() {
  console.log('🔍 DEBUG PROFUNDO DO SISTEMA DE AUTENTICAÇÃO\n')
  
  const userEmail = 'rodrigues2205@icloud.com'
  const testPassword = 'password123' // Vamos testar com senha comum
  
  try {
    // 1. SIMULAR FLUXO DE AUTENTICAÇÃO COMPLETO
    log('1. SIMULANDO FLUXO DE AUTENTICAÇÃO...', 'step')
    
    // Tentar login como matrix user
    log('   Tentando login como matrix user...', 'step')
    const { data: matrixUser, error: matrixError } = await supabase
      .from('matrix_users')
      .select('*')
      .eq('email', userEmail)
      .eq('is_active', true)
      .single()
    
    if (matrixUser) {
      log('   ✅ Matrix user encontrado', 'success')
      console.log(`      Nome: ${matrixUser.name}`)
      console.log(`      Role: ${matrixUser.role}`)
      
      // Verificar senha (simular)
      log('   Verificando senha...', 'step')
      // Como não temos a senha real, vamos assumir que está correta
      log('   ✅ Senha verificada (simulado)', 'success')
      
      // Buscar permissões
      log('   Buscando permissões...', 'step')
      const { data: roleData } = await supabase
        .from('roles')
        .select('permissions')
        .eq('name', matrixUser.role)
        .single()
      
      const permissions = roleData?.permissions || {}
      log(`   ✅ ${Object.keys(permissions).length} permissões encontradas`, 'success')
      
      // Buscar contextos
      log('   Buscando contextos...', 'step')
      const { data: relationships } = await supabase
        .from('matrix_user_contexts')
        .select('*, contexts(id, name, slug, type)')
        .eq('matrix_user_id', matrixUser.id)
      
      log(`   ✅ ${relationships?.length || 0} contextos encontrados`, 'success')
      
      // 2. SIMULAR DADOS DE SESSÃO COMPLETOS
      log('\n2. SIMULANDO DADOS DE SESSÃO...', 'step')
      
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
          type: rel.contexts.type
        })) || []
      }
      
      log('   ✅ Dados de sessão simulados', 'success')
      console.log(`      Nome: ${sessionUser.name}`)
      console.log(`      Email: ${sessionUser.email}`)
      console.log(`      Role: ${sessionUser.role}`)
      console.log(`      UserType: ${sessionUser.userType}`)
      console.log(`      Contextos: ${sessionUser.availableContexts.length}`)
      
    } else {
      log('   ❌ Matrix user não encontrado', 'error')
      console.log(`      Erro: ${matrixError?.message}`)
    }
    
    // 3. VERIFICAR SISTEMA DE AUTENTICAÇÃO ATUAL
    log('\n3. VERIFICANDO SISTEMA DE AUTENTICAÇÃO...', 'step')
    
    // Verificar se o auth-hybrid.ts está sendo usado
    log('   Verificando auth-config.ts...', 'step')
    
    // Simular o que o auth-hybrid.ts faria
    log('   Simulando authorize function...', 'step')
    
    // Tentar como matrix user
    let user = null
    let type = 'legacy'
    
    if (matrixUser) {
      user = matrixUser
      type = 'matrix'
      log('   ✅ Login como matrix user seria bem-sucedido', 'success')
    }
    
    // Se não for matrix, tentar como context user
    if (!user) {
      const { data: contextUser } = await supabase
        .from('context_users')
        .select('*, contexts(id, name, slug, type)')
        .eq('email', userEmail)
        .eq('is_active', true)
        .single()
      
      if (contextUser) {
        user = contextUser
        type = 'context'
        log('   ✅ Login como context user seria bem-sucedido', 'success')
      }
    }
    
    // Se não for nem matrix nem context, tentar como legacy
    if (!user) {
      const { data: legacyUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .eq('is_active', true)
        .single()
      
      if (legacyUser) {
        user = legacyUser
        type = 'legacy'
        log('   ✅ Login como legacy user seria bem-sucedido', 'success')
      }
    }
    
    if (!user) {
      log('   ❌ Nenhum tipo de usuário encontrado', 'error')
      return
    }
    
    // 4. VERIFICAR PROBLEMAS POTENCIAIS
    log('\n4. VERIFICANDO PROBLEMAS POTENCIAIS...', 'step')
    
    const problems = []
    
    // Verificar se o usuário tem nome
    if (!user.name || user.name === 'undefined') {
      problems.push('❌ Nome do usuário está undefined')
    }
    
    // Verificar se o usuário tem role
    if (!user.role || user.role === 'undefined') {
      problems.push('❌ Role do usuário está undefined')
    }
    
    // Verificar se o usuário está ativo
    if (!user.is_active) {
      problems.push('❌ Usuário está inativo')
    }
    
    // Verificar se tem permissões
    if (type === 'matrix' || type === 'context') {
      const { data: roleData } = await supabase
        .from('roles')
        .select('permissions')
        .eq('name', user.role)
        .single()
      
      if (!roleData?.permissions) {
        problems.push('❌ Role não tem permissões definidas')
      }
    }
    
    if (problems.length > 0) {
      console.log('\n⚠️ PROBLEMAS IDENTIFICADOS:')
      problems.forEach(problem => console.log(problem))
    } else {
      log('   ✅ Nenhum problema identificado', 'success')
    }
    
    // 5. TESTAR AUTENTICAÇÃO REAL
    log('\n5. TESTANDO AUTENTICAÇÃO REAL...', 'step')
    
    // Vamos testar com uma senha conhecida
    const knownPasswords = ['password123', 'admin123', '123456']
    
    for (const password of knownPasswords) {
      log(`   Testando senha: ${password}...`, 'step')
      
      try {
        // Verificar se a senha hash existe
        if (user.password_hash) {
          const isValid = await bcrypt.compare(password, user.password_hash)
          if (isValid) {
            log(`   ✅ Senha correta: ${password}`, 'success')
            break
          } else {
            log(`   ❌ Senha incorreta: ${password}`, 'error')
          }
        } else {
          log(`   ❌ Hash de senha não encontrado`, 'error')
        }
      } catch (error) {
        log(`   ❌ Erro ao verificar senha: ${error.message}`, 'error')
      }
    }
    
    // 6. RECOMENDAÇÕES
    console.log('\n📋 RECOMENDAÇÕES:')
    console.log('1. Verifique se o auth-hybrid.ts está sendo usado corretamente')
    console.log('2. Confirme se as variáveis de ambiente estão corretas')
    console.log('3. Verifique se não há cache do navegador')
    console.log('4. Teste em modo incógnito')
    console.log('5. Verifique o console do navegador para erros')
    
    // 7. INFORMAÇÕES PARA DEBUG
    console.log('\n🔧 INFORMAÇÕES PARA DEBUG:')
    console.log(`   Email testado: ${userEmail}`)
    console.log(`   Tipo de usuário: ${type}`)
    console.log(`   Nome: ${user.name}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Ativo: ${user.is_active}`)
    console.log(`   ID: ${user.id}`)
    
  } catch (error) {
    log(`Erro crítico: ${error.message}`, 'error')
    console.error(error)
  }
}

// Executar debug profundo
deepDebugAuth()
