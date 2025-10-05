/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║  TEMPLATE UNIFICADO LINEAR HIERARCHY 03                            ║
 * ║  Dark Theme Professional • Contexto Rico • 100% Responsivo         ║
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

function getMainContent(type: NotificationType, data: NotificationData): string {
  const baseBlock = (label: string, content: string, borderColor: string = '#a855f7') => `
    <div class="block" style="border-left-color:${borderColor}">
      <div class="block-label">${label}</div>
      <div class="block-content">${content}</div>
    </div>
  `
  
  switch (type) {
    case 'ticket_created':
    case 'ticket_assigned':
      return `
        ${data.ticket_title ? `
          ${baseBlock('TÍTULO DO CHAMADO', `<div class="block-title">${data.ticket_title}</div>`)}
        ` : ''}
        ${data.description ? baseBlock('DESCRIÇÃO', data.description) : ''}
      `
    
    case 'ticket_status_changed':
      return `
        ${baseBlock('MUDANÇA DE STATUS', `
          <div style="display:flex;align-items:center;gap:20px;justify-content:center">
            <div style="text-align:center">
              <div style="font-size:12px;color:#71717a;margin-bottom:8px">ANTERIOR</div>
              <div style="background:#18181b;border:1px solid #3f3f46;padding:12px 20px;border-radius:6px;color:#fafafa;font-weight:600">${data.old_status || '—'}</div>
            </div>
            <div style="color:#a855f7;font-size:20px">→</div>
            <div style="text-align:center">
              <div style="font-size:12px;color:#71717a;margin-bottom:8px">NOVO</div>
              <div style="background:linear-gradient(135deg,#8b5cf6,#a855f7);padding:12px 20px;border-radius:6px;color:#fff;font-weight:600">${data.new_status || '—'}</div>
            </div>
          </div>
          ${data.resolution_notes ? `
            <div style="margin-top:16px;padding-top:16px;border-top:1px solid #3f3f46">
              <div style="font-size:12px;color:#71717a;margin-bottom:8px">OBSERVAÇÕES</div>
              <div style="color:#e4e4e7">${data.resolution_notes}</div>
            </div>
          ` : ''}
        `)}
        ${data.ticket_title ? baseBlock('SOBRE O CHAMADO', `<div class="block-title">${data.ticket_title}</div>`, '#71717a') : ''}
      `
    
    case 'new_comment':
    case 'comment_added':
      return `
        ${baseBlock('COMENTÁRIO RECEBIDO', data.comment_text || 'Novo comentário adicionado')}
        ${data.ticket_title ? baseBlock('SOBRE O CHAMADO', `<div class="block-title">${data.ticket_title}</div>${data.description && data.description !== data.comment_text ? '<div style="margin-top:12px;color:#a1a1aa;font-size:14px">' + data.description.substring(0, 180) + '...</div>' : ''}`, '#71717a') : ''}
      `
    
    case 'ticket_priority_changed':
      return baseBlock('MUDANÇA DE PRIORIDADE', `
        <div style="display:flex;align-items:center;gap:20px;justify-content:center">
          <div style="text-align:center">
            <div style="font-size:12px;color:#71717a;margin-bottom:8px">ANTERIOR</div>
            <div style="background:#18181b;border:1px solid #3f3f46;padding:12px 20px;border-radius:6px;color:#fafafa;font-weight:600">${translatePriority(data.old_priority)}</div>
          </div>
          <div style="color:#a855f7;font-size:20px">→</div>
          <div style="text-align:center">
            <div style="font-size:12px;color:#71717a;margin-bottom:8px">NOVA</div>
            <div style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:12px 20px;border-radius:6px;color:#fff;font-weight:600">${translatePriority(data.new_priority || data.priority)}</div>
          </div>
        </div>
      `)
    
    default:
      return baseBlock('NOTIFICAÇÃO', data.comment_text || data.description || 'Você tem uma nova notificação')
  }
}

