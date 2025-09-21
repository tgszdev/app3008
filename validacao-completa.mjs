import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function validacaoCompleta() {
  console.log('🔍 VALIDAÇÃO COMPLETA DE DADOS E CÁLCULOS\n')
  
  // Período atual do dashboard
  const startDate = '2025-02-01T00:00:00'
  const endDate = '2025-09-30T23:59:59'
  
  console.log(`📅 PERÍODO: ${startDate.split('T')[0]} até ${endDate.split('T')[0]}\n`)
  
  // 1. BUSCAR TODOS OS TICKETS DO PERÍODO
  console.log('1️⃣ BUSCANDO TODOS OS TICKETS DO PERÍODO...')
  const { data: allTickets, error: ticketsError } = await supabase
    .from('tickets')
    .select(`
      id,
      ticket_number,
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
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })

  if (ticketsError) {
    console.error('❌ Erro ao buscar tickets:', ticketsError)
    return
  }

  console.log(`✅ ${allTickets?.length || 0} tickets encontrados\n`)

  // 2. ANÁLISE POR STATUS
  console.log('2️⃣ ANÁLISE POR STATUS:')
  const statusCounts = new Map()
  
  allTickets?.forEach(ticket => {
    const status = ticket.status
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1)
  })
  
  console.log('📊 CONTAGEM POR STATUS:')
  Array.from(statusCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      console.log(`  • ${status}: ${count} tickets`)
    })
  
  const totalPorStatus = Array.from(statusCounts.values()).reduce((a, b) => a + b, 0)
  console.log(`📝 TOTAL (soma por status): ${totalPorStatus}\n`)

  // 3. ANÁLISE POR CATEGORIA  
  console.log('3️⃣ ANÁLISE POR CATEGORIA:')
  const categoryCounts = new Map()
  const categoryStatus = new Map()
  
  allTickets?.forEach(ticket => {
    const categoryName = ticket.categories?.name || 'SEM CATEGORIA'
    const status = ticket.status
    
    // Contagem total por categoria
    categoryCounts.set(categoryName, (categoryCounts.get(categoryName) || 0) + 1)
    
    // Contagem por status dentro da categoria
    if (!categoryStatus.has(categoryName)) {
      categoryStatus.set(categoryName, new Map())
    }
    const catStatusMap = categoryStatus.get(categoryName)
    catStatusMap.set(status, (catStatusMap.get(status) || 0) + 1)
  })
  
  console.log('📊 CONTAGEM POR CATEGORIA:')
  Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`\n📁 ${category}: ${count} tickets`)
      
      // Mostrar breakdown por status
      const statusBreakdown = categoryStatus.get(category)
      if (statusBreakdown) {
        Array.from(statusBreakdown.entries())
          .sort((a, b) => b[1] - a[1])
          .forEach(([status, statusCount]) => {
            console.log(`    • ${status}: ${statusCount}`)
          })
        
        // Verificar se a soma bate
        const somaStatus = Array.from(statusBreakdown.values()).reduce((a, b) => a + b, 0)
        if (somaStatus !== count) {
          console.log(`    ⚠️  INCONSISTÊNCIA: Total ${count} ≠ Soma status ${somaStatus}`)
        }
      }
    })
  
  const totalPorCategoria = Array.from(categoryCounts.values()).reduce((a, b) => a + b, 0)
  console.log(`\n📝 TOTAL (soma por categoria): ${totalPorCategoria}`)

  // 4. VERIFICAÇÃO DE CONSISTÊNCIA
  console.log('\n4️⃣ VERIFICAÇÃO DE CONSISTÊNCIA:')
  
  if (totalPorStatus === totalPorCategoria && totalPorStatus === (allTickets?.length || 0)) {
    console.log('✅ TODOS OS TOTAIS BATEM!')
  } else {
    console.log('❌ INCONSISTÊNCIAS ENCONTRADAS:')
    console.log(`   - Tickets brutos: ${allTickets?.length || 0}`)
    console.log(`   - Soma por status: ${totalPorStatus}`)
    console.log(`   - Soma por categoria: ${totalPorCategoria}`)
  }

  // 5. VALIDAR CASOS ESPECÍFICOS DOS PRINTS
  console.log('\n5️⃣ VALIDAÇÃO DOS CASOS ESPECÍFICOS:')
  
  const casosEspecificos = [
    { nome: 'Melhoria', expectedTotal: 6, expectedAberto: 4, expectedResolvido: 1 },
    { nome: 'Segurança', expectedTotal: 3, expectedResolvido: 2 },
    { nome: 'Software', expectedTotal: 11, expectedAberto: 2, expectedEmProgresso: 2, expectedResolvido: 6 }
  ]
  
  casosEspecificos.forEach(caso => {
    console.log(`\n🔍 Validando categoria "${caso.nome}":`)
    
    const realCount = categoryCounts.get(caso.nome) || 0
    const realStatus = categoryStatus.get(caso.nome)
    
    console.log(`   Total esperado: ${caso.expectedTotal} | Real: ${realCount} ${realCount === caso.expectedTotal ? '✅' : '❌'}`)
    
    if (realStatus) {
      if (caso.expectedAberto !== undefined) {
        const realAberto = realStatus.get('aberto') || 0
        console.log(`   Aberto esperado: ${caso.expectedAberto} | Real: ${realAberto} ${realAberto === caso.expectedAberto ? '✅' : '❌'}`)
      }
      
      if (caso.expectedResolvido !== undefined) {
        const realResolvido = realStatus.get('resolvido') || 0
        console.log(`   Resolvido esperado: ${caso.expectedResolvido} | Real: ${realResolvido} ${realResolvido === caso.expectedResolvido ? '✅' : '❌'}`)
      }
      
      if (caso.expectedEmProgresso !== undefined) {
        const realEmProgresso = realStatus.get('em-progresso') || 0
        console.log(`   Em Progresso esperado: ${caso.expectedEmProgresso} | Real: ${realEmProgresso} ${realEmProgresso === caso.expectedEmProgresso ? '✅' : '❌'}`)
      }
    }
  })

  // 6. VERIFICAR TICKETS SEM CATEGORIA
  console.log('\n6️⃣ VERIFICAÇÃO DE TICKETS SEM CATEGORIA:')
  const ticketsSemCategoria = allTickets?.filter(t => !t.categories?.name) || []
  
  if (ticketsSemCategoria.length > 0) {
    console.log(`⚠️  ${ticketsSemCategoria.length} tickets sem categoria encontrados:`)
    ticketsSemCategoria.forEach(ticket => {
      console.log(`   #${ticket.ticket_number} - ${ticket.status} - category_id: ${ticket.category_id}`)
    })
  } else {
    console.log('✅ Todos os tickets têm categoria válida')
  }

  // 7. BUSCAR STATUS CADASTRADOS  
  console.log('\n7️⃣ STATUS CADASTRADOS NO SISTEMA:')
  const { data: statusList } = await supabase
    .from('ticket_statuses')
    .select('id, name, slug, color, order_index')
    .order('order_index')
  
  console.log('📋 Status disponíveis:')
  statusList?.forEach((status, i) => {
    console.log(`   ${i+1}. "${status.slug}" - "${status.name}" (${status.color})`)
  })
  
  // Verificar status nos tickets que não estão cadastrados
  const statusCadastrados = new Set(statusList?.map(s => s.slug) || [])
  const statusNosTickets = new Set(allTickets?.map(t => t.status) || [])
  
  const statusNaoCadastrados = [...statusNosTickets].filter(s => !statusCadastrados.has(s))
  
  if (statusNaoCadastrados.length > 0) {
    console.log(`\n⚠️  STATUS NOS TICKETS QUE NÃO ESTÃO CADASTRADOS:`)
    statusNaoCadastrados.forEach(status => {
      const count = statusCounts.get(status) || 0
      console.log(`   • "${status}": ${count} tickets`)
    })
  } else {
    console.log('\n✅ Todos os status dos tickets estão cadastrados')
  }
}

validacaoCompleta().catch(console.error)
