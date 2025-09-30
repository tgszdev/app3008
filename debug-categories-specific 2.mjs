import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function debugCategoriesSpecific() {
  console.log('🔍 DEBUG ESPECÍFICO DA SEÇÃO CATEGORIAS')
  console.log('========================================')
  
  try {
    // 1. Buscar dados exatamente como a API categories-stats faz
    console.log('\n🔍 1. BUSCANDO DADOS COMO A API CATEGORIES-STATS:')
    
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
    console.log('\n🔧 2. PROCESSANDO CATEGORIAS:')
    
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
    
    // 3. Verificar especificamente a categoria "Impressão"
    console.log('\n🔍 3. VERIFICANDO CATEGORIA "IMPRESSÃO":')
    
    const impressaoCategory = Array.from(categoryStats.values()).find(cat => cat.name === 'Impressão')
    
    if (impressaoCategory) {
      console.log(`📁 Categoria Impressão encontrada:`)
      console.log(`  ID: ${impressaoCategory.id}`)
      console.log(`  Nome: ${impressaoCategory.name}`)
      console.log(`  Total tickets: ${impressaoCategory.count}`)
      console.log(`  Status únicos:`, Array.from(impressaoCategory.statusCounts.keys()))
      
      const statusWithCount = Array.from(impressaoCategory.statusCounts.entries()).filter(([status, count]) => count > 0)
      console.log(`  Status com count > 0:`, statusWithCount)
      
      // Aplicar lógica dinâmica para esta categoria
      const uniqueCategoryStatuses = [...new Set(Array.from(impressaoCategory.statusCounts.keys()))]
      const statusBreakdownDetailed = []
      
      console.log(`\n🔧 Aplicando lógica dinâmica:`)
      uniqueCategoryStatuses.forEach(ticketStatus => {
        const count = impressaoCategory.statusCounts.get(ticketStatus) || 0
        console.log(`  Processando status: ${ticketStatus} (${count} tickets)`)
        
        if (count > 0) {
          const existingStatus = statusList.find(s => s.slug === ticketStatus)
          
          if (existingStatus) {
            console.log(`    ✅ Encontrado na tabela: ${existingStatus.name}`)
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
      
      console.log(`\n📊 Resultado para categoria Impressão:`)
      console.log(`  Status detalhados: ${statusBreakdownDetailed.length}`)
      statusBreakdownDetailed.forEach(status => {
        console.log(`    - ${status.name}: ${status.count} tickets`)
      })
      
      if (statusBreakdownDetailed.length === 0) {
        console.log(`  ❌ PROBLEMA: Categoria Impressão sem status!`)
      } else {
        console.log(`  ✅ Categoria Impressão tem ${statusBreakdownDetailed.length} status`)
      }
    } else {
      console.log(`❌ Categoria Impressão não encontrada!`)
    }
    
    // 4. Verificar todas as categorias
    console.log('\n🔍 4. VERIFICANDO TODAS AS CATEGORIAS:')
    
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
    
    // 5. Simular resposta da API categories-stats
    console.log('\n📤 5. SIMULANDO RESPOSTA DA API:')
    
    const categoriesArray = Array.from(categoryStats.values()).map(cat => {
      const uniqueCategoryStatuses = [...new Set(Array.from(cat.statusCounts.keys()))]
      const statusBreakdownDetailed = []
      
      uniqueCategoryStatuses.forEach(ticketStatus => {
        const count = cat.statusCounts.get(ticketStatus) || 0
        
        if (count > 0) {
          const existingStatus = statusList.find(s => s.slug === ticketStatus)
          
          if (existingStatus) {
            statusBreakdownDetailed.push({
              slug: existingStatus.slug,
              name: existingStatus.name,
              color: existingStatus.color,
              count: count,
              order_index: existingStatus.order_index
            })
          } else {
            const dynamicName = ticketStatus
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
            
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
      
      statusBreakdownDetailed.sort((a, b) => a.order_index - b.order_index)
      
      return {
        id: cat.id,
        nome: cat.name,
        icon: cat.icon,
        color: cat.color,
        quantidade: cat.count,
        percentual: totalTickets > 0 ? parseFloat(((cat.count / totalTickets) * 100).toFixed(2)) : 0,
        status_breakdown_detailed: statusBreakdownDetailed
      }
    })
    
    // Ordenar por quantidade
    categoriesArray.sort((a, b) => b.quantidade - a.quantidade)
    
    console.log(`\n📊 RESPOSTA FINAL DA API:`)
    categoriesArray.forEach((cat, index) => {
      console.log(`\n📁 Categoria ${index + 1}: ${cat.nome}`)
      console.log(`  Quantidade: ${cat.quantidade} tickets`)
      console.log(`  Percentual: ${cat.percentual}%`)
      console.log(`  Status detalhados: ${cat.status_breakdown_detailed.length}`)
      
      if (cat.status_breakdown_detailed.length === 0) {
        console.log(`  ❌ PROBLEMA: Categoria sem status!`)
      } else {
        cat.status_breakdown_detailed.forEach(status => {
          console.log(`    - ${status.name}: ${status.count} tickets`)
        })
      }
    })
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugCategoriesSpecific()
