import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qjqjqjqjqjqjqjqj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MjA1MDU0ODgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnosticoCompleto() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO DASHBOARD')
  console.log('=' .repeat(60))
  
  const luftAgroContextId = '6486088e-72ae-461b-8b03-32ca84918882'
  
  try {
    // 1. VERIFICAR DADOS NO BANCO
    console.log('\n📊 1. VERIFICANDO DADOS NO BANCO:')
    console.log('-'.repeat(40))
    
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, status, created_at, is_internal, context_id, title')
      .eq('context_id', luftAgroContextId)
      .gte('created_at', '2025-01-01T00:00:00')
      .lte('created_at', '2025-01-31T23:59:59')
    
    if (ticketsError) {
      console.error('❌ Erro ao buscar tickets:', ticketsError)
      return
    }
    
    console.log(`📊 Tickets no banco para Luft Agro: ${tickets?.length || 0}`)
    if (tickets && tickets.length > 0) {
      console.log('📋 Primeiros 3 tickets:')
      tickets.slice(0, 3).forEach((ticket, index) => {
        console.log(`  ${index + 1}. ${ticket.title} - ${ticket.status} - ${ticket.context_id}`)
      })
    }
    
    // 2. VERIFICAR API SEM CONTEXTO
    console.log('\n📡 2. VERIFICANDO API SEM CONTEXTO:')
    console.log('-'.repeat(40))
    
    const responseSemContexto = await fetch('https://www.ithostbr.tech/api/dashboard/stats')
    const dataSemContexto = await responseSemContexto.json()
    
    console.log('📊 Resposta da API sem contexto:')
    console.log(`  Total: ${dataSemContexto.totalTickets || 'undefined'}`)
    console.log(`  Abertos: ${dataSemContexto.openTickets || 'undefined'}`)
    console.log(`  Fechados: ${dataSemContexto.closedTickets || 'undefined'}`)
    console.log(`  Recentes: ${dataSemContexto.recentTickets?.length || 0}`)
    
    // 3. VERIFICAR API COM CONTEXTO
    console.log('\n📡 3. VERIFICANDO API COM CONTEXTO:')
    console.log('-'.repeat(40))
    
    const responseComContexto = await fetch(`https://www.ithostbr.tech/api/dashboard/stats?context_id=${luftAgroContextId}`)
    const dataComContexto = await responseComContexto.json()
    
    console.log('📊 Resposta da API com contexto:')
    console.log(`  Total: ${dataComContexto.totalTickets || 'undefined'}`)
    console.log(`  Abertos: ${dataComContexto.openTickets || 'undefined'}`)
    console.log(`  Fechados: ${dataComContexto.closedTickets || 'undefined'}`)
    console.log(`  Recentes: ${dataComContexto.recentTickets?.length || 0}`)
    
    // 4. COMPARAR RESULTADOS
    console.log('\n🔍 4. COMPARAÇÃO:')
    console.log('-'.repeat(40))
    
    if (dataSemContexto.totalTickets !== dataComContexto.totalTickets) {
      console.log('✅ FILTRO FUNCIONANDO: Valores diferentes com e sem contexto')
      console.log(`  Sem contexto: ${dataSemContexto.totalTickets}`)
      console.log(`  Com contexto: ${dataComContexto.totalTickets}`)
    } else {
      console.log('❌ FILTRO NÃO FUNCIONANDO: Valores iguais com e sem contexto')
      console.log(`  Ambos: ${dataSemContexto.totalTickets}`)
    }
    
    // 5. VERIFICAR SE AS ESTATÍSTICAS ESTÃO SENDO CALCULADAS
    console.log('\n🧮 5. VERIFICANDO CÁLCULO DAS ESTATÍSTICAS:')
    console.log('-'.repeat(40))
    
    if (dataComContexto.totalTickets === undefined) {
      console.log('❌ PROBLEMA: totalTickets é undefined')
      console.log('🔍 Verificando estrutura da resposta...')
      console.log('📋 Chaves da resposta:', Object.keys(dataComContexto))
      
      // Verificar se há algum erro na resposta
      if (dataComContexto.error) {
        console.log('❌ Erro na API:', dataComContexto.error)
      }
    } else {
      console.log('✅ Estatísticas estão sendo calculadas')
    }
    
    // 6. VERIFICAR FRONTEND
    console.log('\n🖥️ 6. VERIFICANDO FRONTEND:')
    console.log('-'.repeat(40))
    console.log('🔍 Acesse: https://www.ithostbr.tech/dashboard')
    console.log('🔍 Selecione "Luft Agro" no seletor')
    console.log('🔍 Verifique se os cards mostram dados filtrados')
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error.message)
  }
}

diagnosticoCompleto()
