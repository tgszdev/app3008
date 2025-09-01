// Exemplo de como criar notificações com URLs corretas
// Este arquivo mostra como integrar notificações ao criar/atualizar tickets

import { createAndSendNotification } from '@/lib/notifications'

// Exemplo 1: Notificar quando um ticket é criado
export async function notifyNewTicket(ticket: any, createdBy: any) {
  // Notificar administradores
  await createAndSendNotification({
    user_id: 'admin-user-id', // ID do admin
    title: `Novo Chamado #${ticket.ticket_number}`,
    message: `${createdBy.name} criou um novo chamado: ${ticket.title}`,
    type: 'ticket_created',
    severity: 'info',
    data: {
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number
    },
    action_url: `/dashboard/tickets/${ticket.id}` // Link para o ticket
  })
}

// Exemplo 2: Notificar quando um ticket é atribuído
export async function notifyTicketAssigned(ticket: any, assignedTo: string, assignedBy: any) {
  await createAndSendNotification({
    user_id: assignedTo,
    title: `Chamado #${ticket.ticket_number} atribuído a você`,
    message: `${assignedBy.name} atribuiu o chamado "${ticket.title}" a você`,
    type: 'ticket_assigned',
    severity: 'info',
    data: {
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number
    },
    action_url: `/dashboard/tickets/${ticket.id}` // Link para o ticket
  })
}

// Exemplo 3: Notificar quando um comentário é adicionado
export async function notifyNewComment(ticket: any, comment: any, author: any) {
  await createAndSendNotification({
    user_id: ticket.created_by, // Notificar o criador do ticket
    title: `Novo comentário no Chamado #${ticket.ticket_number}`,
    message: `${author.name} comentou: "${comment.content.substring(0, 100)}..."`,
    type: 'comment_added',
    severity: 'info',
    data: {
      ticket_id: ticket.id,
      comment_id: comment.id
    },
    action_url: `/dashboard/tickets/${ticket.id}#comment-${comment.id}` // Link para o comentário
  })
}

// Exemplo 4: Notificar quando ticket é resolvido
export async function notifyTicketResolved(ticket: any, resolvedBy: any) {
  await createAndSendNotification({
    user_id: ticket.created_by,
    title: `Chamado #${ticket.ticket_number} foi resolvido`,
    message: `${resolvedBy.name} resolveu seu chamado: ${ticket.title}`,
    type: 'ticket_resolved',
    severity: 'success',
    data: {
      ticket_id: ticket.id
    },
    action_url: `/dashboard/tickets/${ticket.id}` // Link para o ticket
  })
}

// Exemplo 5: Notificar menção em comentário
export async function notifyMention(ticket: any, mentionedUserId: string, mentionedBy: any) {
  await createAndSendNotification({
    user_id: mentionedUserId,
    title: `Você foi mencionado no Chamado #${ticket.ticket_number}`,
    message: `${mentionedBy.name} mencionou você em um comentário`,
    type: 'comment_mention',
    severity: 'info',
    data: {
      ticket_id: ticket.id
    },
    action_url: `/dashboard/tickets/${ticket.id}` // Link para o ticket
  })
}

// Exemplo 6: Notificação de sistema sem URL específica
export async function notifySystemUpdate(userId: string, message: string) {
  await createAndSendNotification({
    user_id: userId,
    title: 'Atualização do Sistema',
    message: message,
    type: 'system',
    severity: 'info',
    action_url: undefined // Sem link específico
  })
}

// Exemplo 7: Notificação de relatório pronto
export async function notifyReportReady(userId: string, reportName: string, reportId: string) {
  await createAndSendNotification({
    user_id: userId,
    title: 'Relatório Pronto',
    message: `O relatório "${reportName}" está pronto para download`,
    type: 'report_ready',
    severity: 'success',
    data: {
      report_id: reportId,
      report_name: reportName
    },
    action_url: `/dashboard/reports/${reportId}` // Link para o relatório
  })
}