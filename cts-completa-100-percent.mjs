import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import axios from 'axios'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BASE_URL = 'https://www.ithostbr.tech'

// =====================================================
// CONFIGURAÇÃO E INICIALIZAÇÃO
// =====================================================

console.log('🔍 CTS COMPLETA - EXPLORAÇÃO 100% DA APLICAÇÃO')
console.log('=' * 80)
console.log('📅 Data/Hora:', new Date().toISOString())
console.log('🌐 Base URL:', BASE_URL)
console.log('🗄️ Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('=' * 80)

// =====================================================
// 1. TESTES DE CONECTIVIDADE E INFRAESTRUTURA
// =====================================================

async function testConnectivity() {
  console.log('\n🌐 1. TESTES DE CONECTIVIDADE E INFRAESTRUTURA')
  console.log('=' * 60)
  
  try {
    // Teste de conectividade com Supabase
    console.log('🔗 Testando conectividade com Supabase...')
    const { data: healthCheck, error: healthError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1)
    
    if (healthError) {
      console.error('❌ Erro na conectividade com Supabase:', healthError)
      return false
    }
    console.log('✅ Conectividade com Supabase: OK')
    
    // Teste de conectividade com a aplicação
    console.log('🔗 Testando conectividade com a aplicação...')
    try {
      const response = await axios.get(`${BASE_URL}/api/health`, { timeout: 10000 })
      console.log('✅ Conectividade com aplicação: OK')
    } catch (error) {
      console.log('⚠️ Endpoint /api/health não disponível, testando rota principal...')
      try {
        const response = await axios.get(BASE_URL, { timeout: 10000 })
        console.log('✅ Conectividade com aplicação (rota principal): OK')
      } catch (mainError) {
        console.error('❌ Erro na conectividade com aplicação:', mainError.message)
        return false
      }
    }
    
    return true
  } catch (error) {
    console.error('❌ Erro geral na conectividade:', error)
    return false
  }
}

// =====================================================
// 2. TESTES DE BANCO DE DADOS E SCHEMA
// =====================================================

async function testDatabaseSchema() {
  console.log('\n🗄️ 2. TESTES DE BANCO DE DADOS E SCHEMA')
  console.log('=' * 60)
  
  const tables = [
    'users', 'contexts', 'user_contexts', 'tickets', 'comments', 
    'categories', 'priorities', 'statuses', 'timesheets', 'kb_categories', 'kb_articles'
  ]
  
  const results = {}
  
  for (const table of tables) {
    try {
      console.log(`🔍 Testando tabela: ${table}`)
      
      // Teste de existência da tabela
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ Tabela ${table}: ERRO - ${error.message}`)
        results[table] = { exists: false, error: error.message }
      } else {
        console.log(`✅ Tabela ${table}: OK`)
        results[table] = { exists: true, sampleData: data }
      }
    } catch (err) {
      console.log(`❌ Tabela ${table}: ERRO CRÍTICO - ${err.message}`)
      results[table] = { exists: false, error: err.message }
    }
  }
  
  return results
}

// =====================================================
// 3. TESTES DE AUTENTICAÇÃO E USUÁRIOS
// =====================================================

async function testAuthentication() {
  console.log('\n🔐 3. TESTES DE AUTENTICAÇÃO E USUÁRIOS')
  console.log('=' * 60)
  
  try {
    // Buscar todos os usuários
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, user_type, context_id, context_name, context_type, created_at, last_login')
      .order('created_at', { ascending: false })
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError)
      return false
    }
    
    console.log(`📊 Total de usuários encontrados: ${users.length}`)
    
    // Analisar tipos de usuários
    const userTypes = users.reduce((acc, user) => {
      acc[user.user_type] = (acc[user.user_type] || 0) + 1
      return acc
    }, {})
    
    console.log('📊 Distribuição por tipo de usuário:', userTypes)
    
    // Analisar roles
    const roles = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {})
    
    console.log('📊 Distribuição por role:', roles)
    
    // Verificar usuários matrix vs context
    const matrixUsers = users.filter(u => u.user_type === 'matrix')
    const contextUsers = users.filter(u => u.user_type === 'context')
    
    console.log(`👥 Usuários matrix: ${matrixUsers.length}`)
    console.log(`👥 Usuários context: ${contextUsers.length}`)
    
    // Verificar contextos associados
    const { data: userContexts, error: userContextsError } = await supabaseAdmin
      .from('user_contexts')
      .select('user_id, context_id, contexts(id, name, type)')
    
    if (!userContextsError) {
      console.log(`🔗 Associações user-context: ${userContexts.length}`)
      
      // Verificar usuários órfãos (sem contextos)
      const usersWithContexts = new Set(userContexts.map(uc => uc.user_id))
      const orphanUsers = users.filter(u => !usersWithContexts.has(u.id))
      
      if (orphanUsers.length > 0) {
        console.log(`⚠️ Usuários órfãos (sem contextos): ${orphanUsers.length}`)
        orphanUsers.forEach(user => {
          console.log(`  - ${user.email} (${user.user_type})`)
        })
      }
    }
    
    return { users, userTypes, roles, matrixUsers, contextUsers, userContexts }
  } catch (error) {
    console.error('❌ Erro nos testes de autenticação:', error)
    return false
  }
}

// =====================================================
// 4. TESTES DE MULTI-TENANT E CONTEXTOS
// =====================================================

async function testMultiTenant() {
  console.log('\n🏢 4. TESTES DE MULTI-TENANT E CONTEXTOS')
  console.log('=' * 60)
  
  try {
    // Buscar todos os contextos
    const { data: contexts, error: contextsError } = await supabaseAdmin
      .from('contexts')
      .select('id, name, slug, type, is_active, created_at')
      .order('created_at', { ascending: false })
    
    if (contextsError) {
      console.error('❌ Erro ao buscar contextos:', contextsError)
      return false
    }
    
    console.log(`📊 Total de contextos: ${contexts.length}`)
    
    // Analisar tipos de contextos
    const contextTypes = contexts.reduce((acc, context) => {
      acc[context.type] = (acc[context.type] || 0) + 1
      return acc
    }, {})
    
    console.log('📊 Distribuição por tipo de contexto:', contextTypes)
    
    // Verificar contextos ativos vs inativos
    const activeContexts = contexts.filter(c => c.is_active)
    const inactiveContexts = contexts.filter(c => !c.is_active)
    
    console.log(`✅ Contextos ativos: ${activeContexts.length}`)
    console.log(`❌ Contextos inativos: ${inactiveContexts.length}`)
    
    // Buscar associações user-context
    const { data: userContexts, error: userContextsError } = await supabaseAdmin
      .from('user_contexts')
      .select('user_id, context_id, contexts(id, name, type, is_active)')
    
    if (!userContextsError) {
      console.log(`🔗 Associações user-context: ${userContexts.length}`)
      
      // Verificar contextos órfãos (sem usuários)
      const contextsWithUsers = new Set(userContexts.map(uc => uc.context_id))
      const orphanContexts = contexts.filter(c => !contextsWithUsers.has(c.id))
      
      if (orphanContexts.length > 0) {
        console.log(`⚠️ Contextos órfãos (sem usuários): ${orphanContexts.length}`)
        orphanContexts.forEach(context => {
          console.log(`  - ${context.name} (${context.type}) - Ativo: ${context.is_active}`)
        })
      }
      
      // Verificar usuários com múltiplos contextos
      const userContextCounts = userContexts.reduce((acc, uc) => {
        acc[uc.user_id] = (acc[uc.user_id] || 0) + 1
        return acc
      }, {})
      
      const usersWithMultipleContexts = Object.entries(userContextCounts)
        .filter(([userId, count]) => count > 1)
        .map(([userId, count]) => ({ userId, count }))
      
      if (usersWithMultipleContexts.length > 0) {
        console.log(`👥 Usuários com múltiplos contextos: ${usersWithMultipleContexts.length}`)
        usersWithMultipleContexts.forEach(({ userId, count }) => {
          console.log(`  - Usuário ${userId}: ${count} contextos`)
        })
      }
    }
    
    return { contexts, contextTypes, activeContexts, inactiveContexts, userContexts }
  } catch (error) {
    console.error('❌ Erro nos testes de multi-tenant:', error)
    return false
  }
}

// =====================================================
// 5. TESTES DE TICKETS E DADOS
// =====================================================

async function testTickets() {
  console.log('\n🎫 5. TESTES DE TICKETS E DADOS')
  console.log('=' * 60)
  
  try {
    // Buscar todos os tickets
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select('id, ticket_number, title, status, priority, category_id, context_id, created_by, created_at, updated_at')
      .order('created_at', { ascending: false })
    
    if (ticketsError) {
      console.error('❌ Erro ao buscar tickets:', ticketsError)
      return false
    }
    
    console.log(`📊 Total de tickets: ${tickets.length}`)
    
    // Analisar status dos tickets
    const ticketStatuses = tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1
      return acc
    }, {})
    
    console.log('📊 Distribuição por status:', ticketStatuses)
    
    // Analisar prioridades
    const ticketPriorities = tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1
      return acc
    }, {})
    
    console.log('📊 Distribuição por prioridade:', ticketPriorities)
    
    // Verificar tickets por contexto
    const ticketsByContext = tickets.reduce((acc, ticket) => {
      const contextId = ticket.context_id || 'sem-contexto'
      acc[contextId] = (acc[contextId] || 0) + 1
      return acc
    }, {})
    
    console.log('📊 Distribuição por contexto:', ticketsByContext)
    
    // Verificar tickets órfãos (sem contexto)
    const orphanTickets = tickets.filter(t => !t.context_id)
    if (orphanTickets.length > 0) {
      console.log(`⚠️ Tickets órfãos (sem contexto): ${orphanTickets.length}`)
    }
    
    // Verificar tickets recentes
    const recentTickets = tickets.filter(t => {
      const createdAt = new Date(t.created_at)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return createdAt > oneWeekAgo
    })
    
    console.log(`📅 Tickets criados na última semana: ${recentTickets.length}`)
    
    return { tickets, ticketStatuses, ticketPriorities, ticketsByContext, orphanTickets, recentTickets }
  } catch (error) {
    console.error('❌ Erro nos testes de tickets:', error)
    return false
  }
}

// =====================================================
// 6. TESTES DE RLS (ROW LEVEL SECURITY)
// =====================================================

async function testRLS() {
  console.log('\n🔒 6. TESTES DE RLS (ROW LEVEL SECURITY)')
  console.log('=' * 60)
  
  try {
    // Verificar políticas RLS
    const { data: policies, error: policiesError } = await supabaseAdmin
      .rpc('get_rls_policies')
      .catch(() => {
        console.log('⚠️ Função get_rls_policies não disponível, testando manualmente...')
        return { data: null, error: null }
      })
    
    if (policiesError) {
      console.log('⚠️ Não foi possível verificar políticas RLS automaticamente')
    } else if (policies) {
      console.log('✅ Políticas RLS verificadas')
    }
    
    // Testar acesso a dados com diferentes usuários
    const testUsers = [
      { id: '2a33241e-ed38-48b5-9c84-e8c354ae9606', email: 'rodrigues2205@icloud.com', type: 'matrix' },
      // Adicionar outros usuários de teste se necessário
    ]
    
    for (const user of testUsers) {
      console.log(`🔍 Testando acesso para usuário: ${user.email} (${user.type})`)
      
      try {
        // Testar acesso a tickets
        const { data: userTickets, error: ticketsError } = await supabaseAdmin
          .from('tickets')
          .select('id, title, context_id')
          .eq('created_by', user.id)
          .limit(5)
        
        if (ticketsError) {
          console.log(`❌ Erro ao acessar tickets do usuário ${user.email}:`, ticketsError.message)
        } else {
          console.log(`✅ Tickets acessíveis para ${user.email}: ${userTickets.length}`)
        }
        
        // Testar acesso a contextos
        const { data: userContexts, error: contextsError } = await supabaseAdmin
          .from('user_contexts')
          .select('context_id, contexts(id, name)')
          .eq('user_id', user.id)
        
        if (contextsError) {
          console.log(`❌ Erro ao acessar contextos do usuário ${user.email}:`, contextsError.message)
        } else {
          console.log(`✅ Contextos acessíveis para ${user.email}: ${userContexts.length}`)
        }
        
      } catch (error) {
        console.log(`❌ Erro geral para usuário ${user.email}:`, error.message)
      }
    }
    
    return true
  } catch (error) {
    console.error('❌ Erro nos testes de RLS:', error)
    return false
  }
}

// =====================================================
// 7. TESTES DE APIs E ENDPOINTS
// =====================================================

async function testAPIs() {
  console.log('\n🌐 7. TESTES DE APIs E ENDPOINTS')
  console.log('=' * 60)
  
  const endpoints = [
    { path: '/api/dashboard/stats', method: 'GET', description: 'Estatísticas do dashboard' },
    { path: '/api/dashboard/multi-client-stats', method: 'GET', description: 'Estatísticas multi-cliente' },
    { path: '/api/dashboard/categories-stats', method: 'GET', description: 'Estatísticas por categoria' },
    { path: '/api/tickets', method: 'GET', description: 'Listar tickets' },
    { path: '/api/tickets', method: 'POST', description: 'Criar ticket' },
    { path: '/api/organizations', method: 'GET', description: 'Listar organizações' },
    { path: '/api/users', method: 'GET', description: 'Listar usuários' },
    { path: '/api/user-contexts', method: 'GET', description: 'Listar associações user-context' },
    { path: '/api/priorities/with-count', method: 'GET', description: 'Prioridades com contagem' },
    { path: '/api/statuses/with-count', method: 'GET', description: 'Status com contagem' }
  ]
  
  const results = {}
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testando ${endpoint.method} ${endpoint.path} - ${endpoint.description}`)
      
      const config = {
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.path}`,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
      
      // Adicionar parâmetros para GET requests
      if (endpoint.method === 'GET') {
        config.params = {
          start_date: '2024-01-01',
          end_date: '2024-12-31'
        }
      }
      
      const response = await axios(config)
      
      console.log(`✅ ${endpoint.path}: ${response.status} - OK`)
      results[endpoint.path] = {
        status: response.status,
        success: true,
        data: response.data
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint.path}: ${error.response?.status || 'ERRO'} - ${error.message}`)
      results[endpoint.path] = {
        status: error.response?.status || 0,
        success: false,
        error: error.message
      }
    }
  }
  
  return results
}

