import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Registrar push subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subscription, deviceInfo } = body

    if (!subscription?.endpoint || !subscription?.keys) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 })
    }

    // Salvar ou atualizar subscription
    const { data, error } = await supabase
      .from('user_push_subscriptions')
      .upsert({
        user_id: session.user.id,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        device_info: deviceInfo || {},
        active: true,
        last_used: new Date().toISOString()
      }, {
        onConflict: 'user_id,endpoint'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving push subscription:', error)
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Push notifications enabled',
      subscription: data 
    })
  } catch (error) {
    console.error('Error in push subscribe:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remover push subscription
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const endpoint = searchParams.get('endpoint')

    if (!endpoint) {
      // Desativar todas as subscriptions do usuário
      const { error } = await supabase
        .from('user_push_subscriptions')
        .update({ active: false })
        .eq('user_id', session.user.id)

      if (error) {
        console.error('Error disabling push subscriptions:', error)
        return NextResponse.json({ error: 'Failed to disable subscriptions' }, { status: 500 })
      }
    } else {
      // Desativar subscription específica
      const { error } = await supabase
        .from('user_push_subscriptions')
        .update({ active: false })
        .eq('user_id', session.user.id)
        .eq('endpoint', endpoint)

      if (error) {
        console.error('Error disabling push subscription:', error)
        return NextResponse.json({ error: 'Failed to disable subscription' }, { status: 500 })
      }
    }

    return NextResponse.json({ message: 'Push notifications disabled' })
  } catch (error) {
    console.error('Error in push unsubscribe:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}