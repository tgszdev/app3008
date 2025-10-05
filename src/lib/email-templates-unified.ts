/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║  TEMPLATE UNIFICADO - OTIMIZADO PARA EMAIL                         ║
 * ║  100% Compatível com Gmail, Outlook, Apple Mail                    ║
 * ║  Renderização cristalina em todos os clientes                      ║
 * ╚════════════════════════════════════════════════════════════════════╝
 */

type NotificationType = 
  | 'ticket_created' | 'ticket_assigned' | 'ticket_status_changed'
  | 'new_comment' | 'comment_added' | 'ticket_priority_changed'
  | 'ticket_resolved' | 'ticket_closed' | 'mention' | 'sla_warning'

interface NotificationData {
  ticket_number: string
  ticket_title?: string
  ticket_url: string
  created_by?: string
  assigned_to?: string
  commenter_name?: string
  changed_by?: string
  client_name?: string
  category?: string
  priority?: string
  comment_text?: string
  description?: string
  old_status?: string
  new_status?: string
  old_priority?: string
  new_priority?: string
  resolution_notes?: string
  type: NotificationType
}

function getTitleForType(type: NotificationType): string {
  const titles: Record<NotificationType, string> = {
    'ticket_created': 'Novo Chamado Criado',
    'ticket_assigned': 'Chamado Atribuído',
    'ticket_status_changed': 'Status Alterado',
    'new_comment': 'Novo Comentário',
    'comment_added': 'Novo Comentário',
    'ticket_priority_changed': 'Prioridade Alterada',
    'ticket_resolved': 'Chamado Resolvido',
    'ticket_closed': 'Chamado Fechado',
    'mention': 'Você foi Mencionado',
    'sla_warning': 'Alerta de SLA'
  }
  return titles[type] || 'Notificação'
}

function translatePriority(priority?: string): string {
  if (!priority) return 'MÉDIA'
  const map: Record<string, string> = {
    'low': 'BAIXA', 'medium': 'MÉDIA', 'high': 'ALTA',
    'critical': 'CRÍTICA', 'urgent': 'URGENTE'
  }
  return map[priority.toLowerCase()] || priority.toUpperCase()
}

function getPriorityColor(priority?: string): string {
  if (!priority) return '#f59e0b'
  const colors: Record<string, string> = {
    'low': '#10b981',
    'medium': '#f59e0b', 
    'high': '#ef4444',
    'critical': '#dc2626',
    'urgent': '#991b1b'
  }
  return colors[priority.toLowerCase()] || '#f59e0b'
}

