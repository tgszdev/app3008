import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'meta_whatsapp_webhook_2025'

/**
 * GET - Verificação do webhook (Meta exige isso para configuração)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  console.log('[Meta WhatsApp Webhook] Verificação:', { mode, token })

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook Meta WhatsApp verificado!')
    return new NextResponse(challenge, { status: 200 })
  }

  console.error('❌ Webhook verification failed')
  return new NextResponse('Forbidden', { status: 403 })
}

/**
 * POST - Receber notificações de status e mensagens
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('[Meta WhatsApp Webhook] Evento:', JSON.stringify(body, null, 2))

    // Processar cada entry
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value

        // ═══════════════════════════════════════════════════════════
        // PROCESSAR MUDANÇAS DE STATUS
        // ═══════════════════════════════════════════════════════════
        if (value?.statuses) {
          for (const status of value.statuses) {
            const messageId = status.id
            const statusValue = status.status // sent, delivered, read, failed
            const timestamp = new Date(parseInt(status.timestamp) * 1000).toISOString()

            console.log(`📊 Status: ${messageId} → ${statusValue}`)

            const updateData: any = {
              status: statusValue,
              updated_at: timestamp
            }

            if (statusValue === 'delivered') {
              updateData.delivered_at = timestamp
            } else if (statusValue === 'read') {
              updateData.read_at = timestamp
            } else if (statusValue === 'failed') {
              updateData.failed_at = timestamp
              updateData.error_message = status.errors?.[0]?.title || 'Falha no envio'
            }

            await supabaseAdmin
              .from('whatsapp_messages')
              .update(updateData)
              .eq('message_id', messageId)
          }
        }

        // ═══════════════════════════════════════════════════════════
        // PROCESSAR MENSAGENS RECEBIDAS
        // ═══════════════════════════════════════════════════════════
        if (value?.messages) {
          for (const message of value.messages) {
            const from = message.from
            const messageType = message.type
            const messageId = message.id

            console.log(`💬 Mensagem de ${from}:`, message)

            let messageText = ''
            if (messageType === 'text') {
              messageText = message.text?.body || ''
            } else if (messageType === 'button') {
              messageText = message.button?.text || ''
            }

            // Salvar mensagem recebida
            await supabaseAdmin
              .from('whatsapp_received_messages')
              .insert({
                message_id: messageId,
                from_phone: from,
                message_type: messageType,
                message_text: messageText,
                raw_data: message,
                received_at: new Date().toISOString()
              })
              .catch(err => console.error('Erro ao salvar mensagem:', err))
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

