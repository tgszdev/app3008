import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Buscar permissões de categorias por perfil
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    const userRole = (session.user as any)?.role
    
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem ver estas configurações' }, { status: 403 })
    }

    // Buscar permissões salvas
    const { data: permissions, error } = await supabaseAdmin
      .from('kb_role_permissions')
      .select('*')
    
    if (error) {
      console.log('Erro ao buscar permissões (tabela pode não existir):', error)
      // Se a tabela não existir, retornar permissões padrão
      return NextResponse.json({ 
        permissions: [
          { role: 'admin', categories: [] },
          { role: 'analyst', categories: [] },
          { role: 'user', categories: [] }
        ]
      })
    }

    // Formatar as permissões
    const formattedPermissions = ['admin', 'analyst', 'user'].map(role => {
      const rolePermission = permissions?.find(p => p.role === role)
      return {
        role,
        categories: rolePermission?.allowed_categories || []
      }
    })

    return NextResponse.json({ permissions: formattedPermissions })

  } catch (error) {
    console.error('Erro ao buscar permissões:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar permissões' },
      { status: 500 }
    )
  }
}

// POST - Salvar permissões de categorias por perfil
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    const userRole = (session.user as any)?.role
    
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem alterar estas configurações' }, { status: 403 })
    }

    const body = await request.json()
    const { permissions } = body

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Permissões inválidas' },
        { status: 400 }
      )
    }

    // Verificar se a tabela existe, se não, criar
    const { error: tableCheckError } = await supabaseAdmin
      .from('kb_role_permissions')
      .select('id')
      .limit(1)
    
    if (tableCheckError?.message?.includes('does not exist')) {
      // Criar tabela
      const { error: createTableError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS kb_role_permissions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            role VARCHAR(50) UNIQUE NOT NULL,
            allowed_categories UUID[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          
          -- Desabilitar RLS para simplificar
          ALTER TABLE kb_role_permissions DISABLE ROW LEVEL SECURITY;
        `
      })
      
      if (createTableError) {
        console.error('Erro ao criar tabela:', createTableError)
        return NextResponse.json({
          error: 'Tabela de permissões não existe. Execute o script SQL abaixo no Supabase:',
          sql: `
CREATE TABLE IF NOT EXISTS kb_role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role VARCHAR(50) UNIQUE NOT NULL,
  allowed_categories UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE kb_role_permissions DISABLE ROW LEVEL SECURITY;
          `
        }, { status: 500 })
      }
    }

    // Salvar ou atualizar permissões para cada role
    for (const permission of permissions) {
      const { role, categories } = permission
      
      // Usar upsert para inserir ou atualizar
      const { error } = await supabaseAdmin
        .from('kb_role_permissions')
        .upsert({
          role,
          allowed_categories: categories,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'role'
        })
      
      if (error) {
        console.error(`Erro ao salvar permissões para ${role}:`, error)
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Permissões salvas com sucesso'
    })

  } catch (error) {
    console.error('Erro ao salvar permissões:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar permissões' },
      { status: 500 }
    )
  }
}