import { supabaseAdmin } from './supabase'
import { sendEscalationEmail } from './email-service'

/**
 * Verifica se um ticket já foi escalado recentemente pela mesma regra
 */
async function checkRecentEscalation(ticketId: string, ruleId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('escalation_logs')
      .select('id, triggered_at')
      .eq('ticket_id', ticketId)
      .eq('rule_id', ruleId)
      .eq('success', true)
      .gte('triggered_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Últimos 30 minutos
      .limit(1)

    if (error) {
      console.error('Erro ao verificar escalação recente:', error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.error('Erro ao verificar escalação recente:', error)
    return false
  }
}

export interface EscalationExecutionResult {
  success: boolean
  executedRules: string[]
  message?: string
  error?: string
}

/**
 * Versão simplificada da escalação para evitar timeout
 */
export async function executeEscalationForTicketSimple(ticketId: string): Promise<EscalationExecutionResult> {
  try {
    console.log(`🚨 [SIMPLE] Iniciando escalação para ticket ${ticketId}...`)
    
    // Buscar dados básicos do ticket
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('id, title, status, priority, created_at, assigned_to')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      console.error('Erro ao buscar ticket:', ticketError)
      return {
        success: false,
        error: `Ticket não encontrado: ${ticketError?.message || 'Ticket não existe'}`,
        executedRules: []
      }
    }

    console.log(`📋 [SIMPLE] Ticket encontrado: ${ticket.title} (${ticket.status})`)

    // Buscar regras de escalação ativas (limitado)
    const { data: rules, error: rulesError } = await supabaseAdmin
      .from('escalation_rules')
      .select('id, name, time_threshold, time_unit, time_condition, conditions, actions')
      .eq('is_active', true)
      .order('priority', { ascending: true })
      .limit(5) // Limitar a 5 regras

    if (rulesError) {
      console.error('Erro ao buscar regras de escalação:', rulesError)
      return {
        success: false,
        error: `Erro ao buscar regras: ${rulesError.message}`,
        executedRules: []
      }
    }

    console.log(`⚙️ [SIMPLE] Encontradas ${rules?.length || 0} regras de escalação`)

    if (!rules || rules.length === 0) {
      console.log('ℹ️ [SIMPLE] Nenhuma regra de escalação ativa encontrada')
      return {
        success: true,
        message: 'Nenhuma regra de escalação ativa',
        executedRules: []
      }
    }

    const executedRules: string[] = []
    let hasErrors = false
    const errors: string[] = []

    // Processar cada regra
    for (const rule of rules) {
      try {
        console.log(`🔍 [SIMPLE] Verificando regra: ${rule.name}`)
        
        // Verificar se já foi escalado recentemente (evitar loop)
        const recentEscalation = await checkRecentEscalation(ticket.id, rule.id)
        if (recentEscalation) {
          console.log(`⏭️ [SIMPLE] Ticket ${ticket.id} já foi escalado recentemente pela regra ${rule.name}`)
          continue
        }
        
        // Verificar se a regra se aplica ao ticket (versão simplificada)
        const shouldExecute = shouldExecuteEscalationSimple(rule, ticket)
        
        if (shouldExecute.shouldExecute) {
          console.log(`⚡ [SIMPLE] Executando escalação: ${rule.name}`)
          
          // Executar ações da regra (versão simplificada)
          const success = await executeEscalationActionsSimple(rule, ticket)
          
          if (success) {
            // Log da execução (versão simplificada)
            await logEscalationExecutionSimple(rule, ticket, shouldExecute.escalationType, shouldExecute.timeElapsed, true)
            
            console.log(`✅ [SIMPLE] Escalação executada: ${rule.name}`)
            executedRules.push(rule.name)
          } else {
            console.error(`❌ [SIMPLE] Falha na execução da escalação: ${rule.name}`)
            hasErrors = true
            errors.push(`Falha na execução: ${rule.name}`)
          }
        } else {
          console.log(`⏭️ [SIMPLE] Regra não aplicável: ${rule.name} (${shouldExecute.reason})`)
        }
      } catch (ruleError: any) {
        console.error(`❌ [SIMPLE] Erro ao processar regra ${rule.name}:`, ruleError.message)
        hasErrors = true
        errors.push(`Erro na regra ${rule.name}: ${ruleError.message}`)
      }
    }

    const result: EscalationExecutionResult = {
      success: !hasErrors,
      executedRules,
      message: executedRules.length > 0 
        ? `Escalação executada para ${executedRules.length} regra(s)`
        : 'Nenhuma regra foi executada'
    }

    if (hasErrors) {
      result.error = errors.join('; ')
    }

    console.log(`🎯 [SIMPLE] Resultado da escalação:`, result)
    return result

  } catch (error: any) {
    console.error('❌ [SIMPLE] Erro geral na escalação:', error.message)
    return {
      success: false,
      error: `Erro geral: ${error.message}`,
      executedRules: []
    }
  }
}

/**
 * Verificação simplificada de escalação
 */
function shouldExecuteEscalationSimple(rule: any, ticket: any): { shouldExecute: boolean; reason: string; escalationType: string; timeElapsed: number } {
  try {
    const now = new Date()
    const createdAt = new Date(ticket.created_at)
    const timeElapsed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60)) // em minutos

    // Converter threshold para minutos
    let thresholdMinutes = rule.time_threshold
    if (rule.time_unit === 'hours') {
      thresholdMinutes *= 60
    } else if (rule.time_unit === 'days') {
      thresholdMinutes *= 24 * 60
    }

    // Verificar condições básicas
    if (rule.conditions.status) {
      let statusArray: string[] = []
      
      if (Array.isArray(rule.conditions.status)) {
        statusArray = rule.conditions.status
      } else if (typeof rule.conditions.status === 'string') {
        statusArray = [rule.conditions.status]
      }
      
      // Mapear status em inglês para português
      const statusMap: { [key: string]: string[] } = {
        'open': ['open', 'aberto'],
        'aberto': ['open', 'aberto'],
        'in_progress': ['in_progress', 'em-progresso'],
        'em-progresso': ['in_progress', 'em-progresso']
      }
      
      let statusMatches = false
      for (const ruleStatus of statusArray) {
        const mappedStatuses = statusMap[ruleStatus] || [ruleStatus]
        if (mappedStatuses.includes(ticket.status)) {
          statusMatches = true
          break
        }
      }
      
      if (!statusMatches) {
        return { shouldExecute: false, reason: `Status não corresponde (${ticket.status} não está em ${JSON.stringify(statusArray)})`, escalationType: 'status_mismatch', timeElapsed }
      }
    }

    if (rule.conditions.priority) {
      const priorityArray = Array.isArray(rule.conditions.priority) ? rule.conditions.priority : [rule.conditions.priority]
      if (!priorityArray.includes(ticket.priority)) {
        return { shouldExecute: false, reason: `Prioridade não corresponde (${ticket.priority} não está em ${JSON.stringify(priorityArray)})`, escalationType: 'priority_mismatch', timeElapsed }
      }
    }

    if ('assigned_to' in rule.conditions) {
      if (rule.conditions.assigned_to === null && ticket.assigned_to !== null) {
        return { shouldExecute: false, reason: 'Ticket já atribuído', escalationType: 'already_assigned', timeElapsed }
      }
      if (rule.conditions.assigned_to !== null && ticket.assigned_to !== rule.conditions.assigned_to) {
        return { shouldExecute: false, reason: 'Atribuição não corresponde', escalationType: 'assignment_mismatch', timeElapsed }
      }
    }

    // Verificar tempo
    if (timeElapsed < thresholdMinutes) {
      return { shouldExecute: false, reason: `Tempo insuficiente (${timeElapsed} < ${thresholdMinutes})`, escalationType: 'time_not_exceeded', timeElapsed }
    }

    return {
      shouldExecute: true,
      reason: 'Condições atendidas',
      escalationType: rule.time_condition,
      timeElapsed
    }
  } catch (error: any) {
    return { shouldExecute: false, reason: `Erro na verificação: ${error.message}`, escalationType: 'error', timeElapsed: 0 }
  }
}

