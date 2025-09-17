import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    console.log('📧 [EMAIL-PROCESSOR] Iniciando processamento de e-mails de escalação...');

    // 1. Buscar notificações de escalação pendentes
    const { data: notifications, error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('type', 'escalation_email')
      .eq('is_read', false)
      .order('created_at', { ascending: true })
      .limit(10);

    if (notificationsError) {
      console.error('Erro ao buscar notificações de escalação:', notificationsError);
      return NextResponse.json({ error: notificationsError.message }, { status: 500 });
    }

    if (!notifications || notifications.length === 0) {
      console.log('✅ [EMAIL-PROCESSOR] Nenhuma notificação de escalação pendente encontrada.');
      return NextResponse.json({ 
        success: true, 
        message: 'Nenhuma notificação de escalação pendente encontrada.',
        processed: 0,
        sent: 0
      });
    }

    console.log(`📧 [EMAIL-PROCESSOR] Encontradas ${notifications.length} notificações para processar.`);

    let sentCount = 0;
    const results = [];

    for (const notification of notifications) {
      try {
        console.log(`📧 [EMAIL-PROCESSOR] Processando notificação ${notification.id}...`);

        // 2. Buscar dados do usuário
        const { data: user, error: userError } = await supabaseAdmin
          .from('users')
          .select('email, name')
          .eq('id', notification.user_id)
          .single();

        if (userError || !user) {
          console.error(`❌ [EMAIL-PROCESSOR] Usuário não encontrado para notificação ${notification.id}:`, userError);
          results.push({
            notification_id: notification.id,
            success: false,
            error: 'Usuário não encontrado',
            message: `Erro: Usuário não encontrado para notificação ${notification.id}`
          });
          continue;
        }

        if (!user.email) {
          console.error(`❌ [EMAIL-PROCESSOR] Usuário ${user.name} não tem e-mail configurado.`);
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
        const emailResult = await sendEmail({
          to: user.email,
          subject: notification.title,
          template: 'escalation',
          data: {
            userName: user.name,
            ticketId: emailData.ticket_id,
            ticketTitle: emailData.ticket_title,
            ruleName: emailData.rule_name,
            escalationType: emailData.escalation_type,
            message: notification.message,
            appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://www.ithostbr.tech'
          }
        });

        if (emailResult.success) {
          // 4. Marcar notificação como lida
          await supabaseAdmin
            .from('notifications')
            .update({ is_read: true, updated_at: new Date().toISOString() })
            .eq('id', notification.id);

          sentCount++;
          console.log(`✅ [EMAIL-PROCESSOR] E-mail enviado com sucesso para ${user.email}`);
          
          results.push({
            notification_id: notification.id,
            user_email: user.email,
            success: true,
            message: `E-mail enviado com sucesso para ${user.email}`
          });
        } else {
          console.error(`❌ [EMAIL-PROCESSOR] Erro ao enviar e-mail para ${user.email}:`, emailResult.error);
          results.push({
            notification_id: notification.id,
            user_email: user.email,
            success: false,
            error: emailResult.error,
            message: `Erro ao enviar e-mail: ${emailResult.error}`
          });
        }

      } catch (error: any) {
        console.error(`❌ [EMAIL-PROCESSOR] Erro ao processar notificação ${notification.id}:`, error);
        results.push({
          notification_id: notification.id,
          success: false,
          error: error.message,
          message: `Erro ao processar notificação: ${error.message}`
        });
      }
    }

    console.log(`✅ [EMAIL-PROCESSOR] Processamento concluído: ${notifications.length} notificações processadas, ${sentCount} e-mails enviados.`);
    
    return NextResponse.json({
      success: true,
      message: `Processamento concluído: ${notifications.length} notificações processadas, ${sentCount} e-mails enviados`,
      processed: notifications.length,
      sent: sentCount,
      results
    });

  } catch (error: any) {
    console.error('Erro no processador de e-mails de escalação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao processar e-mails de escalação' }, { status: 500 });
  }
}
