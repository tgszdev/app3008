import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const updateData: any = {}
    const allowed = ['name', 'description', 'is_active', 'priority', 'conditions', 'actions']
    for (const k of allowed) {
      if (k in body) {
        updateData[k] = body[k]
      }
    }

    // Validar se conditions e actions são objetos válidos se fornecidos
    if (updateData.conditions && typeof updateData.conditions !== 'object') {
      return NextResponse.json({ error: 'Condições devem ser um objeto válido' }, { status: 400 })
    }
    if (updateData.actions && typeof updateData.actions !== 'object') {
      return NextResponse.json({ error: 'Ações devem ser um objeto válido' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('workflow_rules')
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

    // Verificar se a regra está sendo usada em execuções recentes (opcional)
    const { data: recentExecutions } = await supabaseAdmin
      .from('workflow_executions')
      .select('id')
      .eq('rule_id', params.id)
      .gte('executed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // últimas 24h
      .limit(1)

    if (recentExecutions && recentExecutions.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir regra com execuções recentes' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('workflow_rules')
      .delete()
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
