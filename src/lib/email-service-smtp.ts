import { supabaseAdmin } from './supabase'
import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'resend' | 'supabase'
  smtp?: {
    host: string
    port: number
    secure: boolean
    user: string
    pass: string
    from: string
    fromName: string
  }
  from: string
}

/**
 * Obtém a configuração de email do sistema
 */
async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    // Buscar configurações do banco
    const { data: settings } = await supabaseAdmin
      .from('system_settings')
      .select('key, value')
      .in('key', [
        'email_provider',
        'email_from',
        'email_from_name', 
        'smtp_host',
        'smtp_port',
        'smtp_user',
        'smtp_pass',
        'smtp_secure'
      ])

    if (!settings || settings.length === 0) {
      console.log('⚠️ Nenhuma configuração de email encontrada no banco')
      return null
    }

    // Montar configuração baseada nas settings
    const configMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as any)

    // Se o provider é SMTP e temos as configurações necessárias
    if (configMap.smtp_host && configMap.smtp_user && configMap.smtp_pass) {
      const config: EmailConfig = {
        provider: 'smtp',
        from: configMap.email_from || configMap.smtp_user || 'noreply@ithostbr.tech',
        smtp: {
          host: configMap.smtp_host,
          port: parseInt(configMap.smtp_port || '587'),
          secure: configMap.smtp_port === '465' || configMap.smtp_secure === 'true',
          user: configMap.smtp_user,
          pass: configMap.smtp_pass,
          from: configMap.email_from || configMap.smtp_user,
          fromName: configMap.email_from_name || 'Sistema de Suporte Técnico'
        }
      }
      
      console.log('📧 Configuração SMTP carregada:', {
        host: config.smtp?.host,
        port: config.smtp?.port,
        user: config.smtp?.user,
        from: config.smtp?.from
      })
      
      return config
    }

    return null
  } catch (error) {
    console.error('❌ Erro ao obter configuração de email:', error)
    return null
  }
}

/**
 * Envia email usando SMTP (nodemailer)
 */
async function sendViaSMTP(config: EmailConfig, options: EmailOptions): Promise<boolean> {
  try {
    if (!config.smtp) {
      console.error('❌ Configuração SMTP não encontrada')
      return false
    }

    console.log('📤 Iniciando envio SMTP para:', options.to)

    // Criar transporter do nodemailer
    const transporter = nodemailer.createTransporter({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
      },
      tls: {
        rejectUnauthorized: false // Para Gmail
      }
    })

    // Verificar conexão
    try {
      await transporter.verify()
      console.log('✅ Conexão SMTP verificada com sucesso')
    } catch (verifyError) {
      console.error('❌ Erro ao verificar conexão SMTP:', verifyError)
    }

    // Preparar destinatários
    const recipients = Array.isArray(options.to) ? options.to : [options.to]
    
    // Enviar email
    const mailOptions = {
      from: `"${config.smtp.fromName}" <${config.smtp.from}>`,
      to: recipients.join(', '),
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML para versão texto
      html: options.html
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email enviado com sucesso:', info.messageId)
    console.log('📬 Aceito por:', info.accepted)

    // Registrar no banco
    for (const email of recipients) {
      try {
        await supabaseAdmin
          .from('email_logs')
          .insert({
            to: email,
            subject: options.subject,
            body: options.html,
            status: 'sent',
            provider: 'smtp',
            created_at: new Date().toISOString(),
            metadata: {
              messageId: info.messageId,
              response: info.response
            }
          })
      } catch (logError) {
        console.error('⚠️ Erro ao registrar log de email:', logError)
      }
    }

    return true
  } catch (error: any) {
    console.error('❌ Erro ao enviar via SMTP:', error)
    console.error('Detalhes:', error.message)
    
    // Registrar erro no banco
    const recipients = Array.isArray(options.to) ? options.to : [options.to]
    for (const email of recipients) {
      try {
        await supabaseAdmin
          .from('email_logs')
          .insert({
            to: email,
            subject: options.subject,
            body: options.html,
            status: 'failed',
            provider: 'smtp',
            error_message: error.message,
            created_at: new Date().toISOString()
          })
      } catch (logError) {
        console.error('⚠️ Erro ao registrar log de erro:', logError)
      }
    }
    
    return false
  }
}

