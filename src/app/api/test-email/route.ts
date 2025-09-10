import { NextRequest, NextResponse } from 'next/server'
import { sendNotificationEmail } from '@/lib/email-config'
import { auth } from '@/lib/auth'
import { requireUserEmail } from '@/lib/session-utils'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Obter email de forma segura
    const userEmail = requireUserEmail(session)
    console.log('Testando envio de email para:', userEmail)

    // Enviar email de teste
    const result = await sendNotificationEmail({
      to: userEmail,
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
        help: 'Configure o email em Configurações > Email ou defina as variáveis SMTP_USER e SMTP_PASS no .env.local'
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

    // Importar supabaseAdmin aqui para verificar configuração no banco
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    // Verificar se existe configuração no banco de dados
    const { data: settings, error } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .eq('key', 'email_config')
      .single()

    let config
    let isConfigured = false
    let configSource = 'none'

    if (settings && settings.value) {
      // Configuração encontrada no banco de dados
      const dbConfig = settings.value
      config = {
        service: dbConfig.service || 'smtp',
        host: dbConfig.host || 'smtp.gmail.com',
        port: dbConfig.port || '587',
        user: dbConfig.user ? '✅ Configurado (Banco de Dados)' : '❌ Não configurado',
        pass: dbConfig.pass ? '✅ Configurado (Banco de Dados)' : '❌ Não configurado',
        from: dbConfig.from || dbConfig.user || 'Não configurado',
        fromName: dbConfig.fromName || 'Sistema de Suporte'
      }
      isConfigured = !!(dbConfig.user && dbConfig.pass)
      configSource = 'database'
    } else if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      // Configuração das variáveis de ambiente
      config = {
        service: process.env.EMAIL_SERVICE || 'smtp',
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || '587',
        user: '✅ Configurado (Variáveis de Ambiente)',
        pass: '✅ Configurado (Variáveis de Ambiente)',
        from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'Não configurado',
        fromName: process.env.EMAIL_FROM_NAME || 'Sistema de Suporte'
      }
      isConfigured = true
      configSource = 'environment'
    } else {
      // Nenhuma configuração encontrada
      config = {
        service: 'smtp',
        host: 'smtp.gmail.com',
        port: '587',
        user: '❌ Não configurado',
        pass: '❌ Não configurado',
        from: 'Não configurado',
        fromName: 'Sistema de Suporte'
      }
    }

    return NextResponse.json({
      configured: isConfigured,
      configSource,
      config,
      message: isConfigured 
        ? `Email configurado (${configSource === 'database' ? 'Banco de Dados' : 'Variáveis de Ambiente'}). Use POST para enviar um teste.`
        : 'Email não configurado. Configure em Configurações > Email ou defina SMTP_USER e SMTP_PASS no .env.local'
    })
  } catch (error: any) {
    console.error('Erro ao verificar configuração:', error)
    return NextResponse.json({ 
      error: 'Erro ao verificar configuração',
      message: error.message
    }, { status: 500 })
  }
}