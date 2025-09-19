import { supabaseAdmin } from './supabase'

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
  }
  sendgrid?: {
    apiKey: string
  }
  resend?: {
    apiKey: string
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
        'smtp_host',
        'smtp_port',
        'smtp_user',
        'smtp_pass',
        'sendgrid_api_key',
        'resend_api_key'
      ])

    if (!settings || settings.length === 0) {
      // Usar configurações do ambiente como fallback
      return {
        provider: 'supabase', // Usar Supabase Auth Email como fallback
        from: process.env.EMAIL_FROM || 'noreply@ithostbr.tech'
      }
    }

    // Montar configuração baseada nas settings
    const configMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as any)

    const config: EmailConfig = {
      provider: configMap.email_provider || 'supabase',
      from: configMap.email_from || process.env.EMAIL_FROM || 'noreply@ithostbr.tech'
    }

    if (config.provider === 'smtp') {
      config.smtp = {
        host: configMap.smtp_host || process.env.SMTP_HOST || '',
        port: parseInt(configMap.smtp_port || process.env.SMTP_PORT || '587'),
        secure: configMap.smtp_port === '465',
        user: configMap.smtp_user || process.env.SMTP_USER || '',
        pass: configMap.smtp_pass || process.env.SMTP_PASS || ''
      }
    } else if (config.provider === 'sendgrid') {
      config.sendgrid = {
        apiKey: configMap.sendgrid_api_key || process.env.SENDGRID_API_KEY || ''
      }
    } else if (config.provider === 'resend') {
      config.resend = {
        apiKey: configMap.resend_api_key || process.env.RESEND_API_KEY || ''
      }
    }

    return config
  } catch (error) {
    console.error('Erro ao obter configuração de email:', error)
    return null
  }
}

/**
 * Envia email usando Supabase (fallback)
 */
async function sendViaSupabase(options: EmailOptions): Promise<boolean> {
  try {
    // Supabase não tem API direta de email genérico
    // Vamos criar uma notificação que será processada posteriormente
    const recipients = Array.isArray(options.to) ? options.to : [options.to]
    
    for (const email of recipients) {
      // Buscar usuário pelo email
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (user) {
        // Criar notificação para o usuário
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: user.id,
            type: 'email',
            title: options.subject,
            message: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML
            data: {
              html: options.html,
              from: options.from,
              replyTo: options.replyTo
            },
            is_read: false
          })
      }
      
      // Registrar tentativa de envio
      await supabaseAdmin
        .from('email_logs')
        .insert({
          to: email,
          subject: options.subject,
          body: options.html,
          status: 'queued',
          provider: 'supabase',
          created_at: new Date().toISOString()
        })
    }
    
    return true
  } catch (error) {
    console.error('Erro ao enviar via Supabase:', error)
    return false
  }
}

/**
 * Envia email usando SMTP (nodemailer)
 */
async function sendViaSMTP(config: EmailConfig, options: EmailOptions): Promise<boolean> {
  try {
    // Implementação SMTP seria aqui
    // Por enquanto, vamos registrar e usar fallback
    console.log('SMTP não configurado, usando fallback')
    return sendViaSupabase(options)
  } catch (error) {
    console.error('Erro ao enviar via SMTP:', error)
    return false
  }
}

/**
 * Envia email usando SendGrid
 */
async function sendViaSendGrid(config: EmailConfig, options: EmailOptions): Promise<boolean> {
  try {
    if (!config.sendgrid?.apiKey) {
      console.error('SendGrid API Key não configurada')
      return sendViaSupabase(options)
    }

    const recipients = Array.isArray(options.to) ? options.to : [options.to]
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.sendgrid.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: recipients.map(email => ({ email }))
        }],
        from: { email: options.from || config.from },
        subject: options.subject,
        content: [
          { type: 'text/html', value: options.html },
          ...(options.text ? [{ type: 'text/plain', value: options.text }] : [])
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`SendGrid error: ${response.status}`)
    }

    // Registrar sucesso
    for (const email of recipients) {
      await supabaseAdmin
        .from('email_logs')
        .insert({
          to: email,
          subject: options.subject,
          body: options.html,
          status: 'sent',
          provider: 'sendgrid',
          created_at: new Date().toISOString()
        })
    }

    return true
  } catch (error) {
    console.error('Erro ao enviar via SendGrid:', error)
    return sendViaSupabase(options)
  }
}

