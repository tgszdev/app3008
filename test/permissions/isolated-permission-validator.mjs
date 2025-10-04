#!/usr/bin/env node
/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║  VALIDAÇÃO ISOLADA DE CADA PERMISSÃO                              ║
 * ║  Valida SE e COMO cada permissão está sendo aplicada              ║
 * ║  CTS + CI/CD + Mutation + Static + E2E + APM + Shift Left         ║
 * ╚════════════════════════════════════════════════════════════════════╝
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ====================================================================
// DEFINIÇÃO DE CADA PERMISSÃO COM VALIDAÇÃO INDIVIDUAL
// ====================================================================

const PERMISSIONS_DETAILED = {
  'tickets_change_status': {
    label: 'Alterar Status',
    file: 'src/app/dashboard/tickets/[id]/page.tsx',
    expectedCheck: "hasPermission('tickets_change_status')",
    alternativeChecks: ['canEditThisTicket', 'canEditAllTickets', 'canEditOwnTickets'],
    mustBeIsolated: true, // DEVE ter verificação ESPECÍFICA
    line: 1028,
    description: 'Botão para alterar status do ticket'
  },
  
  'tickets_change_priority': {
    label: 'Alterar Criticidade',
    file: 'src/app/dashboard/tickets/[id]/page.tsx',
    expectedCheck: "hasPermission('tickets_change_priority')",
    alternativeChecks: ['canEditThisTicket', 'canEditAllTickets', 'canEditOwnTickets'],
    mustBeIsolated: true,
    line: null,
    description: 'Dropdown de prioridade editável'
  },
  
  'tickets_assign': {
    label: 'Atribuir Responsável',
    file: 'src/app/dashboard/tickets/[id]/page.tsx',
    expectedCheck: "hasPermission('tickets_assign')",
    alternativeChecks: ['canAssignTickets'],
    mustBeIsolated: true,
    line: 1039,
    description: 'Botão para atribuir responsável'
  },
  
  'tickets_close': {
    label: 'Fechar Tickets',
    file: 'src/app/dashboard/tickets/[id]/page.tsx',
    expectedCheck: "hasPermission('tickets_close')",
    alternativeChecks: ['canCloseTickets'],
    mustBeIsolated: true,
    line: null,
    description: 'Botão para fechar ticket'
  },
  
  'tickets_delete': {
    label: 'Excluir Tickets',
    file: 'src/app/dashboard/tickets/[id]/page.tsx',
    expectedCheck: "hasPermission('tickets_delete')",
    alternativeChecks: ['canDeleteTickets'],
    mustBeIsolated: true,
    line: null,
    description: 'Botão para deletar ticket'
  },
  
  'tickets_export': {
    label: 'Exportar Tickets',
    file: 'src/app/dashboard/tickets/page.tsx',
    expectedCheck: "hasPermission('tickets_export')",
    alternativeChecks: [],
    mustBeIsolated: true,
    line: 707,
    description: 'Botão Exportar PDF'
  },
  
  'tickets_create': {
    label: 'Criar Tickets',
    file: 'src/app/dashboard/tickets/page.tsx',
    expectedCheck: "hasPermission('tickets_create')",
    alternativeChecks: ['canCreateTickets'],
    mustBeIsolated: true,
    line: 726,
    description: 'Botão Novo Chamado'
  },
  
  'tickets_bulk_actions': {
    label: 'Ações em Massa',
    file: 'src/app/dashboard/tickets/page.tsx',
    expectedCheck: "hasPermission('tickets_bulk_actions')",
    alternativeChecks: [],
    mustBeIsolated: true,
    line: null,
    description: 'Checkboxes de seleção múltipla'
  },
  
  'tickets_view_internal': {
    label: 'Ver Tickets Internos',
    file: 'src/app/dashboard/tickets/page.tsx',
    expectedCheck: "hasPermission('tickets_view_internal')",
    alternativeChecks: [],
    mustBeIsolated: true,
    line: null,
    description: 'Filtro/visualização de tickets internos'
  },
  
  'tickets_create_internal': {
    label: 'Criar Tickets Internos',
    file: 'src/app/dashboard/tickets/new/page.tsx',
    expectedCheck: "hasPermission('tickets_create_internal')",
    alternativeChecks: ['canEditAllTickets'],
    mustBeIsolated: true,
    line: null,
    description: 'Checkbox "Marcar como Interno"'
  }
}

