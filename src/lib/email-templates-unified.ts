/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║  TEMPLATE UNIFICADO DE EMAIL - GLASSMORPHISM (Template 02)        ║
 * ║  Aplicado a TODAS as notificações                                  ║
 * ║  100% Responsivo para Mobile, Tablet, Desktop                      ║
 * ╚════════════════════════════════════════════════════════════════════╝
 */

// Tipos de notificação suportados
type NotificationType = 
  | 'ticket_created'      // Novo chamado criado
  | 'ticket_assigned'     // Chamado atribuído
  | 'ticket_status_changed' // Mudança de status
  | 'new_comment'         // Novo comentário
  | 'comment_added'       // Comentário adicionado
  | 'ticket_priority_changed' // Mudança de prioridade
  | 'ticket_resolved'     // Chamado resolvido
  | 'ticket_closed'       // Chamado fechado
  | 'mention'             // Menção em comentário
  | 'sla_warning'         // Aviso de SLA

// Dados da notificação
interface NotificationData {
  // Básico
  ticket_number: string
  ticket_title?: string
  ticket_url: string
  
  // Pessoas
  created_by?: string
  assigned_to?: string
  commenter_name?: string
  changed_by?: string
  
  // Contexto
  client_name?: string
  category?: string
  priority?: string
  
  // Conteúdo
  comment_text?: string
  description?: string
  old_status?: string
  new_status?: string
  old_priority?: string
  new_priority?: string
  resolution_notes?: string
  
  // Meta
  type: NotificationType
}

// Mapear ícones por tipo
function getIconForType(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    'ticket_created': '🎫',
    'ticket_assigned': '👤',
    'ticket_status_changed': '🔄',
    'new_comment': '💬',
    'comment_added': '💬',
    'ticket_priority_changed': '⚡',
    'ticket_resolved': '✅',
    'ticket_closed': '🔒',
    'mention': '@',
    'sla_warning': '⚠️'
  }
  return icons[type] || '📧'
}

