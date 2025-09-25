import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Listar categorias públicas (para teste)
export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const contextId = searchParams.get('context_id')

    // Build query
    let query = supabaseAdmin
      .from('categories')
      .select(`
        *,
        parent_category:parent_category_id(id, name, slug)
      `)
      .eq('is_active', true)

    // Filter by context if provided
    if (contextId) {
      // Se contextId fornecido, buscar categorias globais + específicas do contexto
      query = query.or(`is_global.eq.true,context_id.eq.${contextId}`)
    } else {
      // Se não fornecido, buscar apenas categorias globais
      query = query.eq('is_global', true)
    }

    // Order by display_order
    query = query.order('display_order', { ascending: true })

    const { data: categories, error } = await query

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    // Buscar contexto separadamente se necessário
    let contextData = null
    if (categories && categories.length > 0 && contextId) {
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
    console.error('Categories public GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
