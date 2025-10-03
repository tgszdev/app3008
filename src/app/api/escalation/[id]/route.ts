import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'

// PATCH - Atualizar regra de escalação
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    if ((session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()

    // Validações
    if (body.time_threshold && body.time_threshold <= 0) {
      return NextResponse.json({ error: 'Limite de tempo deve ser maior que zero' }, { status: 400 })
    }

    if (body.time_condition && !['unassigned_time', 'no_response_time', 'resolution_time', 'custom_time'].includes(body.time_condition)) {
      return NextResponse.json({ error: 'Condição de tempo inválida' }, { status: 400 })
    }

    // Atualizar regra
    const { data: rule, error: updateError } = await supabaseAdmin
      .from('escalation_rules')
      .update({
        ...body,
        // updated_at gerenciado automaticamente pelo Supabase
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Erro ao atualizar regra' }, { status: 500 })
    }

    if (!rule) {
      return NextResponse.json({ error: 'Regra não encontrada' }, { status: 404 })
    }

    return NextResponse.json(rule)
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Deletar regra de escalação
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    if ((session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = params

    // Deletar regra
    const { error: deleteError } = await supabaseAdmin
      .from('escalation_rules')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: 'Erro ao deletar regra' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
