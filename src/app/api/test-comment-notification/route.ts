import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { createAndSendNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { ticket_id } = await request.json()
    

    // 1. Buscar um ticket para testar (ou usar o ID fornecido)
    let targetTicket
    if (ticket_id) {
      const { data } = await supabaseAdmin
        .from('tickets')
        .select('*')
        .eq('id', ticket_id)
        .single()
      targetTicket = data
    } else {
      // Buscar o ticket mais recente
      const { data } = await supabaseAdmin
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      targetTicket = data
    }

    if (!targetTicket) {
      return NextResponse.json({
        error: 'Nenhum ticket encontrado para teste',
        suggestion: 'Crie um ticket primeiro ou forneça um ticket_id válido'
      }, { status: 404 })
    }

    console.log('Ticket encontrado:', {
      id: targetTicket.id,
      number: targetTicket.ticket_number,
      title: targetTicket.title,
      created_by: targetTicket.created_by,
      assigned_to: targetTicket.assigned_to
    })

    // 2. Verificar preferências do criador do ticket
    const results: any = {
      ticket: {
        id: targetTicket.id,
        number: targetTicket.ticket_number,
        title: targetTicket.title,
        created_by: targetTicket.created_by,
        assigned_to: targetTicket.assigned_to
      },
      notifications: [],
      preferences: {},
      errors: []
    }

    // Verificar preferências do criador
    if (targetTicket.created_by && targetTicket.created_by !== session.user.id) {
      const { data: creatorPrefs } = await supabaseAdmin
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', targetTicket.created_by)
        .single()

      const { data: creator } = await supabaseAdmin
        .from('users')
        .select('email, name')
        .eq('id', targetTicket.created_by)
        .single()

      results.preferences.creator = {
        user: creator?.email,
        has_preferences: !!creatorPrefs,
        email_enabled: creatorPrefs?.email_enabled,
        comment_added_email: creatorPrefs?.comment_added?.email || false
      }

      // Criar preferências se não existirem
      if (!creatorPrefs) {
        await supabaseAdmin
          .from('user_notification_preferences')
          .insert({
            user_id: targetTicket.created_by,
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
          })
        results.preferences.creator.preferences_created = true
      }

      // Tentar enviar notificação
      try {
        const result = await createAndSendNotification({
          user_id: targetTicket.created_by,
          title: `[TESTE] Novo comentário no Chamado #${targetTicket.ticket_number || targetTicket.id.substring(0, 8)}`,
          message: `${session.user.name || 'Usuário'} comentou: "Este é um comentário de teste para verificar notificações"`,
          type: 'comment_added',
          severity: 'info',
          data: {
            ticket_id: targetTicket.id,
            comment_id: 'test-comment-id',
            ticket_number: targetTicket.ticket_number
          },
          action_url: `/dashboard/tickets/${targetTicket.id}`
        })

        results.notifications.push({
          recipient: 'creator',
          email: creator?.email,
          success: result,
          type: 'comment_added'
        })
      } catch (error: any) {
        results.errors.push({
          recipient: 'creator',
          error: error.message
        })
      }
    }

    // Verificar preferências do responsável
    if (targetTicket.assigned_to && 
        targetTicket.assigned_to !== session.user.id && 
        targetTicket.assigned_to !== targetTicket.created_by) {
      
      const { data: assigneePrefs } = await supabaseAdmin
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', targetTicket.assigned_to)
        .single()

      const { data: assignee } = await supabaseAdmin
        .from('users')
        .select('email, name')
        .eq('id', targetTicket.assigned_to)
        .single()

      results.preferences.assignee = {
        user: assignee?.email,
        has_preferences: !!assigneePrefs,
        email_enabled: assigneePrefs?.email_enabled,
        comment_added_email: assigneePrefs?.comment_added?.email || false
      }

      // Criar preferências se não existirem
      if (!assigneePrefs) {
        await supabaseAdmin
          .from('user_notification_preferences')
          .insert({
            user_id: targetTicket.assigned_to,
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
          })
        results.preferences.assignee.preferences_created = true
      }

      // Tentar enviar notificação
      try {
        const result = await createAndSendNotification({
          user_id: targetTicket.assigned_to,
          title: `[TESTE] Novo comentário no Chamado #${targetTicket.ticket_number || targetTicket.id.substring(0, 8)}`,
          message: `${session.user.name || 'Usuário'} comentou: "Este é um comentário de teste para verificar notificações"`,
          type: 'comment_added',
          severity: 'info',
          data: {
            ticket_id: targetTicket.id,
            comment_id: 'test-comment-id',
            ticket_number: targetTicket.ticket_number
          },
          action_url: `/dashboard/tickets/${targetTicket.id}`
        })

        results.notifications.push({
          recipient: 'assignee',
          email: assignee?.email,
          success: result,
          type: 'comment_added'
        })
      } catch (error: any) {
        results.errors.push({
          recipient: 'assignee',
          error: error.message
        })
      }
    }

    // 3. Verificar configuração de email do sistema
    const { data: emailConfig } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .eq('key', 'email_config')
      .single()

    results.email_config = {
      configured: !!(emailConfig?.value?.user && emailConfig?.value?.pass),
      source: emailConfig ? 'database' : 'environment/none'
    }

    // 4. Análise e recomendações
    const analysis: any = {
      should_notify_creator: targetTicket.created_by && targetTicket.created_by !== session.user.id,
      should_notify_assignee: targetTicket.assigned_to && 
                              targetTicket.assigned_to !== session.user.id && 
                              targetTicket.assigned_to !== targetTicket.created_by,
      notifications_sent: results.notifications.filter((n: any) => n.success).length,
      total_expected: 0,
      success: false
    }

    if (analysis.should_notify_creator) analysis.total_expected++
    if (analysis.should_notify_assignee) analysis.total_expected++

    analysis.success = analysis.notifications_sent === analysis.total_expected

    // Recomendações
    const recommendations = []
    if (!results.email_config.configured) {
      recommendations.push('❌ Configure o email em /dashboard/settings')
    }
    if (results.notifications.some((n: any) => !n.success)) {
      recommendations.push('❌ Verificar preferências de notificação dos usuários')
    }
    if (!analysis.should_notify_creator && !analysis.should_notify_assignee) {
      recommendations.push('⚠️ Você é o criador ou responsável, por isso não recebeu notificação')
    }

    return NextResponse.json({
      success: analysis.success,
      message: analysis.success 
        ? `✅ Teste concluído! ${analysis.notifications_sent} notificação(ões) enviada(s)`
        : '⚠️ Teste concluído com problemas',
      analysis,
      results,
      recommendations,
      debug: {
        current_user: session.user.email,
        current_user_id: session.user.id,
        is_creator: targetTicket.created_by === session.user.id,
        is_assignee: targetTicket.assigned_to === session.user.id
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Erro ao testar notificação de comentário',
      details: error.message
    }, { status: 500 })
  }
}