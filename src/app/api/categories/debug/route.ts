import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Debug endpoint para verificar autenticação
export async function GET(request: Request) {
  try {
    console.log('🔍 Debug endpoint de categorias chamado')
    
    // Tentar autenticação
    let session = null
    try {
      session = await auth()
      console.log('🔍 Sessão encontrada:', !!session)
      console.log('🔍 Usuário ID:', session?.user?.id)
      console.log('🔍 Email:', session?.user?.email)
    } catch (authError: any) {
      console.log('❌ Erro na autenticação:', authError.message)
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
      console.error('❌ Erro ao buscar categorias:', error)
      return NextResponse.json({ 
        error: 'Database Error', 
        details: error.message 
      }, { status: 500 })
    }

    console.log('✅ Categorias encontradas:', categories?.length || 0)

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
    console.error('❌ Erro geral no debug:', error)
    return NextResponse.json({ 
      error: 'General Error', 
      details: error.message 
    }, { status: 500 })
  }
}
