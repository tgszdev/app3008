import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qjqjqjqjqjqjqjqj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MjA1MDU0ODgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testStatsCalculation() {
  console.log('🧪 TESTE: Verificar cálculo das estatísticas')
  console.log('=' .repeat(50))
  
  const luftAgroContextId = '6486088e-72ae-461b-8b03-32ca84918882'
  
  try {
    // Buscar tickets diretamente do banco para Luft Agro
    console.log('📊 Buscando tickets do banco para Luft Agro...')
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id, status, created_at, is_internal, context_id')
      .eq('context_id', luftAgroContextId)
      .gte('created_at', '2025-01-01T00:00:00')
      .lte('created_at', '2025-01-31T23:59:59')
    
    if (error) {
      console.error('❌ Erro ao buscar tickets:', error)
      return
    }
    
    console.log(`📊 Tickets encontrados no banco: ${tickets?.length || 0}`)
    
    if (tickets && tickets.length > 0) {
      // Calcular estatísticas manualmente
      const totalTickets = tickets.length
      const openTickets = tickets.filter(t => t.status === 'open').length
      const closedTickets = tickets.filter(t => t.status === 'closed').length
      const internalTickets = tickets.filter(t => t.is_internal).length
      
      console.log('\n📊 Estatísticas calculadas:')
      console.log(`  Total: ${totalTickets}`)
      console.log(`  Abertos: ${openTickets}`)
      console.log(`  Fechados: ${closedTickets}`)
      console.log(`  Internos: ${internalTickets}`)
      
      // Verificar se a API deveria retornar esses valores
      console.log('\n🔍 Verificando se a API deveria retornar esses valores...')
      const response = await fetch(`https://www.ithostbr.tech/api/dashboard/stats?context_id=${luftAgroContextId}`)
      const apiData = await response.json()
      
      console.log('\n📊 Comparação API vs Banco:')
      console.log(`  API Total: ${apiData.totalTickets || 'undefined'}`)
      console.log(`  Banco Total: ${totalTickets}`)
      console.log(`  API Abertos: ${apiData.openTickets || 'undefined'}`)
      console.log(`  Banco Abertos: ${openTickets}`)
      
      if (apiData.totalTickets === totalTickets) {
        console.log('✅ API está retornando valores corretos!')
      } else {
        console.log('❌ API não está retornando valores corretos!')
      }
    } else {
      console.log('⚠️ Nenhum ticket encontrado para Luft Agro no período')
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testStatsCalculation()
