import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

// Cache do transporter para reutilização
let transporterCache: Transporter | null = null

// Criar transporter baseado na configuração
export function createEmailTransporter(): Transporter {
  // Retorna cache se já existir
  if (transporterCache) {
    return transporterCache
  }

  const emailService = process.env.EMAIL_SERVICE || 'smtp'

  if (emailService === 'smtp') {
    // Configuração SMTP (Gmail com senha de app)
    transporterCache = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS?.replace(/\s/g, '') // Remove espaços da senha de app
      },
      tls: {
        rejectUnauthorized: false // Aceita certificados auto-assinados (desenvolvimento)
      }
    })

    // Verificar conexão
    if (transporterCache) {
      transporterCache.verify((error, success) => {
        if (error) {
          console.error('Erro na configuração do email:', error)
        } else {
          console.log('Servidor de email pronto para enviar mensagens')
        }
      })
    }

    return transporterCache
  }

  throw new Error(`Serviço de email ${emailService} não configurado`)
  
  // TypeScript precisa deste return para garantir que sempre retorna Transporter
  return transporterCache as Transporter
}

// Interface para opções de email
export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: Array<{
    filename: string
    content?: string | Buffer
    path?: string
  }>
}

// Função para enviar email
export async function sendEmail(options: EmailOptions) {
  try {
    // Verificar se as configurações existem
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('Configurações de email não encontradas. Email não enviado.')
      return { 
        success: false, 
        error: 'Email não configurado. Configure as variáveis SMTP_USER e SMTP_PASS.' 
      }
    }

    const transporter = createEmailTransporter()
    
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'Sistema de Suporte'} <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email enviado com sucesso:', info.messageId)
    
    return { 
      success: true, 
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    }
  } catch (error: any) {
    console.error('Erro ao enviar email:', error)
    
    // Mensagens de erro mais amigáveis
    let errorMessage = 'Erro ao enviar email'
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Falha na autenticação. Verifique o email e senha de app.'
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Não foi possível conectar ao servidor de email.'
    } else if (error.message?.includes('Invalid login')) {
      errorMessage = 'Login inválido. Use uma senha de app do Gmail, não sua senha normal.'
    }
    
    return { 
      success: false, 
      error: errorMessage,
      details: error.message 
    }
  }
}

// Função para enviar email de notificação formatado
export async function sendNotificationEmail({
  to,
  title,
  message,
  actionUrl,
  actionText = 'Ver Detalhes'
}: {
  to: string
  title: string
  message: string
  actionUrl?: string
  actionText?: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const fullActionUrl = actionUrl ? `${baseUrl}${actionUrl}` : `${baseUrl}/dashboard`

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 20px 0;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; text-align: center;">
                    Sistema de Suporte Técnico
                  </h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">
                    ${title}
                  </h2>
                  
                  <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    ${message}
                  </p>
                  
                  ${actionUrl ? `
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="${fullActionUrl}" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                          ${actionText} →
                        </a>
                      </td>
                    </tr>
                  </table>
                  ` : ''}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                  <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
                    Este é um email automático. Por favor, não responda.
                  </p>
                  <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                    © ${new Date().getFullYear()} Sistema de Suporte Técnico
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  const text = `
${title}

${message}

${actionUrl ? `Ver detalhes: ${fullActionUrl}` : ''}

---
Este é um email automático. Por favor, não responda.
© ${new Date().getFullYear()} Sistema de Suporte Técnico
  `.trim()

  return sendEmail({
    to,
    subject: title,
    html,
    text
  })
}