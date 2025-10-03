import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'
import { userHasPermission } from '@/lib/permissions'

// GET - Buscar histórico do ticket
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const ticketId = params.id
    const userId = session.user.id
    const userRole = (session.user as any).role || 'user'


    // Verificar se o usuário tem permissão para ver histórico
    let canViewHistory = false
    try {
      canViewHistory = await userHasPermission(userRole, 'tickets_view_history')
    } catch (permError) {
      // Fallback: permitir para admin, analyst, dev
      canViewHistory = ['admin', 'analyst', 'dev'].includes(userRole)
    }
    
    if (!canViewHistory) {
      return NextResponse.json({ 
        error: 'Você não tem permissão para visualizar o histórico de tickets' 
      }, { status: 403 })
    }

    // Verificar se o ticket existe e se o usuário pode acessá-lo
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('id, created_by, assigned_to, title, created_at')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 })
    }

    // Verificar permissões de acesso ao ticket
    const isAdmin = userRole === 'admin'
    const isAnalyst = userRole === 'analyst' 
    const isDev = userRole === 'dev'
    const isOwner = ticket.created_by === userId
    const isAssigned = ticket.assigned_to === userId

    if (!isAdmin && !isAnalyst && !isDev && !isOwner && !isAssigned) {
      return NextResponse.json({ 
        error: 'Você não tem permissão para acessar este ticket' 
      }, { status: 403 })
    }

    // Tentar buscar histórico do ticket
    let history = []
    try {
      const { data: historyData, error: historyError } = await supabaseAdmin
        .from('ticket_history')
        .select(`
          id,
          action_type,
          field_changed,
          old_value,
          new_value,
          description,
          metadata,
          created_at,
          user:users!fk_ticket_history_user_id(id, name, email, avatar_url)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false })

      if (historyError) {
        
        // Fallback: criar entrada de histórico simulada
        history = [{
          id: 'fallback-created',
          action_type: 'created',
          field_changed: 'status',
          old_value: null,
          new_value: 'open',
          description: 'Ticket criado',
          metadata: { fallback: true },
          created_at: ticket.created_at,
          user: {
            id: 'system',
            name: 'Sistema',
            email: 'sistema@local',
            avatar_url: null
          },
          actionIcon: 'plus-circle',
          actionColor: 'green',
          formattedOldValue: '',
          formattedNewValue: 'Aberto'
        }]
      } else {
        history = historyData || []
      }
    } catch (error) {
      // Fallback para erro de conexão
      history = [{
        id: 'fallback-created',
        action_type: 'created',
        field_changed: 'status',
        old_value: null,
        new_value: 'open',
        description: 'Ticket criado (histórico limitado - tabela não configurada)',
        metadata: { fallback: true },
        created_at: ticket.created_at,
        user: {
          id: 'system',
          name: 'Sistema',
          email: 'sistema@local',
          avatar_url: null
        },
        actionIcon: 'plus-circle',
        actionColor: 'green',
        formattedOldValue: '',
        formattedNewValue: 'Aberto'
      }]
    }

    // Processar histórico para melhor apresentação
    const processedHistory = history?.map(entry => ({
      id: entry.id || 'unknown',
      action_type: entry.action_type || 'created',
      field_changed: entry.field_changed || 'status',
      old_value: entry.old_value,
      new_value: entry.new_value,
      description: entry.description || 'Ação realizada',
      metadata: entry.metadata || {},
      created_at: entry.created_at || new Date().toISOString(),
      user: entry.user || {
        id: 'system',
        name: 'Sistema',
        email: 'sistema@local',
        avatar_url: null
      },
      // Adicionar ícone e cor baseado no tipo de ação
      actionIcon: getActionIcon(entry.action_type || 'created'),
      actionColor: getActionColor(entry.action_type || 'created'),
      // Formatar valores para melhor apresentação
      formattedOldValue: formatValue(entry.field_changed, entry.old_value),
      formattedNewValue: formatValue(entry.field_changed, entry.new_value)
    })) || []

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        title: ticket.title
      },
      history: processedHistory,
      total: processedHistory.length
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

// Função auxiliar para obter ícone da ação
function getActionIcon(actionType: string): string {
  const icons: Record<string, string> = {
    'created': 'plus-circle',
    'status_changed': 'refresh-cw',
    'priority_changed': 'alert-triangle',
    'assigned': 'user-plus',
    'unassigned': 'user-minus',
    'reassigned': 'user-check',
    'comment_added': 'message-circle',
    'escalated': 'arrow-up',
    'reopened': 'rotate-ccw',
    'closed': 'check-circle'
  }
  return icons[actionType] || 'activity'
}

// Função auxiliar para obter cor da ação
function getActionColor(actionType: string): string {
  const colors: Record<string, string> = {
    'created': 'green',
    'status_changed': 'blue',
    'priority_changed': 'orange',
    'assigned': 'green',
    'unassigned': 'red',
    'reassigned': 'blue',
    'comment_added': 'gray',
    'escalated': 'red',
    'reopened': 'yellow',
    'closed': 'green'
  }
  return colors[actionType] || 'gray'
}

// Função auxiliar para formatar valores
function formatValue(field: string, value: string): string {
  if (!value) return 'N/A'
  
  switch (field) {
    case 'priority':
      const priorities: Record<string, string> = {
        'low': 'Baixa',
        'medium': 'Média', 
        'high': 'Alta',
        'urgent': 'Urgente'
      }
      return priorities[value] || value
    
    case 'status':
      const statuses: Record<string, string> = {
        'open': 'Aberto',
        'in_progress': 'Em Andamento',
        'resolved': 'Resolvido',
        'closed': 'Fechado',
        'cancelled': 'Cancelado'
      }
      return statuses[value] || value
    
    default:
      return value
  }
}
