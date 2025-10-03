import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Listar artigos
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const faqOnly = searchParams.get('faq_only') === 'true'
    const featured = searchParams.get('featured') === 'true'
    const status = searchParams.get('status') || 'published'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Construir query
    let query = supabaseAdmin
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
      .eq('status', status)
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (category) {
      query = query.eq('category_id', category)
    }

    if (faqOnly) {
      query = query.eq('is_faq', true)
    }

    if (featured) {
      query = query.eq('is_featured', true)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`)
    }

    // Aplicar paginação
    query = query.range(offset, offset + limit - 1)

    const { data: articles, error } = await query

    if (error) {
      // Se a tabela não existir, retornar array vazio
      return NextResponse.json({
        articles: [],
        total: 0
      })
    }

    // Buscar tags para cada artigo
    const articlesWithTags = await Promise.all(
      (articles || []).map(async (article) => {
        const { data: tags } = await supabaseAdmin
          .from('kb_article_tags')
          .select('tag:kb_tags(id, name, slug)')
          .eq('article_id', article.id)

        return {
          ...article,
          tags: tags?.map(t => t.tag) || []
        }
      })
    )

    return NextResponse.json({
      articles: articlesWithTags,
      total: articlesWithTags.length
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro interno do servidor', message: error.message },
      { status: 500 }
    )
  }
}

// POST - Criar novo artigo
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar permissão
    const userRole = (session.user as any)?.role
    const userId = (session.user as any)?.id || session.user.email
    
    if (userRole !== 'admin' && userRole !== 'analyst') {
      return NextResponse.json(
        { error: 'Sem permissão para criar artigos' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      slug,
      content,
      excerpt,
      category_id,
      status = 'draft',
      is_featured = false,
      is_faq = false,
      meta_keywords = [],
      meta_description,
      tags = []
    } = body

    // Validações
    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Título, slug e conteúdo são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se slug já existe
    const { data: existingArticle } = await supabaseAdmin
      .from('kb_articles')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingArticle) {
      return NextResponse.json(
        { error: 'Já existe um artigo com este slug' },
        { status: 400 }
      )
    }

    // Criar artigo
    const { data: article, error: articleError } = await supabaseAdmin
      .from('kb_articles')
      .insert({
        title,
        slug,
        content,
        excerpt,
        category_id,
        author_id: userId,
        status,
        is_featured,
        is_faq,
        meta_keywords,
        meta_description,
        published_at: status === 'published' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (articleError) {
      return NextResponse.json(
        { error: 'Erro ao criar artigo', details: articleError.message },
        { status: 500 }
      )
    }

    // Adicionar tags se fornecidas
    if (tags.length > 0 && article) {
      for (const tagName of tags) {
        // Criar tag se não existir
        const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-')
        const { data: tag } = await supabaseAdmin
          .from('kb_tags')
          .upsert({ name: tagName, slug: tagSlug })
          .select()
          .single()

        if (tag) {
          await supabaseAdmin
            .from('kb_article_tags')
            .insert({ article_id: article.id, tag_id: tag.id })
        }
      }
    }

    return NextResponse.json(article)

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro interno do servidor', message: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar artigo
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar usuário
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (!userData || (userData.role !== 'admin' && userData.role !== 'analyst')) {
      return NextResponse.json(
        { error: 'Sem permissão para editar artigos' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID do artigo é obrigatório' },
        { status: 400 }
      )
    }

    // Se mudando para publicado, definir published_at
    if (updates.status === 'published') {
      updates.published_at = new Date().toISOString()
    }

    // Atualizar artigo
    const { data: article, error } = await supabaseAdmin
      .from('kb_articles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao atualizar artigo', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(article)

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro interno do servidor', message: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Excluir artigo
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar usuário
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem excluir artigos' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID do artigo é obrigatório' },
        { status: 400 }
      )
    }

    // Excluir artigo (as relações serão excluídas em cascata)
    const { error } = await supabaseAdmin
      .from('kb_articles')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao excluir artigo', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro interno do servidor', message: error.message },
      { status: 500 }
    )
  }
}