/**
 * Função principal para enviar email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    console.log(`📧 [EMAIL-SERVICE] Iniciando envio de email para: ${options.to}`)
    console.log(`📧 [EMAIL-SERVICE] Assunto: ${options.subject}`)
    
    const config = await getEmailConfig()
    if (!config) {
      console.error('❌ [EMAIL-SERVICE] Configuração de email não encontrada')
      return false
    }

    // Adicionar from padrão se não especificado
    if (!options.from) {
      options.from = config.from
    }

    console.log(`📧 [EMAIL-SERVICE] Usando provider: ${config.provider}`)

    if (config.provider === 'smtp' && config.smtp) {
      return await sendViaSMTP(config, options)
    }

    console.error('❌ [EMAIL-SERVICE] Provider não suportado ou configuração incompleta')
    return false
  } catch (error) {
    console.error('❌ [EMAIL-SERVICE] Erro geral ao enviar email:', error)
    return false
  }
}

/**
 * Envia email de escalação
 */
export async function sendEscalationEmail(
  ticketId: string,
  ticketTitle: string,
  ruleName: string,
  recipientEmails: string[]
): Promise<boolean> {
  try {
    console.log(`🚨 [ESCALATION-EMAIL] Preparando email de escalação`)
    console.log(`🚨 [ESCALATION-EMAIL] Ticket: ${ticketTitle} (${ticketId})`)
    console.log(`🚨 [ESCALATION-EMAIL] Regra: ${ruleName}`)
    console.log(`🚨 [ESCALATION-EMAIL] Destinatários: ${recipientEmails.join(', ')}`)
    
    const subject = `🚨 Escalação Automática - Ticket #${ticketId.slice(0, 8)}`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-top: none; }
          .ticket-info { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #e5e7eb; }
          .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .alert { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 10px; margin: 10px 0; }
          h1 { margin: 0; }
          h2 { color: #1f2937; margin-top: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Escalação Automática de Ticket</h1>
          </div>
          <div class="content">
            <div class="alert">
              <strong>ATENÇÃO NECESSÁRIA:</strong> Este ticket foi escalado automaticamente devido ao tempo excedido de resposta.
            </div>
            
            <div class="ticket-info">
              <h2>Detalhes do Ticket</h2>
              <p><strong>ID:</strong> #${ticketId.slice(0, 8)}</p>
              <p><strong>Título:</strong> ${ticketTitle}</p>
              <p><strong>Motivo da Escalação:</strong> ${ruleName}</p>
              <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).replace(',', ' às')}</p>
            </div>
            
            <p><strong>Ação Necessária:</strong></p>
            <ul>
              <li>Este ticket requer atenção imediata</li>
              <li>Por favor, verifique e tome as ações necessárias</li>
              <li>A prioridade foi automaticamente aumentada</li>
            </ul>
            
            <center>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ithostbr.tech'}/dashboard/tickets/${ticketId}" class="button" style="color: white;">
                Abrir Ticket no Sistema
              </a>
            </center>
          </div>
          <div class="footer">
            <p>Este é um email automático do sistema de suporte.</p>
            <p>© ${new Date().getFullYear()} IT Host BR - Sistema de Suporte Técnico</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    const text = `
Escalação Automática de Ticket

ATENÇÃO NECESSÁRIA: Este ticket foi escalado automaticamente.

Detalhes:
- ID: #${ticketId.slice(0, 8)}
- Título: ${ticketTitle}
- Motivo: ${ruleName}
- Data/Hora: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}

Acesse o sistema para mais detalhes:
${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ithostbr.tech'}/dashboard/tickets/${ticketId}
    `
    
    const result = await sendEmail({
      to: recipientEmails,
      subject,
      html,
      text
    })
    
    if (result) {
      console.log(`✅ [ESCALATION-EMAIL] Email de escalação enviado com sucesso`)
    } else {
      console.error(`❌ [ESCALATION-EMAIL] Falha ao enviar email de escalação`)
    }
    
    return result
  } catch (error) {
    console.error('❌ [ESCALATION-EMAIL] Erro ao enviar email de escalação:', error)
    return false
  }
}

// Exportar também a função original para compatibilidade
export { sendEscalationEmail as default }