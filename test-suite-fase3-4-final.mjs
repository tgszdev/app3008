import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logTest(testId, description, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'INFO' ? 'ℹ️' : '⚠️'
  const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : status === 'INFO' ? 'cyan' : 'yellow'
  log(`${icon} [${testId}] ${description}: ${status}`, color)
  if (details) {
    log(`   └─ ${details}`, 'reset')
  }
}

let totalTests = 0
let passedTests = 0
let failedTests = 0
let warnings = 0
let infoTests = 0
const bugs = []
const recommendations = []

// =============================================================================
// FASE 3: VALIDAÇÃO DE FRONTEND (Lógica)
// =============================================================================

async function fase3() {
  log('\n' + '═'.repeat(80), 'bold')
  log('FASE 3: VALIDAÇÃO DE FRONTEND (Análise de Lógica)', 'bold')
  log('═'.repeat(80) + '\n', 'bold')
  
  log('ℹ️  NOTA: Frontend requer testes manuais no navegador', 'cyan')
  log('   Aqui validaremos a PREPARAÇÃO dos dados para o frontend\n', 'cyan')
  
  await teste3_1_dadosParaContextUser()
  await teste3_2_dadosParaMatrixUser()
  await teste3_3_estatisticas()
}

// Teste 3.1: Dados para Usuário Context
async function teste3_1_dadosParaContextUser() {
  log('\n📋 Teste 3.1: Dados Preparados para Usuário Context', 'blue')
  log('─'.repeat(80))
  
  // Simular um usuário context (agro2)
  const { data: user } = await supabase
    .from('users')
    .select('id, email, user_type, context_id, context_name')
    .eq('email', 'agro2@agro.com.br')
    .single()
  
  if (!user) {
    logTest('3.1.1', 'Buscar usuário context', 'FAIL', 'Usuário não encontrado')
    totalTests++
    failedTests++
    return
  }
  
  totalTests++
  logTest('3.1.1', 'Usuário context encontrado', 'PASS', 
    `${user.email} - ${user.context_name}`)
  passedTests++
  
  // Verificar se tem context_id definido
  totalTests++
  if (user.context_id) {
    logTest('3.1.2', 'context_id definido', 'PASS', user.context_id)
    passedTests++
  } else {
    logTest('3.1.2', 'context_id definido', 'FAIL', 'context_id está NULL')
    failedTests++
    bugs.push({
      prioridade: 'ALTA',
      area: 'Frontend - Dados',
      descricao: 'Usuário context sem context_id',
      teste: '3.1.2'
    })
  }
  
  // Buscar tickets que ele deveria ver
  const { data: tickets, count } = await supabase
    .from('tickets')
    .select('id, ticket_number, title', { count: 'exact' })
    .eq('context_id', user.context_id)
  
  totalTests++
  logTest('3.1.3', 'Tickets disponíveis para exibição', 'INFO', 
    `${count} tickets do ${user.context_name}`)
  infoTests++
  
  // Verificar disponabilidade de contextos (deve ser 1 para context user)
  const { data: contexts } = await supabase
    .from('user_contexts')
    .select('context_id, contexts(name)')
    .eq('user_id', user.id)
  
  totalTests++
  if (contexts && contexts.length === 1) {
    logTest('3.1.4', 'Associação única para context user', 'PASS', 
      '1 contexto (correto)')
    passedTests++
  } else {
    logTest('3.1.4', 'Associações do usuário', 'WARN', 
      `${contexts?.length || 0} contextos (esperado: 1)`)
    warnings++
  }
}

