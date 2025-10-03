import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é usuário da matriz
    const userType = (session.user as any).userType
    if (userType !== 'matrix') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = params

    // Verificar se a organização existe
    const { data: org, error: fetchError } = await supabaseAdmin
      .from('contexts')
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchError || !org) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    // Verificar se há usuários associados
    const { data: userContexts, error: userError } = await supabaseAdmin
      .from('user_contexts')
      .select('id')
      .eq('context_id', id)
      .limit(1)

    if (userError) {
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    if (userContexts && userContexts.length > 0) {
      return NextResponse.json({ 
        error: 'Não é possível excluir uma organização que possui usuários associados' 
      }, { status: 400 })
    }

    // Excluir organização
    const { error: deleteError } = await supabaseAdmin
      .from('contexts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: 'Erro ao excluir organização' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Organização excluída com sucesso'
    })

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é usuário da matriz
    const userType = (session.user as any).userType
    if (userType !== 'matrix') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()
    const { name, type, description, settings } = body

    if (!name || !type) {
      return NextResponse.json({ error: 'Nome e tipo são obrigatórios' }, { status: 400 })
    }

    // Verificar se a organização existe
    const { data: existingOrg, error: fetchError } = await supabaseAdmin
      .from('contexts')
      .select('id, slug')
      .eq('id', id)
      .single()

    if (fetchError || !existingOrg) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    // Gerar novo slug se o nome mudou
    let slug = existingOrg.slug
    if (name !== existingOrg.name) {
      slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()

      // Verificar se novo slug já existe
      const { data: slugExists } = await supabaseAdmin
        .from('contexts')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single()

      if (slugExists) {
        return NextResponse.json({ error: 'Já existe uma organização com este nome' }, { status: 400 })
      }
    }

    // Atualizar organização
    const { data: updatedOrg, error: updateError } = await supabaseAdmin
      .from('contexts')
      .update({
        name,
        slug,
        type,
        settings: settings || {},
        // updated_at gerenciado automaticamente pelo Supabase
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Erro ao atualizar organização' }, { status: 500 })
    }

    return NextResponse.json({
      organization: updatedOrg,
      message: 'Organização atualizada com sucesso'
    })

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