// Mapear títulos por tipo
function getTitleForType(type: NotificationType, data: NotificationData): string {
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

// Gerar conteúdo dinâmico baseado no tipo
function getMainContent(type: NotificationType, data: NotificationData): string {
  switch (type) {
    case 'ticket_created':
      return `
        <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:20px 0">
          <p style="margin:0 0 12px;color:#64748b;font-size:13px;font-weight:600">DESCRIÇÃO DO CHAMADO</p>
          <p style="margin:0;color:#334155;line-height:1.6">${data.description || data.ticket_title || 'Novo chamado aberto no sistema'}</p>
        </div>
      `
    
    case 'ticket_status_changed':
      return `
        <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:20px 0">
          <div style="display:flex;align-items:center;justify-content:center;gap:16px">
            <div style="text-align:center">
              <div style="font-size:11px;color:#64748b;font-weight:600;margin-bottom:8px">STATUS ANTERIOR</div>
              <div style="background:#fff;padding:12px 20px;border-radius:8px;font-weight:600;color:#334155">${data.old_status || '—'}</div>
            </div>
            <div style="font-size:24px;color:#667eea">→</div>
            <div style="text-align:center">
              <div style="font-size:11px;color:#64748b;font-weight:600;margin-bottom:8px">NOVO STATUS</div>
              <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:12px 20px;border-radius:8px;font-weight:600;color:#fff">${data.new_status || '—'}</div>
            </div>
          </div>
          ${data.resolution_notes ? `
            <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e2e8f0">
              <div style="font-size:11px;color:#64748b;font-weight:600;margin-bottom:8px">OBSERVAÇÕES</div>
              <p style="margin:0;color:#334155;line-height:1.6">${data.resolution_notes}</p>
            </div>
          ` : ''}
        </div>
      `
    
    case 'new_comment':
    case 'comment_added':
      return `
        <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:20px 0">
          <div style="display:flex;align-items:center;margin-bottom:12px">
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px">${(data.commenter_name || data.changed_by || 'U')[0].toUpperCase()}</div>
            <div style="margin-left:12px">
              <div style="font-weight:600;color:#334155">${data.commenter_name || data.changed_by || 'Usuário'}</div>
              <div style="font-size:12px;color:#64748b">comentou</div>
            </div>
          </div>
          <p style="margin:0;color:#334155;line-height:1.6">${data.comment_text || 'Novo comentário adicionado ao chamado'}</p>
        </div>
      `
    
    case 'ticket_priority_changed':
      return `
        <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:20px 0">
          <div style="display:flex;align-items:center;justify-content:center;gap:16px">
            <div style="text-align:center">
              <div style="font-size:11px;color:#64748b;font-weight:600;margin-bottom:8px">PRIORIDADE ANTERIOR</div>
              <div style="background:#fff;padding:12px 20px;border-radius:8px;font-weight:600;color:#334155">${data.old_priority || '—'}</div>
            </div>
            <div style="font-size:24px;color:#667eea">→</div>
            <div style="text-align:center">
              <div style="font-size:11px;color:#64748b;font-weight:600;margin-bottom:8px">NOVA PRIORIDADE</div>
              <div style="background:#fef2f2;padding:12px 20px;border-radius:8px;font-weight:600;color:#dc2626">${data.new_priority || data.priority || '—'}</div>
            </div>
          </div>
        </div>
      `
    
    default:
      return `
        <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:20px 0">
          <p style="margin:0;color:#334155;line-height:1.6">${data.comment_text || data.description || 'Você tem uma nova notificação'}</p>
        </div>
      `
  }
}

/**
 * Template Unificado Glassmorphism - 100% Responsivo
 */
export function generateUnifiedEmailTemplate(data: NotificationData): string {
  const icon = getIconForType(data.type)
  const title = getTitleForType(data.type, data)
  const mainContent = getMainContent(data.type, data)
  
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>${title} - Chamado #${data.ticket_number}</title>
      <!--[if mso]>
      <style type="text/css">
        body, table, td {font-family: Arial, sans-serif !important;}
      </style>
      <![endif]-->
      <style>
        /* Reset */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        
        /* Responsivo */
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; margin: 20px 10px !important; }
          .content { padding: 20px !important; }
          .header { padding: 24px 20px !important; }
          .grid-2 { display: block !important; }
          .grid-item { margin-bottom: 12px !important; }
          .btn { padding: 14px !important; font-size: 15px !important; }
          h1 { font-size: 20px !important; }
          .hide-mobile { display: none !important; }
        }
        
        @media only screen and (max-width: 480px) {
          .container { border-radius: 16px !important; }
          .content { padding: 16px !important; }
          .header { padding: 20px 16px !important; }
        }
      </style>
    </head>
    <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale">
      
      <!-- Container Principal -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 0">
        <tr>
          <td align="center">
            
            <!-- Card -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="container" style="max-width:600px;margin:40px auto;background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.1);border:1px solid rgba(255,255,255,0.18)">
              
              <!-- Header Glassmorphism -->
              <tr>
                <td class="header" style="padding:40px;background:linear-gradient(135deg,rgba(102,126,234,0.1) 0%,rgba(118,75,162,0.1) 100%)">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 4px 12px rgba(0,0,0,0.05)">
                    
                    <!-- Cabeçalho com Ícone -->
                    <tr>
                      <td>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td style="width:48px;vertical-align:top">
                              <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;text-align:center;line-height:48px">${icon}</div>
                            </td>
                            <td style="padding-left:16px;vertical-align:middle">
                              <h1 style="margin:0;font-size:20px;color:#1e293b;font-weight:600;line-height:1.3">${title}</h1>
                              <p style="margin:4px 0 0;color:#64748b;font-size:14px">Chamado #${data.ticket_number}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Conteúdo Principal -->
                    <tr>
                      <td style="padding-top:20px">
                        ${mainContent}
                      </td>
                    </tr>
                    
                    <!-- Grid de Informações (2 colunas) -->
                    <tr>
                      <td style="padding-top:24px">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="grid-2">
                          ${data.created_by ? `
                          <tr>
                            <td class="grid-item" style="width:50%;padding-right:6px;padding-bottom:12px;vertical-align:top">
                              <div style="background:#fafafa;border-radius:8px;padding:12px">
                                <div style="font-size:11px;color:#64748b;font-weight:600;margin-bottom:4px">SOLICITANTE</div>
                                <div style="font-size:14px;color:#0f172a;font-weight:500">${data.created_by}</div>
                              </div>
                            </td>
                            <td class="grid-item" style="width:50%;padding-left:6px;padding-bottom:12px;vertical-align:top">
                              <div style="background:#fafafa;border-radius:8px;padding:12px">
                                <div style="font-size:11px;color:#64748b;font-weight:600;margin-bottom:4px">RESPONSÁVEL</div>
                                <div style="font-size:14px;color:#0f172a;font-weight:500">${data.assigned_to || 'Não atribuído'}</div>
                              </div>
                            </td>
                          </tr>
                          ` : ''}
                          ${data.client_name || data.category ? `
                          <tr>
                            <td class="grid-item" style="width:50%;padding-right:6px;padding-bottom:12px;vertical-align:top">
                              <div style="background:#fafafa;border-radius:8px;padding:12px">
                                <div style="font-size:11px;color:#64748b;font-weight:600;margin-bottom:4px">CLIENTE</div>
                                <div style="font-size:14px;color:#0f172a;font-weight:500">${data.client_name || 'N/A'}</div>
                              </div>
                            </td>
                            <td class="grid-item" style="width:50%;padding-left:6px;padding-bottom:12px;vertical-align:top">
                              <div style="background:#fafafa;border-radius:8px;padding:12px">
                                <div style="font-size:11px;color:#64748b;font-weight:600;margin-bottom:4px">CATEGORIA</div>
                                <div style="font-size:14px;color:#0f172a;font-weight:500">${data.category || 'N/A'}</div>
                              </div>
                            </td>
                          </tr>
                          ` : ''}
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Criticidade -->
                    ${data.priority ? `
                    <tr>
                      <td style="padding-top:12px">
                        <div style="background:linear-gradient(135deg,#fef2f2 0%,#fee2e2 100%);border-radius:8px;padding:12px;text-align:center">
                          <div style="font-size:11px;color:#991b1b;font-weight:600;margin-bottom:4px">CRITICIDADE</div>
                          <div style="font-size:18px;color:#dc2626;font-weight:700">${data.priority}</div>
                        </div>
                      </td>
                    </tr>
                    ` : ''}
                    
                    <!-- Botão de Ação -->
                    <tr>
                      <td style="padding-top:24px">
                        <a href="${data.ticket_url}" class="btn" style="display:block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;text-decoration:none;padding:16px;border-radius:12px;text-align:center;font-weight:600;font-size:16px;box-shadow:0 4px 12px rgba(102,126,234,0.3);transition:all 0.3s">
                          Abrir Chamado →
                        </a>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding:24px;text-align:center;background:rgba(248,250,252,0.5)">
                  <p style="margin:0 0 8px;color:#64748b;font-size:13px">Sistema de Suporte Técnico</p>
                  <p style="margin:0;color:#94a3b8;font-size:12px">Este é um email automático. Por favor, não responda.</p>
                </td>
              </tr>
              
            </table>
            
          </td>
        </tr>
      </table>
      
    </body>
    </html>
  `
}

// Função auxiliar para usar nos email-config.ts
export function generateEmailFromNotification(
  type: NotificationType,
  data: Partial<NotificationData>
): string {
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

