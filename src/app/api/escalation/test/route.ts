import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Endpoint de teste simples para verificar se a escalação está funcionando
export async function GET() {
  try {
    console.log('🔍 [TEST-ESCALATION] Iniciando teste de escalação...')
    
    // 1. Verificar conexão com Supabase
    const { data: testConnection, error: connError } = await supabaseAdmin
      .from('escalation_rules')
      .select('id, name, is_active')
      .eq('is_active', true)
      .limit(1)
    
    if (connError) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao conectar com banco de dados',
        details: connError.message
      }, { status: 500 })
    }
    
    // 2. Buscar regras ativas
    const { data: rules, error: rulesError } = await supabaseAdmin
      .from('escalation_rules')
      .select('id, name, time_threshold, time_unit, time_condition')
      .eq('is_active', true)
      .order('priority')
    
    if (rulesError) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar regras',
        details: rulesError.message
      }, { status: 500 })
    }
    
    // 3. Buscar tickets candidatos (limitado para teste)
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select('id, title, status, created_at, assigned_to')
      .in('status', ['open', 'aberto'])
      .limit(5)
    
    if (ticketsError) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar tickets',
        details: ticketsError.message
      }, { status: 500 })
    }
    
    // 4. Analisar tickets candidatos
    const candidates = []
    const now = new Date()
    
    for (const ticket of tickets || []) {
      const createdAt = new Date(ticket.created_at)
      const minutesSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / 60000)
      
      // Verificar regra de 1 hora (60 minutos) para tickets não atribuídos
      if (!ticket.assigned_to && minutesSinceCreation >= 60) {
        candidates.push({
          ticket_id: ticket.id,
          ticket_title: ticket.title,
          minutes_since_creation: minutesSinceCreation,
          should_escalate: '1 hora - Não atribuído',
          assigned_to: ticket.assigned_to
        })
      }
      // Verificar regra de 4 horas (240 minutos)
      else if (minutesSinceCreation >= 240) {
        candidates.push({
          ticket_id: ticket.id,
          ticket_title: ticket.title,
          minutes_since_creation: minutesSinceCreation,
          should_escalate: '4 horas - Sem resposta',
          assigned_to: ticket.assigned_to
        })
      }
    }
    
    // 5. Retornar resultado do teste
    return NextResponse.json({
      success: true,
      message: 'Teste de escalação concluído',
      stats: {
        rules_active: rules?.length || 0,
        tickets_checked: tickets?.length || 0,
        candidates_found: candidates.length
      },
      rules: rules?.map(r => ({
        name: r.name,
        threshold: `${r.time_threshold} ${r.time_unit}`,
        condition: r.time_condition
      })),
      candidates: candidates,
      server_time: now.toISOString(),
      brazil_time: now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    })
    
  } catch (error: any) {
    console.error('❌ [TEST-ESCALATION] Erro:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno',
      details: error.message
    }, { status: 500 })
  }
}