function getMainContent(type: NotificationType, data: NotificationData): string {
  switch (type) {
    case 'ticket_created':
    case 'ticket_assigned':
      return `
        ${data.ticket_title ? `
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px">
            <tr>
              <td style="background:#f8f9fa;border:1px solid #e0e0e0;border-left:3px solid #8b5cf6;border-radius:6px;padding:24px">
                <div style="font-size:12px;color:#666;font-weight:600;letter-spacing:1px;margin-bottom:12px;text-transform:uppercase">TÍTULO DO CHAMADO</div>
                <div style="font-size:19px;font-weight:600;color:#1a1a1a;margin-bottom:12px">${data.ticket_title}</div>
                ${data.description ? `
                  <div style="font-size:12px;color:#666;font-weight:600;letter-spacing:1px;margin:16px 0 12px;text-transform:uppercase">DESCRIÇÃO</div>
                  <div style="font-size:15px;color:#333;line-height:1.8">${data.description.substring(0, 300)}${data.description.length > 300 ? '...' : ''}</div>
                ` : ''}
              </td>
            </tr>
          </table>
        ` : ''}
      `
    
    case 'ticket_status_changed':
      return `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px">
          <tr>
            <td style="background:#f8f9fa;border:1px solid #e0e0e0;border-left:3px solid #8b5cf6;border-radius:6px;padding:24px">
              <div style="font-size:12px;color:#666;font-weight:600;letter-spacing:1px;margin-bottom:16px;text-transform:uppercase">MUDANÇA DE STATUS</div>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding:12px">
                    <div style="font-size:12px;color:#666;margin-bottom:8px;font-weight:500">ANTERIOR</div>
                    <div style="background:#fff;border:1px solid #e0e0e0;padding:12px 20px;border-radius:6px;color:#333;font-weight:600;display:inline-block">${data.old_status || '—'}</div>
                  </td>
                  <td align="center" width="40" style="font-size:20px;color:#8b5cf6">→</td>
                  <td align="center" style="padding:12px">
                    <div style="font-size:12px;color:#666;margin-bottom:8px;font-weight:500">NOVO</div>
                    <div style="background:#8b5cf6;padding:12px 20px;border-radius:6px;color:#fff;font-weight:600;display:inline-block">${data.new_status || '—'}</div>
                  </td>
                </tr>
              </table>
              ${data.resolution_notes ? `
                <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e0e0e0">
                  <div style="font-size:12px;color:#666;margin-bottom:8px;font-weight:600">OBSERVAÇÕES</div>
                  <div style="color:#333;font-size:14px;line-height:1.6">${data.resolution_notes}</div>
                </div>
              ` : ''}
            </td>
          </tr>
        </table>
        ${data.ticket_title ? `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px">
          <tr>
            <td style="background:#f8f9fa;border:1px solid #e0e0e0;border-left:3px solid #999;border-radius:6px;padding:20px">
              <div style="font-size:12px;color:#666;font-weight:600;letter-spacing:1px;margin-bottom:12px;text-transform:uppercase">SOBRE O CHAMADO</div>
              <div style="font-size:18px;font-weight:600;color:#1a1a1a">${data.ticket_title}</div>
            </td>
          </tr>
        </table>
        ` : ''}
      `
    
    case 'new_comment':
    case 'comment_added':
      return `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px">
          <tr>
            <td style="background:#f8f9fa;border:1px solid #e0e0e0;border-left:3px solid #8b5cf6;border-radius:6px;padding:24px">
              <div style="font-size:12px;color:#666;font-weight:600;letter-spacing:1px;margin-bottom:12px;text-transform:uppercase">COMENTÁRIO RECEBIDO</div>
              <div style="font-size:15px;color:#333;line-height:1.8">${data.comment_text || 'Novo comentário adicionado'}</div>
            </td>
          </tr>
        </table>
        ${data.ticket_title ? `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px">
          <tr>
            <td style="background:#f8f9fa;border:1px solid #e0e0e0;border-left:3px solid #999;border-radius:6px;padding:20px">
              <div style="font-size:12px;color:#666;font-weight:600;letter-spacing:1px;margin-bottom:12px;text-transform:uppercase">SOBRE O CHAMADO</div>
              <div style="font-size:18px;font-weight:600;color:#1a1a1a;margin-bottom:12px">${data.ticket_title}</div>
              ${data.description && data.description !== data.comment_text ? `
                <div style="font-size:14px;color:#666;line-height:1.6;margin-top:12px">${data.description.substring(0, 180)}...</div>
              ` : ''}
            </td>
          </tr>
        </table>
        ` : ''}
      `
    
    default:
      return `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px">
          <tr>
            <td style="background:#f8f9fa;border:1px solid #e0e0e0;border-left:3px solid #8b5cf6;border-radius:6px;padding:24px">
              <div style="font-size:15px;color:#333;line-height:1.8">${data.comment_text || data.description || 'Você tem uma nova notificação'}</div>
            </td>
          </tr>
        </table>
      `
  }
}

