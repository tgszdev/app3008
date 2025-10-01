import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const ticketId = params.id

    console.log('[Timeline API] Buscando timeline para ticket:', ticketId)

    // Buscar histórico do ticket com informações do status
    const { data: historyData, error: historyError } = await supabaseAdmin
      .from('ticket_history')
      .select(`
        *,
        user:users(id, name, email)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (historyError) {
      console.error('[Timeline API] Erro ao buscar histórico:', historyError)
      return NextResponse.json(
        { error: 'Erro ao buscar histórico', details: historyError.message },
        { status: 500 }
      )
    }

    console.log('[Timeline API] Histórico encontrado:', historyData?.length || 0, 'registros')

    // Buscar informações dos status separadamente
    const { data: statusesData } = await supabaseAdmin
      .from('ticket_statuses')
      .select('slug, name, color')

    const statusMap = new Map()
    if (statusesData) {
      statusesData.forEach(status => {
        statusMap.set(status.slug, status)
      })
    }

    if (!historyData || historyData.length === 0) {
      return NextResponse.json({ timeline: [], totalDuration: '' })
    }

    // Processar dados do histórico
    const processedTimeline = []
    let totalMs = 0

    for (let i = 0; i < historyData.length; i++) {
      const current = historyData[i]
      const next = historyData[i + 1]

      // Calcular duração até o próximo status
      let durationMs: number | null = null
      let durationStr: string | null = null

      if (next) {
        const currentTime = new Date(current.created_at).getTime()
        const nextTime = new Date(next.created_at).getTime()
        durationMs = nextTime - currentTime
        totalMs += durationMs

        // Converter para formato legível
        const days = Math.floor(durationMs / (1000 * 60 * 60 * 24))
        const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
        
        if (days > 0) {
          durationStr = `${days}d ${hours}h ${minutes}min`
        } else if (hours > 0) {
          durationStr = `${hours}h ${minutes}min`
        } else {
          durationStr = `${minutes}min`
        }
      }

      // Pegar cor do status usando o mapa
      const statusInfo = statusMap.get(current.new_status)
      const statusColor = statusInfo?.color || '#6b7280'
      const statusName = statusInfo?.name || current.new_status || 'Desconhecido'

      processedTimeline.push({
        status: statusName,
        statusColor: statusColor,
        user: current.user || null,
        timestamp: current.created_at,
        duration: durationStr,
        durationMs: durationMs,
        isFirst: i === 0,
        isFinal: i === historyData.length - 1
      })
    }

    // Calcular tempo total
    let totalDuration = ''
    if (totalMs > 0) {
      const totalDays = Math.floor(totalMs / (1000 * 60 * 60 * 24))
      const totalHours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const totalMinutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
      
      if (totalDays > 0) {
        totalDuration = `${totalDays}d ${totalHours}h ${totalMinutes}min`
      } else if (totalHours > 0) {
        totalDuration = `${totalHours}h ${totalMinutes}min`
      } else {
        totalDuration = `${totalMinutes}min`
      }
    }

    console.log('[Timeline API] Timeline processada com sucesso:', processedTimeline.length, 'etapas')

    return NextResponse.json({
      timeline: processedTimeline,
      totalDuration
    })
  } catch (error: any) {
    console.error('[Timeline API] Erro ao processar timeline:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error?.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

