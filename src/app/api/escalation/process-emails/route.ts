import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email-config';

// GET - Para Vercel Cron Jobs
export async function GET() {
  return await processEmails();
}

// POST - Para chamadas manuais
export async function POST(request: NextRequest) {
  return await processEmails();
}

async function processEmails() {
  try {

    // 1. Buscar notificações de escalação pendentes
    const { data: notifications, error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('type', 'escalation_email')
      .eq('is_read', false)
      .order('created_at', { ascending: true })
      .limit(10);

    if (notificationsError) {
      return NextResponse.json({ error: notificationsError.message }, { status: 500 });
    }

    if (!notifications || notifications.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Nenhuma notificação de escalação pendente encontrada.',
        processed: 0,
        sent: 0
      });
    }


    let sentCount = 0;
    const results = [];

    for (const notification of notifications) {
      try {

        // 2. Buscar dados do usuário
        const { data: user, error: userError } = await supabaseAdmin
          .from('users')
          .select('email, name')
          .eq('id', notification.user_id)
          .single();

        if (userError || !user) {
          results.push({
            notification_id: notification.id,
            success: false,
            error: 'Usuário não encontrado',
            message: `Erro: Usuário não encontrado para notificação ${notification.id}`
          });
          continue;
        }

        if (!user.email) {
          results.push({
            notification_id: notification.id,
            success: false,
            error: 'E-mail não configurado',
            message: `Usuário ${user.name} não tem e-mail configurado`
          });
          continue;
        }

        // 3. Enviar e-mail
        const emailData = notification.data as any;
        const emailSubject = notification.title || 'Escalação de Ticket';
        const emailMessage = notification.message || 'Ticket escalado automaticamente';
        
        
        const emailResult = await sendEmail({
          to: user.email,
          subject: emailSubject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">🚨 Escalação de Ticket</h2>
              <p>Olá <strong>${user.name}</strong>,</p>
              <p>${emailMessage}</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>Detalhes do Ticket:</h3>
                <p><strong>ID:</strong> ${emailData.ticket_id || 'N/A'}</p>
                <p><strong>Título:</strong> ${emailData.ticket_title || 'N/A'}</p>
                <p><strong>Regra:</strong> ${emailData.rule_name || 'N/A'}</p>
                <p><strong>Tipo:</strong> ${emailData.escalation_type || 'N/A'}</p>
              </div>
              <p>Acesse o sistema para mais detalhes: <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ithostbr.tech'}" style="color: #3b82f6;">${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ithostbr.tech'}</a></p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #6b7280;">Este é um e-mail automático do sistema de escalação.</p>
            </div>
          `,
          text: `
            🚨 Escalação de Ticket
            
            Olá ${user.name},
            
            ${emailMessage}
            
            Detalhes do Ticket:
            - ID: ${emailData.ticket_id || 'N/A'}
            - Título: ${emailData.ticket_title || 'N/A'}
            - Regra: ${emailData.rule_name || 'N/A'}
            - Tipo: ${emailData.escalation_type || 'N/A'}
            
            Acesse o sistema: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ithostbr.tech'}
            
            Este é um e-mail automático do sistema de escalação.
          `
        });


        // O email-config.ts retorna um objeto {success: boolean, error?: string}
        const emailSuccess = emailResult && typeof emailResult === 'object' ? emailResult.success : emailResult;

        if (emailSuccess === true) {
          // 4. Marcar notificação como lida
          await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notification.id);

          sentCount++;
          
          results.push({
            notification_id: notification.id,
            user_email: user.email,
            success: true,
            message: `E-mail enviado com sucesso para ${user.email}`
          });
        } else {
          // Extrair mensagem de erro específica do objeto retornado
          const errorMsg = emailResult && typeof emailResult === 'object' && emailResult.error 
            ? emailResult.error 
            : `Falha no envio do e-mail (resultado: ${JSON.stringify(emailResult)})`;
          
          results.push({
            notification_id: notification.id,
            user_email: user.email,
            success: false,
            error: errorMsg,
            message: `Erro ao enviar e-mail: ${errorMsg}`
          });
        }

      } catch (error: any) {
        results.push({
          notification_id: notification.id,
          success: false,
          error: error.message,
          message: `Erro ao processar notificação: ${error.message}`
        });
      }
    }

    
    return NextResponse.json({
      success: true,
      message: `Processamento concluído: ${notifications.length} notificações processadas, ${sentCount} e-mails enviados`,
      processed: notifications.length,
      sent: sentCount,
      results
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor ao processar e-mails de escalação' }, { status: 500 });
  }
}
