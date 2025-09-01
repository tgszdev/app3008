import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Buscar notificações do usuário
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Buscar contagem de não lidas
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false)

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error in notifications GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Criar nova notificação
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { user_id, title, message, type, severity = 'info', data, action_url } = body

    // Verificar se o usuário tem permissão para criar notificações
    // (normalmente apenas o sistema ou admins podem criar notificações para outros usuários)
    const userRole = (session.user as any).role
    if (userRole !== 'admin' && user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        title,
        message,
        type,
        severity,
        data,
        action_url
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    // Verificar preferências do usuário para enviar push/email
    const { data: preferences } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (preferences) {
      // Verificar se deve enviar push notification
      if (preferences.push_enabled && preferences[type]?.push) {
        // Buscar push subscriptions do usuário
        const { data: subscriptions } = await supabase
          .from('user_push_subscriptions')
          .select('*')
          .eq('user_id', user_id)
          .eq('active', true)

        if (subscriptions && subscriptions.length > 0) {
          // Enviar push notification (implementaremos depois)
          console.log('Would send push notification to', subscriptions.length, 'devices')
        }
      }

      // Verificar se deve enviar email
      if (preferences.email_enabled && preferences[type]?.email) {
        // Enviar email (implementaremos depois)
        console.log('Would send email notification')
      }
    }

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error in notifications POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Marcar notificação como lida
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notification_id, mark_all } = body

    if (mark_all) {
      // Marcar todas como lidas
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', session.user.id)
        .eq('is_read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
      }

      return NextResponse.json({ message: 'All notifications marked as read' })
    } else if (notification_id) {
      // Marcar uma notificação específica como lida
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notification_id)
        .eq('user_id', session.user.id)

      if (error) {
        console.error('Error marking notification as read:', error)
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Notification marked as read' })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error in notifications PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Deletar notificação
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const notification_id = searchParams.get('id')

    if (!notification_id) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notification_id)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error deleting notification:', error)
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Notification deleted' })
  } catch (error) {
    console.error('Error in notifications DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}