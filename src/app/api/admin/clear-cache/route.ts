import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { clearPermissionsCache } from '@/lib/permissions'

export async function POST() {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Limpar cache de permissões
    clearPermissionsCache()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cache de permissões limpo com sucesso' 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao limpar cache' },
      { status: 500 }
    )
  }
}