/**
 * Execução simplificada de ações de escalação
 */
async function executeEscalationActionsSimple(rule: any, ticket: any): Promise<boolean> {
  try {
    const actions = rule.actions
    const updateData: any = {}
    let shouldUpdate = false

    // Aumentar prioridade
    if (actions.increase_priority) {
      const newPriority = increasePrioritySimple(ticket.priority)
      if (newPriority && newPriority !== ticket.priority) {
        updateData.priority = newPriority
        shouldUpdate = true
        console.log(`   📈 [SIMPLE] Prioridade aumentada: ${ticket.priority} → ${newPriority}`)
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
        console.error('   ❌ [SIMPLE] Erro ao atualizar ticket:', updateError.message)
        return false
      }
    }

    // Adicionar comentário
    if (actions.add_comment) {
      const commentText = typeof actions.add_comment === 'string' 
        ? actions.add_comment 
        : actions.add_comment?.comment_text || 'Comentário de escalação automática'
      
      await addEscalationCommentSimple(ticket, commentText)
      console.log(`   💬 [SIMPLE] Comentário adicionado`)
    }

    // Notificações (simplificadas)
    if (actions.notify_supervisor) {
      console.log(`   🔔 [SIMPLE] Supervisor seria notificado`)
    }

    if (actions.escalate_to_management) {
      console.log(`   📢 [SIMPLE] Gerência seria notificada`)
    }

    // Enviar email de notificação
    if (actions.send_email_notification || actions.notify_supervisor || actions.escalate_to_management) {
      let recipientIds: string[] = []
      
      // Determinar destinatários baseado nas ações
      if (actions.escalate_to_management) {
        // Buscar administradores
        const { data: admins } = await supabaseAdmin
          .from('users')
          .select('id, email')
          .eq('role', 'admin')
        
        if (admins) {
          recipientIds = admins.map(u => u.id)
        }
      } else if (actions.notify_supervisor) {
        // Buscar supervisores (analysts e admins)
        const { data: supervisors } = await supabaseAdmin
          .from('users')
          .select('id, email')
          .in('role', ['admin', 'analyst'])
        
        if (supervisors) {
          recipientIds = supervisors.map(u => u.id)
        }
      }
      
      // Se send_email_notification tem destinatários específicos
      if (typeof actions.send_email_notification === 'object' && actions.send_email_notification.recipients) {
        recipientIds = [...new Set([...recipientIds, ...actions.send_email_notification.recipients])]
      }
      
      if (recipientIds.length > 0) {
        console.log(`   📧 [SIMPLE] Enviando emails para ${recipientIds.length} destinatários`)
        
        // Buscar emails dos destinatários
        const { data: users } = await supabaseAdmin
          .from('users')
          .select('id, email')
          .in('id', recipientIds)
        
        if (users && users.length > 0) {
          const emails = users.map(u => u.email).filter(Boolean)
          
          // Enviar email real
          const emailSent = await sendEscalationEmail(
            ticket.id,
            ticket.title,
            rule.name,
            emails
          )
          
          if (emailSent) {
            console.log(`   ✅ [SIMPLE] Emails enviados com sucesso`)
          } else {
            console.log(`   ⚠️ [SIMPLE] Falha ao enviar alguns emails`)
          }
          
          // Também criar notificações no sistema
          for (const user of users) {
            try {
              await supabaseAdmin
                .from('notifications')
                .insert({
                  user_id: user.id,
                  type: 'escalation',
                  title: `Escalação: ${rule.name}`,
                  message: `Ticket #${ticket.id.slice(0, 8)} foi escalado automaticamente`,
                  data: {
                    ticket_id: ticket.id,
                    ticket_title: ticket.title,
                    rule_name: rule.name,
                    escalation_type: rule.time_condition
                  },
                  is_read: false
                })
              
              console.log(`   ✅ [SIMPLE] Notificação criada para ${user.email}`)
            } catch (error: any) {
              console.error(`   ❌ [SIMPLE] Erro ao criar notificação:`, error.message)
            }
          }
        }
      } else {
        console.log(`   ⚠️ [SIMPLE] Nenhum destinatário encontrado para notificação`)
      }
    }

    return true
  } catch (error: any) {
    console.error('   ❌ [SIMPLE] Erro ao executar ações:', error.message)
    return false
  }
}

