// Script para executar escalações automáticas
// Execute este script via cron job para verificar tickets que precisam de escalação

const { createClient } = require('@supabase/supabase-js')

// Configurações do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function executeEscalations() {
  console.log('🚀 Iniciando execução de escalações automáticas...')
  
  try {
    // Buscar tickets que precisam de escalação
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email, role),
        assigned_to_user:users!tickets_assigned_to_fkey(id, name, email),
        category_info:categories!tickets_category_id_fkey(id, name, slug)
      `)
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: true })
      .limit(100)

    if (ticketsError) {
      throw new Error(`Erro ao buscar tickets: ${ticketsError.message}`)
    }

    console.log(`📋 Encontrados ${tickets?.length || 0} tickets para verificar`)

    if (!tickets || tickets.length === 0) {
      console.log('✅ Nenhum ticket encontrado para escalação')
      return
    }

    // Buscar regras de escalação ativas
    const { data: rules, error: rulesError } = await supabase
      .from('escalation_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (rulesError) {
      throw new Error(`Erro ao buscar regras de escalação: ${rulesError.message}`)
    }

    console.log(`⚙️ Encontradas ${rules?.length || 0} regras de escalação ativas`)

    if (!rules || rules.length === 0) {
      console.log('✅ Nenhuma regra de escalação encontrada')
      return
    }

    let processedCount = 0
    let escalatedCount = 0
    let errorCount = 0

    // Processar cada ticket
    for (const ticket of tickets) {
      try {
        processedCount++
        console.log(`\n🔍 Verificando ticket #${ticket.id} (${ticket.title})`)

        let ticketEscalated = false

        // Verificar cada regra
        for (const rule of rules) {
          try {
            // Verificar se a regra se aplica ao ticket
            const shouldExecute = await shouldExecuteEscalation(rule, ticket)
            
            if (shouldExecute.shouldExecute) {
              console.log(`⚡ Executando escalação: ${rule.name}`)
              
              // Executar ações da regra
              const success = await executeEscalationActions(rule, ticket)
              
              if (success) {
                // Log da execução
                await logEscalationExecution(rule, ticket, shouldExecute.escalationType, shouldExecute.timeElapsed, true)
                
                console.log(`✅ Escalação executada: ${rule.name}`)
                ticketEscalated = true
              }
            }
          } catch (ruleError) {
            console.error(`❌ Erro ao executar regra ${rule.name}:`, ruleError.message)
            errorCount++
          }
        }

        if (ticketEscalated) {
          escalatedCount++
        }

      } catch (ticketError) {
        console.error(`❌ Erro ao processar ticket ${ticket.id}:`, ticketError.message)
        errorCount++
      }
    }

    console.log(`\n📊 Resumo da execução:`)
    console.log(`   • Tickets processados: ${processedCount}`)
    console.log(`   • Tickets escalados: ${escalatedCount}`)
    console.log(`   • Erros encontrados: ${errorCount}`)
    console.log(`✅ Execução de escalações concluída`)

  } catch (error) {
    console.error('❌ Erro geral na execução de escalações:', error.message)
    process.exit(1)
  }
}

async function shouldExecuteEscalation(rule, ticket) {
  // Implementação simplificada para o script
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
  if (rule.conditions.status && ticket.status !== rule.conditions.status) {
    return { shouldExecute: false, escalationType: 'conditions_not_met', timeElapsed }
  }

  if (rule.conditions.priority && ticket.priority !== rule.conditions.priority) {
    return { shouldExecute: false, escalationType: 'conditions_not_met', timeElapsed }
  }

  if ('assigned_to' in rule.conditions) {
    if (rule.conditions.assigned_to === null && ticket.assigned_to !== null) {
      return { shouldExecute: false, escalationType: 'conditions_not_met', timeElapsed }
    }
    if (rule.conditions.assigned_to !== null && ticket.assigned_to !== rule.conditions.assigned_to) {
      return { shouldExecute: false, escalationType: 'conditions_not_met', timeElapsed }
    }
  }

  // Verificar tempo
  if (timeElapsed < thresholdMinutes) {
    return { shouldExecute: false, escalationType: 'time_not_exceeded', timeElapsed }
  }

  return {
    shouldExecute: true,
    escalationType: rule.time_condition,
    timeElapsed
  }
}

async function executeEscalationActions(rule, ticket) {
  try {
    const actions = rule.actions
    const updateData = {}
    let shouldUpdate = false

    // Aumentar prioridade
    if (actions.increase_priority) {
      const newPriority = increasePriority(ticket.priority)
      if (newPriority && newPriority !== ticket.priority) {
        updateData.priority = newPriority
        shouldUpdate = true
        console.log(`   📈 Prioridade aumentada: ${ticket.priority} → ${newPriority}`)
      }
    }

    // Atribuir automaticamente
    if (actions.auto_assign && !ticket.assigned_to) {
      const autoAssignUser = await getAutoAssignUser(ticket)
      if (autoAssignUser) {
        updateData.assigned_to = autoAssignUser
        shouldUpdate = true
        console.log(`   👤 Ticket atribuído automaticamente`)
      }
    }

    // Atualizar ticket se houver mudanças
    if (shouldUpdate) {
      updateData.updated_at = new Date().toISOString()
      
      const { error: updateError } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticket.id)

      if (updateError) {
        console.error('   ❌ Erro ao atualizar ticket:', updateError.message)
        throw new Error(`Falha ao atualizar ticket: ${updateError.message}`)
      }
    }

    // Adicionar comentário
    if (actions.add_comment) {
      await addEscalationComment(ticket, actions.add_comment)
      console.log(`   💬 Comentário adicionado`)
    }

    // Notificações (implementação básica para o script)
    if (actions.notify_supervisor) {
      console.log(`   🔔 Supervisor seria notificado`)
    }

    if (actions.escalate_to_management) {
      console.log(`   📢 Gerência seria notificada`)
    }

    return true
  } catch (error) {
    console.error('   ❌ Erro ao executar ações:', error.message)
    throw error
  }
}

function increasePriority(currentPriority) {
  const priorityOrder = ['low', 'medium', 'high', 'critical']
  const currentIndex = priorityOrder.indexOf(currentPriority)
  
  if (currentIndex === -1 || currentIndex === priorityOrder.length - 1) {
    return null // Já é a prioridade mais alta
  }
  
  return priorityOrder[currentIndex + 1]
}

async function getAutoAssignUser(ticket) {
  try {
    // Buscar usuários disponíveis (analysts e admins)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, role')
      .in('role', ['analyst', 'admin'])
      .eq('is_active', true)
      .limit(5)

    if (error || !users || users.length === 0) {
      return null
    }

    // Por simplicidade, retorna o primeiro usuário encontrado
    return users[0].id
  } catch (error) {
    console.error('Erro ao buscar usuário para auto-atribuição:', error.message)
    return null
  }
}

async function addEscalationComment(ticket, comment) {
  try {
    const { error } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id: ticket.id,
        user_id: ticket.created_by,
        content: comment,
        is_internal: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Erro ao adicionar comentário de escalação:', error.message)
    }
  } catch (error) {
    console.error('Erro ao adicionar comentário de escalação:', error.message)
  }
}

async function logEscalationExecution(rule, ticket, escalationType, timeElapsed, success, errorMessage) {
  try {
    await supabase
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
    console.error('Erro ao registrar log de escalação:', error.message)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  executeEscalations()
    .then(() => {
      console.log('🎉 Script de escalação concluído com sucesso')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error.message)
      process.exit(1)
    })
}

module.exports = { executeEscalations }
