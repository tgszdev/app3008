import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@/lib/supabase/server'
import { calculateTargetDate } from '@/lib/sla-utils'

// GET - Obter SLA de um ticket específico
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabase = await createClient()
    
    // Buscar ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, priority, category_id, created_at, status')
      .eq('id', params.id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 })
    }

    // Buscar configuração de SLA aplicável
    const { data: slaConfig } = await supabase
      .from('sla_configurations')
      .select('*')
      .eq('priority', ticket.priority)
      .eq('is_active', true)
      .or(`category_id.eq.${ticket.category_id},category_id.is.null`)
      .order('category_id', { ascending: false }) // Prioriza configurações específicas da categoria
      .limit(1)
      .single()

    if (!slaConfig) {
      return NextResponse.json({ 
        message: 'Nenhuma configuração de SLA encontrada para este ticket',
        ticket_id: ticket.id,
        priority: ticket.priority,
        category_id: ticket.category_id
      }, { status: 200 })
    }

    // Buscar ou criar registro de SLA do ticket
    let { data: ticketSLA } = await supabase
      .from('ticket_sla')
      .select('*')
      .eq('ticket_id', params.id)
      .single()

    if (!ticketSLA) {
      // Criar registro de SLA se não existir
      const createdAt = new Date(ticket.created_at)
      const firstResponseTarget = calculateTargetDate(
        createdAt,
        slaConfig.first_response_time,
        slaConfig
      )
      const resolutionTarget = calculateTargetDate(
        createdAt,
        slaConfig.resolution_time,
        slaConfig
      )

      const { data: newSLA, error: createError } = await supabase
        .from('ticket_sla')
        .insert({
          ticket_id: params.id,
          sla_configuration_id: slaConfig.id,
          first_response_target: firstResponseTarget.toISOString(),
          resolution_target: resolutionTarget.toISOString(),
          first_response_status: 'pending',
          resolution_status: 'pending'
        })
        .select()
        .single()

      if (createError) {
        console.error('Erro ao criar registro de SLA:', createError)
        return NextResponse.json({ error: 'Erro ao criar registro de SLA' }, { status: 500 })
      }

      ticketSLA = newSLA
    }

    return NextResponse.json({
      configuration: slaConfig,
      tracking: ticketSLA
    })
  } catch (error) {
    console.error('Erro no GET /api/sla/ticket/[id]:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Atualizar status de SLA (primeira resposta, resolução, etc)
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { action, timestamp } = body

    const supabase = await createClient()
    
    // Buscar registro de SLA do ticket
    const { data: ticketSLA, error: slaError } = await supabase
      .from('ticket_sla')
      .select('*')
      .eq('ticket_id', params.id)
      .single()

    if (slaError || !ticketSLA) {
      return NextResponse.json({ error: 'Registro de SLA não encontrado' }, { status: 404 })
    }

    let updateData: any = {}

    switch (action) {
      case 'first_response':
        if (!ticketSLA.first_response_at) {
          updateData.first_response_at = timestamp || new Date().toISOString()
          updateData.first_response_status = 
            new Date(updateData.first_response_at) <= new Date(ticketSLA.first_response_target)
              ? 'met'
              : 'breached'
        }
        break
        
      case 'resolved':
        updateData.resolved_at = timestamp || new Date().toISOString()
        updateData.resolution_status = 
          new Date(updateData.resolved_at) <= new Date(ticketSLA.resolution_target)
            ? 'met'
            : 'breached'
        break
        
      case 'pause':
        updateData.paused_at = timestamp || new Date().toISOString()
        break
        
      case 'resume':
        if (ticketSLA.paused_at) {
          const pausedAt = new Date(ticketSLA.paused_at)
          const resumedAt = new Date(timestamp || new Date())
          const pausedMinutes = Math.floor((resumedAt.getTime() - pausedAt.getTime()) / 60000)
          
          updateData.paused_at = null
          updateData.total_paused_time = (ticketSLA.total_paused_time || 0) + pausedMinutes
          
          // Criar registro no histórico de pausas
          await supabase
            .from('sla_pause_history')
            .insert({
              ticket_sla_id: ticketSLA.id,
              paused_at: ticketSLA.paused_at,
              resumed_at: resumedAt.toISOString(),
              duration_minutes: pausedMinutes,
              paused_by: session.user.id
            })
        }
        break
        
      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }

    // Atualizar registro de SLA
    const { data, error } = await supabase
      .from('ticket_sla')
      .update(updateData)
      .eq('id', ticketSLA.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar SLA:', error)
      return NextResponse.json({ error: 'Erro ao atualizar SLA' }, { status: 500 })
    }

    // Se houve violação, criar registro na tabela de breaches
    if (
      (action === 'first_response' && updateData.first_response_status === 'breached') ||
      (action === 'resolved' && updateData.resolution_status === 'breached')
    ) {
      await supabase
        .from('sla_breaches')
        .insert({
          ticket_id: params.id,
          sla_configuration_id: ticketSLA.sla_configuration_id,
          breach_type: action === 'first_response' ? 'first_response' : 'resolution',
          target_time: action === 'first_response' 
            ? ticketSLA.first_response_target 
            : ticketSLA.resolution_target,
          actual_time: updateData.first_response_at || updateData.resolved_at,
          breach_minutes: Math.floor(
            (new Date(updateData.first_response_at || updateData.resolved_at).getTime() - 
             new Date(action === 'first_response' 
               ? ticketSLA.first_response_target 
               : ticketSLA.resolution_target
             ).getTime()) / 60000
          )
        })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro no POST /api/sla/ticket/[id]:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}