export function generateUnifiedEmailTemplate(data: NotificationData): string {
  const title = getTitleForType(data.type)
  const mainContent = getMainContent(data.type, data)
  const priorityTranslated = translatePriority(data.priority)
  const priorityColor = getPriorityColor(data.priority)
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,address=no,email=no">
<title>${title} - #${data.ticket_number}</title>
<style>
a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}
u+#body a{color:inherit;text-decoration:none;font-size:inherit;font-family:inherit;font-weight:inherit;line-height:inherit}
</style>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f5f5f5;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f5;padding:40px 20px">
    <tr>
      <td align="center">
        <!-- Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="800" style="max-width:800px;background-color:#ffffff;border:1px solid #e0e0e0;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.08)">
          
          <!-- Header -->
          <tr>
            <td style="padding:40px 48px 32px;background-color:#ffffff;border-bottom:1px solid #e0e0e0">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    <p style="margin:0 0 16px;font-size:13px;color:#999;font-weight:500;text-transform:uppercase;letter-spacing:0.5px">Nova Atividade</p>
                    <h1 style="margin:0 0 8px;font-size:32px;font-weight:700;color:#1a1a1a;letter-spacing:-0.5px">${title}</h1>
                    <p style="margin:0 0 4px;font-size:15px;color:#999;font-weight:400">Chamado <span style="color:#333;font-weight:600">#${data.ticket_number}</span></p>
                    ${data.commenter_name || data.changed_by ? `
                    <p style="margin:8px 0 0;font-size:14px;color:#666">Por <span style="color:#333;font-weight:500">${data.commenter_name || data.changed_by}</span> • Agora mesmo</p>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding:40px 48px;background-color:#ffffff">
              ${mainContent}
              
              <!-- Properties -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f8f9fa;border:1px solid #e0e0e0;border-radius:6px;margin-bottom:24px">
                ${data.created_by ? `
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e0e0e0">
                    <div style="font-size:12px;color:#666;font-weight:600;margin-bottom:6px;letter-spacing:0.5px">SOLICITANTE</div>
                    <div style="font-size:15px;color:#1a1a1a;font-weight:500">${data.created_by}</div>
                  </td>
                </tr>
                ` : ''}
                ${data.assigned_to || data.type.includes('assign') ? `
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e0e0e0">
                    <div style="font-size:12px;color:#666;font-weight:600;margin-bottom:6px;letter-spacing:0.5px">RESPONSÁVEL</div>
                    <div style="font-size:15px;color:#1a1a1a;font-weight:500">${data.assigned_to || 'Aguardando atribuição'}</div>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e0e0e0">
                    <div style="font-size:12px;color:#666;font-weight:600;margin-bottom:6px;letter-spacing:0.5px">CLIENTE / ORGANIZAÇÃO</div>
                    <div style="font-size:15px;color:#1a1a1a;font-weight:500">${data.client_name || 'Não informado'}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px">
                    <div style="font-size:12px;color:#666;font-weight:600;margin-bottom:6px;letter-spacing:0.5px">CATEGORIA</div>
                    <div style="font-size:15px;color:#1a1a1a;font-weight:500">${data.category || 'Geral'}</div>
                  </td>
                </tr>
              </table>
              
              <!-- Priority -->
              ${data.priority ? `
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px">
                <tr>
                  <td align="center" style="background-color:${priorityColor};border-radius:6px;padding:24px">
                    <div style="font-size:11px;color:#fff;font-weight:700;letter-spacing:1.5px;margin-bottom:8px">NÍVEL DE CRITICIDADE</div>
                    <div style="font-size:26px;color:#fff;font-weight:700">${translatePriority(data.priority)}</div>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Button -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${data.ticket_url}" style="display:inline-block;background-color:#8b5cf6;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:600;font-size:15px">Acessar Chamado →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:32px 48px;background-color:#fafafa;border-top:1px solid #e0e0e0;text-align:center;color:#999;font-size:13px">
              <p style="margin:0">Sistema de Suporte Técnico</p>
              <p style="margin:8px 0 0">Notificação automática • Não responda</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function generateEmailFromNotification(type: NotificationType, data: Partial<NotificationData>): string {
  const fullData: NotificationData = {
    type,
    ticket_number: data.ticket_number || '0000',
    ticket_url: data.ticket_url || '#',
    ticket_title: data.ticket_title,
    created_by: data.created_by,
    assigned_to: data.assigned_to,
    commenter_name: data.commenter_name,
    changed_by: data.changed_by,
    client_name: data.client_name,
    category: data.category,
    priority: data.priority,
    comment_text: data.comment_text,
    description: data.description,
    old_status: data.old_status,
    new_status: data.new_status,
    old_priority: data.old_priority,
    new_priority: data.new_priority,
    resolution_notes: data.resolution_notes
  }
  
  return generateUnifiedEmailTemplate(fullData)
}
