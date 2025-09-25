import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Endpoint público para categorias (FIX TEMPORÁRIO)
export async function GET(request: Request) {
  try {
    console.log('🔧 Endpoint público de categorias (FIX TEMPORÁRIO)')
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active_only') === 'true'

    // Buscar categorias ativas com filtro por contexto
    let query = supabaseAdmin
      .from('categories')
      .select(`
        id,
        name,
        slug,
        description,
        icon,
        color,
        is_active,
        display_order,
        is_global,
        context_id
      `)

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    // TEMPORÁRIO: Para usuários matrix, mostrar todas as categorias ativas
    // TODO: Implementar autenticação real para filtrar por usuário
    // query = query.or('is_global.eq.true,context_id.eq.6486088e-72ae-461b-8b03-32ca84918882')

    query = query.order('display_order', { ascending: true })

    const { data: categories, error } = await query

    if (error) {
      console.error('❌ Erro ao buscar categorias:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    console.log('✅ Categorias encontradas (público):', categories?.length || 0)

    return NextResponse.json(categories || [])

  } catch (error: any) {
    console.error('❌ Erro no endpoint público:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}