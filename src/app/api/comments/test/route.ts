import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Teste 1: Verificar se a tabela existe e tem dados
    const { data: commentCount, error: countError } = await supabaseAdmin
      .from('ticket_comments')
      .select('*', { count: 'exact', head: true })

    // Teste 2: Buscar alguns comentários sem joins
    const { data: simpleComments, error: simpleError } = await supabaseAdmin
      .from('ticket_comments')
      .select('*')
      .limit(5)

    // Teste 3: Buscar com join de users
    const { data: withUsers, error: userError } = await supabaseAdmin
      .from('ticket_comments')
      .select(`
        *,
        users (
          id,
          name,
          email
        )
      `)
      .limit(5)

    // Teste 4: Buscar com join de tickets
    const { data: withTickets, error: ticketError } = await supabaseAdmin
      .from('ticket_comments')
      .select(`
        *,
        tickets (
          id,
          ticket_number,
          title
        )
      `)
      .limit(5)

    // Teste 5: Verificar estrutura da tabela
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .limit(1)

    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1)

    return NextResponse.json({
      tests: {
        commentCount: {
          count: commentCount,
          error: countError?.message
        },
        simpleComments: {
          data: simpleComments,
          count: simpleComments?.length,
          error: simpleError?.message
        },
        withUsers: {
          data: withUsers,
          error: userError?.message
        },
        withTickets: {
          data: withTickets,
          error: ticketError?.message
        },
        sampleTicket: {
          data: tickets,
          error: ticketsError?.message
        },
        sampleUser: {
          data: users,
          error: usersError?.message
        }
      }
    })

  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Erro no teste',
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}