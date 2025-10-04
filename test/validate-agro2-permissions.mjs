#!/usr/bin/env node
/**
 * Validação Completa do Usuário agro2@agro.com.br
 * Verifica se permissões estão sendo aplicadas corretamente
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function logSection(title) {
  console.log(`\n${'='.repeat(70)}`)
  console.log(`  ${title}`)
  console.log('='.repeat(70))
}

async function validateUser() {
  logSection('VALIDAÇÃO DO USUÁRIO: agro2@agro.com.br')
  
  // Buscar usuário
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'agro2@agro.com.br')
    .single()
  
  if (error || !user) {
    console.error('❌ Usuário não encontrado:', error?.message)
    return null
  }
  
  console.log('\n📋 DADOS DO USUÁRIO:')
  console.log('ID:', user.id)
  console.log('Nome:', user.name)
  console.log('Email:', user.email)
  console.log('Role:', user.role)
  console.log('User Type:', user.user_type)
  console.log('Context ID:', user.context_id)
  console.log('Context Name:', user.context_name)
  console.log('Context Slug:', user.context_slug)
  
  return user
}

async function validateRole(user) {
  if (!user) return null
  
  logSection('VALIDAÇÃO DO PERFIL (ROLE)')
  
  // Buscar perfil do usuário
  const { data: role, error } = await supabase
    .from('roles')
    .select('*')
    .eq('name', user.role)
    .single()
  
  if (error || !role) {
    console.error('❌ Perfil não encontrado:', error?.message)
    console.log(`⚠️  Usuário tem role="${user.role}" mas não existe na tabela roles`)
    console.log('   Usando permissões padrão do role (pode estar incorreto)')
    return null
  }
  
  console.log('\n📋 DADOS DO PERFIL:')
  console.log('Nome:', role.name)
  console.log('Nome de Exibição:', role.display_name)
  console.log('Descrição:', role.description)
  console.log('É Sistema:', role.is_system)
  console.log('Total de Permissões:', Object.keys(role.permissions || {}).length)
  
  const trueCount = Object.values(role.permissions || {}).filter(v => v === true).length
  console.log('Permissões Ativas (true):', trueCount)
  
  return role
}

async function validateTicketPermissions(user, role) {
  if (!user || !role) return
  
  logSection('VALIDAÇÃO DE PERMISSÕES - TICKETS')
  
  const permissions = role.permissions || {}
  
  console.log('\n🎫 PERMISSÕES DE TICKETS:')
  console.log('─'.repeat(70))
  
  const ticketPerms = {
    'tickets_view': 'Visualizar Tickets',
    'tickets_create': 'Criar Tickets',
    'tickets_create_internal': 'Criar Tickets Internos',
    'tickets_edit_own': 'Editar Próprios Tickets',
    'tickets_edit_all': 'Editar Todos os Tickets',
    'tickets_delete': 'Excluir Tickets',
    'tickets_assign': '⚠️  ATRIBUIR RESPONSÁVEL',
    'tickets_close': 'Fechar Tickets',
    'tickets_change_priority': 'Alterar Criticidade',
    'tickets_change_status': 'Alterar Status',
    'tickets_view_internal': 'Ver Tickets Internos',
    'tickets_export': 'Exportar Tickets',
    'tickets_bulk_actions': 'Ações em Massa'
  }
  
  let hasAssignPermission = false
  
  for (const [key, label] of Object.entries(ticketPerms)) {
    const hasPermission = permissions[key] === true
    const icon = hasPermission ? '✅' : '❌'
    console.log(`${icon} ${label}: ${hasPermission}`)
    
    if (key === 'tickets_assign') {
      hasAssignPermission = hasPermission
    }
  }
  
  console.log('\n' + '─'.repeat(70))
  
  if (hasAssignPermission) {
    console.log('⚠️  PROBLEMA IDENTIFICADO:')
    console.log('   O usuário TEM permissão "tickets_assign" = true')
    console.log('   MAS não deveria ter (perfil parece ser básico)')
  } else {
    console.log('✅ CORRETO:')
    console.log('   O usuário NÃO tem permissão para atribuir')
  }
  
  return hasAssignPermission
}

async function validateAllPermissions(role) {
  if (!role) return
  
  logSection('VALIDAÇÃO DE TODAS AS PERMISSÕES')
  
  const permissions = role.permissions || {}
  const grouped = {}
  
  // Agrupar permissões por categoria
  Object.keys(permissions).forEach(key => {
    let category = 'Outras'
    if (key.startsWith('tickets_')) category = 'Tickets'
    else if (key.startsWith('kb_')) category = 'Base de Conhecimento'
    else if (key.startsWith('timesheets_')) category = 'Apontamentos'
    else if (key.startsWith('organizations_') || key.startsWith('contexts_')) category = 'Organizações'
    else if (key.startsWith('sla_')) category = 'SLA'
    else if (key.startsWith('satisfaction_')) category = 'Satisfação'
    else if (key.startsWith('comments_')) category = 'Comentários'
    else if (key.startsWith('reports_')) category = 'Relatórios'
    else if (key.startsWith('api_') || key.startsWith('integrations_') || key.startsWith('webhooks_')) category = 'API'
    else if (key.startsWith('notifications_')) category = 'Notificações'
    else if (key.startsWith('system_')) category = 'Sistema'
    
    if (!grouped[category]) grouped[category] = []
    grouped[category].push({ key, value: permissions[key] })
  })
  
  console.log('\n📊 RESUMO POR CATEGORIA:\n')
  
  for (const [category, perms] of Object.entries(grouped).sort()) {
    const trueCount = perms.filter(p => p.value === true).length
    const totalCount = perms.length
    const percentage = ((trueCount / totalCount) * 100).toFixed(1)
    
    console.log(`${category}:`)
    console.log(`  Total: ${totalCount} | Ativas: ${trueCount} (${percentage}%)`)
    
    // Mostrar apenas as permissões ativas
    const activePerms = perms.filter(p => p.value === true)
    if (activePerms.length > 0) {
      activePerms.forEach(p => {
        console.log(`    ✅ ${p.key}`)
      })
    } else {
      console.log(`    ❌ Nenhuma permissão ativa`)
    }
    console.log('')
  }
}

async function checkUIBehavior(user, role) {
  if (!user || !role) return
  
  logSection('VALIDAÇÃO DO COMPORTAMENTO DA UI')
  
  const permissions = role.permissions || {}
  
  console.log('\n🖥️  O QUE O USUÁRIO DEVE VER NA INTERFACE:\n')
  
  // Tickets
  console.log('📄 TICKETS:')
  console.log(`  ${permissions.tickets_view ? '✅' : '❌'} Pode ver lista de tickets`)
  console.log(`  ${permissions.tickets_create ? '✅' : '❌'} Botão "Criar Ticket" visível`)
  console.log(`  ${permissions.tickets_create_internal ? '✅' : '❌'} Checkbox "Marcar como Interno" visível`)
  console.log(`  ${permissions.tickets_edit_own ? '✅' : '❌'} Pode editar próprios tickets`)
  console.log(`  ${permissions.tickets_edit_all ? '✅' : '❌'} Pode editar tickets de outros`)
  console.log(`  ${permissions.tickets_assign ? '✅' : '❌'} Dropdown "Atribuir" visível ⚠️`)
  console.log(`  ${permissions.tickets_close ? '✅' : '❌'} Botão "Fechar" visível`)
  console.log(`  ${permissions.tickets_delete ? '✅' : '❌'} Botão "Deletar" visível`)
  console.log(`  ${permissions.tickets_export ? '✅' : '❌'} Botão "Exportar" visível`)
  console.log(`  ${permissions.tickets_bulk_actions ? '✅' : '❌'} Ações em massa visível`)
  
  console.log('\n📚 BASE DE CONHECIMENTO:')
  console.log(`  ${permissions.kb_view ? '✅' : '❌'} Pode ver artigos`)
  console.log(`  ${permissions.kb_create ? '✅' : '❌'} Botão "Criar Artigo" visível`)
  console.log(`  ${permissions.kb_edit ? '✅' : '❌'} Botão "Editar" visível`)
  console.log(`  ${permissions.kb_delete ? '✅' : '❌'} Botão "Deletar" visível`)
  
  console.log('\n⏰ APONTAMENTOS:')
  console.log(`  ${permissions.timesheets_view_own ? '✅' : '❌'} Pode ver próprios`)
  console.log(`  ${permissions.timesheets_view_all ? '✅' : '❌'} Pode ver todos`)
  console.log(`  ${permissions.timesheets_create ? '✅' : '❌'} Pode criar`)
  console.log(`  ${permissions.timesheets_approve ? '✅' : '❌'} Pode aprovar`)
  
  console.log('\n🏢 ORGANIZAÇÕES:')
  console.log(`  ${permissions.organizations_view ? '✅' : '❌'} Menu "Organizações" visível`)
  console.log(`  ${permissions.organizations_create ? '✅' : '❌'} Botão "Criar" visível`)
  
  console.log('\n⚙️  SISTEMA:')
  console.log(`  ${permissions.system_settings ? '✅' : '❌'} Menu "Configurações" visível`)
  console.log(`  ${permissions.system_users ? '✅' : '❌'} "Gerenciar Usuários" visível`)
  console.log(`  ${permissions.system_roles ? '✅' : '❌'} "Gerenciar Perfis" visível`)
  
  // PROBLEMA IDENTIFICADO
  if (permissions.tickets_assign === true) {
    console.log('\n🚨 PROBLEMA IDENTIFICADO:')
    console.log('─'.repeat(70))
    console.log('⚠️  O usuário TEM a permissão "tickets_assign" = true')
    console.log('⚠️  Isso permite que ele veja o dropdown de atribuição')
    console.log('')
    console.log('CAUSA POSSÍVEL:')
    console.log('  1. Perfil do usuário está com permissão incorreta no banco')
    console.log('  2. Frontend não está verificando a permissão corretamente')
    console.log('  3. Perfil foi customizado manualmente')
    console.log('')
    console.log('SOLUÇÃO:')
    console.log('  → Verificar se o perfil no banco está correto')
    console.log('  → Corrigir permissão no modal de perfis (UI)')
    console.log('  → Fazer logout/login após correção')
  }
}

async function recommendFix(user, role) {
  if (!user || !role) return
  
  logSection('RECOMENDAÇÃO DE CORREÇÃO')
  
  console.log('\n📋 PASSOS PARA CORRIGIR:\n')
  console.log('1. Login como ADMIN')
  console.log('2. Ir em: Configurações → Gerenciar Perfis')
  console.log(`3. Editar perfil: "${role.display_name}" (${role.name})`)
  console.log('4. Na categoria "Tickets", DESMARCAR:')
  console.log('   ❌ Atribuir Tickets')
  console.log('   (Se o usuário não deve atribuir responsável)')
  console.log('5. Clicar: Salvar')
  console.log('6. Clicar: Limpar Cache')
  console.log('7. Usuário deve fazer: Logout + Login')
  console.log('\n✅ Após isso, o dropdown de atribuição deve DESAPARECER')
  
  console.log('\n📌 VALORES CORRETOS POR TIPO DE PERFIL:\n')
  console.log('USER (Básico):')
  console.log('  tickets_assign: false ❌')
  console.log('  tickets_close: false ❌')
  console.log('  tickets_delete: false ❌')
  console.log('')
  console.log('ANALYST (Gerencial):')
  console.log('  tickets_assign: true ✅')
  console.log('  tickets_close: true ✅')
  console.log('  tickets_delete: false ❌')
  console.log('')
  console.log('ADMIN (Total):')
  console.log('  tickets_assign: true ✅')
  console.log('  tickets_close: true ✅')
  console.log('  tickets_delete: true ✅')
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════╗')
  console.log('║                                                                    ║')
  console.log('║      VALIDAÇÃO COMPLETA: agro2@agro.com.br                        ║')
  console.log('║      Verificando Permissões vs Comportamento da UI                ║')
  console.log('║                                                                    ║')
  console.log('╚════════════════════════════════════════════════════════════════════╝')
  
  const user = await validateUser()
  const role = await validateRole(user)
  const hasAssign = await validateTicketPermissions(user, role)
  await validateAllPermissions(role)
  await checkUIBehavior(user, role)
  await recommendFix(user, role)
  
  console.log('\n' + '='.repeat(70))
  console.log('FIM DA VALIDAÇÃO')
  console.log('='.repeat(70))
}

main()

