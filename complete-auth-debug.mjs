#!/usr/bin/env node

/**
 * VERIFICAÇÃO PROFUNDA COMPLETA DO SISTEMA DE AUTENTICAÇÃO
 * =========================================================
 * 
 * Este script faz uma análise completa:
 * 1. Verifica todos os arquivos de autenticação
 * 2. Testa o fluxo completo
 * 3. Verifica o banco de dados
 * 4. Simula o processo de login
 * 5. Identifica todos os problemas
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

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

async function completeAuthDebug() {
  console.log('🔍 VERIFICAÇÃO PROFUNDA COMPLETA DO SISTEMA DE AUTENTICAÇÃO\n')
  
  const userEmail = 'rodrigues2205@icloud.com'
  const allProblems = []
  const allSolutions = []
  
  try {
    // 1. VERIFICAR ARQUIVOS DE AUTENTICAÇÃO
    log('1. VERIFICANDO ARQUIVOS DE AUTENTICAÇÃO...', 'step')
    
    const authFiles = [
      'src/lib/auth.ts',
      'src/lib/auth-config.ts',
      'src/lib/auth-hybrid.ts',
      'src/app/api/auth/[...nextauth]/route.ts'
    ]
    
    for (const file of authFiles) {
      try {
        const filePath = path.join(process.cwd(), file)
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8')
          log(`   ✅ ${file} existe`, 'success')
          
          // Verificar imports
          if (file === 'src/lib/auth.ts') {
            if (content.includes('authHybridConfig')) {
              log(`   ✅ ${file} usa authHybridConfig`, 'success')
            } else {
              log(`   ❌ ${file} NÃO usa authHybridConfig`, 'error')
              allProblems.push(`❌ ${file} não está usando authHybridConfig`)
              allSolutions.push(`✅ Corrigir import em ${file}`)
            }
          }
        } else {
          log(`   ❌ ${file} não existe`, 'error')
          allProblems.push(`❌ ${file} não encontrado`)
        }
      } catch (error) {
        log(`   ❌ Erro ao verificar ${file}: ${error.message}`, 'error')
      }
    }
    
    // 2. VERIFICAR VARIÁVEIS DE AMBIENTE
    log('\n2. VERIFICANDO VARIÁVEIS DE AMBIENTE...', 'step')
    
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ]
    
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        log(`   ✅ ${envVar} configurado`, 'success')
      } else {
        log(`   ❌ ${envVar} não configurado`, 'error')
        allProblems.push(`❌ ${envVar} não configurado`)
        allSolutions.push(`✅ Configurar ${envVar} no .env.local`)
      }
    }
    
    // 3. VERIFICAR CONEXÃO COM SUPABASE
    log('\n3. VERIFICANDO CONEXÃO COM SUPABASE...', 'step')
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      if (error) {
        log(`   ❌ Erro de conexão: ${error.message}`, 'error')
        allProblems.push(`❌ Erro de conexão com Supabase: ${error.message}`)
      } else {
        log('   ✅ Conexão com Supabase funcionando', 'success')
      }
    } catch (error) {
      log(`   ❌ Erro crítico de conexão: ${error.message}`, 'error')
      allProblems.push(`❌ Erro crítico de conexão: ${error.message}`)
    }
    
    // 4. VERIFICAR ESTRUTURA DO BANCO DE DADOS
    log('\n4. VERIFICANDO ESTRUTURA DO BANCO DE DADOS...', 'step')
    
    const requiredTables = [
      'users',
      'matrix_users',
      'context_users',
      'contexts',
      'matrix_user_contexts',
      'roles',
      'tickets'
    ]
    
    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          log(`   ❌ Tabela ${table}: ${error.message}`, 'error')
          allProblems.push(`❌ Tabela ${table} com problemas: ${error.message}`)
        } else {
          log(`   ✅ Tabela ${table} OK`, 'success')
        }
      } catch (error) {
        log(`   ❌ Erro ao verificar ${table}: ${error.message}`, 'error')
      }
    }
    
    // 5. VERIFICAR USUÁRIO ESPECÍFICO
    log('\n5. VERIFICANDO USUÁRIO ESPECÍFICO...', 'step')
    
    // Verificar em users (tabela original)
    const { data: originalUser, error: originalError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single()
    
    if (originalError) {
      log(`   ❌ Usuário não encontrado em users: ${originalError.message}`, 'error')
      allProblems.push(`❌ Usuário não encontrado em users`)
    } else if (originalUser) {
      log(`   ✅ Usuário encontrado em users: ${originalUser.name}`, 'success')
      console.log(`      Role: ${originalUser.role}`)
      console.log(`      Ativo: ${originalUser.is_active}`)
      console.log(`      Último login: ${originalUser.last_login || 'Nunca'}`)
    }
    
    // Verificar em matrix_users
    const { data: matrixUser, error: matrixError } = await supabase
      .from('matrix_users')
      .select('*')
      .eq('email', userEmail)
      .single()
    
    if (matrixError) {
      log(`   ❌ Usuário não encontrado em matrix_users: ${matrixError.message}`, 'error')
      allProblems.push(`❌ Usuário não migrado para matrix_users`)
    } else if (matrixUser) {
      log(`   ✅ Usuário encontrado em matrix_users: ${matrixUser.name}`, 'success')
      console.log(`      Role: ${matrixUser.role}`)
      console.log(`      Ativo: ${matrixUser.is_active}`)
    }
    
    // Verificar em context_users
    const { data: contextUser, error: contextError } = await supabase
      .from('context_users')
      .select('*, contexts(name, slug)')
      .eq('email', userEmail)
      .single()
    
    if (contextError) {
      log(`   ❌ Usuário não encontrado em context_users: ${contextError.message}`, 'error')
    } else if (contextUser) {
      log(`   ✅ Usuário encontrado em context_users: ${contextUser.name}`, 'success')
      console.log(`      Role: ${contextUser.role}`)
      console.log(`      Contexto: ${contextUser.contexts?.name}`)
    }
    
    // 6. VERIFICAR RELACIONAMENTOS
    log('\n6. VERIFICANDO RELACIONAMENTOS...', 'step')
    
    if (matrixUser) {
      const { data: relationships, error: relError } = await supabase
        .from('matrix_user_contexts')
        .select('*, contexts(name, slug, type)')
        .eq('matrix_user_id', matrixUser.id)
      
      if (relError) {
        log(`   ❌ Erro ao buscar relacionamentos: ${relError.message}`, 'error')
        allProblems.push(`❌ Erro ao buscar relacionamentos: ${relError.message}`)
      } else if (relationships && relationships.length > 0) {
        log(`   ✅ ${relationships.length} relacionamentos encontrados`, 'success')
        relationships.forEach((rel, index) => {
          console.log(`      ${index + 1}. ${rel.contexts?.name} - Pode gerenciar: ${rel.can_manage ? '✅' : '❌'}`)
          if (!rel.can_manage) {
            allProblems.push(`❌ Relacionamento ${rel.contexts?.name} sem can_manage`)
            allSolutions.push(`✅ Corrigir can_manage para ${rel.contexts?.name}`)
          }
        })
      } else {
        log(`   ❌ Nenhum relacionamento encontrado`, 'error')
        allProblems.push(`❌ Usuário matriz sem relacionamentos`)
        allSolutions.push(`✅ Criar relacionamentos matrix_user_contexts`)
      }
    }
    
    // 7. VERIFICAR ROLES E PERMISSÕES
    log('\n7. VERIFICANDO ROLES E PERMISSÕES...', 'step')
    
    const userRole = originalUser?.role || matrixUser?.role || contextUser?.role
    if (userRole) {
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('*')
        .eq('name', userRole)
        .single()
      
      if (roleError) {
        log(`   ❌ Role ${userRole} não encontrado: ${roleError.message}`, 'error')
        allProblems.push(`❌ Role ${userRole} não encontrado`)
      } else if (roleData) {
        log(`   ✅ Role ${userRole} encontrado`, 'success')
        console.log(`      Descrição: ${roleData.description}`)
        
        const activePermissions = Object.entries(roleData.permissions || {})
          .filter(([key, value]) => value === true)
          .length
        
        console.log(`      Permissões ativas: ${activePermissions}`)
        
        if (activePermissions === 0) {
          allProblems.push(`❌ Role ${userRole} sem permissões`)
          allSolutions.push(`✅ Configurar permissões para role ${userRole}`)
        }
      }
    }
    
    // 8. SIMULAR PROCESSO DE LOGIN COMPLETO
    log('\n8. SIMULANDO PROCESSO DE LOGIN COMPLETO...', 'step')
    
    // Simular authorize function do auth-hybrid.ts
    log('   Simulando authorize function...', 'step')
    
    let loginUser = null
    let userType = 'legacy'
    
    // Tentar como matrix user
    if (matrixUser && matrixUser.is_active) {
      loginUser = matrixUser
      userType = 'matrix'
      log('   ✅ Login como matrix user seria bem-sucedido', 'success')
    }
    // Tentar como context user
    else if (contextUser && contextUser.is_active) {
      loginUser = contextUser
      userType = 'context'
      log('   ✅ Login como context user seria bem-sucedido', 'success')
    }
    // Tentar como legacy user
    else if (originalUser && originalUser.is_active) {
      loginUser = originalUser
      userType = 'legacy'
      log('   ✅ Login como legacy user seria bem-sucedido', 'success')
    }
    
    if (!loginUser) {
      log('   ❌ Nenhum login seria bem-sucedido', 'error')
      allProblems.push(`❌ Usuário não pode fazer login`)
      allSolutions.push(`✅ Verificar se usuário está ativo e migrado`)
    } else {
      log(`   ✅ Login seria bem-sucedido como ${userType} user`, 'success')
      
      // Simular dados de sessão
      const sessionData = {
        user: {
          id: loginUser.id,
          email: loginUser.email,
          name: loginUser.name,
          role: loginUser.role,
          userType: userType
        }
      }
      
      console.log(`      Nome: ${sessionData.user.name}`)
      console.log(`      Email: ${sessionData.user.email}`)
      console.log(`      Role: ${sessionData.user.role}`)
      console.log(`      Tipo: ${sessionData.user.userType}`)
      
      // Verificar se o nome não é undefined
      if (!sessionData.user.name || sessionData.user.name === 'undefined') {
        allProblems.push(`❌ Nome do usuário está undefined`)
        allSolutions.push(`✅ Corrigir nome do usuário no banco`)
      }
    }
    
    // 9. VERIFICAR COMPONENTES DE UI
    log('\n9. VERIFICANDO COMPONENTES DE UI...', 'step')
    
    const uiFiles = [
      'src/app/login/page.tsx',
      'src/components/OrganizationSelector.tsx',
      'src/contexts/OrganizationContext.tsx',
      'src/components/dashboard/HybridDashboard.tsx'
    ]
    
    for (const file of uiFiles) {
      try {
        const filePath = path.join(process.cwd(), file)
        if (fs.existsSync(filePath)) {
          log(`   ✅ ${file} existe`, 'success')
        } else {
          log(`   ❌ ${file} não existe`, 'error')
          allProblems.push(`❌ ${file} não encontrado`)
        }
      } catch (error) {
        log(`   ❌ Erro ao verificar ${file}: ${error.message}`, 'error')
      }
    }
    
    // 10. RESUMO FINAL
    console.log('\n📊 RESUMO FINAL:')
    console.log('=' * 50)
    
    if (allProblems.length === 0) {
      console.log('🎉 NENHUM PROBLEMA IDENTIFICADO!')
      console.log('O sistema deve estar funcionando corretamente.')
    } else {
      console.log(`⚠️ ${allProblems.length} PROBLEMAS IDENTIFICADOS:`)
      allProblems.forEach((problem, index) => {
        console.log(`${index + 1}. ${problem}`)
      })
      
      console.log(`\n💡 ${allSolutions.length} SOLUÇÕES:`)
      allSolutions.forEach((solution, index) => {
        console.log(`${index + 1}. ${solution}`)
      })
      
      console.log('\n🔧 PRÓXIMOS PASSOS:')
      console.log('1. Corrigir os problemas identificados')
      console.log('2. Testar o sistema novamente')
      console.log('3. Verificar se o login funciona')
    }
    
    // 11. INFORMAÇÕES PARA DEBUG
    console.log('\n🔧 INFORMAÇÕES PARA DEBUG:')
    console.log(`   Email testado: ${userEmail}`)
    console.log(`   Supabase URL: ${supabaseUrl ? '✅' : '❌'}`)
    console.log(`   Service Key: ${supabaseServiceKey ? '✅' : '❌'}`)
    console.log(`   NextAuth Secret: ${process.env.NEXTAUTH_SECRET ? '✅' : '❌'}`)
    console.log(`   NextAuth URL: ${process.env.NEXTAUTH_URL ? '✅' : '❌'}`)
    
  } catch (error) {
    log(`Erro crítico: ${error.message}`, 'error')
    console.error(error)
  }
}

// Executar verificação completa
completeAuthDebug()
