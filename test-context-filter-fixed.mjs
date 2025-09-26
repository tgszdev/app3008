import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qjqjqjqjqjqjqjqj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MjA1MDU0ODgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testContextFilter() {
  console.log('🧪 TESTE: Verificar filtro de contexto na API')
  console.log('=' .repeat(50))
  
  // Testar API com contexto Luft Agro
  const luftAgroContextId = '6486088e-72ae-461b-8b03-32ca84918882'
  
  try {
    console.log('📡 Testando API com contexto Luft Agro...')
    const response = await fetch(`https://www.ithostbr.tech/api/dashboard/stats?context_id=${luftAgroContextId}`)
    
    if (!response.ok) {
      console.error('❌ Erro na API:', response.status, response.statusText)
      return
    }
    
    const data = await response.json()
    console.log('✅ Resposta da API:')
    console.log(`📊 Total de tickets: ${data.totalTickets}`)
    console.log(`📊 Tickets abertos: ${data.openTickets}`)
    console.log(`📊 Tickets fechados: ${data.closedTickets}`)
    console.log(`📊 Tickets internos: ${data.internalTickets}`)
    console.log(`📊 Tickets recentes: ${data.recentTickets?.length || 0}`)
    
    // Verificar se os tickets recentes têm o contexto correto
    if (data.recentTickets && data.recentTickets.length > 0) {
      console.log('\n🔍 Verificando context_id dos tickets recentes:')
      data.recentTickets.forEach((ticket, index) => {
        console.log(`  ${index + 1}. ${ticket.title}: context_id = ${ticket.context_id}`)
      })
    }
    
    // Verificar se as estatísticas estão filtradas
    if (data.totalTickets === 0) {
      console.log('⚠️ ATENÇÃO: Total de tickets = 0. Pode indicar que o filtro está funcionando mas não há dados para Luft Agro.')
    } else {
      console.log('✅ Filtro aplicado: Estatísticas mostram dados filtrados')
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testContextFilter()
