import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'
import { createAndSendNotification } from '@/lib/notifications'
import { executeWorkflowsForTicket } from '@/lib/workflow-engine'
import { executeEscalationForTicketSimple } from '@/lib/escalation-engine-simple'

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

    let query = supabaseAdmin
      .from('tickets')
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email),
        assigned_to_user:users!tickets_assigned_to_fkey(id, name, email),
        category_info:categories!tickets_category_id_fkey(id, name, slug, color, icon),
        comments:ticket_comments(count)
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
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const userRole = (session.user as any).role || 'user'
    const userType = (session.user as any).userType
    const userContextId = (session.user as any).context_id
    
    const body = await request.json()
    const { title, description, priority, category, category_id, created_by, assigned_to, due_date, is_internal } = body

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

    // GERAR TICKET_NUMBER ÚNICO GLOBALMENTE
    let ticketNumber: string
    let attempts = 0
    const maxAttempts = 10
    
    do {
      // Buscar o último ticket_number para gerar o próximo
      const { data: lastTicket, error: lastTicketError } = await supabaseAdmin
        .from('tickets')
        .select('ticket_number')
        .order('ticket_number', { ascending: false })
        .limit(1)
        .single()
      
      if (lastTicketError && lastTicketError.code !== 'PGRST116') {
        console.error('Erro ao buscar último ticket:', lastTicketError)
        return NextResponse.json({ error: 'Erro ao gerar número do ticket' }, { status: 500 })
      }
      
      // Se não há tickets, começar do 1
      if (!lastTicket || !lastTicket.ticket_number) {
        ticketNumber = '1'
        console.log(`🔍 Debug - Primeiro ticket, começando do 1`)
      } else {
        // Verificar se ticket_number é string e extrair número sequencial
        const ticketNumberStr = String(lastTicket.ticket_number || '')
        console.log(`🔍 Debug - lastTicket:`, lastTicket)
        console.log(`🔍 Debug - ticketNumberStr:`, ticketNumberStr)
        
        if (ticketNumberStr && typeof ticketNumberStr === 'string') {
          const lastNumber = parseInt(ticketNumberStr.replace(/\D/g, '')) || 0
          ticketNumber = (lastNumber + 1).toString()
          console.log(`🔍 Debug - lastNumber: ${lastNumber}, nextNumber: ${ticketNumber}`)
        } else {
          // Se ticket_number não é string válida, começar do 1
          ticketNumber = '1'
          console.log(`🔍 Debug - ticket_number inválido, começando do 1`)
        }
      }
      
      // Verificar se o número já existe (proteção contra race conditions)
      const { data: existingTicket, error: checkError } = await supabaseAdmin
        .from('tickets')
        .select('id')
        .eq('ticket_number', ticketNumber)
        .limit(1)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erro ao verificar ticket_number existente:', checkError)
        return NextResponse.json({ error: 'Erro ao verificar número do ticket' }, { status: 500 })
      }
      
      // Se não existe, podemos usar este número
      if (!existingTicket) {
        break
      }
      
      attempts++
      if (attempts >= maxAttempts) {
        return NextResponse.json({ error: 'Não foi possível gerar número único para o ticket' }, { status: 500 })
      }
      
      // Aguardar um pouco antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } while (attempts < maxAttempts)
    
    console.log(`🎫 Gerando ticket_number: ${ticketNumber}`)

    // Criar ticket com suporte para category_id
    const ticketData: any = {
      title,
      description,
      status: 'open',
      priority: priority || 'medium',
      category: category || 'general', // Manter compatibilidade
      created_by,
      assigned_to,
      due_date,
      is_internal: is_internal || false, // Adicionar campo is_internal
      context_id: userContextId, // Adicionar contexto do usuário
      ticket_number: ticketNumber, // ADICIONAR TICKET_NUMBER GERADO
      // Deixar o Supabase gerenciar as datas automaticamente
    }

    // Adicionar category_id se fornecido
    if (category_id) {
      ticketData.category_id = category_id
    }

    const { data: newTicket, error } = await supabaseAdmin
      .from('tickets')
      .insert(ticketData)
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email),
        assigned_to_user:users!tickets_assigned_to_fkey(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Erro ao criar ticket:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('=== DEBUG API CREATE TICKET ===')
    console.log('Ticket criado:', newTicket)
    console.log('ID:', newTicket.id)
    console.log('Título:', newTicket.title)

    // Criar registro no histórico (ignorar erros)
    try {
      await supabaseAdmin
        .from('ticket_history')
        .insert({
          ticket_id: newTicket.id,
          user_id: created_by,
          action: 'created'
          // Remover created_at - deixar o Supabase gerenciar automaticamente
        })
    } catch (historyError) {
      console.log('Erro ao criar histórico (ignorado):', historyError)
    }

    // Enviar notificação para o responsável (se houver)
    if (assigned_to && assigned_to !== created_by) {
      try {
        await createAndSendNotification({
          user_id: assigned_to,
          title: `Novo Chamado #${newTicket.ticket_number || newTicket.id.substring(0, 8)}`,
          message: `${newTicket.created_by_user?.name || 'Usuário'} criou um novo chamado: ${title}`,
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
        for (const admin of admins) {
          await createAndSendNotification({
            user_id: admin.id,
            title: `Novo Chamado #${newTicket.ticket_number || newTicket.id.substring(0, 8)}`,
            message: `${newTicket.created_by_user?.name || 'Usuário'} criou um novo chamado: ${title}`,
            type: 'ticket_created',
            severity: 'info',
            data: {
              ticket_id: newTicket.id,
              ticket_number: newTicket.ticket_number
            },
            action_url: `/dashboard/tickets/${newTicket.id}`
          })
        }
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

    // Executar escalação automática (versão simplificada)
    try {
      console.log(`🚨 Executando escalação para ticket ${newTicket.id}...`)
      const escalationResult = await executeEscalationForTicketSimple(newTicket.id)
      console.log(`✅ Escalação executada:`, escalationResult)
      
      // Processar e-mails de escalação automaticamente
      if (escalationResult.success && escalationResult.executedRules.length > 0) {
        try {
          console.log(`📧 Processando e-mails de escalação para ticket ${newTicket.id}...`)
          const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ithostbr.tech'}/api/escalation/process-emails`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Auto-Escalation-Integration/1.0'
            }
          })
          
          if (emailResponse.ok) {
            const emailResult = await emailResponse.json()
            console.log(`✅ E-mails de escalação processados:`, emailResult.message)
          } else {
            console.error(`❌ Erro ao processar e-mails de escalação: HTTP ${emailResponse.status}`)
          }
        } catch (emailError) {
          console.error('Erro ao processar e-mails de escalação (ignorado):', emailError)
        }
      }
    } catch (escalationError) {
      console.log('Erro ao executar escalação (ignorado):', escalationError)
    }

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
      updateData.resolved_at = new Date().toISOString()
    }
    if (updateData.status === 'closed' && currentTicket?.status !== 'closed') {
      updateData.closed_at = new Date().toISOString()
    }

    // Adicionar updated_at
    updateData.updated_at = new Date().toISOString()

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
    
    if (currentTicket) {
      Object.keys(updateData).forEach(key => {
        if (key !== 'updated_at' && currentTicket[key] !== updateData[key]) {
          changes.push({
            ticket_id: id,
            user_id: userId || currentTicket.created_by,
            action: 'updated',
            field_name: key,
            old_value: String(currentTicket[key] || ''),
            new_value: String(updateData[key] || ''),
            created_at: new Date().toISOString()
          })
        }
      })

      if (changes.length > 0) {
        await supabaseAdmin.from('ticket_history').insert(changes)

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