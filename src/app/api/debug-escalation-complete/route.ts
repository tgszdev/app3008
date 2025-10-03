import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    }

    // 1. Verificar jobs pg_cron ativos
    try {
      const { data: jobs, error: jobsError } = await supabaseAdmin
        .from('cron.job')
        .select('*')
      
      results.tests.pgcron_jobs = {
        success: !jobsError,
        data: jobs || [],
        error: jobsError?.message
      }
    } catch (error: any) {
      results.tests.pgcron_jobs = {
        success: false,
        error: error.message
      }
    }

    // 2. Verificar execuções dos jobs
    try {
      const { data: jobRuns, error: jobRunsError } = await supabaseAdmin
        .from('cron.job_run_details')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(10)
      
      results.tests.job_executions = {
        success: !jobRunsError,
        data: jobRuns || [],
        error: jobRunsError?.message
      }
    } catch (error: any) {
      results.tests.job_executions = {
        success: false,
        error: error.message
      }
    }

    // 3. Verificar regras de escalação ativas
    try {
      const { data: rules, error: rulesError } = await supabaseAdmin
        .from('escalation_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true })
      
      results.tests.escalation_rules = {
        success: !rulesError,
        data: rules || [],
        error: rulesError?.message
      }
    } catch (error: any) {
      results.tests.escalation_rules = {
        success: false,
        error: error.message
      }
    }

    // 4. Verificar tickets elegíveis para escalação
    try {
      const { data: tickets, error: ticketsError } = await supabaseAdmin
        .from('tickets')
        .select('id, title, status, priority, assigned_to, created_at')
        .in('status', ['aberto', 'em-progresso', 'open', 'in_progress'])
        .eq('priority', 'critical')
        .is('assigned_to', null)
        .order('created_at', { ascending: true })
        .limit(10)
      
      // Adicionar tempo decorrido
      const ticketsWithTime = tickets?.map(ticket => ({
        ...ticket,
        minutes_ago: Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / (1000 * 60))
      })) || []
      
      results.tests.eligible_tickets = {
        success: !ticketsError,
        data: ticketsWithTime,
        error: ticketsError?.message
      }
    } catch (error: any) {
      results.tests.eligible_tickets = {
        success: false,
        error: error.message
      }
    }

    // 5. Verificar logs de escalação recentes
    try {
      const { data: logs, error: logsError } = await supabaseAdmin
        .from('escalation_logs')
        .select(`
          id,
          rule_id,
          ticket_id,
          escalation_type,
          success,
          triggered_at,
          escalation_rules!inner(name),
          tickets!inner(title)
        `)
        .order('triggered_at', { ascending: false })
        .limit(10)
      
      results.tests.escalation_logs = {
        success: !logsError,
        data: logs || [],
        error: logsError?.message
      }
    } catch (error: any) {
      results.tests.escalation_logs = {
        success: false,
        error: error.message
      }
    }

    // 6. Verificar notificações de e-mail
    try {
      const { data: notifications, error: notificationsError } = await supabaseAdmin
        .from('notifications')
        .select(`
          id,
          type,
          title,
          message,
          is_read,
          created_at,
          users!inner(email, name)
        `)
        .eq('type', 'escalation_email')
        .order('created_at', { ascending: false })
        .limit(10)
      
      results.tests.email_notifications = {
        success: !notificationsError,
        data: notifications || [],
        error: notificationsError?.message
      }
    } catch (error: any) {
      results.tests.email_notifications = {
        success: false,
        error: error.message
      }
    }

    // 7. Verificar comentários de escalação
    try {
      const { data: comments, error: commentsError } = await supabaseAdmin
        .from('comments')
        .select(`
          id,
          ticket_id,
          content,
          is_internal,
          created_at,
          tickets!inner(title)
        `)
        .eq('is_internal', true)
        .order('created_at', { ascending: false })
        .limit(10)
      
      results.tests.escalation_comments = {
        success: !commentsError,
        data: comments || [],
        error: commentsError?.message
      }
    } catch (error: any) {
      results.tests.escalation_comments = {
        success: false,
        error: error.message
      }
    }

    // 8. Verificar configuração de e-mail
    try {
      const { data: emailConfig, error: emailConfigError } = await supabaseAdmin
        .from('system_settings')
        .select('*')
        .eq('key', 'email_config')
        .single()
      
      results.tests.email_config = {
        success: !emailConfigError,
        data: emailConfig || null,
        error: emailConfigError?.message
      }
    } catch (error: any) {
      results.tests.email_config = {
        success: false,
        error: error.message
      }
    }

    // 9. Executar teste de escalação manual
    try {
      const escalationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ithostbr.tech'}/api/escalation/auto-execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Debug-Escalation-API/1.0'
        }
      })
      
      const escalationResult = await escalationResponse.json()
      
      results.tests.manual_escalation = {
        success: escalationResponse.ok,
        data: escalationResult,
        error: escalationResponse.ok ? null : escalationResult.error
      }
    } catch (error: any) {
      results.tests.manual_escalation = {
        success: false,
        error: error.message
      }
    }

    // 10. Executar teste de processamento de e-mails
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ithostbr.tech'}/api/escalation/process-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Debug-Escalation-API/1.0'
        }
      })
      
      const emailResult = await emailResponse.json()
      
      results.tests.manual_email_processing = {
        success: emailResponse.ok,
        data: emailResult,
        error: emailResponse.ok ? null : emailResult.error
      }
    } catch (error: any) {
      results.tests.manual_email_processing = {
        success: false,
        error: error.message
      }
    }

    // Calcular resumo
    const totalTests = Object.keys(results.tests).length
    const successfulTests = Object.values(results.tests).filter((test: any) => test.success).length
    const failedTests = totalTests - successfulTests

    results.summary = {
      total_tests: totalTests,
      successful_tests: successfulTests,
      failed_tests: failedTests,
      success_rate: `${Math.round((successfulTests / totalTests) * 100)}%`
    }


    return NextResponse.json({
      success: true,
      message: 'Debug completo do sistema de escalação executado',
      results
    })

  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ticket_id } = body


    let result: any = {}

    switch (action) {
      case 'test_escalation':
        // Testar escalação em ticket específico
        if (!ticket_id) {
          return NextResponse.json({ error: 'ticket_id é obrigatório' }, { status: 400 })
        }
        
        const escalationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ithostbr.tech'}/api/test-escalation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Debug-Escalation-API/1.0'
          },
          body: JSON.stringify({ ticket_id })
        })
        
        result = await escalationResponse.json()
        break

      case 'test_auto_escalation':
        // Testar escalação automática
        const autoEscalationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ithostbr.tech'}/api/escalation/auto-execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Debug-Escalation-API/1.0'
          }
        })
        
        result = await autoEscalationResponse.json()
        break

      case 'test_email_processing':
        // Testar processamento de e-mails
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ithostbr.tech'}/api/escalation/process-emails`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Debug-Escalation-API/1.0'
          }
        })
        
        result = await emailResponse.json()
        break

      default:
        return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      action,
      result
    })

  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}
