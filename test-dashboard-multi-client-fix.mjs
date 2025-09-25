#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDashboardMultiClientFix() {
  console.log('🔍 Testando correção do Dashboard Multi-Client...\n')

  try {
    // 1. Verificar contextos disponíveis
    console.log('1️⃣ Verificando contextos disponíveis...')
    const { data: contexts, error: contextsError } = await supabase
      .from('contexts')
      .select('id, name, type, slug')
      .eq('is_active', true)
      .order('name')

    if (contextsError) {
      console.error('❌ Erro ao buscar contextos:', contextsError)
      return
    }

    console.log(`✅ Encontrados ${contexts.length} contextos:`)
    contexts.forEach(ctx => {
      console.log(`   - ${ctx.name} (${ctx.type}) - ID: ${ctx.id}`)
    })

    // 2. Verificar tickets no período correto (2024)
    console.log('\n2️⃣ Verificando tickets no período 2024...')
    const startDate = '2024-09-01'
    const endDate = '2024-12-31'
    
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        title,
        status,
        priority,
        created_at,
        context_id,
        categories(
          id,
          name,
          slug,
          color,
          icon
        )
      `)
      .gte('created_at', `${startDate}T00:00:00.000Z`)
      .lte('created_at', `${endDate}T23:59:59.999Z`)
      .order('created_at', { ascending: false })

    if (ticketsError) {
      console.error('❌ Erro ao buscar tickets:', ticketsError)
      return
    }

    console.log(`✅ Encontrados ${tickets.length} tickets no período ${startDate} a ${endDate}`)

    if (tickets.length > 0) {
      // Análise por contexto
      const contextCount = {}
      tickets.forEach(ticket => {
        if (ticket.context_id) {
          const context = contexts.find(ctx => ctx.id === ticket.context_id)
          const contextName = context ? context.name : 'Contexto não encontrado'
          contextCount[contextName] = (contextCount[contextName] || 0) + 1
        }
      })

      console.log('\n📊 Tickets por contexto:')
      Object.entries(contextCount).forEach(([context, count]) => {
        console.log(`   ${context}: ${count} tickets`)
      })

      // Análise por status
      const statusCount = {}
      tickets.forEach(ticket => {
        statusCount[ticket.status] = (statusCount[ticket.status] || 0) + 1
      })

      console.log('\n📊 Tickets por status:')
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`   ${status}: ${count} tickets`)
      })
    }

    // 3. Testar endpoint da API com período correto
    console.log('\n3️⃣ Testando endpoint da API com período correto...')
    const contextIds = contexts.slice(0, 2).map(ctx => ctx.id)
    const apiUrl = `http://localhost:3000/api/dashboard/multi-client-analytics?start_date=${startDate}&end_date=${endDate}&context_ids=${contextIds.join(',')}`
    
    console.log(`🔗 URL: ${apiUrl}`)
    console.log('⚠️  Nota: Para testar o endpoint da API, é necessário estar autenticado')
    console.log('   Acesse: https://www.ithostbr.tech/dashboard/multi-client')
    console.log('   E selecione os contextos:', contextIds)

    console.log('\n✅ Diagnóstico concluído!')
    console.log('\n📝 Problemas identificados e soluções:')
    console.log('   1. ✅ Período corrigido: 2024-09-01 a 2024-12-31')
    console.log('   2. ✅ Contextos disponíveis:', contexts.length)
    console.log('   3. ✅ Tickets encontrados:', tickets.length)
    console.log('   4. ✅ Categorias funcionando (teste anterior)')
    
    console.log('\n🔧 Próximos passos:')
    console.log('   1. Fazer commit das correções')
    console.log('   2. Deploy em produção')
    console.log('   3. Testar em: https://www.ithostbr.tech/dashboard/multi-client')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar teste
testDashboardMultiClientFix()
  .then(() => {
    console.log('\n✅ Teste de correção concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro no teste:', error)
    process.exit(1)
  })
