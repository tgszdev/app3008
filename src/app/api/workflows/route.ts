import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('workflow_rules')
      .select('*')
      .order('priority', { ascending: true })

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
    const { name, description, is_active, priority, conditions, actions } = body

    if (!name || !conditions || !actions) {
      return NextResponse.json({ error: 'Nome, condições e ações são obrigatórios' }, { status: 400 })
    }

    // Validar se conditions e actions são objetos válidos
    if (typeof conditions !== 'object' || typeof actions !== 'object') {
      return NextResponse.json({ error: 'Condições e ações devem ser objetos válidos' }, { status: 400 })
    }

    // pegar maior priority atual se não especificado
    let finalPriority = priority
    if (typeof finalPriority !== 'number') {
      const { data: maxPriority } = await supabaseAdmin
        .from('workflow_rules')
        .select('priority')
        .order('priority', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      finalPriority = (maxPriority?.priority || 0) + 1
    }

    const { data, error } = await supabaseAdmin
      .from('workflow_rules')
      .insert({
        name,
        description: description || null,
        is_active: !!is_active,
        priority: finalPriority,
        conditions,
        actions,
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
