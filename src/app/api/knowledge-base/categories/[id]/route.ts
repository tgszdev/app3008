import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// PUT /api/knowledge-base/categories/[id] - Atualizar categoria
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    const userRole = (session.user as any)?.role
    
    if (userRole !== 'admin') {
      console.log('Role do usuário:', userRole, 'Email:', session.user.email)
      return NextResponse.json({ error: 'Apenas administradores podem editar categorias' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, slug, description, icon, color, display_order } = body

    // Validar campos obrigatórios
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Nome e slug são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o slug já existe (exceto para a própria categoria)
    const { data: existingCategory } = await supabase
      .from('kb_categories')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .single()

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Já existe uma categoria com este slug' },
        { status: 400 }
      )
    }

    // Atualizar categoria
    const { data: category, error } = await supabase
      .from('kb_categories')
      .update({
        name,
        slug,
        description,
        icon: icon || 'FileText',
        color: color || '#6366F1',
        display_order: display_order || 999
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar categoria:', error)
      return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Categoria atualizada com sucesso',
      category
    })

  } catch (error) {
    console.error('Erro ao atualizar categoria:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar categoria' },
      { status: 500 }
    )
  }
}

// DELETE /api/knowledge-base/categories/[id] - Deletar categoria
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    const userRole = (session.user as any)?.role
    
    if (userRole !== 'admin') {
      console.log('Role do usuário:', userRole, 'Email:', session.user.email)
      return NextResponse.json({ error: 'Apenas administradores podem excluir categorias' }, { status: 403 })
    }

    const { id } = await params

    // Verificar se a categoria possui artigos
    const { count } = await supabase
      .from('kb_articles')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Esta categoria possui ${count} artigo(s) e não pode ser excluída` },
        { status: 400 }
      )
    }

    // Deletar categoria
    const { error } = await supabase
      .from('kb_categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar categoria:', error)
      return NextResponse.json({ error: 'Erro ao deletar categoria' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Categoria excluída com sucesso' })

  } catch (error) {
    console.error('Erro ao deletar categoria:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar categoria' },
      { status: 500 }
    )
  }
}