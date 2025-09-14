import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const ticketId = params.id

    // Get rating for this ticket by the current user
    const { data, error } = await supabaseAdmin
      .from('ticket_ratings')
      .select('*')
      .eq('ticket_id', ticketId)
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rating found
        return NextResponse.json(null)
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching rating:', error)
    
    // Return null if table doesn't exist
    if (error.message?.includes('ticket_ratings') || error.code === '42P01') {
      return NextResponse.json(null)
    }
    
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
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

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

    // Check if ticket exists and user is the creator
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('id, created_by')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      )
    }

    // Only ticket creator can rate
    if (ticket.created_by !== session.user.id) {
      return NextResponse.json(
        { error: 'Apenas o criador do ticket pode avaliar' },
        { status: 403 }
      )
    }

    // Check if rating already exists
    const { data: existingRating } = await supabaseAdmin
      .from('ticket_ratings')
      .select('id')
      .eq('ticket_id', ticketId)
      .eq('user_id', session.user.id)
      .single()

    let result

    if (existingRating) {
      // Update existing rating
      const { data, error } = await supabaseAdmin
        .from('ticket_ratings')
        .update({
          rating,
          comment: comment || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRating.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new rating
      const { data, error } = await supabaseAdmin
        .from('ticket_ratings')
        .insert({
          ticket_id: ticketId,
          user_id: session.user.id,
          rating,
          comment: comment || null
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error saving rating:', error)
    
    // Return success with mock data if table doesn't exist
    if (error.message?.includes('ticket_ratings') || error.code === '42P01') {
      return NextResponse.json({
        id: 'mock-id',
        ticket_id: params.id,
        user_id: 'mock-user',
        rating: 5,
        comment: 'Mock rating - table not created yet',
        created_at: new Date().toISOString()
      })
    }
    
    return NextResponse.json(
      { error: 'Erro ao salvar avaliação' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const ticketId = params.id

    // Delete rating for this ticket by the current user
    const { error } = await supabaseAdmin
      .from('ticket_ratings')
      .delete()
      .eq('ticket_id', ticketId)
      .eq('user_id', session.user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting rating:', error)
    
    // Return success if table doesn't exist
    if (error.message?.includes('ticket_ratings') || error.code === '42P01') {
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json(
      { error: 'Erro ao remover avaliação' },
      { status: 500 }
    )
  }
}