/**
 * Aumentar prioridade (versão simplificada)
 */
function increasePrioritySimple(currentPriority: string): string | null {
  const priorityOrder = ['low', 'medium', 'high', 'critical']
  const currentIndex = priorityOrder.indexOf(currentPriority)
  
  if (currentIndex === -1 || currentIndex === priorityOrder.length - 1) {
    return null // Já é a prioridade mais alta
  }
  
  return priorityOrder[currentIndex + 1]
}

/**
 * Adicionar comentário de escalação (versão simplificada)
 */
async function addEscalationCommentSimple(ticket: any, comment: string): Promise<void> {
  try {
    console.log(`   💬 [SIMPLE] Tentando adicionar comentário: ${comment}`)
    
    // Buscar um usuário admin para usar como autor do comentário
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single()

    const userId = adminUser?.id || '00000000-0000-0000-0000-000000000000'
    
    console.log(`   💬 [SIMPLE] Usando usuário: ${userId}`)

    const { error } = await supabaseAdmin
      .from('comments')
      .insert({
        ticket_id: ticket.id,
        user_id: userId,
        content: comment,
        is_internal: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('   ❌ [SIMPLE] Erro ao adicionar comentário de escalação:', error.message)
    } else {
      console.log('   ✅ [SIMPLE] Comentário adicionado com sucesso')
    }
  } catch (error: any) {
    console.error('   ❌ [SIMPLE] Erro ao adicionar comentário de escalação:', error.message)
  }
}

/**
 * Log de execução de escalação (versão simplificada)
 */
async function logEscalationExecutionSimple(rule: any, ticket: any, escalationType: string, timeElapsed: number, success: boolean, errorMessage?: string): Promise<void> {
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
  } catch (error: any) {
    console.error('Erro ao registrar log de escalação:', error.message)
  }
}
