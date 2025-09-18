import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔄 [EDGE] Iniciando escalação automática...')

    // Buscar tickets que precisam de escalação
    const { data: tickets, error: ticketsError } = await supabaseClient
      .from('tickets')
      .select('*')
      .in('status', ['aberto', 'em-progresso', 'open', 'in_progress'])
      .order('created_at', { ascending: true })
      .limit(50)

    if (ticketsError) {
      throw new Error(`Erro ao buscar tickets: ${ticketsError.message}`)
    }

    console.log(`📊 [EDGE] Encontrados ${tickets?.length || 0} tickets para processar`)

    let processed = 0
    let executed = 0
    const results = []

    // Buscar regras de escalação ativas
    const { data: rules, error: rulesError } = await supabaseClient
      .from('escalation_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (rulesError) {
      throw new Error(`Erro ao buscar regras: ${rulesError.message}`)
    }

    console.log(`📋 [EDGE] Encontradas ${rules?.length || 0} regras ativas`)

    // Processar cada ticket
    for (const ticket of tickets || []) {
      processed++
      let ticketExecuted = false
      const executedRules = []

      // Verificar cada regra
      for (const rule of rules || []) {
        const shouldExecute = await checkRuleConditions(ticket, rule)
        
        if (shouldExecute) {
          // Executar ações da regra
          await executeRuleActions(ticket, rule, supabaseClient)
          executedRules.push(rule.name)
          ticketExecuted = true
          executed++
          
          console.log(`✅ [EDGE] Regra '${rule.name}' executada para ticket ${ticket.id}`)
        }
      }

      if (ticketExecuted) {
        results.push({
          ticket_id: ticket.id,
          ticket_title: ticket.title,
          success: true,
          executed_rules: executedRules,
          message: `Escalação executada para ${executedRules.length} regra(s)`
        })
      }
    }

    console.log(`🎯 [EDGE] Processamento concluído: ${processed} tickets processados, ${executed} escalações executadas`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Execução automática concluída: ${processed} tickets processados, ${executed} escalações executadas`,
        processed,
        executed,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ [EDGE] Erro na escalação automática:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Erro na execução da escalação automática'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

/**
 * Verifica se uma regra deve ser executada para um ticket
 */
async function checkRuleConditions(ticket: any, rule: any): Promise<boolean> {
  const conditions = rule.conditions
  const timeThreshold = rule.time_threshold
  const timeCondition = rule.time_condition

  // Calcular tempo decorrido
  const currentTime = new Date()
  let referenceTime: Date

  switch (timeCondition) {
    case 'unassigned_time':
      referenceTime = new Date(ticket.created_at)
      break
    case 'no_response_time':
      referenceTime = new Date(ticket.updated_at)
      break
    case 'resolution_time':
      referenceTime = new Date(ticket.created_at)
      break
    default:
      referenceTime = new Date(ticket.created_at)
  }

  const timeElapsed = (currentTime.getTime() - referenceTime.getTime()) / (1000 * 60) // em minutos

  // Verificar se o tempo limite foi atingido
  if (timeElapsed < timeThreshold) {
    return false
  }

  // Verificar condições específicas
  if (conditions.status) {
    const statusArray = Array.isArray(conditions.status) ? conditions.status : [conditions.status]
    if (!statusArray.includes(ticket.status)) {
      return false
    }
  }

  if (conditions.priority) {
    const priorityArray = Array.isArray(conditions.priority) ? conditions.priority : [conditions.priority]
    if (!priorityArray.includes(ticket.priority)) {
      return false
    }
  }

  if (conditions.assigned_to !== undefined) {
    if (conditions.assigned_to === null && ticket.assigned_to !== null) {
      return false
    }
    if (conditions.assigned_to !== null && ticket.assigned_to === null) {
      return false
    }
  }

  return true
}

/**
 * Executa as ações de uma regra para um ticket
 */
async function executeRuleActions(ticket: any, rule: any, supabaseClient: any): Promise<void> {
  const actions = rule.actions

  // Buscar usuário admin
  const { data: adminUser } = await supabaseClient
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single()

  const adminUserId = adminUser?.id || '00000000-0000-0000-0000-000000000000'

  // Adicionar comentário
  if (actions.add_comment && actions.add_comment !== 'false') {
    await supabaseClient
      .from('comments')
      .insert({
        ticket_id: ticket.id,
        user_id: adminUserId,
        content: actions.add_comment,
        is_internal: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
  }

  // Aumentar prioridade
  if (actions.increase_priority === true) {
    let newPriority = ticket.priority
    switch (ticket.priority) {
      case 'low':
        newPriority = 'medium'
        break
      case 'medium':
        newPriority = 'high'
        break
      case 'high':
        newPriority = 'critical'
        break
    }

    if (newPriority !== ticket.priority) {
      await supabaseClient
        .from('tickets')
        .update({ priority: newPriority, updated_at: new Date().toISOString() })
        .eq('id', ticket.id)
    }
  }

  // Criar notificação para e-mail
  if (actions.send_email_notification === true && actions.notify_supervisor?.recipients) {
    for (const recipientId of actions.notify_supervisor.recipients) {
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: recipientId,
          type: 'escalation_email',
          title: `Escalação de Ticket - ${rule.name}`,
          message: 'Um ticket foi escalado automaticamente e precisa de atenção.',
          data: {
            ticket_id: ticket.id,
            ticket_title: ticket.title,
            rule_name: rule.name,
            escalation_type: rule.time_condition
          },
          is_read: false,
          created_at: new Date().toISOString()
        })
    }
  }

  // Log da execução
  await supabaseClient
    .from('escalation_logs')
    .insert({
      rule_id: rule.id,
      ticket_id: ticket.id,
      escalation_type: rule.time_condition,
      time_elapsed: Math.floor((new Date().getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60)),
      conditions_met: rule.conditions,
      actions_executed: actions,
      success: true,
      triggered_at: new Date().toISOString()
    })
}
