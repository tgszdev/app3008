import { createClient } from '@supabase/supabase-js'
import { sendNotificationEmail as sendEmail } from './email-config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface NotificationData {
  user_id: string
  title: string
  message: string
  type: string
  severity?: 'info' | 'warning' | 'error' | 'success'
  data?: any
  action_url?: string
}

// Função principal para criar e enviar notificação
export async function createAndSendNotification(notification: NotificationData) {
  try {
    // 1. Criar notificação no banco
    const { data: notif, error: notifError } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()

    if (notifError) {
      console.error('Error creating notification:', notifError)
      return false
    }

    // 2. Buscar preferências do usuário
    const { data: preferences } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', notification.user_id)
      .single()

    if (!preferences) {
      return true // Notificação criada mas sem preferências
    }

    // 3. Buscar dados do usuário
    const { data: user } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', notification.user_id)
      .single()

    if (!user) {
      return true
    }

    // 4. Verificar horário de silêncio
    if (preferences.quiet_hours_enabled) {
      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes()
      
      const [startHour, startMin] = preferences.quiet_hours_start.split(':').map(Number)
      const [endHour, endMin] = preferences.quiet_hours_end.split(':').map(Number)
      
      const startTime = startHour * 60 + startMin
      const endTime = endHour * 60 + endMin
      
      // Se está no horário de silêncio, não enviar push/email
      if (
        (startTime < endTime && currentTime >= startTime && currentTime < endTime) ||
        (startTime > endTime && (currentTime >= startTime || currentTime < endTime))
      ) {
        console.log('Notification created but not sent due to quiet hours')
        return true
      }
    }

    // 5. Enviar email se habilitado
    // Mapear tipos de notificação para preferências existentes
    const typeMapping: Record<string, string> = {
      'ticket_status_changed': 'ticket_updated',
      'ticket_priority_changed': 'ticket_updated',
      'test': 'ticket_updated' // Para testes, usar ticket_updated como padrão
    }
    
    const preferenceKey = typeMapping[notification.type] || notification.type
    const typePreferences = preferences[preferenceKey as keyof typeof preferences] as any
    
    console.log('DEBUG: Verificando envio de email', {
      type: notification.type,
      preferenceKey,
      email_enabled: preferences.email_enabled,
      typePreferences,
      user_email: user.email
    })
    
    if (preferences.email_enabled && typePreferences?.email && user.email) {
      try {
        console.log('Tentando enviar email para:', user.email)
        const result = await sendEmail({
          to: user.email,
          title: notification.title,
          message: notification.message,
          actionUrl: notification.action_url,
          actionText: 'Ver Detalhes'
        })
        console.log('Resultado do envio de email:', result)
        if (result.success) {
          console.log('✅ Email de notificação enviado com sucesso para:', user.email)
        } else {
          console.error('❌ Falha ao enviar email:', result.error)
        }
      } catch (emailError) {
        console.error('Erro ao enviar email de notificação:', emailError)
        // Não falhar se o email não for enviado
      }
    } else {
      console.log('Email não enviado. Condições:', {
        email_enabled: preferences.email_enabled,
        type_email_enabled: typePreferences?.email,
        has_user_email: !!user.email
      })
    }

    // 6. Enviar push notification se habilitado
    if (preferences.push_enabled && typePreferences?.push) {
      const { data: subscriptions } = await supabase
        .from('user_push_subscriptions')
        .select('*')
        .eq('user_id', notification.user_id)
        .eq('active', true)

      if (subscriptions && subscriptions.length > 0) {
        // Enviar para cada dispositivo inscrito
        for (const subscription of subscriptions) {
          await sendPushNotification(subscription, {
            title: notification.title,
            body: notification.message,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            url: notification.action_url,
            tag: notification.type,
            data: notification.data
          })
        }
      }
    }

    return true
  } catch (error) {
    console.error('Error in createAndSendNotification:', error)
    return false
  }
}