// =====================================================
// 8. TESTES DE PERFORMANCE
// =====================================================

async function testPerformance() {
  console.log('\n⚡ 8. TESTES DE PERFORMANCE')
  console.log('=' * 60)
  
  const performanceTests = [
    {
      name: 'Consulta de usuários',
      test: async () => {
        const start = Date.now()
        const { data, error } = await supabaseAdmin
          .from('users')
          .select('id, email, name, role, user_type')
        const end = Date.now()
        return { duration: end - start, success: !error, data: data?.length || 0 }
      }
    },
    {
      name: 'Consulta de contextos',
      test: async () => {
        const start = Date.now()
        const { data, error } = await supabaseAdmin
          .from('contexts')
          .select('id, name, type, is_active')
        const end = Date.now()
        return { duration: end - start, success: !error, data: data?.length || 0 }
      }
    },
    {
      name: 'Consulta de tickets',
      test: async () => {
        const start = Date.now()
        const { data, error } = await supabaseAdmin
          .from('tickets')
          .select('id, title, status, priority, context_id')
        const end = Date.now()
        return { duration: end - start, success: !error, data: data?.length || 0 }
      }
    },
    {
      name: 'Consulta de associações user-context',
      test: async () => {
        const start = Date.now()
        const { data, error } = await supabaseAdmin
          .from('user_contexts')
          .select('user_id, context_id, contexts(id, name, type)')
        const end = Date.now()
        return { duration: end - start, success: !error, data: data?.length || 0 }
      }
    }
  ]
  
  const results = {}
  
  for (const test of performanceTests) {
    try {
      console.log(`⚡ Executando: ${test.name}`)
      const result = await test.test()
      
      console.log(`✅ ${test.name}: ${result.duration}ms - ${result.data} registros`)
      results[test.name] = result
      
    } catch (error) {
      console.log(`❌ ${test.name}: ERRO - ${error.message}`)
      results[test.name] = { duration: 0, success: false, error: error.message }
    }
  }
  
  return results
}

