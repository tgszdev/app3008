import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testFrontendQueries() {
  console.log('🧪 TESTE DETALHADO DAS QUERIES DO FRONTEND')
  console.log('==========================================')
  
  try {
    // 1. Simular exatamente a query do frontend para categories-stats
    console.log('\n🔍 1. SIMULANDO QUERY CATEGORIES-STATS (FRONTEND):')
    
    const startDate = '2025-09-01'
    const endDate = '2025-09-30'
    
    // Buscar status da tabela (como o frontend faz)
    const { data: statuses, error: statusError } = await supabase
      .from('ticket_statuses')
      .select('id, name, slug, color, order_index')
      .order('order_index', { ascending: true })
    
    if (statusError) {
      console.log('❌ Erro ao buscar status:', statusError)
      return
    }
    
    console.log(`✅ ${statuses?.length || 0} status da tabela:`)
    statuses?.forEach(s => console.log(`  - ${s.name} (${s.slug})`))
    
    // Buscar tickets com categorias (como o frontend faz)
    const { data: tickets, error: ticketsError } = await supabase
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
    
    if (ticketsError) {
      console.log('❌ Erro ao buscar tickets:', ticketsError)
      return
    }
    
    console.log(`✅ ${tickets?.length || 0} tickets encontrados:`)
    tickets?.forEach(t => {
      console.log(`  - ID: ${t.id}`)
      console.log(`    Status: ${t.status}`)
      console.log(`    Categoria: ${t.categories?.name || 'Sem categoria'}`)
      console.log('    ---')
    })
    
    // 2. Simular exatamente a lógica do frontend
    console.log('\n🔧 2. SIMULANDO LÓGICA DO FRONTEND:')
    
    const totalTickets = tickets?.length || 0
    console.log(`📊 Total de tickets: ${totalTickets}`)
    
    // Processar categorias (como o frontend faz)
    const categoryStats = new Map()
    
    tickets?.forEach((ticket) => {
      const category = ticket.categories
      const categoryId = category?.id || 'uncategorized'
      const categoryName = category?.name || 'Sem Categoria'
      const categoryIcon = category?.icon || 'folder'
      const categoryColor = category?.color || '#6B7280'
      
      // Inicializar categoria se não existir
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
      
      // Contar por status (dinâmico)
      const ticketStatus = ticket.status
      const currentCount = stats.statusCounts.get(ticketStatus) || 0
      stats.statusCounts.set(ticketStatus, currentCount + 1)
    })
    
    console.log(`✅ ${categoryStats.size} categorias processadas:`)
    for (const [categoryId, cat] of categoryStats.entries()) {
      console.log(`\n📁 ${cat.name}: ${cat.count} tickets`)
      console.log(`  Status únicos:`, Array.from(cat.statusCounts.keys()))
      
      // Aplicar lógica dinâmica para cada categoria (como o frontend faz)
      const uniqueCategoryStatuses = [...new Set(Array.from(cat.statusCounts.keys()))]
      const statusBreakdownDetailed = []
      
      uniqueCategoryStatuses.forEach(ticketStatus => {
        const count = cat.statusCounts.get(ticketStatus) || 0
        
        if (count > 0) {
          // Buscar se existe na tabela
          const existingStatus = statuses?.find(s => s.slug === ticketStatus)
          
          if (existingStatus) {
            // Usar status da tabela
            statusBreakdownDetailed.push({
              slug: existingStatus.slug,
              name: existingStatus.name,
              color: existingStatus.color,
              count: count,
              order_index: existingStatus.order_index
            })
            console.log(`    ✅ ${existingStatus.name} (${existingStatus.slug}): ${count} tickets (da tabela)`)
          } else {
            // Criar status dinâmico
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
            console.log(`    ⚡ ${dynamicName} (${ticketStatus}): ${count} tickets (dinâmico)`)
          }
        }
      })
      
      // Ordenar por order_index
      statusBreakdownDetailed.sort((a, b) => a.order_index - b.order_index)
      
      console.log(`  Status finais: ${statusBreakdownDetailed.length}`)
      statusBreakdownDetailed.forEach(status => {
        console.log(`    - ${status.name}: ${status.count} tickets`)
      })
    }
    
    // 3. Simular resposta da API categories-stats
    console.log('\n📤 3. SIMULANDO RESPOSTA DA API CATEGORIES-STATS:')
    
    const categoriesArray = Array.from(categoryStats.values()).map(cat => {
      const uniqueCategoryStatuses = [...new Set(Array.from(cat.statusCounts.keys()))]
      const statusBreakdownDetailed = []
      
      uniqueCategoryStatuses.forEach(ticketStatus => {
        const count = cat.statusCounts.get(ticketStatus) || 0
        
        if (count > 0) {
          const existingStatus = statuses?.find(s => s.slug === ticketStatus)
          
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
    
    console.log(`✅ Resposta da API simulada:`)
    categoriesArray.forEach(cat => {
      console.log(`\n📁 ${cat.nome}: ${cat.quantidade} tickets (${cat.percentual}%)`)
      console.log(`  Status detalhados: ${cat.status_breakdown_detailed.length}`)
      cat.status_breakdown_detailed.forEach(status => {
        console.log(`    - ${status.name}: ${status.count} tickets`)
      })
    })
    
    // 4. Verificar se há problemas
    console.log('\n🔍 4. VERIFICAÇÃO DE PROBLEMAS:')
    
    let totalCategoriesWithStatus = 0
    let totalCategoriesWithoutStatus = 0
    
    categoriesArray.forEach(cat => {
      if (cat.status_breakdown_detailed.length > 0) {
        totalCategoriesWithStatus++
        console.log(`✅ ${cat.nome}: Tem ${cat.status_breakdown_detailed.length} status`)
      } else {
        totalCategoriesWithoutStatus++
        console.log(`❌ ${cat.nome}: Sem status (${cat.quantidade} tickets)`)
      }
    })
    
    console.log(`\n📊 RESUMO:`)
    console.log(`  Categorias com status: ${totalCategoriesWithStatus}`)
    console.log(`  Categorias sem status: ${totalCategoriesWithoutStatus}`)
    
    if (totalCategoriesWithoutStatus > 0) {
      console.log(`\n⚠️ PROBLEMA IDENTIFICADO:`)
      console.log(`  ${totalCategoriesWithoutStatus} categorias não estão mostrando status`)
      console.log(`  Isso pode ser causado por:`)
      console.log(`  1. Status dos tickets não correspondem aos slugs da tabela`)
      console.log(`  2. Lógica de filtro está removendo status com count > 0`)
      console.log(`  3. Problema na ordenação ou mapeamento`)
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testFrontendQueries()
