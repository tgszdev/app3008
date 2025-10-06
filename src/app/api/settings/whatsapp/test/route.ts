import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendWhatsAppTemplate } from '@/lib/whatsapp-meta'

/**
 * POST - Enviar mensagem de teste via Meta WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[WhatsApp Test] Iniciando teste...')
    
    const session = await auth()
    
    if (!session?.user?.id) {
      console.log('[WhatsApp Test] Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    console.log('[WhatsApp Test] Usuário:', session.user.email)

    const { phone } = await request.json()
    console.log('[WhatsApp Test] Telefone:', phone)

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Telefone não fornecido' },
        { status: 400 }
      )
    }

    // Validar telefone
    const cleanPhone = phone.replace(/\D/g, '')
    if (!cleanPhone.startsWith('55') || cleanPhone.length < 12) {
      return NextResponse.json(
        { success: false, error: 'Telefone inválido. Use formato brasileiro: +55 11 98765-4321' },
        { status: 400 }
      )
    }

    // Enviar usando template hello_world (padrão da Meta)
    console.log('[WhatsApp Test] Enviando template hello_world...')
    console.log('[WhatsApp Test] Credenciais:', {
      hasPhoneId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
      hasToken: !!process.env.WHATSAPP_ACCESS_TOKEN
    })
    
    const result = await sendWhatsAppTemplate({
      template_name: 'hello_world',
      to: phone,
      language: 'en_US',
      components: []
    })
    
    console.log('[WhatsApp Test] Resultado:', result)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message_id: result.message_id,
        message: 'Mensagem enviada com sucesso! Verifique seu WhatsApp'
      })
    } else {
      // Melhorar mensagem de erro
      let errorMessage = result.error || 'Erro desconhecido'
      
      if (errorMessage.includes('not a valid')) {
        errorMessage = 'Número inválido ou não tem WhatsApp ativo'
      } else if (errorMessage.includes('Authenticate') || errorMessage.includes('token')) {
        errorMessage = 'Credenciais Meta inválidas. Verifique WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_ACCESS_TOKEN'
      } else if (errorMessage.includes('template')) {
        errorMessage = 'Template não encontrado ou não aprovado. Use "hello_world" para teste'
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Erro ao enviar mensagem de teste:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