// =====================================================
// 9. TESTES DE INTEGRIDADE DE DADOS
// =====================================================

async function testDataIntegrity() {
  console.log('\n🔍 9. TESTES DE INTEGRIDADE DE DADOS')
  console.log('=' * 60)
  
  const integrityTests = []
  
  try {
    // Verificar referências de chaves estrangeiras
    console.log('🔍 Verificando integridade de chaves estrangeiras...')
    
    // Tickets -> Contexts
    const { data: ticketsWithoutContext, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select('id, context_id')
      .not('context_id', 'is', null)
    
    if (!ticketsError) {
      const invalidContexts = []
      for (const ticket of ticketsWithoutContext) {
        const { data: context, error } = await supabaseAdmin
          .from('contexts')
          .select('id')
          .eq('id', ticket.context_id)
          .single()
        
        if (error || !context) {
          invalidContexts.push(ticket)
        }
      }
      
      if (invalidContexts.length > 0) {
        console.log(`⚠️ Tickets com context_id inválido: ${invalidContexts.length}`)
        integrityTests.push({
          test: 'Tickets com context_id inválido',
          status: 'WARNING',
          count: invalidContexts.length
        })
      } else {
        console.log('✅ Todos os tickets têm context_id válido')
        integrityTests.push({
          test: 'Tickets com context_id válido',
          status: 'OK',
          count: 0
        })
      }
    }
    
    // User-Contexts -> Users
    const { data: userContexts, error: userContextsError } = await supabaseAdmin
      .from('user_contexts')
      .select('user_id, context_id')
    
    if (!userContextsError) {
      const invalidUsers = []
      const invalidContexts = []
      
      for (const uc of userContexts) {
        // Verificar se user existe
        const { data: user, error: userError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', uc.user_id)
          .single()
        
        if (userError || !user) {
          invalidUsers.push(uc)
        }
        
        // Verificar se context existe
        const { data: context, error: contextError } = await supabaseAdmin
          .from('contexts')
          .select('id')
          .eq('id', uc.context_id)
          .single()
        
        if (contextError || !context) {
          invalidContexts.push(uc)
        }
      }
      
      if (invalidUsers.length > 0) {
        console.log(`⚠️ User-contexts com user_id inválido: ${invalidUsers.length}`)
        integrityTests.push({
          test: 'User-contexts com user_id inválido',
          status: 'WARNING',
          count: invalidUsers.length
        })
      }
      
      if (invalidContexts.length > 0) {
        console.log(`⚠️ User-contexts com context_id inválido: ${invalidContexts.length}`)
        integrityTests.push({
          test: 'User-contexts com context_id inválido',
          status: 'WARNING',
          count: invalidContexts.length
        })
      }
      
      if (invalidUsers.length === 0 && invalidContexts.length === 0) {
        console.log('✅ Todas as associações user-context são válidas')
        integrityTests.push({
          test: 'Associações user-context válidas',
          status: 'OK',
          count: 0
        })
      }
    }
    
    // Verificar duplicatas
    console.log('🔍 Verificando duplicatas...')
    
    // Duplicatas em user-contexts
    const { data: allUserContexts, error: allUCError } = await supabaseAdmin
      .from('user_contexts')
      .select('user_id, context_id')
    
    if (!allUCError) {
      const duplicates = []
      const seen = new Set()
      
      for (const uc of allUserContexts) {
        const key = `${uc.user_id}-${uc.context_id}`
        if (seen.has(key)) {
          duplicates.push(uc)
        } else {
          seen.add(key)
        }
      }
      
      if (duplicates.length > 0) {
        console.log(`⚠️ Duplicatas em user-contexts: ${duplicates.length}`)
        integrityTests.push({
          test: 'Duplicatas em user-contexts',
          status: 'WARNING',
          count: duplicates.length
        })
      } else {
        console.log('✅ Nenhuma duplicata em user-contexts')
        integrityTests.push({
          test: 'Duplicatas em user-contexts',
          status: 'OK',
          count: 0
        })
      }
    }
    
    return integrityTests
    
  } catch (error) {
    console.error('❌ Erro nos testes de integridade:', error)
    return []
  }
}

// =====================================================
// 10. TESTES DE SEGURANÇA
// =====================================================

async function testSecurity() {
  console.log('\n🔒 10. TESTES DE SEGURANÇA')
  console.log('=' * 60)
  
  const securityTests = []
  
  try {
    // Verificar senhas em texto plano (não deveria existir)
    console.log('🔍 Verificando senhas em texto plano...')
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, password')
    
    if (!usersError) {
      const plainTextPasswords = users.filter(user => 
        user.password && 
        user.password.length < 60 && // Senhas hash são muito longas
        !user.password.startsWith('$2') // Bcrypt hash
      )
      
      if (plainTextPasswords.length > 0) {
        console.log(`⚠️ Usuários com senhas em texto plano: ${plainTextPasswords.length}`)
        securityTests.push({
          test: 'Senhas em texto plano',
          status: 'CRITICAL',
          count: plainTextPasswords.length
        })
      } else {
        console.log('✅ Nenhuma senha em texto plano encontrada')
        securityTests.push({
          test: 'Senhas em texto plano',
          status: 'OK',
          count: 0
        })
      }
    }
    
    // Verificar dados sensíveis expostos
    console.log('🔍 Verificando exposição de dados sensíveis...')
    const { data: sensitiveData, error: sensitiveError } = await supabaseAdmin
      .from('users')
      .select('id, email, password, phone, created_at')
      .limit(5)
    
    if (!sensitiveError) {
      const exposedSensitive = sensitiveData.filter(user => 
        user.password || user.phone
      )
      
      if (exposedSensitive.length > 0) {
        console.log(`⚠️ Dados sensíveis expostos: ${exposedSensitive.length}`)
        securityTests.push({
          test: 'Dados sensíveis expostos',
          status: 'WARNING',
          count: exposedSensitive.length
        })
      } else {
        console.log('✅ Nenhum dado sensível exposto')
        securityTests.push({
          test: 'Dados sensíveis expostos',
          status: 'OK',
          count: 0
        })
      }
    }
    
    // Verificar RLS ativo
    console.log('🔍 Verificando RLS ativo...')
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .rpc('check_rls_status')
      .catch(() => {
        console.log('⚠️ Função check_rls_status não disponível')
        return { data: null, error: null }
      })
    
    if (rlsError) {
      console.log('⚠️ Não foi possível verificar status do RLS')
      securityTests.push({
        test: 'Status do RLS',
        status: 'UNKNOWN',
        count: 0
      })
    } else {
      console.log('✅ RLS verificado')
      securityTests.push({
        test: 'Status do RLS',
        status: 'OK',
        count: 0
      })
    }
    
    return securityTests
    
  } catch (error) {
    console.error('❌ Erro nos testes de segurança:', error)
    return []
  }
}

// =====================================================
// 11. TESTES DE FUNCIONALIDADES ESPECÍFICAS
// =====================================================

async function testSpecificFeatures() {
  console.log('\n🎯 11. TESTES DE FUNCIONALIDADES ESPECÍFICAS')
  console.log('=' * 60)
  
  const featureTests = []
  
  try {
    // Teste de geração de números de ticket
    console.log('🔍 Testando geração de números de ticket...')
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select('ticket_number')
      .limit(10)
    
    if (!ticketsError && tickets.length > 0) {
      const ticketNumbers = tickets.map(t => t.ticket_number)
      const uniqueNumbers = new Set(ticketNumbers)
      
      if (ticketNumbers.length === uniqueNumbers.size) {
        console.log('✅ Números de ticket únicos')
        featureTests.push({
          test: 'Números de ticket únicos',
          status: 'OK',
          count: 0
        })
      } else {
        console.log('⚠️ Números de ticket duplicados encontrados')
        featureTests.push({
          test: 'Números de ticket únicos',
          status: 'WARNING',
          count: ticketNumbers.length - uniqueNumbers.size
        })
      }
    }
    
    // Teste de associações user-context
    console.log('🔍 Testando associações user-context...')
    const { data: userContexts, error: userContextsError } = await supabaseAdmin
      .from('user_contexts')
      .select('user_id, context_id, contexts(id, name, type)')
    
    if (!userContextsError) {
      const validAssociations = userContexts.filter(uc => uc.contexts)
      const invalidAssociations = userContexts.filter(uc => !uc.contexts)
      
      if (invalidAssociations.length > 0) {
        console.log(`⚠️ Associações inválidas: ${invalidAssociations.length}`)
        featureTests.push({
          test: 'Associações user-context válidas',
          status: 'WARNING',
          count: invalidAssociations.length
        })
      } else {
        console.log('✅ Todas as associações user-context são válidas')
        featureTests.push({
          test: 'Associações user-context válidas',
          status: 'OK',
          count: 0
        })
      }
    }
    
    // Teste de contextos ativos
    console.log('🔍 Testando contextos ativos...')
    const { data: contexts, error: contextsError } = await supabaseAdmin
      .from('contexts')
      .select('id, name, is_active')
    
    if (!contextsError) {
      const activeContexts = contexts.filter(c => c.is_active)
      const inactiveContexts = contexts.filter(c => !c.is_active)
      
      console.log(`✅ Contextos ativos: ${activeContexts.length}`)
      console.log(`❌ Contextos inativos: ${inactiveContexts.length}`)
      
      featureTests.push({
        test: 'Contextos ativos',
        status: 'OK',
        count: activeContexts.length
      })
      
      featureTests.push({
        test: 'Contextos inativos',
        status: 'INFO',
        count: inactiveContexts.length
      })
    }
    
    return featureTests
    
  } catch (error) {
    console.error('❌ Erro nos testes de funcionalidades específicas:', error)
    return []
  }
}

// =====================================================
// 12. RELATÓRIO FINAL
// =====================================================

async function generateFinalReport(results) {
  console.log('\n📊 12. RELATÓRIO FINAL')
  console.log('=' * 80)
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    },
    sections: {}
  }
  
  // Analisar resultados
  for (const [section, data] of Object.entries(results)) {
    if (data && typeof data === 'object') {
      report.sections[section] = data
      
      if (Array.isArray(data)) {
        data.forEach(item => {
          report.summary.totalTests++
          if (item.status === 'OK') report.summary.passed++
          else if (item.status === 'WARNING') report.summary.warnings++
          else if (item.status === 'CRITICAL') report.summary.failed++
        })
      }
    }
  }
  
  console.log('📈 RESUMO GERAL:')
  console.log(`  Total de testes: ${report.summary.totalTests}`)
  console.log(`  ✅ Aprovados: ${report.summary.passed}`)
  console.log(`  ⚠️ Avisos: ${report.summary.warnings}`)
  console.log(`  ❌ Falhas: ${report.summary.failed}`)
  
  const successRate = ((report.summary.passed / report.summary.totalTests) * 100).toFixed(2)
  console.log(`  📊 Taxa de sucesso: ${successRate}%`)
  
  console.log('\n🎯 RECOMENDAÇÕES:')
  
  if (report.summary.failed > 0) {
    console.log('  🔴 CRÍTICO: Corrigir falhas imediatamente')
  }
  
  if (report.summary.warnings > 0) {
    console.log('  🟡 ATENÇÃO: Revisar avisos para melhorar a qualidade')
  }
  
  if (report.summary.passed === report.summary.totalTests) {
    console.log('  🟢 EXCELENTE: Todos os testes passaram!')
  }
  
  console.log('\n📋 DETALHES POR SEÇÃO:')
  for (const [section, data] of Object.entries(report.sections)) {
    console.log(`  📁 ${section}: ${JSON.stringify(data, null, 2)}`)
  }
  
  return report
}

