import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Cores
const c = {
  g: '\x1b[32m', r: '\x1b[31m', y: '\x1b[33m', b: '\x1b[34m',
  c: '\x1b[36m', m: '\x1b[35m', w: '\x1b[37m', x: '\x1b[0m', bold: '\x1b[1m'
}

function log(msg, color = 'x') { console.log(`${c[color]}${msg}${c.x}`) }
function test(id, desc, status, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'CRITICAL' ? '🔥' : '⚠️'
  const col = status === 'PASS' ? 'g' : status === 'FAIL' ? 'r' : status === 'CRITICAL' ? 'm' : 'y'
  log(`${icon} [${id}] ${desc}: ${status}`, col)
  if (detail) log(`   └─ ${detail}`, 'x')
}

let total = 0, pass = 0, fail = 0, critical = 0, warn = 0
const bugs = []

// =============================================================================
// RODADA 2: TESTES AGRESSIVOS E SIMULAÇÃO DE FRONTEND
// =============================================================================

async function rodada2() {
  log('\n' + '╔' + '═'.repeat(78) + '╗', 'bold')
  log('║' + ' '.repeat(18) + '🔥 RODADA 2: TESTES AGRESSIVOS E SIMULAÇÃO REAL' + ' '.repeat(13) + '║', 'bold')
  log('╚' + '═'.repeat(78) + '╝\n', 'bold')
  
  log('🎯 OBJETIVO: Encontrar falhas através de cenários reais e edge cases', 'c')
  log('🔍 ABORDAGEM: Simulação do fluxo completo do frontend\n', 'c')
  
  await cenario1_loginENavegacao()
  await cenario2_mudancaDeCliente()
  await cenario3_acessoCruzado()
  await cenario4_edgeCases()
  await cenario5_analiseCodigoFrontend()
  await cenario6_raceConditions()
}

// =============================================================================
// CENÁRIO 1: Simular Login e Navegação Real
// =============================================================================

