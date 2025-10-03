import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Versão corrigida que busca regras do banco e usa ticket_number
export async function GET() {
  const startTime = Date.now()
  const MAX_EXECUTION_TIME = 8000 // 8 segundos máximo
  
  try {
    
    // 1. BUSCAR REGRAS ATIVAS DO BANCO
    const { data: activeRules, error: rulesError } = await supabaseAdmin
      .from('escalation_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true })
    
    if (rulesError || !activeRules || activeRules.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma regra de escalação ativa',
        rules_found: 0
      })
    }
    
    
    const allResults = []
    let totalEscalated = 0
    
    // 2. PROCESSAR CADA REGRA
    for (const rule of activeRules) {
      if (Date.now() - startTime > MAX_EXECUTION_TIME) {
        break
      }
      
      
      // Calcular tempo threshold em minutos
      let thresholdMinutes = rule.time_threshold
      if (rule.time_unit === 'hours') {
        thresholdMinutes = rule.time_threshold * 60
      } else if (rule.time_unit === 'days') {
        thresholdMinutes = rule.time_threshold * 24 * 60
      }
      
      const thresholdTime = new Date(Date.now() - thresholdMinutes * 60 * 1000).toISOString()
      
      // Construir query baseada nas condições da regra
      let ticketQuery = supabaseAdmin
        .from('tickets')
        .select('id, ticket_number, title, status, priority, created_at, assigned_to')
        .lt('created_at', thresholdTime)
        .limit(5) // Limitar por regra
      
      // Aplicar filtros baseados nas condições da regra
      if (rule.conditions?.status) {
        const statuses = Array.isArray(rule.conditions.status) 
          ? rule.conditions.status 
          : [rule.conditions.status]
        ticketQuery = ticketQuery.in('status', statuses)
      }
      
      if (rule.conditions?.priority) {
        const priorities = Array.isArray(rule.conditions.priority)
          ? rule.conditions.priority
          : [rule.conditions.priority]
        ticketQuery = ticketQuery.in('priority', priorities)
      }
      
      if (rule.conditions?.assigned_to === null) {
        ticketQuery = ticketQuery.is('assigned_to', null)
      } else if (rule.conditions?.assigned_to) {
        ticketQuery = ticketQuery.eq('assigned_to', rule.conditions.assigned_to)
      }
      
      // Buscar tickets que atendem aos critérios
      const { data: candidateTickets, error: ticketsError } = await ticketQuery
      
      if (ticketsError) {
        continue
      }
      
      if (!candidateTickets || candidateTickets.length === 0) {
        continue
      }
      
      
      // Processar cada ticket candidato
      for (const ticket of candidateTickets) {
        if (Date.now() - startTime > MAX_EXECUTION_TIME) {
          break
        }
        
        try {
          // Verificar se já foi escalado recentemente por esta regra
          const { data: recentLog } = await supabaseAdmin
            .from('escalation_logs')
            .select('id')
            .eq('ticket_id', ticket.id)
            .eq('rule_id', rule.id)
            .gte('triggered_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
            .limit(1)
          
          if (recentLog && recentLog.length > 0) {
            continue
          }
          
          
          // EXECUTAR AÇÕES DA REGRA
          
          // 1. Aumentar prioridade se configurado
          if (rule.actions?.increase_priority) {
            const priorityMap: { [key: string]: string } = {
              'low': 'medium',
              'medium': 'high',
              'high': 'critical',
              'critical': 'critical'
            }
            
            const newPriority = priorityMap[ticket.priority] || ticket.priority
            
            if (newPriority !== ticket.priority) {
              await supabaseAdmin
                .from('tickets')
                .update({ 
                  priority: newPriority,
                  // updated_at gerenciado automaticamente pelo Supabase
                })
                .eq('id', ticket.id)
              
            }
          }
          
          // 2. Adicionar comentário se configurado
          if (rule.actions?.add_comment) {
            const commentText = typeof rule.actions.add_comment === 'string'
              ? rule.actions.add_comment
              : `⚠️ ESCALAÇÃO AUTOMÁTICA: ${rule.name} - Tempo limite excedido (${rule.time_threshold} ${rule.time_unit})`
            
            await supabaseAdmin
              .from('comments')
              .insert({
                ticket_id: ticket.id,
                user_id: '00000000-0000-0000-0000-000000000000',
                content: commentText,
                is_internal: true,
                // created_at gerenciado automaticamente pelo Supabase
              })
            
          }
          
          // 3. Enviar notificações por email
          if (rule.actions?.send_email_notification || 
              rule.actions?.notify_supervisor || 
              rule.actions?.escalate_to_management) {
            
            try {
              // Determinar destinatários baseado nas ações
              let recipientRoles = []
              
              if (rule.actions.escalate_to_management) {
                recipientRoles.push('admin')
              } else if (rule.actions.notify_supervisor) {
                recipientRoles.push('admin', 'analyst')
              }
              
              if (recipientRoles.length > 0) {
                const { data: recipients } = await supabaseAdmin
                  .from('users')
                  .select('email')
                  .in('role', recipientRoles)
                  .limit(20)
                
                if (recipients && recipients.length > 0) {
                  const emails = recipients.map(u => u.email).filter(Boolean)
                  
                  if (emails.length > 0) {
                    const { sendEscalationEmail } = await import('@/lib/email-service')
                    await sendEscalationEmail(
                      ticket.id,
                      ticket.ticket_number, // Passar o ticket_number aqui
                      ticket.title,
                      rule.name,
                      emails
                    )
                  }
                }
              }
            } catch (emailError: any) {
            }
          }
          
          // 4. Registrar no log de escalação
          await supabaseAdmin
            .from('escalation_logs')
            .insert({
              ticket_id: ticket.id,
              rule_id: rule.id,
              escalation_type: rule.time_condition,
              time_elapsed: Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / 60000),
              conditions_met: rule.conditions,
              actions_executed: rule.actions,
              success: true,
              triggered_at: new Date().toISOString()
            })
          
          totalEscalated++
          allResults.push({
            ticket_number: ticket.ticket_number,
            ticket_title: ticket.title,
            rule_name: rule.name,
            escalated_at: new Date().toISOString()
          })
          
          
        } catch (ticketError: any) {
        }
      }
    }
    
    const executionTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      message: `Execução concluída em ${executionTime}ms`,
      stats: {
        rules_processed: activeRules.length,
        tickets_escalated: totalEscalated,
        execution_time_ms: executionTime
      },
      results: allResults
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Erro na execução',
      details: error.message,
      execution_time_ms: Date.now() - startTime
    }, { status: 500 })
  }
}