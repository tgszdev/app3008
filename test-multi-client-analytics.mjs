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

async function testMultiClientAnalytics() {
  console.log('🔍 Testando Multi-Client Analytics...\n')

  try {
    // 1. Buscar contextos disponíveis
    console.log('1️⃣ Buscando contextos disponíveis...')
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

    if (contexts.length === 0) {
      console.log('❌ Nenhum contexto encontrado')
      return
    }

    // 2. Buscar tickets de cada contexto
    console.log('\n2️⃣ Analisando tickets por contexto...')
    
    const startDate = '2024-09-01'
    const endDate = '2025-12-31'
    
    for (const context of contexts.slice(0, 3)) { // Testar apenas os primeiros 3
      console.log(`\n📊 Contexto: ${context.name}`)
      
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          id,
          ticket_number,
          title,
          status,
          priority,
          created_at,
          updated_at,
          resolved_at,
          context_id,
          categories(
            id,
            name,
            slug,
            color,
            icon,
            is_global
          )
        `)
        .eq('context_id', context.id)
        .gte('created_at', `${startDate}T00:00:00.000Z`)
        .lte('created_at', `${endDate}T23:59:59.999Z`)

      if (ticketsError) {
        console.error(`❌ Erro ao buscar tickets do contexto ${context.name}:`, ticketsError)
        continue
      }

      console.log(`   📈 Total de tickets: ${tickets?.length || 0}`)

      if (tickets && tickets.length > 0) {
        // Análise por status
        const statusCount = {}
        tickets.forEach(ticket => {
          statusCount[ticket.status] = (statusCount[ticket.status] || 0) + 1
        })

        console.log('   📊 Por status:')
        Object.entries(statusCount).forEach(([status, count]) => {
          console.log(`      ${status}: ${count}`)
        })

        // Análise por categoria
        const categoryCount = {}
        tickets.forEach(ticket => {
          if (ticket.categories) {
            const category = Array.isArray(ticket.categories) ? ticket.categories[0] : ticket.categories
            if (category) {
              const catName = category.name || 'Sem categoria'
              categoryCount[catName] = (categoryCount[catName] || 0) + 1
            }
          }
        })

        console.log('   📂 Por categoria:')
        Object.entries(categoryCount).forEach(([category, count]) => {
          console.log(`      ${category}: ${count}`)
        })

        // Análise de resolução
        const resolvedTickets = tickets.filter(ticket => 
          ticket.resolved_at && 
          (ticket.status === 'resolved' || ticket.status === 'closed')
        )

        console.log(`   ✅ Tickets resolvidos: ${resolvedTickets.length}`)

        if (resolvedTickets.length > 0) {
          const totalTime = resolvedTickets.reduce((sum, ticket) => {
            const created = new Date(ticket.created_at)
            const resolved = new Date(ticket.resolved_at)
            return sum + (resolved.getTime() - created.getTime())
          }, 0)
          
          const avgMs = totalTime / resolvedTickets.length
          const avgHours = Math.round(avgMs / (1000 * 60 * 60) * 10) / 10
          console.log(`   ⏱️ Tempo médio de resolução: ${avgHours}h`)
        }
      }
    }

    // 3. Testar endpoint da API
    console.log('\n3️⃣ Testando endpoint da API...')
    
    const contextIds = contexts.slice(0, 2).map(ctx => ctx.id)
    const apiUrl = `http://localhost:3000/api/dashboard/multi-client-analytics?start_date=${startDate}&end_date=${endDate}&context_ids=${contextIds.join(',')}`
    
    console.log(`🔗 URL: ${apiUrl}`)
    console.log('⚠️  Nota: Para testar o endpoint da API, execute o servidor Next.js primeiro')
    console.log('   npm run dev')
    console.log('   Em seguida, acesse a URL acima no navegador ou use curl')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar teste
testMultiClientAnalytics()
  .then(() => {
    console.log('\n✅ Teste concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro no teste:', error)
    process.exit(1)
  })
