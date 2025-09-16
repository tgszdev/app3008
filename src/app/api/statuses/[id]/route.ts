import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return PATCH(request, { params })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const updateData: any = {}
    const allowed = ['name', 'slug', 'color', 'description', 'is_default', 'is_final', 'is_internal', 'order_index']
    for (const k of allowed) if (k in body) updateData[k] = body[k]

    // assegurar único default
    if (updateData.is_default === true) {
      await supabaseAdmin.from('ticket_statuses').update({ is_default: false }).eq('is_default', true)
    }

    const { data, error } = await supabaseAdmin
      .from('ticket_statuses')
      .update(updateData)
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetStatusId = searchParams.get('target_status_id')

    // checar uso em tickets
    const { data: usedCountData, error: usedErr } = await supabaseAdmin
      .from('tickets')
      .select('id, status')
    if (usedErr) return NextResponse.json({ error: usedErr.message }, { status: 500 })

    // Se ainda usamos campo textual "status", bloquear exclusão se nome bater
    const { data: statusToDelete } = await supabaseAdmin
      .from('ticket_statuses')
      .select('id, name')
      .eq('id', params.id)
      .single()

    const isUsed = (usedCountData || []).some(t => t.status === statusToDelete?.name)
    if (isUsed && !targetStatusId) {
      return NextResponse.json({ error: 'Status em uso. Forneça target_status_id para remapear.' }, { status: 400 })
    }

    if (isUsed && targetStatusId) {
      const { data: target } = await supabaseAdmin
        .from('ticket_statuses')
        .select('name')
        .eq('id', targetStatusId)
        .single()

      if (!target?.name) {
        return NextResponse.json({ error: 'target_status_id inválido' }, { status: 400 })
      }

      await supabaseAdmin.from('tickets').update({ status: target.name }).eq('status', statusToDelete?.name)
    }

    const { error } = await supabaseAdmin.from('ticket_statuses').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export const runtime = 'nodejs'


