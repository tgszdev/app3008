import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/knowledge-base/categories/all - Listar TODAS as categorias (admin only, sem filtros)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin - APENAS admins podem ver todas as categorias sem filtro
    const userRole = (session.user as any)?.role
    
    if (userRole !== 'admin') {
      return NextResponse.json({ 
        error: 'Apenas administradores podem acessar todas as categorias' 
      }, { status: 403 })
    }

    console.log('Admin solicitando TODAS as categorias para configuração')
    
    // Buscar TODAS as categorias sem nenhum filtro
    const { data: categories, error } = await supabaseAdmin
      .from('kb_categories')
      .select('*')
      .order('display_order', { ascending: true })
    
    if (error) {
      console.error('Erro ao buscar categorias:', error)
      return NextResponse.json({ 
        categories: [],
        error: error.message 
      })
    }
    
    // Normalizar os dados e adicionar contagem de artigos
    const categoriesWithCount = await Promise.all(
      (categories || []).map(async (cat) => {
        // Buscar contagem de artigos
        const { count } = await supabaseAdmin
          .from('kb_articles')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', cat.id)
        
        return {
          id: cat.id,
          name: cat.name || 'Sem nome',
          slug: cat.slug || '',
          description: cat.description || '',
          icon: cat.icon || 'file-text',
          color: cat.color || '#6366F1',
          display_order: cat.display_order || 999,
          created_at: cat.created_at,
          article_count: count || 0
        }
      })
    )
    
    console.log(`Retornando ${categoriesWithCount.length} categorias para configuração`)
    
    return NextResponse.json({
      categories: categoriesWithCount,
      total: categoriesWithCount.length
    })

  } catch (error) {
    console.error('Erro ao buscar todas as categorias:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
      { status: 500 }
    )
  }
}