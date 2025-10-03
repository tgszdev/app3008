import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é usuário da matriz
    const userType = (session.user as any).userType
    if (userType !== 'matrix') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const contextId = searchParams.get('context_id')
    const excludeAssociated = searchParams.get('exclude_associated') === 'true'

    let query = supabaseAdmin
      .from('users')
      .select(`
        id,
        name,
        email,
        user_type,
        is_active,
        created_at
      `)
      .eq('is_active', true)
      .order('name', { ascending: true })

    // Se exclude_associated for true, excluir usuários já associados ao contexto
    if (excludeAssociated && contextId) {
      const { data: associatedUsers } = await supabaseAdmin
        .from('user_contexts')
        .select('user_id')
        .eq('context_id', contextId)

      if (associatedUsers && associatedUsers.length > 0) {
        const associatedUserIds = associatedUsers.map(uc => uc.user_id)
        query = query.not('id', 'in', `(${associatedUserIds.join(',')})`)
      }
    }

    const { data: users, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json({
      users: users || []
    })

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
