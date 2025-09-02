import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Listar todas as categorias
export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const active_only = searchParams.get('active_only') === 'true'

    // Build query
    let query = supabaseAdmin
      .from('categories')
      .select(`
        *,
        created_by_user:users!categories_created_by_fkey(
          id,
          name,
          email
        ),
        updated_by_user:users!categories_updated_by_fkey(
          id,
          name,
          email
        )
      `)
      .order('display_order', { ascending: true })

    // Filter by active status if requested
    if (active_only) {
      query = query.eq('is_active', true)
    }

    const { data: categories, error } = await query

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    // Format the response
    const formattedCategories = categories?.map((cat: any) => ({
      ...cat,
      created_by_user: Array.isArray(cat.created_by_user) ? cat.created_by_user[0] : cat.created_by_user,
      updated_by_user: Array.isArray(cat.updated_by_user) ? cat.updated_by_user[0] : cat.updated_by_user
    })) || []

    return NextResponse.json(formattedCategories)
  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Criar nova categoria
export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Apenas admin pode criar categorias
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, icon, color } = body

    // Validação básica
    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    // Gerar slug a partir do nome
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]+/g, '-') // Substitui espaços e caracteres especiais por hífen
      .replace(/^-+|-+$/g, '') // Remove hífens do início e fim

    // Verificar se já existe categoria com esse slug
    const { data: existing } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Já existe uma categoria com esse nome' }, { status: 400 })
    }

    // Obter próximo display_order
    const { data: maxOrder } = await supabaseAdmin
      .from('categories')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxOrder?.display_order || 0) + 1

    // Inserir nova categoria
    const { data: newCategory, error: insertError } = await supabaseAdmin
      .from('categories')
      .insert({
        name,
        slug,
        description: description || null,
        icon: icon || 'folder',
        color: color || '#6B7280',
        display_order: nextOrder,
        created_by: session.user.id,
        updated_by: session.user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating category:', insertError)
      return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 })
    }

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    console.error('Categories POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar categoria
export async function PUT(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Apenas admin pode atualizar categorias
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, description, icon, color, is_active, display_order } = body

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    // Preparar dados para atualização
    const updateData: any = {
      updated_by: session.user.id,
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) {
      updateData.name = name
      // Atualizar slug se o nome mudou
      updateData.slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }

    if (description !== undefined) updateData.description = description
    if (icon !== undefined) updateData.icon = icon
    if (color !== undefined) updateData.color = color
    if (is_active !== undefined) updateData.is_active = is_active
    if (display_order !== undefined) updateData.display_order = display_order

    // Atualizar categoria
    const { data: updatedCategory, error: updateError } = await supabaseAdmin
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating category:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 500 })
    }

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error('Categories PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir categoria
export async function DELETE(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Apenas admin pode excluir categorias
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    // Verificar se há tickets usando esta categoria
    const { data: tickets } = await supabaseAdmin
      .from('tickets')
      .select('id')
      .eq('category_id', id)
      .limit(1)

    if (tickets && tickets.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir categoria com tickets associados' },
        { status: 400 }
      )
    }

    // Excluir categoria
    const { error: deleteError } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting category:', deleteError)
      return NextResponse.json({ error: 'Erro ao excluir categoria' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Categories DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}