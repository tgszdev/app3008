import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugCardsSuperiores() {
  console.log('🔍 DEBUG: CARDS SUPERIORES NÃO ABSORVEM TODOS OS STATUS\n')
  
  // Período que aparece no print: só setembro (17 tickets)
  const periodo = {
    inicio: '2025-09-01T00:00:00',
    fim: '2025-09-30T23:59:59'
  }
  
  console.log(`📅 PERÍODO: ${periodo.inicio.split('T')[0]} até ${periodo.fim.split('T')[0]}`)
  
  // 1. Buscar TODOS os tickets do período (como a API faz)
  console.log('\n1️⃣ BUSCANDO TICKETS COMO A API FAZ (com INNER JOIN):')
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select(`
      id,
      status,
      created_at,
      created_by,
      category_id,
      categories!inner (
        id,
        name,
        icon,
        color
      )
    `)
    .gte('created_at', periodo.inicio)
    .lte('created_at', periodo.fim)

  if (error) {
    console.error('❌ Erro:', error)
    return
  }

  console.log(`✅ ${tickets?.length || 0} tickets encontrados com INNER JOIN`)
  
  // 2. Contar por status (como a API deveria fazer)
  console.log('\n2️⃣ CONTAGEM POR STATUS (como API faz):')
  const statusCounts = new Map()
  
  tickets?.forEach(ticket => {
    const status = ticket.status
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1)
  })
  
  console.log('📊 Status encontrados:')
  Array.from(statusCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      console.log(`   • ${status}: ${count} tickets`)
    })
  
  const totalPorStatus = Array.from(statusCounts.values()).reduce((a, b) => a + b, 0)
  console.log(`\n📝 TOTAL (soma dos status): ${totalPorStatus}`)
  
  // 3. Verificar o mapeamento da API
  console.log('\n3️⃣ MAPEAMENTO ATUAL DA API (legacyStatusSummary):')
  
  const legacyStatusSummary = {
    open: statusCounts.get('aberto') || 0,
    in_progress: statusCounts.get('em-progresso') || 0, 
    resolved: statusCounts.get('resolvido') || 0,
    cancelled: statusCounts.get('cancelled') || 0,
    closed: statusCounts.get('fechado') || 0
  }
  
  console.log('🎯 Mapeamento usado pela API:')
  console.log(`   • aberto → open: ${legacyStatusSummary.open}`)
  console.log(`   • em-progresso → in_progress: ${legacyStatusSummary.in_progress}`)
  console.log(`   • resolvido → resolved: ${legacyStatusSummary.resolved}`)
  console.log(`   • cancelled → cancelled: ${legacyStatusSummary.cancelled}`)
  console.log(`   • fechado → closed: ${legacyStatusSummary.closed}`)
  
  const totalMapeado = legacyStatusSummary.open + legacyStatusSummary.in_progress + 
                      legacyStatusSummary.resolved + legacyStatusSummary.cancelled + 
                      legacyStatusSummary.closed
  
  console.log(`\n📊 TOTAL (cards superiores): ${totalMapeado}`)
  
  // 4. Identificar status que não estão sendo mapeados
  console.log('\n4️⃣ STATUS NÃO MAPEADOS:')
  
  const statusMapeados = new Set(['aberto', 'em-progresso', 'resolvido', 'cancelled', 'fechado'])
  const statusNaoMapeados = Array.from(statusCounts.keys()).filter(s => !statusMapeados.has(s))
  
  if (statusNaoMapeados.length > 0) {
    console.log('⚠️  STATUS QUE NÃO APARECEM NOS CARDS SUPERIORES:')
    statusNaoMapeados.forEach(status => {
      const count = statusCounts.get(status)
      console.log(`   • "${status}": ${count} tickets (PERDIDOS!)`)
    })
    
    const ticketsPerdidos = statusNaoMapeados.reduce((total, status) => {
      return total + (statusCounts.get(status) || 0)
    }, 0)
    
    console.log(`\n🚨 TICKETS PERDIDOS: ${ticketsPerdidos}`)
    console.log(`💡 ESSES TICKETS NÃO APARECEM NOS CARDS SUPERIORES!`)
  } else {
    console.log('✅ Todos os status estão sendo mapeados')
  }
  
  // 5. Mostrar a correção necessária
  console.log('\n5️⃣ CORREÇÃO NECESSÁRIA:')
  
  if (totalPorStatus !== totalMapeado) {
    console.log(`❌ INCONSISTÊNCIA DETECTADA:`)
    console.log(`   Total real: ${totalPorStatus}`)
    console.log(`   Total mapeado: ${totalMapeado}`)
    console.log(`   Diferença: ${totalPorStatus - totalMapeado} tickets`)
    
    console.log('\n💡 SOLUÇÃO: Incluir todos os status no mapeamento:')
    
    console.log('📝 Mapeamento correto deveria ser:')
    const mapeamentoCorreto = {}
    
    // Mapear os conhecidos
    mapeamentoCorreto.open = statusCounts.get('aberto') || 0
    mapeamentoCorreto.in_progress = (statusCounts.get('em-progresso') || 0) + 
                                   (statusCounts.get('aguardando-cliente') || 0) +
                                   (statusCounts.get('ag-deploy-em-producao') || 0)
    mapeamentoCorreto.resolved = statusCounts.get('resolvido') || 0
    mapeamentoCorreto.cancelled = statusCounts.get('cancelled') || 0
    mapeamentoCorreto.closed = statusCounts.get('fechado') || 0
    
    console.log(`   • Abertos: ${mapeamentoCorreto.open}`)
    console.log(`   • Em Progresso: ${mapeamentoCorreto.in_progress} (incluindo aguardando e deploy)`)
    console.log(`   • Resolvidos: ${mapeamentoCorreto.resolved}`)
    console.log(`   • Cancelados: ${mapeamentoCorreto.cancelled}`)
    console.log(`   • Fechados: ${mapeamentoCorreto.closed}`)
    
    const totalCorrigido = Object.values(mapeamentoCorreto).reduce((a, b) => a + b, 0)
    console.log(`\n✅ TOTAL CORRIGIDO: ${totalCorrigido} (deve bater com ${totalPorStatus})`)
    
  } else {
    console.log('✅ Mapeamento está correto!')
  }
  
  // 6. Verificar tickets específicos dos status problemáticos
  console.log('\n6️⃣ DETALHES DOS STATUS PROBLEMÁTICOS:')
  
  const statusProblematicos = ['aguardando-cliente', 'ag-deploy-em-producao']
  
  for (const status of statusProblematicos) {
    const count = statusCounts.get(status) || 0
    if (count > 0) {
      console.log(`\n🔍 Status "${status}" (${count} tickets):`)
      
      const ticketsStatus = tickets?.filter(t => t.status === status) || []
      ticketsStatus.forEach(ticket => {
        console.log(`   • #${ticket.id.slice(0, 8)} - ${ticket.categories.name}`)
      })
    }
  }
}

debugCardsSuperiores().catch(console.error)



