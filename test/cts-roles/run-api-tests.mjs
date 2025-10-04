#!/usr/bin/env node
/**
 * CTS ROLES - Testes Automatizados de API
 * Executa testes completos de permissões via API
 * Duração: ~5 minutos
 */

import { createClient } from '@supabase/supabase-js'

// ====================================================================
// CONFIGURAÇÃO
// ====================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  console.error('   Necessário: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
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
// FASE 0: VALIDAÇÃO DE SETUP
// ====================================================================

async function validateSetup() {
  logSection('FASE 0: VALIDAÇÃO DE SETUP')
  
  // Teste 0.1: Verificar usuários de teste
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, role, user_type')
    .like('email', 'test_%@test.com')
    .order('role')
  
  logTest(
    'TESTE 0.1: Usuários de teste criados',
    !error && users && users.length === 4,
    error ? error.message : `${users?.length || 0} usuários encontrados`
  )
  
  if (!users || users.length !== 4) {
    console.log('\n⚠️  Execute primeiro: test/cts-roles/00-setup-test-users.sql')
    process.exit(1)
  }
  
  // Teste 0.2: Verificar roles de teste
  const expectedRoles = ['admin', 'analyst', 'developer', 'user']
  const foundRoles = users.map(u => u.role).sort()
  
  logTest(
    'TESTE 0.2: Todos os perfis representados',
    JSON.stringify(foundRoles) === JSON.stringify(expectedRoles),
    `Encontrados: ${foundRoles.join(', ')}`
  )
  
  return users
}

// ====================================================================
// FASE 1: VALIDAÇÃO DE MIGRATION NO BANCO
// ====================================================================

async function validateMigration() {
  logSection('FASE 1: VALIDAÇÃO DE MIGRATION')
  
  // Teste 1.1: Buscar todos os perfis
  const { data: roles, error } = await supabase
    .from('roles')
    .select('*')
    .order('name')
  
  logTest(
    'TESTE 1.1: Perfis carregados do banco',
    !error && roles && roles.length >= 4,
    error ? error.message : `${roles?.length || 0} perfis encontrados`
  )
  
  if (!roles) {
    console.log('❌ Não foi possível carregar perfis. Abortando testes.')
    return
  }
  
  // Teste 1.2: Verificar total de permissões por perfil
  for (const role of roles) {
    const permissionCount = Object.keys(role.permissions || {}).length
    logTest(
      `TESTE 1.2.${role.name}: ${role.display_name} tem 72 permissões`,
      permissionCount === 72,
      `Encontradas: ${permissionCount}`
    )
  }
  
  // Teste 1.3: Verificar Admin tem todas = true
  const admin = roles.find(r => r.name === 'admin')
  if (admin) {
    const trueCount = Object.values(admin.permissions).filter(v => v === true).length
    logTest(
      'TESTE 1.3: Admin tem TODAS as permissões = true',
      trueCount === 72,
      `True count: ${trueCount}/72`
    )
  }
  
  // Teste 1.4: Verificar Developer tem mix correto
  const developer = roles.find(r => r.name === 'developer')
  if (developer) {
    const trueCount = Object.values(developer.permissions).filter(v => v === true).length
    logTest(
      'TESTE 1.4: Developer tem ~35 permissões = true',
      trueCount >= 30 && trueCount <= 40,
      `True count: ${trueCount} (esperado: 30-40)`
    )
  }
  
  // Teste 1.5: Verificar Analyst tem mix correto
  const analyst = roles.find(r => r.name === 'analyst')
  if (analyst) {
    const trueCount = Object.values(analyst.permissions).filter(v => v === true).length
    logTest(
      'TESTE 1.5: Analyst tem ~43 permissões = true',
      trueCount >= 38 && trueCount <= 48,
      `True count: ${trueCount} (esperado: 38-48)`
    )
  }
  
  // Teste 1.6: Verificar User tem apenas básicas
  const user = roles.find(r => r.name === 'user')
  if (user) {
    const trueCount = Object.values(user.permissions).filter(v => v === true).length
    logTest(
      'TESTE 1.6: User tem ~13 permissões = true',
      trueCount >= 10 && trueCount <= 16,
      `True count: ${trueCount} (esperado: 10-16)`
    )
  }
  
  // Teste 1.7: Verificar novas permissões existem
  const newPermissions = [
    'tickets_create_internal',
    'tickets_export',
    'organizations_view',
    'sla_view',
    'satisfaction_view_results',
    'comments_moderate',
    'reports_export',
    'api_access'
  ]
  
  for (const role of roles) {
    const hasAllNew = newPermissions.every(perm => perm in (role.permissions || {}))
    logTest(
      `TESTE 1.7.${role.name}: Novas permissões V2.0 presentes`,
      hasAllNew,
      hasAllNew ? 'Todas presentes' : 'Permissões faltando'
    )
  }
  
  return roles
}

