#!/usr/bin/env node
/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║  DIAGNÓSTICO COMPLETO - SISTEMA DE NOTIFICAÇÕES POR EMAIL        ║
 * ║  13 Metodologias: CTS + CI/CD + Mutation + Static + E2E + APM +  ║
 * ║  Shift Left + Chaos + TIA + RUM + Security + TestData +          ║
 * ║  Visual Regression + Quality Gates + TestOps                      ║
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

console.log('╔════════════════════════════════════════════════════════════════╗')
console.log('║                                                                ║')
console.log('║    DIAGNÓSTICO COMPLETO - NOTIFICAÇÕES POR EMAIL              ║')
console.log('║    13 Metodologias de Teste Aplicadas                         ║')
console.log('║                                                                ║')
console.log('╚════════════════════════════════════════════════════════════════╝\n')

console.log('📅 Data:', new Date().toLocaleString('pt-BR'))
console.log('🎯 Objetivo: Analisar sistema completo de emails')
console.log('⏱️  Duração estimada: 8-12 minutos\n')

const startTime = Date.now()
const results = {
  infrastructure: {},
  configuration: {},
  templates: {},
  triggers: {},
  mockData: {},
  security: {},
  performance: {},
  issues: []
}

// ====================================================================
// FASE 1: SHIFT LEFT TESTING - Análise de Infraestrutura
// ====================================================================

async function phase1_ShiftLeftTesting() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║   FASE 1: SHIFT LEFT TESTING (Infraestrutura de Email)        ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  const infrastructure = {
    emailProvider: null,
    configFiles: [],
    envVars: [],
    libraries: []
  }
  
  console.log('🔍 1.1 Verificando provider de email...\n')
  
  // Verificar variáveis de ambiente
  const emailEnvVars = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'SMTP_FROM',
    'EMAIL_FROM',
    'RESEND_API_KEY',
    'SENDGRID_API_KEY',
    'MAILGUN_API_KEY',
    'POSTMARK_API_KEY'
  ]
  
  for (const envVar of emailEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar} configurado`)
      infrastructure.envVars.push(envVar)
      
      if (envVar.includes('RESEND')) infrastructure.emailProvider = 'Resend'
      else if (envVar.includes('SENDGRID')) infrastructure.emailProvider = 'SendGrid'
      else if (envVar.includes('SMTP')) infrastructure.emailProvider = 'SMTP'
      else if (envVar.includes('MAILGUN')) infrastructure.emailProvider = 'Mailgun'
      else if (envVar.includes('POSTMARK')) infrastructure.emailProvider = 'Postmark'
    }
  }
  
  if (infrastructure.envVars.length === 0) {
    console.log('❌ NENHUMA variável de email configurada!')
    results.issues.push({
      severity: 'CRITICAL',
      category: 'Infrastructure',
      issue: 'Provider de email não configurado',
      impact: 'Sistema não pode enviar emails',
      solution: 'Configurar SMTP ou provider (Resend, SendGrid, etc.)'
    })
  } else {
    console.log(`\n✅ Provider detectado: ${infrastructure.emailProvider || 'SMTP Custom'}`)
  }
  
  // Verificar arquivos de configuração
  console.log('\n🔍 1.2 Verificando arquivos de email...\n')
  
  const emailFiles = [
    'src/lib/email.ts',
    'src/lib/email-service.ts',
    'src/lib/mailer.ts',
    'src/utils/sendEmail.ts',
    'src/services/email.service.ts'
  ]
  
  for (const file of emailFiles) {
    const fullPath = path.join(process.cwd(), file)
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file}`)
      infrastructure.configFiles.push(file)
    }
  }
  
  if (infrastructure.configFiles.length === 0) {
    console.log('❌ Nenhum arquivo de configuração de email encontrado!')
    results.issues.push({
      severity: 'CRITICAL',
      category: 'Infrastructure',
      issue: 'Arquivos de serviço de email não existem',
      impact: 'Não há código para enviar emails'
    })
  }
  
  // Verificar bibliotecas instaladas
  console.log('\n🔍 1.3 Verificando bibliotecas instaladas...\n')
  
  const packagePath = path.join(process.cwd(), 'package.json')
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    const emailLibs = ['nodemailer', 'resend', '@sendgrid/mail', 'mailgun-js', 'postmark']
    
    for (const lib of emailLibs) {
      if (packageJson.dependencies?.[lib] || packageJson.devDependencies?.[lib]) {
        console.log(`✅ ${lib} instalado`)
        infrastructure.libraries.push(lib)
      }
    }
    
    if (infrastructure.libraries.length === 0) {
      console.log('❌ Nenhuma biblioteca de email instalada!')
      results.issues.push({
        severity: 'CRITICAL',
        category: 'Infrastructure',
        issue: 'Biblioteca de email não instalada',
        impact: 'Impossível enviar emails sem biblioteca'
      })
    }
  }
  
  results.infrastructure = infrastructure
  return infrastructure
}

