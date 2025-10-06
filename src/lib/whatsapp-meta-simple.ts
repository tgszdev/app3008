/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║  META WHATSAPP - VERSÃO SIMPLIFICADA (SÓ hello_world)             ║
 * ║  Funciona IMEDIATAMENTE sem aguardar aprovação de templates       ║
 * ╚════════════════════════════════════════════════════════════════════╝
 */

import { supabaseAdmin } from './supabase'

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0'
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

/**
 * 📱 Enviar mensagem simples usando template hello_world
 */
export async function sendWhatsAppSimple(to: string) {
  try {
    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      return { success: false, error: 'WhatsApp não configurado' }
    }

    const phoneNumber = to.replace(/\D/g, '')
    
    if (!phoneNumber.startsWith('55')) {
      return { success: false, error: 'Número inválido' }
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'template',
      template: {
        name: 'hello_world',
        language: { code: 'en_US' }
      }
    }

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
      console.error('❌ Erro WhatsApp:', result)
      return { success: false, error: result.error?.message }
    }

    console.log('✅ WhatsApp enviado:', result.messages?.[0]?.id)

    return {
      success: true,
      message_id: result.messages?.[0]?.id
    }
  } catch (error: any) {
    console.error('❌ Erro:', error)
    return { success: false, error: error.message }
  }
}

