import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verificarUsuarioAgro() {
  console.log('👤 VERIFICANDO USUÁRIO AGRO')
  console.log('=' * 50)
  
  try {
    // 1. Buscar usuário agro
    console.log('\n🔍 1. BUSCANDO USUÁRIO AGRO')
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .eq('email', 'agro@agro.com.br')
      .single()
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError)
      return false
    }
    
    if (!user) {
      console.log('❌ Usuário agro não encontrado')
      return false
    }
    
    console.log('✅ Usuário agro encontrado:')
    console.log(`  - Nome: ${user.name}`)
    console.log(`  - Email: ${user.email}`)
    console.log(`  - Role: ${user.role}`)
    console.log(`  - User Type: ${user.user_type}`)
    console.log(`  - Context ID: ${user.context_id}`)
    console.log(`  - Contexto: ${user.contexts?.name || 'N/A'}`)
    console.log(`  - Ativo: ${user.is_active}`)
    
    // 2. Verificar se o usuário tem acesso ao contexto correto
    console.log('\n🔗 2. VERIFICANDO ACESSO AO CONTEXTO')
    
    if (user.context_id) {
      const { data: context, error: contextError } = await supabaseAdmin
        .from('contexts')
        .select('*')
        .eq('id', user.context_id)
        .single()
      
      if (contextError) {
        console.error('❌ Erro ao buscar contexto:', contextError)
      } else if (context) {
        console.log('✅ Contexto do usuário:')
        console.log(`  - Nome: ${context.name}`)
        console.log(`  - Tipo: ${context.type}`)
        console.log(`  - Ativo: ${context.is_active}`)
      }
    }
    
    // 3. Verificar categorias que o usuário deveria ver
    console.log('\n📋 3. VERIFICANDO CATEGORIAS DISPONÍVEIS')
    
    // Categorias globais
    const { data: globalCategories, error: globalError } = await supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .eq('is_global', true)
      .eq('is_active', true)
    
    if (globalError) {
      console.error('❌ Erro ao buscar categorias globais:', globalError)
    } else {
      console.log(`✅ Categorias globais: ${globalCategories?.length || 0}`)
      if (globalCategories && globalCategories.length > 0) {
        globalCategories.forEach(cat => {
          console.log(`  - ${cat.name} (Global)`)
        })
      }
    }
    
    // Categorias do contexto do usuário
    if (user.context_id) {
      const { data: contextCategories, error: contextCatError } = await supabaseAdmin
        .from('categories')
        .select(`
          *,
          contexts(id, name, type, slug)
        `)
        .eq('context_id', user.context_id)
        .eq('is_active', true)
      
      if (contextCatError) {
        console.error('❌ Erro ao buscar categorias do contexto:', contextCatError)
      } else {
        console.log(`✅ Categorias do contexto: ${contextCategories?.length || 0}`)
        if (contextCategories && contextCategories.length > 0) {
          contextCategories.forEach(cat => {
            console.log(`  - ${cat.name} (${cat.contexts?.name || 'Sem contexto'})`)
          })
        }
      }
    }
    
    // 4. Simular a query que a API deveria fazer
    console.log('\n🔍 4. SIMULANDO QUERY DA API')
    
    let query = supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug),
        parent_category:parent_category_id(id, name, slug)
      `)
      .eq('is_active', true)
    
    // Aplicar filtro baseado no tipo de usuário
    if (user.user_type === 'context' && user.context_id) {
      // Usuários context veem categorias globais + do seu contexto
      query = query.or(`is_global.eq.true,context_id.eq.${user.context_id}`)
    } else if (user.user_type === 'matrix') {
      // Usuários matrix veem todas as categorias
      // Não adicionar filtro
    } else {
      // Fallback: apenas categorias globais
      query = query.eq('is_global', true)
    }
    
    query = query.order('display_order', { ascending: true })
    
    const { data: finalCategories, error: finalError } = await query
    
    if (finalError) {
      console.error('❌ Erro na query final:', finalError)
    } else {
      console.log(`✅ Categorias que o usuário deveria ver: ${finalCategories?.length || 0}`)
      if (finalCategories && finalCategories.length > 0) {
        finalCategories.forEach(cat => {
          const type = cat.is_global ? '🌐 Global' : '🏢 Específica'
          const context = cat.contexts?.name || 'Sem contexto'
          console.log(`  - ${cat.name} (${type}) - ${context}`)
        })
        
        // Verificar se a categoria da Agro está presente
        const agroCategory = finalCategories.find(cat => 
          cat.contexts?.name?.toLowerCase().includes('agro') || 
          cat.name?.toLowerCase().includes('agro')
        )
        
        if (agroCategory) {
          console.log('\n✅ CATEGORIA DA AGRO ENCONTRADA NA QUERY:')
          console.log(`  - Nome: ${agroCategory.name}`)
          console.log(`  - Contexto: ${agroCategory.contexts?.name}`)
          console.log(`  - Global: ${agroCategory.is_global}`)
        } else {
          console.log('\n❌ CATEGORIA DA AGRO NÃO ENCONTRADA NA QUERY')
        }
      }
    }
    
    console.log('\n🎯 VERIFICAÇÃO CONCLUÍDA!')
    console.log('📋 RESUMO:')
    console.log(`- Usuário: ${user.name} (${user.email})`)
    console.log(`- Tipo: ${user.user_type}`)
    console.log(`- Contexto: ${user.contexts?.name || 'N/A'}`)
    console.log(`- Categorias disponíveis: ${finalCategories?.length || 0}`)
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral na verificação:', error)
    return false
  }
}

verificarUsuarioAgro()
