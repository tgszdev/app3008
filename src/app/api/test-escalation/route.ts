import { NextRequest, NextResponse } from 'next/server'
import { executeEscalationForTicketSimple } from '@/lib/escalation-engine-simple'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [TEST-ESCALATION] Iniciando teste de escalação...')
    
    const body = await request.json()
    const { ticket_id } = body

    if (!ticket_id) {
      return NextResponse.json({ error: 'ticket_id é obrigatório' }, { status: 400 })
    }

    console.log(`🧪 [TEST-ESCALATION] Testando escalação para ticket: ${ticket_id}`)

    // Executar escalação
    const result = await executeEscalationForTicketSimple(ticket_id)

    console.log(`🧪 [TEST-ESCALATION] Resultado:`, result)

    return NextResponse.json({
      success: true,
      ticket_id,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('🧪 [TEST-ESCALATION] Erro:', error.message)
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'API de teste de escalação',
    usage: 'POST com { "ticket_id": "uuid" }',
    timestamp: new Date().toISOString()
  })
}
