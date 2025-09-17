import { supabaseAdmin } from './supabase'
import { createAndSendNotification } from './notifications'
import { differenceInMinutes, isWeekend, setHours, setMinutes, isAfter, isBefore, parseISO } from 'date-fns'

export interface EscalationRule {
  id: string
  name: string
  description?: string
  is_active: boolean
  priority: number
  conditions: any
  actions: any
  time_condition: 'unassigned_time' | 'no_response_time' | 'resolution_time' | 'custom_time'
  time_threshold: number
  time_unit: 'minutes' | 'hours' | 'days'
  business_hours_only: boolean
  business_hours_start: string
  business_hours_end: string
  working_days: number[]
  repeat_escalation: boolean
  repeat_interval: number
  max_repeats: number
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
  last_comment_at?: string
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

export interface EscalationExecutionResult {
  success: boolean
  executedRules: Array<{
    rule_id: string
    rule_name: string
    success: boolean
    escalation_type: string
    time_elapsed: number
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
 * Executa escalação para um ticket específico
 */
export async function executeEscalationForTicket(ticketId: string, forceExecution = false): Promise<EscalationExecutionResult> {
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

    // Buscar regras de escalação ativas
    const { data: rules, error: rulesError } = await supabaseAdmin
      .from('escalation_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (rulesError) {
      throw new Error(`Erro ao buscar regras de escalação: ${rulesError.message}`)
    }

    const executedRules: Array<{ rule_id: string; rule_name: string; success: boolean; escalation_type: string; time_elapsed: number }> = []
    const errors: Array<{ rule_id: string; rule_name: string; error: string }> = []

    // Executar cada regra
    for (const rule of rules || []) {
      try {
        const shouldExecute = await shouldExecuteEscalation(rule, ticket, forceExecution)
        
        if (shouldExecute.shouldExecute) {
          const success = await executeEscalationActions(rule, ticket)
          
          // Log da execução
          await logEscalationExecution(rule, ticket, shouldExecute.escalationType, shouldExecute.timeElapsed, success)

          executedRules.push({
            rule_id: rule.id,
            rule_name: rule.name,
            success,
            escalation_type: shouldExecute.escalationType,
            time_elapsed: shouldExecute.timeElapsed
          })

          console.log(`✅ Escalação executada: ${rule.name} (${rule.id}) para ticket ${ticketId}`)
        }
      } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido'
        errors.push({
          rule_id: rule.id,
          rule_name: rule.name,
          error: errorMessage
        })

        console.error(`❌ Erro ao executar escalação ${rule.name}:`, error)
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
    console.error('Erro geral na execução de escalação:', error)
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
 * Executa escalação para todos os tickets
 */
export async function executeAllEscalations(limit = 100, statusFilter = ['open', 'in_progress'], forceExecution = false) {
  const startTime = Date.now()
  
  try {
    // Buscar tickets que precisam de escalação
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email, role),
        assigned_to_user:users!tickets_assigned_to_fkey(id, name, email),
        category_info:categories!tickets_category_id_fkey(id, name, slug)
      `)
      .in('status', statusFilter)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (ticketsError) {
      throw new Error(`Erro ao buscar tickets: ${ticketsError.message}`)
    }

    let totalRulesExecuted = 0
    let totalErrors = 0
    const details: any[] = []

    // Processar cada ticket
    for (const ticket of tickets || []) {
      try {
        const result = await executeEscalationForTicket(ticket.id, forceExecution)
        totalRulesExecuted += result.totalExecuted
        totalErrors += result.errors.length
        
        if (result.totalExecuted > 0) {
          details.push({
            ticket_id: ticket.id,
            ticket_title: ticket.title,
            executed_rules: result.executedRules.length,
            errors: result.errors.length
          })
        }
      } catch (error: any) {
        totalErrors++
        console.error(`Erro ao processar ticket ${ticket.id}:`, error)
      }
    }

    const executionTime = Date.now() - startTime

    return {
      success: true,
      totalTicketsProcessed: tickets?.length || 0,
      totalRulesExecuted,
      totalErrors,
      executionTimeMs: executionTime,
      details
    }
  } catch (error: any) {
    console.error('Erro na execução de escalação em massa:', error)
    return {
      success: false,
      totalTicketsProcessed: 0,
      totalRulesExecuted: 0,
      totalErrors: 1,
      executionTimeMs: Date.now() - startTime,
      details: []
    }
  }
}

/**
 * Verifica se uma regra de escalação deve ser executada
 */
async function shouldExecuteEscalation(rule: EscalationRule, ticket: TicketData, forceExecution: boolean): Promise<{
  shouldExecute: boolean
  escalationType: string
  timeElapsed: number
}> {
  if (forceExecution) {
    return {
      shouldExecute: true,
      escalationType: 'forced',
      timeElapsed: 0
    }
  }

  // Verificar se está no horário comercial (se aplicável)
  if (rule.business_hours_only && !isBusinessHours(rule)) {
    return {
      shouldExecute: false,
      escalationType: 'outside_business_hours',
      timeElapsed: 0
    }
  }

  // Verificar condições básicas
  if (!evaluateBasicConditions(rule.conditions, ticket)) {
    return {
      shouldExecute: false,
      escalationType: 'conditions_not_met',
      timeElapsed: 0
    }
  }

  // Calcular tempo decorrido baseado no tipo de condição
  const timeElapsed = await calculateTimeElapsed(rule.time_condition, ticket)
  const thresholdInMinutes = convertToMinutes(rule.time_threshold, rule.time_unit)

  // Verificar se o tempo limite foi excedido
  if (timeElapsed < thresholdInMinutes) {
    return {
      shouldExecute: false,
      escalationType: 'time_not_exceeded',
      timeElapsed
    }
  }

  // Verificar se já foi executada recentemente (para evitar repetições desnecessárias)
  const recentlyExecuted = await wasRecentlyExecuted(rule.id, ticket.id, rule.repeat_interval)
  if (recentlyExecuted && !rule.repeat_escalation) {
    return {
      shouldExecute: false,
      escalationType: 'recently_executed',
      timeElapsed
    }
  }

  return {
    shouldExecute: true,
    escalationType: rule.time_condition,
    timeElapsed
  }
}

/**
 * Avalia condições básicas da regra
 */
function evaluateBasicConditions(conditions: any, ticket: TicketData): boolean {
  if (!conditions || typeof conditions !== 'object') {
    return true
  }

  // Status
  if (conditions.status && ticket.status !== conditions.status) {
    return false
  }

  // Prioridade
  if (conditions.priority && ticket.priority !== conditions.priority) {
    return false
  }

  // Categoria
  if (conditions.category) {
    const ticketCategory = ticket.category_info?.slug || ticket.category
    if (ticketCategory !== conditions.category) {
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

  return true
}

/**
 * Calcula tempo decorrido baseado no tipo de condição
 */
async function calculateTimeElapsed(timeCondition: string, ticket: TicketData): Promise<number> {
  const now = new Date()

  switch (timeCondition) {
    case 'unassigned_time':
      // Tempo desde criação se não atribuído, ou tempo desde última desatribuição
      const createdAt = new Date(ticket.created_at)
      return differenceInMinutes(now, createdAt)

    case 'no_response_time':
      // Tempo desde último comentário ou criação se não há comentários
      if (ticket.last_comment_at) {
        const lastCommentAt = new Date(ticket.last_comment_at)
        return differenceInMinutes(now, lastCommentAt)
      } else {
        const createdAt = new Date(ticket.created_at)
        return differenceInMinutes(now, createdAt)
      }

    case 'resolution_time':
      // Tempo desde criação
      const createdAt = new Date(ticket.created_at)
      return differenceInMinutes(now, createdAt)

    default:
      return 0
  }
}

/**
 * Converte tempo para minutos
 */
function convertToMinutes(amount: number, unit: string): number {
  switch (unit) {
    case 'minutes':
      return amount
    case 'hours':
      return amount * 60
    case 'days':
      return amount * 24 * 60
    default:
      return amount
  }
}

/**
 * Verifica se está no horário comercial
 */
function isBusinessHours(rule: EscalationRule): boolean {
  const now = new Date()
  
  // Verificar se é dia útil
  const dayOfWeek = now.getDay() // 0 = Domingo, 1 = Segunda, etc.
  if (!rule.working_days.includes(dayOfWeek)) {
    return false
  }

  // Verificar horário
  const currentTime = now.getHours() * 60 + now.getMinutes()
  const [startHour, startMin] = rule.business_hours_start.split(':').map(Number)
  const [endHour, endMin] = rule.business_hours_end.split(':').map(Number)
  
  const startTime = startHour * 60 + startMin
  const endTime = endHour * 60 + endMin

  return currentTime >= startTime && currentTime <= endTime
}

/**
 * Verifica se a regra foi executada recentemente
 */
async function wasRecentlyExecuted(ruleId: string, ticketId: string, intervalMinutes: number): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('escalation_logs')
      .select('triggered_at')
      .eq('rule_id', ruleId)
      .eq('ticket_id', ticketId)
      .eq('success', true)
      .order('triggered_at', { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) {
      return false
    }

    const lastExecution = new Date(data[0].triggered_at)
    const now = new Date()
    const diffMinutes = differenceInMinutes(now, lastExecution)

    return diffMinutes < intervalMinutes
  } catch (error) {
    console.error('Erro ao verificar execução recente:', error)
    return false
  }
}

/**
 * Executa as ações de escalação
 */
async function executeEscalationActions(rule: EscalationRule, ticket: TicketData): Promise<boolean> {
  try {
    const actions = rule.actions
    if (!actions || typeof actions !== 'object') {
      return false
    }

    const updateData: any = {}
    let shouldUpdate = false

    // Notificar supervisor
    if (actions.notify_supervisor) {
      await notifySupervisor(ticket, rule)
    }

    // Escalar para gerência
    if (actions.escalate_to_management) {
      await escalateToManagement(ticket, rule)
    }

    // Aumentar prioridade
    if (actions.increase_priority) {
      const newPriority = increasePriority(ticket.priority)
      if (newPriority && newPriority !== ticket.priority) {
        updateData.priority = newPriority
        shouldUpdate = true
      }
    }

    // Atribuir automaticamente
    if (actions.auto_assign) {
      const autoAssignUser = await getAutoAssignUser(ticket)
      if (autoAssignUser && autoAssignUser !== ticket.assigned_to) {
        updateData.assigned_to = autoAssignUser
        shouldUpdate = true
      }
    }

    // Atualizar ticket se houver mudanças
    if (shouldUpdate) {
      updateData.updated_at = new Date().toISOString()
      
      const { error: updateError } = await supabaseAdmin
        .from('tickets')
        .update(updateData)
        .eq('id', ticket.id)

      if (updateError) {
        console.error('Erro ao atualizar ticket na escalação:', updateError)
        throw new Error(`Erro ao atualizar ticket: ${updateError.message}`)
      }
    }

    // Adicionar comentário
    if (actions.add_comment) {
      await addEscalationComment(ticket, actions.add_comment)
    }

    return true
  } catch (error: any) {
    console.error('Erro ao executar ações de escalação:', error)
    throw error
  }
}

/**
 * Notifica supervisor
 */
async function notifySupervisor(ticket: TicketData, rule: EscalationRule): Promise<void> {
  try {
    // Buscar supervisores (analysts e admins)
    const { data: supervisors, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .in('role', ['analyst', 'admin'])
      .eq('is_active', true)

    if (error || !supervisors || supervisors.length === 0) {
      console.log('Nenhum supervisor encontrado para notificação')
      return
    }

    // Enviar notificação para cada supervisor
    for (const supervisor of supervisors) {
      await createAndSendNotification({
        user_id: supervisor.id,
        type: 'escalation',
        title: 'Escalação de Ticket',
        message: `Ticket #${ticket.id} precisa de atenção: ${rule.name}`,
        data: {
          ticket_id: ticket.id,
          ticket_title: ticket.title,
          escalation_rule: rule.name,
          escalation_type: 'supervisor_notification'
        }
      })
    }
  } catch (error) {
    console.error('Erro ao notificar supervisor:', error)
  }
}

/**
 * Escala para gerência
 */
async function escalateToManagement(ticket: TicketData, rule: EscalationRule): Promise<void> {
  try {
    // Buscar gerentes (admins)
    const { data: managers, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('role', 'admin')
      .eq('is_active', true)

    if (error || !managers || managers.length === 0) {
      console.log('Nenhum gerente encontrado para escalação')
      return
    }

    // Enviar notificação para cada gerente
    for (const manager of managers) {
      await createAndSendNotification({
        user_id: manager.id,
        type: 'escalation',
        title: 'Escalação Crítica de Ticket',
        message: `Ticket #${ticket.id} escalado para gerência: ${rule.name}`,
        data: {
          ticket_id: ticket.id,
          ticket_title: ticket.title,
          escalation_rule: rule.name,
          escalation_type: 'management_escalation'
        }
      })
    }
  } catch (error) {
    console.error('Erro ao escalar para gerência:', error)
  }
}

/**
 * Aumenta prioridade do ticket
 */
function increasePriority(currentPriority: string): string | null {
  const priorityOrder = ['low', 'medium', 'high', 'critical']
  const currentIndex = priorityOrder.indexOf(currentPriority)
  
  if (currentIndex === -1 || currentIndex === priorityOrder.length - 1) {
    return null // Já é a prioridade mais alta
  }
  
  return priorityOrder[currentIndex + 1]
}

/**
 * Obtém usuário para auto-atribuição
 */
async function getAutoAssignUser(ticket: TicketData): Promise<string | null> {
  try {
    // Buscar usuários disponíveis (analysts e admins)
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, name, role')
      .in('role', ['analyst', 'admin'])
      .eq('is_active', true)
      .limit(5)

    if (error || !users || users.length === 0) {
      return null
    }

    // Por simplicidade, retorna o primeiro usuário encontrado
    // TODO: Implementar lógica de balanceamento de carga
    return users[0].id
  } catch (error) {
    console.error('Erro ao buscar usuário para auto-atribuição:', error)
    return null
  }
}

/**
 * Adiciona comentário de escalação
 */
async function addEscalationComment(ticket: TicketData, comment: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('ticket_comments')
      .insert({
        ticket_id: ticket.id,
        user_id: ticket.created_by, // Sistema usa o criador do ticket como autor
        content: comment,
        is_internal: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Erro ao adicionar comentário de escalação:', error)
    }
  } catch (error) {
    console.error('Erro ao adicionar comentário de escalação:', error)
  }
}

/**
 * Registra a execução de uma escalação
 */
async function logEscalationExecution(
  rule: EscalationRule,
  ticket: TicketData,
  escalationType: string,
  timeElapsed: number,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  try {
    await supabaseAdmin
      .from('escalation_logs')
      .insert({
        rule_id: rule.id,
        ticket_id: ticket.id,
        escalation_type: escalationType,
        time_elapsed: timeElapsed,
        conditions_met: rule.conditions,
        actions_executed: rule.actions,
        success,
        error_message: errorMessage || null,
        triggered_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Erro ao registrar log de escalação:', error)
  }
}

/**
 * Obtém logs de escalação para um ticket
 */
export async function getEscalationLogs(ticketId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('escalation_logs')
      .select(`
        *,
        rule:escalation_rules(name, description)
      `)
      .eq('ticket_id', ticketId)
      .order('triggered_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar logs de escalação:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erro ao buscar logs de escalação:', error)
    return []
  }
}
