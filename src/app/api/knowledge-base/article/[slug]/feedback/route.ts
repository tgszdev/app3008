import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// POST /api/knowledge-base/article/[slug]/feedback - Enviar feedback do artigo
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { slug } = params
    const body = await request.json()
    const { helpful, comment } = body

    // Buscar o artigo pelo slug
    const { data: article, error: articleError } = await supabase
      .from('kb_articles')
      .select('id')
      .eq('slug', slug)
      .single()

    if (articleError || !article) {
      return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 })
    }

    // Buscar o usuário
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se o usuário já deu feedback neste artigo
    const { data: existingFeedback } = await supabase
      .from('kb_article_feedback')
      .select('id')
      .eq('article_id', article.id)
      .eq('user_id', user.id)
      .single()

    if (existingFeedback) {
      // Atualizar feedback existente
      const { error: updateError } = await supabase
        .from('kb_article_feedback')
        .update({
          helpful,
          comment,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingFeedback.id)

      if (updateError) {
        console.error('Erro ao atualizar feedback:', updateError)
        return NextResponse.json({ error: 'Erro ao atualizar feedback' }, { status: 500 })
      }
    } else {
      // Criar novo feedback
      const { error: insertError } = await supabase
        .from('kb_article_feedback')
        .insert({
          article_id: article.id,
          user_id: user.id,
          helpful,
          comment
        })

      if (insertError) {
        console.error('Erro ao criar feedback:', insertError)
        return NextResponse.json({ error: 'Erro ao criar feedback' }, { status: 500 })
      }
    }

    // Atualizar contadores no artigo
    const { data: allFeedback } = await supabase
      .from('kb_article_feedback')
      .select('helpful')
      .eq('article_id', article.id)

    if (allFeedback) {
      const helpfulCount = allFeedback.filter(f => f.helpful === true).length
      const notHelpfulCount = allFeedback.filter(f => f.helpful === false).length

      await supabase
        .from('kb_articles')
        .update({
          helpful_count: helpfulCount,
          not_helpful_count: notHelpfulCount
        })
        .eq('id', article.id)
    }

    return NextResponse.json({ 
      message: 'Feedback enviado com sucesso',
      helpful
    })

  } catch (error) {
    console.error('Erro ao processar feedback:', error)
    return NextResponse.json(
      { error: 'Erro ao processar feedback' },
      { status: 500 }
    )
  }
}

// GET /api/knowledge-base/article/[slug]/feedback - Buscar feedback do usuário para o artigo
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { slug } = params

    // Buscar o artigo pelo slug
    const { data: article, error: articleError } = await supabase
      .from('kb_articles')
      .select('id')
      .eq('slug', slug)
      .single()

    if (articleError || !article) {
      return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 })
    }

    // Buscar o usuário
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Buscar feedback do usuário para este artigo
    const { data: feedback, error: feedbackError } = await supabase
      .from('kb_article_feedback')
      .select('*')
      .eq('article_id', article.id)
      .eq('user_id', user.id)
      .single()

    if (feedbackError && feedbackError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Erro ao buscar feedback:', feedbackError)
      return NextResponse.json({ error: 'Erro ao buscar feedback' }, { status: 500 })
    }

    return NextResponse.json(feedback || null)

  } catch (error) {
    console.error('Erro ao buscar feedback:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar feedback' },
      { status: 500 }
    )
  }
}