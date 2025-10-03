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


    // Primeiro, buscar todas as categorias
    const { data: allCategories } = await supabaseAdmin
      .from('kb_categories')
      .select('id')
    
    const allCategoryIds = allCategories?.map(cat => cat.id) || []
    

    // Deletar todas as permissões existentes
    const { error: deleteError } = await supabaseAdmin
      .from('kb_role_permissions')
      .delete()
      .neq('role', '')
    
    if (deleteError) {
    }

    // Não criar nenhuma permissão - sem registros significa sem acesso
    // Quando o admin configurar, ele definirá as permissões específicas

    return NextResponse.json({ 
      success: true,
      message: `Permissões resetadas com sucesso. Todos os roles agora podem ver todas as ${allCategoryIds.length} categorias.`,
      categories_count: allCategoryIds.length,
      roles_updated: ['admin', 'agent', 'user']
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao resetar permissões' },
      { status: 500 }
    )
  }
}