import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'

// GET - Listar regras de escalação
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: rules, error } = await supabaseAdmin
      .from('escalation_rules')
      .select(`
        *,
        created_by_user:users!escalation_rules_created_by_fkey(id, name, email)
      `)
      .order('priority', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar regras' }, { status: 500 })
    }

    return NextResponse.json(rules || [])
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar nova regra de escalação
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    if ((session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      conditions,
      actions,
      time_condition,
      time_threshold,
      time_unit = 'minutes',
      business_hours_only = true,
      business_hours_start = '08:00:00',
      business_hours_end = '18:00:00',
      working_days = [1, 2, 3, 4, 5],
      repeat_escalation = false,
      repeat_interval = 60,
      max_repeats = 3,
      priority = 1
    } = body

    // Validações
    if (!name || !time_condition || !time_threshold) {
      return NextResponse.json({ error: 'Nome, condição de tempo e limite são obrigatórios' }, { status: 400 })
    }

    if (time_threshold <= 0) {
      return NextResponse.json({ error: 'Limite de tempo deve ser maior que zero' }, { status: 400 })
    }

    if (!['unassigned_time', 'no_response_time', 'resolution_time', 'custom_time'].includes(time_condition)) {
      return NextResponse.json({ error: 'Condição de tempo inválida' }, { status: 400 })
    }

    // Criar regra
    const { data: rule, error: createError } = await supabaseAdmin
      .from('escalation_rules')
      .insert({
        name,
        description,
        conditions: conditions || {},
        actions: actions || {},
        time_condition,
        time_threshold,
        time_unit,
        business_hours_only,
        business_hours_start,
        business_hours_end,
        working_days,
        repeat_escalation,
        repeat_interval,
        max_repeats,
        priority,
        created_by: (session.user as any)?.id
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json({ error: 'Erro ao criar regra' }, { status: 500 })
    }

    return NextResponse.json(rule, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
