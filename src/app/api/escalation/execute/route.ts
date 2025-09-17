import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { executeEscalationForTicket, executeAllEscalations } from '@/lib/escalation-engine'

// POST - Executar escalação para um ticket específico
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { ticket_id, force_execution = false } = body

    if (!ticket_id) {
      return NextResponse.json({ error: 'ticket_id é obrigatório' }, { status: 400 })
    }

    // Executar escalação para o ticket
    const result = await executeEscalationForTicket(ticket_id, force_execution)

    return NextResponse.json({
      ticket_id,
      executed_rules: result.executedRules,
      errors: result.errors,
      total_rules_checked: result.totalRulesChecked,
      total_executed: result.totalExecuted,
      success: result.success
    })
  } catch (error: any) {
    console.error('Erro ao executar escalação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Executar escalação para todos os tickets
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    if ((session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      limit = 100, 
      status_filter = ['open', 'in_progress'], 
      force_execution = false 
    } = body

    // Executar escalação para todos os tickets
    const result = await executeAllEscalations(limit, status_filter, force_execution)

    return NextResponse.json({
      total_tickets_processed: result.totalTicketsProcessed,
      total_rules_executed: result.totalRulesExecuted,
      total_errors: result.totalErrors,
      execution_time_ms: result.executionTimeMs,
      success: result.success,
      details: result.details
    })
  } catch (error: any) {
    console.error('Erro ao executar escalação em massa:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