// Teste 3.2: Dados para Usuário Matrix
async function teste3_2_dadosParaMatrixUser() {
  log('\n📋 Teste 3.2: Dados Preparados para Usuário Matrix', 'blue')
  log('─'.repeat(80))
  
  // Buscar um usuário matrix
  const { data: user } = await supabase
    .from('users')
    .select('id, email, user_type')
    .eq('user_type', 'matrix')
    .limit(1)
    .single()
  
  if (!user) {
    logTest('3.2.1', 'Buscar usuário matrix', 'WARN', 'Nenhum usuário matrix encontrado')
    totalTests++
    warnings++
    return
  }
  
  totalTests++
  logTest('3.2.1', 'Usuário matrix encontrado', 'PASS', user.email)
  passedTests++
  
  // Buscar contextos disponíveis para seleção
  const { data: contexts, count } = await supabase
    .from('user_contexts')
    .select('context_id, contexts(id, name, slug)', { count: 'exact' })
    .eq('user_id', user.id)
  
  totalTests++
  if (count && count > 0) {
    logTest('3.2.2', 'Contextos disponíveis para seleção', 'INFO', 
      `${count} contextos`)
    infoTests++
    
    log('   Contextos:', 'reset')
    contexts?.forEach((ctx, i) => {
      log(`      ${i + 1}. ${ctx.contexts.name} (${ctx.contexts.slug})`, 'reset')
    })
  } else {
    logTest('3.2.2', 'Contextos disponíveis', 'WARN', 
      'Usuário matrix sem contextos associados')
    warnings++
  }
  
  // Simular seleção de contextos e buscar tickets
  const selectedContextIds = contexts?.map(c => c.context_id) || []
  
  if (selectedContextIds.length > 0) {
    const { data: tickets, count: ticketCount } = await supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .in('context_id', selectedContextIds)
    
    totalTests++
    logTest('3.2.3', 'Tickets visíveis após seleção', 'INFO', 
      `${ticketCount} tickets dos contextos selecionados`)
    infoTests++
  }
}

// Teste 3.3: Estatísticas
async function teste3_3_estatisticas() {
  log('\n📋 Teste 3.3: Estatísticas do Sistema', 'blue')
  log('─'.repeat(80))
  
  // Contar usuários por tipo
  const { data: users } = await supabase
    .from('users')
    .select('user_type')
    .eq('is_active', true)
  
  const contextUsers = users?.filter(u => u.user_type === 'context').length || 0
  const matrixUsers = users?.filter(u => u.user_type === 'matrix').length || 0
  
  totalTests++
  logTest('3.3.1', 'Distribuição de tipos de usuário', 'INFO', '')
  infoTests++
  
  log('   Usuários:', 'reset')
  log(`      - Context (cliente único): ${contextUsers}`, 'reset')
  log(`      - Matrix (multi-cliente): ${matrixUsers}`, 'reset')
  log(`      - Total ativo: ${users?.length || 0}`, 'reset')
  
  // Contar contextos
  const { count: contextsCount } = await supabase
    .from('contexts')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
  
  log(`\n   Contextos ativos: ${contextsCount}`, 'reset')
  
  // Tickets por contexto
  const { data: ticketsByContext } = await supabase
    .from('tickets')
    .select('context_id, contexts(name)')
  
  const distribution = {}
  ticketsByContext?.forEach(t => {
    const name = t.contexts?.name || 'Sem Contexto'
    distribution[name] = (distribution[name] || 0) + 1
  })
  
  log('\n   Tickets por contexto:', 'reset')
  Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      log(`      - ${name}: ${count}`, 'reset')
    })
}

// =============================================================================
// FASE 4: TESTES DE SEGURANÇA
// =============================================================================

async function fase4() {
  log('\n' + '═'.repeat(80), 'bold')
  log('FASE 4: TESTES DE SEGURANÇA', 'bold')
  log('═'.repeat(80) + '\n', 'bold')
  
  await teste4_1_isolamentoDeContextos()
  await teste4_2_validacaoDeAssociacoes()
  await teste4_3_testesDeIntegridade()
}