// Função para enviar push notification
async function sendPushNotification(subscription: any, payload: any) {
  try {
    // Aqui você precisaria implementar o envio real usando web-push
    // Por enquanto, vamos apenas logar
    console.log('Would send push notification:', {
      endpoint: subscription.endpoint,
      payload
    })

    // Em produção, você usaria a biblioteca web-push:
    // const webpush = require('web-push')
    // webpush.sendNotification(subscription, JSON.stringify(payload))
    
    return true
  } catch (error) {
    console.error('Error sending push notification:', error)
    
    // Se falhar, desativar a subscription
    await supabase
      .from('user_push_subscriptions')
      .update({ active: false })
      .eq('id', subscription.id)
    
    return false
  }
}

// Funções helper para tipos específicos de notificação
export async function notifyTicketCreated(ticket: any, created_by: any) {
  // Notificar todos os analistas e admins
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .in('role', ['admin', 'analyst'])
    .eq('is_active', true)

  if (users) {
    for (const user of users) {
      await createAndSendNotification({
        user_id: user.id,
        title: `Novo Chamado #${ticket.ticket_number}`,
        message: `${created_by.name} criou um novo chamado: ${ticket.title}`,
        type: 'ticket_created',
        severity: 'info',
        data: {
          ticket_id: ticket.id,
          ticket_number: ticket.ticket_number,
          title: ticket.title,
          priority: ticket.priority,
          created_by: created_by.name
        },
        action_url: `/dashboard/tickets/${ticket.id}` // URL correta para o ticket
      })
    }
  }
}

export async function notifyTicketAssigned(ticket: any, assigned_to: string, assigned_by: any) {
  await createAndSendNotification({
    user_id: assigned_to,
    title: `Chamado #${ticket.ticket_number} atribuído a você`,
    message: `${assigned_by.name} atribuiu o chamado "${ticket.title}" a você`,
    type: 'ticket_assigned',
    severity: 'info',
    data: {
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number,
      title: ticket.title,
      priority: ticket.priority,
      assigned_by: assigned_by.name
    },
    action_url: `/dashboard/tickets/${ticket.id}`
  })
}

export async function notifyTicketResolved(ticket: any, resolved_by: any) {
  // Notificar o criador do chamado
  await createAndSendNotification({
    user_id: ticket.created_by,
    title: `Chamado #${ticket.ticket_number} resolvido`,
    message: `Seu chamado "${ticket.title}" foi resolvido por ${resolved_by.name}`,
    type: 'ticket_resolved',
    severity: 'success',
    data: {
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number,
      title: ticket.title,
      resolved_by: resolved_by.name,
      resolution_notes: ticket.resolution_notes
    },
    action_url: `/dashboard/tickets/${ticket.id}`
  })
}

export async function notifyCommentAdded(ticket: any, comment: any, author: any, mentioned_users?: string[]) {
  // Notificar participantes do chamado
  const participants = new Set<string>()
  
  // Adicionar criador do chamado
  participants.add(ticket.created_by)
  
  // Adicionar responsável se houver
  if (ticket.assigned_to) {
    participants.add(ticket.assigned_to)
  }
  
  // Remover o autor do comentário
  participants.delete(author.id)
  
  // Notificar participantes
  for (const user_id of participants) {
    await createAndSendNotification({
      user_id,
      title: `Novo comentário no Chamado #${ticket.ticket_number}`,
      message: `${author.name} comentou: "${comment.content.substring(0, 100)}..."`,
      type: 'comment_added',
      severity: 'info',
      data: {
        ticket_id: ticket.id,
        ticket_number: ticket.ticket_number,
        comment_id: comment.id,
        author: author.name,
        preview: comment.content.substring(0, 200)
      },
      action_url: `/dashboard/tickets/${ticket.id}#comment-${comment.id}`
    })
  }
  
  // Notificar usuários mencionados
  if (mentioned_users && mentioned_users.length > 0) {
    for (const user_id of mentioned_users) {
      await createAndSendNotification({
        user_id,
        title: `Você foi mencionado em um comentário`,
        message: `${author.name} mencionou você no Chamado #${ticket.ticket_number}`,
        type: 'comment_mention',
        severity: 'info',
        data: {
          ticket_id: ticket.id,
          ticket_number: ticket.ticket_number,
          comment_id: comment.id,
          mentioned_by: author.name,
          preview: comment.content.substring(0, 200)
        },
        action_url: `/dashboard/tickets/${ticket.id}#comment-${comment.id}`
      })
    }
  }
}