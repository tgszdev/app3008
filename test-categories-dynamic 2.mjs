import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testCategoriesDynamic() {
  console.log('🧪 TESTE CATEGORIAS DINÂMICAS')
  console.log('=============================')
  
  try {
    // 1. Buscar tickets com categorias
    console.log('\n🎫 1. BUSCANDO TICKETS COM CATEGORIAS:')
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select(`
        id,
        status,
        created_at,
        category_id,
        categories (
          id,
          name,
          icon,
          color
        )
      `)
      .gte('created_at', '2025-09-01T00:00:00')
      .lte('created_at', '2025-09-30T23:59:59')
    
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
    
    // 2. Simular lógica de categorias dinâmicas
    console.log('\n🔧 2. SIMULANDO LÓGICA DE CATEGORIAS DINÂMICAS:')
    
    const categoryStats = new Map()
    
    // Processar tickets e construir estatísticas de categoria
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
    
    console.log(`✅ ${categoryStats.size} categorias encontradas:`)
    for (const [categoryId, cat] of categoryStats.entries()) {
      console.log(`\n📁 ${cat.name}: ${cat.count} tickets`)
      console.log(`  Status únicos:`, Array.from(cat.statusCounts.keys()))
      
      // Aplicar lógica dinâmica para cada categoria
      const uniqueCategoryStatuses = [...new Set(Array.from(cat.statusCounts.keys()))]
      const statusBreakdownDetailed = []
      
      uniqueCategoryStatuses.forEach(ticketStatus => {
        const count = cat.statusCounts.get(ticketStatus) || 0
        
        if (count > 0) {
          // Simular busca na tabela (vamos assumir que alguns existem)
          const existingStatuses = [
            { slug: 'open', name: 'Aberto', color: '#3B82F6', order_index: 1 },
            { slug: 'in_progress', name: 'Em Progresso', color: '#F59E0B', order_index: 2 },
            { slug: 'resolved', name: 'Resolvido', color: '#10B981', order_index: 3 }
          ]
          
          const existingStatus = existingStatuses.find(s => s.slug === ticketStatus)
          
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
    
    // 3. Verificar se todas as categorias têm status
    console.log('\n✅ 3. VERIFICAÇÃO FINAL:')
    let totalCategoriesWithStatus = 0
    let totalCategoriesWithoutStatus = 0
    
    for (const [categoryId, cat] of categoryStats.entries()) {
      const hasStatus = Array.from(cat.statusCounts.values()).some(count => count > 0)
      if (hasStatus) {
        totalCategoriesWithStatus++
        console.log(`✅ ${cat.name}: Tem status`)
      } else {
        totalCategoriesWithoutStatus++
        console.log(`❌ ${cat.name}: Sem status`)
      }
    }
    
    console.log(`\n📊 RESUMO:`)
    console.log(`  Categorias com status: ${totalCategoriesWithStatus}`)
    console.log(`  Categorias sem status: ${totalCategoriesWithoutStatus}`)
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testCategoriesDynamic()
