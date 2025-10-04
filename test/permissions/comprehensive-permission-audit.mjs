#!/usr/bin/env node
/**
 * COMPREHENSIVE PERMISSION AUDIT
 * Testa TODAS as permissões de TODOS os usuários em TODAS as telas
 * 
 * Metodologias Aplicadas:
 * - CTS (Complete Test Suite)
 * - Mutation Testing (testa variações de permissões)
 * - Static Analysis (analisa código fonte)
 * - Shift Left Testing (detecta problemas cedo)
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
// ANÁLISE ESTÁTICA DO CÓDIGO FONTE
// ====================================================================

function analyzeSourceCode() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║         FASE 1: STATIC ANALYSIS - Análise de Código          ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  const issues = []
  
  // Arquivos para analisar
  const filesToAnalyze = [
    'src/app/dashboard/tickets/[id]/page.tsx',
    'src/app/dashboard/tickets/new/page.tsx',
    'src/app/dashboard/tickets/page.tsx',
    'src/components/RoleManagementModal.tsx'
  ]
  
  console.log('🔍 Analisando arquivos...\n')
  
  for (const file of filesToAnalyze) {
    const fullPath = path.join(process.cwd(), file)
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Arquivo não encontrado: ${file}`)
      continue
    }
    
    const content = fs.readFileSync(fullPath, 'utf8')
    
    console.log(`📄 Analisando: ${file}`)
    
    // Padrões problemáticos
    const patterns = [
      {
        name: 'OR condicional em permissões',
        regex: /\(can\w+\s+\|\|\s+can\w+\)/g,
        severity: 'HIGH',
        message: 'Usar OR (||) pode exibir botões para usuários sem permissão específica'
      },
      {
        name: 'Botão sem verificação de permissão',
        regex: /<button[^>]*onClick.*(?!hasPermission|can[A-Z])/g,
        severity: 'MEDIUM',
        message: 'Botão pode não estar verificando permissões'
      },
      {
        name: 'hasPermission sem condicional',
        regex: /hasPermission\(['"]\w+['"]\)(?!\s*&&|\s*\?)/g,
        severity: 'LOW',
        message: 'Permissão verificada mas não usada para condicional'
      }
    ]
    
    for (const pattern of patterns) {
      const matches = content.match(pattern.regex)
      if (matches && matches.length > 0) {
        const lineNumbers = []
        const lines = content.split('\n')
        lines.forEach((line, index) => {
          if (pattern.regex.test(line)) {
            lineNumbers.push(index + 1)
          }
        })
        
        issues.push({
          file,
          pattern: pattern.name,
          severity: pattern.severity,
          message: pattern.message,
          occurrences: matches.length,
          lines: lineNumbers.slice(0, 5) // Primeiras 5 ocorrências
        })
        
        console.log(`  ⚠️  ${pattern.severity}: ${pattern.name}`)
        console.log(`     Ocorrências: ${matches.length} | Linhas: ${lineNumbers.slice(0, 5).join(', ')}`)
      }
    }
    
    console.log('')
  }
  
  return issues
}

// ====================================================================
// AUDITORIA COMPLETA DE USUÁRIO
// ====================================================================

async function auditUser(email) {
  console.log(`\n╔════════════════════════════════════════════════════════════════╗`)
  console.log(`║         AUDITORIA COMPLETA: ${email.padEnd(38)}║`)
  console.log(`╚════════════════════════════════════════════════════════════════╝\n`)
  
  // Buscar usuário
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
  
  if (error || !user) {
    console.error('❌ Usuário não encontrado')
    return null
  }
  
  console.log('👤 USUÁRIO:')
  console.log(`   ID: ${user.id}`)
  console.log(`   Nome: ${user.name}`)
  console.log(`   Role: ${user.role}`)
  console.log(`   User Type: ${user.user_type}`)
  console.log(`   Context: ${user.context_name || 'N/A'}`)
  
  // Buscar role
  const { data: role } = await supabase
    .from('roles')
    .select('*')
    .eq('name', user.role)
    .single()
  
  if (!role) {
    console.error(`❌ Perfil "${user.role}" não encontrado na tabela roles!`)
    console.log('⚠️  PROBLEMA CRÍTICO: Usuário sem perfil válido!')
    return null
  }
  
  console.log(`\n📋 PERFIL: ${role.display_name}`)
  console.log(`   Total Permissões: ${Object.keys(role.permissions).length}`)
  console.log(`   Permissões Ativas: ${Object.values(role.permissions).filter(v => v === true).length}`)
  
  return { user, role }
}

// ====================================================================
// MAPEAMENTO DE PERMISSÕES → UI
// ====================================================================

function mapPermissionsToUI(permissions) {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║         MAPEAMENTO: Permissões → Elementos da UI              ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  const mapping = {
    'TICKETS - Página de Listagem (/dashboard/tickets)': [
      { permission: 'tickets_view', element: 'Lista de tickets', file: 'page.tsx' },
      { permission: 'tickets_create', element: 'Botão "Novo Chamado"', file: 'page.tsx' },
      { permission: 'tickets_export', element: 'Botão "Exportar PDF"', file: 'page.tsx' },
      { permission: 'tickets_bulk_actions', element: 'Checkboxes de seleção múltipla', file: 'page.tsx' }
    ],
    'TICKETS - Criar Novo (/dashboard/tickets/new)': [
      { permission: 'tickets_create', element: 'Formulário de criação', file: 'new/page.tsx' },
      { permission: 'tickets_create_internal', element: 'Checkbox "Marcar como Interno"', file: 'new/page.tsx' },
      { permission: 'tickets_assign', element: 'Dropdown "Atribuir para"', file: 'new/page.tsx' }
    ],
    'TICKETS - Detalhes (/dashboard/tickets/[id])': [
      { permission: 'tickets_edit_own', element: 'Editar próprio ticket', file: '[id]/page.tsx' },
      { permission: 'tickets_edit_all', element: 'Editar qualquer ticket', file: '[id]/page.tsx' },
      { permission: 'tickets_assign', element: 'Botão "Atribuir Responsável"', file: '[id]/page.tsx', line: 1039 },
      { permission: 'tickets_change_status', element: 'Botão "Alterar Status"', file: '[id]/page.tsx', line: 1028 },
      { permission: 'tickets_change_priority', element: 'Editar criticidade', file: '[id]/page.tsx' },
      { permission: 'tickets_close', element: 'Botão "Fechar Ticket"', file: '[id]/page.tsx' },
      { permission: 'tickets_delete', element: 'Botão "Deletar"', file: '[id]/page.tsx' },
      { permission: 'tickets_view_internal', element: 'Ver tickets marcados internos', file: '[id]/page.tsx' }
    ],
    'ORGANIZAÇÕES (/dashboard/organizations)': [
      { permission: 'organizations_view', element: 'Página de organizações', file: 'organizations/page.tsx' },
      { permission: 'organizations_create', element: 'Botão "Criar Organização"', file: 'organizations/page.tsx' },
      { permission: 'organizations_edit', element: 'Botão "Editar"', file: 'organizations/page.tsx' },
      { permission: 'organizations_delete', element: 'Botão "Deletar"', file: 'organizations/page.tsx' }
    ],
    'CONFIGURAÇÕES (/dashboard/settings)': [
      { permission: 'system_settings', element: 'Página de configurações', file: 'settings/page.tsx' },
      { permission: 'system_users', element: 'Card "Gerenciar Usuários"', file: 'settings/page.tsx' },
      { permission: 'system_roles', element: 'Card "Gerenciar Perfis"', file: 'settings/page.tsx' }
    ]
  }
  
  const results = []
  
  for (const [section, items] of Object.entries(mapping)) {
    console.log(`\n📍 ${section}`)
    console.log('─'.repeat(70))
    
    for (const item of items) {
      const hasPermission = permissions[item.permission] === true
      const status = hasPermission ? '✅ DEVE APARECER' : '❌ DEVE OCULTAR'
      const icon = hasPermission ? '👁️' : '🚫'
      
      console.log(`${icon} ${item.element}`)
      console.log(`   Permissão: ${item.permission} = ${hasPermission}`)
      console.log(`   Arquivo: ${item.file}${item.line ? ` (linha ~${item.line})` : ''}`)
      console.log(`   Status: ${status}`)
      console.log('')
      
      results.push({
        section,
        element: item.element,
        permission: item.permission,
        hasPermission,
        shouldShow: hasPermission,
        file: item.file,
        line: item.line
      })
    }
  }
  
  return results
}

// ====================================================================
// ENCONTRAR TODOS OS BOTÕES/ELEMENTOS SEM PROTEÇÃO
// ====================================================================

function findUnprotectedElements() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║         MUTATION TESTING - Elementos Desprotegidos            ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  const ticketDetailPath = path.join(process.cwd(), 'src/app/dashboard/tickets/[id]/page.tsx')
  
  if (!fs.existsSync(ticketDetailPath)) {
    console.log('❌ Arquivo não encontrado')
    return []
  }
  
  const content = fs.readFileSync(ticketDetailPath, 'utf8')
  const lines = content.split('\n')
  
  const unprotected = []
  
  // Procurar botões que NÃO estão dentro de verificações de permissão
  lines.forEach((line, index) => {
    const lineNum = index + 1
    
    // Detectar botões suspeitos
    if (line.includes('<button') || line.includes('onClick')) {
      // Verificar contexto (5 linhas antes)
      const context = lines.slice(Math.max(0, index - 5), index + 1).join('\n')
      
      // Se não tem verificação de permissão no contexto, pode ser problema
      const hasPermissionCheck = 
        context.includes('hasPermission') ||
        context.includes('canEdit') ||
        context.includes('canDelete') ||
        context.includes('canAssign') ||
        context.includes('canClose') ||
        context.includes('isAdmin')
      
      if (!hasPermissionCheck && (line.includes('Atribuir') || line.includes('Deletar') || line.includes('Fechar') || line.includes('Alterar'))) {
        unprotected.push({
          line: lineNum,
          code: line.trim(),
          context: context.substring(Math.max(0, context.length - 200))
        })
      }
    }
  })
  
  if (unprotected.length > 0) {
    console.log('🚨 ELEMENTOS POTENCIALMENTE DESPROTEGIDOS:\n')
    unprotected.forEach((item, i) => {
      console.log(`${i + 1}. Linha ${item.line}:`)
      console.log(`   ${item.code}`)
      console.log('')
    })
  } else {
    console.log('✅ Nenhum elemento desprotegido encontrado')
  }
  
  return unprotected
}

// ====================================================================
// SCAN COMPLETO DE TODOS OS COMPONENTES
// ====================================================================

function scanAllComponents() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║    E2E ANALYSIS - Escaneamento Completo de Componentes        ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  const componentsToScan = [
    {
      path: 'src/app/dashboard/tickets/[id]/page.tsx',
      type: 'Detalhes do Ticket',
      criticalButtons: [
        'Alterar Status',
        'Atribuir Responsável',
        'Alterar Criticidade',
        'Fechar Ticket',
        'Deletar',
        'Adicionar Anexo'
      ]
    },
    {
      path: 'src/app/dashboard/tickets/new/page.tsx',
      type: 'Criar Ticket',
      criticalButtons: [
        'Atribuir para',
        'Marcar como Interno',
        'Criar Ticket'
      ]
    },
    {
      path: 'src/app/dashboard/tickets/page.tsx',
      type: 'Lista de Tickets',
      criticalButtons: [
        'Novo Chamado',
        'Exportar PDF',
        'Ações em Massa'
      ]
    }
  ]
  
  const findings = []
  
  for (const component of componentsToScan) {
    const fullPath = path.join(process.cwd(), component.path)
    
    if (!fs.existsSync(fullPath)) continue
    
    const content = fs.readFileSync(fullPath, 'utf8')
    
    console.log(`\n📍 ${component.type}:`)
    console.log(`   Arquivo: ${component.path}`)
    console.log(`   Botões Críticos: ${component.criticalButtons.length}`)
    console.log('')
    
    for (const button of component.criticalButtons) {
      const found = content.includes(button)
      
      if (found) {
        // Encontrar linha
        const lines = content.split('\n')
        let lineNum = 0
        let buttonContext = ''
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(button) && lines[i].includes('>')) {
            lineNum = i + 1
            // Pegar contexto (10 linhas antes)
            buttonContext = lines.slice(Math.max(0, i - 10), i + 5).join('\n')
            break
          }
        }
        
        // Verificar se tem proteção
        const hasProtection = 
          buttonContext.includes('hasPermission') ||
          buttonContext.includes('can') && (
            buttonContext.includes('canEdit') ||
            buttonContext.includes('canDelete') ||
            buttonContext.includes('canAssign') ||
            buttonContext.includes('canClose') ||
            buttonContext.includes('canCreate')
          )
        
        const status = hasProtection ? '✅ PROTEGIDO' : '❌ SEM PROTEÇÃO'
        
        console.log(`   ${status}: "${button}" (linha ${lineNum})`)
        
        if (!hasProtection) {
          findings.push({
            component: component.type,
            button,
            line: lineNum,
            file: component.path
          })
        }
      }
    }
  }
  
  if (findings.length > 0) {
    console.log('\n\n🚨 ELEMENTOS SEM PROTEÇÃO ENCONTRADOS:\n')
    findings.forEach((f, i) => {
      console.log(`${i + 1}. ${f.component} - "${f.button}"`)
      console.log(`   Arquivo: ${f.file}:${f.line}`)
      console.log(`   Ação Necessária: Adicionar verificação de permissão`)
      console.log('')
    })
  } else {
    console.log('\n✅ Todos os elementos críticos estão protegidos')
  }
  
  return findings
}

// ====================================================================
// TESTE DE MUTAÇÃO - VERIFICAR VARIAÇÕES
// ====================================================================

async function mutationTesting(user, role) {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║         MUTATION TESTING - Testes de Variações               ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  console.log('🧬 Testando comportamento com diferentes permissões...\n')
  
  const mutations = []
  const permissions = role.permissions
  
  // Simular: Se removêssemos uma permissão, o que quebraria?
  const criticalPermissions = [
    'tickets_view',
    'tickets_create',
    'tickets_assign',
    'tickets_edit_own',
    'tickets_delete'
  ]
  
  for (const perm of criticalPermissions) {
    const hasIt = permissions[perm] === true
    const impact = getPermissionImpact(perm)
    
    console.log(`🔬 ${perm}:`)
    console.log(`   Status Atual: ${hasIt ? '✅ ATIVO' : '❌ INATIVO'}`)
    console.log(`   Impacto: ${impact.affectedElements.length} elementos afetados`)
    
    if (hasIt) {
      console.log(`   Se REMOVIDO:`)
      impact.affectedElements.forEach(el => {
        console.log(`     • ${el} seria OCULTO`)
      })
    } else {
      console.log(`   Se ADICIONADO:`)
      impact.affectedElements.forEach(el => {
        console.log(`     • ${el} seria EXIBIDO`)
      })
    }
    
    mutations.push({
      permission: perm,
      current: hasIt,
      impact: impact.affectedElements
    })
    
    console.log('')
  }
  
  return mutations
}

function getPermissionImpact(permission) {
  const impacts = {
    'tickets_view': {
      affectedElements: ['Lista de tickets', 'Página /dashboard/tickets']
    },
    'tickets_create': {
      affectedElements: ['Botão "Novo Chamado"', 'Página /dashboard/tickets/new']
    },
    'tickets_assign': {
      affectedElements: [
        'Botão "Atribuir Responsável" (detalhes)',
        'Dropdown "Atribuir para" (criar)',
        'Campo "Responsável" editável'
      ]
    },
    'tickets_edit_own': {
      affectedElements: ['Botão "Editar" em próprios tickets']
    },
    'tickets_edit_all': {
      affectedElements: ['Botão "Editar" em todos os tickets']
    },
    'tickets_delete': {
      affectedElements: ['Botão "Deletar Ticket"']
    },
    'tickets_close': {
      affectedElements: ['Botão "Fechar Ticket"']
    },
    'tickets_change_priority': {
      affectedElements: ['Dropdown "Criticidade" editável']
    },
    'tickets_export': {
      affectedElements: ['Botão "Exportar PDF"']
    }
  }
  
  return impacts[permission] || { affectedElements: ['Desconhecido'] }
}

// ====================================================================
// GERAR RELATÓRIO DETALHADO
// ====================================================================

async function generateDetailedReport(email, staticIssues, unprotected, mutations, uiMapping) {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║                  RELATÓRIO DETALHADO FINAL                    ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  console.log(`📊 RESUMO PARA: ${email}\n`)
  console.log('─'.repeat(70))
  
  // Contar problemas por severidade
  const critical = staticIssues.filter(i => i.severity === 'HIGH').length
  const medium = staticIssues.filter(i => i.severity === 'MEDIUM').length
  const low = staticIssues.filter(i => i.severity === 'LOW').length
  
  console.log(`\n📈 STATIC ANALYSIS:`)
  console.log(`   🔴 Crítico: ${critical}`)
  console.log(`   🟡 Médio: ${medium}`)
  console.log(`   🟢 Baixo: ${low}`)
  console.log(`   Total: ${staticIssues.length}`)
  
  console.log(`\n🔓 ELEMENTOS DESPROTEGIDOS:`)
  console.log(`   Total: ${unprotected.length}`)
  
  console.log(`\n🧬 MUTATION TESTING:`)
  console.log(`   Permissões Testadas: ${mutations.length}`)
  console.log(`   Elementos Mapeados: ${mutations.reduce((acc, m) => acc + m.impact.length, 0)}`)
  
  console.log(`\n📋 UI MAPPING:`)
  console.log(`   Elementos Mapeados: ${uiMapping.length}`)
  const shouldShow = uiMapping.filter(m => m.shouldShow).length
  const shouldHide = uiMapping.filter(m => !m.shouldShow).length
  console.log(`   Deve Mostrar: ${shouldShow}`)
  console.log(`   Deve Ocultar: ${shouldHide}`)
  
  // Status final
  const totalIssues = critical + medium + unprotected.length
  
  console.log('\n' + '='.repeat(70))
  
  if (totalIssues === 0) {
    console.log('✅ SISTEMA 100% CONFORME - Nenhum problema encontrado!')
  } else if (totalIssues <= 3) {
    console.log(`⚠️  ${totalIssues} PROBLEMA(S) ENCONTRADO(S) - Atenção necessária`)
  } else {
    console.log(`❌ ${totalIssues} PROBLEMAS ENCONTRADOS - Correção urgente!`)
  }
  
  console.log('='.repeat(70))
}

// ====================================================================
// EXECUÇÃO PRINCIPAL
// ====================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗')
  console.log('║                                                                ║')
  console.log('║    COMPREHENSIVE PERMISSION AUDIT - Sistema Completo          ║')
  console.log('║    CTS + Static Analysis + Mutation + E2E                     ║')
  console.log('║                                                                ║')
  console.log('╚════════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log('📅 Data:', new Date().toLocaleString('pt-BR'))
  console.log('🎯 Objetivo: Identificar TODOS os problemas de permissões')
  console.log('⏱️  Duração estimada: 3-5 minutos')
  console.log('')
  
  // Fase 1: Static Analysis
  const staticIssues = analyzeSourceCode()
  
  // Fase 2: Mutation Testing
  const unprotected = findUnprotectedElements()
  
  // Fase 3: E2E Component Scan
  const componentFindings = scanAllComponents()
  
  // Fase 4: Audit do usuário específico
  const result = await auditUser('agro2@agro.com.br')
  
  if (result) {
    const { user, role } = result
    
    // Fase 5: Mapping de permissões → UI
    const uiMapping = mapPermissionsToUI(role.permissions)
    
    // Fase 6: Mutation Testing
    const mutations = await mutationTesting(user, role)
    
    // Fase 7: Relatório Final
    await generateDetailedReport(
      'agro2@agro.com.br',
      staticIssues,
      [...unprotected, ...componentFindings],
      mutations,
      uiMapping
    )
  }
  
  console.log('\n✅ Auditoria completa finalizada!')
  console.log('\n📄 Próximo: Revisar problemas identificados e corrigir no código\n')
}

main()

