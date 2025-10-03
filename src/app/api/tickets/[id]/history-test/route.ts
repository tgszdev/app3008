import { NextRequest, NextResponse } from 'next/server'

// GET - Teste simples para verificar se a API está funcionando
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id
    
    // Retornar dados de teste simulados
    const mockHistory = [
      {
        id: 'test-1',
        action_type: 'created',
        field_changed: 'status',
        old_value: null,
        new_value: 'open',
        description: 'Ticket criado (dados de teste)',
        metadata: { test: true },
        created_at: new Date().toISOString(),
        user: {
          id: 'test-user',
          name: 'Usuário de Teste',
          email: 'test@example.com'
        },
        actionIcon: 'plus-circle',
        actionColor: 'green',
        formattedOldValue: '',
        formattedNewValue: 'Aberto'
      },
      {
        id: 'test-2',
        action_type: 'status_changed',
        field_changed: 'status',
        old_value: 'open',
        new_value: 'in_progress',
        description: 'Status alterado de "Aberto" para "Em Andamento" (dados de teste)',
        metadata: { test: true },
        created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
        user: {
          id: 'test-user',
          name: 'Usuário de Teste',
          email: 'test@example.com'
        },
        actionIcon: 'refresh-cw',
        actionColor: 'blue',
        formattedOldValue: 'Aberto',
        formattedNewValue: 'Em Andamento'
      }
    ]

    return NextResponse.json({
      success: true,
      message: 'API de teste funcionando - histórico simulado',
      ticket: {
        id: ticketId,
        title: 'Ticket de Teste'
      },
      history: mockHistory,
      total: mockHistory.length,
      isTest: true
    })

  } catch (error) {
    console.error('Erro na API de teste:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor na API de teste',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}








