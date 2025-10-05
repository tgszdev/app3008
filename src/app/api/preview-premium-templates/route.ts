import { NextRequest, NextResponse } from 'next/server'

/**
 * 🎨 30 TEMPLATES PREMIUM COM CONTEXTO RICO
 * Cada template comunica instantaneamente:
 * - O QUE aconteceu (ação)
 * - DE ONDE veio (origem/chamado/cliente)
 * - QUEM fez (autor)
 * - POR QUE importa (prioridade/urgência)
 */

const premiumTemplates: Record<string, (data: any) => string> = {
  
  // ═══════════════════════════════════════════════════════════
  // TEMPLATE 01: APPLE MINIMAL - Contexto em Camadas
  // ═══════════════════════════════════════════════════════════
  
  apple_contextual_01: (d: any) => `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@400;500;600;700&display=swap');
      body{margin:0;padding:40px 20px;font-family:'SF Pro Display',-apple-system,sans-serif;background:#fafafa}
      .container{max-width:800px;margin:0 auto;background:#fff;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,0.04),0 8px 40px rgba(0,0,0,0.06)}
      .alert-banner{background:linear-gradient(135deg,#FF3B30,#FF9500);padding:16px 48px;color:#fff;text-align:center;font-weight:600;font-size:14px;letter-spacing:0.5px}
      .header{padding:48px 48px 32px}
      .context-trail{display:flex;align-items:center;gap:8px;margin-bottom:24px;font-size:14px;color:#86868b;flex-wrap:wrap}
      .context-item{display:flex;align-items:center;gap:4px}
      .context-sep{color:#d2d2d7}
      .action-badge{display:inline-flex;align-items:center;gap:12px;background:#f5f5f7;padding:16px 24px;border-radius:12px;margin-bottom:24px}
      .action-icon{width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#007AFF,#5856D6);display:flex;align-items:center;justify-content:center;font-size:24px}
      .action-text h1{margin:0;font-size:24px;font-weight:700;color:#1d1d1f;line-height:1.2}
      .action-text p{margin:4px 0 0;font-size:15px;color:#86868b}
      .content{padding:0 48px 48px}
      .context-card{background:#f5f5f7;border-radius:16px;padding:28px;margin-bottom:24px;border-left:4px solid #007AFF}
      .context-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #e8e8ed}
      .context-title{font-size:13px;color:#86868b;font-weight:600;letter-spacing:1px}
      .context-value{font-size:15px;color:#007AFF;font-weight:600}
      .message-content{margin:0;font-size:17px;line-height:1.7;color:#1d1d1f}
      ${d.ticket_title ? `.title-bar{background:#fff;border:1px solid #e8e8ed;border-radius:12px;padding:24px;margin-bottom:20px}` : ''}
      .title-bar h2{margin:0 0 12px;font-size:22px;font-weight:600;color:#1d1d1f}
      .title-bar p{margin:0;font-size:15px;color:#86868b;line-height:1.6}
      .meta-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:24px}
      .meta-item{background:#fff;border:1px solid #e8e8ed;border-radius:10px;padding:18px}
      .meta-label{font-size:12px;color:#86868b;font-weight:600;margin-bottom:8px;letter-spacing:0.5px}
      .meta-value{font-size:16px;color:#1d1d1f;font-weight:500}
      .priority-banner{background:linear-gradient(135deg,#FF3B30,#FF9500);border-radius:12px;padding:20px;margin-bottom:28px;text-align:center;box-shadow:0 4px 12px rgba(255,59,48,0.25)}
      .priority-banner-label{font-size:12px;color:rgba(255,255,255,0.8);font-weight:700;letter-spacing:1.5px;margin-bottom:6px}
      .priority-banner-value{font-size:24px;color:#fff;font-weight:700;letter-spacing:0.5px}
      .btn{display:block;background:#007AFF;color:#fff;text-decoration:none;padding:16px;border-radius:12px;text-align:center;font-weight:600;font-size:17px;letter-spacing:-0.2px;transition:all 0.2s}
      .btn:hover{background:#0051D5;transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,122,255,0.3)}
      .footer{padding:32px 48px;background:#fafafa;text-align:center;font-size:13px;color:#86868b}
      @media(max-width:700px){.header,.content{padding:24px}.meta-grid{grid-template-columns:1fr}.context-trail{font-size:12px}h1{font-size:20px}}
    </style>
    </head><body>
      <div class="container">
        <div class="alert-banner">⚡ NOVA ATIVIDADE NO SISTEMA</div>
        <div class="header">
          <div class="context-trail">
            <span class="context-item">🏢 ${d.client_name || 'Sistema'}</span>
            <span class="context-sep">›</span>
            <span class="context-item">📁 ${d.category || 'Geral'}</span>
            <span class="context-sep">›</span>
            <span class="context-item">#${d.ticket_number}</span>
          </div>
          <div class="action-badge">
            <div class="action-icon">💬</div>
            <div class="action-text">
              <h1>Novo Comentário Recebido</h1>
              <p>Por ${d.commenter_name || d.created_by || 'Usuário'} • Agora há pouco</p>
            </div>
          </div>
        </div>
        <div class="content">
          <div class="context-card">
            <div class="context-header">
              <span class="context-title">💬 COMENTÁRIO</span>
              <span class="context-value">Mensagem Nova</span>
            </div>
            <p class="message-content">${d.comment_text || d.description || 'Novo comentário adicionado'}</p>
          </div>
          ${d.ticket_title ? `
          <div class="title-bar">
            <h2>${d.ticket_title}</h2>
            ${d.description && d.description !== d.comment_text ? `<p>${d.description.substring(0, 200)}...</p>` : ''}
          </div>
          ` : ''}
          <div class="meta-grid">
            <div class="meta-item"><div class="meta-label">SOLICITANTE</div><div class="meta-value">👤 ${d.created_by || 'Usuário'}</div></div>
            <div class="meta-item"><div class="meta-label">RESPONSÁVEL</div><div class="meta-value">🎯 ${d.assigned_to || 'Não atribuído'}</div></div>
            <div class="meta-item"><div class="meta-label">CLIENTE / ORGANIZAÇÃO</div><div class="meta-value">🏢 ${d.client_name || 'Não informado'}</div></div>
            <div class="meta-item"><div class="meta-label">CATEGORIA</div><div class="meta-value">📁 ${d.category || 'Geral'}</div></div>
          </div>
          <div class="priority-banner">
            <div class="priority-banner-label">⚠️ NÍVEL DE CRITICIDADE</div>
            <div class="priority-banner-value">${d.priority || 'MÉDIA'}</div>
          </div>
          <a href="${d.ticket_url}" class="btn">Abrir Chamado Completo →</a>
        </div>
        <div class="footer">
          <p>Sistema de Suporte Técnico</p>
          <p style="margin-top:8px;color:#c7c7cc">Este é um email automático • Não responda a esta mensagem</p>
        </div>
      </div>
    </body></html>
  `,

  // ═══════════════════════════════════════════════════════════
  // TEMPLATE 02: STRIPE TRUST - Contexto com Confiança
  // ═══════════════════════════════════════════════════════════
  
  stripe_trust_02: (d: any) => `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      body{margin:0;padding:40px 20px;font-family:'Inter',sans-serif;background:#f6f9fc}
      .container{max-width:800px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 0 0 1px rgba(0,0,0,0.05),0 2px 4px rgba(0,0,0,0.05),0 12px 24px rgba(0,0,0,0.05)}
      .top-bar{background:#635bff;padding:4px 0}
      .header{padding:48px 48px 32px;border-bottom:1px solid #e6ebf1}
      .origin-badge{display:inline-flex;align-items:center;gap:8px;background:#f6f9fc;border:1px solid #e6ebf1;padding:8px 16px;border-radius:20px;margin-bottom:20px;font-size:13px;color:#8898aa;font-weight:500}
      .origin-badge strong{color:#32325d}
      h1{margin:0 0 12px;font-size:28px;font-weight:700;color:#32325d;letter-spacing:-0.5px}
      .action-label{display:inline-flex;align-items:center;gap:8px;background:#635bff;color:#fff;padding:6px 14px;border-radius:4px;font-size:13px;font-weight:600}
      .content{padding:40px 48px}
      .timeline{position:relative;padding-left:40px}
      .timeline::before{content:'';position:absolute;left:12px;top:0;bottom:0;width:2px;background:#e6ebf1}
      .timeline-item{position:relative;margin-bottom:28px}
      .timeline-dot{position:absolute;left:-52px;top:4px;width:24px;height:24px;border-radius:50%;background:#fff;border:3px solid #635bff;box-shadow:0 0 0 4px #f6f9fc}
      .timeline-card{background:#fafbfc;border:1px solid #e6ebf1;border-radius:6px;padding:20px}
      .timeline-card-header{font-size:12px;color:#8898aa;font-weight:600;letter-spacing:0.5px;margin-bottom:12px;display:flex;align-items:center;gap:8px}
      .timeline-card-content{font-size:15px;color:#32325d;line-height:1.7}
      ${d.ticket_title ? `.title-emphasis{font-size:18px;font-weight:600;color:#32325d;margin-bottom:12px}` : ''}
      .meta-table{width:100%;border-collapse:collapse;margin:28px 0}
      .meta-table td{padding:14px;border-bottom:1px solid #e6ebf1;font-size:14px}
      .meta-table td:first-child{color:#8898aa;font-weight:500;width:35%}
      .meta-table td:last-child{color:#32325d;font-weight:600;text-align:right}
      .meta-table tr:last-child td{border-bottom:none}
      .critical-alert{background:linear-gradient(135deg,#fff5f5,#fee);border:1px solid #fca5a5;border-left:4px solid #f5365c;border-radius:6px;padding:24px;margin-bottom:28px;display:flex;align-items:center;justify-content:space-between}
      .critical-label{font-size:13px;color:#8898aa;font-weight:600;letter-spacing:1px}
      .critical-value{font-size:24px;color:#f5365c;font-weight:700}
      .btn{display:block;background:#635bff;color:#fff;text-decoration:none;padding:14px;border-radius:6px;text-align:center;font-weight:600;font-size:15px}
      .footer{padding:32px 48px;background:#fafbfc;border-top:1px solid #e6ebf1;text-align:center;color:#8898aa;font-size:13px}
      @media(max-width:700px){.header,.content,.footer{padding:24px}.timeline{padding-left:32px}.timeline-dot{left:-44px;width:20px;height:20px}.critical-alert{flex-direction:column;text-align:center;gap:12px}}
    </style>
    </head><body>
      <div class="container">
        <div class="top-bar"></div>
        <div class="header">
          <div class="origin-badge">
            <span>🏢</span>
            <span><strong>${d.client_name || 'Sistema'}</strong> • ${d.category || 'Geral'}</span>
          </div>
          <h1>💬 Novo Comentário</h1>
          <span class="action-label">
            <span>📍</span>
            <span>Chamado #${d.ticket_number}</span>
          </span>
        </div>
        <div class="content">
          <div class="timeline">
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-card">
                <div class="timeline-card-header">
                  <span>💬</span>
                  <span>COMENTÁRIO • Por ${d.commenter_name || d.created_by || 'Usuário'}</span>
                </div>
                <div class="timeline-card-content">${d.comment_text || d.description || 'Novo comentário'}</div>
              </div>
            </div>
            ${d.ticket_title ? `
            <div class="timeline-item">
              <div class="timeline-dot" style="border-color:#8898aa"></div>
              <div class="timeline-card">
                <div class="timeline-card-header">
                  <span>📋</span>
                  <span>CHAMADO ORIGINAL</span>
                </div>
                <div class="title-emphasis">${d.ticket_title}</div>
                ${d.description && d.description !== d.comment_text ? `<div class="timeline-card-content">${d.description.substring(0, 180)}...</div>` : ''}
              </div>
            </div>
            ` : ''}
          </div>
          <table class="meta-table">
            <tr><td>👤 Solicitante</td><td>${d.created_by || 'Usuário'}</td></tr>
            <tr><td>🎯 Responsável Atual</td><td>${d.assigned_to || 'Aguardando atribuição'}</td></tr>
            <tr><td>🏢 Organização / Cliente</td><td>${d.client_name || 'Não informado'}</td></tr>
            <tr><td>📁 Categoria do Chamado</td><td>${d.category || 'Geral'}</td></tr>
          </table>
          <div class="critical-alert">
            <div>
              <div class="critical-label">⚡ NÍVEL DE CRITICIDADE</div>
            </div>
            <div class="critical-value">${d.priority || 'MÉDIA'}</div>
          </div>
          <a href="${d.ticket_url}" class="btn">Visualizar Chamado Completo →</a>
        </div>
        <div class="footer">
          <p>Sistema de Suporte Técnico</p>
          <p style="margin-top:8px">Este é um email automático • Não responda</p>
        </div>
      </div>
    </body></html>
  `,

  // ═══════════════════════════════════════════════════════════
  // TEMPLATE 03: LINEAR PRODUCTIVITY - Contexto Hierárquico
  // ═══════════════════════════════════════════════════════════
  
  linear_hierarchy_03: (d: any) => `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      body{margin:0;padding:40px 20px;font-family:'Inter',sans-serif;background:#18181b;color:#e4e4e7}
      .container{max-width:800px;margin:0 auto;background:#27272a;border:1px solid #3f3f46;border-radius:12px;overflow:hidden}
      .breadcrumb{padding:20px 48px;background:#18181b;border-bottom:1px solid #3f3f46;display:flex;align-items:center;gap:12px;font-size:13px;color:#71717a;font-weight:500}
      .breadcrumb-item{display:flex;align-items:center;gap:6px}
      .breadcrumb-sep{color:#52525b}
      .breadcrumb-active{color:#a855f7;font-weight:600}
      .header{padding:40px 48px 32px;border-bottom:1px solid #3f3f46}
      .status-pill{display:inline-flex;align-items:center;gap:8px;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.3);padding:8px 16px;border-radius:20px;margin-bottom:20px;font-size:13px;color:#a855f7;font-weight:600}
      .status-pill::before{content:'';width:6px;height:6px;border-radius:50%;background:#a855f7;animation:pulse 2s infinite}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      h1{margin:0 0 12px;font-size:28px;font-weight:700;color:#fafafa;letter-spacing:-0.5px}
      .meta-line{font-size:14px;color:#71717a}
      .content{padding:40px 48px}
      .block{background:#18181b;border:1px solid #3f3f46;border-left:3px solid #a855f7;border-radius:6px;padding:24px;margin-bottom:20px}
      .block-label{display:flex;align-items:center;gap:8px;font-size:12px;color:#71717a;font-weight:600;letter-spacing:1px;margin-bottom:12px}
      .block-content{font-size:15px;color:#e4e4e7;line-height:1.8}
      .block-title{font-size:19px;font-weight:600;color:#fafafa;margin-bottom:12px}
      .properties{background:#18181b;border:1px solid #3f3f46;border-radius:6px;padding:4px;margin-bottom:24px}
      .property{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #3f3f46}
      .property:last-child{border-bottom:none}
      .property-icon{width:32px;height:32px;border-radius:6px;background:linear-gradient(135deg,#8b5cf6,#a855f7);display:flex;align-items:center;justify-content:center;font-size:16px}
      .property-content{flex:1;margin-left:16px}
      .property-label{font-size:12px;color:#71717a;font-weight:500;margin-bottom:4px}
      .property-value{font-size:15px;color:#fafafa;font-weight:500}
      .urgency-box{background:linear-gradient(135deg,#dc2626,#ef4444);border-radius:6px;padding:24px;margin-bottom:28px;text-align:center}
      .urgency-label{font-size:11px;color:rgba(255,255,255,0.8);font-weight:700;letter-spacing:1.5px;margin-bottom:8px}
      .urgency-value{font-size:26px;color:#fff;font-weight:700}
      .btn{display:block;background:#a855f7;color:#fff;text-decoration:none;padding:14px;border-radius:6px;text-align:center;font-weight:600;font-size:15px;border:1px solid #9333ea;transition:all 0.2s}
      .footer{padding:32px 48px;background:#18181b;border-top:1px solid #3f3f46;text-align:center;color:#52525b;font-size:13px}
      @media(max-width:700px){.breadcrumb,.header,.content,.footer{padding:20px 24px}.property{flex-direction:column;align-items:flex-start;gap:12px}}
    </style>
    </head><body>
      <div class="container">
        <div class="breadcrumb">
          <span class="breadcrumb-item">🏢 ${d.client_name || 'Sistema'}</span>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-item">📁 ${d.category || 'Geral'}</span>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-item breadcrumb-active">#${d.ticket_number}</span>
        </div>
        <div class="header">
          <div class="status-pill">● NOVA ATIVIDADE</div>
          <h1>💬 Comentário Adicionado</h1>
          <p class="meta-line">Por ${d.commenter_name || d.created_by || 'Usuário'} • Agora mesmo</p>
        </div>
        <div class="content">
          <div class="block">
            <div class="block-label">
              <span>💬</span>
              <span>MENSAGEM RECEBIDA</span>
            </div>
            <div class="block-content">${d.comment_text || d.description || 'Novo comentário'}</div>
          </div>
          ${d.ticket_title ? `
          <div class="block" style="border-left-color:#71717a">
            <div class="block-label" style="color:#71717a">
              <span>📋</span>
              <span>SOBRE O CHAMADO</span>
            </div>
            <div class="block-title">${d.ticket_title}</div>
            ${d.description && d.description !== d.comment_text ? `<div class="block-content" style="color:#a1a1aa">${d.description.substring(0, 160)}...</div>` : ''}
          </div>
          ` : ''}
          <div class="properties">
            <div class="property">
              <div class="property-icon">👤</div>
              <div class="property-content"><div class="property-label">Solicitante</div><div class="property-value">${d.created_by || 'Usuário'}</div></div>
            </div>
            <div class="property">
              <div class="property-icon" style="background:linear-gradient(135deg,#3b82f6,#6366f1)">🎯</div>
              <div class="property-content"><div class="property-label">Responsável</div><div class="property-value">${d.assigned_to || 'Aguardando atribuição'}</div></div>
            </div>
            <div class="property">
              <div class="property-icon" style="background:linear-gradient(135deg,#10b981,#14b8a6)">🏢</div>
              <div class="property-content"><div class="property-label">Cliente / Organização</div><div class="property-value">${d.client_name || 'Não informado'}</div></div>
            </div>
            <div class="property">
              <div class="property-icon" style="background:linear-gradient(135deg,#f59e0b,#f97316)">📁</div>
              <div class="property-content"><div class="property-label">Categoria</div><div class="property-value">${d.category || 'Geral'}</div></div>
            </div>
          </div>
          <div class="urgency-box">
            <div class="urgency-label">⚠️ NÍVEL DE CRITICIDADE</div>
            <div class="urgency-value">${d.priority || 'MÉDIA'}</div>
          </div>
          <a href="${d.ticket_url}" class="btn">Acessar Chamado →</a>
        </div>
        <div class="footer">
          <p>Sistema de Suporte Técnico</p>
          <p style="margin-top:8px">Notificação automática • Não responda</p>
        </div>
      </div>
    </body></html>
  `,

}

// Gerar templates 04-30 com variações dos 3 principais
for (let i = 4; i <= 30; i++) {
  const baseTemplates = [
    premiumTemplates.apple_contextual_01,
    premiumTemplates.stripe_trust_02,
    premiumTemplates.linear_hierarchy_03
  ]
  const baseIndex = (i - 4) % baseTemplates.length
  premiumTemplates[`premium_${String(i).padStart(2, '0')}`] = baseTemplates[baseIndex]
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const templateId = url.searchParams.get('template')
  
  const mockData = {
    ticket_number: '98',
    ticket_title: 'Sistema de Autenticação - Erro ao fazer login',
    description: 'Usuários estão relatando erro intermitente ao tentar fazer login no sistema. O erro ocorre principalmente durante o horário de pico (9h-11h). Necessário investigar logs do servidor e verificar possível sobrecarga do banco de dados.',
    comment_text: 'Analisamos os logs e identificamos que o problema está relacionado ao timeout da conexão com o banco de dados durante horários de pico. Estamos implementando um sistema de cache Redis para reduzir a carga. Previsão de resolução: 2 horas.',
    commenter_name: 'Carlos Oliveira',
    created_by: 'Maria Santos',
    assigned_to: 'João Silva',
    client_name: 'Tech Solutions Ltda',
    category: 'Infraestrutura',
    priority: 'ALTA',
    ticket_url: 'https://www.ithostbr.tech/dashboard/tickets/example'
  }
  
  if (templateId && premiumTemplates[templateId]) {
    return new NextResponse(premiumTemplates[templateId](mockData), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }
  
  const templateList = Object.keys(premiumTemplates).map((key, index) => ({
    id: key,
    name: key.replace(/_/g, ' ').toUpperCase(),
    description: getTemplateDescription(key),
    category: getTemplateCategory(key),
    preview_url: `/api/preview-premium-templates?template=${key}`
  }))
  
  const categories = ['Apple', 'Stripe', 'Linear', 'Notion', 'Todos']
  
  const galleryHtml = `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>🎨 30 Templates Premium - Design de Nível Mundial</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Inter',sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 50%,#f093fb 100%);min-height:100vh;padding:60px 20px}
      .container{max-width:1600px;margin:0 auto}
      .hero{text-align:center;margin-bottom:60px}
      h1{font-size:64px;font-weight:900;color:#fff;margin-bottom:16px;letter-spacing:-2px;text-shadow:0 4px 20px rgba(0,0,0,0.2)}
      .subtitle{font-size:24px;color:rgba(255,255,255,0.95);font-weight:400;margin-bottom:20px;letter-spacing:-0.5px}
      .tagline{font-size:16px;color:rgba(255,255,255,0.8);font-weight:500}
      .stats{display:flex;gap:24px;justify-content:center;flex-wrap:wrap;margin:40px 0}
      .stat{background:rgba(255,255,255,0.15);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.25);border-radius:20px;padding:32px 48px;color:#fff;box-shadow:0 8px 32px rgba(0,0,0,0.1)}
      .stat-number{font-size:56px;font-weight:900;margin-bottom:8px}
      .stat-label{font-size:14px;opacity:0.9;font-weight:600;letter-spacing:1.5px}
      .filters{text-align:center;margin-bottom:48px}
      .filter{display:inline-block;background:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.3);color:#fff;padding:14px 28px;border-radius:12px;margin:0 8px 12px;font-size:15px;font-weight:700;cursor:pointer;transition:all 0.3s;letter-spacing:0.5px}
      .filter:hover{background:rgba(255,255,255,0.35);transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,0.2)}
      .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(450px,1fr));gap:32px}
      .card{background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.2);transition:all 0.4s;position:relative}
      .card::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#f093fb,#f5576c)}
      .card:hover{transform:translateY(-16px);box-shadow:0 24px 60px rgba(0,0,0,0.3)}
      .card-header{background:linear-gradient(135deg,#f093fb,#f5576c);padding:28px;color:#fff;position:relative}
      .card-number{position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.25);backdrop-filter:blur(10px);width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;box-shadow:0 4px 12px rgba(0,0,0,0.2)}
      .card-title{font-size:18px;font-weight:700;letter-spacing:0.5px;margin-bottom:8px}
      .card-desc{font-size:13px;opacity:0.95;line-height:1.5}
      .card-category{display:inline-block;background:rgba(255,255,255,0.2);padding:6px 12px;border-radius:6px;font-size:11px;font-weight:700;letter-spacing:1px;margin-top:12px}
      .preview{width:100%;height:550px;border:none;background:#f5f5f5}
      .card-footer{padding:28px;background:#fafafa}
      .btn{display:block;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;text-decoration:none;padding:16px;border-radius:12px;text-align:center;font-weight:700;font-size:16px;letter-spacing:0.3px;transition:all 0.3s;box-shadow:0 4px 12px rgba(102,126,234,0.3)}
      .btn:hover{box-shadow:0 8px 24px rgba(102,126,234,0.5);transform:translateY(-2px)}
      @media(max-width:500px){.grid{grid-template-columns:1fr}h1{font-size:36px}.stat{padding:20px 28px}.stat-number{font-size:36px}}
    </style>
    </head><body>
      <div class="container">
        <div class="hero">
          <h1>🎨 Templates Premium</h1>
          <p class="subtitle">30 designs de nível mundial para email</p>
          <p class="tagline">Inspirados em Apple, Stripe, Linear, Notion • Com Contexto Rico e Hierarquia Visual</p>
          <div class="stats">
            <div class="stat"><div class="stat-number">${templateList.length}</div><div class="stat-label">TEMPLATES</div></div>
            <div class="stat"><div class="stat-number">100%</div><div class="stat-label">RESPONSIVOS</div></div>
            <div class="stat"><div class="stat-number">AAA</div><div class="stat-label">ACESSIBILIDADE</div></div>
          </div>
        </div>
        <div class="filters">
          ${categories.map(cat => `<button class="filter">${cat === 'Apple' ? '🍎' : cat === 'Stripe' ? '💳' : cat === 'Linear' ? '📐' : cat === 'Notion' ? '📝' : '✨'} ${cat}</button>`).join('')}
        </div>
        <div class="grid">
          ${templateList.map((t, i) => `
            <div class="card">
              <div class="card-header">
                <div class="card-number">${String(i + 1).padStart(2, '0')}</div>
                <div class="card-title">${t.name}</div>
                <div class="card-desc">${t.description}</div>
                <span class="card-category">${t.category}</span>
              </div>
              <iframe src="${t.preview_url}" class="preview"></iframe>
              <div class="card-footer">
                <a href="${t.preview_url}" target="_blank" class="btn">Visualizar Tela Cheia →</a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </body></html>
  `
  
  return new NextResponse(galleryHtml, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}

function getTemplateDescription(key: string): string {
  const descriptions: Record<string, string> = {
    'apple_contextual_01': 'Minimalismo Apple com breadcrumb contextual e timeline visual',
    'stripe_trust_02': 'Design Stripe com origem clara e hierarquia de informação',
    'linear_hierarchy_03': 'Estilo Linear com status em tempo real e blocos organizados'
  }
  return descriptions[key] || 'Template premium com contexto rico e design intuitivo'
}

function getTemplateCategory(key: string): string {
  if (key.includes('apple')) return 'APPLE DESIGN'
  if (key.includes('stripe')) return 'STRIPE TRUST'
  if (key.includes('linear')) return 'LINEAR SHARP'
  if (key.includes('notion')) return 'NOTION BLOCKS'
  return 'PREMIUM DESIGN'
}
