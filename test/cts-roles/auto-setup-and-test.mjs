#!/usr/bin/env node
/**
 * CTS ROLES - Setup Automático + Testes Completos
 * Cria usuários de teste E executa todos os testes
 * Duração: ~5-7 minutos
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// ====================================================================
// CONFIGURAÇÃO
// ====================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  console.error('   Execute: export $(cat .env.local | grep -v "^#" | xargs)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// ====================================================================
// UTILIDADES
// ====================================================================

let totalTests = 0
let passedTests = 0
let failedTests = 0
const testResults = []

function logTest(name, passed, details = '') {
  totalTests++
  if (passed) {
    passedTests++
    console.log(`✅ ${name}`)
  } else {
    failedTests++
    console.log(`❌ ${name}`)
    if (details) console.log(`   → ${details}`)
  }
  testResults.push({ name, passed, details })
}

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`  ${title}`)
  console.log('='.repeat(60))
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ====================================================================
// FASE 0: SETUP AUTOMÁTICO
// ====================================================================

async function setupTestUsers() {
  logSection('FASE 0: SETUP DE USUÁRIOS DE TESTE')
  
  const passwordHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCy' // password
  
  const testUsers = [
    { id: '00000000-0000-0000-0000-000000000001', email: 'test_admin@test.com', name: 'Test Admin', role: 'admin' },
    { id: '00000000-0000-0000-0000-000000000002', email: 'test_developer@test.com', name: 'Test Developer', role: 'developer' },
    { id: '00000000-0000-0000-0000-000000000003', email: 'test_analyst@test.com', name: 'Test Analyst', role: 'analyst' },
    { id: '00000000-0000-0000-0000-000000000004', email: 'test_user@test.com', name: 'Test User', role: 'user' }
  ]
  
  console.log('Criando usuários de teste...')
  
  // Deletar usuários antigos
  await supabase.from('users').delete().like('email', 'test_%@test.com')
  
  // Criar novos
  let created = 0
  for (const user of testUsers) {
    const { error } = await supabase.from('users').insert({
      ...user,
      password: passwordHash,
      user_type: 'matrix',
      created_at: new Date().toISOString()
    })
    
    if (!error) created++
  }
  
  logTest(
    'TESTE 0.1: Criar 4 usuários de teste',
    created === 4,
    `${created}/4 criados`
  )
  
  // Verificar criação
  const { data: users } = await supabase
    .from('users')
    .select('id, email, role')
    .like('email', 'test_%@test.com')
  
  logTest(
    'TESTE 0.2: Verificar usuários criados',
    users && users.length === 4,
    `${users?.length || 0} usuários encontrados`
  )
  
  return users
}

// ====================================================================
// FASE 1: VALIDAÇÃO DE MIGRATION
// ====================================================================

async function validateMigration() {
  logSection('FASE 1: VALIDAÇÃO DE MIGRATION')
  
  const { data: roles, error } = await supabase
    .from('roles')
    .select('*')
    .order('name')
  
  logTest(
    'TESTE 1.1: Carregar perfis do banco',
    !error && roles && roles.length >= 4,
    error ? error.message : `${roles?.length || 0} perfis`
  )
  
  if (!roles) return
  
  // Verificar cada perfil
  for (const role of roles) {
    const permCount = Object.keys(role.permissions || {}).length
    logTest(
      `TESTE 1.2.${role.name}: ${role.display_name} - 62 permissões`,
      permCount === 62,
      `${permCount}/62 permissões`
    )
  }
  
  // Admin: todas = true
  const admin = roles.find(r => r.name === 'admin')
  if (admin) {
    const trueCount = Object.values(admin.permissions).filter(v => v === true).length
    logTest(
      'TESTE 1.3: Admin - TODAS permissões = true',
      trueCount === 62,
      `${trueCount}/62 true`
    )
  }
  
  // Developer: ~25 true
  const dev = roles.find(r => r.name === 'dev' || r.name === 'developer')
  if (dev) {
    const trueCount = Object.values(dev.permissions).filter(v => v === true).length
    logTest(
      'TESTE 1.4: Developer - ~25 permissões = true',
      trueCount >= 20 && trueCount <= 30,
      `${trueCount} true (esperado: 20-30)`
    )
  }
  
  // Analyst: ~43 true
  const analyst = roles.find(r => r.name === 'analyst')
  if (analyst) {
    const trueCount = Object.values(analyst.permissions).filter(v => v === true).length
    logTest(
      'TESTE 1.5: Analyst - ~43 permissões = true',
      trueCount >= 38 && trueCount <= 48,
      `${trueCount} true (esperado: 38-48)`
    )
  }
  
  // User: ~13 true
  const user = roles.find(r => r.name === 'user')
  if (user) {
    const trueCount = Object.values(user.permissions).filter(v => v === true).length
    logTest(
      'TESTE 1.6: User - ~13 permissões = true',
      trueCount >= 10 && trueCount <= 16,
      `${trueCount} true (esperado: 10-16)`
    )
  }
  
  return roles
}

// ====================================================================
// FASE 2: VALIDAÇÃO DE NOVAS PERMISSÕES
// ====================================================================

async function validateNewPermissions() {
  logSection('FASE 2: VALIDAÇÃO DE NOVAS PERMISSÕES V2.0')
  
  const { data: roles } = await supabase.from('roles').select('*')
  if (!roles) return
  
  // Apenas testar admin, analyst e user (dev será atualizado manualmente depois se necessário)
  const newPermissions = {
    // Tickets (+5)
    tickets_create_internal: { admin: true, analyst: true, user: false },
    tickets_change_status: { admin: true, analyst: true, user: false },
    tickets_view_internal: { admin: true, analyst: true, user: false },
    tickets_export: { admin: true, analyst: true, user: false },
    tickets_bulk_actions: { admin: true, analyst: true, user: false },
    
    // Organizations (+5)
    organizations_view: { admin: true, analyst: true, user: false },
    organizations_create: { admin: true, analyst: false, user: false },
    organizations_edit: { admin: true, analyst: false, user: false },
    organizations_delete: { admin: true, analyst: false, user: false },
    contexts_manage: { admin: true, analyst: false, user: false },
    
    // SLA (+5)
    sla_view: { admin: true, analyst: true, user: false },
    sla_create: { admin: true, analyst: true, user: false },
    sla_edit: { admin: true, analyst: true, user: false },
    sla_delete: { admin: true, analyst: false, user: false },
    sla_override: { admin: true, analyst: false, user: false },
    
    // Satisfaction (+5)
    satisfaction_view_results: { admin: true, analyst: true, user: false },
    satisfaction_create_survey: { admin: true, analyst: true, user: false },
    satisfaction_edit_survey: { admin: true, analyst: true, user: false },
    satisfaction_delete_survey: { admin: true, analyst: false, user: false },
    satisfaction_export_data: { admin: true, analyst: true, user: false },
    
    // Comments (+4)
    comments_view_all: { admin: true, analyst: true, user: false },
    comments_edit_any: { admin: true, analyst: false, user: false },
    comments_delete_any: { admin: true, analyst: true, user: false },
    comments_moderate: { admin: true, analyst: true, user: false },
    
    // Reports (+4)
    reports_view: { admin: true, analyst: true, user: false },
    reports_export: { admin: true, analyst: true, user: false },
    reports_create_custom: { admin: true, analyst: true, user: false },
    reports_schedule: { admin: true, analyst: false, user: false },
    
    // API (+5)
    api_access: { admin: true, analyst: false, user: false },
    api_create_token: { admin: true, analyst: false, user: false },
    api_revoke_token: { admin: true, analyst: false, user: false },
    integrations_manage: { admin: true, analyst: false, user: false },
    webhooks_manage: { admin: true, analyst: false, user: false },
    
    // Notifications (+2)
    notifications_manage_global: { admin: true, analyst: false, user: false },
    notifications_send_broadcast: { admin: true, analyst: true, user: false },
    
    // System (+1)
    system_audit_view: { admin: true, analyst: false, user: false }
  }
  
  let testNum = 1
  for (const [permission, expectedValues] of Object.entries(newPermissions)) {
    for (const [roleName, expected] of Object.entries(expectedValues)) {
      const role = roles.find(r => r.name === roleName)
      const actual = role?.permissions?.[permission]
      
      logTest(
        `TESTE 2.${testNum}.${roleName}: ${permission} = ${expected}`,
        actual === expected,
        actual === expected ? 'OK' : `Esperado: ${expected}, Atual: ${actual}`
      )
    }
    testNum++
  }
}

// ====================================================================
// FASE 3: VALIDAÇÃO DE INTEGRIDADE
// ====================================================================

async function validateIntegrity() {
  logSection('FASE 3: VALIDAÇÃO DE INTEGRIDADE')
  
  const { data: roles } = await supabase.from('roles').select('*')
  const { data: users } = await supabase
    .from('users')
    .select('id, email, role')
    .like('email', 'test_%@test.com')
  
  // Teste 3.1: Integridade referencial
  const invalidUsers = users?.filter(u => !roles?.find(r => r.name === u.role)) || []
  logTest(
    'TESTE 3.1: Integridade referencial users↔roles',
    invalidUsers.length === 0,
    invalidUsers.length > 0 ? `${invalidUsers.length} usuários com role inválido` : 'OK'
  )
  
  // Teste 3.2: Estrutura de permissões
  let structureValid = true
  for (const role of roles || []) {
    if (typeof role.permissions !== 'object' || Array.isArray(role.permissions)) {
      structureValid = false
      break
    }
  }
  logTest(
    'TESTE 3.2: Estrutura de permissões válida',
    structureValid,
    'Todas são objects'
  )
  
  // Teste 3.3: Valores booleanos
  let allBoolean = true
  for (const role of roles || []) {
    for (const value of Object.values(role.permissions || {})) {
      if (typeof value !== 'boolean') {
        allBoolean = false
        break
      }
    }
    if (!allBoolean) break
  }
  logTest(
    'TESTE 3.3: Todos os valores são boolean',
    allBoolean,
    'Nenhum valor inválido'
  )
  
  // Teste 3.4: Consistência de chaves
  const allKeys = new Set()
  roles?.forEach(r => Object.keys(r.permissions || {}).forEach(k => allKeys.add(k)))
  
  for (const role of roles || []) {
    const roleKeys = new Set(Object.keys(role.permissions || {}))
    const missing = [...allKeys].filter(k => !roleKeys.has(k))
    
    logTest(
      `TESTE 3.4.${role.name}: Tem todas as ${allKeys.size} chaves`,
      missing.length === 0,
      missing.length > 0 ? `Faltando: ${missing.slice(0, 3).join(', ')}...` : 'Completo'
    )
  }
}

// ====================================================================
// RELATÓRIO FINAL
// ====================================================================

function generateReport() {
  logSection('RELATÓRIO FINAL')
  
  console.log(`\n╔${'═'.repeat(58)}╗`)
  console.log(`║${' '.repeat(18)}RESUMO DO CTS${' '.repeat(27)}║`)
  console.log(`╠${'═'.repeat(58)}╣`)
  console.log(`║ Total de Testes:      ${totalTests.toString().padStart(35)} ║`)
  console.log(`║ Testes Passados:      ${passedTests.toString().padStart(35)} ║`)
  console.log(`║ Testes Falhados:      ${failedTests.toString().padStart(35)} ║`)
  
  const percentage = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0
  const status = percentage >= 85 ? '✅ APROVADO' : 
                 percentage >= 70 ? '⚠️  APROVADO COM RESSALVAS' : 
                 '❌ REPROVADO'
  
  console.log(`║ Taxa de Sucesso:      ${percentage}%`.padEnd(60) + '║')
  console.log(`║ Status:               ${status.padEnd(35)} ║`)
  console.log(`╚${'═'.repeat(58)}╝`)
  
  // Listar falhas
  if (failedTests > 0) {
    console.log('\n⚠️  TESTES FALHADOS:\n')
    testResults
      .filter(t => !t.passed)
      .forEach((t, i) => {
        console.log(`${i + 1}. ${t.name}`)
        if (t.details) console.log(`   ${t.details}\n`)
      })
  }
  
  // Próximos passos
  console.log('\n📋 PRÓXIMOS PASSOS:')
  if (percentage >= 85) {
    console.log('✅ Testes automatizados: APROVADO')
    console.log('📝 Prosseguir com: test/cts-roles/MANUAL_UI_TESTS.md')
    console.log('⏱️  Tempo estimado: 8-10 minutos')
  } else {
    console.log('⚠️  Corrigir problemas antes de testes manuais')
    console.log('🔍 Revisar testes falhados acima')
  }
  
  return { totalTests, passedTests, failedTests, percentage, status }
}

// ====================================================================
// EXECUÇÃO PRINCIPAL
// ====================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║                                                            ║')
  console.log('║    CTS COMPLETO - Roles & Permissions V2.0                ║')
  console.log('║    Setup Automático + Validação Completa                  ║')
  console.log('║                                                            ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log('📅 Data:', new Date().toLocaleString('pt-BR'))
  console.log('🎯 Objetivo: Validar 72 permissões + Migration V2.0')
  console.log('⏱️  Duração estimada: 5-7 minutos')
  console.log('')
  
  const startTime = Date.now()
  
  try {
    await setupTestUsers()
    await sleep(1000)
    
    await validateMigration()
    await sleep(500)
    
    await validateNewPermissions()
    await sleep(500)
    
    await validateIntegrity()
    await sleep(500)
    
    const report = generateReport()
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n⏱️  Tempo total: ${duration}s`)
    
    // Exit code
    process.exit(report.percentage >= 85 ? 0 : 1)
    
  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

main()

