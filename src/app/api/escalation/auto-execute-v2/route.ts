import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Versão otimizada com timeout reduzido e processamento mais eficiente
export async function GET() {
  const startTime = Date.now()
  const MAX_EXECUTION_TIME = 8000 // 8 segundos máximo
  
  try {
    console.log('🔄 [ESCALATION-V2] Iniciando execução automática otimizada...')
    
    // 1. Buscar apenas tickets críticos (não atribuídos ou antigos)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    
    // Buscar tickets não atribuídos há mais de 1 hora
    const { data: unassignedTickets, error: unassignedError } = await supabaseAdmin
      .from('tickets')
      .select('id, title, created_at')
      .is('assigned_to', null)
      .in('status', ['open', 'aberto'])
      .lt('created_at', oneHourAgo)
      .limit(10) // Processar no máximo 10 por vez
    
    if (unassignedError) {
      console.error('❌ Erro ao buscar tickets não atribuídos:', unassignedError)
    }
    
    // Verificar tempo de execução
    if (Date.now() - startTime > MAX_EXECUTION_TIME) {
      return NextResponse.json({
        success: true,
        message: 'Execução parcial - timeout preventivo',
        processed: 0,
        timeout: true
      })
    }
    
    let escalatedCount = 0
    const results = []
    
    // Processar tickets não atribuídos
    if (unassignedTickets && unassignedTickets.length > 0) {
      console.log(`📋 Encontrados ${unassignedTickets.length} tickets não atribuídos`)
      
      for (const ticket of unassignedTickets) {
        // Verificar timeout a cada iteração
        if (Date.now() - startTime > MAX_EXECUTION_TIME) {
          break
        }
        
        try {
          // Verificar se já foi escalado recentemente
          const { data: recentLog } = await supabaseAdmin
            .from('escalation_logs')
            .select('id')
            .eq('ticket_id', ticket.id)
            .gte('triggered_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
            .limit(1)
          
          if (!recentLog || recentLog.length === 0) {
            // Executar ações de escalação simplificadas
            
            // 1. Aumentar prioridade
            await supabaseAdmin
              .from('tickets')
              .update({ 
                priority: 'high',
                // updated_at gerenciado automaticamente pelo Supabase
              })
              .eq('id', ticket.id)
            
            // 2. Adicionar comentário
            await supabaseAdmin
              .from('comments')
              .insert({
                ticket_id: ticket.id,
                user_id: '00000000-0000-0000-0000-000000000000', // System user
                content: '⚠️ ESCALAÇÃO AUTOMÁTICA: Ticket não atribuído há mais de 1 hora.',
                is_internal: true
              })
            
            // 3. Enviar email de notificação
            try {
              // Buscar emails dos supervisores/admins
              const { data: supervisors } = await supabaseAdmin
                .from('users')
                .select('email')
                .in('role', ['admin', 'analyst'])
                .limit(10)
              
              if (supervisors && supervisors.length > 0) {
                const emails = supervisors.map(u => u.email).filter(Boolean)
                if (emails.length > 0) {
                  // Importar e chamar função de email
                  const { sendEscalationEmail } = await import('@/lib/email-service')
                  await sendEscalationEmail(
                    ticket.id,
                    ticket.title,
                    'Ticket não atribuído (1 hora)',
                    emails
                  )
                  console.log(`📧 Email de escalação enviado para ${emails.length} destinatários`)
                }
              }
            } catch (emailError: any) {
              console.error(`⚠️ Erro ao enviar email de escalação:`, emailError.message)
            }
            
            // 4. Registrar log
            await supabaseAdmin
              .from('escalation_logs')
              .insert({
                ticket_id: ticket.id,
                rule_id: '00000000-0000-0000-0000-000000000001', // ID genérico
                escalation_type: 'unassigned_time',
                time_elapsed: Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / 60000),
                success: true,
                triggered_at: new Date().toISOString()
              })
            
            escalatedCount++
            results.push({
              ticket_id: ticket.id,
              ticket_title: ticket.title,
              escalation: '1h não atribuído'
            })
            
            console.log(`✅ Ticket ${ticket.id} escalado`)
          }
        } catch (error: any) {
          console.error(`❌ Erro ao escalar ticket ${ticket.id}:`, error.message)
        }
      }
    }
    
    const executionTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      message: `Execução concluída em ${executionTime}ms`,
      stats: {
        tickets_checked: unassignedTickets?.length || 0,
        tickets_escalated: escalatedCount,
        execution_time_ms: executionTime
      },
      results: results
    })
    
  } catch (error: any) {
    console.error('❌ [ESCALATION-V2] Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro na execução',
      details: error.message,
      execution_time_ms: Date.now() - startTime
    }, { status: 500 })
  }
}