import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Aguardar os parâmetros (necessário no Next.js 15)
    const { id: ticketId } = await params

    // Verificar autenticação
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Obter dados do usuário e role
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const userId = userData.id
    const userRole = userData.role || 'user'

    // Buscar o ticket com todas as informações relacionadas
    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email),
        assigned_to_user:users!tickets_assigned_to_fkey(id, name, email),
        category_info:categories!tickets_category_id_fkey(id, name, slug, color, icon),
        context_info:contexts!tickets_context_id_fkey(id, name, slug),
        comments:ticket_comments(
          id,
          content,
          created_at,
          is_internal,
          user:users(id, name, email)
        )
      `)
      .eq('id', ticketId)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar ticket', details: error.message },
        { status: 500 }
      )
    }

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário tem permissão para ver este ticket
    if (userRole === 'user') {
      // Se é um ticket interno e não foi criado pelo usuário, negar acesso
      if (ticket.is_internal && ticket.created_by !== userId) {
        return NextResponse.json(
          { error: 'Acesso negado. Você não tem permissão para ver este ticket.' },
          { status: 403 }
        )
      }

      // Filtrar comentários internos se o usuário não é admin/analyst
      if (ticket.comments && Array.isArray(ticket.comments)) {
        ticket.comments = ticket.comments.filter((comment: any) => {
          // Usuário só vê comentários não internos ou criados por ele
          return !comment.is_internal || comment.user?.id === userId
        })
      }
    }

    // Formatar categoria - garantir que seja sempre um objeto
    let categoryInfo = null
    if (ticket.category_info) {
      // Se category_info é um array, pegar o primeiro elemento
      if (Array.isArray(ticket.category_info) && ticket.category_info.length > 0) {
        categoryInfo = ticket.category_info[0]
      } else if (!Array.isArray(ticket.category_info)) {
        // Se já é um objeto, usar diretamente
        categoryInfo = ticket.category_info
      }
    }

    // Formatar resposta
    const formattedTicket = {
      ...ticket,
      category_info: categoryInfo,
      // Manter compatibilidade com campo category
      category: categoryInfo?.name || ticket.category || 'Sem categoria'
    }

    return NextResponse.json(formattedTicket)

  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error.message 
      },
      { status: 500 }
    )
  }
}