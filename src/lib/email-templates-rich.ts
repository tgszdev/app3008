/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║  TEMPLATES DE EMAIL RICOS - FASE 1                                ║
 * ║  Design moderno, responsivo e com ações inline                    ║
 * ╚════════════════════════════════════════════════════════════════════╝
 */

// Cores do sistema
const colors = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  gray: '#6b7280',
  lightGray: '#f3f4f6',
  darkGray: '#1f2937'
}

// CSS base compartilhado
const baseStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f3f4f6;
  }
  .email-container { 
    max-width: 600px; 
    margin: 20px auto; 
    background-color: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  .header { 
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white; 
    padding: 30px 20px;
    text-align: center;
  }
  .header h1 { 
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 5px;
  }
  .header p { 
    font-size: 14px;
    opacity: 0.9;
  }
  .content { 
    padding: 30px 20px;
    background-color: white;
  }
  .ticket-badge {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    margin-right: 8px;
  }
  .priority-critical { background-color: #fef2f2; color: #991b1b; }
  .priority-high { background-color: #fef3c7; color: #92400e; }
  .priority-medium { background-color: #dbeafe; color: #1e40af; }
  .priority-low { background-color: #f3f4f6; color: #374151; }
  
  .info-box {
    background-color: #f9fafb;
    border-left: 4px solid #3b82f6;
    padding: 15px;
    margin: 20px 0;
    border-radius: 6px;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #e5e7eb;
  }
  .info-row:last-child { border-bottom: none; }
  .info-label { font-weight: 600; color: #6b7280; }
  .info-value { color: #111827; }
  
  .action-buttons {
    display: flex;
    gap: 10px;
    margin: 25px 0;
    flex-wrap: wrap;
  }
  .btn {
    display: inline-block;
    padding: 12px 24px;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    text-align: center;
    transition: all 0.2s;
  }
  .btn-primary {
    background-color: #3b82f6;
    color: white;
  }
  .btn-secondary {
    background-color: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }
  .btn-success {
    background-color: #10b981;
    color: white;
  }
  
  .comment-box {
    background-color: #f9fafb;
    border-radius: 8px;
    padding: 15px;
    margin: 15px 0;
    font-size: 14px;
    line-height: 1.5;
  }
  
  .context-box {
    background-color: #fffbeb;
    border: 1px solid #fbbf24;
    border-radius: 8px;
    padding: 15px;
    margin: 20px 0;
  }
  .context-box h4 {
    color: #92400e;
    font-size: 14px;
    margin-bottom: 10px;
  }
  .context-item {
    font-size: 13px;
    color: #78350f;
    margin: 5px 0;
  }
  
  .footer {
    padding: 20px;
    text-align: center;
    background-color: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }
  .footer p {
    font-size: 12px;
    color: #6b7280;
    margin: 5px 0;
  }
  .footer a {
    color: #3b82f6;
    text-decoration: none;
  }
  
  @media only screen and (max-width: 600px) {
    .action-buttons { flex-direction: column; }
    .btn { width: 100%; }
  }
`

// Template para NOVO TICKET
export const richTicketCreated = (data: {
  ticket_number: string
  title: string
  description: string
  priority: string
  category: string
  created_by: string
  client_name?: string
  sla_time?: string
  ticket_url: string
  action_token?: string
}) => ({
  subject: `🎫 Novo Chamado #${data.ticket_number} • ${data.priority === 'critical' ? '🔴 URGENTE' : ''} ${data.title}`,
  html: `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Novo Chamado #${data.ticket_number}</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <h1>🎫 Novo Chamado #${data.ticket_number}</h1>
          <p>Criado há poucos minutos</p>
        </div>
        
        <!-- Content -->
        <div class="content">
          <!-- Priority Badge -->
          <div style="margin-bottom: 20px;">
            <span class="ticket-badge priority-${data.priority}">
              ${data.priority === 'critical' ? '🔴 CRÍTICO' : 
                data.priority === 'high' ? '🟠 ALTO' : 
                data.priority === 'medium' ? '🟡 MÉDIO' : '🟢 BAIXO'}
            </span>
            ${data.sla_time ? `<span class="ticket-badge" style="background-color: #fef3c7; color: #92400e;">⏰ SLA: ${data.sla_time}</span>` : ''}
          </div>
          
          <!-- Ticket Info -->
          <h2 style="color: #111827; margin-bottom: 15px;">${data.title}</h2>
          
          <div class="info-box">
            <div class="info-row">
              <span class="info-label">🏢 Cliente:</span>
              <span class="info-value">${data.client_name || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">👤 Criado por:</span>
              <span class="info-value">${data.created_by}</span>
            </div>
            <div class="info-row">
              <span class="info-label">📁 Categoria:</span>
              <span class="info-value">${data.category}</span>
            </div>
          </div>
          
          <!-- Description -->
          <div class="comment-box">
            <strong style="display: block; margin-bottom: 8px;">💬 Descrição:</strong>
            ${data.description.substring(0, 300)}${data.description.length > 300 ? '...' : ''}
          </div>
          
          <!-- Quick Actions -->
          <div class="action-buttons">
            <a href="${data.ticket_url}?action=assume&token=${data.action_token}" class="btn btn-primary">
              ✅ Assumir Chamado
            </a>
            <a href="${data.ticket_url}?action=reply&token=${data.action_token}" class="btn btn-success">
              💬 Responder
            </a>
            <a href="${data.ticket_url}" class="btn btn-secondary">
              👁️ Ver Detalhes
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>Sistema de Suporte Técnico</p>
          <p><a href="${data.ticket_url}/settings/notifications">⚙️ Ajustar preferências de notificação</a></p>
          <p style="margin-top: 10px; color: #9ca3af;">
            Você está recebendo este email porque é responsável pelo suporte.
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
    Novo Chamado #${data.ticket_number}
    
    Título: ${data.title}
    Prioridade: ${data.priority}
    Cliente: ${data.client_name || 'N/A'}
    Categoria: ${data.category}
    Criado por: ${data.created_by}
    ${data.sla_time ? `SLA: ${data.sla_time}` : ''}
    
    Descrição:
    ${data.description}
    
    Ver chamado: ${data.ticket_url}
  `
})

// Template para NOVO COMENTÁRIO
export const richNewComment = (data: {
  ticket_number: string
  ticket_title: string
  commenter_name: string
  comment_text: string
  ticket_url: string
  ticket_status?: string
  is_response?: boolean
}) => ({
  subject: `${data.is_response ? '✅ Resposta' : '💬 Novo comentário'} no chamado #${data.ticket_number}`,
  html: `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>${data.is_response ? '✅ Você recebeu uma resposta' : '💬 Novo Comentário'}</h1>
          <p>Chamado #${data.ticket_number}</p>
        </div>
        
        <div class="content">
          <h3 style="color: #111827; margin-bottom: 10px;">${data.ticket_title}</h3>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
            Status: <strong>${data.ticket_status || 'Em andamento'}</strong>
          </p>
          
          <div style="border-left: 4px solid #3b82f6; padding-left: 15px; margin: 20px 0;">
            <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
              <strong>${data.commenter_name}</strong> comentou:
            </p>
            <div class="comment-box">
              ${data.comment_text}
            </div>
          </div>
          
          <div class="action-buttons">
            <a href="${data.ticket_url}" class="btn btn-primary">
              💬 Responder
            </a>
            <a href="${data.ticket_url}" class="btn btn-secondary">
              👁️ Ver Chamado Completo
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p>Sistema de Suporte Técnico</p>
          <p><a href="${data.ticket_url}/../settings/notifications">⚙️ Ajustar notificações</a></p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
    ${data.is_response ? 'Você recebeu uma resposta' : 'Novo comentário'} no chamado #${data.ticket_number}
    
    ${data.ticket_title}
    Status: ${data.ticket_status || 'Em andamento'}
    
    ${data.commenter_name} comentou:
    "${data.comment_text}"
    
    Responder: ${data.ticket_url}
  `
})

// Template para STATUS ALTERADO
export const richStatusChanged = (data: {
  ticket_number: string
  ticket_title: string
  old_status: string
  new_status: string
  changed_by: string
  ticket_url: string
  is_final?: boolean
  resolution_notes?: string
}) => ({
  subject: `${data.is_final ? '✅ Chamado Resolvido' : '🔄 Status Alterado'} #${data.ticket_number}`,
  html: `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="email-container">
        <div class="header" style="background: ${data.is_final ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'};">
          <h1>${data.is_final ? '✅ Chamado Resolvido!' : '🔄 Status Atualizado'}</h1>
          <p>Chamado #${data.ticket_number}</p>
        </div>
        
        <div class="content">
          <h3 style="color: #111827; margin-bottom: 20px;">${data.ticket_title}</h3>
          
          <!-- Status Change -->
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
              <div style="text-align: center; flex: 1; min-width: 120px;">
                <p style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">Status Anterior</p>
                <p style="font-size: 16px; font-weight: 600; color: #374151;">${data.old_status}</p>
              </div>
              <div style="font-size: 24px; color: #3b82f6; padding: 0 15px;">→</div>
              <div style="text-align: center; flex: 1; min-width: 120px;">
                <p style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">Novo Status</p>
                <p style="font-size: 16px; font-weight: 600; color: ${data.is_final ? '#10b981' : '#3b82f6'};">${data.new_status}</p>
              </div>
            </div>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">
            Alterado por: <strong>${data.changed_by}</strong>
          </p>
          
          ${data.resolution_notes ? `
            <div class="info-box" style="margin-top: 20px;">
              <strong style="display: block; margin-bottom: 8px;">📝 Notas de Resolução:</strong>
              <p style="font-size: 14px; color: #374151;">${data.resolution_notes}</p>
            </div>
          ` : ''}
          
          ${data.is_final ? `
            <div class="context-box" style="margin-top: 25px;">
              <h4>⭐ Avalie nosso atendimento</h4>
              <p style="font-size: 13px; color: #78350f; margin-bottom: 15px;">
                Sua opinião nos ajuda a melhorar! Leva apenas 30 segundos.
              </p>
              <a href="${data.ticket_url}" class="btn btn-primary">
                ⭐ Avaliar Atendimento
              </a>
            </div>
          ` : ''}
          
          <div class="action-buttons" style="margin-top: 25px;">
            <a href="${data.ticket_url}" class="btn btn-primary">
              👁️ Ver Chamado
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p>Sistema de Suporte Técnico</p>
          <p><a href="#">⚙️ Ajustar notificações</a></p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
    ${data.is_final ? 'Chamado Resolvido!' : 'Status Atualizado'} #${data.ticket_number}
    
    ${data.ticket_title}
    
    Status: ${data.old_status} → ${data.new_status}
    Alterado por: ${data.changed_by}
    
    ${data.resolution_notes ? `Notas: ${data.resolution_notes}` : ''}
    
    Ver chamado: ${data.ticket_url}
  `
})

// Template para TICKET ATRIBUÍDO
export const richTicketAssigned = (data: {
  ticket_number: string
  ticket_title: string
  priority: string
  assigned_to_name: string
  assigned_by: string
  ticket_url: string
  context?: {
    client_name?: string
    open_tickets?: number
    recent_tickets?: number
  }
}) => ({
  subject: `✋ Chamado #${data.ticket_number} atribuído a você`,
  html: `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>✋ Chamado Atribuído a Você</h1>
          <p>Chamado #${data.ticket_number}</p>
        </div>
        
        <div class="content">
          <div style="margin-bottom: 20px;">
            <span class="ticket-badge priority-${data.priority}">
              ${data.priority === 'critical' ? '🔴 URGENTE' : 
                data.priority === 'high' ? '🟠 ALTA' : 
                data.priority === 'medium' ? '🟡 MÉDIA' : '🟢 BAIXA'}
            </span>
          </div>
          
          <h3 style="color: #111827; margin-bottom: 20px;">${data.ticket_title}</h3>
          
          <div class="info-box">
            <div class="info-row">
              <span class="info-label">👤 Atribuído para:</span>
              <span class="info-value">${data.assigned_to_name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">🔄 Atribuído por:</span>
              <span class="info-value">${data.assigned_by}</span>
            </div>
            ${data.context?.client_name ? `
              <div class="info-row">
                <span class="info-label">🏢 Cliente:</span>
                <span class="info-value">${data.context.client_name}</span>
              </div>
            ` : ''}
          </div>
          
          ${data.context && (data.context.open_tickets || data.context.recent_tickets) ? `
            <div class="context-box">
              <h4>📊 Contexto do Cliente</h4>
              ${data.context.open_tickets ? `<p class="context-item">• ${data.context.open_tickets} chamados abertos no momento</p>` : ''}
              ${data.context.recent_tickets ? `<p class="context-item">• ${data.context.recent_tickets} chamados esta semana</p>` : ''}
            </div>
          ` : ''}
          
          <div class="action-buttons">
            <a href="${data.ticket_url}" class="btn btn-primary">
              🚀 Começar Atendimento
            </a>
            <a href="${data.ticket_url}?action=reassign" class="btn btn-secondary">
              🔄 Reatribuir
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p>Sistema de Suporte Técnico</p>
          <p><a href="#">⚙️ Ajustar notificações</a></p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
    Chamado #${data.ticket_number} atribuído a você
    
    ${data.ticket_title}
    
    Prioridade: ${data.priority}
    Atribuído por: ${data.assigned_by}
    ${data.context?.client_name ? `Cliente: ${data.context.client_name}` : ''}
    
    Ver chamado: ${data.ticket_url}
  `
})

// Exportar todos os templates
export const richEmailTemplates = {
  ticketCreated: richTicketCreated,
  newComment: richNewComment,
  statusChanged: richStatusChanged,
  ticketAssigned: richTicketAssigned
}

/**
 * ✨ FUNÇÃO PRINCIPAL: Gerar template baseado no tipo de notificação
 */
export function generateEmailTemplate(type: string, data: any): string | null {
  const typeMapping: Record<string, (data: any) => string> = {
    'ticket_created': richTicketCreated,
    'ticket_assigned': richTicketAssigned,
    'ticket_status_changed': richStatusChanged,
    'new_comment': richNewComment,
    'comment_added': richNewComment,
    'status_changed': richStatusChanged
  }
  
  const templateFunction = typeMapping[type]
  if (!templateFunction) {
    console.warn(`⚠️ Template rico não encontrado para tipo: ${type}`)
    return null
  }
  
  try {
    return templateFunction(data)
  } catch (error) {
    console.error(`❌ Erro ao gerar template rico para tipo ${type}:`, error)
    return null
  }
}

