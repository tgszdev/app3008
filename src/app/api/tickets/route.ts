import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'
import { createAndSendNotification } from '@/lib/notifications'
import { executeWorkflowsForTicket } from '@/lib/workflow-engine'
import { executeEscalationForTicketSimple } from '@/lib/escalation-engine-simple'
import { getBrazilTimestamp } from '@/lib/date-utils'

// GET - Listar todos os tickets
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    // Obter role do usuário e contexto
    const userRole = (session.user as any).role || 'user'
    const userId = session.user?.id
    const userType = (session.user as any).userType
    const userContextId = (session.user as any).context_id
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const userIdFilter = searchParams.get('userId')
    const assignedTo = searchParams.get('assignedTo')
    const contextIds = searchParams.get('context_ids')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const myTickets = searchParams.get('myTickets') // Filtro "Meus Chamados"

    let query = supabaseAdmin
      .from('tickets')
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email),
        assigned_to_user:users!tickets_assigned_to_fkey(id, name, email),
        category_info:categories!tickets_category_id_fkey(id, name, slug, color, icon),
        context_info:contexts!tickets_context_id_fkey(id, name, slug),
        comments:ticket_comments(count),
        ticket_history:ticket_history(
          id,
          action_type,
          field_changed,
          old_value,
          new_value,
          created_at,
          user_id
        )
      `)

    // IMPORTANTE: Filtrar por contexto e tickets internos ANTES de outros filtros
    if (userType === 'context' && userContextId) {
      // Usuários de contexto só veem tickets do seu contexto
      query = query.eq('context_id', userContextId)
    } else if (userRole === 'user' && userId) {
      // Users da matriz só veem:
      // 1. Tickets não internos (is_internal = false ou null)
      // 2. OU tickets criados por eles mesmos (mesmo se internos)
      query = query.or(`and(is_internal.eq.false),and(is_internal.is.null),and(created_by.eq.${userId})`)
    }
    // Admin e analyst da matriz veem todos os tickets (não aplicar filtro)
    
    query = query.order('created_at', { ascending: false })

    // Aplicar filtros
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority)
    }
    if (userIdFilter) {
      query = query.eq('created_by', userIdFilter)
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }
    
    // Filtro por context_ids (clientes selecionados)
    if (contextIds) {
      const contextIdArray = contextIds.split(',').filter(Boolean)
      if (contextIdArray.length > 0) {
        console.log('🔍 Filtrando por context_ids:', contextIdArray)
        query = query.in('context_id', contextIdArray)
      }
    }

    // Filtro por período
    if (startDate && endDate) {
      console.log('🔍 Filtrando por período:', { startDate, endDate })
      // Não usar 'Z' (UTC) - deixar o banco usar seu timezone configurado (America/Sao_Paulo)
      query = query.gte('created_at', startDate + 'T00:00:00').lte('created_at', endDate + 'T23:59:59.999')
    }

    // Filtro "Meus Chamados" (criador OU responsável)
    if (myTickets) {
      console.log('🔍 Filtrando "Meus Chamados" (criador OU responsável):', myTickets)
      query = query.or(`created_by.eq.${myTickets},assigned_to.eq.${myTickets}`)
    }

    const { data: tickets, error } = await query

    if (error) {
      console.error('Erro ao buscar tickets:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filtro adicional para garantir que usuários comuns não vejam tickets internos
    let filteredTickets = tickets || []
    if (userRole === 'user' && userId) {
      filteredTickets = filteredTickets.filter(ticket => {
        // Permite ver ticket se:
        // 1. Não é interno (is_internal é false ou null/undefined)
        // 2. OU foi criado pelo próprio usuário
        return !ticket.is_internal || ticket.created_by === userId
      })
    }

    // Formatar resposta
    const formattedTickets = filteredTickets.map(ticket => ({
      ...ticket,
      created_by_user: ticket.created_by_user || null,
      assigned_to_user: ticket.assigned_to_user || null,
      comment_count: ticket.comments?.[0]?.count || 0
    }))

    return NextResponse.json(formattedTickets)
  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar novo ticket
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    // Obter dados do usuário autenticado
    const userRole = (session.user as any).role || 'user'
    const userId = session.user?.id
    const userType = (session.user as any).userType
    const userContextId = (session.user as any).context_id
    
    const body = await request.json()
    const { title, description, priority, category, category_id, created_by, assigned_to, due_date, is_internal, context_id } = body

    // Validação básica
    if (!title || !description || !created_by) {
      return NextResponse.json(
        { error: 'Título, descrição e criador são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Apenas admin e analyst podem criar tickets internos
    if (is_internal && userRole === 'user') {
      return NextResponse.json(
        { error: 'Apenas administradores e analistas podem criar tickets internos' },
        { status: 403 }
      )
    }

    // GERAR TICKET_NUMBER ÚNICO GLOBALMENTE - USANDO SEQUENCE
    // Usar sequence do PostgreSQL para garantir unicidade e atomicidade
    console.log(`🎫 Gerando ticket_number usando SEQUENCE...`)
    
    const { data: ticketNumber, error: sequenceError } = await supabaseAdmin
      .rpc('get_next_ticket_number')
    
    if (sequenceError) {
      console.error('❌ Erro ao gerar número do ticket via sequence:', sequenceError)
      return NextResponse.json({ error: 'Erro ao gerar número do ticket' }, { status: 500 })
    }
    
    console.log(`✅ Ticket_number gerado via SEQUENCE: ${ticketNumber}`)

    // BUSCAR STATUS PADRÃO DA TABELA
    const { data: defaultStatus } = await supabaseAdmin
      .from('ticket_statuses')
      .select('slug')
      .order('order_index', { ascending: true })
      .limit(1)
      .single()
    
    const defaultStatusSlug = defaultStatus?.slug || 'ABERTO'
    console.log(`🎯 Status padrão definido: ${defaultStatusSlug}`)

    // CRIAR TICKET COM SEQUENCE (SEM RETRY - SEQUENCE É ATÔMICO)
    // Com banco configurado em America/Sao_Paulo, usar new Date() diretamente
    const ticketData: any = {
      title,
      description,
      status: defaultStatusSlug,
      priority: priority || 'medium',
      category: category || 'general', // Manter compatibilidade
      created_by,
      assigned_to,
      due_date,
      is_internal: is_internal || false,
      // Para usuários matriz, usar context_id do body; para usuários de contexto, usar da sessão
      context_id: context_id || userContextId,
      ticket_number: ticketNumber,
      // Deixar Supabase gerenciar created_at automaticamente (usa timezone do banco)
    }

    // Adicionar category_id se fornecido
    if (category_id) {
      ticketData.category_id = category_id
    }

    // ⚡ OTIMIZAÇÃO: Select simplificado (sem joins desnecessários para response rápido)
    const { data: newTicket, error } = await supabaseAdmin
      .from('tickets')
      .insert(ticketData)
      .select('*')
      .single()

    if (error) {
      console.error('Erro ao criar ticket:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('=== DEBUG API CREATE TICKET ===')
    console.log('Ticket criado:', newTicket)
    console.log('ID:', newTicket.id)
    console.log('Título:', newTicket.title)

    // Criar registro inicial no histórico
    // Deixar Supabase gerenciar created_at automaticamente (mesma data do ticket)
    try {
      await supabaseAdmin
        .from('ticket_history')
        .insert({
          ticket_id: newTicket.id,
          user_id: created_by,
          action_type: 'status_changed',
          field_changed: 'status',
          old_value: '',
          new_value: defaultStatusSlug,
          // created_at gerenciado automaticamente pelo Supabase
        })
      console.log('✅ Histórico inicial criado com sucesso')
    } catch (historyError) {
      console.log('⚠️ Erro ao criar histórico (ignorado):', historyError)
    }

    // Enviar notificação para o responsável (se houver)
    if (assigned_to && assigned_to !== created_by) {
      try {
        await createAndSendNotification({
          user_id: assigned_to,
          title: `Novo Chamado #${newTicket.ticket_number || newTicket.id.substring(0, 8)}`,
          message: `Novo chamado criado: ${title}`,
          type: 'ticket_assigned',
          severity: 'info',
          data: {
            ticket_id: newTicket.id,
            ticket_number: newTicket.ticket_number
          },
          action_url: `/dashboard/tickets/${newTicket.id}`
        })
      } catch (notificationError) {
        console.log('Erro ao enviar notificação (ignorado):', notificationError)
      }
    }

    // Notificar administradores sobre novo ticket (opcional)
    try {
      // Buscar administradores
      const { data: admins } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .neq('id', created_by)

      if (admins && admins.length > 0) {
        // ⚡ OTIMIZAÇÃO: Notificar admins em PARALELO (não sequencial)
        await Promise.all(
          admins.map(admin =>
            createAndSendNotification({
              user_id: admin.id,
              title: `Novo Chamado #${newTicket.ticket_number || newTicket.id.substring(0, 8)}`,
              message: `Novo chamado criado: ${title}`,
              type: 'ticket_created',
              severity: 'info',
              data: {
                ticket_id: newTicket.id,
                ticket_number: newTicket.ticket_number
              },
              action_url: `/dashboard/tickets/${newTicket.id}`
            }).catch(err => console.log('Erro ao notificar admin (ignorado):', err))
          )
        )
      }
    } catch (notificationError) {
      console.log('Erro ao notificar admins (ignorado):', notificationError)
    }

    // Executar workflows automáticos
    try {
      console.log(`🔄 Executando workflows para ticket ${newTicket.id}...`)
      const workflowResult = await executeWorkflowsForTicket(newTicket.id)
      console.log(`✅ Workflows executados:`, workflowResult)
    } catch (workflowError) {
      console.log('Erro ao executar workflows (ignorado):', workflowError)
    }

    // ⚡ OTIMIZAÇÃO: Escalação em BACKGROUND (não bloqueia response)
    console.log(`🚨 Iniciando escalação em background para ticket ${newTicket.id}...`)
    executeEscalationForTicketSimple(newTicket.id)
      .then(escalationResult => {
        console.log(`✅ Escalação executada:`, escalationResult)
        
        if (escalationResult.success && escalationResult.executedRules.length > 0) {
          console.log(`📧 Processando e-mails de escalação para ticket ${newTicket.id}...`)
          return fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ithostbr.tech'}/api/escalation/process-emails`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Auto-Escalation-Integration/1.0'
            }
          })
        }
      })
      .then(emailResponse => {
        if (emailResponse?.ok) {
          return emailResponse.json()
        }
      })
      .then(emailResult => {
        if (emailResult) {
          console.log(`✅ E-mails de escalação processados:`, emailResult.message)
        }
      })
      .catch(err => console.log('Erro na escalação em background (ignorado):', err))

    return NextResponse.json(newTicket, { status: 201 })
  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar ticket (mesma funcionalidade que PATCH)
