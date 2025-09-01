import { NextRequest, NextResponse } from 'next/server'
import { sendNotificationEmail } from '@/lib/email-config'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    console.log('Testando envio de email para:', session.user.email)

    // Enviar email de teste
    const result = await sendNotificationEmail({
      to: session.user.email,
      title: '✅ Teste de Email - Sistema de Suporte',
      message: `Olá ${session.user.name}! Este é um email de teste do Sistema de Suporte Técnico. Se você está recebendo este email, significa que a configuração do Gmail está funcionando corretamente!`,
      actionUrl: '/dashboard',
      actionText: 'Acessar Sistema'
    })

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email enviado com sucesso! Verifique sua caixa de entrada.',
        details: {
          messageId: result.messageId,
          accepted: result.accepted,
          rejected: result.rejected
        }
      })
    } else {
      console.error('Erro ao enviar email:', result.error)
      return NextResponse.json({ 
        success: false, 
        error: result.error,
        details: result.details,
        help: 'Verifique se você configurou as variáveis SMTP_USER e SMTP_PASS no .env.local'
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Erro no endpoint de teste:', error)
    return NextResponse.json({ 
      error: 'Erro ao processar requisição',
      message: error.message,
      help: 'Verifique o console do servidor para mais detalhes'
    }, { status: 500 })
  }
}

// GET - Verificar status da configuração de email
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar configurações
    const config = {
      service: process.env.EMAIL_SERVICE || 'smtp',
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || '587',
      user: process.env.SMTP_USER ? '✅ Configurado' : '❌ Não configurado',
      pass: process.env.SMTP_PASS ? '✅ Configurado' : '❌ Não configurado',
      from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'Não configurado',
      fromName: process.env.EMAIL_FROM_NAME || 'Sistema de Suporte'
    }

    const isConfigured = process.env.SMTP_USER && process.env.SMTP_PASS

    return NextResponse.json({
      configured: isConfigured,
      config,
      message: isConfigured 
        ? 'Email configurado. Use POST para enviar um teste.'
        : 'Email não configurado. Configure SMTP_USER e SMTP_PASS no .env.local'
    })
  } catch (error: any) {
    console.error('Erro ao verificar configuração:', error)
    return NextResponse.json({ 
      error: 'Erro ao verificar configuração',
      message: error.message
    }, { status: 500 })
  }
}