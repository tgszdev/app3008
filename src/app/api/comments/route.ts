import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Extrair parâmetros de query
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sort = searchParams.get('sort') || 'recent'
    const search = searchParams.get('search') || ''
    const ticketId = searchParams.get('ticket_id')
    const userId = searchParams.get('user_id')
    const internalOnly = searchParams.get('internal_only') === 'true'

    // Calcular offset
    const offset = (page - 1) * limit

    // Construir query base
    let query = supabase
      .from('ticket_comments')
      .select(`
        *,
        user:users!ticket_comments_user_id_fkey (
          id,
          name,
          email,
          avatar_url
        ),
        ticket:tickets!ticket_comments_ticket_id_fkey (
          id,
          ticket_number,
          title,
          status,
          priority
        )
      `, { count: 'exact' })

    // Aplicar filtros
    if (ticketId) {
      query = query.eq('ticket_id', ticketId)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (internalOnly) {
      query = query.eq('is_internal', true)
    }

    // Aplicar busca
    if (search) {
      query = query.ilike('content', `%${search}%`)
    }

    // Aplicar ordenação
    if (sort === 'recent') {
      query = query.order('created_at', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: true })
    }

    // Aplicar paginação
    query = query.range(offset, offset + limit - 1)

    // Executar query
    const { data: comments, error, count } = await query

    if (error) {
      console.error('Erro ao buscar comentários:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar comentários' },
        { status: 500 }
      )
    }

    // Para cada comentário, buscar anexos se houver
    const commentsWithAttachments = await Promise.all(
      (comments || []).map(async (comment) => {
        // Buscar anexos do comentário
        const { data: attachments } = await supabase
          .from('ticket_attachments')
          .select('*')
          .eq('comment_id', comment.id)

        return {
          ...comment,
          attachments: attachments || []
        }
      })
    )

    return NextResponse.json({
      comments: commentsWithAttachments,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error: any) {
    console.error('Erro no endpoint de comentários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { ticket_id, content, is_internal = false } = body

    if (!ticket_id || !content) {
      return NextResponse.json(
        { error: 'Ticket ID e conteúdo são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar o usuário no banco de dados
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Criar comentário
    const { data: comment, error } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id,
        user_id: userData.id,
        content,
        is_internal
      })
      .select(`
        *,
        user:users!ticket_comments_user_id_fkey (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Erro ao criar comentário:', error)
      return NextResponse.json(
        { error: 'Erro ao criar comentário' },
        { status: 500 }
      )
    }

    // Atualizar o updated_at do ticket
    await supabase
      .from('tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticket_id)

    return NextResponse.json(comment)

  } catch (error: any) {
    console.error('Erro ao criar comentário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const commentId = searchParams.get('id')

    if (!commentId) {
      return NextResponse.json(
        { error: 'ID do comentário é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar o usuário no banco de dados
    const { data: userData, error: userError } = await supabase
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

    // Buscar o comentário para verificar propriedade
    const { data: comment, error: commentError } = await supabase
      .from('ticket_comments')
      .select('user_id')
      .eq('id', commentId)
      .single()

    if (commentError || !comment) {
      return NextResponse.json(
        { error: 'Comentário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissão (apenas o autor ou admin pode deletar)
    if (comment.user_id !== userData.id && userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Sem permissão para deletar este comentário' },
        { status: 403 }
      )
    }

    // Deletar anexos associados primeiro
    await supabase
      .from('ticket_attachments')
      .delete()
      .eq('comment_id', commentId)

    // Deletar comentário
    const { error } = await supabase
      .from('ticket_comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      console.error('Erro ao deletar comentário:', error)
      return NextResponse.json(
        { error: 'Erro ao deletar comentário' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Erro ao deletar comentário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}