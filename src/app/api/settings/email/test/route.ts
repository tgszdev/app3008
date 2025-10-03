import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Apenas admins podem testar configurações de email
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const config = await request.json()

    // Validação
    if (!config.host || !config.port || !config.user || !config.pass) {
      return NextResponse.json(
        { error: 'Configurações incompletas' },
        { status: 400 }
      )
    }

    // Criar transporter temporário para teste
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: parseInt(config.port),
      secure: config.secure || config.port === '465',
      auth: {
        user: config.user,
        pass: config.pass.replace(/\s/g, '') // Remove espaços da senha
      },
      tls: {
        rejectUnauthorized: false // Aceita certificados auto-assinados para teste
      }
    })

    // Verificar conexão
    try {
      await transporter.verify()
    } catch (verifyError: any) {
      
      let errorMessage = 'Falha na conexão com o servidor SMTP'
      
      if (verifyError.code === 'EAUTH') {
        errorMessage = 'Falha na autenticação. Verifique o email e senha.'
      } else if (verifyError.code === 'ECONNECTION') {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique host e porta.'
      } else if (verifyError.message?.includes('Invalid login')) {
        errorMessage = 'Login inválido. Para Gmail, use uma senha de app, não sua senha normal.'
      }
      
      return NextResponse.json({ 
        success: false, 
        error: errorMessage,
        details: verifyError.message 
      }, { status: 400 })
    }

    // Verificar se temos um email válido
    if (!session.user.email) {
      return NextResponse.json({
        success: false,
        error: 'Email do usuário não encontrado na sessão'
      }, { status: 400 })
    }

    // Enviar email de teste
    const mailOptions = {
      from: `${config.fromName || 'Sistema de Suporte'} <${config.from || config.user}>`,
      to: session.user.email as string,
      subject: '✅ Teste de Configuração de Email - Sistema de Suporte',
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 20px 0;">
            <tr>
              <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px;">
                        ✅ Configuração Bem-Sucedida!
                      </h1>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 30px;">
                      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 20px;">
                        Olá ${session.user.name}!
                      </h2>
                      
                      <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                        Este é um email de teste confirmando que suas configurações de SMTP estão funcionando corretamente.
                      </p>
                      
                      <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
                        <h3 style="margin: 0 0 10px 0; color: #333333; font-size: 16px;">
                          Configurações Testadas:
                        </h3>
                        <ul style="margin: 0; padding-left: 20px; color: #666666;">
                          <li>Servidor: ${config.host}</li>
                          <li>Porta: ${config.port}</li>
                          <li>Usuário: ${config.user}</li>
                          <li>Segurança: ${config.secure ? 'SSL/TLS' : 'STARTTLS'}</li>
                        </ul>
                      </div>
                      
                      <p style="margin: 20px 0; color: #666666; font-size: 16px;">
                        Agora o sistema pode enviar notificações por email para os usuários.
                      </p>
                      
                      <table cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings" 
                               style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
                              Voltar às Configurações
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 20px; background-color: #f8f9fa; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; text-align: center;">
                      <p style="margin: 0; color: #999999; font-size: 14px;">
                        Este é um email automático de teste.
                      </p>
                      <p style="margin: 5px 0 0 0; color: #999999; font-size: 14px;">
                        Enviado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).replace(',', ' às')}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
Configuração Bem-Sucedida!

Olá ${session.user.name}!

Este é um email de teste confirmando que suas configurações de SMTP estão funcionando corretamente.

Configurações Testadas:
- Servidor: ${config.host}
- Porta: ${config.port}
- Usuário: ${config.user}
- Segurança: ${config.secure ? 'SSL/TLS' : 'STARTTLS'}

Agora o sistema pode enviar notificações por email para os usuários.

Enviado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).replace(',', ' às')}
      `.trim()
    }

    try {
      const info = await transporter.sendMail(mailOptions)
      
      return NextResponse.json({
        success: true,
        message: 'Email de teste enviado com sucesso!',
        messageId: info.messageId
      })
    } catch (sendError: any) {
      
      return NextResponse.json({
        success: false,
        error: 'Erro ao enviar email. Conexão OK, mas envio falhou.',
        details: sendError.message
      }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}