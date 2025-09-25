import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Listar categorias para teste (simulando autenticação)
export async function GET(request: Request) {
  try {
    // Simular usuário agro para teste
    const testUserId = '3b855060-50d4-4eef-abf5-4eec96934159'
    const testContextId = '6486088e-72ae-461b-8b03-32ca84918882'

    // Build query
    let query = supabaseAdmin
      .from('categories')
      .select(`
        *,
        parent_category:parent_category_id(id, name, slug)
      `)
      .eq('is_active', true)

    // Buscar categorias globais + específicas do contexto
    query = query.or(`is_global.eq.true,context_id.eq.${testContextId}`)

    // Order by display_order
    query = query.order('display_order', { ascending: true })

    const { data: categories, error } = await query

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    // Buscar contexto separadamente
    let contextData = null
    if (categories && categories.length > 0) {
      const { data: context } = await supabaseAdmin
        .from('contexts')
        .select('id, name, type, slug')
        .eq('id', testContextId)
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
    console.error('Categories test GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
