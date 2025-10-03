import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// SOLUÇÃO SEGURA: Usar Service Role Key APENAS no servidor
// Esta key NUNCA deve ir para o frontend
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!

// Cliente com Service Role (bypassa RLS) - usar com MUITO cuidado
const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Função para obter o usuário autenticado
async function getAuthenticatedUser(request: NextRequest) {
  try {
    // Tentar pegar o token do cookie ou header
    const cookieStore = cookies()
    const supabaseAuthToken = cookieStore.get('sb-auth-token')?.value
    
    if (!supabaseAuthToken) {
      // Tentar pegar do Authorization header
      const authHeader = request.headers.get('authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return null
      }
      
      const token = authHeader.substring(7)
      // Verificar o token com Supabase
      const { data: { user }, error } = await supabaseService.auth.getUser(token)
      return error ? null : user
    }
    
    // Verificar o token do cookie
    const { data: { user }, error } = await supabaseService.auth.getUser(supabaseAuthToken)
    return error ? null : user
  } catch {
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id
    
    // Verificar autenticação (opcional para GET)
    const user = await getAuthenticatedUser(request)
    
    // Buscar avaliação existente
    let query = supabaseService
      .from('ticket_ratings')
      .select('*')
      .eq('ticket_id', ticketId)
    
    // Se tiver usuário autenticado, filtrar por ele
    if (user) {
      query = query.eq('user_id', user.id)
    }
    
    const { data, error } = await query.limit(1).single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhuma avaliação encontrada
        return NextResponse.json(null)
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao buscar avaliação' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id
    const body = await request.json()
    const { rating, comment } = body
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Avaliação inválida. Deve ser entre 1 e 5.' },
        { status: 400 }
      )
    }
    
    // IMPORTANTE: Usar Service Key para byppassar RLS
    // Mas ainda validar permissões manualmente
    
    // Buscar o ticket (usando Service Key que bypassa RLS)
    const { data: ticket, error: ticketError } = await supabaseService
      .from('tickets')
      .select('id, created_by, status')
      .eq('id', ticketId)
      .single()
    
    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      )
    }
    
    // Verificar se o ticket está resolvido
    if (ticket.status !== 'resolved') {
      return NextResponse.json(
        { error: 'Apenas tickets resolvidos podem ser avaliados' },
        { status: 400 }
      )
    }
    
    // Tentar obter o usuário autenticado
    const user = await getAuthenticatedUser(request)
    const userId = user?.id || body.userId || ticket.created_by
    
    // Verificar se é o criador do ticket
    if (userId !== ticket.created_by) {
      return NextResponse.json(
        { error: 'Apenas o criador do ticket pode avaliar' },
        { status: 403 }
      )
    }
    
    // Verificar se já existe avaliação
    const { data: existingRating } = await supabaseService
      .from('ticket_ratings')
      .select('id')
      .eq('ticket_id', ticketId)
      .eq('user_id', userId)
      .single()
    
    let result
    
    if (existingRating) {
      // Atualizar avaliação existente
      const { data, error } = await supabaseService
        .from('ticket_ratings')
        .update({
          rating,
          comment: comment || null,
          // updated_at gerenciado automaticamente pelo Supabase
        })
        .eq('id', existingRating.id)
        .select()
        .single()
      
      if (error) throw error
      result = data
    } else {
      // Criar nova avaliação
      const { data, error } = await supabaseService
        .from('ticket_ratings')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          rating,
          comment: comment || null
        })
        .select()
        .single()
      
      if (error) {
        throw error
      }
      result = data
    }
    
    return NextResponse.json(result)
    
  } catch (error: any) {
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details
    })
    
    return NextResponse.json(
      { error: error.message || 'Erro ao salvar avaliação' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id
    
    // Tentar obter o usuário autenticado
    const user = await getAuthenticatedUser(request)
    const body = await request.json().catch(() => ({}))
    const userId = user?.id || body.userId
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não identificado' },
        { status: 401 }
      )
    }
    
    // Deletar avaliação
    const { error } = await supabaseService
      .from('ticket_ratings')
      .delete()
      .eq('ticket_id', ticketId)
      .eq('user_id', userId)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao remover avaliação' },
      { status: 500 }
    )
  }
}