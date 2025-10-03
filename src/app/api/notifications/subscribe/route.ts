import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'

// POST - Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { user_id, subscription } = body

    // Use session user ID if not provided or if 'current'
    const targetUserId = user_id === 'current' || !user_id ? session.user.id : user_id

    // Validate subscription object
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Subscription inválida' },
        { status: 400 }
      )
    }

    // Extract device info from user agent
    const userAgent = request.headers.get('user-agent') || ''
    const deviceInfo = {
      userAgent,
      browser: getBrowser(userAgent),
      os: getOS(userAgent),
      timestamp: new Date().toISOString()
    }

    // Save or update subscription
    const { data, error } = await supabaseAdmin
      .from('user_push_subscriptions')
      .upsert({
        user_id: targetUserId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        device_info: deviceInfo,
        active: true,
        last_used: new Date().toISOString()
      }, {
        onConflict: 'user_id,endpoint'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription salva com sucesso',
      data
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')

    if (!endpoint) {
      // Delete all subscriptions for the user
      const { error } = await supabaseAdmin
        .from('user_push_subscriptions')
        .delete()
        .eq('user_id', session.user.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      // Delete specific subscription
      const { error } = await supabaseAdmin
        .from('user_push_subscriptions')
        .delete()
        .eq('user_id', session.user.id)
        .eq('endpoint', endpoint)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription removida com sucesso'
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// GET - Get user's push subscriptions
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: subscriptions, error } = await supabaseAdmin
      .from('user_push_subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('active', true)
      .order('last_used', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(subscriptions || [])
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Helper functions to parse user agent
function getBrowser(userAgent: string): string {
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('Edge')) return 'Edge'
  if (userAgent.includes('Opera')) return 'Opera'
  return 'Unknown'
}

function getOS(userAgent: string): string {
  if (userAgent.includes('Windows')) return 'Windows'
  if (userAgent.includes('Mac')) return 'macOS'
  if (userAgent.includes('Linux')) return 'Linux'
  if (userAgent.includes('Android')) return 'Android'
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS'
  return 'Unknown'
}