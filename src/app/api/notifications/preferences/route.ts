import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Buscar preferências do usuário
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: preferences, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching preferences:', error)
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    // Se não existir, criar preferências padrão
    if (!preferences) {
      const { data: newPreferences, error: createError } = await supabase
        .from('user_notification_preferences')
        .insert({
          user_id: session.user.id
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating preferences:', createError)
        return NextResponse.json({ error: 'Failed to create preferences' }, { status: 500 })
      }

      return NextResponse.json(newPreferences)
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error in preferences GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Atualizar preferências
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Atualizar apenas os campos enviados
    const updateData: any = {
      // updated_at gerenciado automaticamente pelo Supabase
    }

    // Campos permitidos para atualização
    const allowedFields = [
      'email_enabled', 'push_enabled', 'in_app_enabled',
      'ticket_created', 'ticket_assigned', 'ticket_updated', 
      'ticket_resolved', 'comment_added',
      'quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const { data: preferences, error } = await supabase
      .from('user_notification_preferences')
      .update(updateData)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      // Se não existir, criar com os valores fornecidos
      if (error.code === 'PGRST116') {
        const { data: newPreferences, error: createError } = await supabase
          .from('user_notification_preferences')
          .insert({
            user_id: session.user.id,
            ...updateData
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating preferences:', createError)
          return NextResponse.json({ error: 'Failed to create preferences' }, { status: 500 })
        }

        return NextResponse.json(newPreferences)
      }

      console.error('Error updating preferences:', error)
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error in preferences PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}