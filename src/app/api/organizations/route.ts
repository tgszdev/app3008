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

    // Buscar TODAS as organizações (para usuários matrix gerenciarem associações)
    const { data: organizations, error } = await supabaseAdmin
      .from('contexts')
      .select(`
        *,
        user_contexts(count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
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
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { name, type, description, settings } = body
    

    if (!name || !type) {
      return NextResponse.json({ error: 'Nome e tipo são obrigatórios' }, { status: 400 })
    }

    // Gerar slug único
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Verificar se slug já existe
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('contexts')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (checkError) {
      return NextResponse.json({ error: 'Erro ao verificar nome da organização' }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({ error: 'Já existe uma organização com este nome' }, { status: 400 })
    }

    // Criar organização
    
    const { data: newOrg, error } = await supabaseAdmin
      .from('contexts')
      .insert({
        name,
        slug,
        type,
        settings: settings || {},
        sla_hours: 24,
        is_active: true,
        // created_at gerenciado automaticamente pelo Supabase
        // updated_at gerenciado automaticamente pelo Supabase
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ 
        error: 'Erro ao criar organização',
        details: error.message 
      }, { status: 500 })
    }

    
    return NextResponse.json({
      organization: newOrg,
      message: 'Organização criada com sucesso'
    })

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
