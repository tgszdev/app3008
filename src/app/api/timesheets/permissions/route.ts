import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: userInfo } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userInfo?.role !== 'admin') {
      // Usuários não-admin só podem ver suas próprias permissões
      const { data, error } = await supabase
        .from('timesheet_permissions')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching permissions:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data || { can_submit: true, can_approve: false })
    }

    // Admin pode ver todas as permissões
    const { data, error } = await supabase
      .from('timesheet_permissions')
      .select(`
        *,
        user:users!timesheet_permissions_user_id_fkey(id, name, email, role)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all permissions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: userInfo } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userInfo?.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Only administrators can manage permissions' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { user_id, can_submit, can_approve } = body

    if (!user_id) {
      return NextResponse.json({ 
        error: 'Missing required field: user_id' 
      }, { status: 400 })
    }

    // Upsert permissão (insert ou update)
    const { data, error } = await supabase
      .from('timesheet_permissions')
      .upsert({
        user_id,
        can_submit: can_submit ?? true,
        can_approve: can_approve ?? false
      })
      .select(`
        *,
        user:users!timesheet_permissions_user_id_fkey(id, name, email, role)
      `)
      .single()

    if (error) {
      console.error('Error upserting permission:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: userInfo } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userInfo?.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Only administrators can manage permissions' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { permissions } = body // Array de permissões para atualizar em lote

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json({ 
        error: 'Missing or invalid permissions array' 
      }, { status: 400 })
    }

    // Processar atualizações em lote
    const results = []
    for (const perm of permissions) {
      const { data, error } = await supabase
        .from('timesheet_permissions')
        .upsert({
          user_id: perm.user_id,
          can_submit: perm.can_submit ?? true,
          can_approve: perm.can_approve ?? false
        })
        .select(`
          *,
          user:users!timesheet_permissions_user_id_fkey(id, name, email, role)
        `)
        .single()

      if (error) {
        console.error('Error updating permission for user', perm.user_id, error)
        results.push({ user_id: perm.user_id, error: error.message })
      } else {
        results.push(data)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}