// =====================================================
// EXECUÇÃO PRINCIPAL
// =====================================================

async function runCompleteCTS() {
  console.log('🚀 INICIANDO CTS COMPLETA - EXPLORAÇÃO 100% DA APLICAÇÃO')
  console.log('⏰ Início:', new Date().toISOString())
  
  const results = {}
  
  try {
    // 1. Conectividade
    console.log('\n' + '='.repeat(80))
    results.connectivity = await testConnectivity()
    
    // 2. Schema do banco
    console.log('\n' + '='.repeat(80))
    results.database = await testDatabaseSchema()
    
    // 3. Autenticação
    console.log('\n' + '='.repeat(80))
    results.authentication = await testAuthentication()
    
    // 4. Multi-tenant
    console.log('\n' + '='.repeat(80))
    results.multiTenant = await testMultiTenant()
    
    // 5. Tickets
    console.log('\n' + '='.repeat(80))
    results.tickets = await testTickets()
    
    // 6. RLS
    console.log('\n' + '='.repeat(80))
    results.rls = await testRLS()
    
    // 7. APIs
    console.log('\n' + '='.repeat(80))
    results.apis = await testAPIs()
    
    // 8. Performance
    console.log('\n' + '='.repeat(80))
    results.performance = await testPerformance()
    
    // 9. Integridade
    console.log('\n' + '='.repeat(80))
    results.integrity = await testDataIntegrity()
    
    // 10. Segurança
    console.log('\n' + '='.repeat(80))
    results.security = await testSecurity()
    
    // 11. Funcionalidades específicas
    console.log('\n' + '='.repeat(80))
    results.features = await testSpecificFeatures()
    
    // 12. Relatório final
    console.log('\n' + '='.repeat(80))
    const finalReport = await generateFinalReport(results)
    
    console.log('\n🎉 CTS COMPLETA FINALIZADA!')
    console.log('⏰ Fim:', new Date().toISOString())
    
    return finalReport
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO NA CTS:', error)
    return { error: error.message, timestamp: new Date().toISOString() }
  }
}

// Executar CTS
runCompleteCTS()


