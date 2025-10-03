import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Buscar configurações de notificações
export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Apenas admin pode acessar configurações de notificações
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Buscar configurações do banco
    const { data: settings, error } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .eq('setting_type', 'notifications')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Se não encontrou, retorna configurações padrão
    if (!settings) {
      return NextResponse.json({
        email: {
          enabled: true,
          events: {
            newTicket: true,
            ticketAssigned: true,
            ticketStatusChange: true,
            ticketComment: true,
            ticketClosed: false,
            userRegistration: true,
            systemAlert: true,
            reportGenerated: false
          },
          defaultRecipients: [],
          digestEnabled: false,
          digestFrequency: 'daily'
        },
        browser: {
          enabled: true,
          events: {
            newTicket: true,
            ticketAssigned: true,
            ticketStatusChange: false,
            ticketComment: true,
            ticketClosed: false,
            userRegistration: false,
            systemAlert: true,
            reportGenerated: false
          },
          soundEnabled: true,
          soundVolume: 50
        },
        slack: {
          enabled: false,
          events: {
            newTicket: true,
            ticketAssigned: false,
            ticketStatusChange: false,
            ticketComment: false,
            ticketClosed: false,
            userRegistration: false,
            systemAlert: true,
            reportGenerated: false
          },
          webhookUrl: '',
          channel: '#support',
          username: 'Support Bot',
          iconEmoji: ':ticket:'
        },
        webhook: {
          enabled: false,
          events: {
            newTicket: true,
            ticketAssigned: true,
            ticketStatusChange: true,
            ticketComment: true,
            ticketClosed: true,
            userRegistration: true,
            systemAlert: true,
            reportGenerated: true
          },
          url: '',
          headers: [],
          method: 'POST',
          retryAttempts: 3
        },
        sms: {
          enabled: false,
          events: {
            newTicket: false,
            ticketAssigned: false,
            ticketStatusChange: false,
            ticketComment: false,
            ticketClosed: false,
            userRegistration: false,
            systemAlert: true,
            reportGenerated: false
          },
          provider: 'twilio',
          accountSid: '',
          authToken: '',
          fromNumber: '',
          defaultRecipients: []
        }
      })
    }

    return NextResponse.json(settings.settings_data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Salvar configurações de notificações
export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Apenas admin pode modificar configurações de notificações
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body = await request.json()

    // Verificar se já existe configuração
    const { data: existing } = await supabaseAdmin
      .from('system_settings')
      .select('id')
      .eq('setting_type', 'notifications')
      .single()

    if (existing) {
      // Atualizar configuração existente
      const { error: updateError } = await supabaseAdmin
        .from('system_settings')
        .update({
          settings_data: body,
          updated_by: session.user.id,
          // updated_at gerenciado automaticamente pelo Supabase
        })
        .eq('setting_type', 'notifications')

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
      }
    } else {
      // Criar nova configuração
      const { error: insertError } = await supabaseAdmin
        .from('system_settings')
        .insert({
          setting_type: 'notifications',
          settings_data: body,
          created_by: session.user.id,
          updated_by: session.user.id
        })

      if (insertError) {
        return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 })
      }
    }

    // Log de auditoria
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: session.user.id,
        action: 'UPDATE_NOTIFICATION_SETTINGS',
        resource_type: 'system_settings',
        resource_id: 'notifications',
        details: {
          channels_updated: Object.keys(body)
        }
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}