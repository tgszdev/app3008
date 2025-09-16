import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('ticket_statuses')
      .select('*')
      .order('order_index', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, color, description, is_default, is_final, is_internal } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Nome e slug são obrigatórios' }, { status: 400 })
    }

    // pegar maior order_index atual
    const { data: maxOrder } = await supabaseAdmin
      .from('ticket_statuses')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextOrder = (maxOrder?.order_index || 0) + 1

    // assegurar único default
    if (is_default) {
      await supabaseAdmin.from('ticket_statuses').update({ is_default: false }).eq('is_default', true)
    }

    const { data, error } = await supabaseAdmin
      .from('ticket_statuses')
      .insert({
        name,
        slug,
        color: color || null,
        description: description || null,
        is_default: !!is_default,
        is_final: !!is_final,
        is_internal: !!is_internal,
        order_index: nextOrder,
      })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export const runtime = 'nodejs'


