import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Listar categorias
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const withCount = searchParams.get('with_count') === 'true'

    // Buscar categorias
    const { data: categories, error } = await supabaseAdmin
      .from('kb_categories')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Erro ao buscar categorias:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar categorias', details: error.message },
        { status: 500 }
      )
    }

    // Se requisitado, adicionar contagem de artigos
    let categoriesWithCount = categories || []
    
    if (withCount) {
      categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const { count } = await supabaseAdmin
            .from('kb_articles')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('status', 'published')

          return {
            ...category,
            article_count: count || 0
          }
        })
      )
    }

    return NextResponse.json({
      categories: categoriesWithCount
    })

  } catch (error: any) {
    console.error('Erro na API de categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', message: error.message },
      { status: 500 }
    )
  }
}