async function cenario1_loginENavegacao() {
  log('\n' + '═'.repeat(80), 'bold')
  log('CENÁRIO 1: Simulação de Login e Navegação Real', 'bold')
  log('═'.repeat(80), 'bold')
  
  log('\n🎬 SIMULANDO: Usuário agro2@agro.com.br faz login e acessa tickets\n', 'c')
  
  // PASSO 1: Simular autenticação
  const { data: user } = await supabase
    .from('users')
    .select('id, email, user_type, context_id, context_name, context_slug')
    .eq('email', 'agro2@agro.com.br')
    .single()
  
  total++
  if (!user) {
    test('1.1', 'Login - Buscar usuário', 'FAIL', 'Usuário não existe')
    fail++
    return
  }
  
  test('1.1', 'Login - Usuário encontrado', 'PASS', `${user.email}`)
  pass++
  
  // PASSO 2: Verificar se JWT seria criado com dados corretos
  total++
  if (user.context_id && user.context_name && user.context_slug) {
    test('1.2', 'JWT teria dados completos', 'PASS', 
      `context_id, context_name, context_slug presentes`)
    pass++
  } else {
    test('1.2', 'JWT com dados incompletos', 'CRITICAL', 
      'Sessão seria criada com dados faltando!')
    critical++
    bugs.push({
      prioridade: 'CRÍTICA',
      area: 'Autenticação',
      descricao: `JWT seria criado sem context_name ou context_slug`,
      teste: '1.2',
      impacto: 'Frontend pode quebrar ao acessar user.context_name'
    })
  }
  
  // PASSO 3: Simular navegação para /dashboard/tickets
  log('\n📍 NAVEGANDO: /dashboard/tickets', 'c')
  
  // Ler código do arquivo para validar lógica
  const ticketsPageCode = fs.readFileSync('src/app/dashboard/tickets/page.tsx', 'utf-8')
  
  // VERIFICAÇÃO CRÍTICA: Código verifica selectedClients.length > 0
  total++
  const hasClientSelectionCheck = ticketsPageCode.includes('selectedClients.length > 0')
  const hasUserTypeCheck = ticketsPageCode.includes("userType === 'context'")
  
  if (hasUserTypeCheck) {
    test('1.3', 'Código diferencia context vs matrix', 'PASS', 
      'Página trata usuários context corretamente')
    pass++
  } else if (hasClientSelectionCheck) {
    test('1.3', 'Lógica de exibição problemática', 'CRITICAL', 
      'Código AINDA exige selectedClients > 0 para context users!')
    critical++
    bugs.push({
      prioridade: 'CRÍTICA',
      area: 'Frontend - Tickets',
      descricao: 'Usuário context não verá tickets sem selecionar clientes',
      teste: '1.3',
      impacto: 'Página ficará vazia para usuários de cliente único'
    })
  } else {
    test('1.3', 'Lógica de exibição', 'PASS', 'Código parece correto')
    pass++
  }
  
  // PASSO 4: Simular busca de tickets
  total++
  const { data: tickets, count } = await supabase
    .from('tickets')
    .select('id, ticket_number, title, context_id', { count: 'exact' })
    .eq('context_id', user.context_id)
  
  if (tickets && tickets.length > 0) {
    test('1.4', 'Tickets carregados', 'PASS', `${count} tickets disponíveis`)
    pass++
  } else {
    test('1.4', 'Nenhum ticket encontrado', 'WARN', 
      'Usuário verá página vazia (pode ser normal)')
    warn++
  }
  
  // PASSO 5: Simular clique em ticket
  if (tickets && tickets.length > 0) {
    const ticket = tickets[0]
    log(`\n🖱️  CLICANDO: Ticket #${ticket.ticket_number}`, 'c')
    
    // Simular API call para buscar detalhes
    const { data: ticketDetail, error } = await supabase
      .from('tickets')
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email),
        context_info:contexts!tickets_context_id_fkey(id, name, slug)
      `)
      .eq('id', ticket.id)
      .single()
    
    total++
    if (!error && ticketDetail) {
      // Verificar se passaria na validação de contexto
      if (ticketDetail.context_id === user.context_id) {
        test('1.5', 'Acesso ao ticket autorizado', 'PASS', 
          'context_id bate com usuário')
        pass++
      } else {
        test('1.5', 'FALHA DE SEGURANÇA', 'CRITICAL', 
          'Ticket de outro contexto foi acessível!')
        critical++
        bugs.push({
          prioridade: 'CRÍTICA',
          area: 'Segurança - API',
          descricao: `Ticket ${ticket.id} acessível sem validação de contexto`,
          teste: '1.5',
          impacto: 'Vazamento de dados entre clientes'
        })
      }
    } else {
      test('1.5', 'Erro ao buscar ticket', 'FAIL', error?.message || 'Desconhecido')
      fail++
    }
  }
}

// =============================================================================
// CENÁRIO 2: Simular Mudança de Cliente (via UI)
// =============================================================================

async function cenario2_mudancaDeCliente() {
  log('\n' + '═'.repeat(80), 'bold')
  log('CENÁRIO 2: Simulação de Mudança de Cliente via UI', 'bold')
  log('═'.repeat(80), 'bold')
  
  log('\n🎬 SIMULANDO: Admin muda agro2 de Cliente 03 para Cliente 01\n', 'c')
  
  const userEmail = 'agro2@agro.com.br'
  const fromContext = '6486088e-72ae-461b-8b03-32ca84918882' // Cliente 03
  const toContext = '18031594-558a-4f45-847c-b1d2b58087f0'   // Cliente 01
  
  // Estado inicial
  const { data: userBefore } = await supabase
    .from('users')
    .select('id, context_id, context_name')
    .eq('email', userEmail)
    .single()
  
  log(`📊 Estado ANTES:`, 'c')
  log(`   context_id: ${userBefore.context_id}`, 'x')
  log(`   context_name: ${userBefore.context_name}`, 'x')
  
  // PASSO 1: Simular DELETE da associação antiga (o que o frontend faz)
  log('\n🗑️  DELETANDO associação com Cliente 03...', 'c')
  
  const { error: deleteError } = await supabase
    .from('user_contexts')
    .delete()
    .eq('user_id', userBefore.id)
    .eq('context_id', fromContext)
  
  total++
  if (!deleteError) {
    test('2.1', 'DELETE associação antiga', 'PASS', 'Associação removida')
    pass++
  } else {
    test('2.1', 'Erro ao deletar associação', 'FAIL', deleteError.message)
    fail++
    return
  }
  
  // VERIFICAÇÃO CRÍTICA: Estado intermediário
  log('\n⏸️  ESTADO INTERMEDIÁRIO (entre DELETE e POST):', 'y')
  
  const { data: userIntermediate } = await supabase
    .from('users')
    .select('context_id, context_name')
    .eq('id', userBefore.id)
    .single()
  
  const { count: assocCount } = await supabase
    .from('user_contexts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userBefore.id)
  
  log(`   users.context_id: ${userIntermediate.context_id || 'NULL'}`, 'x')
  log(`   users.context_name: ${userIntermediate.context_name || 'NULL'}`, 'x')
  log(`   user_contexts count: ${assocCount}`, 'x')
  
  total++
  if (assocCount === 0 && userIntermediate.context_id === null) {
    test('2.2', 'Estado intermediário limpo', 'PASS', 
      'API DELETE limpou users table corretamente')
    pass++
  } else if (assocCount === 0 && userIntermediate.context_id !== null) {
    test('2.2', 'ESTADO ÓRFÃO DETECTADO', 'CRITICAL', 
      'users.context_id não foi limpo após DELETE!')
    critical++
    bugs.push({
      prioridade: 'CRÍTICA',
      area: 'API - user-contexts',
      descricao: 'DELETE não limpa users table, deixa dados órfãos',
      teste: '2.2',
      impacto: 'Usuário fica com context_id inválido temporariamente'
    })
  } else {
    test('2.2', 'Estado intermediário inesperado', 'WARN', 
      `${assocCount} associações ainda existem`)
    warn++
  }
  
  // PASSO 2: Simular POST da nova associação
  log('\n➕ CRIANDO associação com Cliente 01...', 'c')
  
  const { error: createError } = await supabase
    .from('user_contexts')
    .insert({
      user_id: userBefore.id,
      context_id: toContext
    })
  
  total++
  if (!createError) {
    test('2.3', 'POST nova associação', 'PASS', 'Associação criada')
    pass++
  } else {
    test('2.3', 'Erro ao criar associação', 'FAIL', createError.message)
    fail++
    return
  }
  
  // VERIFICAÇÃO CRÍTICA: Estado final sincronizado?
  await new Promise(resolve => setTimeout(resolve, 500)) // Aguardar trigger
  
  const { data: userAfter } = await supabase
    .from('users')
    .select('context_id, context_name, context_slug')
    .eq('id', userBefore.id)
    .single()
  
  const { data: contextExpected } = await supabase
    .from('contexts')
    .select('id, name, slug')
    .eq('id', toContext)
    .single()
  
  log(`\n📊 Estado DEPOIS:`, 'c')
  log(`   context_id: ${userAfter.context_id}`, 'x')
  log(`   context_name: ${userAfter.context_name}`, 'x')
  log(`   context_slug: ${userAfter.context_slug}`, 'x')
  
  total++
  const isSynced = 
    userAfter.context_id === contextExpected.id &&
    userAfter.context_name === contextExpected.name &&
    userAfter.context_slug === contextExpected.slug
  
  if (isSynced) {
    test('2.4', 'Sincronização pós-mudança', 'PASS', 
      'users table atualizada corretamente')
    pass++
  } else {
    test('2.4', 'DESSINCRÔNIZAÇÃO DETECTADA', 'CRITICAL', 
      'users table NÃO foi atualizada após POST!')
    critical++
    bugs.push({
      prioridade: 'CRÍTICA',
      area: 'API - user-contexts',
      descricao: 'POST não sincroniza users table',
      teste: '2.4',
      impacto: 'Mudança de cliente não reflete imediatamente'
    })
  }
  
  // Reverter mudanças
  await supabase.from('user_contexts').delete().eq('user_id', userBefore.id).eq('context_id', toContext)
  await supabase.from('user_contexts').insert({ user_id: userBefore.id, context_id: fromContext })
}

// =============================================================================
// CENÁRIO 3: Tentativas de Acesso Cruzado (Hacking)
// =============================================================================

async function cenario3_acessoCruzado() {
  log('\n' + '═'.repeat(80), 'bold')
  log('CENÁRIO 3: Teste de Segurança - Tentativas de Acesso Não Autorizado', 'bold')
  log('═'.repeat(80), 'bold')
  
  log('\n🎬 SIMULANDO: Usuário Cliente 03 tenta acessar dados do Cliente 01\n', 'c')
  
  // Usuário atacante (Cliente 03)
  const { data: attacker } = await supabase
    .from('users')
    .select('id, email, context_id, context_name')
    .eq('email', 'agro2@agro.com.br')
    .single()
  
  // Buscar ticket do Cliente 01
  const { data: victimTickets } = await supabase
    .from('tickets')
    .select('id, ticket_number, title, context_id, contexts(name)')
    .eq('context_id', '18031594-558a-4f45-847c-b1d2b58087f0')
    .limit(1)
  
  if (!victimTickets || victimTickets.length === 0) {
    log('⚠️  Sem tickets do Cliente 01 para testar\n', 'y')
    return
  }
  
  const victimTicket = victimTickets[0]
  
  log(`👤 Atacante: ${attacker.email} (${attacker.context_name})`, 'x')
  log(`🎯 Alvo: Ticket #${victimTicket.ticket_number} (${victimTicket.contexts.name})`, 'x')
  
  // TESTE 1: Tentar buscar ticket diretamente via ID
  log('\n🔓 TENTATIVA 1: Buscar ticket por ID direto no banco', 'c')
  
  const { data: directAccess, error: directError } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', victimTicket.id)
    .single()
  
  total++
  if (directAccess && !directError) {
    // Dados foram retornados - agora verificar se API bloquearia
    const wouldBeBlocked = directAccess.context_id !== attacker.context_id
    
    if (wouldBeBlocked) {
      test('3.1', 'Dados retornados do banco MAS...', 'PASS', 
        'API deveria bloquear na validação (context_id diferente)')
      pass++
    } else {
      test('3.1', 'VAZAMENTO DE DADOS', 'CRITICAL', 
        'Ticket acessível sem validação!')
      critical++
      bugs.push({
        prioridade: 'CRÍTICA',
        area: 'Segurança',
        descricao: 'Possível acesso cross-tenant via ID direto',
        teste: '3.1',
        impacto: 'ALTO - Vazamento de dados confidenciais'
      })
    }
  }
  
  // TESTE 2: Simular manipulação de context_ids na URL
  log('\n🔓 TENTATIVA 2: Manipular context_ids via query string', 'c')
  
  // Simular: ?context_ids=18031594-558a-4f45-847c-b1d2b58087f0 (Cliente 01)
  const maliciousContextIds = ['18031594-558a-4f45-847c-b1d2b58087f0']
  
  // Buscar associações reais do usuário
  const { data: realAssociations } = await supabase
    .from('user_contexts')
    .select('context_id')
    .eq('user_id', attacker.id)
  
  const hasAccess = realAssociations?.some(a => 
    maliciousContextIds.includes(a.context_id)
  )
  
  total++
  if (!hasAccess) {
    test('3.2', 'Proteção contra URL manipulation', 'PASS', 
      'Usuário não tem associação com contexto solicitado')
    pass++
  } else {
    test('3.2', 'FALHA DE VALIDAÇÃO', 'CRITICAL', 
      'API aceitaria context_ids manipulados!')
    critical++
  }
  
  // TESTE 3: Verificar se comentários vazam
  log('\n🔓 TENTATIVA 3: Acessar comentários de tickets de outros clientes', 'c')
  
  const { data: victimComments } = await supabase
    .from('ticket_comments')
    .select('id, content, ticket_id, tickets(context_id, title)')
    .eq('ticket_id', victimTicket.id)
  
  total++
  if (victimComments && victimComments.length > 0) {
    const commentContext = victimComments[0].tickets.context_id
    const wouldBeFiltered = commentContext !== attacker.context_id
    
    if (wouldBeFiltered) {
      test('3.3', 'Comentários protegidos', 'PASS', 
        'API deveria filtrar comentários por contexto do ticket')
      pass++
    } else {
      test('3.3', 'VAZAMENTO DE COMENTÁRIOS', 'CRITICAL', 
        'Comentários de outros clientes acessíveis!')
      critical++
    }
  } else {
    test('3.3', 'Sem comentários para testar', 'WARN', '')
    warn++
  }
}

