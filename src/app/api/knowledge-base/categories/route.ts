import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET /api/knowledge-base/categories - Listar todas as categorias
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar todas as categorias com contagem de artigos
    const { data: categories, error } = await supabase
      .from('kb_categories')
      .select(`
        *,
        article_count:kb_articles(count)
      `)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Erro ao buscar categorias:', error)
      // Se houver erro, mas não é de tabela inexistente, tentar buscar sem o count
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        // Tabela não existe
        return NextResponse.json({ categories: [] })
      }
      
      // Tentar buscar categorias sem o count de artigos
      const { data: simpleCats } = await supabase
        .from('kb_categories')
        .select('*')
        .order('display_order', { ascending: true })
      
      if (simpleCats) {
        const formatted = simpleCats.map(cat => ({
          ...cat,
          article_count: 0
        }))
        return NextResponse.json({ categories: formatted })
      }
      
      return NextResponse.json({ categories: [] })
    }

    // Formatar a resposta
    const formattedCategories = categories?.map(category => {
      // Extrair a contagem de artigos
      const articleCount = Array.isArray(category.article_count) 
        ? (category.article_count[0] as any)?.count || 0
        : 0
      
      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        color: category.color,
        display_order: category.display_order,
        created_at: category.created_at,
        article_count: articleCount
      }
    }) || []

    return NextResponse.json({
      categories: formattedCategories
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
    const { data: existingCategory } = await supabase
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
    
    const { data: category, error } = await supabase
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