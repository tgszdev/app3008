import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    const diagnostics: any = {
      user: {
        id: userId,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role
      },
      checks: []
    }

    // 1. Verificar se o usuário tem preferências de notificação
    const { data: preferences, error: prefError } = await supabaseAdmin
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (prefError || !preferences) {
      diagnostics.checks.push({
        test: 'Preferências de Notificação',
        status: '❌ NÃO CONFIGURADO',
        message: 'Usuário não tem preferências de notificação configuradas',
        action: 'Acesse /dashboard/settings/notifications para configurar'
      })

      // Criar preferências padrão se não existirem
      if (!preferences) {
        const { error: createError } = await supabaseAdmin
          .from('user_notification_preferences')
          .insert({
            user_id: userId,
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
          })

        if (!createError) {
          diagnostics.checks.push({
            test: 'Criar Preferências Padrão',
            status: '✅ CRIADO',
            message: 'Preferências padrão foram criadas com sucesso'
          })
        }
      }
    } else {
      diagnostics.preferences = preferences
      diagnostics.checks.push({
        test: 'Preferências de Notificação',
        status: '✅ CONFIGURADO',
        message: 'Preferências encontradas',
        details: {
          email_enabled: preferences.email_enabled,
          push_enabled: preferences.push_enabled,
          in_app_enabled: preferences.in_app_enabled
        }
      })
    }

    // 2. Verificar configuração de email no sistema
    const { data: emailConfig, error: emailError } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .eq('key', 'email_config')
      .single()

    if (emailError || !emailConfig) {
      diagnostics.checks.push({
        test: 'Configuração de Email',
        status: '❌ NÃO CONFIGURADO',
        message: 'Sistema não tem configuração de email',
        action: 'Admin deve configurar em /dashboard/settings'
      })
    } else {
      const config = emailConfig.value
      diagnostics.checks.push({
        test: 'Configuração de Email',
        status: '✅ CONFIGURADO',
        message: 'Email configurado no sistema',
        details: {
          host: config.host,
          port: config.port,
          user: config.user ? '✅ Configurado' : '❌ Não configurado',
          pass: config.pass ? '✅ Configurado' : '❌ Não configurado'
        }
      })
    }

    // 3. Verificar variáveis de ambiente (fallback)
    diagnostics.checks.push({
      test: 'Variáveis de Ambiente (Fallback)',
      status: process.env.SMTP_USER && process.env.SMTP_PASS ? '✅ CONFIGURADO' : '❌ NÃO CONFIGURADO',
      message: 'Configuração de fallback',
      details: {
        SMTP_USER: process.env.SMTP_USER ? '✅ Configurado' : '❌ Não configurado',
        SMTP_PASS: process.env.SMTP_PASS ? '✅ Configurado' : '❌ Não configurado'
      }
    })

    // 4. Verificar últimas notificações
    const { data: recentNotifications, error: notifError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    diagnostics.recentNotifications = recentNotifications || []
    diagnostics.checks.push({
      test: 'Notificações Recentes',
      status: recentNotifications && recentNotifications.length > 0 ? '✅ EXISTEM' : '⚠️ NENHUMA',
      message: `${recentNotifications?.length || 0} notificações encontradas`,
      details: recentNotifications?.map(n => ({
        title: n.title,
        type: n.type,
        created_at: n.created_at,
        is_read: n.is_read
      }))
    })

    // 5. Testar envio de notificação
    const { createAndSendNotification } = await import('@/lib/notifications')
    const testResult = await createAndSendNotification({
      user_id: userId,
      title: '🔍 Teste de Diagnóstico',
      message: 'Esta é uma notificação de teste para verificar se o sistema está funcionando',
      type: 'test',
      severity: 'info',
      data: {
        test_time: new Date().toISOString()
      },
      action_url: '/dashboard/settings/notifications'
    })

    diagnostics.checks.push({
      test: 'Envio de Notificação de Teste',
      status: testResult ? '✅ SUCESSO' : '❌ FALHOU',
      message: testResult ? 'Notificação de teste enviada' : 'Falha ao enviar notificação'
    })

    // Resumo
    const allChecksPass = diagnostics.checks.every((check: any) => 
      check.status.includes('✅') || check.status.includes('CRIADO')
    )

    diagnostics.summary = {
      status: allChecksPass ? '✅ SISTEMA OK' : '⚠️ AÇÃO NECESSÁRIA',
      message: allChecksPass 
        ? 'Sistema de notificações está funcionando corretamente' 
        : 'Algumas configurações precisam ser ajustadas',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(diagnostics)
  } catch (error: any) {
    console.error('Erro no diagnóstico:', error)
    return NextResponse.json({ 
      error: 'Erro ao executar diagnóstico',
      details: error.message 
    }, { status: 500 })
  }
}