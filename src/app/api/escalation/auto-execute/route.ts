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
    console.log('🔄 [AUTO-ESCALATION] Iniciando execução automática de escalação...')
    
    // Buscar tickets que podem precisar de escalação
    const { data: tickets, error } = await supabaseAdmin
      .from('tickets')
      .select('id, title, status, priority, created_at, updated_at, assigned_to')
      .in('status', ['aberto', 'em-progresso'])
      .is('assigned_to', null) // Apenas tickets não atribuídos para algumas regras
      .order('created_at', { ascending: true })
      .limit(50) // Limitar para evitar timeout

    if (error) {
      console.error('❌ [AUTO-ESCALATION] Erro ao buscar tickets:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!tickets || tickets.length === 0) {
      console.log('ℹ️ [AUTO-ESCALATION] Nenhum ticket encontrado para escalação')
      return NextResponse.json({ 
        success: true, 
        message: 'Nenhum ticket encontrado para escalação',
        processed: 0
      })
    }

    console.log(`📋 [AUTO-ESCALATION] Encontrados ${tickets.length} tickets para verificar`)

    let processedCount = 0
    let executedCount = 0
    const results = []

    // Processar cada ticket
    for (const ticket of tickets) {
      try {
        console.log(`🔍 [AUTO-ESCALATION] Verificando ticket: ${ticket.title} (${ticket.id})`)
        
        const result = await executeEscalationForTicketSimple(ticket.id)
        processedCount++
        
        if (result.success && result.executedRules.length > 0) {
          executedCount++
          console.log(`✅ [AUTO-ESCALATION] Escalação executada para ticket ${ticket.id}: ${result.executedRules.join(', ')}`)
        }
        
        results.push({
          ticket_id: ticket.id,
          ticket_title: ticket.title,
          success: result.success,
          executed_rules: result.executedRules,
          message: result.message
        })
        
      } catch (error) {
        console.error(`❌ [AUTO-ESCALATION] Erro ao processar ticket ${ticket.id}:`, error)
        results.push({
          ticket_id: ticket.id,
          ticket_title: ticket.title,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    console.log(`🎯 [AUTO-ESCALATION] Execução concluída: ${processedCount} tickets processados, ${executedCount} escalações executadas`)

    return NextResponse.json({
      success: true,
      message: `Execução automática concluída: ${processedCount} tickets processados, ${executedCount} escalações executadas`,
      processed: processedCount,
      executed: executedCount,
      results: results
    })

  } catch (error: any) {
    console.error('❌ [AUTO-ESCALATION] Erro na execução automática:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// Função GET removida - já existe na linha 6
