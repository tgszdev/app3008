import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Obter estatísticas da base de conhecimento
export async function GET(request: NextRequest) {
  try {
    // Contar total de artigos publicados
    const { count: totalArticles } = await supabaseAdmin
      .from('kb_articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')

    // Contar total de categorias ativas
    const { count: totalCategories } = await supabaseAdmin
      .from('kb_categories')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Somar total de visualizações
    const { data: viewsData } = await supabaseAdmin
      .from('kb_articles')
      .select('view_count')
      .eq('status', 'published')

    const totalViews = viewsData?.reduce((sum, article) => sum + (article.view_count || 0), 0) || 0

    // Calcular taxa de utilidade
    const { data: feedbackData } = await supabaseAdmin
      .from('kb_articles')
      .select('helpful_count, not_helpful_count')
      .eq('status', 'published')

    let totalHelpful = 0
    let totalNotHelpful = 0
    
    feedbackData?.forEach(article => {
      totalHelpful += article.helpful_count || 0
      totalNotHelpful += article.not_helpful_count || 0
    })

    const totalFeedback = totalHelpful + totalNotHelpful
    const helpfulPercentage = totalFeedback > 0 
      ? Math.round((totalHelpful / totalFeedback) * 100)
      : 0

    // Buscar artigos populares (mais visualizados)
    const { data: popularArticles } = await supabaseAdmin
      .from('kb_articles')
      .select(`
        id,
        title,
        slug,
        excerpt,
        view_count,
        helpful_count,
        category:kb_categories (
          id,
          name,
          slug,
          icon,
          color
        )
      `)
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(5)

    // Buscar artigos recentes
    const { data: recentArticles } = await supabaseAdmin
      .from('kb_articles')
      .select(`
        id,
        title,
        slug,
        excerpt,
        created_at,
        category:kb_categories (
          id,
          name,
          slug,
          icon,
          color
        )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      total_articles: totalArticles || 0,
      total_categories: totalCategories || 0,
      total_views: totalViews,
      helpful_percentage: helpfulPercentage,
      popular_articles: popularArticles || [],
      recent_articles: recentArticles || []
    })

  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', message: error.message },
      { status: 500 }
    )
  }
}