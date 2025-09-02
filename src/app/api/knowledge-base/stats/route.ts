import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/knowledge-base/stats - Obter estatísticas da base de conhecimento
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar total de artigos publicados
    const { count: totalArticles, error: articlesError } = await supabaseAdmin
      .from('kb_articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')

    // Se a tabela não existir, retornar valores padrão
    if (articlesError) {
      console.error('Erro ao buscar artigos (tabela pode não existir):', articlesError)
      return NextResponse.json({
        total_articles: 0,
        total_categories: 0,
        total_views: 0,
        helpful_percentage: 0,
        popular_articles: [],
        recent_articles: []
      })
    }

    // Buscar total de categorias
    const { count: totalCategories } = await supabaseAdmin
      .from('kb_categories')
      .select('*', { count: 'exact', head: true })

    // Buscar total de visualizações
    const { data: viewsData } = await supabaseAdmin
      .from('kb_articles')
      .select('view_count')
      .eq('status', 'published')

    const totalViews = viewsData?.reduce((sum, article) => sum + (article.view_count || 0), 0) || 0

    // Calcular taxa de ajuda
    const { data: feedbackData } = await supabaseAdmin
      .from('kb_articles')
      .select('helpful_count, not_helpful_count')
      .eq('status', 'published')

    let helpfulPercentage = 0
    if (feedbackData && feedbackData.length > 0) {
      const totalHelpful = feedbackData.reduce((sum, article) => sum + (article.helpful_count || 0), 0)
      const totalNotHelpful = feedbackData.reduce((sum, article) => sum + (article.not_helpful_count || 0), 0)
      const totalFeedback = totalHelpful + totalNotHelpful
      
      if (totalFeedback > 0) {
        helpfulPercentage = Math.round((totalHelpful / totalFeedback) * 100)
      }
    }

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
        category:kb_categories(id, name, slug, icon, color)
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
        category:kb_categories(id, name, slug, icon, color)
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

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}