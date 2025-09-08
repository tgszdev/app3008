import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

// GET - Obter todas as permissões (apenas admin)
export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: 'Forbidden. Only admins can view all permissions.' }, { status: 403 })
    }

    // Buscar todas as permissões
    const { data: permissions, error } = await supabaseAdmin
      .from('timesheet_permissions')
      .select(`
        *,
        user:users!timesheet_permissions_user_id_fkey(id, name, email, role, department)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching permissions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(permissions || [])
  } catch (error) {
    console.error('Error fetching all permissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}