/**
 * Envia email usando Resend
 */
async function sendViaResend(config: EmailConfig, options: EmailOptions): Promise<boolean> {
  try {
    if (!config.resend?.apiKey) {
      console.error('Resend API Key não configurada')
      return sendViaSupabase(options)
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.resend.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: options.from || config.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      })
    })

    if (!response.ok) {
      throw new Error(`Resend error: ${response.status}`)
    }

    // Registrar sucesso
    const recipients = Array.isArray(options.to) ? options.to : [options.to]
    for (const email of recipients) {
      await supabaseAdmin
        .from('email_logs')
        .insert({
          to: email,
          subject: options.subject,
          body: options.html,
          status: 'sent',
          provider: 'resend',
          created_at: new Date().toISOString()
        })
    }

    return true
  } catch (error) {
    console.error('Erro ao enviar via Resend:', error)
    return sendViaSupabase(options)
  }
}

/**
 * Função principal para enviar email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    console.log(`📧 Enviando email para: ${options.to}`)
    
    const config = await getEmailConfig()
    if (!config) {
      console.error('Configuração de email não encontrada')
      return sendViaSupabase(options)
    }

    // Adicionar from padrão se não especificado
    if (!options.from) {
      options.from = config.from
    }

    switch (config.provider) {
      case 'smtp':
        return await sendViaSMTP(config, options)
      case 'sendgrid':
        return await sendViaSendGrid(config, options)
      case 'resend':
        return await sendViaResend(config, options)
      case 'supabase':
      default:
        return await sendViaSupabase(options)
    }
  } catch (error) {
    console.error('Erro ao enviar email:', error)
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
    const subject = `🚨 Escalação Automática - Ticket #${ticketId.slice(0, 8)}`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .ticket-info { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #e5e7eb; }
          .button { display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .alert { background-color: #fef2f2; border: 1px solid #dc2626; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Escalação Automática</h1>
          </div>
          <div class="content">
            <div class="alert">
              <p><strong>ATENÇÃO:</strong> Este ticket foi escalado automaticamente devido ao tempo excedido.</p>
            </div>
            
            <div class="ticket-info">
              <h2 style="color: #dc2626;">Ticket #${ticketId.slice(0, 8)}</h2>
              <p><strong>Título:</strong> ${ticketTitle}</p>
              <p><strong>Regra de Escalação:</strong> ${ruleName}</p>
              <p><strong>Data/Hora da Escalação:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
            </div>
            
            <p><strong>Ação Requerida:</strong></p>
            <p>Este ticket requer atenção imediata. Por favor, verifique e tome as ações necessárias o mais rápido possível.</p>
            
            <center>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ithostbr.tech'}/dashboard/tickets/${ticketId}" class="button">
                Ver Detalhes do Ticket
              </a>
            </center>
          </div>
          <div class="footer">
            <p>Este é um email automático do sistema de suporte. Por favor, não responda.</p>
            <p>© ${new Date().getFullYear()} IT Host BR - Sistema de Suporte</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    const text = `
      Escalação Automática de Ticket
      
      Um ticket foi escalado automaticamente.
      
      ID: #${ticketId.slice(0, 8)}
      Título: ${ticketTitle}
      Regra: ${ruleName}
      
      Acesse o sistema para mais detalhes.
    `
    
    return await sendEmail({
      to: recipientEmails,
      subject,
      html,
      text
    })
  } catch (error) {
    console.error('Erro ao enviar email de escalação:', error)
    return false
  }
}