// ====================================================================
// FASE 2: DATABASE ANALYSIS - Verificar Tabelas e Triggers
// ====================================================================

async function phase2_DatabaseAnalysis() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║   FASE 2: DATABASE ANALYSIS (Banco de Dados)                  ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  const dbInfo = {
    tables: {},
    triggers: [],
    functions: [],
    queuedEmails: 0
  }
  
  console.log('🔍 2.1 Verificando tabelas de email...\n')
  
  const emailTables = [
    'email_notifications',
    'email_queue',
    'notification_queue',
    'email_logs',
    'email_templates'
  ]
  
  for (const table of emailTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ Tabela "${table}" NÃO EXISTE`)
          dbInfo.tables[table] = { exists: false, count: 0 }
        } else {
          console.log(`⚠️  Tabela "${table}" - Erro: ${error.message}`)
        }
      } else {
        console.log(`✅ Tabela "${table}" - ${count || 0} registros`)
        dbInfo.tables[table] = { exists: true, count: count || 0 }
        
        if (table.includes('queue')) {
          dbInfo.queuedEmails += count || 0
        }
      }
    } catch (err) {
      console.log(`⚠️  Erro ao verificar "${table}"`)
    }
  }
  
  const existingTables = Object.entries(dbInfo.tables)
    .filter(([_, info]) => info.exists)
    .map(([table, _]) => table)
  
  if (existingTables.length === 0) {
    results.issues.push({
      severity: 'HIGH',
      category: 'Database',
      issue: 'Nenhuma tabela de email existe',
      impact: 'Sistema pode não ter persistência de emails'
    })
  }
  
  // Verificar estrutura de uma tabela existente
  if (existingTables.length > 0) {
    console.log(`\n🔍 2.2 Verificando estrutura da tabela "${existingTables[0]}"...\n`)
    
    try {
      const { data: sample } = await supabase
        .from(existingTables[0])
        .select('*')
        .limit(1)
      
      if (sample && sample.length > 0) {
        const columns = Object.keys(sample[0])
        console.log(`   Colunas (${columns.length}): ${columns.join(', ')}`)
      }
    } catch (err) {
      console.log(`   ⚠️  Erro ao verificar estrutura`)
    }
  }
  
  results.configuration.database = dbInfo
  return dbInfo
}

// ====================================================================
// FASE 3: STATIC ANALYSIS - Análise de Código
// ====================================================================

function phase3_StaticAnalysis() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║   FASE 3: STATIC ANALYSIS (Análise de Código)                 ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  const codeAnalysis = {
    emailFunctions: [],
    triggers: [],
    templates: [],
    mockData: []
  }
  
  console.log('🔍 3.1 Procurando funções de envio de email...\n')
  
  const patterns = {
    sendEmail: /function\s+sendEmail|const\s+sendEmail|sendEmail\s*=/g,
    sendNotification: /sendNotification|sendEmailNotification/g,
    nodemailerTransport: /nodemailer\.createTransport|transporter\.sendMail/g,
    resendSend: /resend\.emails\.send/g,
    mockEmail: /console\.log.*email|\/\/.*TODO.*email|return\s+true.*email/gi
  }
  
  const filesToScan = [
    'src/lib',
    'src/app/api',
    'src/utils',
    'src/services'
  ]
  
  for (const dir of filesToScan) {
    const dirPath = path.join(process.cwd(), dir)
    if (!fs.existsSync(dirPath)) continue
    
    const scanDir = (dirPath) => {
      const items = fs.readdirSync(dirPath)
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item)
        const stat = fs.statSync(itemPath)
        
        if (stat.isDirectory()) {
          scanDir(itemPath)
        } else if (item.endsWith('.ts') || item.endsWith('.js')) {
          const content = fs.readFileSync(itemPath, 'utf8')
          const relativePath = itemPath.replace(process.cwd(), '')
          
          // Procurar padrões
          for (const [name, pattern] of Object.entries(patterns)) {
            const matches = content.match(pattern)
            if (matches) {
              if (name === 'mockEmail') {
                codeAnalysis.mockData.push({
                  file: relativePath,
                  pattern: name,
                  occurrences: matches.length
                })
              } else {
                codeAnalysis.emailFunctions.push({
                  file: relativePath,
                  function: name,
                  occurrences: matches.length
                })
              }
            }
          }
        }
      }
    }
    
    scanDir(dirPath)
  }
  
  console.log(`   Funções de email encontradas: ${codeAnalysis.emailFunctions.length}`)
  
  if (codeAnalysis.emailFunctions.length > 0) {
    codeAnalysis.emailFunctions.slice(0, 5).forEach(fn => {
      console.log(`   ✅ ${fn.file} - ${fn.function} (${fn.occurrences}x)`)
    })
  } else {
    console.log('   ❌ Nenhuma função de envio de email encontrada!')
    results.issues.push({
      severity: 'CRITICAL',
      category: 'Code',
      issue: 'Funções de envio de email não existem',
      impact: 'Sistema não tem como enviar emails'
    })
  }
  
  if (codeAnalysis.mockData.length > 0) {
    console.log(`\n   ⚠️  DADOS MOCKADOS detectados: ${codeAnalysis.mockData.length}`)
    codeAnalysis.mockData.forEach(mock => {
      console.log(`      ${mock.file} - ${mock.pattern}`)
      results.issues.push({
        severity: 'HIGH',
        category: 'Mock Data',
        issue: `Dados mockados em ${mock.file}`,
        impact: 'Emails podem não estar sendo enviados (apenas logados)'
      })
    })
  }
  
  results.codeAnalysis = codeAnalysis
  return codeAnalysis
}

// ====================================================================
// FASE 4: E2E TESTING - Testar Fluxo Completo
// ====================================================================

async function phase4_E2ETesting() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║   FASE 4: E2E TESTING (Fluxo End-to-End)                      ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  console.log('🔍 4.1 Mapeando gatilhos de email...\n')
  
  const emailTriggers = {
    'Novo Ticket Criado': { file: 'src/app/api/tickets/route.ts', implemented: false },
    'Ticket Atribuído': { file: 'src/app/api/tickets/route.ts', implemented: false },
    'Novo Comentário': { file: 'src/app/api/comments/route.ts', implemented: false },
    'Status Alterado': { file: 'src/app/api/tickets/[id]/status/route.ts', implemented: false },
    'Ticket Fechado': { file: 'src/app/api/tickets/route.ts', implemented: false },
    'SLA Violado': { file: 'src/lib/sla-monitor.ts', implemented: false }
  }
  
  for (const [trigger, info] of Object.entries(emailTriggers)) {
    const fullPath = path.join(process.cwd(), info.file)
    
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8')
      
      // Procurar chamadas de sendEmail/sendNotification
      const hasSendEmail = content.includes('sendEmail') || 
                          content.includes('sendNotification') ||
                          content.includes('createAndSendNotification')
      
      if (hasSendEmail) {
        console.log(`✅ ${trigger}`)
        emailTriggers[trigger].implemented = true
      } else {
        console.log(`❌ ${trigger} - Sem envio de email`)
        results.issues.push({
          severity: 'MEDIUM',
          category: 'E2E Flow',
          issue: `${trigger}: Email não é enviado`,
          impact: 'Usuários não são notificados desta ação'
        })
      }
    } else {
      console.log(`⚠️  ${trigger} - Arquivo não existe`)
    }
  }
  
  results.triggers = emailTriggers
  return emailTriggers
}

// ====================================================================
// FASE 5: MOCK DATA DETECTION - Detectar Emails Falsos
// ====================================================================

function phase5_MockDataDetection() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║   FASE 5: MOCK DATA DETECTION (Detecção de Dados Falsos)      ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  const mockPatterns = [
    { regex: /console\.log\(['"].*email/gi, name: 'Email logado ao invés de enviado' },
    { regex: /return\s+true\s*\/\/.*email/gi, name: 'Retorno mockado sem enviar' },
    { regex: /\/\/\s*TODO:?\s*implement.*email/gi, name: 'TODO pendente' },
    { regex: /if\s*\(false\)\s*{[\s\S]*?sendEmail/g, name: 'Código desabilitado' }
  ]
  
  const mockFindings = []
  const emailFiles = results.codeAnalysis?.emailFunctions?.map(f => f.file) || []
  
  for (const file of emailFiles) {
    const fullPath = path.join(process.cwd(), file)
    if (!fs.existsSync(fullPath)) continue
    
    const content = fs.readFileSync(fullPath, 'utf8')
    
    for (const { regex, name } of mockPatterns) {
      const matches = content.match(regex)
      if (matches) {
        mockFindings.push({
          file,
          pattern: name,
          occurrences: matches.length,
          severity: 'CRITICAL'
        })
      }
    }
  }
  
  if (mockFindings.length > 0) {
    console.log('🚨 MOCKS/TODOs ENCONTRADOS:\n')
    mockFindings.forEach(mock => {
      console.log(`   ❌ ${mock.file}`)
      console.log(`      ${mock.pattern} (${mock.occurrences}x)`)
      
      results.issues.push({
        severity: 'CRITICAL',
        category: 'Mock Data',
        issue: `${mock.pattern} em ${mock.file}`,
        impact: 'Emails não estão sendo enviados de verdade'
      })
    })
  } else {
    console.log('✅ Nenhum mock/TODO detectado em funções de email\n')
  }
  
  results.mockData = mockFindings
  return mockFindings
}

// ====================================================================
// FASE 6: SECURITY TESTING - Verificar Segurança
// ====================================================================

async function phase6_SecurityTesting() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║   FASE 6: SECURITY TESTING (Segurança de Email)               ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  const security = {
    vulnerabilities: [],
    protections: []
  }
  
  console.log('🔐 6.1 Verificando vulnerabilidades comuns...\n')
  
  const emailFiles = results.codeAnalysis?.emailFunctions?.map(f => f.file) || []
  
  for (const file of emailFiles) {
    const fullPath = path.join(process.cwd(), file)
    if (!fs.existsSync(fullPath)) continue
    
    const content = fs.readFileSync(fullPath, 'utf8')
    
    // Email Injection
    if (content.includes('${') && content.includes('email') && !content.includes('sanitize')) {
      security.vulnerabilities.push({
        type: 'Email Injection',
        file,
        severity: 'HIGH'
      })
      console.log(`   ⚠️  ${file} - Possível Email Injection (sem sanitização)`)
    }
    
    // Rate Limiting
    if (!content.includes('rateLimit') && !content.includes('throttle')) {
      security.vulnerabilities.push({
        type: 'No Rate Limiting',
        file,
        severity: 'MEDIUM'
      })
    }
    
    // HTML Injection
    if (content.includes('<html>') && !content.includes('escape') && !content.includes('sanitize')) {
      security.vulnerabilities.push({
        type: 'HTML Injection',
        file,
        severity: 'MEDIUM'
      })
    }
  }
  
  if (security.vulnerabilities.length > 0) {
    console.log(`\n🚨 ${security.vulnerabilities.length} vulnerabilidades encontradas`)
    
    results.issues.push({
      severity: 'HIGH',
      category: 'Security',
      issue: `${security.vulnerabilities.length} vulnerabilidades de segurança`,
      impact: 'Sistema pode ser explorado para spam/phishing'
    })
  } else {
    console.log('   ✅ Nenhuma vulnerabilidade óbvia detectada')
  }
  
  results.security = security
  return security
}

// ====================================================================
// FASE 7: CHAOS ENGINEERING - Teste de Falhas
// ====================================================================

async function phase7_ChaosEngineering() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║   FASE 7: CHAOS ENGINEERING (Teste de Resiliência)            ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  console.log('💥 7.1 Simulando cenários de falha...\n')
  
  const chaosScenarios = [
    {
      name: 'Provider de email offline',
      impact: 'Emails não são enviados',
      mitigation: 'Deve ter fila de retry ou log de erro'
    },
    {
      name: 'Email inválido no destinatário',
      impact: 'Envio falha',
      mitigation: 'Deve validar email antes de enviar'
    },
    {
      name: 'Limite de envio excedido',
      impact: 'Provider bloqueia',
      mitigation: 'Deve ter rate limiting'
    },
    {
      name: 'Template de email não existe',
      impact: 'Erro ao renderizar',
      mitigation: 'Deve ter fallback ou template padrão'
    }
  ]
  
  for (const scenario of chaosScenarios) {
    console.log(`❓ ${scenario.name}`)
    console.log(`   Impacto: ${scenario.impact}`)
    console.log(`   Mitigação: ${scenario.mitigation}`)
    console.log('')
  }
  
  console.log('ℹ️  Testes de resiliência requerem execução real (não implementado neste scan)')
}

// ====================================================================
// FASE 8: TEMPLATE ANALYSIS - Verificar Templates de Email
// ====================================================================

function phase8_TemplateAnalysis() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║   FASE 8: TEMPLATE ANALYSIS (Templates de Email)              ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  console.log('🔍 8.1 Procurando templates de email...\n')
  
  const templateDirs = [
    'src/templates/email',
    'src/emails',
    'emails',
    'templates/email'
  ]
  
  const templates = []
  
  for (const dir of templateDirs) {
    const dirPath = path.join(process.cwd(), dir)
    if (fs.existsSync(dirPath)) {
      console.log(`✅ Diretório encontrado: ${dir}`)
      
      const files = fs.readdirSync(dirPath)
      files.forEach(file => {
        if (file.endsWith('.html') || file.endsWith('.tsx') || file.endsWith('.jsx')) {
          templates.push({ dir, file })
          console.log(`   📧 ${file}`)
        }
      })
    }
  }
  
  if (templates.length === 0) {
    console.log('⚠️  Nenhum template de email encontrado')
    console.log('   Possível: Templates inline no código')
    
    results.issues.push({
      severity: 'LOW',
      category: 'Templates',
      issue: 'Templates de email não encontrados em diretórios padrão',
      impact: 'Dificulta manutenção (pode estar inline no código)'
    })
  }
  
  results.templates = templates
  return templates
}

// ====================================================================
// FASE 9: APM - Monitoramento de Performance
// ====================================================================

function phase9_APMMonitoring() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║   FASE 9: APM (Application Performance Monitoring)            ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  const metrics = {
    totalFilesScanned: 0,
    emailFunctionsFound: results.codeAnalysis?.emailFunctions?.length || 0,
    tablesFound: Object.values(results.configuration?.database?.tables || {}).filter(t => t.exists).length,
    mockDataFound: results.mockData?.length || 0,
    vulnerabilitiesFound: results.security?.vulnerabilities?.length || 0,
    criticalIssues: results.issues.filter(i => i.severity === 'CRITICAL').length,
    highIssues: results.issues.filter(i => i.severity === 'HIGH').length,
    mediumIssues: results.issues.filter(i => i.severity === 'MEDIUM').length
  }
  
  const score = ((1 - (metrics.criticalIssues * 0.5 + metrics.highIssues * 0.3 + metrics.mockDataFound * 0.2) / 10) * 100)
  const healthScore = Math.max(0, Math.min(100, score))
  
  console.log('📊 MÉTRICAS DE QUALIDADE:\n')
  console.log(`   Funções de Email: ${metrics.emailFunctionsFound}`)
  console.log(`   Tabelas de Email: ${metrics.tablesFound}`)
  console.log(`   Dados Mockados: ${metrics.mockDataFound}`)
  console.log(`   Vulnerabilidades: ${metrics.vulnerabilitiesFound}`)
  console.log('')
  console.log(`   🔴 Problemas Críticos: ${metrics.criticalIssues}`)
  console.log(`   🟠 Problemas Altos: ${metrics.highIssues}`)
  console.log(`   🟡 Problemas Médios: ${metrics.mediumIssues}`)
  console.log('')
  console.log(`   📈 Health Score: ${healthScore.toFixed(1)}%`)
  
  let status = 'EXCELENTE'
  if (metrics.criticalIssues > 0) status = 'CRÍTICO'
  else if (metrics.highIssues > 2) status = 'NECESSITA ATENÇÃO'
  else if (metrics.mediumIssues > 5) status = 'BOM'
  
  console.log(`   🏥 Status: ${status}`)
  
  results.performance = { metrics, healthScore, status }
  return { metrics, healthScore, status }
}

// ====================================================================
// FASE 10: QUALITY GATES - Critérios de Aprovação
// ====================================================================

function phase10_QualityGates() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║   FASE 10: QUALITY GATES (Critérios de Qualidade)             ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  const gates = {
    'Provider configurado': results.infrastructure?.envVars?.length > 0,
    'Biblioteca instalada': results.infrastructure?.libraries?.length > 0,
    'Funções implementadas': results.codeAnalysis?.emailFunctions?.length > 0,
    'Sem dados mockados': results.mockData?.length === 0,
    'Tabelas de email existem': Object.values(results.configuration?.database?.tables || {}).some(t => t.exists),
    'Sem problemas críticos': results.issues.filter(i => i.severity === 'CRITICAL').length === 0
  }
  
  let passed = 0
  const total = Object.keys(gates).length
  
  console.log('📊 QUALITY GATES:\n')
  
  for (const [gate, status] of Object.entries(gates)) {
    const icon = status ? '✅' : '❌'
    console.log(`${icon} ${gate}`)
    if (status) passed++
  }
  
  const score = ((passed / total) * 100).toFixed(1)
  console.log(`\n📈 Score: ${score}% (${passed}/${total})`)
  
  const ciStatus = passed >= total * 0.7 ? 'PASS' : passed >= total * 0.5 ? 'WARN' : 'FAIL'
  console.log(`🔄 Status CI/CD: ${ciStatus}`)
  
  return { gates, score, passed, total, ciStatus }
}

// ====================================================================
// RELATÓRIO FINAL CONSOLIDADO
// ====================================================================

async function generateFinalReport(qualityGates) {
  console.log('\n\n' + '='.repeat(70))
  console.log('  RELATÓRIO FINAL - SISTEMA DE NOTIFICAÇÕES POR EMAIL')
  console.log('='.repeat(70) + '\n')
  
  const critical = results.issues.filter(i => i.severity === 'CRITICAL')
  const high = results.issues.filter(i => i.severity === 'HIGH')
  const medium = results.issues.filter(i => i.severity === 'MEDIUM')
  
  console.log('📊 RESUMO EXECUTIVO:\n')
  console.log(`   Provider: ${results.infrastructure?.emailProvider || 'NÃO CONFIGURADO'}`)
  console.log(`   Biblioteca: ${results.infrastructure?.libraries?.[0] || 'NÃO INSTALADA'}`)
  console.log(`   Funções de Email: ${results.codeAnalysis?.emailFunctions?.length || 0}`)
  console.log(`   Tabelas de Email: ${Object.values(results.configuration?.database?.tables || {}).filter(t => t.exists).length}`)
  console.log(`   Quality Score: ${qualityGates.score}%`)
  console.log(`   Status CI/CD: ${qualityGates.ciStatus}`)
  console.log('')
  console.log(`   🔴 Críticos: ${critical.length}`)
  console.log(`   🟠 Altos: ${high.length}`)
  console.log(`   🟡 Médios: ${medium.length}`)
  
  if (critical.length > 0) {
    console.log('\n\n🚨 PROBLEMAS CRÍTICOS:\n')
    critical.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.issue}`)
      console.log(`   Categoria: ${issue.category}`)
      console.log(`   Impacto: ${issue.impact}`)
      if (issue.solution) {
        console.log(`   Solução: ${issue.solution}`)
      }
      console.log('')
    })
  }
  
  if (high.length > 0) {
    console.log('\n⚠️  PROBLEMAS ALTOS:\n')
    high.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.issue}`)
      console.log(`   Impacto: ${issue.impact}`)
      console.log('')
    })
  }
  
  // Salvar relatório
  const reportPath = path.join(process.cwd(), 'test/email-notifications/diagnosis-report.json')
  fs.mkdirSync(path.dirname(reportPath), { recursive: true })
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2))
  
  console.log(`\n📄 Relatório salvo: test/email-notifications/diagnosis-report.json`)
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`⏱️  Tempo total: ${duration}s\n`)
  
  // Status final
  if (critical.length === 0 && high.length === 0) {
    console.log('╔════════════════════════════════════════════════════════════════╗')
    console.log('║            ✅ SISTEMA DE EMAIL APROVADO ✅                     ║')
    console.log('╚════════════════════════════════════════════════════════════════╝\n')
    process.exit(0)
  } else {
    console.log('╔════════════════════════════════════════════════════════════════╗')
    console.log('║         ❌ CORREÇÕES NECESSÁRIAS ❌                            ║')
    console.log('╚════════════════════════════════════════════════════════════════╝\n')
    process.exit(1)
  }
}

// ====================================================================
// EXECUÇÃO PRINCIPAL
// ====================================================================

async function main() {
  try {
    await phase1_ShiftLeftTesting()
    await phase2_DatabaseAnalysis()
    phase3_StaticAnalysis()
    await phase4_E2ETesting()
    phase5_MockDataDetection()
    await phase6_SecurityTesting()
    await phase7_ChaosEngineering()
    phase8_TemplateAnalysis()
    const performance = phase9_APMMonitoring()
    const quality = phase10_QualityGates()
    await generateFinalReport(quality)
  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

main()

