import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/server'

type RouteParams = {
  params: Promise<{ id: string }>
}

// PUT - Atualizar configuração de SLA
export async function PUT(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const session = await auth()
    const userRole = (session?.user as any)?.role
    if (!session || userRole !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem atualizar configurações de SLA' }, { status: 403 })
    }

    const params = await context.params
    const body = await request.json()

    const { data, error } = await supabaseAdmin
      .from('sla_configurations')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar configuração' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Desativar configuração de SLA
export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const session = await auth()
    const userRole = (session?.user as any)?.role
    if (!session || userRole !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem deletar configurações de SLA' }, { status: 403 })
    }

    const params = await context.params

    // Soft delete - apenas desativa
    const { data, error } = await supabaseAdmin
      .from('sla_configurations')
      .update({ is_active: false })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erro ao desativar configuração' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Configuração desativada com sucesso', data })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}