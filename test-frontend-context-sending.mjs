import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qjqjqjqjqjqjqjqj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MjA1MDU0ODgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFrontendContextSending() {
  console.log('🧪 TESTE: Verificar se o frontend está enviando contexto')
  console.log('=' .repeat(50))
  
  const luftAgroContextId = '6486088e-72ae-461b-8b03-32ca84918882'
  
  try {
    // Simular o que o frontend deveria fazer
    console.log('📡 Simulando chamada do frontend...')
    
    // Testar com contexto
    console.log(`🔍 Testando com contexto: ${luftAgroContextId}`)
    const responseWithContext = await fetch(`https://www.ithostbr.tech/api/dashboard/stats?context_id=${luftAgroContextId}`)
    
    if (!responseWithContext.ok) {
      console.error('❌ Erro na API com contexto:', responseWithContext.status)
      return
    }
    
    const dataWithContext = await responseWithContext.json()
    console.log('✅ Resposta com contexto:')
    console.log(`  Total: ${dataWithContext.totalTickets || 'undefined'}`)
    console.log(`  Abertos: ${dataWithContext.openTickets || 'undefined'}`)
    console.log(`  Fechados: ${dataWithContext.closedTickets || 'undefined'}`)
    console.log(`  Recentes: ${dataWithContext.recentTickets?.length || 0}`)
    
    // Testar sem contexto
    console.log('\n📡 Testando sem contexto...')
    const responseWithoutContext = await fetch('https://www.ithostbr.tech/api/dashboard/stats')
    
    if (!responseWithoutContext.ok) {
      console.error('❌ Erro na API sem contexto:', responseWithoutContext.status)
      return
    }
    
    const dataWithoutContext = await responseWithoutContext.json()
    console.log('✅ Resposta sem contexto:')
    console.log(`  Total: ${dataWithoutContext.totalTickets || 'undefined'}`)
    console.log(`  Abertos: ${dataWithoutContext.openTickets || 'undefined'}`)
    console.log(`  Fechados: ${dataWithoutContext.closedTickets || 'undefined'}`)
    console.log(`  Recentes: ${dataWithoutContext.recentTickets?.length || 0}`)
    
    // Comparar resultados
    console.log('\n🔍 Comparação:')
    if (dataWithContext.totalTickets !== dataWithoutContext.totalTickets) {
      console.log('✅ Filtro está funcionando! Valores diferentes com e sem contexto')
    } else {
      console.log('❌ Filtro não está funcionando! Valores iguais com e sem contexto')
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testFrontendContextSending()