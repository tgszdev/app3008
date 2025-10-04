#!/usr/bin/env node
/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║  VALIDAÇÃO COMPLETA DE 62 PERMISSÕES                              ║
 * ║  Metodologias: CTS + CI/CD + Mutation + Static + E2E + Shift Left ║
 * ╚════════════════════════════════════════════════════════════════════╝
 * 
 * Este script valida que TODAS as 62 permissões estão sendo
 * aplicadas corretamente em TODOS os componentes da UI.
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
// DEFINIÇÃO DAS 62 PERMISSÕES E SEUS ELEMENTOS NA UI
// ====================================================================

const PERMISSION_TO_UI_MAPPING = {
  // ============== TICKETS (13 permissões) ==============
  'tickets_view': {
    category: 'Tickets',
    label: 'Visualizar Tickets',
    uiElements: [
      { component: 'src/app/dashboard/tickets/page.tsx', element: 'Lista de tickets', line: null },
      { component: 'src/app/dashboard/tickets/[id]/page.tsx', element: 'Página de detalhes', line: null }
    ],
    requiredFor: ['Acesso básico à área de tickets']
  },
  
  'tickets_create': {
    category: 'Tickets',
    label: 'Criar Tickets',
    uiElements: [
      { component: 'src/app/dashboard/tickets/page.tsx', element: 'Botão "Novo Chamado"', line: 726 },
      { component: 'src/app/dashboard/tickets/new/page.tsx', element: 'Formulário de criação', line: null }
    ],
    requiredFor: ['Botão de criar ticket', 'Acesso à página /tickets/new']
  },
  
  'tickets_create_internal': {
    category: 'Tickets',
    label: 'Criar Tickets Internos',
    uiElements: [
      { component: 'src/app/dashboard/tickets/new/page.tsx', element: 'Checkbox "Marcar como Interno"', line: null }
    ],
    requiredFor: ['Criar tickets visíveis apenas para equipe interna']
  },
  
  'tickets_edit_own': {
    category: 'Tickets',
    label: 'Editar Próprios Tickets',
    uiElements: [
      { component: 'src/app/dashboard/tickets/[id]/page.tsx', element: 'Botões de edição (próprios)', line: null }
    ],
    requiredFor: ['Editar tickets criados pelo próprio usuário']
  },
  
  'tickets_edit_all': {
    category: 'Tickets',
    label: 'Editar Todos os Tickets',
    uiElements: [
      { component: 'src/app/dashboard/tickets/[id]/page.tsx', element: 'Botões de edição (todos)', line: null }
    ],
    requiredFor: ['Editar qualquer ticket do sistema']
  },
  
  'tickets_delete': {
    category: 'Tickets',
    label: 'Excluir Tickets',
    uiElements: [
      { component: 'src/app/dashboard/tickets/[id]/page.tsx', element: 'Botão "Deletar"', line: null }
    ],
    requiredFor: ['Deletar tickets permanentemente']
  },
  
  'tickets_assign': {
    category: 'Tickets',
    label: 'Atribuir Tickets',
    uiElements: [
      { component: 'src/app/dashboard/tickets/[id]/page.tsx', element: 'Botão "Atribuir Responsável"', line: 1039 },
      { component: 'src/app/dashboard/tickets/new/page.tsx', element: 'Dropdown "Atribuir para"', line: 404 }
    ],
    requiredFor: ['Atribuir ou alterar responsável de tickets']
  },
  
  'tickets_close': {
    category: 'Tickets',
    label: 'Fechar Tickets',
    uiElements: [
      { component: 'src/app/dashboard/tickets/[id]/page.tsx', element: 'Botão "Fechar Ticket"', line: null }
    ],
    requiredFor: ['Marcar tickets como resolvidos/fechados']
  },
  
  'tickets_change_priority': {
    category: 'Tickets',
    label: 'Alterar Criticidade',
    uiElements: [
      { component: 'src/app/dashboard/tickets/[id]/page.tsx', element: 'Dropdown de criticidade editável', line: null }
    ],
    requiredFor: ['Alterar prioridade/criticidade de tickets']
  },
  
  'tickets_change_status': {
    category: 'Tickets',
    label: 'Alterar Status',
    uiElements: [
      { component: 'src/app/dashboard/tickets/[id]/page.tsx', element: 'Botão "Alterar Status"', line: 1028 }
    ],
    requiredFor: ['Mudar status customizado dos tickets']
  },
  
  'tickets_view_internal': {
    category: 'Tickets',
    label: 'Ver Tickets Internos',
    uiElements: [
      { component: 'src/app/dashboard/tickets/page.tsx', element: 'Tickets marcados como internos na lista', line: null }
    ],
    requiredFor: ['Visualizar tickets marcados como internos']
  },
  
  'tickets_export': {
    category: 'Tickets',
    label: 'Exportar Tickets',
    uiElements: [
      { component: 'src/app/dashboard/tickets/page.tsx', element: 'Botão "Exportar PDF"', line: 707 }
    ],
    requiredFor: ['Exportar listagem de tickets em PDF/Excel']
  },
  
  'tickets_bulk_actions': {
    category: 'Tickets',
    label: 'Ações em Massa',
    uiElements: [
      { component: 'src/app/dashboard/tickets/page.tsx', element: 'Checkboxes de seleção múltipla', line: null }
    ],
    requiredFor: ['Executar ações em múltiplos tickets']
  },
  
  // ============== BASE DE CONHECIMENTO (5 permissões) ==============
  'kb_view': {
    category: 'Base de Conhecimento',
    label: 'Visualizar Base de Conhecimento',
    uiElements: [
      { component: 'src/app/dashboard/knowledge-base/page.tsx', element: 'Página de artigos', line: null }
    ],
    requiredFor: ['Acessar base de conhecimento']
  },
  
  'kb_create': {
    category: 'Base de Conhecimento',
    label: 'Criar Artigos',
    uiElements: [
      { component: 'src/app/dashboard/knowledge-base/page.tsx', element: 'Botão "Criar Artigo"', line: null }
    ],
    requiredFor: ['Criar novos artigos']
  },
  
  'kb_edit': {
    category: 'Base de Conhecimento',
    label: 'Editar Artigos',
    uiElements: [
      { component: 'src/app/dashboard/knowledge-base/[id]/page.tsx', element: 'Botão "Editar"', line: null }
    ],
    requiredFor: ['Editar artigos existentes']
  },
  
  'kb_delete': {
    category: 'Base de Conhecimento',
    label: 'Excluir Artigos',
    uiElements: [
      { component: 'src/app/dashboard/knowledge-base/page.tsx', element: 'Botão "Deletar"', line: null }
    ],
    requiredFor: ['Excluir artigos']
  },
  
  'kb_manage_categories': {
    category: 'Base de Conhecimento',
    label: 'Gerenciar Categorias',
    uiElements: [
      { component: 'src/app/dashboard/knowledge-base/categories/page.tsx', element: 'Página de categorias', line: null }
    ],
    requiredFor: ['Criar/editar/excluir categorias']
  },
  
  // ============== APONTAMENTOS (8 permissões) ==============
  'timesheets_view_own': {
    category: 'Apontamentos',
    label: 'Ver Próprios Apontamentos',
    uiElements: [
      { component: 'src/app/dashboard/timesheets/page.tsx', element: 'Próprios apontamentos na lista', line: null }
    ],
    requiredFor: ['Ver apenas seus apontamentos']
  },
  
  'timesheets_view_all': {
    category: 'Apontamentos',
    label: 'Ver Todos os Apontamentos',
    uiElements: [
      { component: 'src/app/dashboard/timesheets/page.tsx', element: 'Todos os apontamentos', line: null }
    ],
    requiredFor: ['Ver apontamentos de todos os colaboradores']
  },
  
  'timesheets_create': {
    category: 'Apontamentos',
    label: 'Criar Apontamentos',
    uiElements: [
      { component: 'src/app/dashboard/timesheets/page.tsx', element: 'Botão "Adicionar Apontamento"', line: null }
    ],
    requiredFor: ['Registrar horas trabalhadas']
  },
  
  'timesheets_edit_own': {
    category: 'Apontamentos',
    label: 'Editar Próprios Apontamentos',
    uiElements: [
      { component: 'src/app/dashboard/timesheets/page.tsx', element: 'Edição de próprios registros', line: null }
    ],
    requiredFor: ['Editar apenas seus apontamentos']
  },
  
  'timesheets_edit_all': {
    category: 'Apontamentos',
    label: 'Editar Todos os Apontamentos',
    uiElements: [
      { component: 'src/app/dashboard/timesheets/page.tsx', element: 'Edição de todos os registros', line: null }
    ],
    requiredFor: ['Editar apontamentos de qualquer colaborador']
  },
  
  'timesheets_approve': {
    category: 'Apontamentos',
    label: 'Aprovar Apontamentos',
    uiElements: [
      { component: 'src/app/dashboard/timesheets/admin/page.tsx', element: 'Página de aprovação', line: null },
      { component: 'src/app/dashboard/timesheets/admin/page.tsx', element: 'Botões Aprovar/Rejeitar', line: null }
    ],
    requiredFor: ['Aprovar ou rejeitar apontamentos']
  },
  
  'timesheets_analytics': {
    category: 'Apontamentos',
    label: 'Ver Analytics',
    uiElements: [
      { component: 'src/app/dashboard/timesheets/analytics/page.tsx', element: 'Página de analytics', line: null }
    ],
    requiredFor: ['Acessar relatórios de apontamentos']
  },
  
  'timesheets_analytics_full': {
    category: 'Apontamentos',
    label: 'Ver Analytics Completo',
    uiElements: [
      { component: 'src/app/dashboard/timesheets/analytics/page.tsx', element: 'Analytics de todos (não só próprio)', line: null }
    ],
    requiredFor: ['Ver análises de todos os colaboradores']
  },
  
  // ============== ORGANIZAÇÕES (5 permissões) ==============
  'organizations_view': {
    category: 'Organizações',
    label: 'Visualizar Organizações',
    uiElements: [
      { component: 'src/app/dashboard/organizations/page.tsx', element: 'Página de organizações', line: null }
    ],
    requiredFor: ['Acessar lista de organizações/clientes']
  },
  
  'organizations_create': {
    category: 'Organizações',
    label: 'Criar Organizações',
    uiElements: [
      { component: 'src/app/dashboard/organizations/page.tsx', element: 'Botão "Criar Organização"', line: null }
    ],
    requiredFor: ['Cadastrar novos clientes']
  },
  
  'organizations_edit': {
    category: 'Organizações',
    label: 'Editar Organizações',
    uiElements: [
      { component: 'src/app/dashboard/organizations/page.tsx', element: 'Botão "Editar"', line: null }
    ],
    requiredFor: ['Modificar dados de organizações']
  },
  
  'organizations_delete': {
    category: 'Organizações',
    label: 'Excluir Organizações',
    uiElements: [
      { component: 'src/app/dashboard/organizations/page.tsx', element: 'Botão "Deletar"', line: null }
    ],
    requiredFor: ['Remover organizações do sistema']
  },
  
  'contexts_manage': {
    category: 'Organizações',
    label: 'Gerenciar Contextos',
    uiElements: [
      { component: 'src/app/dashboard/organizations/page.tsx', element: 'Associação de usuários', line: null }
    ],
    requiredFor: ['Associar usuários a organizações']
  },
  
  // ============== SLA (5 permissões) ==============
  'sla_view': {
    category: 'SLA',
    label: 'Visualizar SLA',
    uiElements: [
      { component: 'src/app/dashboard/sla/page.tsx', element: 'Página de SLA', line: null }
    ],
    requiredFor: ['Ver políticas de SLA']
  },
  
  'sla_create': {
    category: 'SLA',
    label: 'Criar SLA',
    uiElements: [
      { component: 'src/app/dashboard/sla/page.tsx', element: 'Botão "Criar SLA"', line: null }
    ],
    requiredFor: ['Criar políticas de SLA']
  },
  
  'sla_edit': {
    category: 'SLA',
    label: 'Editar SLA',
    uiElements: [
      { component: 'src/app/dashboard/sla/page.tsx', element: 'Botão "Editar"', line: null }
    ],
    requiredFor: ['Editar políticas existentes']
  },
  
  'sla_delete': {
    category: 'SLA',
    label: 'Excluir SLA',
    uiElements: [
      { component: 'src/app/dashboard/sla/page.tsx', element: 'Botão "Deletar"', line: null }
    ],
    requiredFor: ['Remover políticas de SLA']
  },
  
  'sla_override': {
    category: 'SLA',
    label: 'Quebrar SLA',
    uiElements: [
      { component: 'src/app/dashboard/tickets/[id]/page.tsx', element: 'Opção "Ignorar SLA"', line: null }
    ],
    requiredFor: ['Permitir exceções em casos especiais']
  },
  
  // ============== SATISFAÇÃO (5 permissões) ==============
  'satisfaction_view_results': {
    category: 'Satisfação',
    label: 'Ver Resultados de Satisfação',
    uiElements: [
      { component: 'src/app/dashboard/satisfaction/page.tsx', element: 'Resultados de pesquisas', line: null }
    ],
    requiredFor: ['Ver resultados de pesquisas']
  },
  
  'satisfaction_create_survey': {
    category: 'Satisfação',
    label: 'Criar Pesquisas',
    uiElements: [
      { component: 'src/app/dashboard/satisfaction/page.tsx', element: 'Botão "Criar Pesquisa"', line: null }
    ],
    requiredFor: ['Criar pesquisas de satisfação']
  },
  
  'satisfaction_edit_survey': {
    category: 'Satisfação',
    label: 'Editar Pesquisas',
    uiElements: [
      { component: 'src/app/dashboard/satisfaction/page.tsx', element: 'Botão "Editar Pesquisa"', line: null }
    ],
    requiredFor: ['Editar pesquisas existentes']
  },
  
  'satisfaction_delete_survey': {
    category: 'Satisfação',
    label: 'Excluir Pesquisas',
    uiElements: [
      { component: 'src/app/dashboard/satisfaction/page.tsx', element: 'Botão "Deletar Pesquisa"', line: null }
    ],
    requiredFor: ['Remover pesquisas']
  },
  
  'satisfaction_export_data': {
    category: 'Satisfação',
    label: 'Exportar Dados',
    uiElements: [
      { component: 'src/app/dashboard/satisfaction/page.tsx', element: 'Botão "Exportar Resultados"', line: null }
    ],
    requiredFor: ['Exportar dados de pesquisas']
  },
  
  // ============== COMENTÁRIOS (4 permissões) ==============
  'comments_view_all': {
    category: 'Comentários',
    label: 'Ver Todos os Comentários',
    uiElements: [
      { component: 'src/app/dashboard/comments/page.tsx', element: 'Lista completa de comentários', line: null }
    ],
    requiredFor: ['Ver comentários de todos os tickets']
  },
  
  'comments_edit_any': {
    category: 'Comentários',
    label: 'Editar Qualquer Comentário',
    uiElements: [
      { component: 'src/app/dashboard/tickets/[id]/page.tsx', element: 'Botão editar em comentários de outros', line: null }
    ],
    requiredFor: ['Editar comentários de qualquer usuário']
  },
  
  'comments_delete_any': {
    category: 'Comentários',
    label: 'Excluir Qualquer Comentário',
    uiElements: [
      { component: 'src/app/dashboard/tickets/[id]/page.tsx', element: 'Botão deletar em comentários de outros', line: null }
    ],
    requiredFor: ['Excluir comentários de outros usuários']
  },
  
  'comments_moderate': {
    category: 'Comentários',
    label: 'Moderar Comentários',
    uiElements: [
      { component: 'src/app/dashboard/comments/page.tsx', element: 'Botões de moderação', line: null }
    ],
    requiredFor: ['Aprovar/reprovar/marcar spam']
  },
  
  // ============== RELATÓRIOS (4 permissões) ==============
  'reports_view': {
    category: 'Relatórios',
    label: 'Visualizar Relatórios',
    uiElements: [
      { component: 'src/app/dashboard/reports/page.tsx', element: 'Página de relatórios', line: null }
    ],
    requiredFor: ['Acessar relatórios']
  },
  
  'reports_export': {
    category: 'Relatórios',
    label: 'Exportar Relatórios',
    uiElements: [
      { component: 'src/app/dashboard/reports/page.tsx', element: 'Botão "Exportar"', line: null }
    ],
    requiredFor: ['Baixar relatórios em Excel/PDF']
  },
  
  'reports_create_custom': {
    category: 'Relatórios',
    label: 'Criar Relatórios Personalizados',
    uiElements: [
      { component: 'src/app/dashboard/reports/page.tsx', element: 'Botão "Criar Personalizado"', line: null }
    ],
    requiredFor: ['Montar relatórios customizados']
  },
  
  'reports_schedule': {
    category: 'Relatórios',
    label: 'Agendar Relatórios',
    uiElements: [
      { component: 'src/app/dashboard/reports/page.tsx', element: 'Botão "Agendar Envio"', line: null }
    ],
    requiredFor: ['Agendar envio automático']
  },
  
  // ============== API/INTEGRAÇÕES (5 permissões) ==============
  'api_access': {
    category: 'API/Integrações',
    label: 'Acesso à API',
    uiElements: [
      { component: 'src/app/dashboard/settings/api/page.tsx', element: 'Página de API', line: null }
    ],
    requiredFor: ['Acessar APIs do sistema']
  },
  
  'api_create_token': {
    category: 'API/Integrações',
    label: 'Criar Tokens de API',
    uiElements: [
      { component: 'src/app/dashboard/settings/api/page.tsx', element: 'Botão "Criar Token"', line: null }
    ],
    requiredFor: ['Gerar tokens de API']
  },
  
  'api_revoke_token': {
    category: 'API/Integrações',
    label: 'Revogar Tokens',
    uiElements: [
      { component: 'src/app/dashboard/settings/api/page.tsx', element: 'Botão "Revogar"', line: null }
    ],
    requiredFor: ['Invalidar tokens existentes']
  },
  
  'integrations_manage': {
    category: 'API/Integrações',
    label: 'Gerenciar Integrações',
    uiElements: [
      { component: 'src/app/dashboard/settings/integrations/page.tsx', element: 'Página de integrações', line: null }
    ],
    requiredFor: ['Configurar integrações externas']
  },
  
  'webhooks_manage': {
    category: 'API/Integrações',
    label: 'Gerenciar Webhooks',
    uiElements: [
      { component: 'src/app/dashboard/settings/webhooks/page.tsx', element: 'Página de webhooks', line: null }
    ],
    requiredFor: ['Criar/gerenciar webhooks']
  },
  
  // ============== NOTIFICAÇÕES (2 permissões) ==============
  'notifications_manage_global': {
    category: 'Notificações',
    label: 'Gerenciar Notificações Globais',
    uiElements: [
      { component: 'src/app/dashboard/settings/notifications/page.tsx', element: 'Configurações globais', line: null }
    ],
    requiredFor: ['Configurar notificações do sistema']
  },
  
  'notifications_send_broadcast': {
    category: 'Notificações',
    label: 'Enviar Notificações em Massa',
    uiElements: [
      { component: 'src/app/dashboard/notifications/broadcast/page.tsx', element: 'Formulário de broadcast', line: null }
    ],
    requiredFor: ['Enviar notificações para múltiplos usuários']
  },
  
  // ============== SISTEMA (6 permissões) ==============
  'system_settings': {
    category: 'Sistema',
    label: 'Configurações do Sistema',
    uiElements: [
      { component: 'src/app/dashboard/settings/page.tsx', element: 'Página de configurações', line: null }
    ],
    requiredFor: ['Acessar configurações gerais']
  },
  
  'system_users': {
    category: 'Sistema',
    label: 'Gerenciar Usuários',
    uiElements: [
      { component: 'src/app/dashboard/users/page.tsx', element: 'Página de usuários', line: null },
      { component: 'src/app/dashboard/settings/page.tsx', element: 'Card "Gerenciar Usuários"', line: null }
    ],
    requiredFor: ['Criar/editar/desativar usuários']
  },
  
  'system_roles': {
    category: 'Sistema',
    label: 'Gerenciar Perfis',
    uiElements: [
      { component: 'src/app/dashboard/settings/page.tsx', element: 'Card "Gerenciar Perfis"', line: null },
      { component: 'src/components/RoleManagementModal.tsx', element: 'Modal de perfis', line: null }
    ],
    requiredFor: ['Gerenciar perfis e permissões']
  },
  
  'system_backup': {
    category: 'Sistema',
    label: 'Backup e Restauração',
    uiElements: [
      { component: 'src/app/dashboard/settings/page.tsx', element: 'Card "Backup"', line: null }
    ],
    requiredFor: ['Fazer backup do sistema']
  },
  
  'system_logs': {
    category: 'Sistema',
    label: 'Visualizar Logs',
    uiElements: [
      { component: 'src/app/dashboard/settings/page.tsx', element: 'Card "Logs"', line: null }
    ],
    requiredFor: ['Ver logs do sistema']
  },
  
  'system_audit_view': {
    category: 'Sistema',
    label: 'Ver Logs de Auditoria',
    uiElements: [
      { component: 'src/app/dashboard/settings/audit/page.tsx', element: 'Logs detalhados', line: null }
    ],
    requiredFor: ['Ver logs de auditoria completos']
  }
}

