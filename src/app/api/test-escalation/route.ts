import { NextRequest, NextResponse } from 'next/server'
import { executeEscalationForTicketSimple } from '@/lib/escalation-engine-simple'

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json()
    const { ticket_id } = body

    if (!ticket_id) {
      return NextResponse.json({ error: 'ticket_id é obrigatório' }, { status: 400 })
    }


    // Executar escalação
    const result = await executeEscalationForTicketSimple(ticket_id)


    return NextResponse.json({
      success: true,
      ticket_id,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
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