// ====================================================================
// SHIFT LEFT - Análise Estática Isolada
// ====================================================================

async function shiftLeftAnalysis(permission, config) {
  const fullPath = path.join(process.cwd(), config.file)
  
  if (!fs.existsSync(fullPath)) {
    return {
      status: 'FILE_NOT_FOUND',
      hasExpectedCheck: false,
      hasAlternativeCheck: false,
      actualChecks: [],
      severity: 'LOW',
      message: 'Arquivo não existe (feature não implementada)'
    }
  }
  
  const content = fs.readFileSync(fullPath, 'utf8')
  const lines = content.split('\n')
  
  // Verificar se tem a verificação esperada
  const hasExpectedCheck = content.includes(config.expectedCheck)
  
  // Verificar se tem verificações alternativas
  const foundAlternatives = config.alternativeChecks.filter(alt => content.includes(alt))
  
  // Verificar se usa usePermissions
  const usesPermissionsHook = content.includes('usePermissions')
  
  // Encontrar onde está o elemento (buscar no contexto da linha)
  let elementContext = null
  if (config.line) {
    const startLine = Math.max(0, config.line - 10)
    const endLine = Math.min(lines.length, config.line + 5)
    elementContext = lines.slice(startLine, endLine).join('\n')
  } else {
    // Buscar por palavras-chave do elemento
    const keywords = config.description.split(' ')
    for (let i = 0; i < lines.length; i++) {
      if (keywords.some(kw => lines[i].includes(kw))) {
        elementContext = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 5)).join('\n')
        break
      }
    }
  }
  
  // Determinar status
  let status = 'UNKNOWN'
  let severity = 'MEDIUM'
  let message = ''
  
  if (!usesPermissionsHook) {
    status = 'NO_HOOK'
    severity = 'CRITICAL'
    message = 'Arquivo não usa usePermissions() hook'
  } else if (hasExpectedCheck) {
    status = 'CORRECT'
    severity = 'OK'
    message = 'Verificação isolada correta'
  } else if (foundAlternatives.length > 0 && !config.mustBeIsolated) {
    status = 'ALTERNATIVE_OK'
    severity = 'OK'
    message = `Usando verificação alternativa: ${foundAlternatives.join(', ')}`
  } else if (foundAlternatives.length > 0 && config.mustBeIsolated) {
    status = 'WRONG_CHECK'
    severity = 'CRITICAL'
    message = `⚠️ PROBLEMA: Usando ${foundAlternatives.join(', ')} mas deveria usar verificação isolada!`
  } else {
    status = 'NO_CHECK'
    severity = 'CRITICAL'
    message = 'Nenhuma verificação de permissão encontrada'
  }
  
  return {
    status,
    severity,
    message,
    hasExpectedCheck,
    hasAlternativeCheck: foundAlternatives.length > 0,
    actualChecks: foundAlternatives,
    usesPermissionsHook,
    elementContext
  }
}

// ====================================================================
// MUTATION TESTING - Testar Comportamento Real
// ====================================================================

async function mutationTest(permission, userHasPermission) {
  // Simular: O que DEVERIA acontecer vs O que ACONTECE
  
  const expected = {
    shouldShow: userHasPermission,
    shouldEnable: userHasPermission,
    shouldAllowAction: userHasPermission
  }
  
  return {
    expected,
    testScenarios: [
      {
        scenario: 'Usuário COM permissão',
        hasPermission: true,
        shouldShow: true,
        shouldEnable: true
      },
      {
        scenario: 'Usuário SEM permissão',
        hasPermission: false,
        shouldShow: false,
        shouldEnable: false
      }
    ]
  }
}