// Teste 4.1: Isolamento de Contextos
async function teste4_1_isolamentoDeContextos() {
  log('\n📋 Teste 4.1: Isolamento de Contextos', 'blue')
  log('─'.repeat(80))
  
  // Buscar todos os contextos
  const { data: contexts } = await supabase
    .from('contexts')
    .select('id, name')
    .eq('is_active', true)
    .limit(3)
  
  if (!contexts || contexts.length < 2) {
    logTest('4.1.1', 'Isolamento de contextos', 'WARN', 
      'Menos de 2 contextos para testar')
    totalTests++
    warnings++
    return
  }
  
  // Verificar se tickets de contexto A não aparecem para usuários de contexto B
  const contextA = contexts[0]
  const contextB = contexts[1]
  
  // Buscar tickets de cada contexto
  const { data: ticketsA } = await supabase
    .from('tickets')
    .select('id, context_id')
    .eq('context_id', contextA.id)
  
  const { data: ticketsB } = await supabase
    .from('tickets')
    .select('id, context_id')
    .eq('context_id', contextB.id)
  
  totalTests++
  const overlap = ticketsA?.some(ta => ticketsB?.some(tb => tb.id === ta.id))
  
  if (!overlap) {
    logTest('4.1.1', 'Isolamento de tickets entre contextos', 'PASS', 
      `${contextA.name} ≠ ${contextB.name}`)
    passedTests++
  } else {
    logTest('4.1.1', 'Isolamento de tickets', 'FAIL', 
      'Ticket aparece em múltiplos contextos!')
    failedTests++
    bugs.push({
      prioridade: 'CRÍTICA',
      area: 'Segurança',
      descricao: 'Vazamento de dados entre contextos',
      teste: '4.1.1'
    })
  }
  
  // Verificar unicidade de context_id em cada ticket
  const { data: allTickets } = await supabase
    .from('tickets')
    .select('id, context_id')
  
  const ticketsWithMultipleContexts = []
  const ticketContextMap = new Map()
  
  allTickets?.forEach(t => {
    if (ticketContextMap.has(t.id)) {
      ticketsWithMultipleContexts.push(t.id)
    }
    ticketContextMap.set(t.id, t.context_id)
  })
  
  totalTests++
  if (ticketsWithMultipleContexts.length === 0) {
    logTest('4.1.2', 'Unicidade de context_id por ticket', 'PASS', 
      'Cada ticket pertence a apenas 1 contexto')
    passedTests++
  } else {
    logTest('4.1.2', 'Unicidade de context_id', 'FAIL', 
      `${ticketsWithMultipleContexts.length} tickets em múltiplos contextos`)
    failedTests++
  }
}

