import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Buscar ticket específico com todos os detalhes
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email, role),
        assigned_to_user:users!tickets_assigned_to_fkey(id, name, email, role),
        comments:ticket_comments(
          id,
          content,
          is_internal,
          created_at,
          user:users(id, name, email, role)
        ),
        attachments:ticket_attachments(
          id,
          file_name,
          file_size,
          file_type,
          file_url,
          created_at,
          uploaded_by:users(id, name, email)
        ),
        history:ticket_history(
          id,
          action,
          field_name,
          old_value,
          new_value,
          created_at,
          user:users(id, name, email)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 })
      }
      console.error('Erro ao buscar ticket:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Ordenar comentários e histórico por data
    if (ticket.comments) {
      ticket.comments.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }
    if (ticket.history) {
      ticket.history.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }

    return NextResponse.json(ticket)
  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export const runtime = 'nodejs'