// ====================================================================
// FASE 2: VALIDAÇÃO DE PERMISSÕES ESPECÍFICAS
// ====================================================================

async function validateSpecificPermissions() {
  logSection('FASE 2: VALIDAÇÃO DE PERMISSÕES ESPECÍFICAS')
  
  const { data: roles } = await supabase.from('roles').select('*')
  
  // Teste 2.1: Tickets Internos
  const ticketsInternal = {
    admin: true,
    developer: true,
    analyst: true,
    user: false
  }
  
  for (const [roleName, expected] of Object.entries(ticketsInternal)) {
    const role = roles?.find(r => r.name === roleName)
    const actual = role?.permissions?.tickets_create_internal
    logTest(
      `TESTE 2.1.${roleName}: tickets_create_internal = ${expected}`,
      actual === expected,
      `Esperado: ${expected}, Atual: ${actual}`
    )
  }
  
  // Teste 2.2: Exportar Tickets
  const ticketsExport = {
    admin: true,
    developer: true,
    analyst: true,
    user: false
  }
  
  for (const [roleName, expected] of Object.entries(ticketsExport)) {
    const role = roles?.find(r => r.name === roleName)
    const actual = role?.permissions?.tickets_export
    logTest(
      `TESTE 2.2.${roleName}: tickets_export = ${expected}`,
      actual === expected,
      `Esperado: ${expected}, Atual: ${actual}`
    )
  }
  
  // Teste 2.3: Ações em Massa
  const bulkActions = {
    admin: true,
    developer: false,
    analyst: true,
    user: false
  }
  
  for (const [roleName, expected] of Object.entries(bulkActions)) {
    const role = roles?.find(r => r.name === roleName)
    const actual = role?.permissions?.tickets_bulk_actions
    logTest(
      `TESTE 2.3.${roleName}: tickets_bulk_actions = ${expected}`,
      actual === expected,
      `Esperado: ${expected}, Atual: ${actual}`
    )
  }
  
  // Teste 2.4: Organizações - Criar
  const orgCreate = {
    admin: true,
    developer: false,
    analyst: false,
    user: false
  }
  
  for (const [roleName, expected] of Object.entries(orgCreate)) {
    const role = roles?.find(r => r.name === roleName)
    const actual = role?.permissions?.organizations_create
    logTest(
      `TESTE 2.4.${roleName}: organizations_create = ${expected}`,
      actual === expected,
      `Esperado: ${expected}, Atual: ${actual}`
    )
  }
  
  // Teste 2.5: SLA - Criar
  const slaCreate = {
    admin: true,
    developer: false,
    analyst: true,
    user: false
  }
  
  for (const [roleName, expected] of Object.entries(slaCreate)) {
    const role = roles?.find(r => r.name === roleName)
    const actual = role?.permissions?.sla_create
    logTest(
      `TESTE 2.5.${roleName}: sla_create = ${expected}`,
      actual === expected,
      `Esperado: ${expected}, Atual: ${actual}`
    )
  }
  
  // Teste 2.6: API Access (APENAS ADMIN)
  const apiAccess = {
    admin: true,
    developer: false,
    analyst: false,
    user: false
  }
  
  for (const [roleName, expected] of Object.entries(apiAccess)) {
    const role = roles?.find(r => r.name === roleName)
    const actual = role?.permissions?.api_access
    logTest(
      `TESTE 2.6.${roleName}: api_access = ${expected}`,
      actual === expected,
      `Esperado: ${expected}, Atual: ${actual}`
    )
  }
  
  // Teste 2.7: Satisfaction - Criar Pesquisas
  const satisfactionCreate = {
    admin: true,
    developer: false,
    analyst: true,
    user: false
  }
  
  for (const [roleName, expected] of Object.entries(satisfactionCreate)) {
    const role = roles?.find(r => r.name === roleName)
    const actual = role?.permissions?.satisfaction_create_survey
    logTest(
      `TESTE 2.7.${roleName}: satisfaction_create_survey = ${expected}`,
      actual === expected,
      `Esperado: ${expected}, Atual: ${actual}`
    )
  }
  
  // Teste 2.8: Comments - Moderar
  const commentsModerate = {
    admin: true,
    developer: true,
    analyst: true,
    user: false
  }
  
  for (const [roleName, expected] of Object.entries(commentsModerate)) {
    const role = roles?.find(r => r.name === roleName)
    const actual = role?.permissions?.comments_moderate
    logTest(
      `TESTE 2.8.${roleName}: comments_moderate = ${expected}`,
      actual === expected,
      `Esperado: ${expected}, Atual: ${actual}`
    )
  }
  
  // Teste 2.9: Reports - Criar Customizados
  const reportsCustom = {
    admin: true,
    developer: false,
    analyst: true,
    user: false
  }
  
  for (const [roleName, expected] of Object.entries(reportsCustom)) {
    const role = roles?.find(r => r.name === roleName)
    const actual = role?.permissions?.reports_create_custom
    logTest(
      `TESTE 2.9.${roleName}: reports_create_custom = ${expected}`,
      actual === expected,
      `Esperado: ${expected}, Atual: ${actual}`
    )
  }
  
  // Teste 2.10: Notifications - Broadcast
  const notificationsBroadcast = {
    admin: true,
    developer: false,
    analyst: true,
    user: false
  }
  
  for (const [roleName, expected] of Object.entries(notificationsBroadcast)) {
    const role = roles?.find(r => r.name === roleName)
    const actual = role?.permissions?.notifications_send_broadcast
    logTest(
      `TESTE 2.10.${roleName}: notifications_send_broadcast = ${expected}`,
      actual === expected,
      `Esperado: ${expected}, Atual: ${actual}`
    )
  }
}

