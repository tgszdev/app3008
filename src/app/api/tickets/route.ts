import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'
import { createAndSendNotification } from '@/lib/notifications'

// GET - Listar todos os tickets
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    // Obter role do usuário
    const userRole = (session.user as any).role || 'user'
    const userId = session.user?.id
    
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
      .order('created_at', { ascending: false })

    // Filtrar tickets internos para usuários comuns
    if (userRole === 'user') {
      // Users só veem tickets não internos ou criados por eles
      query = query.or(`is_internal.eq.false,is_internal.is.null,created_by.eq.${userId}`)
    }
    // Admin e analyst veem todos os tickets

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

    // Formatar resposta
    const formattedTickets = tickets?.map(ticket => ({
      ...ticket,
      created_by_user: ticket.created_by_user || null,
      assigned_to_user: ticket.assigned_to_user || null,
      comment_count: ticket.comments?.[0]?.count || 0
    })) || []

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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
          action: 'created',
          created_at: new Date().toISOString()
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
    const { data: currentTicket } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single()

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
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID do ticket é obrigatório' },
        { status: 400 }
      )
    }

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