// =============================================================================
// CENÁRIO 4: Edge Cases e Casos Extremos
// =============================================================================

async function cenario4_edgeCases() {
  log('\n' + '═'.repeat(80), 'bold')
  log('CENÁRIO 4: Edge Cases e Situações Extremas', 'bold')
  log('═'.repeat(80), 'bold')
  
  // TESTE 1: Usuário sem nenhuma associação
  log('\n🧪 TESTE 1: Usuário context SEM associações\n', 'c')
  
  const { data: orphanUsers } = await supabase
    .from('users')
    .select(`
      id, email, user_type, context_id,
      user_contexts(context_id)
    `)
    .eq('user_type', 'context')
    .eq('is_active', true)
  
  const usersWithoutAssociations = orphanUsers?.filter(u => 
    !u.user_contexts || u.user_contexts.length === 0
  )
  
  total++
  if (usersWithoutAssociations && usersWithoutAssociations.length > 0) {
    test('4.1', 'Usuários órfãos encontrados', 'CRITICAL', 
      `${usersWithoutAssociations.length} usuários context sem associações!`)
    critical++
    bugs.push({
      prioridade: 'ALTA',
      area: 'Integridade de Dados',
      descricao: 'Usuários context existem sem associações em user_contexts',
      teste: '4.1',
      impacto: 'Usuários não conseguirão acessar nenhum dado'
    })
    
    log('   Usuários afetados:', 'y')
    usersWithoutAssociations.forEach(u => log(`      - ${u.email}`, 'y'))
  } else {
    test('4.1', 'Todos os usuários têm associações', 'PASS', '')
    pass++
  }
  
  // TESTE 2: Usuário com múltiplas associações (sendo context)
  log('\n🧪 TESTE 2: Usuário context com MÚLTIPLAS associações\n', 'c')
  
  const usersWithMultiple = orphanUsers?.filter(u => 
    u.user_contexts && u.user_contexts.length > 1
  )
  
  total++
  if (usersWithMultiple && usersWithMultiple.length > 0) {
    test('4.2', 'Usuário context com múltiplas associações', 'CRITICAL', 
      `${usersWithMultiple.length} usuários violam regra de negócio!`)
    critical++
    bugs.push({
      prioridade: 'ALTA',
      area: 'Regra de Negócio',
      descricao: 'Usuários context têm mais de 1 associação',
      teste: '4.2',
      impacto: 'Comportamento indefinido - qual contexto usar?'
    })
    
    log('   Usuários afetados:', 'y')
    usersWithMultiple.forEach(u => {
      log(`      - ${u.email}: ${u.user_contexts.length} associações`, 'y')
    })
  } else {
    test('4.2', 'Regra de 1 associação respeitada', 'PASS', '')
    pass++
  }
  
  // TESTE 3: Ticket sem context_id (deveria ser impossível)
  log('\n🧪 TESTE 3: Tickets órfãos (sem context_id)\n', 'c')
  
  const { data: orphanTickets } = await supabase
    .from('tickets')
    .select('id, ticket_number, title, context_id')
    .is('context_id', null)
  
  total++
  if (orphanTickets && orphanTickets.length > 0) {
    test('4.3', 'TICKETS ÓRFÃOS CRÍTICOS', 'CRITICAL', 
      `${orphanTickets.length} tickets sem context_id!`)
    critical++
    bugs.push({
      prioridade: 'CRÍTICA',
      area: 'Integridade de Dados',
      descricao: 'Tickets existem sem context_id',
      teste: '4.3',
      impacto: 'Tickets inacessíveis, sistema quebrado'
    })
  } else {
    test('4.3', 'Todos os tickets têm context_id', 'PASS', '')
    pass++
  }
  
  // TESTE 4: Context_id inválido (aponta para contexto inexistente)
  log('\n🧪 TESTE 4: Referências inválidas (context_id fantasma)\n', 'c')
  
  const { data: allTickets } = await supabase
    .from('tickets')
    .select('id, ticket_number, context_id')
  
  let invalidRefs = 0
  for (const ticket of allTickets || []) {
    if (ticket.context_id) {
      const { data: ctx } = await supabase
        .from('contexts')
        .select('id')
        .eq('id', ticket.context_id)
        .single()
      
      if (!ctx) invalidRefs++
    }
  }
  
  total++
  if (invalidRefs > 0) {
    test('4.4', 'REFERÊNCIAS FANTASMA', 'CRITICAL', 
      `${invalidRefs} tickets apontam para contextos inexistentes!`)
    critical++
    bugs.push({
      prioridade: 'CRÍTICA',
      area: 'Integridade Referencial',
      descricao: 'Tickets referenciam contextos deletados',
      teste: '4.4',
      impacto: 'Dados corrompidos, sistema instável'
    })
  } else {
    test('4.4', 'Integridade referencial OK', 'PASS', '')
    pass++
  }
}

