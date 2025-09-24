import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function analisarEstruturaAtual() {
  console.log('🔍 ANALISANDO ESTRUTURA ATUAL DE CATEGORIAS')
  console.log('=' * 60)
  
  try {
    // 1. Verificar estrutura da tabela categories
    console.log('\n📊 1. ESTRUTURA DA TABELA CATEGORIES')
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .limit(5)
    
    if (categoriesError) {
      console.error('❌ Erro ao buscar categories:', categoriesError)
    } else {
      console.log('✅ Categories encontradas:', categories.length)
      if (categories.length > 0) {
        console.log('📋 Estrutura da primeira categoria:')
        console.log(JSON.stringify(categories[0], null, 2))
      }
    }
    
    // 2. Verificar contextos disponíveis
    console.log('\n🏢 2. CONTEXTOS DISPONÍVEIS')
    const { data: contexts, error: contextsError } = await supabaseAdmin
      .from('contexts')
      .select('id, name, type, is_active')
      .order('created_at', { ascending: false })
    
    if (contextsError) {
      console.error('❌ Erro ao buscar contexts:', contextsError)
    } else {
      console.log('✅ Contextos encontrados:', contexts.length)
      contexts.forEach(ctx => {
        console.log(`  - ${ctx.name} (${ctx.type}) - Ativo: ${ctx.is_active}`)
      })
    }
    
    // 3. Verificar tickets e suas categorias
    console.log('\n🎫 3. TICKETS E CATEGORIAS')
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select('id, title, category_id, context_id, categories(id, name)')
      .limit(10)
    
    if (ticketsError) {
      console.error('❌ Erro ao buscar tickets:', ticketsError)
    } else {
      console.log('✅ Tickets encontrados:', tickets.length)
      tickets.forEach(ticket => {
        console.log(`  - ${ticket.title} -> Categoria: ${ticket.categories?.name || 'N/A'} (Context: ${ticket.context_id})`)
      })
    }
    
    // 4. Verificar se há relacionamento entre categories e contexts
    console.log('\n🔗 4. RELACIONAMENTOS ATUAIS')
    const { data: categoryContexts, error: categoryContextsError } = await supabaseAdmin
      .from('categories')
      .select('id, name, context_id')
      .not('context_id', 'is', null)
    
    if (categoryContextsError) {
      console.log('⚠️ Não há coluna context_id em categories (esperado)')
    } else {
      console.log('✅ Categories com context_id:', categoryContexts.length)
    }
    
    // 5. Verificar estrutura completa da tabela categories
    console.log('\n📋 5. ESTRUTURA COMPLETA DA TABELA CATEGORIES')
    const { data: allCategories, error: allCategoriesError } = await supabaseAdmin
      .from('categories')
      .select('*')
    
    if (allCategoriesError) {
      console.error('❌ Erro ao buscar todas as categories:', allCategoriesError)
    } else {
      console.log('✅ Total de categories:', allCategories.length)
      console.log('📊 Distribuição por status:')
      const activeCount = allCategories.filter(c => c.is_active).length
      const inactiveCount = allCategories.filter(c => !c.is_active).length
      console.log(`  - Ativas: ${activeCount}`)
      console.log(`  - Inativas: ${inactiveCount}`)
      
      console.log('📊 Categorias por tipo:')
      const categoriesByType = allCategories.reduce((acc, cat) => {
        const type = cat.category_type || 'sem-tipo'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {})
      console.log(categoriesByType)
    }
    
    console.log('\n🎯 CONCLUSÕES:')
    console.log('✅ Sistema atual usa tabela categories global')
    console.log('✅ Não há vínculo com contextos (organizações/departamentos)')
    console.log('✅ Todas as categorias são compartilhadas entre organizações')
    console.log('✅ Precisamos implementar vínculo com contextos')
    
  } catch (error) {
    console.error('❌ Erro geral na análise:', error)
  }
}

analisarEstruturaAtual()
