import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'
import { userHasPermission } from '@/lib/permissions'
import { getBrazilTimestamp } from '@/lib/date-utils'

// PATCH - Alterar prioridade do ticket
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { priority } = await request.json()
    const ticketId = params.id
    const userId = session.user.id
    const userRole = (session.user as any).role || 'user'

    // Verificar se o usuário tem permissão para alterar prioridade
    const canChangePriority = await userHasPermission(userRole, 'tickets_change_priority')
    
    if (!canChangePriority) {
      return NextResponse.json({ 
        error: 'Você não tem permissão para alterar a prioridade de tickets' 
      }, { status: 403 })
    }

    // Validar prioridade
    const validPriorities = ['low', 'medium', 'high', 'critical']
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ 
        error: 'Prioridade inválida. Use: low, medium, high, critical' 
      }, { status: 400 })
    }

    // Buscar ticket atual
    const { data: currentTicket, error: fetchError } = await supabaseAdmin
      .from('tickets')
      .select('id, priority, title, assigned_to, created_by')
      .eq('id', ticketId)
      .single()

    if (fetchError || !currentTicket) {
      return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 })
    }

    // Verificar se a prioridade é diferente
    if (currentTicket.priority === priority) {
      return NextResponse.json({ 
        error: 'A prioridade selecionada é a mesma atual' 
      }, { status: 400 })
    }

    // Definir current_user_id para o trigger
    await supabaseAdmin.rpc('set_config', {
      setting_name: 'app.current_user_id',
      setting_value: userId,
      is_local: true
    })

    // Atualizar prioridade do ticket
    const { error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({ 
        priority,
        updated_at: getBrazilTimestamp(),
        updated_by: userId
      })
      .eq('id', ticketId)

    if (updateError) {
      console.error('Erro ao atualizar prioridade:', updateError)
      return NextResponse.json({ error: 'Erro ao alterar prioridade' }, { status: 500 })
    }

    // Histórico gerenciado automaticamente por TRIGGER no banco de dados
    // Removido insert manual para evitar duplicação

    // Buscar ticket atualizado
    const { data: updatedTicket, error: refetchError } = await supabaseAdmin
      .from('tickets')
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email),
        assigned_to_user:users!tickets_assigned_to_fkey(id, name, email),
        category_info:categories!tickets_category_id_fkey(id, name, slug, color, icon)
      `)
      .eq('id', ticketId)
      .single()

    if (refetchError) {
      console.error('Erro ao buscar ticket atualizado:', refetchError)
      return NextResponse.json({ error: 'Erro ao buscar ticket atualizado' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Prioridade alterada para ${priority}`,
      ticket: updatedTicket
    })

  } catch (error) {
    console.error('Erro ao alterar prioridade:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}
