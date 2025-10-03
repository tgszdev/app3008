import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Obter categoria específica
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug),
        parent_category:parent_category_id(id, name, slug)
      `)
      .eq('id', id)
      .single()

    if (error || !category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Atualizar categoria (com suporte a contexto)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar se é admin
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    // Remover campos que não devem ser atualizados
    delete body.id
    delete body.created_at
    delete body.created_by

    // Validação de contexto
    if (body.is_global && body.context_id && body.context_id !== '') {
      return NextResponse.json({ error: 'Global categories cannot have context_id' }, { status: 400 })
    }

    if (!body.is_global && (!body.context_id || body.context_id === '')) {
      return NextResponse.json({ error: 'Non-global categories must have context_id' }, { status: 400 })
    }

    // Verificar se o contexto existe (se fornecido)
    if (body.context_id && body.context_id !== '') {
      const { data: context, error: contextError } = await supabaseAdmin
        .from('contexts')
        .select('id, name, type')
        .eq('id', body.context_id)
        .single()

      if (contextError || !context) {
        return NextResponse.json({ error: 'Context not found' }, { status: 400 })
      }
    }

    // Verificar se a categoria pai existe (se fornecida)
    if (body.parent_category_id && body.parent_category_id !== '') {
      const { data: parent, error: parentError } = await supabaseAdmin
        .from('categories')
        .select('id, name')
        .eq('id', body.parent_category_id)
        .single()

      if (parentError || !parent) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 400 })
      }
    }

    // Se está alterando o slug, verificar duplicatas no mesmo contexto
    if (body.slug) {
      let slugQuery = supabaseAdmin
        .from('categories')
        .select('id')
        .eq('slug', body.slug)
        .neq('id', id)

      if (body.is_global) {
        slugQuery = slugQuery.eq('is_global', true)
      } else if (body.context_id) {
        slugQuery = slugQuery.eq('context_id', body.context_id)
      }

      const { data: existing } = await slugQuery.single()

      if (existing) {
        return NextResponse.json({ 
          error: `Category with slug '${body.slug}' already exists in this context` 
        }, { status: 400 })
      }
    }

    // Preparar dados para atualização - filtrar campos vazios
    const updateData = {
      ...body,
      // updated_at gerenciado automaticamente pelo Supabase
      updated_by: session.user.id
    }
    
    // Tratar campos UUID vazios
    if (body.is_global) {
      updateData.context_id = null
    } else if (body.context_id && body.context_id !== '') {
      updateData.context_id = body.context_id
    } else {
      delete updateData.context_id // Não incluir se vazio
    }
    
    if (body.parent_category_id && body.parent_category_id !== '') {
      updateData.parent_category_id = body.parent_category_id
    } else {
      updateData.parent_category_id = null
    }
    
    // Remover campos vazios que podem causar erro
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '' || updateData[key] === undefined) {
        if (key === 'context_id' || key === 'parent_category_id') {
          updateData[key] = null
        } else {
          delete updateData[key]
        }
      }
    })

    // Atualizar categoria
    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        contexts(id, name, type, slug),
        parent_category:parent_category_id(id, name, slug)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Excluir categoria
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar se é admin
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const { id } = await params

    // Verificar se existem tickets usando esta categoria
    const { data: tickets } = await supabaseAdmin
      .from('tickets')
      .select('id')
      .eq('category_id', id)
      .limit(1)

    if (tickets && tickets.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category with associated tickets' 
      }, { status: 400 })
    }

    // Excluir categoria
    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}