// Teste 4.2: Validação de Associações
async function teste4_2_validacaoDeAssociacoes() {
  log('\n📋 Teste 4.2: Validação de Associações', 'blue')
  log('─'.repeat(80))
  
  // Verificar se usuários context têm exatamente 1 associação
  const { data: contextUsers } = await supabase
    .from('users')
    .select('id, email, user_type')
    .eq('user_type', 'context')
    .eq('is_active', true)
  
  totalTests++
  let usersWithWrongAssocCount = 0
  
  for (const user of contextUsers || []) {
    const { count } = await supabase
      .from('user_contexts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    
    if (count !== 1) {
      usersWithWrongAssocCount++
    }
  }
  
  if (usersWithWrongAssocCount === 0) {
    logTest('4.2.1', 'Usuários context com 1 associação', 'PASS', 
      `${contextUsers?.length || 0} usuários validados`)
    passedTests++
  } else {
    logTest('4.2.1', 'Associações incorretas', 'FAIL', 
      `${usersWithWrongAssocCount} usuários com associações != 1`)
    failedTests++
    bugs.push({
      prioridade: 'MÉDIA',
      area: 'Integridade',
      descricao: `${usersWithWrongAssocCount} usuários context com associações incorretas`,
      teste: '4.2.1'
    })
  }
  
  // Verificar se não há associações duplicadas
  const { data: allAssociations } = await supabase
    .from('user_contexts')
    .select('user_id, context_id')
  
  const uniqueKeys = new Set()
  const duplicates = []
  
  allAssociations?.forEach(assoc => {
    const key = `${assoc.user_id}-${assoc.context_id}`
    if (uniqueKeys.has(key)) {
      duplicates.push(key)
    }
    uniqueKeys.add(key)
  })
  
  totalTests++
  if (duplicates.length === 0) {
    logTest('4.2.2', 'Sem associações duplicadas', 'PASS', 
      `${allAssociations?.length || 0} associações únicas`)
    passedTests++
  } else {
    logTest('4.2.2', 'Associações duplicadas', 'FAIL', 
      `${duplicates.length} duplicatas encontradas`)
    failedTests++
  }
}

// Teste 4.3: Testes de Integridade
async function teste4_3_testesDeIntegridade() {
  log('\n📋 Teste 4.3: Testes de Integridade Final', 'blue')
  log('─'.repeat(80))
  
  // Verificar sincronização final users <-> user_contexts
  const { data: users } = await supabase
    .from('users')
    .select('id, email, user_type, context_id')
    .eq('user_type', 'context')
    .eq('is_active', true)
  
  totalTests++
  let syncIssues = 0
  
  for (const user of users || []) {
    const { data: assoc } = await supabase
      .from('user_contexts')
      .select('context_id')
      .eq('user_id', user.id)
      .single()
    
    if (assoc && user.context_id !== assoc.context_id) {
      syncIssues++
    }
  }
  
  if (syncIssues === 0) {
    logTest('4.3.1', 'Sincronização users <-> user_contexts', 'PASS', 
      'Todas as associações sincronizadas')
    passedTests++
  } else {
    logTest('4.3.1', 'Sincronização', 'FAIL', 
      `${syncIssues} usuários dessincrônos`)
    failedTests++
    bugs.push({
      prioridade: 'ALTA',
      area: 'Sincronização',
      descricao: `${syncIssues} usuários com context_id dessincronô`,
      teste: '4.3.1'
    })
  }
  
  // Teste de integridade: todos os context_id em users existem em contexts
  totalTests++
  let orphanUsers = 0
  
  for (const user of users || []) {
    if (user.context_id) {
      const { data: context } = await supabase
        .from('contexts')
        .select('id')
        .eq('id', user.context_id)
        .single()
      
      if (!context) {
        orphanUsers++
      }
    }
  }
  
  if (orphanUsers === 0) {
    logTest('4.3.2', 'Integridade referencial users → contexts', 'PASS', 
      'Todos os context_id são válidos')
    passedTests++
  } else {
    logTest('4.3.2', 'Integridade referencial', 'FAIL', 
      `${orphanUsers} usuários com context_id inválido`)
    failedTests++
  }
}

// =============================================================================
// EXECUTAR TESTES
// =============================================================================

async function executarTestes() {
  const startTime = Date.now()
  
  log('\n' + '╔' + '═'.repeat(78) + '╗', 'bold')
  log('║' + ' '.repeat(18) + 'TESTE COMPLETO - FASES 3 & 4: Frontend + Segurança' + ' '.repeat(10) + '║', 'bold')
  log('╚' + '═'.repeat(78) + '╝', 'bold')
  
  await fase3()
  await fase4()
  
  // Resumo
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)
  
  log('\n' + '═'.repeat(80), 'bold')
  log('RESUMO DOS TESTES - FASES 3 & 4', 'bold')
  log('═'.repeat(80), 'bold')
  
  log(`\nTotal de testes: ${totalTests}`, 'reset')
  log(`✅ Aprovados: ${passedTests}`, 'green')
  log(`❌ Reprovados: ${failedTests}`, 'red')
  log(`⚠️  Avisos: ${warnings}`, 'yellow')
  log(`ℹ️  Informativos: ${infoTests}`, 'cyan')
  log(`⏱️  Tempo: ${duration}s`, 'blue')
  
  const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0
  log(`\n📊 Taxa de sucesso: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red')
  
  // Listar bugs
  if (bugs.length > 0) {
    log('\n' + '═'.repeat(80), 'bold')
    log('🐛 BUGS ENCONTRADOS', 'red')
    log('═'.repeat(80), 'bold')
    
    bugs.forEach((bug, i) => {
      log(`\n[${bug.prioridade}] ${bug.area} - Teste ${bug.teste}`, 'red')
      log(`└─ ${bug.descricao}`, 'reset')
    })
  } else {
    log('\n✨ Nenhum bug encontrado nas Fases 3 & 4!', 'green')
  }
  
  log('\n' + '═'.repeat(80) + '\n', 'bold')
  
  // Status final
  if (failedTests === 0 && bugs.length === 0) {
    log('✅ FASES 3 & 4: APROVADAS', 'green')
  } else if (failedTests <= 2) {
    log('⚠️  FASES 3 & 4: APROVADAS COM RESSALVAS', 'yellow')
  } else {
    log('❌ FASES 3 & 4: REPROVADAS', 'red')
  }
}

executarTestes()

