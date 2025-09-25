import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - API dinâmica de categorias (SEM HARDCODING)
export async function GET(request: Request) {
  try {
    console.log('🔧 API DINÂMICA DE CATEGORIAS (SEM HARDCODING)')
    
    // 1. Autenticação real
    const session = await auth()
    
    if (!session?.user?.id) {
      console.log('❌ Usuário não autenticado')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ Usuário autenticado:', session.user.email)

    // 2. Buscar dados completos do usuário
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, user_type, context_id, role, is_active')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      console.error('❌ Erro ao buscar dados do usuário:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('✅ Dados do usuário:', {
      user_type: userData.user_type,
      context_id: userData.context_id,
      role: userData.role
    })

    // 3. Aplicar regras dinâmicas baseadas no tipo de usuário
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
      .eq('is_active', true)

    // 4. Lógica dinâmica por tipo de usuário
    if (userData.user_type === 'context') {
      // Usuário context: categorias globais + do seu contexto
      console.log('🔍 Usuário context - aplicando filtro por contexto')
      
      if (userData.context_id) {
        query = query.or(`is_global.eq.true,context_id.eq.${userData.context_id}`)
        console.log('✅ Filtro aplicado: globais + contexto', userData.context_id)
      } else {
        // Se não tem contexto, apenas globais
        query = query.eq('is_global', true)
        console.log('⚠️ Usuário context sem contexto - apenas globais')
      }
      
    } else if (userData.user_type === 'matrix') {
      // Usuário matrix: categorias globais + de todos os contextos associados
      console.log('🔍 Usuário matrix - buscando contextos associados')
      
      // Buscar contextos associados ao usuário matrix
      const { data: userContexts, error: userContextsError } = await supabaseAdmin
        .from('user_contexts')
        .select('context_id')
        .eq('user_id', userData.id)

      if (userContextsError) {
        console.log('⚠️ Erro ao buscar contextos do usuário matrix:', userContextsError.message)
        // Fallback: apenas categorias globais
        query = query.eq('is_global', true)
        console.log('⚠️ Fallback: apenas categorias globais')
      } else if (userContexts.length === 0) {
        // Se não tem contextos associados, apenas globais
        query = query.eq('is_global', true)
        console.log('⚠️ Usuário matrix sem contextos associados - apenas globais')
      } else {
        // Filtrar por contextos associados + globais
        const contextIds = userContexts.map(uc => uc.context_id)
        query = query.or(`is_global.eq.true,context_id.in.(${contextIds.join(',')})`)
        console.log('✅ Filtro aplicado: globais + contextos', contextIds)
      }
      
    } else {
      // Tipo desconhecido: apenas globais
      console.log('⚠️ Tipo de usuário desconhecido - apenas globais')
      query = query.eq('is_global', true)
    }

    // 5. Executar query
    query = query.order('display_order', { ascending: true })

    const { data: categories, error } = await query

    if (error) {
      console.error('❌ Erro ao buscar categorias:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    console.log('✅ Categorias encontradas:', categories?.length || 0)

    // 6. Log detalhado para debug
    if (categories && categories.length > 0) {
      console.log('📋 Categorias retornadas:')
      categories.forEach(cat => {
        const type = cat.is_global ? 'Global' : 'Específica'
        console.log(`  - ${cat.name} (${type})`)
      })
    }

    return NextResponse.json(categories || [])

  } catch (error: any) {
    console.error('❌ Erro geral na API dinâmica:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
