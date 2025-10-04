#!/usr/bin/env node
/**
 * Aplica Migration V2.0 DIRETAMENTE no banco
 * Adiciona as 48 novas permissões em todos os perfis
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Permissões padrão completas (72 permissões) - ORDEM ALFABÉTICA
const defaultPermissions = {
  // API/Integrations (5)
  api_access: false,
  api_create_token: false,
  api_revoke_token: false,
  integrations_manage: false,
  webhooks_manage: false,
  
  // Comments (4)
  comments_delete_any: false,
  comments_edit_any: false,
  comments_moderate: false,
  comments_view_all: false,
  
  // Contexts/Organizations (5)
  contexts_manage: false,
  organizations_create: false,
  organizations_delete: false,
  organizations_edit: false,
  organizations_view: false,
  
  // Knowledge Base (5)
  kb_create: false,
  kb_delete: false,
  kb_edit: false,
  kb_manage_categories: false,
  kb_view: false,
  
  // Notifications (2)
  notifications_manage_global: false,
  notifications_send_broadcast: false,
  
  // Reports (4)
  reports_create_custom: false,
  reports_export: false,
  reports_schedule: false,
  reports_view: false,
  
  // Satisfaction (5)
  satisfaction_create_survey: false,
  satisfaction_delete_survey: false,
  satisfaction_edit_survey: false,
  satisfaction_export_data: false,
  satisfaction_view_results: false,
  
  // SLA (5)
  sla_create: false,
  sla_delete: false,
  sla_edit: false,
  sla_override: false,
  sla_view: false,
  
  // System (6)
  system_audit_view: false,
  system_backup: false,
  system_logs: false,
  system_roles: false,
  system_settings: false,
  system_users: false,
  
  // Tickets (13)
  tickets_assign: false,
  tickets_bulk_actions: false,
  tickets_change_priority: false,
  tickets_change_status: false,
  tickets_close: false,
  tickets_create: false,
  tickets_create_internal: false,
  tickets_delete: false,
  tickets_edit_all: false,
  tickets_edit_own: false,
  tickets_export: false,
  tickets_view: false,
  tickets_view_internal: false,
  
  // Timesheets (8)
  timesheets_analytics: false,
  timesheets_analytics_full: false,
  timesheets_approve: false,
  timesheets_create: false,
  timesheets_edit_all: false,
  timesheets_edit_own: false,
  timesheets_view_all: false,
  timesheets_view_own: false
}

// Permissões por perfil
const rolePermissions = {
  admin: Object.fromEntries(Object.keys(defaultPermissions).map(k => [k, true])), // Todas true (72)
  
  developer: {
    ...defaultPermissions,
    // Tickets
    tickets_view: true, tickets_create: true, tickets_create_internal: true,
    tickets_edit_own: true, tickets_edit_all: true, tickets_assign: true,
    tickets_close: true, tickets_change_priority: true, tickets_change_status: true,
    tickets_view_internal: true, tickets_export: true,
    // KB
    kb_view: true, kb_create: true, kb_edit: true,
    // Timesheets
    timesheets_view_own: true, timesheets_view_all: true, timesheets_create: true,
    timesheets_edit_own: true, timesheets_analytics: true,
    // Organizations
    organizations_view: true,
    // SLA
    sla_view: true,
    // Satisfaction
    satisfaction_view_results: true,
    // Comments
    comments_view_all: true, comments_moderate: true,
    // Reports
    reports_view: true, reports_export: true
  },
  
  // Alias: 'dev' usa mesmas permissões de 'developer'
  dev: null, // Será definido dinamicamente
  
  analyst: {
    ...defaultPermissions,
    tickets_view: true, tickets_create: true, tickets_create_internal: true,
    tickets_edit_own: true, tickets_edit_all: true, tickets_assign: true,
    tickets_close: true, tickets_change_priority: true, tickets_change_status: true,
    tickets_view_internal: true, tickets_export: true, tickets_bulk_actions: true,
    kb_view: true, kb_create: true, kb_edit: true, kb_manage_categories: true,
    timesheets_view_own: true, timesheets_view_all: true, timesheets_create: true,
    timesheets_edit_own: true, timesheets_approve: true, timesheets_analytics: true,
    organizations_view: true, sla_view: true, sla_create: true, sla_edit: true,
    satisfaction_view_results: true, satisfaction_create_survey: true,
    satisfaction_edit_survey: true, satisfaction_export_data: true,
    comments_view_all: true, comments_delete_any: true, comments_moderate: true,
    reports_view: true, reports_export: true, reports_create_custom: true,
    notifications_send_broadcast: true
  },
  
  user: {
    ...defaultPermissions,
    tickets_view: true, tickets_create: true, tickets_edit_own: true,
    kb_view: true, timesheets_view_own: true, timesheets_create: true,
    timesheets_edit_own: true
  }
}

async function applyMigration() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║     APLICANDO MIGRATION V2.0 NO BANCO DE DADOS        ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')
  
  // Definir 'dev' como alias de 'developer'
  rolePermissions.dev = rolePermissions.developer
  
  // Verificar total de permissões
  const totalPerms = Object.keys(defaultPermissions).length
  console.log(`📊 Total de permissões definidas: ${totalPerms}`)
  if (totalPerms !== 72) {
    console.warn(`⚠️  AVISO: Esperado 72, encontrado ${totalPerms}`)
  }
  console.log('')
  
  // Buscar todos os perfis
  const { data: roles, error } = await supabase.from('roles').select('*')
  
  if (error) {
    console.error('❌ Erro ao buscar perfis:', error.message)
    process.exit(1)
  }
  
  console.log(`📋 Encontrados ${roles.length} perfis no banco\n`)
  
  let updated = 0
  let failed = 0
  
  for (const role of roles) {
    console.log(`\n🔄 Migrando perfil: ${role.display_name} (${role.name})`)
    
    // Pegar permissões padrão para este tipo de perfil (ou user como fallback)
    let basePermissions = rolePermissions[role.name]
    if (!basePermissions) {
      console.log(`   ⚠️  Perfil customizado, usando base 'user'`)
      basePermissions = rolePermissions.user
    }
    
    // Mesclar com permissões existentes (manter o que já tem)
    const migratedPermissions = { ...basePermissions }
    
    // Manter permissões existentes que já estavam configuradas
    for (const [key, value] of Object.entries(role.permissions || {})) {
      if (key in migratedPermissions) {
        migratedPermissions[key] = value // Manter valor existente
      }
    }
    
    const oldCount = Object.keys(role.permissions || {}).length
    const newCount = Object.keys(migratedPermissions).length
    const trueCountOld = Object.values(role.permissions || {}).filter(v => v === true).length
    const trueCountNew = Object.values(migratedPermissions).filter(v => v === true).length
    
    console.log(`   Antes:  ${oldCount} permissões, ${trueCountOld} true`)
    console.log(`   Depois: ${newCount} permissões, ${trueCountNew} true`)
    
    // Atualizar no banco
    const { error: updateError } = await supabase
      .from('roles')
      .update({ permissions: migratedPermissions })
      .eq('id', role.id)
    
    if (updateError) {
      console.log(`   ❌ FALHOU: ${updateError.message}`)
      failed++
    } else {
      console.log(`   ✅ MIGRADO`)
      updated++
    }
  }
  
  console.log(`\n${'='.repeat(60)}`)
  console.log(`RESULTADO DA MIGRATION:`)
  console.log(`  ✅ Perfis atualizados: ${updated}`)
  console.log(`  ❌ Perfis falhados: ${failed}`)
  console.log(`  📊 Taxa de sucesso: ${((updated / roles.length) * 100).toFixed(1)}%`)
  console.log('='.repeat(60))
  
  if (updated === roles.length) {
    console.log('\n✅ MIGRATION V2.0 APLICADA COM SUCESSO!')
    console.log('\n📋 PRÓXIMOS PASSOS:')
    console.log('   1. Executar: node test/cts-roles/auto-setup-and-test.mjs')
    console.log('   2. Todos os testes devem passar (>85%)')
    console.log('   3. Prosseguir com testes manuais de UI')
  } else {
    console.log(`\n⚠️  ${failed} perfis falharam. Verifique os erros acima.`)
  }
}

applyMigration()

