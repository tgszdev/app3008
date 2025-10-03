import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

// GET - Obter permissões do usuário atual
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar informações do usuário
    const { data: userInfo } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    // Buscar permissões específicas se existirem
    const { data: permission } = await supabaseAdmin
      .from('timesheet_permissions')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    // Se não houver permissões específicas, usar padrões baseados no cargo
    if (!permission) {
      const defaultPermissions = {
        can_submit: true,
        can_approve: userInfo?.role === 'admin'
      }
      return NextResponse.json(defaultPermissions)
    }

    return NextResponse.json({
      can_submit: permission.can_submit,
      can_approve: permission.can_approve || userInfo?.role === 'admin'
    })
  } catch (error) {
    // Retornar permissões padrão em caso de erro
    return NextResponse.json({
      can_submit: true,
      can_approve: false
    })
  }
}

// POST - Atualizar permissões (apenas admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: userInfo } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userInfo?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Only admins can manage permissions.' }, { status: 403 })
    }

    const body = await request.json()
    const { user_id, can_submit, can_approve } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    // Verificar se já existe permissão para este usuário
    const { data: existing } = await supabaseAdmin
      .from('timesheet_permissions')
      .select('*')
      .eq('user_id', user_id)
      .single()

    let result
    if (existing) {
      // Atualizar permissão existente
      const { data, error } = await supabaseAdmin
        .from('timesheet_permissions')
        .update({
          can_submit: can_submit ?? existing.can_submit,
          can_approve: can_approve ?? existing.can_approve,
          // updated_at gerenciado automaticamente pelo Supabase
        })
        .eq('user_id', user_id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Criar nova permissão
      const { data, error } = await supabaseAdmin
        .from('timesheet_permissions')
        .insert({
          user_id,
          can_submit: can_submit ?? true,
          can_approve: can_approve ?? false
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}