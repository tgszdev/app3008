import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

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

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    // Verificar permissões
    const userRole = (session.user as any).role
    if (userRole !== 'admin' && userRole !== 'analyst') {
      return NextResponse.json({ error: 'Apenas staff pode alterar status de tickets' }, { status: 403 })
    }

    // Preparar dados de atualização
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    // Se está resolvendo ou fechando, adicionar timestamp e notas
    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_at = new Date().toISOString()
      if (resolution_notes) {
        updateData.resolution_notes = resolution_notes
      }
    }

    // Se está fechando, adicionar timestamp de fechamento
    if (status === 'closed') {
      updateData.closed_at = new Date().toISOString()
    }

    // Atualizar o ticket
    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar status:', error)
      return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 })
    }

    // Atualizar SLA se o ticket foi resolvido
    if (status === 'resolved' || status === 'closed') {
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
          console.error('Erro na resposta do SLA:', await response.text())
        }
      } catch (slaError) {
        console.error('Erro ao atualizar SLA:', slaError)
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
      console.error('Erro ao criar log de auditoria:', logError)
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}