export async function PUT(request: NextRequest) {
  return handleUpdate(request)
}

// PATCH - Atualizar ticket
export async function PATCH(request: NextRequest) {
  return handleUpdate(request)
}

// Função compartilhada para atualização
async function handleUpdate(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const userType = (session.user as any).userType
    const userContextId = (session.user as any).context_id
    
    const body = await request.json()
    const { id, updated_by, user_id, ...updateData } = body
    
    // Aceitar tanto updated_by quanto user_id
    const userId = updated_by || user_id

    if (!id) {
      return NextResponse.json(
        { error: 'ID do ticket é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar ticket atual para comparar mudanças
    const { data: currentTicket, error: fetchError } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentTicket) {
      return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 })
    }

    // Verificar se o usuário tem permissão para editar este ticket
    if (userType === 'context' && userContextId && currentTicket.context_id !== userContextId) {
      return NextResponse.json({ error: 'Acesso negado - ticket de outro contexto' }, { status: 403 })
    }

    // Remover campos que não devem ser atualizados diretamente
    delete updateData.id
    delete updateData.created_at
    delete updateData.ticket_number

    // Adicionar timestamps de resolução/fechamento se necessário
    if (updateData.status === 'resolved' && currentTicket?.status !== 'resolved') {
      updateData.resolved_at = getBrazilTimestamp()
    }
    if (updateData.status === 'closed' && currentTicket?.status !== 'closed') {
      updateData.closed_at = getBrazilTimestamp()
    }

    // Adicionar updated_at
    updateData.updated_at = getBrazilTimestamp()

    const { data: updatedTicket, error } = await supabaseAdmin
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email),
        assigned_to_user:users!tickets_assigned_to_fkey(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Erro ao atualizar ticket:', error)
      
      // Se for erro de foreign key, tentar atualizar sem as relações
      if (error.message.includes('relationship')) {
        const { data: simpleUpdate, error: simpleError } = await supabaseAdmin
          .from('tickets')
          .update(updateData)
          .eq('id', id)
          .select('*')
          .single()
        
        if (simpleError) {
          console.error('Erro ao atualizar (simples):', simpleError)
          return NextResponse.json({ error: simpleError.message }, { status: 500 })
        }
        
        return NextResponse.json(simpleUpdate)
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Registrar mudanças no histórico
    const changes: any[] = []
    
    // Usar fuso horário de São Paulo para histórico
    const nowBrazil = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
    const historyTimestamp = new Date(nowBrazil).toISOString()
    
    if (currentTicket) {
      Object.keys(updateData).forEach(key => {
        if (key !== 'updated_at' && currentTicket[key] !== updateData[key]) {
          changes.push({
            ticket_id: id,
            user_id: userId || currentTicket.created_by,
            action_type: key === 'status' ? 'status_changed' : 'updated',
            field_changed: key,
            old_value: String(currentTicket[key] || ''),
            new_value: String(updateData[key] || ''),
            created_at: historyTimestamp
          })
        }
      })

      // Histórico gerenciado automaticamente por TRIGGER no banco
      // Removido insert manual para evitar duplicação
      
      if (changes.length > 0) {
        console.log('📝 Mudanças detectadas (histórico via trigger):', changes.length)
        
        // Enviar notificações baseadas nas mudanças
        try {
          // Notificar se o ticket foi atribuído a alguém
          if (updateData.assigned_to && updateData.assigned_to !== currentTicket.assigned_to) {
            await createAndSendNotification({
              user_id: updateData.assigned_to,
              title: `Chamado #${currentTicket.ticket_number || currentTicket.id.substring(0, 8)} atribuído a você`,
              message: `O chamado "${currentTicket.title}" foi atribuído a você`,
              type: 'ticket_assigned',
              severity: 'info',
              data: {
                ticket_id: id,
                ticket_number: currentTicket.ticket_number
              },
              action_url: `/dashboard/tickets/${id}`
            })
          }

          // Notificar o criador se o status mudou
          if (updateData.status && updateData.status !== currentTicket.status && currentTicket.created_by) {
            let notificationTitle = ''
            let notificationSeverity: 'info' | 'success' | 'warning' | 'error' = 'info'
            
            switch (updateData.status) {
              case 'in_progress':
                notificationTitle = `Chamado #${currentTicket.ticket_number || currentTicket.id.substring(0, 8)} em andamento`
                break
              case 'resolved':
                notificationTitle = `Chamado #${currentTicket.ticket_number || currentTicket.id.substring(0, 8)} foi resolvido`
                notificationSeverity = 'success'
                break
              case 'closed':
                notificationTitle = `Chamado #${currentTicket.ticket_number || currentTicket.id.substring(0, 8)} foi fechado`
                notificationSeverity = 'info'
                break
              case 'on_hold':
                notificationTitle = `Chamado #${currentTicket.ticket_number || currentTicket.id.substring(0, 8)} em espera`
                notificationSeverity = 'warning'
                break
              default:
                notificationTitle = `Chamado #${currentTicket.ticket_number || currentTicket.id.substring(0, 8)} atualizado`
            }

            await createAndSendNotification({
              user_id: currentTicket.created_by,
              title: notificationTitle,
              message: `Status do chamado "${currentTicket.title}" foi alterado para ${updateData.status}`,
              type: 'ticket_status_changed',
              severity: notificationSeverity,
              data: {
                ticket_id: id,
                ticket_number: currentTicket.ticket_number,
                old_status: currentTicket.status,
                new_status: updateData.status
              },
              action_url: `/dashboard/tickets/${id}`
            })
          }

          // Notificar sobre mudança de prioridade
          if (updateData.priority && updateData.priority !== currentTicket.priority && currentTicket.created_by) {
            const priorityMap: Record<string, string> = {
              low: 'Baixa',
              medium: 'Média',
              high: 'Alta',
              urgent: 'Urgente'
            }
            
            await createAndSendNotification({
              user_id: currentTicket.created_by,
              title: `Prioridade do Chamado #${currentTicket.ticket_number || currentTicket.id.substring(0, 8)} alterada`,
              message: `Prioridade alterada de ${priorityMap[currentTicket.priority as string] || currentTicket.priority} para ${priorityMap[updateData.priority as string] || updateData.priority}`,
              type: 'ticket_priority_changed',
              severity: updateData.priority === 'urgent' ? 'warning' : 'info',
              data: {
                ticket_id: id,
                ticket_number: currentTicket.ticket_number,
                old_priority: currentTicket.priority,
                new_priority: updateData.priority
              },
              action_url: `/dashboard/tickets/${id}`
            })
          }
        } catch (notificationError) {
          console.log('Erro ao enviar notificações (ignorado):', notificationError)
        }
      }

      // Executar workflows automáticos após atualização
      if (changes.length > 0) {
        try {
          console.log(`🔄 Executando workflows para ticket atualizado ${id}...`)
          const workflowResult = await executeWorkflowsForTicket(id)
          console.log(`✅ Workflows executados após atualização:`, workflowResult)
        } catch (workflowError) {
          console.log('Erro ao executar workflows após atualização (ignorado):', workflowError)
        }

        // Executar escalação automática após atualização (versão simplificada)
        try {
          console.log(`🚨 Executando escalação para ticket atualizado ${id}...`)
          const escalationResult = await executeEscalationForTicketSimple(id)
          console.log(`✅ Escalação executada após atualização:`, escalationResult)
          
          // Processar e-mails de escalação automaticamente
          if (escalationResult.success && escalationResult.executedRules.length > 0) {
            try {
              console.log(`📧 Processando e-mails de escalação para ticket atualizado ${id}...`)
              const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ithostbr.tech'}/api/escalation/process-emails`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'User-Agent': 'Auto-Escalation-Integration/1.0'
                }
              })
              
              if (emailResponse.ok) {
                const emailResult = await emailResponse.json()
                console.log(`✅ E-mails de escalação processados após atualização:`, emailResult.message)
              } else {
                console.error(`❌ Erro ao processar e-mails de escalação após atualização: HTTP ${emailResponse.status}`)
              }
            } catch (emailError) {
              console.error('Erro ao processar e-mails de escalação após atualização (ignorado):', emailError)
            }
          }
        } catch (escalationError) {
          console.log('Erro ao executar escalação após atualização (ignorado):', escalationError)
        }
      }
    }

    return NextResponse.json(updatedTicket)
  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Excluir ticket
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const userType = (session.user as any).userType
    const userContextId = (session.user as any).context_id
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID do ticket é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o ticket existe e se o usuário tem permissão para excluí-lo
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('context_id')
      .eq('id', id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 })
    }

    // Verificar se o usuário tem permissão para excluir este ticket
    if (userType === 'context' && userContextId && ticket.context_id !== userContextId) {
      return NextResponse.json({ error: 'Acesso negado - ticket de outro contexto' }, { status: 403 })
    }

    // Verificar se existem apontamentos vinculados (exceto rejeitados)
    const { data: timesheets, error: timesheetsError } = await supabaseAdmin
      .from('timesheets')
      .select('id, status')
      .eq('ticket_id', id)
      .in('status', ['pending', 'approved'])

    if (timesheetsError) {
      console.error('Erro ao verificar apontamentos:', timesheetsError)
      return NextResponse.json(
        { error: 'Erro ao verificar apontamentos do ticket' },
        { status: 500 }
      )
    }

    // Se houver apontamentos aprovados ou pendentes, impedir exclusão
    if (timesheets && timesheets.length > 0) {
      const approvedCount = timesheets.filter(t => t.status === 'approved').length
      const pendingCount = timesheets.filter(t => t.status === 'pending').length
      
      let message = 'Não é possível excluir este chamado pois existem '
      const parts = []
      
      if (approvedCount > 0) {
        parts.push(`${approvedCount} apontamento${approvedCount > 1 ? 's' : ''} aprovado${approvedCount > 1 ? 's' : ''}`)
      }
      
      if (pendingCount > 0) {
        parts.push(`${pendingCount} apontamento${pendingCount > 1 ? 's' : ''} pendente${pendingCount > 1 ? 's' : ''}`)
      }
      
      message += parts.join(' e ') + ' vinculado' + (timesheets.length > 1 ? 's' : '') + ' a ele.'
      
      return NextResponse.json(
        { 
          error: message,
          details: {
            approved: approvedCount,
            pending: pendingCount,
            total: timesheets.length
          }
        },
        { status: 400 }
      )
    }

    // Se não houver apontamentos impeditivos, prosseguir com a exclusão
    const { error } = await supabaseAdmin
      .from('tickets')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir ticket:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export const runtime = 'nodejs'