export function generateUnifiedEmailTemplate(data: NotificationData): string {
  const title = getTitleForType(data.type)
  const mainContent = getMainContent(data.type, data)
  const priorityTranslated = translatePriority(data.priority)
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title} - #${data.ticket_number}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#18181b;color:#e4e4e7;padding:40px 20px;line-height:1.6}
.container{max-width:800px;margin:0 auto;background:#27272a;border:1px solid #3f3f46;border-radius:12px;overflow:hidden}
.breadcrumb{padding:20px 48px;background:#18181b;border-bottom:1px solid #3f3f46;display:flex;align-items:center;gap:12px;font-size:13px;color:#71717a;font-weight:500;flex-wrap:wrap}
.breadcrumb-sep{color:#52525b}
.breadcrumb-active{color:#a855f7;font-weight:600}
.header{padding:40px 48px 32px;border-bottom:1px solid #3f3f46}
.status-pill{display:inline-flex;align-items:center;gap:8px;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.3);padding:8px 16px;border-radius:20px;margin-bottom:20px;font-size:13px;color:#a855f7;font-weight:600}
.status-pill::before{content:'';width:6px;height:6px;border-radius:50%;background:#a855f7}
h1{margin:0 0 12px;font-size:28px;font-weight:700;color:#fafafa;letter-spacing:-0.5px}
.meta-line{font-size:14px;color:#71717a}
.content{padding:40px 48px}
.block{background:#18181b;border:1px solid #3f3f46;border-left:3px solid #a855f7;border-radius:6px;padding:24px;margin-bottom:20px}
.block-label{font-size:12px;color:#71717a;font-weight:600;letter-spacing:1px;margin-bottom:12px}
.block-content{font-size:15px;color:#e4e4e7;line-height:1.8}
.block-title{font-size:19px;font-weight:600;color:#fafafa;margin-bottom:12px}
.properties{background:#18181b;border:1px solid #3f3f46;border-radius:6px;padding:4px;margin-bottom:24px}
.property{display:flex;align-items:center;padding:16px 20px;border-bottom:1px solid #3f3f46}
.property:last-child{border-bottom:none}
.property-icon{width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;font-weight:700;flex-shrink:0}
.property-content{flex:1;margin-left:16px}
.property-label{font-size:12px;color:#71717a;font-weight:500;margin-bottom:4px}
.property-value{font-size:15px;color:#fafafa;font-weight:500}
.urgency-box{background:linear-gradient(135deg,#dc2626,#ef4444);border-radius:6px;padding:24px;margin-bottom:28px;text-align:center}
.urgency-label{font-size:11px;color:rgba(255,255,255,0.8);font-weight:700;letter-spacing:1.5px;margin-bottom:8px}
.urgency-value{font-size:26px;color:#fff;font-weight:700}
.btn{display:block;background:#a855f7;color:#fff;text-decoration:none;padding:14px;border-radius:6px;text-align:center;font-weight:600;font-size:15px;border:1px solid #9333ea}
.footer{padding:32px 48px;background:#18181b;border-top:1px solid #3f3f46;text-align:center;color:#52525b;font-size:13px}
@media(max-width:700px){.breadcrumb,.header,.content,.footer{padding:20px 24px}.property{flex-wrap:wrap}}
</style>
</head>
<body>
<div class="container">
<div class="breadcrumb">
<span>${data.client_name || 'Sistema'}</span>
<span class="breadcrumb-sep">/</span>
<span>${data.category || 'Geral'}</span>
<span class="breadcrumb-sep">/</span>
<span class="breadcrumb-active">#${data.ticket_number}</span>
</div>
<div class="header">
<div class="status-pill">NOVA ATIVIDADE</div>
<h1>${title}</h1>
<p class="meta-line">Por ${data.commenter_name || data.changed_by || data.created_by || 'Sistema'} • Agora mesmo</p>
</div>
<div class="content">
${mainContent}
<div class="properties">
${data.created_by ? `
<div class="property">
<div class="property-icon" style="background:linear-gradient(135deg,#8b5cf6,#a855f7)">US</div>
<div class="property-content"><div class="property-label">Solicitante</div><div class="property-value">${data.created_by}</div></div>
</div>
` : ''}
${data.assigned_to || data.type.includes('assign') ? `
<div class="property">
<div class="property-icon" style="background:linear-gradient(135deg,#3b82f6,#6366f1)">RE</div>
<div class="property-content"><div class="property-label">Responsável</div><div class="property-value">${data.assigned_to || 'Aguardando atribuição'}</div></div>
</div>
` : ''}
<div class="property">
<div class="property-icon" style="background:linear-gradient(135deg,#10b981,#14b8a6)">CL</div>
<div class="property-content"><div class="property-label">Cliente / Organização</div><div class="property-value">${data.client_name || 'Não informado'}</div></div>
</div>
<div class="property">
<div class="property-icon" style="background:linear-gradient(135deg,#f59e0b,#f97316)">CA</div>
<div class="property-content"><div class="property-label">Categoria</div><div class="property-value">${data.category || 'Geral'}</div></div>
</div>
</div>
${data.priority ? `
<div class="urgency-box">
<div class="urgency-label">NÍVEL DE CRITICIDADE</div>
<div class="urgency-value">${translatePriority(data.priority)}</div>
</div>
` : ''}
<a href="${data.ticket_url}" class="btn">Acessar Chamado →</a>
</div>
<div class="footer">
<p>Sistema de Suporte Técnico</p>
<p style="margin-top:8px">Notificação automática • Não responda</p>
</div>
</div>
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
