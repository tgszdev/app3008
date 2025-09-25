import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function removerCategoriasGlobais() {
  console.log('🗑️ REMOVENDO CATEGORIAS GLOBAIS')
  console.log('=' * 40)
  
  try {
    // 1. Verificar categorias globais existentes
    console.log('\n🔍 1. VERIFICANDO CATEGORIAS GLOBAIS EXISTENTES')
    
    const { data: globalCategories, error: globalError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_global', true)
      .eq('is_active', true)
    
    if (globalError) {
      console.error('❌ Erro ao buscar categorias globais:', globalError)
      return false
    }
    
    console.log(`✅ Categorias globais encontradas: ${globalCategories?.length || 0}`)
    
    if (globalCategories && globalCategories.length > 0) {
      globalCategories.forEach(cat => {
        console.log(`  - ${cat.name} (ID: ${cat.id})`)
      })
      
      // 2. Remover categorias globais
      console.log('\n🗑️ 2. REMOVENDO CATEGORIAS GLOBAIS')
      
      const { error: deleteError } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('is_global', true)
        .eq('is_active', true)
      
      if (deleteError) {
        console.error('❌ Erro ao remover categorias globais:', deleteError)
        return false
      }
      
      console.log('✅ Categorias globais removidas com sucesso!')
    } else {
      console.log('✅ Nenhuma categoria global encontrada')
    }
    
    // 3. Verificar categorias específicas restantes
    console.log('\n📋 3. VERIFICANDO CATEGORIAS ESPECÍFICAS RESTANTES')
    
    const { data: specificCategories, error: specificError } = await supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .eq('is_global', false)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    
    if (specificError) {
      console.error('❌ Erro ao buscar categorias específicas:', specificError)
    } else {
      console.log(`✅ Categorias específicas restantes: ${specificCategories?.length || 0}`)
      
      if (specificCategories && specificCategories.length > 0) {
        console.log('\n📋 CATEGORIAS ESPECÍFICAS:')
        specificCategories.forEach((cat, index) => {
          const context = cat.contexts?.name || 'Sem contexto'
          console.log(`  ${index + 1}. ${cat.name} (${context})`)
        })
      }
    }
    
    // 4. Verificar o que o usuário agro deveria ver agora
    console.log('\n👤 4. VERIFICANDO VISÃO DO USUÁRIO AGRO')
    
    const userAgro = {
      id: 'agro-user-id',
      email: 'agro@agro.com.br',
      userType: 'context',
      contextId: '6486088e-72ae-461b-8b03-32ca84918882'
    }
    
    // Aplicar filtro da API (sem categorias globais)
    let query = supabaseAdmin
      .from('categories')
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .eq('is_active', true)
    
    if (userAgro.userType === 'context' && userAgro.contextId) {
      // Apenas categorias do contexto do usuário (sem globais)
      query = query.eq('context_id', userAgro.contextId)
    }
    
    query = query.order('display_order', { ascending: true })
    
    const { data: userCategories, error: userError } = await query
    
    if (userError) {
      console.error('❌ Erro na query do usuário:', userError)
    } else {
      console.log(`✅ Categorias que o usuário Agro deveria ver: ${userCategories?.length || 0}`)
      
      if (userCategories && userCategories.length > 0) {
        console.log('\n📋 CATEGORIAS DISPONÍVEIS PARA O USUÁRIO AGRO:')
        userCategories.forEach((cat, index) => {
          const context = cat.contexts?.name || 'Sem contexto'
          console.log(`  ${index + 1}. ${cat.name} (${context})`)
        })
      } else {
        console.log('❌ Nenhuma categoria disponível para o usuário agro')
        console.log('🔍 Isso explica por que não aparece no frontend')
      }
    }
    
    console.log('\n🎯 CATEGORIAS GLOBAIS REMOVIDAS!')
    console.log('📋 RESUMO:')
    console.log(`- Categorias globais removidas: ${globalCategories?.length || 0}`)
    console.log(`- Categorias específicas restantes: ${specificCategories?.length || 0}`)
    console.log(`- Categorias para usuário agro: ${userCategories?.length || 0}`)
    
    console.log('\n💡 PRÓXIMOS PASSOS:')
    console.log('1. ✅ Categorias globais removidas')
    console.log('2. 🔧 Testar login do usuário agro')
    console.log('3. 🎯 Verificar se a categoria "Agro Financeiro" aparece')
    console.log('4. 🔍 Se ainda não funcionar, verificar autenticação')
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return false
  }
}

removerCategoriasGlobais()
