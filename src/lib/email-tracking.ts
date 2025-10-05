/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║  EMAIL TRACKING - Rastreamento de Abertura e Cliques              ║
 * ╚════════════════════════════════════════════════════════════════════╝
 */

import { supabaseAdmin } from './supabase'

/**
 * Gera token único para tracking de email
 */
export function generateTrackingToken(emailId: string, userId: string): string {
  const data = `${emailId}:${userId}:${Date.now()}`
  return Buffer.from(data).toString('base64url')
}

/**
 * Decodifica token de tracking
 */
export function decodeTrackingToken(token: string): { emailId: string, userId: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const [emailId, userId] = decoded.split(':')
    return { emailId, userId }
  } catch {
    return null
  }
}

/**
 * Adiciona pixel de tracking ao HTML do email
 */
export function addTrackingPixel(html: string, trackingToken: string): string {
  const pixel = `<img src="${process.env.NEXT_PUBLIC_URL || 'https://www.ithostbr.tech'}/api/track/email/open?t=${trackingToken}" width="1" height="1" alt="" style="display:none;" />`
  
  // Inserir antes do </body>
  if (html.includes('</body>')) {
    return html.replace('</body>', `${pixel}</body>`)
  }
  
  // Se não tem </body>, adicionar no final
  return html + pixel
}

/**
 * Adiciona tracking aos links do email
 */
export function addLinkTracking(html: string, trackingToken: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://www.ithostbr.tech'
  
  // Substituir links href com tracking
  return html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (match, url) => {
      // Não trackear links de configuração/unsubscribe
      if (url.includes('/settings') || url.includes('/unsubscribe')) {
        return match
      }
      
      // Adicionar tracking
      const trackUrl = `${baseUrl}/api/track/email/click?t=${trackingToken}&url=${encodeURIComponent(url)}`
      return `href="${trackUrl}"`
    }
  )
}

/**
 * Registra abertura de email
 */
export async function trackEmailOpen(emailId: string, userId: string, metadata?: {
  userAgent?: string
  ip?: string
}) {
  try {
    await supabaseAdmin
      .from('email_engagement')
      .upsert({
        email_id: emailId,
        user_id: userId,
        opened_at: new Date().toISOString(),
        user_agent: metadata?.userAgent,
        ip_address: metadata?.ip
      }, {
        onConflict: 'email_id,user_id'
      })
    
    // Atualizar contador no email_logs
    await supabaseAdmin
      .from('email_logs')
      .update({ 
        opened_at: new Date().toISOString(),
        open_count: supabaseAdmin.raw('COALESCE(open_count, 0) + 1')
      })
      .eq('id', emailId)
    
    return true
  } catch (error) {
    console.error('Erro ao registrar abertura de email:', error)
    return false
  }
}

/**
 * Registra clique em link do email
 */
export async function trackEmailClick(emailId: string, userId: string, clickedUrl: string, metadata?: {
  userAgent?: string
  ip?: string
}) {
  try {
    await supabaseAdmin
      .from('email_engagement')
      .upsert({
        email_id: emailId,
        user_id: userId,
        clicked_at: new Date().toISOString(),
        clicked_url: clickedUrl,
        user_agent: metadata?.userAgent,
        ip_address: metadata?.ip
      }, {
        onConflict: 'email_id,user_id'
      })
    
    // Atualizar contador no email_logs
    await supabaseAdmin
      .from('email_logs')
      .update({ 
        clicked_at: new Date().toISOString(),
        click_count: supabaseAdmin.raw('COALESCE(click_count, 0) + 1'),
        last_clicked_url: clickedUrl
      })
      .eq('id', emailId)
    
    return true
  } catch (error) {
    console.error('Erro ao registrar clique de email:', error)
    return false
  }
}

/**
 * Registra ação tomada a partir do email
 */
export async function trackEmailAction(emailId: string, userId: string, action: string) {
  try {
    await supabaseAdmin
      .from('email_engagement')
      .update({
        action_taken: action,
        action_taken_at: new Date().toISOString()
      })
      .eq('email_id', emailId)
      .eq('user_id', userId)
    
    return true
  } catch (error) {
    console.error('Erro ao registrar ação de email:', error)
    return false
  }
}

