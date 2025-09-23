#!/usr/bin/env node

/**
 * VERIFICAÇÃO COMPLETA DO SISTEMA
 * ================================
 * 
 * Este script verifica:
 * 1. Todas as rotas do sistema
 * 2. Todos os usuários
 * 3. Middleware de autenticação
 * 4. Estrutura de arquivos
 * 5. Configurações
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

async function completeSystemVerification() {
  console.log('🔍 VERIFICAÇÃO COMPLETA DO SISTEMA\n')
  
  const allProblems = []
  const allSolutions = []
  
  try {
    // 1. VERIFICAR TODAS AS ROTAS
    log('1. VERIFICANDO TODAS AS ROTAS...', 'step')
    
    const routeFiles = [
      // Páginas principais
      'src/app/page.tsx',
      'src/app/login/page.tsx',
      'src/app/setup/page.tsx',
      'src/app/status/page.tsx',
      
      // Dashboard
      'src/app/dashboard/page.tsx',
      'src/app/dashboard/layout.tsx',
      'src/app/dashboard/analytics/page.tsx',
      'src/app/dashboard/categories/page.tsx',
      'src/app/dashboard/comments/page.tsx',
      'src/app/dashboard/fix-roles/page.tsx',
      'src/app/dashboard/knowledge-base/page.tsx',
      'src/app/dashboard/notifications/page.tsx',
      'src/app/dashboard/reports/page.tsx',
      'src/app/dashboard/satisfaction/page.tsx',
      'src/app/dashboard/settings/page.tsx',
      'src/app/dashboard/sla/page.tsx',
      'src/app/dashboard/test-permissions/page.tsx',
      'src/app/dashboard/test-protected/page.tsx',
      'src/app/dashboard/tickets/page.tsx',
      'src/app/dashboard/tickets/[id]/page.tsx',
      'src/app/dashboard/tickets/new/page.tsx',
      'src/app/dashboard/timesheets/page.tsx',
      'src/app/dashboard/timesheets/admin/page.tsx',
      'src/app/dashboard/timesheets/analytics/page.tsx',
      'src/app/dashboard/timesheets/permissions/page.tsx',
      'src/app/dashboard/users/page.tsx',
      
      // API Routes
      'src/app/api/auth/[...nextauth]/route.ts',
      'src/app/api/auth/check-session/route.ts',
      'src/app/api/auth/check-session-realtime/route.ts',
      'src/app/api/auth/logout/route.ts',
      'src/app/api/auth/session-events/route.ts',
      'src/app/api/auth/verify/route.ts',
      'src/app/api/auth/verify-password/route.ts',
      'src/app/api/dashboard/stats/route.ts',
      'src/app/api/tickets/route.ts',
      'src/app/api/users/route.ts',
      
      // Componentes
      'src/components/OrganizationSelector.tsx',
      'src/components/dashboard/HybridDashboard.tsx',
      'src/contexts/OrganizationContext.tsx',
      
      // Configurações
      'src/lib/auth.ts',
      'src/lib/auth-config.ts',
      'src/lib/auth-hybrid.ts',
      'src/lib/supabase-client.ts'
    ]
    
    const existingRoutes = []
    const missingRoutes = []
    
    for (const route of routeFiles) {
      const filePath = path.join(process.cwd(), route)
      if (fs.existsSync(filePath)) {
        existingRoutes.push(route)
        log(`   ✅ ${route}`, 'success')
      } else {
        missingRoutes.push(route)
        log(`   ❌ ${route}`, 'error')
        allProblems.push(`❌ Arquivo não encontrado: ${route}`)
      }
    }
    
    log(`   Total de rotas: ${routeFiles.length}`, 'info')
    log(`   Rotas existentes: ${existingRoutes.length}`, 'success')
    log(`   Rotas faltando: ${missingRoutes.length}`, 'error')
    
    // 2. VERIFICAR TODOS OS USUÁRIOS
    log('\n2. VERIFICANDO TODOS OS USUÁRIOS...', 'step')
    
    // Usuários da tabela original
    const { data: originalUsers, error: originalUsersError } = await supabase
      .from('users')
      .select('*')
    
    if (originalUsersError) {
      log(`   ❌ Erro ao buscar usuários originais: ${originalUsersError.message}`, 'error')
    } else {
      log(`   ✅ ${originalUsers?.length || 0} usuários na tabela users`, 'success')
      if (originalUsers && originalUsers.length > 0) {
        originalUsers.forEach((user, index) => {
          console.log(`      ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role} - Ativo: ${user.is_active ? '✅' : '❌'}`)
        })
      }
    }
    
    // Usuários matriz
    const { data: matrixUsers, error: matrixUsersError } = await supabase
      .from('matrix_users')
      .select('*')
    
    if (matrixUsersError) {
      log(`   ❌ Erro ao buscar usuários matriz: ${matrixUsersError.message}`, 'error')
    } else {
      log(`   ✅ ${matrixUsers?.length || 0} usuários na tabela matrix_users`, 'success')
      if (matrixUsers && matrixUsers.length > 0) {
        matrixUsers.forEach((user, index) => {
          console.log(`      ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role} - Ativo: ${user.is_active ? '✅' : '❌'}`)
        })
      }
    }
    
    // Usuários de contexto
    const { data: contextUsers, error: contextUsersError } = await supabase
      .from('context_users')
      .select('*, contexts(name, slug)')
    
    if (contextUsersError) {
      log(`   ❌ Erro ao buscar usuários de contexto: ${contextUsersError.message}`, 'error')
    } else {
      log(`   ✅ ${contextUsers?.length || 0} usuários na tabela context_users`, 'success')
      if (contextUsers && contextUsers.length > 0) {
        contextUsers.forEach((user, index) => {
          console.log(`      ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role} - Contexto: ${user.contexts?.name || 'N/A'} - Ativo: ${user.is_active ? '✅' : '❌'}`)
        })
      }
    }
    
    // 3. VERIFICAR MIDDLEWARE DE AUTENTICAÇÃO
    log('\n3. VERIFICANDO MIDDLEWARE DE AUTENTICAÇÃO...', 'step')
    
    const middlewareFiles = [
      'middleware.ts',
      'src/middleware.ts',
      'src/app/api/auth/[...nextauth]/route.ts'
    ]
    
    for (const middlewareFile of middlewareFiles) {
      const filePath = path.join(process.cwd(), middlewareFile)
      if (fs.existsSync(filePath)) {
        log(`   ✅ ${middlewareFile} existe`, 'success')
        
        // Verificar conteúdo do middleware
        const content = fs.readFileSync(filePath, 'utf8')
        if (content.includes('auth') || content.includes('NextAuth')) {
          log(`   ✅ ${middlewareFile} contém lógica de autenticação`, 'success')
        } else {
          log(`   ⚠️ ${middlewareFile} pode não ter lógica de autenticação`, 'warning')
        }
      } else {
        log(`   ❌ ${middlewareFile} não existe`, 'error')
        allProblems.push(`❌ Middleware não encontrado: ${middlewareFile}`)
      }
    }
    
    // 4. VERIFICAR ESTRUTURA DE ARQUIVOS CRÍTICOS
    log('\n4. VERIFICANDO ESTRUTURA DE ARQUIVOS CRÍTICOS...', 'step')
    
    const criticalFiles = [
      'src/lib/auth.ts',
      'src/lib/auth-hybrid.ts',
      'src/components/OrganizationSelector.tsx',
      'src/contexts/OrganizationContext.tsx',
      'src/components/dashboard/HybridDashboard.tsx'
    ]
    
    for (const file of criticalFiles) {
      const filePath = path.join(process.cwd(), file)
      if (fs.existsSync(filePath)) {
        log(`   ✅ ${file} existe`, 'success')
        
        // Verificar imports
        const content = fs.readFileSync(filePath, 'utf8')
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
        allProblems.push(`❌ Arquivo crítico não encontrado: ${file}`)
      }
    }
    
    // 5. VERIFICAR CONFIGURAÇÕES
    log('\n5. VERIFICANDO CONFIGURAÇÕES...', 'step')
    
    const configFiles = [
      'package.json',
      'next.config.mjs',
      'tailwind.config.mjs',
      'tsconfig.json',
      '.env.local'
    ]
    
    for (const configFile of configFiles) {
      const filePath = path.join(process.cwd(), configFile)
      if (fs.existsSync(filePath)) {
        log(`   ✅ ${configFile} existe`, 'success')
      } else {
        log(`   ❌ ${configFile} não existe`, 'error')
        allProblems.push(`❌ Arquivo de configuração não encontrado: ${configFile}`)
      }
    }
    
    // 6. VERIFICAR ROLES E PERMISSÕES
    log('\n6. VERIFICANDO ROLES E PERMISSÕES...', 'step')
    
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
    
    if (rolesError) {
      log(`   ❌ Erro ao buscar roles: ${rolesError.message}`, 'error')
    } else {
      log(`   ✅ ${roles?.length || 0} roles encontrados`, 'success')
      if (roles && roles.length > 0) {
        roles.forEach((role, index) => {
          const permissions = Object.entries(role.permissions || {})
            .filter(([key, value]) => value === true)
            .length
          console.log(`      ${index + 1}. ${role.name} - ${permissions} permissões ativas`)
        })
      }
    }
    
    // 7. VERIFICAR CONTEXTOS
    log('\n7. VERIFICANDO CONTEXTOS...', 'step')
    
    const { data: contexts, error: contextsError } = await supabase
      .from('contexts')
      .select('*')
    
    if (contextsError) {
      log(`   ❌ Erro ao buscar contextos: ${contextsError.message}`, 'error')
    } else {
      log(`   ✅ ${contexts?.length || 0} contextos encontrados`, 'success')
      if (contexts && contexts.length > 0) {
        contexts.forEach((context, index) => {
          console.log(`      ${index + 1}. ${context.name} (${context.type}) - Slug: ${context.slug}`)
        })
      }
    }
    
    // 8. VERIFICAR RELACIONAMENTOS
    log('\n8. VERIFICANDO RELACIONAMENTOS...', 'step')
    
    const { data: relationships, error: relError } = await supabase
      .from('matrix_user_contexts')
      .select('*, matrix_users(name, email), contexts(name, slug)')
    
    if (relError) {
      log(`   ❌ Erro ao buscar relacionamentos: ${relError.message}`, 'error')
    } else {
      log(`   ✅ ${relationships?.length || 0} relacionamentos encontrados`, 'success')
      if (relationships && relationships.length > 0) {
        relationships.forEach((rel, index) => {
          console.log(`      ${index + 1}. ${rel.matrix_users?.name} → ${rel.contexts?.name} (Pode gerenciar: ${rel.can_manage ? '✅' : '❌'})`)
        })
      }
    }
    
    // 9. VERIFICAR TICKETS
    log('\n9. VERIFICANDO TICKETS...', 'step')
    
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .limit(10)
    
    if (ticketsError) {
      log(`   ❌ Erro ao buscar tickets: ${ticketsError.message}`, 'error')
    } else {
      log(`   ✅ ${tickets?.length || 0} tickets encontrados (limitado a 10)`, 'success')
      if (tickets && tickets.length > 0) {
        tickets.forEach((ticket, index) => {
          console.log(`      ${index + 1}. ${ticket.title} - Status: ${ticket.status} - Prioridade: ${ticket.priority}`)
        })
      }
    }
    
    // 10. RESUMO FINAL
    console.log('\n📊 RESUMO FINAL:')
    console.log('=' * 50)
    
    if (allProblems.length === 0) {
      console.log('🎉 SISTEMA TOTALMENTE FUNCIONAL!')
      console.log('Todas as verificações passaram com sucesso.')
    } else {
      console.log(`⚠️ ${allProblems.length} PROBLEMAS IDENTIFICADOS:`)
      allProblems.forEach((problem, index) => {
        console.log(`${index + 1}. ${problem}`)
      })
      
      console.log(`\n💡 ${allSolutions.length} SOLUÇÕES:`)
      allSolutions.forEach((solution, index) => {
        console.log(`${index + 1}. ${solution}`)
      })
    }
    
    // 11. INFORMAÇÕES PARA DEBUG
    console.log('\n🔧 INFORMAÇÕES PARA DEBUG:')
    console.log(`   Supabase URL: ${supabaseUrl ? '✅' : '❌'}`)
    console.log(`   Service Key: ${supabaseServiceKey ? '✅' : '❌'}`)
    console.log(`   NextAuth Secret: ${process.env.NEXTAUTH_SECRET ? '✅' : '❌'}`)
    console.log(`   NextAuth URL: ${process.env.NEXTAUTH_URL ? '✅' : '❌'}`)
    console.log(`   Usuários originais: ${originalUsers?.length || 0}`)
    console.log(`   Usuários matriz: ${matrixUsers?.length || 0}`)
    console.log(`   Usuários contexto: ${contextUsers?.length || 0}`)
    console.log(`   Roles: ${roles?.length || 0}`)
    console.log(`   Contextos: ${contexts?.length || 0}`)
    console.log(`   Relacionamentos: ${relationships?.length || 0}`)
    console.log(`   Tickets: ${tickets?.length || 0}`)
    
  } catch (error) {
    log(`Erro crítico: ${error.message}`, 'error')
    console.error(error)
  }
}

// Executar verificação completa
completeSystemVerification()
