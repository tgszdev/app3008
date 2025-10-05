import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getBrazilTimestamp } from '@/lib/date-utils'
import { createAndSendNotification } from '@/lib/notifications'

type RouteParams = {
  params: Promise<{ id: string }>
}

// PUT - Atualizar status do ticket
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const params = await context.params
    const body = await request.json()
    const { status, resolution_notes } = body

    if (!status) {
      return NextResponse.json({ error: 'Status é obrigatório' }, { status: 400 })
    }

    // BUSCAR STATUS VÁLIDOS DA TABELA
    const { data: validStatuses } = await supabaseAdmin
      .from('ticket_statuses')
      .select('slug')
      .order('order_index', { ascending: true })
    
    const validStatusSlugs = validStatuses?.map(s => s.slug) || []
    
    if (!validStatusSlugs.includes(status)) {
      return NextResponse.json({ 
        error: `Status inválido. Status válidos: ${validStatusSlugs.join(', ')}` 
      }, { status: 400 })
    }

    // Verificar permissões
    const userRole = (session.user as any).role
    if (userRole !== 'admin' && userRole !== 'analyst') {
      return NextResponse.json({ error: 'Apenas staff pode alterar status de tickets' }, { status: 403 })
    }

    // Preparar dados de atualização
    const updateData: any = {
      status,
      updated_at: getBrazilTimestamp()
    }

    // Se está resolvendo ou fechando, adicionar timestamp e notas
    if (status === 'RESOLVIDO' || status === 'FECHADO') {
      updateData.resolved_at = getBrazilTimestamp()
      if (resolution_notes) {
        updateData.resolution_notes = resolution_notes
      }
    }

    // Se está fechando, adicionar timestamp de fechamento
    if (status === 'FECHADO') {
      updateData.closed_at = getBrazilTimestamp()
    }

    // Atualizar o ticket
    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 })
    }

    // Atualizar SLA se o ticket foi resolvido
    if (status === 'RESOLVIDO' || status === 'FECHADO') {
      try {
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/sla/ticket/${params.id}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            action: 'resolved',
            timestamp: updateData.resolved_at
          })
        })
        
        if (!response.ok) {
        }
      } catch (slaError) {
      }
    }

    // Criar log de auditoria
    try {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: session.user?.id,
          action: 'ticket_status_updated',
          entity_type: 'ticket',
          entity_id: params.id,
          details: {
            old_status: ticket.status,
            new_status: status,
            resolution_notes
          }
        })
    } catch (logError) {
    }

    // ✨ NOVO: Enviar notificação de mudança de status
    try {
      // Buscar dados completos do ticket para notificação
      const { data: fullTicket } = await supabaseAdmin
        .from('tickets')
        .select(`
          id,
          ticket_number,
          title,
          priority,
          status,
          created_by,
          assigned_to,
          created_by_user:created_by(name, email),
          assigned_to_user:assigned_to(name, email)
        `)
        .eq('id', params.id)
        .single()
      
      if (fullTicket) {
        // Notificar criador do ticket (se não for quem mudou)
        if (fullTicket.created_by && fullTicket.created_by !== session.user?.id) {
          await createAndSendNotification({
            user_id: fullTicket.created_by,
            type: 'ticket_status_changed',
            title: `🔄 Status alterado - Chamado #${fullTicket.ticket_number}`,
            message: `O status do chamado "${fullTicket.title}" foi alterado para: ${status}`,
            action_url: `/dashboard/tickets/${fullTicket.id}`,
            data: {
              ticket_id: fullTicket.id,
              ticket_number: fullTicket.ticket_number,
              ticket_title: fullTicket.title,
              ticket_priority: fullTicket.priority,
              old_status: ticket.status,
              new_status: status,
              changed_by: (session.user as any).name,
              resolution_notes
            }
          })
        }
        
        // Notificar responsável (se houver e não for quem mudou)
        if (fullTicket.assigned_to && 
            fullTicket.assigned_to !== session.user?.id && 
            fullTicket.assigned_to !== fullTicket.created_by) {
          await createAndSendNotification({
            user_id: fullTicket.assigned_to,
            type: 'ticket_status_changed',
            title: `🔄 Status alterado - Chamado #${fullTicket.ticket_number}`,
            message: `O status do chamado "${fullTicket.title}" foi alterado para: ${status}`,
            action_url: `/dashboard/tickets/${fullTicket.id}`,
            data: {
              ticket_id: fullTicket.id,
              ticket_number: fullTicket.ticket_number,
              ticket_title: fullTicket.title,
              ticket_priority: fullTicket.priority,
              old_status: ticket.status,
              new_status: status,
              changed_by: (session.user as any).name,
              resolution_notes
            }
          })
        }
        
        console.log(`✅ Notificações de mudança de status enviadas para ticket #${fullTicket.ticket_number}`)
      }
    } catch (notificationError) {
      console.error('⚠️ Erro ao enviar notificação de status (não crítico):', notificationError)
    }

    return NextResponse.json(ticket)
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}