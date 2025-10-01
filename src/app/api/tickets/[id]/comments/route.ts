import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

type RouteParams = {
  params: Promise<{ id: string }>
}

// POST - Adicionar comentário a um ticket
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const params = await context.params
    const body = await request.json()
    const { content, is_internal = false } = body

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Conteúdo do comentário é obrigatório' }, { status: 400 })
    }

    // Verificar se o usuário pode adicionar comentários internos
    const userRole = (session.user as any).role
    if (is_internal && userRole !== 'admin' && userRole !== 'analyst') {
      return NextResponse.json({ error: 'Apenas staff pode adicionar comentários internos' }, { status: 403 })
    }

    // Adicionar o comentário
    const { data: comment, error: commentError } = await supabaseAdmin
      .from('comments')
      .insert({
        ticket_id: params.id,
        user_id: session.user?.id,
        content: content.trim(),
        is_internal
      })
      .select(`
        *,
        user:users(id, name, email)
      `)
      .single()

    if (commentError) {
      console.error('Erro ao criar comentário:', commentError)
      return NextResponse.json({ error: 'Erro ao criar comentário' }, { status: 500 })
    }

    // Atualizar o ticket com a timestamp de primeira resposta se for o primeiro comentário da equipe
    if (userRole === 'admin' || userRole === 'analyst') {
      // Verificar se é a primeira resposta
      const { data: ticket } = await supabaseAdmin
        .from('tickets')
        .select('first_response_at, created_by')
        .eq('id', params.id)
        .single()

      // Se não tem primeira resposta e o comentário não é do criador do ticket
      if (ticket && !ticket.first_response_at && ticket.created_by !== session.user?.id) {
        const now = new Date().toISOString()
        await supabaseAdmin
          .from('tickets')
          .update({ 
            first_response_at: now,
            // updated_at gerenciado automaticamente pelo Supabase
          })
          .eq('id', params.id)

        // Atualizar SLA se existir
        try {
          await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/sla/ticket/${params.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'first_response',
              timestamp: now
            })
          })
        } catch (slaError) {
          console.error('Erro ao atualizar SLA:', slaError)
        }
      }
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// GET - Listar comentários de um ticket
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const params = await context.params
    const userRole = (session.user as any).role
    const isStaff = userRole === 'admin' || userRole === 'analyst'

    let query = supabaseAdmin
      .from('comments')
      .select(`
        *,
        user:users(id, name, email, role)
      `)
      .eq('ticket_id', params.id)
      .order('created_at', { ascending: true })

    // Se não for staff, não mostrar comentários internos
    if (!isStaff) {
      query = query.eq('is_internal', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar comentários:', error)
      return NextResponse.json({ error: 'Erro ao buscar comentários' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Erro ao buscar comentários:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}