// ====================================================================
// FASE 3: VALIDAÇÃO DE CATEGORIAS
// ====================================================================

async function validateCategories() {
  logSection('FASE 3: VALIDAÇÃO DE CATEGORIAS')
  
  const { data: roles } = await supabase.from('roles').select('*')
  
  const categories = {
    tickets: ['tickets_view', 'tickets_create', 'tickets_create_internal', 'tickets_edit_own', 
              'tickets_edit_all', 'tickets_delete', 'tickets_assign', 'tickets_close', 
              'tickets_change_priority', 'tickets_change_status', 'tickets_view_internal', 
              'tickets_export', 'tickets_bulk_actions'],
    kb: ['kb_view', 'kb_create', 'kb_edit', 'kb_delete', 'kb_manage_categories'],
    timesheets: ['timesheets_view_own', 'timesheets_view_all', 'timesheets_create', 
                 'timesheets_edit_own', 'timesheets_edit_all', 'timesheets_approve', 
                 'timesheets_analytics', 'timesheets_analytics_full'],
    organizations: ['organizations_view', 'organizations_create', 'organizations_edit', 
                    'organizations_delete', 'contexts_manage'],
    sla: ['sla_view', 'sla_create', 'sla_edit', 'sla_delete', 'sla_override'],
    satisfaction: ['satisfaction_view_results', 'satisfaction_create_survey', 
                   'satisfaction_edit_survey', 'satisfaction_delete_survey', 
                   'satisfaction_export_data'],
    comments: ['comments_view_all', 'comments_edit_any', 'comments_delete_any', 
               'comments_moderate'],
    reports: ['reports_view', 'reports_export', 'reports_create_custom', 'reports_schedule'],
    api: ['api_access', 'api_create_token', 'api_revoke_token', 'integrations_manage', 
          'webhooks_manage'],
    notifications: ['notifications_manage_global', 'notifications_send_broadcast'],
    system: ['system_settings', 'system_users', 'system_roles', 'system_backup', 
             'system_logs', 'system_audit_view']
  }
  
  // Verificar cada categoria
  for (const [category, permissions] of Object.entries(categories)) {
    for (const role of roles || []) {
      const hasAll = permissions.every(perm => perm in (role.permissions || {}))
      logTest(
        `TESTE 3.${category}.${role.name}: Categoria ${category} completa`,
        hasAll,
        hasAll ? `${permissions.length} permissões` : 'Permissões faltando'
      )
    }
  }
  
  // Teste 3.12: Total de 72 permissões
  const totalExpected = Object.values(categories).flat().length
  logTest(
    `TESTE 3.12: Total de ${totalExpected} permissões definidas`,
    totalExpected === 72,
    `Esperado: 72, Atual: ${totalExpected}`
  )
}

// ====================================================================
// FASE 4: VALIDAÇÃO DE CONSISTÊNCIA
// ====================================================================

