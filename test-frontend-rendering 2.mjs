import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testFrontendRendering() {
  console.log('🧪 TESTE DE RENDERIZAÇÃO DO FRONTEND')
  console.log('====================================')
  
  try {
    // 1. Simular exatamente a chamada da API categories-stats
    console.log('\n🔍 1. SIMULANDO CHAMADA DA API:')
    
    const startDate = '2025-09-01'
    const endDate = '2025-09-30'
    
    // Buscar status da tabela
    const { data: statuses } = await supabase
      .from('ticket_statuses')
      .select('id, name, slug, color, order_index')
      .order('order_index', { ascending: true })
    
    const statusList = statuses || []
    
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
    
    // 3. Aplicar lógica dinâmica para cada categoria
    console.log('\n🔧 3. APLICANDO LÓGICA DINÂMICA:')
    
    const categoriesArray = Array.from(categoryStats.values()).map(cat => {
      const statusBreakdown = {}
      const statusBreakdownDetailed = []
      
      const uniqueCategoryStatuses = [...new Set(Array.from(cat.statusCounts.keys()))]
      
      uniqueCategoryStatuses.forEach(ticketStatus => {
        const count = cat.statusCounts.get(ticketStatus) || 0
        
        if (count > 0) {
          const existingStatus = statusList.find(s => s.slug === ticketStatus)
          
          if (existingStatus) {
            statusBreakdown[existingStatus.slug] = count
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
      
      statusBreakdownDetailed.sort((a, b) => a.order_index - b.order_index)
      
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
    
    // 4. Simular renderização do frontend
    console.log('\n🎨 4. SIMULANDO RENDERIZAÇÃO DO FRONTEND:')
    
    categoriesArray.forEach((category, index) => {
      console.log(`\n📁 Categoria ${index + 1}: ${category.nome}`)
      console.log(`  Quantidade: ${category.quantidade} tickets`)
      console.log(`  Percentual: ${category.percentual}%`)
      console.log(`  Status breakdown:`, category.status_breakdown)
      console.log(`  Status breakdown detailed: ${category.status_breakdown_detailed.length}`)
      
      // Simular a lógica do frontend
      console.log(`\n  🎨 Renderização do frontend:`)
      
      // Simular a barra de progresso
      console.log(`    Barra de progresso:`)
      category.status_breakdown_detailed.forEach((status, statusIndex) => {
        if (status.count <= 0) {
          console.log(`      Status ${statusIndex + 1}: ${status.name} - PULADO (count <= 0)`)
          return
        }
        
        const width = (status.count / category.quantidade) * 100
        console.log(`      Status ${statusIndex + 1}: ${status.name} - ${status.count} tickets (${width.toFixed(1)}% da barra)`)
      })
      
      // Simular a lista de status
      console.log(`    Lista de status:`)
      const filteredStatuses = category.status_breakdown_detailed.filter(status => status.count > 0)
      console.log(`      Status filtrados: ${filteredStatuses.length}`)
      
      filteredStatuses.forEach((status, statusIndex) => {
        console.log(`        ${statusIndex + 1}. ${status.name}: ${status.count} tickets (cor: ${status.color})`)
      })
      
      if (filteredStatuses.length === 0) {
        console.log(`      ❌ PROBLEMA: Nenhum status para renderizar!`)
      }
    })
    
    // 5. Verificar se há problemas específicos
    console.log('\n🔍 5. VERIFICAÇÃO DE PROBLEMAS:')
    
    const problemCategories = categoriesArray.filter(cat => {
      const filteredStatuses = cat.status_breakdown_detailed.filter(status => status.count > 0)
      return filteredStatuses.length === 0
    })
    
    if (problemCategories.length > 0) {
      console.log(`❌ ${problemCategories.length} categorias sem status para renderizar:`)
      problemCategories.forEach(cat => {
        console.log(`  - ${cat.nome}: ${cat.quantidade} tickets`)
        console.log(`    Status breakdown detailed:`, cat.status_breakdown_detailed)
      })
    } else {
      console.log(`✅ Todas as categorias têm status para renderizar`)
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testFrontendRendering()
