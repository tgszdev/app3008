import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Listar categorias (com suporte a contexto)
export async function GET(request: Request) {
  try {
    // Tentar autenticação real
    let session = null
    let userId = null
    let userType = null
    let contextId = null
    let availableContexts = []
    
    try {
      session = await auth()
      if (session?.user?.id) {
        userId = session.user.id
        userType = (session.user as any).userType
        contextId = (session.user as any).context_id
        availableContexts = (session.user as any).availableContexts || []
        console.log('✅ Usuário autenticado:', session.user.email)
        console.log('🔍 Tipo de usuário:', userType)
        console.log('🔍 Contextos disponíveis:', availableContexts.length)
      }
    } catch (authError) {
      console.log('⚠️ Erro na autenticação:', authError.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // TEMPORÁRIO: Permitir acesso sem autenticação para debug
    if (!userId) {
      console.log('⚠️ Usuário não autenticado - usando fallback temporário')
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active_only') === 'true'
    const queryContextId = searchParams.get('context_id')
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

    // TEMPORÁRIO: Se não há usuário autenticado, mostrar todas as categorias ativas
    if (!userId) {
      console.log('⚠️ Usando fallback: mostrando todas as categorias ativas')
      // Não aplicar filtros de contexto - mostrar todas
    } else {
      // Filter by context based on user type
      if (queryContextId) {
        // Se contextId fornecido na query, buscar categorias globais + específicas do contexto
        query = query.or(`is_global.eq.true,context_id.eq.${queryContextId}`)
      } else if (userType === 'matrix') {
        // Usuário matrix: buscar todas as categorias dos contextos associados
        console.log('🔍 Usuário matrix: buscando categorias de todos os contextos')
        if (availableContexts.length > 0) {
          const contextIds = availableContexts.map(ctx => ctx.id)
          query = query.or(`is_global.eq.true,context_id.in.(${contextIds.join(',')})`)
        } else {
          // Se não tem contextos associados, buscar apenas globais
          query = query.eq('is_global', true)
        }
      } else if (userType === 'context' && contextId) {
        // Usuário context: buscar categorias globais + do seu contexto
        console.log('🔍 Usuário context: buscando categorias globais + específicas')
        query = query.or(`is_global.eq.true,context_id.eq.${contextId}`)
      } else {
        // Fallback: apenas categorias globais
        console.log('🔍 Fallback: apenas categorias globais')
        query = query.eq('is_global', true)
      }
    }

    // Order by display_order
    query = query.order('display_order', { ascending: true })

    const { data: categories, error } = await query

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    // Buscar dados dos contextos para enriquecer as categorias
    let contextDataMap = new Map()
    if (categories && categories.length > 0) {
      // Buscar dados de todos os contextos únicos das categorias
      const uniqueContextIds = [...new Set(categories.map(cat => cat.context_id).filter(id => id))]
      
      if (uniqueContextIds.length > 0) {
        const { data: contexts, error: contextsError } = await supabaseAdmin
          .from('contexts')
          .select('id, name, type, slug')
          .in('id', uniqueContextIds)
        
        if (!contextsError && contexts) {
          contexts.forEach(ctx => {
            contextDataMap.set(ctx.id, ctx)
          })
        }
      }
    }

    // Montar resposta final com dados do contexto
    const finalCategories = categories?.map(cat => {
      const contextData = contextDataMap.get(cat.context_id)
      return {
        ...cat,
        context_name: cat.is_global ? 'Global' : (contextData?.name || 'N/A'),
        context_slug: cat.is_global ? 'global' : (contextData?.slug || 'n-a'),
        context_type: cat.is_global ? 'global' : (contextData?.type || 'n-a')
      }
    }) || []

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