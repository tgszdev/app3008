/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║  META WHATSAPP BUSINESS API - Implementação Oficial                ║
 * ║  API Oficial • Templates Aprovados • Alta Confiabilidade           ║
 * ╚════════════════════════════════════════════════════════════════════╝
 */

import { supabaseAdmin } from './supabase'

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0'
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

interface WhatsAppTemplateParams {
  template_name: string
  to: string
  language?: string
  components: Array<{
    type: string
    parameters: Array<{
      type: string
      text: string
    }>
  }>
}

/**
 * 📱 Enviar mensagem via Meta WhatsApp usando template aprovado
 */
export async function sendWhatsAppTemplate(params: WhatsAppTemplateParams) {
  try {
    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      console.warn('⚠️ WhatsApp não configurado (faltam credenciais)')
      return { success: false, error: 'WhatsApp não configurado' }
    }

    // Formatar número
    const phoneNumber = params.to.replace(/\D/g, '')
    
    if (!phoneNumber.startsWith('55')) {
      console.warn(`⚠️ Número inválido: ${params.to}`)
      return { success: false, error: 'Número deve ter código do Brasil (+55)' }
    }

    console.log(`[Meta WhatsApp] Enviando template "${params.template_name}" para +${phoneNumber}`)

    // Payload da requisição
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phoneNumber,
      type: 'template',
      template: {
        name: params.template_name,
        language: {
          code: params.language || 'pt_BR'
        },
        components: params.components
      }
    }

    // Enviar para API do WhatsApp
    const response = await fetch(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    )

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Erro Meta WhatsApp API:', result)
      
      // Salvar erro no banco
      try {
        await supabaseAdmin
          .from('whatsapp_messages')
          .insert({
            to_phone: phoneNumber,
            template_name: params.template_name,
            status: 'failed',
            error_message: result.error?.message || 'Erro desconhecido',
            failed_at: new Date().toISOString()
          })
      } catch (err) {
        console.error('Erro ao salvar log:', err)
      }

      throw new Error(result.error?.message || 'Erro ao enviar WhatsApp')
    }

    const messageId = result.messages?.[0]?.id

    console.log('✅ WhatsApp enviado! ID:', messageId)

    // Salvar no banco
    try {
      await supabaseAdmin
        .from('whatsapp_messages')
        .insert({
          message_id: messageId,
          to_phone: phoneNumber,
          template_name: params.template_name,
          status: 'sent',
          sent_at: new Date().toISOString(),
          metadata: { components: params.components }
        })
    } catch (err) {
      console.error('Erro ao salvar no banco:', err)
    }

    return {
      success: true,
      message_id: messageId
    }

  } catch (error: any) {
    console.error('❌ Erro ao enviar WhatsApp:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 💬 Notificação: Novo Comentário
 * Template: novo_comentario
 * 
 * Variáveis:
 * {{1}} = ticket_number (ex: 1234)
 * {{2}} = comment_text (comentário)
 * {{3}} = ticket_title (título)
 * {{4}} = commenter_name (quem comentou)
 * {{5}} = client_name (cliente)
 * {{6}} = ticket_id (UUID para URL)
 */
export async function sendWhatsAppNewComment(data: {
  to: string
  ticket_number: string
  comment_text: string
  ticket_title: string
  commenter_name: string
  client_name: string
  ticket_id: string
}) {
  return sendWhatsAppTemplate({
    template_name: 'novo_comentario',
    to: data.to,
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: data.ticket_number }, // {{1}}
          { type: 'text', text: data.comment_text.substring(0, 150) }, // {{2}}
          { type: 'text', text: data.ticket_title }, // {{3}}
          { type: 'text', text: data.commenter_name }, // {{4}}
          { type: 'text', text: data.client_name || 'N/A' }, // {{5}}
          { type: 'text', text: data.ticket_id } // {{6}} para URL
        ]
      }
    ]
  })
}

/**
 * 🔄 Notificação: Status Alterado
 * Template: status_alterado
 * 
 * Variáveis:
 * {{1}} = ticket_number
 * {{2}} = old_status
 * {{3}} = new_status
 * {{4}} = ticket_title
 * {{5}} = changed_by
 * {{6}} = ticket_id (UUID para URL)
 */
export async function sendWhatsAppStatusChanged(data: {
  to: string
  ticket_number: string
  old_status: string
  new_status: string
  ticket_title: string
  changed_by: string
  ticket_id: string
}) {
  return sendWhatsAppTemplate({
    template_name: 'status_alterado',
    to: data.to,
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: data.ticket_number }, // {{1}}
          { type: 'text', text: data.old_status }, // {{2}}
          { type: 'text', text: data.new_status }, // {{3}}
          { type: 'text', text: data.ticket_title }, // {{4}}
          { type: 'text', text: data.changed_by }, // {{5}}
          { type: 'text', text: data.ticket_id } // {{6}} para URL
        ]
      }
    ]
  })
}

/**
 * 🎫 Notificação: Chamado Criado
 * Template: chamado_criado
 * 
 * Variáveis:
 * {{1}} = ticket_number
 * {{2}} = ticket_title
 * {{3}} = priority
 * {{4}} = client_name
 * {{5}} = category
 * {{6}} = ticket_id (UUID para URL)
 */
export async function sendWhatsAppTicketCreated(data: {
  to: string
  ticket_number: string
  ticket_title: string
  priority: string
  client_name: string
  category: string
  ticket_id: string
}) {
  return sendWhatsAppTemplate({
    template_name: 'chamado_criado',
    to: data.to,
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: data.ticket_number }, // {{1}}
          { type: 'text', text: data.ticket_title }, // {{2}}
          { type: 'text', text: data.priority }, // {{3}}
          { type: 'text', text: data.client_name || 'N/A' }, // {{4}}
          { type: 'text', text: data.category }, // {{5}}
          { type: 'text', text: data.ticket_id } // {{6}} para URL
        ]
      }
    ]
  })
}

/**
 * 📱 Validar número brasileiro
 */
export function validateBrazilianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13)
}

/**
 * 📱 Formatar para exibição
 */
export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 13) {
    return `+55 ${cleaned.substring(2, 4)} ${cleaned.substring(4, 9)}-${cleaned.substring(9)}`
  } else if (cleaned.length === 12) {
    return `+55 ${cleaned.substring(2, 4)} ${cleaned.substring(4, 8)}-${cleaned.substring(8)}`
  }
  
  return phone
}