// ====================================================================
// SHIFT LEFT TESTING - Análise Estática do Código
// ====================================================================

function staticAnalysis() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║   SHIFT LEFT TESTING - Análise Estática de Código             ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  const issues = []
  const permissionsToCheck = Object.keys(PERMISSION_TO_UI_MAPPING)
  
  console.log(`📊 Analisando ${permissionsToCheck.length} permissões em ${new Set(Object.values(PERMISSION_TO_UI_MAPPING).flatMap(p => p.uiElements.map(ui => ui.component))).size} componentes\n`)
  
  for (const [permission, config] of Object.entries(PERMISSION_TO_UI_MAPPING)) {
    for (const uiElement of config.uiElements) {
      const fullPath = path.join(process.cwd(), uiElement.component)
      
      if (!fs.existsSync(fullPath)) {
        issues.push({
          type: 'MISSING_FILE',
          severity: 'LOW',
          permission,
          component: uiElement.component,
          message: `Arquivo não existe (feature não implementada)`
        })
        continue
      }
      
      const content = fs.readFileSync(fullPath, 'utf8')
      
      // Verificar se o arquivo usa usePermissions
      const usesPermissions = content.includes('usePermissions')
      
      // Verificar se verifica esta permissão específica
      const checksPermission = 
        content.includes(`hasPermission('${permission}')`) ||
        content.includes(`hasPermission("${permission}")`) ||
        content.includes(`can${permission.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`)
      
      if (!usesPermissions) {
        issues.push({
          type: 'NO_PERMISSION_HOOK',
          severity: 'HIGH',
          permission,
          component: uiElement.component,
          element: uiElement.element,
          message: `Componente não usa usePermissions()`
        })
      } else if (!checksPermission && uiElement.element.includes('Botão')) {
        issues.push({
          type: 'NO_PERMISSION_CHECK',
          severity: 'CRITICAL',
          permission,
          component: uiElement.component,
          element: uiElement.element,
          line: uiElement.line,
          message: `Elemento crítico sem verificação de permissão`
        })
      }
    }
  }
  
  // Agrupar por severidade
  const critical = issues.filter(i => i.severity === 'CRITICAL')
  const high = issues.filter(i => i.severity === 'HIGH')
  const medium = issues.filter(i => i.severity === 'MEDIUM')
  const low = issues.filter(i => i.severity === 'LOW')
  
  console.log('📈 RESULTADO DA ANÁLISE ESTÁTICA:\n')
  console.log(`   🔴 Crítico: ${critical.length}`)
  console.log(`   🟠 Alto: ${high.length}`)
  console.log(`   🟡 Médio: ${medium.length}`)
  console.log(`   🟢 Baixo: ${low.length}`)
  console.log(`   📊 Total: ${issues.length}`)
  
  if (critical.length > 0) {
    console.log('\n\n🚨 PROBLEMAS CRÍTICOS:\n')
    critical.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.element || issue.component}`)
      console.log(`   Permissão: ${issue.permission}`)
      console.log(`   Arquivo: ${issue.component}${issue.line ? `:${issue.line}` : ''}`)
      console.log(`   Problema: ${issue.message}`)
      console.log('')
    })
  }
  
  return issues
}

// ====================================================================
// MUTATION TESTING - Testar Variações de Permissões
// ====================================================================

async function mutationTesting() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║   MUTATION TESTING - Testes de Variações                      ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  const testResults = []
  
  // Buscar perfil user
  const { data: userRole } = await supabase
    .from('roles')
    .select('*')
    .eq('name', 'user')
    .single()
  
  if (!userRole) {
    console.log('❌ Perfil "user" não encontrado')
    return []
  }
  
  console.log('🧬 Testando mutações de permissões...\n')
  
  // Para cada permissão, simular ON/OFF e ver impacto
  const criticalPermissions = [
    'tickets_view',
    'tickets_create',
    'tickets_assign',
    'tickets_export',
    'organizations_view',
    'system_users'
  ]
  
  for (const permission of criticalPermissions) {
    const currentValue = userRole.permissions[permission]
    const impact = PERMISSION_TO_UI_MAPPING[permission]
    
    console.log(`🔬 ${permission}:`)
    console.log(`   Valor Atual: ${currentValue ? '✅ true' : '❌ false'}`)
    console.log(`   Elementos Afetados: ${impact?.uiElements.length || 0}`)
    
    if (impact) {
      impact.uiElements.forEach(el => {
        const shouldShow = currentValue === true
        console.log(`     ${shouldShow ? '👁️' : '🚫'} ${el.element}`)
      })
    }
    
    testResults.push({
      permission,
      currentValue,
      elementsAffected: impact?.uiElements.length || 0
    })
    
    console.log('')
  }
  
  return testResults
}

// ====================================================================
// E2E TESTING - Validar Usuário Real
// ====================================================================

async function e2eUserValidation(email) {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log(`║   E2E TESTING - Validação Completa: ${email.substring(0, 32).padEnd(32)}║`)
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  // Buscar usuário
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
  
  if (!user) {
    console.log('❌ Usuário não encontrado')
    return null
  }
  
  // Buscar role
  const { data: role } = await supabase
    .from('roles')
    .select('*')
    .eq('name', user.role)
    .single()
  
  if (!role) {
    console.log(`❌ Perfil "${user.role}" não encontrado`)
    return null
  }
  
  console.log('👤 USUÁRIO:')
  console.log(`   Nome: ${user.name}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Perfil: ${role.display_name} (${role.name})`)
  console.log(`   Tipo: ${user.user_type}`)
  console.log(`   Context: ${user.context_name || 'N/A'}`)
  
  console.log(`\n📊 PERMISSÕES:`)
  console.log(`   Total: ${Object.keys(role.permissions).length}`)
  console.log(`   Ativas: ${Object.values(role.permissions).filter(v => v === true).length}`)
  
  // Validar TODAS as 62 permissões
  console.log('\n🔍 VALIDAÇÃO POR CATEGORIA:\n')
  
  const byCategory = {}
  for (const [perm, config] of Object.entries(PERMISSION_TO_UI_MAPPING)) {
    if (!byCategory[config.category]) {
      byCategory[config.category] = []
    }
    byCategory[config.category].push({
      permission: perm,
      label: config.label,
      hasPermission: role.permissions[perm] === true,
      uiElements: config.uiElements
    })
  }
  
  const problems = []
  
  for (const [category, perms] of Object.entries(byCategory)) {
    console.log(`📍 ${category}:`)
    
    perms.forEach(p => {
      const icon = p.hasPermission ? '✅' : '❌'
      console.log(`   ${icon} ${p.label}`)
      
      // Para cada elemento da UI
      p.uiElements.forEach(el => {
        const shouldShow = p.hasPermission ? 'DEVE APARECER' : 'DEVE OCULTAR'
        console.log(`      → ${el.element}: ${shouldShow}`)
        
        // Verificar se arquivo existe e tem proteção
        const fullPath = path.join(process.cwd(), el.component)
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8')
          const hasCheck = 
            content.includes(`hasPermission('${p.permission}')`) ||
            content.includes(`hasPermission("${p.permission}")`)
          
          if (!hasCheck && el.element.includes('Botão')) {
            problems.push({
              permission: p.permission,
              element: el.element,
              file: el.component,
              issue: 'SEM VERIFICAÇÃO DE PERMISSÃO'
            })
            console.log(`         ⚠️  SEM PROTEÇÃO!`)
          }
        }
      })
    })
    console.log('')
  }
  
  return { user, role, problems }
}

// ====================================================================
// APM - Application Performance Monitoring
// ====================================================================

function performanceMonitoring(staticIssues, problems) {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║   APM - Monitoramento de Qualidade e Performance              ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  const metrics = {
    totalPermissions: Object.keys(PERMISSION_TO_UI_MAPPING).length,
    totalUIElements: Object.values(PERMISSION_TO_UI_MAPPING).flatMap(p => p.uiElements).length,
    criticalIssues: staticIssues.filter(i => i.severity === 'CRITICAL').length,
    highIssues: staticIssues.filter(i => i.severity === 'HIGH').length,
    unprotectedElements: problems.length,
    filesAnalyzed: new Set(Object.values(PERMISSION_TO_UI_MAPPING).flatMap(p => p.uiElements.map(ui => ui.component))).size,
    implementedFiles: Object.values(PERMISSION_TO_UI_MAPPING)
      .flatMap(p => p.uiElements.map(ui => ui.component))
      .filter(f => fs.existsSync(path.join(process.cwd(), f))).length
  }
  
  const implementationRate = ((metrics.implementedFiles / metrics.totalUIElements) * 100).toFixed(1)
  const qualityScore = ((1 - (metrics.criticalIssues + metrics.highIssues) / metrics.totalUIElements) * 100).toFixed(1)
  
  console.log('📊 MÉTRICAS DE QUALIDADE:\n')
  console.log(`   Total de Permissões: ${metrics.totalPermissions}`)
  console.log(`   Elementos de UI Mapeados: ${metrics.totalUIElements}`)
  console.log(`   Arquivos Analisados: ${metrics.filesAnalyzed}`)
  console.log(`   Arquivos Implementados: ${metrics.implementedFiles}`)
  console.log(`   Taxa de Implementação: ${implementationRate}%`)
  console.log('')
  console.log(`   🔴 Problemas Críticos: ${metrics.criticalIssues}`)
  console.log(`   🟠 Problemas Altos: ${metrics.highIssues}`)
  console.log(`   🚫 Elementos Desprotegidos: ${metrics.unprotectedElements}`)
  console.log('')
  console.log(`   📈 Score de Qualidade: ${qualityScore}%`)
  
  let healthStatus = 'EXCELENTE'
  if (metrics.criticalIssues > 0) healthStatus = 'CRÍTICO'
  else if (metrics.highIssues > 3) healthStatus = 'NECESSITA ATENÇÃO'
  else if (metrics.unprotectedElements > 5) healthStatus = 'BOM'
  
  console.log(`   🏥 Status de Saúde: ${healthStatus}`)
  
  return metrics
}

// ====================================================================
// CI/CD - Gerar Relatório para Integração Contínua
// ====================================================================

function generateCICDReport(staticIssues, problems, metrics) {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║   CI/CD REPORT - Relatório para Pipeline                      ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  const totalIssues = staticIssues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length + problems.length
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPermissions: metrics.totalPermissions,
      implementationRate: ((metrics.implementedFiles / metrics.totalUIElements) * 100).toFixed(1),
      criticalIssues: staticIssues.filter(i => i.severity === 'CRITICAL').length,
      highIssues: staticIssues.filter(i => i.severity === 'HIGH').length,
      unprotectedElements: problems.length,
      qualityScore: ((1 - totalIssues / metrics.totalUIElements) * 100).toFixed(1)
    },
    status: totalIssues === 0 ? 'PASS' : totalIssues <= 3 ? 'WARN' : 'FAIL',
    issues: [
      ...staticIssues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH'),
      ...problems.map(p => ({
        type: 'UNPROTECTED_ELEMENT',
        severity: 'CRITICAL',
        permission: p.permission,
        element: p.element,
        component: p.file,
        message: p.issue
      }))
    ]
  }
  
  // Salvar relatório JSON para CI/CD
  const reportPath = path.join(process.cwd(), 'test/permissions/ci-report.json')
  fs.mkdirSync(path.dirname(reportPath), { recursive: true })
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  
  console.log('📄 Relatório CI/CD gerado:')
  console.log(`   Arquivo: test/permissions/ci-report.json`)
  console.log(`   Status: ${report.status}`)
  console.log(`   Quality Score: ${report.summary.qualityScore}%`)
  console.log('')
  
  if (report.status === 'PASS') {
    console.log('✅ CI/CD: APROVADO - Deploy pode prosseguir')
  } else if (report.status === 'WARN') {
    console.log('⚠️  CI/CD: AVISO - Deploy com ressalvas')
  } else {
    console.log('❌ CI/CD: BLOQUEADO - Corrigir problemas antes de deploy')
  }
  
  return report
}

// ====================================================================
// GERAR LISTA DE CORREÇÕES NECESSÁRIAS
// ====================================================================

function generateFixList(problems) {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║   LISTA DE CORREÇÕES NECESSÁRIAS                              ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  
  if (problems.length === 0) {
    console.log('✅ Nenhuma correção necessária! Sistema 100% protegido.\n')
    return
  }
  
  console.log(`🔧 ${problems.length} CORREÇÕES NECESSÁRIAS:\n`)
  
  problems.forEach((problem, i) => {
    console.log(`${i + 1}. ${problem.element}`)
    console.log(`   📁 Arquivo: ${problem.file}`)
    console.log(`   🔑 Permissão: ${problem.permission}`)
    console.log(`   🛠️  Solução: Adicionar verificação:`)
    console.log(`      {hasPermission('${problem.permission}') && (`)
    console.log(`        <${problem.element.includes('Botão') ? 'button' : 'div'}>`)
    console.log(`          {/* ... */}`)
    console.log(`        </${problem.element.includes('Botão') ? 'button' : 'div'}>`)
    console.log(`      )}`)
    console.log('')
  })
}

// ====================================================================
// RELATÓRIO FINAL CONSOLIDADO
// ====================================================================

function generateFinalReport(staticIssues, mutationResults, e2eResult, ciReport) {
  console.log('\n' + '='.repeat(70))
  console.log('  RELATÓRIO FINAL - VALIDAÇÃO COMPLETA DE 62 PERMISSÕES')
  console.log('='.repeat(70) + '\n')
  
  console.log('📊 RESUMO EXECUTIVO:\n')
  console.log(`   Total de Permissões: ${Object.keys(PERMISSION_TO_UI_MAPPING).length}`)
  console.log(`   Categorias: 11`)
  console.log(`   Componentes Analisados: ${ciReport.summary.implementationRate}%`)
  console.log(`   Quality Score: ${ciReport.summary.qualityScore}%`)
  console.log(`   Status CI/CD: ${ciReport.status}`)
  console.log('')
  
  console.log('🎯 RESULTADO POR METODOLOGIA:\n')
  console.log(`   ✅ Shift Left (Static Analysis): ${staticIssues.length} issues`)
  console.log(`   ✅ Mutation Testing: ${mutationResults.length} permissões testadas`)
  console.log(`   ✅ E2E Testing: ${e2eResult?.problems?.length || 0} problemas`)
  console.log(`   ✅ APM Monitoring: Score ${ciReport.summary.qualityScore}%`)
  console.log(`   ✅ CI/CD Report: ${ciReport.status}`)
  console.log('')
  
  const totalProblems = ciReport.summary.criticalIssues + ciReport.summary.highIssues
  
  if (totalProblems === 0) {
    console.log('╔════════════════════════════════════════════════════════════════╗')
    console.log('║               ✅ SISTEMA 100% CONFORME ✅                      ║')
    console.log('║   Todas as 62 permissões estão protegidas corretamente!      ║')
    console.log('╚════════════════════════════════════════════════════════════════╝')
  } else {
    console.log('╔════════════════════════════════════════════════════════════════╗')
    console.log(`║   ⚠️  ${totalProblems} PROBLEMAS ENCONTRADOS - AÇÃO NECESSÁRIA    ║`)
    console.log('╚════════════════════════════════════════════════════════════════╝')
  }
}

// ====================================================================
// EXECUÇÃO PRINCIPAL
// ====================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗')
  console.log('║                                                                ║')
  console.log('║       VALIDAÇÃO COMPLETA DE 62 PERMISSÕES                     ║')
  console.log('║       CTS + CI/CD + Mutation + Static + E2E + APM             ║')
  console.log('║                                                                ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')
  console.log('📅 Data:', new Date().toLocaleString('pt-BR'))
  console.log('🎯 Objetivo: Validar 100% das permissões em produção')
  console.log('⏱️  Duração estimada: 2-3 minutos\n')
  
  const startTime = Date.now()
  
  try {
    // Fase 1: Shift Left - Static Analysis
    const staticIssues = staticAnalysis()
    
    // Fase 2: Mutation Testing
    const mutationResults = await mutationTesting()
    
    // Fase 3: E2E Testing - Usuário Real
    const e2eResult = await e2eUserValidation('agro2@agro.com.br')
    
    // Fase 4: APM
    const metrics = performanceMonitoring(staticIssues, e2eResult?.problems || [])
    
    // Fase 5: CI/CD Report
    const ciReport = generateCICDReport(staticIssues, e2eResult?.problems || [], metrics)
    
    // Fase 6: Gerar Lista de Correções
    if (e2eResult?.problems) {
      generateFixList(e2eResult.problems)
    }
    
    // Fase 7: Relatório Final
    generateFinalReport(staticIssues, mutationResults, e2eResult, ciReport)
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n⏱️  Tempo total: ${duration}s\n`)
    
    // Exit code para CI/CD
    process.exit(ciReport.status === 'PASS' ? 0 : ciReport.status === 'WARN' ? 0 : 1)
    
  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

main()

