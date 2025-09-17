import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { executeWorkflowsForTicket } from '@/lib/workflow-engine'

// Motor de execução de workflows
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { ticket_id } = body

    if (!ticket_id) {
      return NextResponse.json({ error: 'ticket_id é obrigatório' }, { status: 400 })
    }

    // Executar workflows usando a biblioteca
    const result = await executeWorkflowsForTicket(ticket_id)

    return NextResponse.json({
      ticket_id,
      executed_rules: result.executedRules,
      errors: result.errors,
      total_rules_checked: result.totalRulesChecked,
      total_executed: result.totalExecuted,
      success: result.success
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
