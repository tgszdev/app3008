import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { sendNotificationEmail } from '@/lib/email-config'
import { requireUserEmail } from '@/lib/session-utils'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { type } = await request.json()
    
    // Obter email de forma segura
    const userEmail = requireUserEmail(session)
    
    console.log('=== TESTE DE NOTIFICAÇÃO POR EMAIL ===')
    console.log('Usuário:', userEmail)
    console.log('Tipo:', type || 'ticket_status_changed')

    // 1. Verificar preferências do usuário
    const { data: preferences } = await supabaseAdmin
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (!preferences) {
      // Criar preferências padrão
      const defaultPrefs = {
        user_id: session.user.id,
        email_enabled: true,
        push_enabled: false,
        in_app_enabled: true,
        ticket_created: { email: true, push: false, in_app: true },
        ticket_assigned: { email: true, push: false, in_app: true },
        ticket_updated: { email: true, push: false, in_app: true },
        ticket_resolved: { email: true, push: false, in_app: true },
        ticket_status_changed: { email: true, push: false, in_app: true },
        ticket_priority_changed: { email: true, push: false, in_app: true },
        comment_added: { email: true, push: false, in_app: true },
        comment_mention: { email: true, push: false, in_app: true },
        quiet_hours_enabled: false,
        email_frequency: 'immediate'
      }

      const { error: createError } = await supabaseAdmin
        .from('user_notification_preferences')
        .insert(defaultPrefs)

      if (createError) {
        console.error('Erro ao criar preferências:', createError)
        return NextResponse.json({
          error: 'Erro ao criar preferências de notificação',
          details: createError.message
        }, { status: 500 })
      }

      console.log('✅ Preferências padrão criadas')
    }

    // 2. Testar envio direto de email
    console.log('Tentando enviar email diretamente...')
    
    const emailResult = await sendNotificationEmail({
      to: userEmail,
      title: `🔔 Teste de Notificação - ${type || 'Status Alterado'}`,
      message: `Este é um teste de notificação por email. Se você está recebendo este email, o sistema de notificações está funcionando corretamente para o tipo: ${type || 'ticket_status_changed'}`,
      actionUrl: '/dashboard/tickets',
      actionText: 'Ver Chamados'
    })

    console.log('Resultado do envio de email:', emailResult)

    // 3. Criar notificação no banco
    const { error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: session.user.id,
        title: `Teste de Notificação - ${new Date().toLocaleTimeString('pt-BR')}`,
        message: `Notificação de teste tipo: ${type || 'ticket_status_changed'}`,
        type: type || 'ticket_status_changed',
        severity: 'info',
        data: { test: true, timestamp: new Date().toISOString() },
        action_url: '/dashboard/tickets'
      })

    if (notifError) {
      console.error('Erro ao criar notificação no banco:', notifError)
    }

    // 4. Verificar configuração de email
    const { data: emailConfig } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .eq('key', 'email_config')
      .single()

    const hasDbConfig = !!(emailConfig?.value?.user && emailConfig?.value?.pass)
    const hasEnvConfig = !!(process.env.SMTP_USER && process.env.SMTP_PASS)

    return NextResponse.json({
      success: emailResult.success,
      message: emailResult.success 
        ? '✅ Email de teste enviado com sucesso! Verifique sua caixa de entrada.'
        : '❌ Falha ao enviar email de teste',
      details: {
        emailResult,
        recipient: userEmail,
        configSource: hasDbConfig ? 'database' : hasEnvConfig ? 'environment' : 'none',
        hasPreferences: !!preferences,
        notificationCreated: !notifError
      },
      troubleshooting: !emailResult.success ? [
        'Verifique se o email está configurado em /dashboard/settings',
        'Certifique-se de usar uma senha de app do Gmail',
        'Verifique se as preferências de notificação estão ativadas',
        'Verifique os logs do servidor para mais detalhes'
      ] : []
    })
  } catch (error: any) {
    console.error('Erro no teste de notificação:', error)
    return NextResponse.json({
      error: 'Erro ao testar notificação',
      details: error.message
    }, { status: 500 })
  }
}