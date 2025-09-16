import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const items = Array.isArray(body) ? body : body?.items
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    // Atualizar em lote
    for (const it of items) {
      if (!it?.id || typeof it?.order_index !== 'number') continue
      await supabaseAdmin
        .from('ticket_statuses')
        .update({ order_index: it.order_index })
        .eq('id', it.id)
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export const runtime = 'nodejs'


