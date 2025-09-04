import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// GET - Listar todos os usuários
export async function GET(request: NextRequest) {
  try {
    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Variáveis de ambiente do Supabase não configuradas')
      
      // Retornar erro se Supabase não estiver configurado
      return NextResponse.json(
        { error: 'Banco de dados não configurado' },
        { status: 500 }
      )
    }

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      
      // Log mais detalhado
      console.error('Detalhes do erro:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      
      return NextResponse.json({ 
        error: error.message,
        code: error.code,
        hint: 'Verifique se as variáveis de ambiente estão configuradas no Vercel'
      }, { status: 500 })
    }

    // Remover password_hash dos resultados
    const sanitizedUsers = users?.map(({ password_hash, ...user }) => user) || []

    return NextResponse.json(sanitizedUsers)
  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      message: error.message,
      hint: 'Verifique as configurações do Supabase no Vercel'
    }, { status: 500 })
  }
}

// POST - Criar novo usuário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role, department, phone } = body

    // Validação básica
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o email já existe
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      )
    }

    // Hash da senha
    const password_hash = await bcrypt.hash(password, 10)

    // Criar usuário
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email,
        password_hash,
        role: role || 'user',
        department,
        phone,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar usuário:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Remover password_hash do resultado
    const { password_hash: _, ...sanitizedUser } = newUser

    return NextResponse.json(sanitizedUser, { status: 201 })
  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PATCH - Atualizar usuário
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Remover campos que não devem ser atualizados diretamente
    delete updateData.password
    delete updateData.password_hash
    delete updateData.id
    delete updateData.created_at

    // Adicionar updated_at
    updateData.updated_at = new Date().toISOString()

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar usuário:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Remover password_hash do resultado
    const { password_hash, ...sanitizedUser } = updatedUser

    return NextResponse.json(sanitizedUser)
  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Excluir usuário
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se não é o admin principal
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', id)
      .single()

    if (user?.email === 'admin@example.com') {
      return NextResponse.json(
        { error: 'Não é possível excluir o administrador principal' },
        { status: 403 }
      )
    }

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir usuário:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro no servidor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export const runtime = 'nodejs'