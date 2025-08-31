import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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