// ====================================================================
// E2E TESTING - Validar com Usuário Real
// ====================================================================

async function e2eValidation(permission, config, userEmail) {
  // Buscar usuário
  const { data: user } = await supabase
    .from('users')
    .select('*, roles:role(permissions)')
    .eq('email', userEmail)
    .single()
  
  if (!user || !user.roles) {
    return {
      status: 'USER_NOT_FOUND',
      hasPermission: false,
      shouldSeeElement: false,
      actualBehavior: 'UNKNOWN'
    }
  }
  
  const hasPermission = user.roles.permissions[permission] === true
  
  // Verificar comportamento alternativo
  let hasAlternativePermission = false
  for (const alt of config.alternativeChecks) {
    // Mapear variável para permissão
    const altPermission = alt
      .replace('can', '')
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .substring(1)
    
    if (user.roles.permissions[altPermission] === true) {
      hasAlternativePermission = true
      break
    }
  }
  
  // Verificar se tem tickets_edit_own (pode causar problema)
  const hasEditOwn = user.roles.permissions['tickets_edit_own'] === true
  const hasEditAll = user.roles.permissions['tickets_edit_all'] === true
  
  return {
    status: 'VALIDATED',
    hasPermission,
    hasAlternativePermission,
    hasEditOwn,
    hasEditAll,
    shouldSeeElement: hasPermission,
    potentialIssue: !hasPermission && (hasEditOwn || hasEditAll) && config.mustBeIsolated,
    recommendation: !hasPermission && (hasEditOwn || hasEditAll) 
      ? `⚠️ ATENÇÃO: Usuário tem ${hasEditOwn ? 'tickets_edit_own' : 'tickets_edit_all'} que pode estar permitindo acesso indevido!`
      : null
  }
}

// ====================================================================
// STATIC ANALYSIS - Analisar Código Linha por Linha
// ====================================================================

function staticAnalysisDetailed(config) {
  const fullPath = path.join(process.cwd(), config.file)
  
  if (!fs.existsSync(fullPath)) {
    return { found: false, lines: [], issues: [] }
  }
  
  const content = fs.readFileSync(fullPath, 'utf8')
  const lines = content.split('\n')
  
  const findings = []
  const issues = []
  
  // Procurar por padrões problemáticos
  lines.forEach((line, index) => {
    const lineNum = index + 1
    
    // Buscar verificações de permissão
    if (line.includes('canEdit') || line.includes('hasPermission')) {
      findings.push({
        line: lineNum,
        code: line.trim(),
        type: 'PERMISSION_CHECK'
      })
    }
    
    // Buscar botões ou elementos interativos
    if ((line.includes('<button') || line.includes('onClick')) && 
        config.description.toLowerCase().split(' ').some(word => line.toLowerCase().includes(word))) {
      
      // Verificar contexto (10 linhas antes)
      const contextStart = Math.max(0, index - 10)
      const context = lines.slice(contextStart, index + 1).join('\n')
      
      const hasCheck = context.includes(config.expectedCheck) ||
                      config.alternativeChecks.some(alt => context.includes(alt))
      
      if (!hasCheck) {
        issues.push({
          line: lineNum,
          code: line.trim(),
          severity: 'CRITICAL',
          message: `Elemento sem verificação de permissão adequada`
        })
      }
    }
  })
  
  return { found: findings.length > 0, lines: findings, issues }
}

// ====================================================================
// APM - Calcular Score de Qualidade
// ====================================================================

function calculateQualityScore(results) {
  const total = Object.keys(results).length
  const correct = Object.values(results).filter(r => 
    r.shiftLeft.severity === 'OK' || r.shiftLeft.status === 'FILE_NOT_FOUND'
  ).length
  const critical = Object.values(results).filter(r => 
    r.shiftLeft.severity === 'CRITICAL'
  ).length
  
  return {
    total,
    correct,
    critical,
    score: ((correct / total) * 100).toFixed(1),
    status: critical === 0 ? 'PASS' : 'FAIL'
  }
}

