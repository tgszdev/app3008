import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é usuário da matriz
    const userType = (session.user as any).userType
    if (userType !== 'matrix') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Buscar organizações que o usuário tem acesso
    const userId = session.user.id
    
    // Primeiro, buscar contextos do usuário
    const { data: userContexts, error: userContextsError } = await supabaseAdmin
      .from('user_contexts')
      .select('context_id')
      .eq('user_id', userId)
    
    if (userContextsError) {
      console.error('Erro ao buscar contextos do usuário:', userContextsError)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
    
    if (!userContexts || userContexts.length === 0) {
      return NextResponse.json({ organizations: [] })
    }
    
    // Buscar organizações com contagem de usuários
    const contextIds = userContexts.map(uc => uc.context_id)
    const { data: organizations, error } = await supabaseAdmin
      .from('contexts')
      .select(`
        *,
        user_contexts(count)
      `)
      .in('id', contextIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar organizações:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    // Processar dados
    const processedOrganizations = organizations.map(org => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      type: org.type,
      description: org.description || null,
      settings: org.settings,
      sla_hours: org.sla_hours,
      is_active: org.is_active,
      created_at: org.created_at,
      updated_at: org.updated_at,
      user_count: org.user_contexts?.[0]?.count || 0
    }))

    return NextResponse.json({
      organizations: processedOrganizations
    })

  } catch (error) {
    console.error('Erro na API de organizações do usuário:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
