import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Buscar artigo por slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug

    // Buscar artigo
    const { data: article, error } = await supabaseAdmin
      .from('kb_articles')
      .select(`
        *,
        category:kb_categories (
          id,
          name,
          slug,
          icon,
          color
        ),
        author:users (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error || !article) {
      return NextResponse.json(
        { error: 'Artigo não encontrado' },
        { status: 404 }
      )
    }

    // Buscar tags do artigo
    const { data: tags } = await supabaseAdmin
      .from('kb_article_tags')
      .select('tag:kb_tags(id, name, slug)')
      .eq('article_id', article.id)

    // Buscar artigos relacionados (mesma categoria)
    const { data: related } = await supabaseAdmin
      .from('kb_articles')
      .select(`
        id,
        title,
        slug,
        excerpt,
        category:kb_categories (
          name,
          color
        )
      `)
      .eq('category_id', article.category_id)
      .eq('status', 'published')
      .neq('id', article.id)
      .limit(5)

    return NextResponse.json({
      article: {
        ...article,
        tags: tags?.map(t => t.tag) || []
      },
      related: related || []
    })

  } catch (error: any) {
    console.error('Erro ao buscar artigo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', message: error.message },
      { status: 500 }
    )
  }
}