import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Testar se as tabelas existem
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tests: any = {
      notifications: false,
      preferences: false,
      push_subscriptions: false,
      session: {
        user_id: session.user.id,
        user_email: session.user.email,
        user_role: (session.user as any).role
      }
    }

    // Testar tabela notifications
    const { error: notifError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1)

    if (!notifError) {
      tests.notifications = true
    } else {
      console.error('Notifications table error:', notifError)
    }

    // Testar tabela user_notification_preferences
    const { error: prefError } = await supabase
      .from('user_notification_preferences')
      .select('id')
      .limit(1)

    if (!prefError) {
      tests.preferences = true
    } else {
      console.error('Preferences table error:', prefError)
    }

    // Testar tabela user_push_subscriptions
    const { error: pushError } = await supabase
      .from('user_push_subscriptions')
      .select('id')
      .limit(1)

    if (!pushError) {
      tests.push_subscriptions = true
    } else {
      console.error('Push subscriptions table error:', pushError)
    }

    // Tentar criar uma notificação de teste
    if (tests.notifications) {
      const { data: testNotif, error: createError } = await supabase
        .from('notifications')
        .insert({
          user_id: session.user.id,
          title: 'Teste de Sistema',
          message: 'Esta é uma notificação de teste criada pela API de verificação',
          type: 'test',
          severity: 'info',
          action_url: '/dashboard/settings/notifications'
        })
        .select()
        .single()

      if (testNotif) {
        tests.created_notification = testNotif
      } else {
        tests.create_error = createError
      }
    }

    return NextResponse.json({
      success: tests.notifications && tests.preferences,
      tests,
      message: tests.notifications 
        ? 'Tabelas de notificação encontradas'
        : 'Tabelas de notificação não encontradas. Execute o script SQL no Supabase.'
    })
  } catch (error: any) {
    console.error('Error in notification test:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}