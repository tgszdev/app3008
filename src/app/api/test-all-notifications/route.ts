import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { createAndSendNotification } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    const results: any[] = []

    // Definir todos os tipos de notificação que o sistema usa
    const notificationTypes = [
      {
        name: 'Novo Chamado',
        type: 'ticket_created',
        title: '🆕 Novo Chamado #12345',
        message: 'Um novo chamado foi criado: Teste de Sistema',
        expectedPreference: 'ticket_created'
      },
      {
        name: 'Chamado Atribuído',
        type: 'ticket_assigned',
        title: '👤 Chamado #12345 atribuído a você',
        message: 'O chamado "Teste de Sistema" foi atribuído a você',
        expectedPreference: 'ticket_assigned'
      },
      {
        name: 'Chamado Atualizado (Status)',
        type: 'ticket_status_changed',
        title: '🔄 Chamado #12345 em andamento',
        message: 'Status do chamado "Teste de Sistema" foi alterado para in_progress',
        expectedPreference: 'ticket_updated' // Mapeado
      },
      {
        name: 'Chamado Atualizado (Prioridade)',
        type: 'ticket_priority_changed',
        title: '⚠️ Prioridade do Chamado #12345 alterada',
        message: 'Prioridade alterada de Média para Alta',
        expectedPreference: 'ticket_updated' // Mapeado
      },
      {
        name: 'Chamado Resolvido',
        type: 'ticket_resolved',
        title: '✅ Chamado #12345 resolvido',
        message: 'Seu chamado "Teste de Sistema" foi resolvido',
        expectedPreference: 'ticket_resolved'
      },
      {
        name: 'Novo Comentário',
        type: 'comment_added',
        title: '💬 Novo comentário no Chamado #12345',
        message: 'João comentou: "Este é um comentário de teste..."',
        expectedPreference: 'comment_added'
      },
      {
        name: 'Menção em Comentário',
        type: 'comment_mention',
        title: '📢 Você foi mencionado em um comentário',
        message: 'João mencionou você no Chamado #12345',
        expectedPreference: 'comment_mention'
      }
    ]

    // 1. Verificar preferências do usuário
    const { data: preferences } = await supabaseAdmin
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!preferences) {
      results.push({
        test: 'Preferências de Usuário',
        status: '❌ NÃO ENCONTRADO',
        message: 'Usuário não tem preferências configuradas. Criando padrão...'
      })

      // Criar preferências padrão
      const defaultPrefs = {
        user_id: userId,
        email_enabled: true,
        push_enabled: false,
        in_app_enabled: true,
        ticket_created: { email: true, push: false, in_app: true },
        ticket_assigned: { email: true, push: false, in_app: true },
        ticket_updated: { email: true, push: false, in_app: true },
        ticket_resolved: { email: true, push: false, in_app: true },
        comment_added: { email: true, push: false, in_app: true },
        comment_mention: { email: true, push: false, in_app: true },
        quiet_hours_enabled: false,
        email_frequency: 'immediate'
      }

      await supabaseAdmin
        .from('user_notification_preferences')
        .insert(defaultPrefs)
    } else {
      results.push({
        test: 'Preferências de Usuário',
        status: '✅ CONFIGURADO',
        details: {
          email_enabled: preferences.email_enabled,
          push_enabled: preferences.push_enabled,
          in_app_enabled: preferences.in_app_enabled
        }
      })
    }

    // 2. Verificar configuração de email
    const { data: emailConfig } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .eq('key', 'email_config')
      .single()

    const hasEmailConfig = !!(emailConfig?.value?.user && emailConfig?.value?.pass)
    results.push({
      test: 'Configuração de Email',
      status: hasEmailConfig ? '✅ CONFIGURADO' : '❌ NÃO CONFIGURADO',
      source: hasEmailConfig ? 'database' : 'environment/none'
    })

    // 3. Testar cada tipo de notificação
    const typeMapping: Record<string, string> = {
      'ticket_status_changed': 'ticket_updated',
      'ticket_priority_changed': 'ticket_updated',
      'test': 'ticket_updated'
    }

    for (const notif of notificationTypes) {
      const preferenceKey = typeMapping[notif.type] || notif.type
      const typePreferences = preferences?.[preferenceKey as keyof typeof preferences] as any
      
      const canSendEmail = !!(
        preferences?.email_enabled && 
        typePreferences?.email && 
        session.user.email &&
        hasEmailConfig
      )

      results.push({
        notification: notif.name,
        type: notif.type,
        mappedTo: preferenceKey !== notif.type ? preferenceKey : null,
        preferences: {
          email_enabled: preferences?.email_enabled || false,
          type_email: typePreferences?.email || false,
          type_push: typePreferences?.push || false,
          type_in_app: typePreferences?.in_app || false
        },
        willSendEmail: canSendEmail ? '✅ SIM' : '❌ NÃO',
        reason: !canSendEmail ? 
          (!preferences?.email_enabled ? 'Email global desativado' :
           !typePreferences?.email ? `Email desativado para ${preferenceKey}` :
           !session.user.email ? 'Usuário sem email' :
           !hasEmailConfig ? 'Email não configurado no sistema' : 'Desconhecido')
          : null
      })
    }

    // 4. Teste real de envio (opcional)
    const { searchParams } = new URL(request.url)
    const doSend = searchParams.get('send') === 'true'

    if (doSend) {
      results.push({
        test: 'ENVIO REAL DE TESTE',
        status: '🚀 INICIANDO...'
      })

      for (const notif of notificationTypes.slice(0, 2)) { // Enviar apenas 2 para não spammar
        const result = await createAndSendNotification({
          user_id: userId,
          title: `[TESTE] ${notif.title}`,
          message: `[TESTE] ${notif.message}`,
          type: notif.type,
          severity: 'info',
          data: { test: true },
          action_url: '/dashboard/settings/notifications'
        })

        results.push({
          sentTest: notif.name,
          success: result ? '✅' : '❌'
        })
      }
    }

    // Resumo
    const summary = {
      emailSystemReady: hasEmailConfig,
      userPreferencesReady: !!preferences,
      notificationTypesReady: results.filter(r => r.willSendEmail === '✅ SIM').length,
      totalTypes: notificationTypes.length,
      recommendation: !hasEmailConfig ? 
        '⚠️ Configure o email em /dashboard/settings' :
        !preferences?.email_enabled ?
        '⚠️ Ative o email em /dashboard/settings/notifications' :
        '✅ Sistema pronto para enviar notificações'
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      user: session.user.email,
      summary,
      results,
      tip: 'Adicione ?send=true na URL para enviar notificações de teste reais'
    })
  } catch (error: any) {
    console.error('Erro no teste:', error)
    return NextResponse.json({ 
      error: 'Erro ao executar teste',
      details: error.message 
    }, { status: 500 })
  }
}