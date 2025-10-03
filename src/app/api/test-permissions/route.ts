import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getRolePermissions } from '@/lib/permissions'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const userRole = session.user.role_name || session.user.role || 'user'
    
    // Buscar permissões da role
    const permissions = await getRolePermissions(userRole)
    
    // Lista completa das 24 permissões
    const allPermissions = [
      // Tickets (7 permissões)
      { key: 'tickets_view', label: 'Visualizar Tickets', category: 'Tickets' },
      { key: 'tickets_create', label: 'Criar Tickets', category: 'Tickets' },
      { key: 'tickets_edit_own', label: 'Editar Próprios Tickets', category: 'Tickets' },
      { key: 'tickets_edit_all', label: 'Editar Todos os Tickets', category: 'Tickets' },
      { key: 'tickets_delete', label: 'Excluir Tickets', category: 'Tickets' },
      { key: 'tickets_assign', label: 'Atribuir Tickets', category: 'Tickets' },
      { key: 'tickets_close', label: 'Fechar Tickets', category: 'Tickets' },
      
      // Base de Conhecimento (5 permissões)
      { key: 'kb_view', label: 'Visualizar Base de Conhecimento', category: 'Base de Conhecimento' },
      { key: 'kb_create', label: 'Criar Artigos', category: 'Base de Conhecimento' },
      { key: 'kb_edit', label: 'Editar Artigos', category: 'Base de Conhecimento' },
      { key: 'kb_delete', label: 'Excluir Artigos', category: 'Base de Conhecimento' },
      { key: 'kb_manage_categories', label: 'Gerenciar Categorias', category: 'Base de Conhecimento' },
      
      // Apontamentos/Timesheets (7 permissões)
      { key: 'timesheets_view_own', label: 'Ver Próprios Apontamentos', category: 'Apontamentos' },
      { key: 'timesheets_view_all', label: 'Ver Todos os Apontamentos', category: 'Apontamentos' },
      { key: 'timesheets_create', label: 'Criar Apontamentos', category: 'Apontamentos' },
      { key: 'timesheets_edit_own', label: 'Editar Próprios Apontamentos', category: 'Apontamentos' },
      { key: 'timesheets_edit_all', label: 'Editar Todos os Apontamentos', category: 'Apontamentos' },
      { key: 'timesheets_approve', label: 'Aprovar Apontamentos', category: 'Apontamentos' },
      { key: 'timesheets_analytics', label: 'Ver Analytics', category: 'Apontamentos' },
      
      // Sistema (5 permissões)
      { key: 'system_settings', label: 'Configurações do Sistema', category: 'Sistema' },
      { key: 'system_users', label: 'Gerenciar Usuários', category: 'Sistema' },
      { key: 'system_roles', label: 'Gerenciar Perfis', category: 'Sistema' },
      { key: 'system_backup', label: 'Backup e Restauração', category: 'Sistema' },
      { key: 'system_logs', label: 'Visualizar Logs', category: 'Sistema' }
    ]
    
    // Verificar status de cada permissão
    const permissionStatus = allPermissions.map(perm => ({
      ...perm,
      status: permissions ? permissions[perm.key] : false,
      statusText: permissions ? (permissions[perm.key] ? '✅ Ativa' : '❌ Inativa') : '⚠️ Não carregada'
    }))
    
    // Agrupar por categoria
    const groupedPermissions = permissionStatus.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = []
      }
      acc[perm.category].push(perm)
      return acc
    }, {} as Record<string, typeof permissionStatus>)
    
    // Estatísticas
    const stats = {
      total: allPermissions.length,
      active: permissionStatus.filter(p => p.status).length,
      inactive: permissionStatus.filter(p => !p.status).length,
      loaded: permissions !== null
    }
    
    return NextResponse.json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: userRole
      },
      stats,
      permissions: groupedPermissions,
      rawPermissions: permissions,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Erro ao testar permissões',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}