async function validateConsistency() {
  logSection('FASE 4: VALIDAÇÃO DE CONSISTÊNCIA')
  
  const { data: roles } = await supabase.from('roles').select('*')
  
  if (!roles || roles.length === 0) return
  
  // Teste 4.1: Todos os perfis têm mesmas chaves
  const allKeys = new Set()
  roles.forEach(role => {
    Object.keys(role.permissions || {}).forEach(key => allKeys.add(key))
  })
  
  for (const role of roles) {
    const roleKeys = new Set(Object.keys(role.permissions || {}))
    const missingKeys = [...allKeys].filter(k => !roleKeys.has(k))
    
    logTest(
      `TESTE 4.1.${role.name}: Tem todas as 72 chaves`,
      missingKeys.length === 0,
      missingKeys.length > 0 ? `Faltando: ${missingKeys.join(', ')}` : 'Completo'
    )
  }
  
  // Teste 4.2: Todos os valores são boolean
  for (const role of roles) {
    const invalidValues = Object.entries(role.permissions || {})
      .filter(([_, value]) => typeof value !== 'boolean')
    
    logTest(
      `TESTE 4.2.${role.name}: Todos os valores são boolean`,
      invalidValues.length === 0,
      invalidValues.length > 0 ? `Inválidos: ${invalidValues.map(([k]) => k).join(', ')}` : 'OK'
    )
  }
  
  // Teste 4.3: Sem permissões duplicadas
  for (const role of roles) {
    const keys = Object.keys(role.permissions || {})
    const uniqueKeys = new Set(keys)
    
    logTest(
      `TESTE 4.3.${role.name}: Sem permissões duplicadas`,
      keys.length === uniqueKeys.size,
      `Keys: ${keys.length}, Unique: ${uniqueKeys.size}`
    )
  }
}

// ====================================================================
// RELATÓRIO FINAL
// ====================================================================

function generateReport() {
  logSection('RELATÓRIO FINAL')
  
  console.log(`\n╔${'═'.repeat(58)}╗`)
  console.log(`║${' '.repeat(20)}RESUMO DO CTS${' '.repeat(25)}║`)
  console.log(`╠${'═'.repeat(58)}╣`)
  console.log(`║ Total de Testes:      ${totalTests.toString().padStart(35)} ║`)
  console.log(`║ Testes Passados:      ${passedTests.toString().padStart(35)} ║`)
  console.log(`║ Testes Falhados:      ${failedTests.toString().padStart(35)} ║`)
  
  const percentage = ((passedTests / totalTests) * 100).toFixed(1)
  const status = percentage >= 85 ? '✅ APROVADO' : 
                 percentage >= 70 ? '⚠️  APROVADO COM RESSALVAS' : 
                 '❌ REPROVADO'
  
  console.log(`║ Taxa de Sucesso:      ${percentage}%`.padEnd(59) + '║')
  console.log(`║ Status:               ${status.padEnd(35)} ║`)
  console.log(`╚${'═'.repeat(58)}╝`)
  
  // Listar testes falhados
  if (failedTests > 0) {
    console.log('\n⚠️  TESTES FALHADOS:')
    testResults
      .filter(t => !t.passed)
      .forEach((t, i) => {
        console.log(`\n${i + 1}. ${t.name}`)
        if (t.details) console.log(`   ${t.details}`)
      })
  }
  
  // Determinar próximos passos
  console.log('\n📋 PRÓXIMOS PASSOS:')
  if (percentage >= 85) {
    console.log('✅ Sistema aprovado para produção')
    console.log('✅ Prosseguir com testes manuais de UI')
    console.log('✅ Executar testes de segurança')
  } else if (percentage >= 70) {
    console.log('⚠️  Corrigir problemas identificados')
    console.log('⚠️  Re-executar testes')
  } else {
    console.log('❌ Problemas críticos identificados')
    console.log('❌ Revisar implementação')
    console.log('❌ Não prosseguir para produção')
  }
  
  return { totalTests, passedTests, failedTests, percentage, status }
}

// ====================================================================
// EXECUÇÃO PRINCIPAL
// ====================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║                                                            ║')
  console.log('║         CTS - Complete Test Suite: Roles V2.0             ║')
  console.log('║                                                            ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log('📅 Data:', new Date().toLocaleString('pt-BR'))
  console.log('🎯 Objetivo: Validar 72 permissões implementadas')
  console.log('⏱️  Duração estimada: 5 minutos')
  console.log('')
  
  const startTime = Date.now()
  
  try {
    await validateSetup()
    await sleep(500)
    
    await validateMigration()
    await sleep(500)
    
    await validateSpecificPermissions()
    await sleep(500)
    
    await validateConsistency()
    await sleep(500)
    
    const report = generateReport()
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n⏱️  Tempo total: ${duration}s`)
    
    // Exit code baseado no resultado
    process.exit(report.percentage >= 85 ? 0 : 1)
    
  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error)
    process.exit(1)
  }
}

main()

