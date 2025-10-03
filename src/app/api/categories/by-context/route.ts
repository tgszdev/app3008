import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Listar categorias por contexto
export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contextId = searchParams.get('context_id')
    const activeOnly = searchParams.get('active_only') === 'true'

    if (!contextId) {
      return NextResponse.json({ error: 'context_id is required' }, { status: 400 })
    }

    // Verificar se o contexto existe
    const { data: context, error: contextError } = await supabaseAdmin
      .from('contexts')
      .select('id, name, type, slug')
      .eq('id', contextId)
      .single()

    if (contextError || !context) {
      return NextResponse.json({ error: 'Context not found' }, { status: 404 })
    }

    // Buscar categorias globais + específicas do contexto
    let query = supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug),
        parent_category:parent_category_id(id, name, slug)
      `)
      .or(`is_global.eq.true,context_id.eq.${contextId}`)

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    query = query.order('display_order', { ascending: true })

    const { data: categories, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    return NextResponse.json({
      context,
      categories: categories || []
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Criar categoria para contexto específico
export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar se é admin
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      name, 
      slug, 
      description, 
      icon, 
      color, 
      is_active, 
      display_order,
      context_id,
      parent_category_id
    } = body

    // Validação básica
    if (!name || !slug || !context_id) {
      return NextResponse.json({ error: 'Name, slug and context_id are required' }, { status: 400 })
    }

    // Verificar se o contexto existe
    const { data: context, error: contextError } = await supabaseAdmin
      .from('contexts')
      .select('id, name, type')
      .eq('id', context_id)
      .single()

    if (contextError || !context) {
      return NextResponse.json({ error: 'Context not found' }, { status: 400 })
    }

    // Verificar se a categoria pai existe (se fornecida)
    if (parent_category_id) {
      const { data: parent, error: parentError } = await supabaseAdmin
        .from('categories')
        .select('id, name')
        .eq('id', parent_category_id)
        .single()

      if (parentError || !parent) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 400 })
      }
    }

    // Verificar se o slug já existe no contexto
    const { data: existing } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .eq('context_id', context_id)
      .single()

    if (existing) {
      return NextResponse.json({ 
        error: `Category with slug '${slug}' already exists in this context` 
      }, { status: 400 })
    }

    // Criar categoria
    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .insert({
        name,
        slug,
        description,
        icon,
        color,
        is_active: is_active ?? true,
        display_order: display_order ?? 0,
        context_id,
        is_global: false,
        parent_category_id: parent_category_id || null,
        created_by: session.user.id
      })
      .select(`
        *,
        contexts(id, name, type, slug),
        parent_category:parent_category_id(id, name, slug)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json(category)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
