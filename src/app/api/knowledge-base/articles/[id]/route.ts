import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/knowledge-base/articles/[id] - Buscar artigo por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Buscar artigo com categoria, autor e tags
    const { data: article, error } = await supabaseAdmin
      .from('kb_articles')
      .select(`
        *,
        category:kb_categories(id, name, slug, icon, color),
        author:profiles(id, name, email, avatar_url),
        tags:kb_article_tags(
          tag:kb_tags(id, name, slug)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar artigo:', error)
      return NextResponse.json({ error: 'Erro ao buscar artigo' }, { status: 500 })
    }

    if (!article) {
      return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 })
    }

    // Formatar tags
    const formattedArticle = {
      ...article,
      tags: article.tags?.map((t: any) => t.tag.name) || []
    }

    return NextResponse.json(formattedArticle)

  } catch (error) {
    console.error('Erro ao buscar artigo:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar artigo' },
      { status: 500 }
    )
  }
}

// PUT /api/knowledge-base/articles/[id] - Atualizar artigo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar permissão (admin ou analyst)
    const userRole = (session.user as any)?.role
    
    if (userRole !== 'admin' && userRole !== 'analyst') {
      console.log('Role do usuário:', userRole, 'Email:', session.user.email)
      return NextResponse.json({ error: 'Sem permissão para editar artigos' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      title,
      slug,
      excerpt,
      content,
      category_id,
      status,
      is_featured,
      is_faq,
      tags,
      meta_title,
      meta_description
    } = body

    // Validar campos obrigatórios
    if (!title || !slug || !excerpt || !content || !category_id) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      )
    }

    // Verificar se o slug já existe (exceto para o próprio artigo)
    const { data: existingArticle } = await supabaseAdmin
      .from('kb_articles')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .single()

    if (existingArticle) {
      return NextResponse.json(
        { error: 'Já existe um artigo com este slug' },
        { status: 400 }
      )
    }

    // Atualizar artigo
    const updateData: any = {
      title,
      slug,
      excerpt,
      content,
      category_id,
      status,
      is_featured,
      is_faq,
      meta_title: meta_title || title,
      meta_description: meta_description || excerpt,
      updated_at: new Date().toISOString()
    }

    // Se o status está mudando para published e ainda não tem published_at
    if (status === 'published') {
      const { data: currentArticle } = await supabaseAdmin
        .from('kb_articles')
        .select('published_at')
        .eq('id', id)
        .single()

      if (!currentArticle?.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }

    const { data: article, error: updateError } = await supabaseAdmin
      .from('kb_articles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar artigo:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar artigo' }, { status: 500 })
    }

    // Atualizar tags
    if (tags && Array.isArray(tags)) {
      // Remover tags antigas
      await supabaseAdmin
        .from('kb_article_tags')
        .delete()
        .eq('article_id', id)

      // Adicionar novas tags
      for (const tagName of tags) {
        // Criar tag se não existir
        const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        
        const { data: tag } = await supabaseAdmin
          .from('kb_tags')
          .select('id')
          .eq('slug', tagSlug)
          .single()

        let tagId = tag?.id

        if (!tagId) {
          const { data: newTag } = await supabaseAdmin
            .from('kb_tags')
            .insert({ name: tagName, slug: tagSlug })
            .select('id')
            .single()
          
          tagId = newTag?.id
        }

        if (tagId) {
          await supabaseAdmin
            .from('kb_article_tags')
            .insert({ article_id: id, tag_id: tagId })
        }
      }
    }

    return NextResponse.json({
      message: 'Artigo atualizado com sucesso',
      article
    })

  } catch (error) {
    console.error('Erro ao atualizar artigo:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar artigo' },
      { status: 500 }
    )
  }
}

// DELETE /api/knowledge-base/articles/[id] - Deletar artigo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar permissão (apenas admin)
    const userRole = (session.user as any)?.role
    
    if (userRole !== 'admin') {
      console.log('Role do usuário:', userRole, 'Email:', session.user.email)
      return NextResponse.json({ error: 'Apenas administradores podem excluir artigos' }, { status: 403 })
    }

    const { id } = await params

    // Deletar tags associadas
    await supabaseAdmin
      .from('kb_article_tags')
      .delete()
      .eq('article_id', id)

    // Deletar feedbacks associados
    await supabaseAdmin
      .from('kb_article_feedback')
      .delete()
      .eq('article_id', id)

    // Deletar artigo
    const { error } = await supabaseAdmin
      .from('kb_articles')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar artigo:', error)
      return NextResponse.json({ error: 'Erro ao deletar artigo' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Artigo excluído com sucesso' })

  } catch (error) {
    console.error('Erro ao deletar artigo:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar artigo' },
      { status: 500 }
    )
  }
}