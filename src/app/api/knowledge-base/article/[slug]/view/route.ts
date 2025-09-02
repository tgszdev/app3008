import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST - Incrementar visualizações
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Buscar artigo atual
    const { data: article, error: fetchError } = await supabaseAdmin
      .from('kb_articles')
      .select('id, view_count')
      .eq('slug', slug)
      .single()

    if (fetchError || !article) {
      return NextResponse.json(
        { error: 'Artigo não encontrado' },
        { status: 404 }
      )
    }

    // Incrementar contador de visualizações
    const { error: updateError } = await supabaseAdmin
      .from('kb_articles')
      .update({ view_count: (article.view_count || 0) + 1 })
      .eq('id', article.id)

    if (updateError) {
      console.error('Erro ao incrementar visualizações:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar visualizações' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Erro ao incrementar visualizações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', message: error.message },
      { status: 500 }
    )
  }
}