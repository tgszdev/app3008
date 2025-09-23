#!/usr/bin/env node

/**
 * ANÁLISE COMPLETA DO BANCO DE DADOS
 * ==================================
 * 
 * Este script analisa:
 * 1. Usuários existentes (incluindo admins)
 * 2. Estrutura das tabelas
 * 3. Dados e relacionamentos
 * 4. Problemas identificados
 * 5. Recomendações
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' })

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})

// Função para log
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

async function analyzeDatabase() {
  console.log('🔍 INICIANDO ANÁLISE COMPLETA DO BANCO DE DADOS\n')
  
  try {
    // =====================================================
    // 1. ANÁLISE DE USUÁRIOS EXISTENTES
    // =====================================================
    
    log('1. ANALISANDO USUÁRIOS EXISTENTES...', 'step')
    
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (usersError) {
      log(`Erro ao buscar usuários: ${usersError.message}`, 'error')
      return
    }
    
    log(`Total de usuários encontrados: ${allUsers?.length || 0}`, 'success')
    
    if (allUsers && allUsers.length > 0) {
      console.log('\n📋 USUÁRIOS EXISTENTES:')
      console.log('=' * 80)
      
      allUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name} (${user.email})`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Role: ${user.role}`)
        console.log(`   Departamento: ${user.department || 'N/A'}`)
        console.log(`   Ativo: ${user.is_active ? '✅' : '❌'}`)
        console.log(`   Último login: ${user.last_login || 'Nunca'}`)
        console.log(`   Criado em: ${user.created_at}`)
      })
      
      // Identificar usuários admin
      const adminUsers = allUsers.filter(user => 
        user.role === 'admin' || user.role_name === 'admin'
      )
      
      console.log(`\n👑 USUÁRIOS ADMIN IDENTIFICADOS: ${adminUsers.length}`)
      adminUsers.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.name} (${admin.email}) - Role: ${admin.role}`)
      })
    }
    
    // =====================================================
    // 2. ANÁLISE DE TICKETS EXISTENTES
    // =====================================================
    
    log('\n2. ANALISANDO TICKETS EXISTENTES...', 'step')
    
    const { data: allTickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (ticketsError) {
      log(`Erro ao buscar tickets: ${ticketsError.message}`, 'error')
    } else {
      log(`Total de tickets encontrados: ${allTickets?.length || 0}`, 'success')
      
      if (allTickets && allTickets.length > 0) {
        console.log('\n🎫 TICKETS EXISTENTES (últimos 5):')
        console.log('=' * 50)
        
        allTickets.slice(0, 5).forEach((ticket, index) => {
          console.log(`\n${index + 1}. #${ticket.ticket_number} - ${ticket.title}`)
          console.log(`   Status: ${ticket.status}`)
          console.log(`   Prioridade: ${ticket.priority}`)
          console.log(`   Solicitante: ${ticket.requester_id}`)
          console.log(`   Atribuído: ${ticket.assigned_to || 'N/A'}`)
          console.log(`   Criado em: ${ticket.created_at}`)
        })
      }
    }
    
    // =====================================================
    // 3. VERIFICAR ESTRUTURA DAS TABELAS MULTI-TENANT
    // =====================================================
    
    log('\n3. VERIFICANDO TABELAS MULTI-TENANT...', 'step')
    
    // Verificar tabela contexts
    const { data: contexts, error: contextsError } = await supabase
      .from('contexts')
      .select('*')
    
    if (contextsError) {
      log(`Tabela 'contexts' não existe: ${contextsError.message}`, 'warning')
    } else {
      log(`Tabela 'contexts' existe com ${contexts?.length || 0} registros`, 'success')
    }
    
    // Verificar tabela matrix_users
    const { data: matrixUsers, error: matrixUsersError } = await supabase
      .from('matrix_users')
      .select('*')
    
    if (matrixUsersError) {
      log(`Tabela 'matrix_users' não existe: ${matrixUsersError.message}`, 'warning')
    } else {
      log(`Tabela 'matrix_users' existe com ${matrixUsers?.length || 0} registros`, 'success')
    }
    
    // Verificar tabela context_users
    const { data: contextUsers, error: contextUsersError } = await supabase
      .from('context_users')
      .select('*')
    
    if (contextUsersError) {
      log(`Tabela 'context_users' não existe: ${contextUsersError.message}`, 'warning')
    } else {
      log(`Tabela 'context_users' existe com ${contextUsers?.length || 0} registros`, 'success')
    }
    
    // Verificar tabela matrix_user_contexts
    const { data: matrixUserContexts, error: matrixUserContextsError } = await supabase
      .from('matrix_user_contexts')
      .select('*')
    
    if (matrixUserContextsError) {
      log(`Tabela 'matrix_user_contexts' não existe: ${matrixUserContextsError.message}`, 'warning')
    } else {
      log(`Tabela 'matrix_user_contexts' existe com ${matrixUserContexts?.length || 0} registros`, 'success')
    }
    
    // =====================================================
    // 4. ANÁLISE DE MÓDULOS E CATEGORIAS
    // =====================================================
    
    log('\n4. ANALISANDO MÓDULOS E CATEGORIAS...', 'step')
    
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('*')
    
    if (modulesError) {
      log(`Erro ao buscar módulos: ${modulesError.message}`, 'error')
    } else {
      log(`Módulos encontrados: ${modules?.length || 0}`, 'success')
    }
    
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
    
    if (categoriesError) {
      log(`Erro ao buscar categorias: ${categoriesError.message}`, 'error')
    } else {
      log(`Categorias encontradas: ${categories?.length || 0}`, 'success')
    }
    
    // =====================================================
    // 5. VERIFICAR ROLES E PERMISSÕES
    // =====================================================
    
    log('\n5. ANALISANDO ROLES E PERMISSÕES...', 'step')
    
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
    
    if (rolesError) {
      log(`Erro ao buscar roles: ${rolesError.message}`, 'error')
    } else {
      log(`Roles encontrados: ${roles?.length || 0}`, 'success')
      
      if (roles && roles.length > 0) {
        console.log('\n🔐 ROLES EXISTENTES:')
        roles.forEach((role, index) => {
          console.log(`${index + 1}. ${role.name} - ${role.description || 'Sem descrição'}`)
        })
      }
    }
    
    // =====================================================
    // 6. RELATÓRIO DE PROBLEMAS E RECOMENDAÇÕES
    // =====================================================
    
    console.log('\n📊 RELATÓRIO DE ANÁLISE:')
    console.log('=' * 50)
    
    // Problemas identificados
    const problems = []
    const recommendations = []
    
    // Verificar se há usuários admin
    const hasAdmins = allUsers?.some(user => 
      user.role === 'admin' || user.role_name === 'admin'
    )
    
    if (!hasAdmins) {
      problems.push('❌ Nenhum usuário admin encontrado')
      recommendations.push('✅ Criar pelo menos um usuário admin')
    } else {
      console.log('✅ Usuários admin encontrados')
    }
    
    // Verificar tabelas multi-tenant
    const missingTables = []
    if (contextsError) missingTables.push('contexts')
    if (matrixUsersError) missingTables.push('matrix_users')
    if (contextUsersError) missingTables.push('context_users')
    if (matrixUserContextsError) missingTables.push('matrix_user_contexts')
    
    if (missingTables.length > 0) {
      problems.push(`❌ Tabelas multi-tenant faltando: ${missingTables.join(', ')}`)
      recommendations.push('✅ Executar schema multi-tenant no Supabase Dashboard')
    } else {
      console.log('✅ Todas as tabelas multi-tenant existem')
    }
    
    // Verificar dados de teste
    const testUsers = allUsers?.filter(user => 
      user.email.includes('example.com') || user.email.includes('test')
    )
    
    if (testUsers && testUsers.length > 0) {
      console.log(`✅ ${testUsers.length} usuários de teste encontrados`)
    }
    
    // Exibir problemas
    if (problems.length > 0) {
      console.log('\n⚠️ PROBLEMAS IDENTIFICADOS:')
      problems.forEach(problem => console.log(problem))
    }
    
    // Exibir recomendações
    if (recommendations.length > 0) {
      console.log('\n💡 RECOMENDAÇÕES:')
      recommendations.forEach(rec => console.log(rec))
    }
    
    console.log('\n🎉 ANÁLISE CONCLUÍDA!')
    
  } catch (error) {
    log(`Erro crítico na análise: ${error.message}`, 'error')
    console.error(error)
  }
}

// Executar análise
analyzeDatabase()
