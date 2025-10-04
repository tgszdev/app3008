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
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json({
      associations: associations || []
    })

  } catch (error) {
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

    // Buscar informações do usuário
    const { data: targetUser, error: targetUserError } = await supabaseAdmin
      .from('users')
      .select('user_type, email')
      .eq('id', user_id)
      .single()

    if (targetUserError || !targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // TRAVA: Verificar se é usuário context e já tem associação
    if (targetUser.user_type === 'context') {
      const { count: existingCount } = await supabaseAdmin
        .from('user_contexts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user_id)

      if (existingCount && existingCount > 0) {
        return NextResponse.json({ 
          error: 'Usuário de cliente único já possui uma associação. Remova a associação existente antes de criar outra.',
          user_type: 'context',
          max_associations: 1,
          current_associations: existingCount
        }, { status: 400 })
      }
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
        // created_at gerenciado automaticamente pelo Supabase
      })
      .select(`
        *,
        users(id, name, email),
        contexts(id, name, type)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erro ao criar associação' }, { status: 500 })
    }

    // SINCRONIZAÇÃO: Atualizar context_id E dados do contexto no usuário
    // Buscar dados completos do contexto
    const { data: contextData } = await supabaseAdmin
      .from('contexts')
      .select('id, name, slug, type')
      .eq('id', context_id)
      .single()
    
    if (contextData) {
      const { error: updateUserError } = await supabaseAdmin
        .from('users')
        .update({ 
          context_id: contextData.id,
          context_name: contextData.name,
          context_slug: contextData.slug,
          context_type: contextData.type
        })
        .eq('id', user_id)

      if (updateUserError) {
        console.error('[user-contexts POST] Erro ao sincronizar users table:', updateUserError)
        // Não falhar a operação principal, mas retornar warning
        return NextResponse.json({
          association: newAssociation,
          message: 'Associação criada, mas houve erro na sincronização',
          warning: 'Sincronização parcial',
          error: updateUserError.message
        }, { status: 201 })
      }
      
      console.log('[user-contexts POST] Sincronização OK:', { user_id, context_id: contextData.id })
    }

    return NextResponse.json({
      association: newAssociation,
      message: 'Associação criada com sucesso'
    })

  } catch (error) {
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
      return NextResponse.json({ error: 'Erro ao remover associação' }, { status: 500 })
    }

    // SINCRONIZAÇÃO: Verificar se o usuário ainda tem outras associações
    const { data: remainingAssociations, error: checkError } = await supabaseAdmin
      .from('user_contexts')
      .select('context_id')
      .eq('user_id', user_id)
      .limit(1)

    if (checkError) {
      console.error('[user-contexts DELETE] Erro ao verificar associações restantes:', checkError)
    } else {
      // Se não há mais associações, limpar todos os campos de contexto do usuário
      if (!remainingAssociations || remainingAssociations.length === 0) {
        console.log('[user-contexts DELETE] Última associação removida, limpando users table:', user_id)
        
        const { error: updateUserError } = await supabaseAdmin
          .from('users')
          .update({ 
            context_id: null,
            context_name: null,
            context_slug: null,
            context_type: null
          })
          .eq('id', user_id)

        if (updateUserError) {
          console.error('[user-contexts DELETE] Erro ao limpar users table:', updateUserError)
          return NextResponse.json({
            message: 'Associação removida, mas houve erro na sincronização',
            warning: 'Sincronização parcial',
            error: updateUserError.message
          }, { status: 200 })
        }
        
        console.log('[user-contexts DELETE] Users table limpo com sucesso')
      } else {
        console.log('[user-contexts DELETE] Usuário ainda tem associações, mantendo context_id')
      }
    }

    return NextResponse.json({
      message: 'Associação removida com sucesso'
    })

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
