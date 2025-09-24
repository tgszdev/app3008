import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Listar contextos disponíveis para categorias
export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar todos os contextos ativos
    const { data: contexts, error } = await supabaseAdmin
      .from('contexts')
      .select('id, name, type, slug, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching contexts:', error)
      return NextResponse.json({ error: 'Failed to fetch contexts' }, { status: 500 })
    }

    // Separar por tipo
    const organizations = contexts?.filter(ctx => ctx.type === 'organization') || []
    const departments = contexts?.filter(ctx => ctx.type === 'department') || []

    return NextResponse.json({
      organizations,
      departments,
      all: contexts || []
    })
  } catch (error) {
    console.error('Contexts for categories GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
