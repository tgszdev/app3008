import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// PUT - Alterar senha de usuário (apenas admin)
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação e autorização
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado - Faça login' },
        { status: 401 }
      )
    }

    // Verificar se o usuário atual é admin
    const currentUserRole = (session.user as any)?.role
    if (currentUserRole !== 'admin') {
      return NextResponse.json(
        { error: 'Não autorizado - Apenas administradores podem alterar senhas' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, newPassword } = body

    // Validação básica
    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'ID do usuário e nova senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Hash da nova senha
    const password_hash = await bcrypt.hash(newPassword, 10)

    // Atualizar a senha
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        password_hash,
        // updated_at gerenciado automaticamente pelo Supabase
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar senha' },
        { status: 500 }
      )
    }

    // Log da ação
    console.log(`Senha alterada para usuário ${user.email} por admin ${session.user?.email}`)

    return NextResponse.json({ 
      success: true,
      message: `Senha alterada com sucesso para ${user.name}`
    })

  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'