import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Listar associações de usuários com contextos
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const contextId = searchParams.get('context_id')

    let query = supabaseAdmin
      .from('user_contexts')
      .select(`
        *,
        users(id, name, email, user_type),
        contexts(id, name, type, slug)
      `)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (contextId) {
      query = query.eq('context_id', contextId)
    }

    const { data: associations, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar associações:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json({
      associations: associations || []
    })

  } catch (error) {
    console.error('Erro na API de associações:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Criar nova associação
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { user_id, context_id, can_manage = false } = body

    if (!user_id || !context_id) {
      return NextResponse.json({ error: 'user_id e context_id são obrigatórios' }, { status: 400 })
    }

    // Verificar se a associação já existe
    const { data: existing } = await supabaseAdmin
      .from('user_contexts')
      .select('id')
      .eq('user_id', user_id)
      .eq('context_id', context_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Usuário já está associado a este contexto' }, { status: 400 })
    }

    // Criar associação
    const { data: newAssociation, error } = await supabaseAdmin
      .from('user_contexts')
      .insert({
        user_id,
        context_id,
        can_manage,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        users(id, name, email),
        contexts(id, name, type)
      `)
      .single()

    if (error) {
      console.error('Erro ao criar associação:', error)
      return NextResponse.json({ error: 'Erro ao criar associação' }, { status: 500 })
    }

    // SINCRONIZAÇÃO: Atualizar context_id do usuário
    const { error: updateUserError } = await supabaseAdmin
      .from('users')
      .update({ context_id })
      .eq('id', user_id)

    if (updateUserError) {
      console.error('Erro ao sincronizar context_id do usuário:', updateUserError)
      // Não falhar a operação, apenas logar o erro
    }

    return NextResponse.json({
      association: newAssociation,
      message: 'Associação criada com sucesso'
    })

  } catch (error) {
    console.error('Erro na API de associações:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Remover associação
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const context_id = searchParams.get('context_id')

    if (!user_id || !context_id) {
      return NextResponse.json({ error: 'user_id e context_id são obrigatórios' }, { status: 400 })
    }

    // Remover associação
    const { error } = await supabaseAdmin
      .from('user_contexts')
      .delete()
      .eq('user_id', user_id)
      .eq('context_id', context_id)

    if (error) {
      console.error('Erro ao remover associação:', error)
      return NextResponse.json({ error: 'Erro ao remover associação' }, { status: 500 })
    }

    // SINCRONIZAÇÃO: Verificar se o usuário ainda tem outras associações
    const { data: remainingAssociations, error: checkError } = await supabaseAdmin
      .from('user_contexts')
      .select('context_id')
      .eq('user_id', user_id)
      .limit(1)

    if (checkError) {
      console.error('Erro ao verificar associações restantes:', checkError)
    } else {
      // Se não há mais associações, remover context_id do usuário
      if (!remainingAssociations || remainingAssociations.length === 0) {
        const { error: updateUserError } = await supabaseAdmin
          .from('users')
          .update({ context_id: null })
          .eq('id', user_id)

        if (updateUserError) {
          console.error('Erro ao sincronizar context_id do usuário:', updateUserError)
          // Não falhar a operação, apenas logar o erro
        }
      }
    }

    return NextResponse.json({
      message: 'Associação removida com sucesso'
    })

  } catch (error) {
    console.error('Erro na API de associações:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
