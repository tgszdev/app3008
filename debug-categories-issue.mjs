import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function debugCategoriesIssue() {
  console.log('🔍 DEBUG DETALHADO DO PROBLEMA DAS CATEGORIAS')
  console.log('==============================================')
  
  try {
    // 1. Buscar dados exatamente como a API faz
    console.log('\n🔍 1. BUSCANDO DADOS COMO A API:')
    
    const startDate = '2025-09-01'
    const endDate = '2025-09-30'
    
    // Buscar status da tabela
    const { data: statuses } = await supabase
      .from('ticket_statuses')
      .select('id, name, slug, color, order_index')
      .order('order_index', { ascending: true })
    
    const statusList = statuses || []
    console.log(`✅ ${statusList.length} status carregados`)
    
    // Buscar tickets com categorias
    const { data: tickets } = await supabase
      .from('tickets')
      .select(`
        id,
        status,
        created_at,
        created_by,
        category_id,
        context_id,
        categories (
          id,
          name,
          icon,
          color
        )
      `)
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)
    
    console.log(`✅ ${tickets?.length || 0} tickets encontrados`)
    
    // 2. Processar categorias exatamente como a API
    console.log('\n🔧 2. PROCESSANDO CATEGORIAS COMO A API:')
    
    const totalTickets = tickets?.length || 0
    const categoryStats = new Map()
    
    // Processar tickets
    tickets?.forEach((ticket) => {
      const category = ticket.categories
      const categoryId = category?.id || 'uncategorized'
      const categoryName = category?.name || 'Sem Categoria'
      const categoryIcon = category?.icon || 'folder'
      const categoryColor = category?.color || '#6B7280'
      
      if (!categoryStats.has(categoryId)) {
        categoryStats.set(categoryId, {
          id: categoryId,
          name: categoryName,
          icon: categoryIcon,
          color: categoryColor,
          count: 0,
          statusCounts: new Map()
        })
      }
      
      const stats = categoryStats.get(categoryId)
      stats.count++
      
      const ticketStatus = ticket.status
      const currentCount = stats.statusCounts.get(ticketStatus) || 0
      stats.statusCounts.set(ticketStatus, currentCount + 1)
    })
    
    console.log(`✅ ${categoryStats.size} categorias processadas`)
    
    // 3. Aplicar lógica dinâmica para cada categoria
    console.log('\n🔧 3. APLICANDO LÓGICA DINÂMICA:')
    
    const categoriesArray = Array.from(categoryStats.values()).map(cat => {
      console.log(`\n📁 Processando categoria: ${cat.name} (${cat.count} tickets)`)
      
      // Criar status breakdown com todos os status disponíveis
      const statusBreakdown = {}
      const statusBreakdownDetailed = []
      
      // Usar sistema dinâmico para status das categorias
      const uniqueCategoryStatuses = [...new Set(Array.from(cat.statusCounts.keys()))]
      console.log(`  Status únicos:`, uniqueCategoryStatuses)
      
      uniqueCategoryStatuses.forEach(ticketStatus => {
        const count = cat.statusCounts.get(ticketStatus) || 0
        console.log(`  Processando status: ${ticketStatus} (${count} tickets)`)
        
        if (count > 0) {
          const existingStatus = statusList.find(s => s.slug === ticketStatus)
          
          if (existingStatus) {
            console.log(`    ✅ Encontrado na tabela: ${existingStatus.name}`)
            statusBreakdown[existingStatus.slug] = count
            statusBreakdownDetailed.push({
              slug: existingStatus.slug,
              name: existingStatus.name,
              color: existingStatus.color,
              count: count,
              order_index: existingStatus.order_index
            })
          } else {
            console.log(`    ⚡ Criando dinâmico: ${ticketStatus}`)
            const dynamicName = ticketStatus
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
            
            statusBreakdown[ticketStatus] = count
            statusBreakdownDetailed.push({
              slug: ticketStatus,
              name: dynamicName,
              color: '#6B7280',
              count: count,
              order_index: 999
            })
          }
        }
      })
      
      // Ordenar por order_index
      statusBreakdownDetailed.sort((a, b) => a.order_index - b.order_index)
      
      console.log(`  Status finais: ${statusBreakdownDetailed.length}`)
      statusBreakdownDetailed.forEach(status => {
        console.log(`    - ${status.name}: ${status.count} tickets`)
      })
      
      return {
        id: cat.id,
        nome: cat.name,
        icon: cat.icon,
        color: cat.color,
        quantidade: cat.count,
        percentual: totalTickets > 0 ? parseFloat(((cat.count / totalTickets) * 100).toFixed(2)) : 0,
        status_breakdown: statusBreakdown,
        status_breakdown_detailed: statusBreakdownDetailed
      }
    })
    
    // Ordenar por quantidade
    categoriesArray.sort((a, b) => b.quantidade - a.quantidade)
    
    // 4. Verificar resultado final
    console.log('\n📊 4. RESULTADO FINAL:')
    categoriesArray.forEach((cat, index) => {
      console.log(`\n📁 Categoria ${index + 1}: ${cat.nome}`)
      console.log(`  Quantidade: ${cat.quantidade} tickets`)
      console.log(`  Percentual: ${cat.percentual}%`)
      console.log(`  Status breakdown:`, cat.status_breakdown)
      console.log(`  Status detalhados: ${cat.status_breakdown_detailed.length}`)
      
      if (cat.status_breakdown_detailed.length === 0) {
        console.log(`  ❌ PROBLEMA: Categoria sem status!`)
      } else {
        cat.status_breakdown_detailed.forEach(status => {
          console.log(`    - ${status.name}: ${status.count} tickets`)
        })
      }
    })
    
    // 5. Verificar se há problemas específicos
    console.log('\n🔍 5. VERIFICAÇÃO DE PROBLEMAS:')
    
    const problemCategories = categoriesArray.filter(cat => cat.status_breakdown_detailed.length === 0)
    
    if (problemCategories.length > 0) {
      console.log(`❌ ${problemCategories.length} categorias sem status:`)
      problemCategories.forEach(cat => {
        console.log(`  - ${cat.nome}: ${cat.quantidade} tickets`)
        console.log(`    Status únicos:`, Object.keys(cat.status_breakdown))
      })
    } else {
      console.log(`✅ Todas as categorias têm status`)
    }
    
    // 6. Verificar se o problema está na lógica de filtro
    console.log('\n🔍 6. VERIFICAÇÃO DA LÓGICA DE FILTRO:')
    
    for (const [categoryId, cat] of categoryStats.entries()) {
      console.log(`\n📁 ${cat.name}:`)
      console.log(`  Total tickets: ${cat.count}`)
      console.log(`  Status únicos:`, Array.from(cat.statusCounts.keys()))
      
      const statusWithCount = Array.from(cat.statusCounts.entries()).filter(([status, count]) => count > 0)
      console.log(`  Status com count > 0:`, statusWithCount)
      
      if (statusWithCount.length === 0) {
        console.log(`  ❌ PROBLEMA: Nenhum status com count > 0`)
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugCategoriesIssue()
