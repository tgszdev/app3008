import { supabaseAdmin } from '@/lib/supabase'

export interface WorkflowRule {
  id: string
  name: string
  description?: string | null
  is_active: boolean
  priority: number
  conditions: any
  actions: any
}

export interface TicketData {
  id: string
  status: string
  priority: string
  category?: string
  category_id?: string
  assigned_to?: string | null
  created_by: string
  created_at: string
  updated_at: string
  created_by_user?: {
    id: string
    name: string
    email: string
    role: string
  }
  assigned_to_user?: {
    id: string
    name: string
    email: string
  }
  category_info?: {
    id: string
    name: string
    slug: string
  }
}

export interface WorkflowExecutionResult {
  success: boolean
  executedRules: Array<{
    rule_id: string
    rule_name: string
    success: boolean
  }>
  errors: Array<{
    rule_id: string
    rule_name: string
    error: string
  }>
  totalRulesChecked: number
  totalExecuted: number
}

/**
 * Executa workflows para um ticket específico
 */
export async function executeWorkflowsForTicket(ticketId: string): Promise<WorkflowExecutionResult> {
  try {
    // Buscar o ticket com dados relacionados
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email, role),
        assigned_to_user:users!tickets_assigned_to_fkey(id, name, email),
        category_info:categories!tickets_category_id_fkey(id, name, slug)
      `)
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      throw new Error('Ticket não encontrado')
    }

    // Buscar regras ativas ordenadas por prioridade
    const { data: rules, error: rulesError } = await supabaseAdmin
      .from('workflow_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (rulesError) {
      throw new Error(`Erro ao buscar regras: ${rulesError.message}`)
    }

    const executedRules: Array<{ rule_id: string; rule_name: string; success: boolean }> = []
    const errors: Array<{ rule_id: string; rule_name: string; error: string }> = []

    // Executar cada regra
    for (const rule of rules || []) {
      try {
        const conditionsMet = await evaluateConditions(rule.conditions, ticket)
        
        if (conditionsMet) {
          const success = await executeActions(rule.actions, ticket)
          
          // Log da execução
          await logWorkflowExecution(rule.id, ticketId, rule.conditions, rule.actions, success)

          executedRules.push({
            rule_id: rule.id,
            rule_name: rule.name,
            success
          })

          console.log(`✅ Workflow executado: ${rule.name} (${rule.id}) para ticket ${ticketId}`)
        }
      } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido'
        errors.push({
          rule_id: rule.id,
          rule_name: rule.name,
          error: errorMessage
        })

        // Log do erro
        await logWorkflowExecution(rule.id, ticketId, rule.conditions, rule.actions, false, errorMessage)

        console.error(`❌ Erro ao executar workflow ${rule.name}:`, error)
      }
    }

    return {
      success: true,
      executedRules,
      errors,
      totalRulesChecked: rules?.length || 0,
      totalExecuted: executedRules.length
    }
  } catch (error: any) {
    console.error('Erro geral na execução de workflows:', error)
    return {
      success: false,
      executedRules: [],
      errors: [{ rule_id: 'system', rule_name: 'System Error', error: error.message }],
      totalRulesChecked: 0,
      totalExecuted: 0
    }
  }
}

/**
 * Avalia se as condições de uma regra são atendidas
 */
async function evaluateConditions(conditions: any, ticket: TicketData): Promise<boolean> {
  if (!conditions || typeof conditions !== 'object') {
    return false
  }

  // Categoria
  if (conditions.category) {
    const ticketCategory = ticket.category_info?.slug || ticket.category
    if (ticketCategory !== conditions.category) {
      return false
    }
  }

  // Prioridade
  if (conditions.priority) {
    if (ticket.priority !== conditions.priority) {
      return false
    }
  }

  // Status
  if (conditions.status) {
    if (ticket.status !== conditions.status) {
      return false
    }
  }

  // Atribuição
  if ('assigned_to' in conditions) {
    if (conditions.assigned_to === null && ticket.assigned_to !== null) {
      return false
    }
    if (conditions.assigned_to !== null && ticket.assigned_to !== conditions.assigned_to) {
      return false
    }
  }

  // Role do criador
  if (conditions.created_by_role) {
    const creatorRole = ticket.created_by_user?.role
    if (creatorRole !== conditions.created_by_role) {
      return false
    }
  }

  // Tempo desde criação
  if (conditions.time_since_creation) {
    const createdAt = new Date(ticket.created_at)
    const now = new Date()
    const diffMs = now.getTime() - createdAt.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    
    const timeCondition = conditions.time_since_creation
    if (timeCondition === '> 1 hour' && diffHours <= 1) return false
    if (timeCondition === '> 2 hours' && diffHours <= 2) return false
    if (timeCondition === '> 4 hours' && diffHours <= 4) return false
    if (timeCondition === '> 24 hours' && diffHours <= 24) return false
  }

  return true
}

/**
 * Executa as ações de uma regra
 */
async function executeActions(actions: any, ticket: TicketData): Promise<boolean> {
  if (!actions || typeof actions !== 'object') {
    return false
  }

  try {
    const updateData: any = {}
    let shouldUpdate = false

    // Atribuir ticket
    if (actions.assign_to) {
      if (actions.assign_to === 'auto') {
        // Lógica de auto-atribuição baseada na categoria
        const categorySlug = ticket.category_info?.slug || ticket.category
        const autoAssignUser = await getAutoAssignUser(categorySlug || 'geral')
        if (autoAssignUser && autoAssignUser !== ticket.assigned_to) {
          updateData.assigned_to = autoAssignUser
          shouldUpdate = true
        }
      } else if (actions.assign_to !== ticket.assigned_to) {
        updateData.assigned_to = actions.assign_to
        shouldUpdate = true
      }
    }

    // Definir prioridade
    if (actions.set_priority && actions.set_priority !== ticket.priority) {
      updateData.priority = actions.set_priority
      shouldUpdate = true
    }

    // Definir status
    if (actions.set_status && actions.set_status !== ticket.status) {
      updateData.status = actions.set_status
      shouldUpdate = true
    }

    // Atualizar ticket se houver mudanças
    if (shouldUpdate) {
      updateData.updated_at = new Date().toISOString()
      
      const { error: updateError } = await supabaseAdmin
        .from('tickets')
        .update(updateData)
        .eq('id', ticket.id)

      if (updateError) {
        console.error('Erro ao atualizar ticket:', updateError)
        throw new Error(`Erro ao atualizar ticket: ${updateError.message}`)
      }

      console.log(`📝 Ticket ${ticket.id} atualizado:`, updateData)
    }

    // Adicionar comentário
    if (actions.add_comment) {
      const { error: commentError } = await supabaseAdmin
        .from('ticket_comments')
        .insert({
          ticket_id: ticket.id,
          user_id: ticket.created_by, // Sistema usa o criador do ticket como autor
          content: actions.add_comment,
          is_internal: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (commentError) {
        console.error('Erro ao adicionar comentário:', commentError)
        // Não falha a execução se comentário falhar
      } else {
        console.log(`💬 Comentário adicionado ao ticket ${ticket.id}`)
      }
    }

    // Notificações (implementação básica)
    if (actions.notify && Array.isArray(actions.notify)) {
      // TODO: Implementar sistema de notificação por email
      console.log('📧 Notificações pendentes para:', actions.notify)
    }

    return true
  } catch (error: any) {
    console.error('Erro ao executar ações:', error)
    throw error
  }
}

/**
 * Obtém usuário para auto-atribuição baseado na categoria
 */
async function getAutoAssignUser(categorySlug: string): Promise<string | null> {
  try {
    // Mapeamento de categoria para role preferida
    const categoryRoleMap: Record<string, string> = {
      'hardware': 'analyst',
      'software': 'analyst',
      'rede': 'admin',
      'urgente': 'admin',
      'geral': 'analyst'
    }

    const targetRole = categoryRoleMap[categorySlug] || 'analyst'

    // Buscar usuários disponíveis com a role apropriada
    // TODO: Implementar lógica de balanceamento de carga (usuário com menos tickets)
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('role', targetRole)
      .limit(5)

    if (error || !users || users.length === 0) {
      console.log(`⚠️ Nenhum usuário encontrado para role ${targetRole}`)
      return null
    }

    // Por simplicidade, retorna o primeiro usuário encontrado
    // TODO: Implementar round-robin ou baseado em carga de trabalho
    const selectedUser = users[0]
    console.log(`👤 Auto-atribuição: ${selectedUser.name} (${selectedUser.id}) para categoria ${categorySlug}`)
    
    return selectedUser.id
  } catch (error) {
    console.error('Erro ao buscar usuário para auto-atribuição:', error)
    return null
  }
}

/**
 * Registra a execução de um workflow
 */
async function logWorkflowExecution(
  ruleId: string,
  ticketId: string,
  conditions: any,
  actions: any,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  try {
    await supabaseAdmin
      .from('workflow_executions')
      .insert({
        rule_id: ruleId,
        ticket_id: ticketId,
        conditions_met: conditions,
        actions_executed: actions,
        success,
        error_message: errorMessage || null,
        executed_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Erro ao registrar log de workflow:', error)
    // Não propaga o erro para não afetar a execução principal
  }
}

/**
 * Obtém logs de execução de workflows para um ticket
 */
export async function getWorkflowExecutions(ticketId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('workflow_executions')
      .select(`
        *,
        rule:workflow_rules(name, description)
      `)
      .eq('ticket_id', ticketId)
      .order('executed_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar execuções de workflow:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar execuções de workflow:', error)
    return []
  }
}
