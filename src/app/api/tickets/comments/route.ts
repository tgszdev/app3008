import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createAndSendNotification } from '@/lib/notifications'

// POST - Adicionar comentário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticket_id, user_id, content, is_internal } = body

    // Validação
    if (!ticket_id || !user_id || !content) {
      return NextResponse.json(
        { error: 'Ticket ID, User ID e conteúdo são obrigatórios' },
        { status: 400 }
      )
    }

    // Criar comentário
    const { data: comment, error } = await supabaseAdmin
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
      
      // Se a tabela não existir, tentar criá-la
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        // Criar tabela de comentários
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS ticket_comments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            is_internal BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON ticket_comments(ticket_id);
          CREATE INDEX IF NOT EXISTS idx_comments_user_id ON ticket_comments(user_id);
        `
        
        // Note: Supabase Admin API doesn't support raw SQL execution directly
        // Return error instructing to create table
        return NextResponse.json({ 
          error: 'Tabela de comentários não existe. Execute o script de criação no Supabase SQL Editor.',
          sql: createTableQuery
        }, { status: 500 })
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Atualizar updated_at do ticket
    await supabaseAdmin
      .from('tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticket_id)

    // Adicionar ao histórico
    await supabaseAdmin
      .from('ticket_history')
      .insert({
        ticket_id,
        user_id,
        action: 'comment_added',
        created_at: new Date().toISOString()
      })

    // Buscar informações do ticket e usuário para notificação
    console.log('=== PROCESSANDO NOTIFICAÇÕES DE COMENTÁRIO ===')
    console.log('Ticket ID:', ticket_id)
    console.log('Usuário comentando:', user_id)
    console.log('Comentário ID:', comment.id)
    
    try {
      const { data: ticket } = await supabaseAdmin
        .from('tickets')
        .select('id, title, ticket_number, created_by, assigned_to')
        .eq('id', ticket_id)
        .single()

      if (ticket) {
        const { data: commentUser } = await supabaseAdmin
          .from('users')
          .select('name')
          .eq('id', user_id)
          .single()

        const userName = commentUser?.name || 'Usuário'
        const commentPreview = content.substring(0, 100) + (content.length > 100 ? '...' : '')

        // Notificar o criador do ticket (se não for ele mesmo comentando)
        if (ticket.created_by && ticket.created_by !== user_id) {
          console.log('Tentando notificar criador do ticket:', {
            created_by: ticket.created_by,
            user_commenting: user_id,
            ticket_number: ticket.ticket_number
          })
          
          const notificationResult = await createAndSendNotification({
            user_id: ticket.created_by,
            title: `Novo comentário no Chamado #${ticket.ticket_number || ticket.id.substring(0, 8)}`,
            message: `${userName} comentou: "${commentPreview}"`,
            type: 'comment_added',
            severity: 'info',
            data: {
              ticket_id: ticket.id,
              comment_id: comment.id,
              ticket_number: ticket.ticket_number
            },
            action_url: `/dashboard/tickets/${ticket.id}#comment-${comment.id}`
          })
          
          console.log('Resultado da notificação para criador:', notificationResult ? '✅ Sucesso' : '❌ Falhou')
        } else {
          console.log('Criador não notificado porque:', {
            has_creator: !!ticket.created_by,
            is_same_user: ticket.created_by === user_id
          })
        }

        // Notificar o responsável (se houver e não for ele mesmo)
        if (ticket.assigned_to && ticket.assigned_to !== user_id && ticket.assigned_to !== ticket.created_by) {
          console.log('Tentando notificar responsável:', {
            assigned_to: ticket.assigned_to,
            user_commenting: user_id,
            ticket_number: ticket.ticket_number
          })
          
          const notificationResult = await createAndSendNotification({
            user_id: ticket.assigned_to,
            title: `Novo comentário no Chamado #${ticket.ticket_number || ticket.id.substring(0, 8)}`,
            message: `${userName} comentou: "${commentPreview}"`,
            type: 'comment_added',
            severity: 'info',
            data: {
              ticket_id: ticket.id,
              comment_id: comment.id,
              ticket_number: ticket.ticket_number
            },
            action_url: `/dashboard/tickets/${ticket.id}#comment-${comment.id}`
          })
          
          console.log('Resultado da notificação para responsável:', notificationResult ? '✅ Sucesso' : '❌ Falhou')
        } else {
          console.log('Responsável não notificado porque:', {
            has_assignee: !!ticket.assigned_to,
            is_same_user: ticket.assigned_to === user_id,
            is_creator: ticket.assigned_to === ticket.created_by
          })
        }

        // Detectar e notificar menções (@username)
        const mentionRegex = /@(\w+)/g
        const mentions = content.match(mentionRegex)
        
        if (mentions && mentions.length > 0) {
          for (const mention of mentions) {
            const username = mention.substring(1) // Remove @
            
            // Buscar usuário pela menção
            const { data: mentionedUser } = await supabaseAdmin
              .from('users')
              .select('id')
              .ilike('name', `%${username}%`)
              .single()

            if (mentionedUser && mentionedUser.id !== user_id) {
              await createAndSendNotification({
                user_id: mentionedUser.id,
                title: `Você foi mencionado no Chamado #${ticket.ticket_number || ticket.id.substring(0, 8)}`,
                message: `${userName} mencionou você em um comentário`,
                type: 'comment_mention',
                severity: 'info',
                data: {
                  ticket_id: ticket.id,
                  comment_id: comment.id,
                  ticket_number: ticket.ticket_number
                },
                action_url: `/dashboard/tickets/${ticket.id}#comment-${comment.id}`
              })
            }
          }
        }
      }
    } catch (notificationError) {
      console.log('Erro ao enviar notificações (ignorado):', notificationError)
    }

    return NextResponse.json(comment)
  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// GET - Listar comentários de um ticket
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get('ticket_id')

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID é obrigatório' }, { status: 400 })
    }

    const { data: comments, error } = await supabaseAdmin
      .from('ticket_comments')
      .select(`
        *,
        user:users(id, name, email, role)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

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

// DELETE - Excluir comentário
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID do comentário é obrigatório' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('ticket_comments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir comentário:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}