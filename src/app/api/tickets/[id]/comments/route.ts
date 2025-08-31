import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST - Adicionar comentário ao ticket
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticket_id } = await context.params
    const body = await request.json()
    const { user_id, content, is_internal } = body

    // Validação
    if (!user_id || !content) {
      return NextResponse.json(
        { error: 'Usuário e conteúdo são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o ticket existe
    const { data: ticket } = await supabaseAdmin
      .from('tickets')
      .select('id')
      .eq('id', ticket_id)
      .single()

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      )
    }

    // Criar comentário
    const { data: newComment, error } = await supabaseAdmin
      .from('ticket_comments')
      .insert({
        ticket_id,
        user_id,
        content,
        is_internal: is_internal || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        user:users(id, name, email, role)
      `)
      .single()

    if (error) {
      console.error('Erro ao criar comentário:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Adicionar ao histórico
    await supabaseAdmin
      .from('ticket_history')
      .insert({
        ticket_id,
        user_id,
        action: 'commented',
        new_value: is_internal ? 'Comentário interno adicionado' : 'Comentário adicionado',
        created_at: new Date().toISOString()
      })

    // Atualizar updated_at do ticket
    await supabaseAdmin
      .from('tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticket_id)

    return NextResponse.json(newComment, { status: 201 })
  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// GET - Listar comentários do ticket
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticket_id } = await context.params

    const { data: comments, error } = await supabaseAdmin
      .from('ticket_comments')
      .select(`
        *,
        user:users(id, name, email, role)
      `)
      .eq('ticket_id', ticket_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar comentários:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(comments || [])
  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export const runtime = 'nodejs'