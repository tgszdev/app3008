import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { executeEscalationForTicketSimple } from '@/lib/escalation-engine-simple'

// GET - Para Vercel Cron Jobs
export async function GET() {
  return await executeAutoEscalation();
}

// POST - Para chamadas manuais
export async function POST(request: NextRequest) {
  return await executeAutoEscalation();
}

async function executeAutoEscalation() {
  try {
    
    // Buscar tickets que podem precisar de escalação
    const { data: tickets, error } = await supabaseAdmin
      .from('tickets')
      .select('id, title, status, priority, created_at, updated_at, assigned_to')
      .in('status', ['aberto', 'em-progresso', 'open', 'in_progress'])
      .order('created_at', { ascending: true })
      .limit(50) // Limitar para evitar timeout

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!tickets || tickets.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Nenhum ticket encontrado para escalação',
        processed: 0
      })
    }


    let processedCount = 0
    let executedCount = 0
    const results = []

    // Processar cada ticket
    for (const ticket of tickets) {
      try {
        
        const result = await executeEscalationForTicketSimple(ticket.id)
        processedCount++
        
        if (result.success && result.executedRules.length > 0) {
          executedCount++
        }
        
        results.push({
          ticket_id: ticket.id,
          ticket_title: ticket.title,
          success: result.success,
          executed_rules: result.executedRules,
          message: result.message
        })
        
      } catch (error) {
        results.push({
          ticket_id: ticket.id,
          ticket_title: ticket.title,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }


    return NextResponse.json({
      success: true,
      message: `Execução automática concluída: ${processedCount} tickets processados, ${executedCount} escalações executadas`,
      processed: processedCount,
      executed: executedCount,
      results: results
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// Função GET removida - já existe na linha 6