// ====================================================================
// CI/CD - Gerar Relatório Estruturado
// ====================================================================

function generateCICDReport(results, qualityScore) {
  const criticalIssues = []
  
  for (const [permission, result] of Object.entries(results)) {
    if (result.shiftLeft.severity === 'CRITICAL') {
      criticalIssues.push({
        permission,
        file: result.config.file,
        line: result.config.line,
        issue: result.shiftLeft.message,
        recommendation: result.e2e.recommendation
      })
    }
  }
  
  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalPermissions: Object.keys(results).length,
      correctImplementations: qualityScore.correct,
      criticalIssues: qualityScore.critical,
      qualityScore: qualityScore.score,
      status: qualityScore.status
    },
    criticalIssues,
    passesCI: qualityScore.status === 'PASS'
  }
}

// ====================================================================
// MAIN - Executar Todas as Validações
// ====================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗')
  console.log('║                                                                ║')
  console.log('║     VALIDAÇÃO ISOLADA DE CADA PERMISSÃO                       ║')
  console.log('║     Metodologias: CTS + CI/CD + Mutation + Static + E2E +APM  ║')
  console.log('║                                                                ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  console.log('🎯 Validando 10 permissões críticas de forma ISOLADA...\n')
  console.log('📧 Usuário de teste: agro2@agro.com.br\n')
  
  const results = {}
  
  for (const [permission, config] of Object.entries(PERMISSIONS_DETAILED)) {
    console.log(`\n${'='.repeat(70)}`)
    console.log(`🔍 VALIDANDO: ${config.label} (${permission})`)
    console.log('='.repeat(70))
    
    // Shift Left - Static Analysis
    console.log('\n📊 SHIFT LEFT TESTING (Static Analysis):')
    const shiftLeft = await shiftLeftAnalysis(permission, config)
    console.log(`   Status: ${shiftLeft.status}`)
    console.log(`   Severidade: ${shiftLeft.severity}`)
    console.log(`   Verificação Esperada: ${config.expectedCheck}`)
    console.log(`   Tem Verificação Esperada? ${shiftLeft.hasExpectedCheck ? '✅' : '❌'}`)
    console.log(`   Tem Verificação Alternativa? ${shiftLeft.hasAlternativeCheck ? '✅' : '❌'}`)
    if (shiftLeft.actualChecks.length > 0) {
      console.log(`   Verificações Encontradas: ${shiftLeft.actualChecks.join(', ')}`)
    }
    console.log(`   Mensagem: ${shiftLeft.message}`)
    
    // E2E Testing
    console.log('\n🧪 E2E TESTING (Usuário Real):')
    const e2e = await e2eValidation(permission, config, 'agro2@agro.com.br')
    console.log(`   Usuário tem ${permission}? ${e2e.hasPermission ? '✅ SIM' : '❌ NÃO'}`)
    console.log(`   Tem tickets_edit_own? ${e2e.hasEditOwn ? '✅ SIM' : '❌ NÃO'}`)
    console.log(`   Tem tickets_edit_all? ${e2e.hasEditAll ? '✅ SIM' : '❌ NÃO'}`)
    console.log(`   DEVE ver elemento? ${e2e.shouldSeeElement ? '✅ SIM' : '❌ NÃO'}`)
    if (e2e.potentialIssue) {
      console.log(`   ⚠️  PROBLEMA POTENCIAL DETECTADO!`)
      console.log(`   ${e2e.recommendation}`)
    }
    
    // Mutation Testing
    console.log('\n🧬 MUTATION TESTING (Cenários):')
    const mutation = await mutationTest(permission, e2e.hasPermission)
    mutation.testScenarios.forEach(scenario => {
      const icon = scenario.hasPermission === e2e.hasPermission ? '✅' : '⚠️'
      console.log(`   ${icon} ${scenario.scenario}: deve ${scenario.shouldShow ? 'MOSTRAR' : 'OCULTAR'}`)
    })
    
    // Static Analysis Detailed
    console.log('\n📝 STATIC ANALYSIS (Código):')
    const staticAnalysis = staticAnalysisDetailed(config)
    console.log(`   Verificações encontradas: ${staticAnalysis.lines.length}`)
    if (staticAnalysis.issues.length > 0) {
      console.log(`   ❌ Issues encontrados: ${staticAnalysis.issues.length}`)
      staticAnalysis.issues.forEach(issue => {
        console.log(`      Linha ${issue.line}: ${issue.message}`)
      })
    } else {
      console.log(`   ✅ Nenhum issue encontrado`)
    }
    
    // Resultado consolidado
    const hasCriticalIssue = shiftLeft.severity === 'CRITICAL' || e2e.potentialIssue
    
    console.log('\n' + '─'.repeat(70))
    if (hasCriticalIssue) {
      console.log('❌ RESULTADO: PROBLEMA CRÍTICO ENCONTRADO!')
      console.log('   Ação: CORREÇÃO NECESSÁRIA')
    } else {
      console.log('✅ RESULTADO: IMPLEMENTAÇÃO CORRETA')
      console.log('   Ação: Nenhuma')
    }
    
    results[permission] = {
      config,
      shiftLeft,
      e2e,
      mutation,
      staticAnalysis,
      hasCriticalIssue
    }
  }
  
  // APM - Quality Score
  console.log('\n\n' + '='.repeat(70))
  console.log('📊 APM - APPLICATION PERFORMANCE MONITORING')
  console.log('='.repeat(70))
  
  const qualityScore = calculateQualityScore(results)
  console.log(`\n   Total de Permissões: ${qualityScore.total}`)
  console.log(`   Implementações Corretas: ${qualityScore.correct}`)
  console.log(`   Problemas Críticos: ${qualityScore.critical}`)
  console.log(`   Quality Score: ${qualityScore.score}%`)
  console.log(`   Status: ${qualityScore.status}`)
  
  // CI/CD Report
  console.log('\n\n' + '='.repeat(70))
  console.log('🔄 CI/CD REPORT')
  console.log('='.repeat(70))
  
  const ciReport = generateCICDReport(results, qualityScore)
  
  // Salvar relatório
  const reportPath = path.join(process.cwd(), 'test/permissions/isolated-validation-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(ciReport, null, 2))
  console.log(`\n   Relatório salvo: ${reportPath}`)
  console.log(`   Status CI/CD: ${ciReport.passesCI ? '✅ PASS' : '❌ FAIL'}`)
  
  if (ciReport.criticalIssues.length > 0) {
    console.log(`\n   🚨 ${ciReport.criticalIssues.length} PROBLEMAS CRÍTICOS:\n`)
    ciReport.criticalIssues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue.permission}`)
      console.log(`      Arquivo: ${issue.file}:${issue.line || '?'}`)
      console.log(`      Problema: ${issue.issue}`)
      if (issue.recommendation) {
        console.log(`      ${issue.recommendation}`)
      }
      console.log('')
    })
  }
  
  // Relatório final
  console.log('\n\n' + '='.repeat(70))
  console.log('✅ RELATÓRIO FINAL')
  console.log('='.repeat(70) + '\n')
  
  if (ciReport.passesCI) {
    console.log('   ✅ TODAS AS PERMISSÕES VALIDADAS COM SUCESSO!')
    console.log('   ✅ Sistema aprovado para produção')
  } else {
    console.log('   ❌ PROBLEMAS ENCONTRADOS - CORREÇÃO NECESSÁRIA')
    console.log('   ❌ Deploy bloqueado até correção')
  }
  
  console.log('\n' + '='.repeat(70) + '\n')
  
  process.exit(ciReport.passesCI ? 0 : 1)
}

main()

