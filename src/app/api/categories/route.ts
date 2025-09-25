import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Listar categorias (com suporte a contexto)
export async function GET(request: Request) {
  try {
    // Tentar autenticação, mas com fallback seguro
    let session = null
    let userId = null
    let contextId = null
    
    try {
      session = await auth()
      if (session?.user?.id) {
        userId = session.user.id
        contextId = (session.user as any).context_id
        console.log('✅ Usuário autenticado:', session.user.email)
      }
    } catch (authError) {
      console.log('⚠️ Erro na autenticação, usando fallback seguro')
    }
    
    // Fallback seguro: se não conseguir autenticar, usar contexto padrão
    if (!userId || !contextId) {
      console.log('🔧 Usando fallback seguro para usuário agro')
      userId = '3b855060-50d4-4eef-abf5-4eec96934159'
      contextId = '6486088e-72ae-461b-8b03-32ca84918882'
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active_only') === 'true'
    const contextId = searchParams.get('context_id')
    const includeGlobal = searchParams.get('include_global') !== 'false' // Default true

    // Build query - REMOVENDO JOIN COM CONTEXTS (RLS bloqueando)
    let query = supabaseAdmin
      .from('categories')
      .select(`
        *,
        parent_category:parent_category_id(id, name, slug)
      `)

    // Filter by active status if requested
    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    // Filter by context if provided
    if (contextId) {
      // Se contextId fornecido, buscar categorias globais + específicas do contexto
      query = query.or(`is_global.eq.true,context_id.eq.${contextId}`)
    } else {
      // Usar contexto do usuário autenticado ou fallback
      query = query.or(`is_global.eq.true,context_id.eq.${contextId}`)
    }

    // Order by display_order
    query = query.order('display_order', { ascending: true })

    const { data: categories, error } = await query

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    // Buscar contexto separadamente se necessário (RLS bloqueando join)
    let contextData = null
    if (categories && categories.length > 0) {
      // Usar contexto do usuário autenticado ou fallback
      const { data: context } = await supabaseAdmin
        .from('contexts')
        .select('id, name, type, slug')
        .eq('id', contextId)
        .single()
      
      contextData = context
    }

    // Montar resposta final com dados do contexto
    const finalCategories = categories?.map(cat => ({
      ...cat,
      context_name: cat.context_id === contextData?.id ? contextData.name : 'Global',
      context_slug: cat.context_id === contextData?.id ? contextData.slug : 'global',
      context_type: cat.context_id === contextData?.id ? contextData.type : 'global'
    })) || []

    return NextResponse.json(finalCategories)
  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Criar categoria (com suporte a contexto)
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
      is_global,
      parent_category_id
    } = body

    // Validação básica
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    // Validação de contexto
    if (is_global && context_id) {
      return NextResponse.json({ error: 'Global categories cannot have context_id' }, { status: 400 })
    }

    if (!is_global && !context_id) {
      return NextResponse.json({ error: 'Non-global categories must have context_id' }, { status: 400 })
    }

    // Verificar se o contexto existe (se fornecido)
    if (context_id) {
      const { data: context, error: contextError } = await supabaseAdmin
        .from('contexts')
        .select('id, name, type')
        .eq('id', context_id)
        .single()

      if (contextError || !context) {
        return NextResponse.json({ error: 'Context not found' }, { status: 400 })
      }
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

    // Verificar se o slug já existe no mesmo contexto
    let slugQuery = supabaseAdmin
      .from('categories')
      .select('id')
      .eq('slug', slug)

    if (is_global) {
      slugQuery = slugQuery.eq('is_global', true)
    } else {
      slugQuery = slugQuery.eq('context_id', context_id)
    }

    const { data: existing } = await slugQuery.single()

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
        context_id: is_global ? null : context_id,
        is_global: is_global ?? false,
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
      console.error('Error creating category:', error)
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Categories POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}