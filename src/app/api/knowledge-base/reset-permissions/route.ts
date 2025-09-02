import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Resetar todas as permissões e mostrar todas as categorias para todos
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    const userRole = (session.user as any)?.role
    
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem resetar permissões' }, { status: 403 })
    }

    console.log('Resetando permissões da base de conhecimento...')

    // Primeiro, buscar todas as categorias
    const { data: allCategories } = await supabaseAdmin
      .from('kb_categories')
      .select('id')
    
    const allCategoryIds = allCategories?.map(cat => cat.id) || []
    
    console.log(`Encontradas ${allCategoryIds.length} categorias`)

    // Deletar todas as permissões existentes
    const { error: deleteError } = await supabaseAdmin
      .from('kb_role_permissions')
      .delete()
      .neq('role', '')
    
    if (deleteError) {
      console.log('Erro ao deletar permissões antigas (pode não existir):', deleteError.message)
    }

    // Criar permissões padrão - todos os roles podem ver todas as categorias
    const roles = ['admin', 'analyst', 'user']
    
    for (const role of roles) {
      const { error: insertError } = await supabaseAdmin
        .from('kb_role_permissions')
        .insert({
          role,
          allowed_categories: [] // Array vazio significa acesso a todas as categorias
        })
      
      if (insertError) {
        console.log(`Erro ao inserir permissão para ${role}:`, insertError.message)
      } else {
        console.log(`Permissão resetada para ${role} - acesso a todas as categorias`)
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Permissões resetadas com sucesso. Todos os roles agora podem ver todas as ${allCategoryIds.length} categorias.`,
      categories_count: allCategoryIds.length,
      roles_updated: roles
    })

  } catch (error) {
    console.error('Erro ao resetar permissões:', error)
    return NextResponse.json(
      { error: 'Erro ao resetar permissões' },
      { status: 500 }
    )
  }
}