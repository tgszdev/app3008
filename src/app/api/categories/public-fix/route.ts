import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Endpoint público temporário para categorias (FIX URGENTE)
export async function GET(request: Request) {
  try {
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active_only') === 'true'

    // Buscar categorias ativas
    let query = supabaseAdmin
      .from('categories')
      .select(`
        id,
        name,
        slug,
        description,
        icon,
        color,
        is_active,
        display_order,
        is_global,
        context_id
      `)

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    query = query.order('display_order', { ascending: true })

    const { data: categories, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }


    return NextResponse.json(categories || [])

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
