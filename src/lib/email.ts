// Sistema de envio de emails usando API do Resend (ou outro serviço)
// Para funcionar em produção, você precisa configurar um serviço de email como:
// - Resend (https://resend.com)
// - SendGrid (https://sendgrid.com)
// - Mailgun (https://mailgun.com)
// - Amazon SES

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

// Configuração do serviço de email
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'resend' // resend, sendgrid, mailgun, ses
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || ''
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@seudominio.com'
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Sistema de Suporte'

// Templates de email
export const emailTemplates = {
  ticketCreated: (data: any) => ({
    subject: `Novo Chamado #${data.ticket_number}: ${data.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .button { display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Novo Chamado Criado</h1>
          </div>
          <div class="content">
            <h2>Chamado #${data.ticket_number}</h2>
            <p><strong>Título:</strong> ${data.title}</p>
            <p><strong>Descrição:</strong> ${data.description}</p>
            <p><strong>Prioridade:</strong> ${data.priority}</p>
            <p><strong>Categoria:</strong> ${data.category}</p>
            <p><strong>Criado por:</strong> ${data.created_by}</p>
            <br>
            <a href="${data.ticket_url}" class="button">Ver Chamado</a>
          </div>
          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Novo Chamado #${data.ticket_number}
      
      Título: ${data.title}
      Descrição: ${data.description}
      Prioridade: ${data.priority}
      Categoria: ${data.category}
      Criado por: ${data.created_by}
      
      Ver chamado: ${data.ticket_url}
    `
  }),

  ticketAssigned: (data: any) => ({
    subject: `Chamado #${data.ticket_number} atribuído a você`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .button { display: inline-block; padding: 10px 20px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Chamado Atribuído</h1>
          </div>
          <div class="content">
            <p>Olá ${data.assigned_to_name},</p>
            <p>Um chamado foi atribuído a você:</p>
            <h3>Chamado #${data.ticket_number}</h3>
            <p><strong>Título:</strong> ${data.title}</p>
            <p><strong>Prioridade:</strong> ${data.priority}</p>
            <p><strong>Atribuído por:</strong> ${data.assigned_by}</p>
            <br>
            <a href="${data.ticket_url}" class="button">Ver Chamado</a>
          </div>
          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Olá ${data.assigned_to_name},
      
      Um chamado foi atribuído a você:
      
      Chamado #${data.ticket_number}
      Título: ${data.title}
      Prioridade: ${data.priority}
      Atribuído por: ${data.assigned_by}
      
      Ver chamado: ${data.ticket_url}
    `
  }),

  ticketResolved: (data: any) => ({
    subject: `Chamado #${data.ticket_number} foi resolvido`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .button { display: inline-block; padding: 10px 20px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 5px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Chamado Resolvido</h1>
          </div>
          <div class="content">
            <p>Seu chamado foi resolvido com sucesso!</p>
            <h3>Chamado #${data.ticket_number}</h3>
            <p><strong>Título:</strong> ${data.title}</p>
            <p><strong>Resolvido por:</strong> ${data.resolved_by}</p>
            <p><strong>Notas de resolução:</strong> ${data.resolution_notes || 'N/A'}</p>
            <br>
            <a href="${data.ticket_url}" class="button">Ver Detalhes</a>
          </div>
          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Seu chamado foi resolvido com sucesso!
      
      Chamado #${data.ticket_number}
      Título: ${data.title}
      Resolvido por: ${data.resolved_by}
      Notas de resolução: ${data.resolution_notes || 'N/A'}
      
      Ver detalhes: ${data.ticket_url}
    `
  })
}

// Função para enviar email usando Resend
async function sendWithResend(data: EmailData): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${EMAIL_FROM_NAME} <${data.from || EMAIL_FROM}>`,
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Resend API error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending email with Resend:', error)
    return false
  }
}

// Função para enviar email usando SendGrid
async function sendWithSendGrid(data: EmailData): Promise<boolean> {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: data.to }] }],
        from: { email: data.from || EMAIL_FROM, name: EMAIL_FROM_NAME },
        subject: data.subject,
        content: [
          { type: 'text/plain', value: data.text || '' },
          { type: 'text/html', value: data.html },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('SendGrid API error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending email with SendGrid:', error)
    return false
  }
}

// Função principal para enviar email
export async function sendEmail(data: EmailData): Promise<boolean> {
  // Se não houver API key configurada, apenas logar (desenvolvimento)
  if (!EMAIL_API_KEY) {
    console.log('📧 Email seria enviado:', {
      to: data.to,
      subject: data.subject,
      preview: data.text?.substring(0, 100) + '...'
    })
    return true // Simular sucesso em desenvolvimento
  }

  // Enviar com o serviço configurado
  switch (EMAIL_SERVICE) {
    case 'resend':
      return await sendWithResend(data)
    case 'sendgrid':
      return await sendWithSendGrid(data)
    default:
      console.warn(`Email service ${EMAIL_SERVICE} not implemented`)
      return false
  }
}

// Função helper para enviar notificação por email
export async function sendNotificationEmail(
  template: keyof typeof emailTemplates,
  to: string,
  data: any
): Promise<boolean> {
  const emailContent = emailTemplates[template](data)
  
  return await sendEmail({
    to,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  })
}