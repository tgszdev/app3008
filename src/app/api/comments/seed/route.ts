import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar o usuário atual
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Só admin pode criar dados de teste
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem criar dados de teste' }, { status: 403 })
    }

    // Buscar alguns tickets existentes
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select('id')
      .limit(5)

    if (ticketsError || !tickets || tickets.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhum ticket encontrado para adicionar comentários',
        suggestion: 'Crie alguns tickets primeiro'
      }, { status: 404 })
    }

    // Buscar alguns usuários
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .limit(3)

    if (usersError || !users || users.length === 0) {
      return NextResponse.json({ error: 'Nenhum usuário encontrado' }, { status: 404 })
    }

    // Criar comentários de teste
    const testComments = [
      {
        ticket_id: tickets[0].id,
        user_id: users[0].id,
        content: 'Este é o primeiro comentário de teste. O problema foi identificado e estamos trabalhando na solução.',
        is_internal: false
      },
      {
        ticket_id: tickets[0].id,
        user_id: users[1]?.id || users[0].id,
        content: 'Atualizando o status: A equipe técnica já está analisando o caso.',
        is_internal: false
      },
      {
        ticket_id: tickets[0].id,
        user_id: users[0].id,
        content: '[INTERNO] Verificar com o fornecedor sobre a disponibilidade da peça.',
        is_internal: true
      },
      {
        ticket_id: tickets[1]?.id || tickets[0].id,
        user_id: users[2]?.id || users[0].id,
        content: 'Cliente reportou que o problema persiste após a última atualização.',
        is_internal: false
      },
      {
        ticket_id: tickets[1]?.id || tickets[0].id,
        user_id: users[0].id,
        content: 'Realizamos nova verificação e identificamos a causa raiz. Solução será aplicada em breve.',
        is_internal: false
      },
      {
        ticket_id: tickets[2]?.id || tickets[0].id,
        user_id: users[1]?.id || users[0].id,
        content: 'Problema resolvido com sucesso! O sistema está funcionando normalmente.',
        is_internal: false
      },
      {
        ticket_id: tickets[2]?.id || tickets[0].id,
        user_id: users[0].id,
        content: '[INTERNO] Documentar esta solução na base de conhecimento para casos futuros.',
        is_internal: true
      },
      {
        ticket_id: tickets[3]?.id || tickets[0].id,
        user_id: users[2]?.id || users[0].id,
        content: 'Solicitação recebida. Prazo estimado: 2 dias úteis.',
        is_internal: false
      },
      {
        ticket_id: tickets[4]?.id || tickets[0].id,
        user_id: users[0].id,
        content: 'Teste realizado com sucesso. Aguardando aprovação do cliente.',
        is_internal: false
      },
      {
        ticket_id: tickets[4]?.id || tickets[0].id,
        user_id: users[1]?.id || users[0].id,
        content: '[INTERNO] Cliente aprovou. Podemos proceder com a implementação.',
        is_internal: true
      }
    ]

    // Inserir comentários
    const { data: insertedComments, error: insertError } = await supabaseAdmin
      .from('ticket_comments')
      .insert(testComments)
      .select()

    if (insertError) {
      console.error('Erro ao inserir comentários:', insertError)
      return NextResponse.json({ 
        error: 'Erro ao criar comentários de teste',
        details: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${insertedComments?.length || 0} comentários de teste criados com sucesso`,
      comments: insertedComments
    })

  } catch (error: any) {
    console.error('Erro ao criar dados de teste:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error.message
      },
      { status: 500 }
    )
  }
}