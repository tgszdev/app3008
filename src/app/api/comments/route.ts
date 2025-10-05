import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getBrazilTimestamp } from '@/lib/date-utils'
import { createAndSendNotification } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    // Obter dados do usuário e contexto multi-tenant
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role, user_type, context_id, context_name, context_type')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const currentUserId = userData.id
    const userRole = userData.role || 'user'
    const userType = userData.user_type
    const userContextId = userData.context_id

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

    // Construir query base - usando joins corretos
    let query = supabaseAdmin
      .from('ticket_comments')
      .select(`
        *,
        user:users (
          id,
          name,
          email,
          avatar_url
        ),
        ticket:tickets (
          id,
          ticket_number,
          title,
          status,
          priority,
          is_internal,
          context_id
        )
      `, { count: 'exact' })

    // Aplicar filtros
    if (ticketId) {
      query = query.eq('ticket_id', ticketId)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    // Remover filtro RLS aqui, pois supabaseAdmin bypassa RLS
    // Vamos filtrar manualmente após buscar os dados
    if (internalOnly && userRole !== 'user') {
      // Admin/analyst podem filtrar por comentários internos
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

    // Não aplicar paginação ainda para permitir filtragem manual
    // query = query.range(offset, offset + limit - 1)

    // Executar query
    const { data: comments, error } = await query

    if (error) {
      return NextResponse.json(
        { 
          error: 'Erro ao buscar comentários',
          details: error.message 
        },
        { status: 500 }
      )
    }

    // Filtrar comentários manualmente para multi-tenant e usuários comuns
    let filteredComments = comments || []
    
    // Aplicar filtro multi-tenant
    if (userType === 'context') {
      if (userContextId) {
        // Usuários de contexto só veem comentários de tickets do seu contexto
        filteredComments = filteredComments.filter((comment: any) => {
          return comment.ticket?.context_id === userContextId
        })
      } else {
        // Usuário context SEM context_id: não deve ver NENHUM comentário
        filteredComments = []
      }
    } else if (userType === 'matrix') {
      // Para usuários matrix, buscar contextos associados
      const { data: userContexts, error: contextsError } = await supabaseAdmin
        .from('user_contexts')
        .select('context_id')
        .eq('user_id', currentUserId)
      
      if (!contextsError && userContexts && userContexts.length > 0) {
        const associatedContextIds = userContexts.map(uc => uc.context_id)
        filteredComments = filteredComments.filter((comment: any) => {
          return associatedContextIds.includes(comment.ticket?.context_id)
        })
      } else {
        // Se não tem contextos associados, não mostrar nenhum comentário
        filteredComments = []
      }
    }
    
    // Se é um usuário comum, filtrar comentários internos
    if (userRole === 'user') {
      filteredComments = filteredComments.filter((comment: any) => {
        // Usuários só podem ver:
        // 1. Comentários não internos
        // 2. Comentários internos criados por eles mesmos
        const isCommentInternal = comment.is_internal === true
        const isOwnComment = comment.user_id === currentUserId
        
        // Se o comentário é interno e não é do próprio usuário, não mostrar
        if (isCommentInternal && !isOwnComment) {
          return false
        }
        
        return true
      })
    }

    // Aplicar paginação manualmente após filtragem
    const totalFiltered = filteredComments.length
    const paginatedComments = filteredComments.slice(offset, offset + limit)

    // Para cada comentário, buscar anexos se houver
    const commentsWithAttachments = await Promise.all(
      paginatedComments.map(async (comment) => {
        // Buscar anexos do comentário
        const { data: attachments } = await supabaseAdmin
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
      total: totalFiltered,
      page,
      limit,
      totalPages: Math.ceil(totalFiltered / limit)
    })

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

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
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
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Criar comentário
    const { data: comment, error } = await supabaseAdmin
      .from('ticket_comments')
      .insert({
        ticket_id,
        user_id: userData.id,
        content,
        is_internal
      })
      .select(`
        *,
        user:users (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { 
          error: 'Erro ao criar comentário',
          details: error.message 
        },
        { status: 500 }
      )
    }

    // Atualizar o updated_at do ticket
    await supabaseAdmin
      .from('tickets')
      .update({ updated_at: getBrazilTimestamp() })
      .eq('id', ticket_id)

    // ✨ NOVO: Enviar notificação por email sobre novo comentário
    console.log(`[COMMENT] Iniciando envio de notificações para ticket ${ticket_id}`)
    try {
      // Buscar dados COMPLETOS do ticket para notificação (incluindo contexto/cliente)
      const { data: ticket, error: ticketError } = await supabaseAdmin
        .from('tickets')
        .select(`
          id,
          ticket_number,
          title,
          description,
          priority,
          created_by,
          assigned_to,
          context_id,
          category_id,
          created_by_user:created_by(id, email, name),
          assigned_to_user:assigned_to(id, email, name),
          contexts:context_id(id, name),
          categories:category_id(id, name)
        `)
        .eq('id', ticket_id)
        .single()
      
      console.log(`[COMMENT] Ticket encontrado:`, { 
        ticket_number: ticket?.ticket_number, 
        created_by: ticket?.created_by, 
        commenter: userData.id,
        error: ticketError?.message 
      })
      
      if (ticket) {
        // Notificar o criador do ticket (se não for ele quem comentou)
        console.log(`[COMMENT] Verificando criador: ${ticket.created_by} !== ${userData.id} = ${ticket.created_by !== userData.id}`)
        if (ticket.created_by && ticket.created_by !== userData.id) {
          console.log(`[COMMENT] Enviando notificação para criador: ${ticket.created_by}`)
          await createAndSendNotification({
            user_id: ticket.created_by,
            type: 'new_comment',
            title: `💬 Novo comentário no chamado #${ticket.ticket_number}`,
            message: is_internal 
              ? `Comentário interno adicionado` 
              : content.substring(0, 200) + (content.length > 200 ? '...' : ''),
            action_url: `/dashboard/tickets/${ticket.id}`,
            ticket_id: ticket.id,
            data: {
              ticket_id: ticket.id,
              ticket_number: ticket.ticket_number,
              ticket_title: ticket.title,
              description: ticket.description,
              priority: ticket.priority,
              comment_content: content,
              comment_author: userData.name,
              is_internal,
              created_by: ticket.created_by_user?.name || 'Usuário',
              assigned_to: ticket.assigned_to_user?.name || null,
              client_name: ticket.contexts?.name || null,
              category: ticket.categories?.name || 'Geral'
            }
          })
        }
        
        // Notificar o responsável (se houver e não for quem comentou)
        if (ticket.assigned_to && ticket.assigned_to !== userData.id && ticket.assigned_to !== ticket.created_by) {
          await createAndSendNotification({
            user_id: ticket.assigned_to,
            type: 'new_comment',
            title: `💬 Novo comentário no chamado #${ticket.ticket_number}`,
            message: is_internal 
              ? `Comentário interno adicionado` 
              : content.substring(0, 200) + (content.length > 200 ? '...' : ''),
            action_url: `/dashboard/tickets/${ticket.id}`,
            ticket_id: ticket.id,
            data: {
              ticket_id: ticket.id,
              ticket_number: ticket.ticket_number,
              ticket_title: ticket.title,
              description: ticket.description,
              priority: ticket.priority,
              comment_content: content,
              comment_author: userData.name,
              is_internal,
              created_by: ticket.created_by_user?.name || 'Usuário',
              assigned_to: ticket.assigned_to_user?.name || null,
              client_name: ticket.contexts?.name || null,
              category: ticket.categories?.name || 'Geral'
            }
          })
        }
        
        console.log(`✅ Notificações de novo comentário enviadas para ticket #${ticket.ticket_number}`)
      }
    } catch (notificationError) {
      console.error('⚠️ Erro ao enviar notificação de comentário (não crítico):', notificationError)
      // Não falhar a criação do comentário por causa de notificação
    }

    return NextResponse.json(comment)

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

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
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

    // Buscar o comentário para verificar propriedade
    const { data: comment, error: commentError } = await supabaseAdmin
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
    await supabaseAdmin
      .from('ticket_attachments')
      .delete()
      .eq('comment_id', commentId)

    // Deletar comentário
    const { error } = await supabaseAdmin
      .from('ticket_comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      return NextResponse.json(
        { 
          error: 'Erro ao deletar comentário',
          details: error.message 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

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