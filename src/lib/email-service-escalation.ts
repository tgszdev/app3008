// Email service específico para escalações, usando a configuração existente do sistema
import { sendEmail as sendEmailConfig, sendNotificationEmail } from './email-config'

/**
 * Envia email de escalação usando a configuração existente do sistema
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
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 20px 0;">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header Urgente -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; text-align: center;">
                      ⚠️ ESCALAÇÃO AUTOMÁTICA
                    </h1>
                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; text-align: center;">
                      Atenção Imediata Necessária
                    </p>
                  </td>
                </tr>
                
                <!-- Alert Box -->
                <tr>
                  <td style="padding: 20px 30px;">
                    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 20px;">
                      <p style="margin: 0; color: #991b1b; font-weight: bold;">
                        AÇÃO REQUERIDA: Este ticket foi escalado automaticamente devido ao tempo excedido.
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
                      <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">
                        📋 Detalhes do Ticket
                      </h2>
                      
                      <table cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td style="padding: 8px 0;">
                            <strong style="color: #6b7280; width: 120px; display: inline-block;">ID:</strong>
                            <span style="color: #1f2937;">#${ticketId.slice(0, 8)}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0;">
                            <strong style="color: #6b7280; width: 120px; display: inline-block;">Título:</strong>
                            <span style="color: #1f2937;">${ticketTitle}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0;">
                            <strong style="color: #6b7280; width: 120px; display: inline-block;">Regra:</strong>
                            <span style="color: #dc2626; font-weight: bold;">${ruleName}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0;">
                            <strong style="color: #6b7280; width: 120px; display: inline-block;">Data/Hora:</strong>
                            <span style="color: #1f2937;">${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).replace(',', ' às')}</span>
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    <div style="background-color: #fef3c7; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
                      <p style="margin: 0 0 10px 0; color: #92400e; font-weight: bold;">
                        ⚡ Ações Necessárias:
                      </p>
                      <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                        <li>Verificar e atribuir o ticket imediatamente</li>
                        <li>Avaliar a prioridade e urgência</li>
                        <li>Tomar ação apropriada conforme SLA</li>
                      </ul>
                    </div>
                    
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ithostbr.tech'}/dashboard/tickets/${ticketId}" 
                             style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            Abrir Ticket Agora →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                      Este é um email automático do sistema de escalação.
                    </p>
                    <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px; text-align: center;">
                      © ${new Date().getFullYear()} IT Host BR - Sistema de Suporte Técnico
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
🚨 ESCALAÇÃO AUTOMÁTICA DE TICKET

ATENÇÃO NECESSÁRIA: Este ticket foi escalado automaticamente.

DETALHES DO TICKET:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID: #${ticketId.slice(0, 8)}
Título: ${ticketTitle}
Motivo: ${ruleName}
Data/Hora: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}

AÇÕES NECESSÁRIAS:
• Verificar e atribuir o ticket imediatamente
• Avaliar a prioridade e urgência
• Tomar ação apropriada conforme SLA

Acesse o ticket:
${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ithostbr.tech'}/dashboard/tickets/${ticketId}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Este é um email automático do sistema de escalação.
© ${new Date().getFullYear()} IT Host BR
    `.trim()
    
    // Usar a função sendEmail do email-config.ts que já funciona
    const result = await sendEmailConfig({
      to: recipientEmails,
      subject,
      html,
      text
    })
    
    if (result.success) {
      console.log(`✅ [ESCALATION-EMAIL] Email de escalação enviado com sucesso`)
      console.log(`✅ [ESCALATION-EMAIL] MessageId: ${result.messageId}`)
      console.log(`✅ [ESCALATION-EMAIL] Aceitos: ${result.accepted}`)
      return true
    } else {
      console.error(`❌ [ESCALATION-EMAIL] Falha ao enviar email de escalação:`, result.error)
      return false
    }
    
  } catch (error) {
    console.error('❌ [ESCALATION-EMAIL] Erro ao enviar email de escalação:', error)
    return false
  }
}

// Exportar também a função original para compatibilidade
export { sendEscalationEmail as default }

// Exportar função genérica para compatibilidade
export async function sendEmail(options: any) {
  return sendEmailConfig(options)
}