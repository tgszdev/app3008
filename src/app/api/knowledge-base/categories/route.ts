import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/knowledge-base/categories - Listar todas as categorias
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    console.log('Buscando categorias...')
    
    // Primeiro, tentar buscar apenas as categorias sem JOIN
    const { data: simpleCategories, error: simpleError } = await supabaseAdmin
      .from('kb_categories')
      .select('*')
      .order('display_order', { ascending: true })
    
    console.log('Categorias simples:', simpleCategories)
    console.log('Erro simples:', simpleError)
    
    if (simpleError) {
      console.error('Erro ao buscar categorias simples:', simpleError)
      return NextResponse.json({ 
        categories: [],
        error: simpleError.message 
      })
    }
    
    // Se conseguiu buscar as categorias, tentar adicionar a contagem
    let categoriesWithCount = simpleCategories || []
    
    // Tentar buscar a contagem de artigos para cada categoria
    try {
      const categoriesWithArticleCount = await Promise.all(
        categoriesWithCount.map(async (category) => {
          const { count } = await supabaseAdmin
            .from('kb_articles')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
          
          return {
            ...category,
            article_count: count || 0
          }
        })
      )
      
      categoriesWithCount = categoriesWithArticleCount
    } catch (countError) {
      console.error('Erro ao buscar contagem de artigos:', countError)
      // Se falhar, usar as categorias sem contagem
      categoriesWithCount = categoriesWithCount.map(cat => ({
        ...cat,
        article_count: 0
      }))
    }
    
    console.log('Categorias finais:', categoriesWithCount)
    
    return NextResponse.json({
      categories: categoriesWithCount
    })



  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
      { status: 500 }
    )
  }
}

// POST /api/knowledge-base/categories - Criar nova categoria (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    const userRole = (session.user as any)?.role
    
    if (userRole !== 'admin') {
      console.log('Role do usuário:', userRole, 'Email:', session.user.email)
      return NextResponse.json({ error: 'Apenas administradores podem criar categorias' }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, description, icon, color, display_order } = body

    // Validar campos obrigatórios
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Nome e slug são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o slug já existe
    const { data: existingCategory } = await supabaseAdmin
      .from('kb_categories')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Já existe uma categoria com este slug' },
        { status: 400 }
      )
    }

    // Criar categoria
    console.log('Tentando criar categoria:', { name, slug, description, icon, color, display_order })
    
    const { data: category, error } = await supabaseAdmin
      .from('kb_categories')
      .insert({
        name,
        slug,
        description: description || null,
        icon: icon || 'FileText',
        color: color || '#6366F1',
        display_order: display_order || 999
      })
      .select()
      .single()

    if (error) {
      console.error('Erro detalhado ao criar categoria:', error)
      console.error('Mensagem:', error.message)
      console.error('Detalhes:', error.details)
      console.error('Hint:', error.hint)
      
      // Retornar erro mais específico
      if (error.message?.includes('duplicate')) {
        return NextResponse.json({ 
          error: 'Já existe uma categoria com este slug',
          details: error.message 
        }, { status: 400 })
      }
      
      if (error.message?.includes('permission') || error.message?.includes('RLS')) {
        return NextResponse.json({ 
          error: 'Erro de permissão no banco de dados. Verifique as políticas RLS.',
          details: error.message 
        }, { status: 403 })
      }
      
      return NextResponse.json({ 
        error: 'Erro ao criar categoria',
        details: error.message,
        hint: error.hint
      }, { status: 500 })
    }

    console.log('Categoria criada com sucesso:', category)
    
    return NextResponse.json({
      message: 'Categoria criada com sucesso',
      category
    })

  } catch (error) {
    console.error('Erro ao criar categoria:', error)
    return NextResponse.json(
      { error: 'Erro ao criar categoria' },
      { status: 500 }
    )
  }
}