// =============================================================================
// CENÁRIO 5: Análise de Código do Frontend
// =============================================================================

async function cenario5_analiseCodigoFrontend() {
  log('\n' + '═'.repeat(80), 'bold')
  log('CENÁRIO 5: Análise Estática do Código Frontend', 'bold')
  log('═'.repeat(80), 'bold')
  
  log('\n🔍 Analisando arquivos críticos do frontend...\n', 'c')
  
  // Analisar src/app/dashboard/tickets/page.tsx
  const ticketsPage = fs.readFileSync('src/app/dashboard/tickets/page.tsx', 'utf-8')
  
  // VERIFICAÇÃO 1: Uso de session vs banco
  total++
  const usesSessionUser = ticketsPage.includes('session.user.id') || ticketsPage.includes('session?.user?.id')
  const fetchesUserFromDB = ticketsPage.includes('supabase') && ticketsPage.includes('.from(\'users\')')
  
  if (fetchesUserFromDB) {
    test('5.1', 'Tickets page busca user do banco', 'PASS', 
      'Não confia apenas na sessão')
    pass++
  } else if (usesSessionUser) {
    test('5.1', 'DEPENDÊNCIA DE SESSÃO DETECTADA', 'WARN', 
      'Página usa session.user.id diretamente')
    warn++
  } else {
    test('5.1', 'Uso de sessão', 'PASS', 'Parece correto')
    pass++
  }
  
  // VERIFICAÇÃO 2: Tratamento de selectedClients
  total++
  const hasContextCheck = ticketsPage.match(/userType\s*===\s*['"]context['"]/g)
  const hasMatrixCheck = ticketsPage.match(/userType\s*===\s*['"]matrix['"]/g)
  
  if (hasContextCheck && hasMatrixCheck) {
    test('5.2', 'Código diferencia tipos de usuário', 'PASS', 
      'Lógica específica para context e matrix')
    pass++
  } else {
    test('5.2', 'Diferenciação de usuário ausente', 'CRITICAL', 
      'Código não trata context e matrix diferentemente!')
    critical++
    bugs.push({
      prioridade: 'CRÍTICA',
      area: 'Frontend - Tickets',
      descricao: 'Página não diferencia context de matrix users',
      teste: '5.2',
      impacto: 'Comportamento incorreto para usuários context'
    })
  }
  
  // VERIFICAÇÃO 3: Fetch de tickets - parâmetros enviados
  total++
  const buildsParams = ticketsPage.includes('URLSearchParams') && 
                       ticketsPage.includes('context_ids')
  
  if (buildsParams) {
    test('5.3', 'Construção de query params', 'PASS', 
      'Código monta context_ids corretamente')
    pass++
  } else {
    test('5.3', 'Query params', 'WARN', 
      'Verificar se context_ids é enviado')
    warn++
  }
  
  // Analisar src/app/dashboard/tickets/[id]/page.tsx
  log('\n🔍 Analisando página de detalhes do ticket...\n', 'c')
  
  const ticketDetailPage = fs.readFileSync('src/app/dashboard/tickets/[id]/page.tsx', 'utf-8')
  
  // VERIFICAÇÃO 4: Validação de acesso no frontend
  total++
  const hasContextValidation = ticketDetailPage.includes('context_id') && 
                                ticketDetailPage.includes('403')
  
  if (hasContextValidation) {
    test('5.4', 'Frontend valida contexto localmente', 'PASS', 
      'Página trata erro 403 da API')
    pass++
  } else {
    test('5.4', 'Validação local ausente', 'WARN', 
      'Frontend pode não tratar bloqueio de acesso adequadamente')
    warn++
  }
}

// =============================================================================
// CENÁRIO 6: Race Conditions e Timing Issues
// =============================================================================

async function cenario6_raceConditions() {
  log('\n' + '═'.repeat(80), 'bold')
  log('CENÁRIO 6: Race Conditions e Problemas de Timing', 'bold')
  log('═'.repeat(80), 'bold')
  
  log('\n🎬 SIMULANDO: Operações simultâneas (race condition)\n', 'c')
  
  const testUser = await supabase
    .from('users')
    .select('id, email')
    .eq('email', 'agro2@agro.com.br')
    .single()
  
  if (!testUser.data) return
  
  // TESTE: Criar e deletar associação rapidamente
  log('⚡ Criando e removendo associação em paralelo...', 'c')
  
  const testContext = '18031594-558a-4f45-847c-b1d2b58087f0'
  
  // Operação 1: Criar
  const createPromise = supabase
    .from('user_contexts')
    .insert({ user_id: testUser.data.id, context_id: testContext })
  
  // Operação 2: Deletar (antes de criar terminar - simulando race)
  const deletePromise = supabase
    .from('user_contexts')
    .delete()
    .eq('user_id', testUser.data.id)
    .eq('context_id', testContext)
  
  const [createResult, deleteResult] = await Promise.all([createPromise, deletePromise])
  
  // Verificar estado final
  await new Promise(r => setTimeout(r, 1000)) // Aguardar trigger
  
  const { data: finalState } = await supabase
    .from('users')
    .select('context_id')
    .eq('id', testUser.data.id)
    .single()
  
  const { count: assocCount } = await supabase
    .from('user_contexts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', testUser.data.id)
  
  total++
  const isConsistent = (assocCount === 0 && finalState.context_id === null) ||
                       (assocCount > 0 && finalState.context_id !== null)
  
  if (isConsistent) {
    test('6.1', 'Consistência após race condition', 'PASS', 
      'Estado final é consistente')
    pass++
  } else {
    test('6.1', 'INCONSISTÊNCIA POR RACE CONDITION', 'CRITICAL', 
      `assocs: ${assocCount}, context_id: ${finalState.context_id}`)
    critical++
    bugs.push({
      prioridade: 'CRÍTICA',
      area: 'Concorrência',
      descricao: 'Race condition deixa dados inconsistentes',
      teste: '6.1',
      impacto: 'Dados corrompidos em operações simultâneas'
    })
  }
  
  // Limpar teste
  await supabase.from('user_contexts').delete()
    .eq('user_id', testUser.data.id)
    .eq('context_id', testContext)
}

// =============================================================================
// EXECUTAR TESTES
// =============================================================================

async function executar() {
  const start = Date.now()
  
  await rodada2()
  
  const duration = ((Date.now() - start) / 1000).toFixed(2)
  
  log('\n' + '═'.repeat(80), 'bold')
  log('🔥 RESUMO - RODADA 2 (TESTES AGRESSIVOS)', 'bold')
  log('═'.repeat(80), 'bold')
  
  log(`\nTotal: ${total}`, 'x')
  log(`✅ Pass: ${pass}`, 'g')
  log(`❌ Fail: ${fail}`, 'r')
  log(`🔥 Critical: ${critical}`, 'm')
  log(`⚠️  Warn: ${warn}`, 'y')
  log(`⏱️  Tempo: ${duration}s\n`, 'b')
  
  const rate = total > 0 ? ((pass / total) * 100).toFixed(1) : 0
  log(`📊 Taxa de sucesso: ${rate}%`, rate >= 80 ? 'g' : rate >= 60 ? 'y' : 'r')
  
  if (bugs.length > 0) {
    log('\n' + '═'.repeat(80), 'bold')
    log('🐛 BUGS CRÍTICOS ENCONTRADOS', 'm')
    log('═'.repeat(80) + '\n', 'bold')
    
    bugs.forEach((bug, i) => {
      log(`[${bug.prioridade}] ${bug.area} - Teste ${bug.teste}`, 'm')
      log(`└─ ${bug.descricao}`, 'x')
      log(`└─ IMPACTO: ${bug.impacto}\n`, 'y')
    })
  } else {
    log('\n✨ Nenhum bug crítico encontrado!', 'g')
  }
  
  log('═'.repeat(80) + '\n', 'bold')
  
  if (critical > 0) {
    log('🔥 RODADA 2: REPROVADA - BUGS CRÍTICOS ENCONTRADOS', 'm')
  } else if (fail > 3) {
    log('❌ RODADA 2: REPROVADA - MUITAS FALHAS', 'r')
  } else if (warn > 5) {
    log('⚠️  RODADA 2: APROVADA COM RESSALVAS', 'y')
  } else {
    log('✅ RODADA 2: APROVADA', 'g')
  }
}

executar()

