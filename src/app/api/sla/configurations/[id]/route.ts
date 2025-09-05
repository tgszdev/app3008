import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@/lib/supabase/server'

// PUT - Atualizar configuração de SLA
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem atualizar configurações de SLA' }, { status: 403 })
    }

    const body = await request.json()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('sla_configurations')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar configuração SLA:', error)
      return NextResponse.json({ error: 'Erro ao atualizar configuração' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro no PUT /api/sla/configurations/[id]:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Desativar configuração de SLA
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem deletar configurações de SLA' }, { status: 403 })
    }

    const supabase = await createClient()

    // Soft delete - apenas desativa
    const { data, error } = await supabase
      .from('sla_configurations')
      .update({ is_active: false })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao desativar configuração SLA:', error)
      return NextResponse.json({ error: 'Erro ao desativar configuração' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Configuração desativada com sucesso', data })
  } catch (error) {
    console.error('Erro no DELETE /api/sla/configurations/[id]:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}