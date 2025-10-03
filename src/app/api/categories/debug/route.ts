import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Debug endpoint para verificar autenticação
export async function GET(request: Request) {
  try {
    
    // Tentar autenticação
    let session = null
    try {
      session = await auth()
    } catch (authError: any) {
      return NextResponse.json({ 
        error: 'Auth Error', 
        details: authError.message,
        session: null
      }, { status: 401 })
    }
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'No Session', 
        session: null
      }, { status: 401 })
    }

    // Buscar categorias diretamente
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      return NextResponse.json({ 
        error: 'Database Error', 
        details: error.message 
      }, { status: 500 })
    }


    return NextResponse.json({
      success: true,
      categories: categories || [],
      count: categories?.length || 0,
      user: {
        id: session.user.id,
        email: session.user.email
      }
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'General Error', 
      details: error.message 
    }, { status: 500 })
  }
}
