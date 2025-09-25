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

async function verificarTickets() {
  console.log('🔍 Verificando tickets no banco...\n')

  try {
    // 1. Contar total de tickets
    const { count: totalTickets, error: countError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Erro ao contar tickets:', countError)
      return
    }

    console.log(`📊 Total de tickets no banco: ${totalTickets}`)

    if (totalTickets === 0) {
      console.log('❌ Nenhum ticket encontrado no banco')
      return
    }

    // 2. Buscar alguns tickets de exemplo
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
      .order('created_at', { ascending: false })
      .limit(10)

    if (ticketsError) {
      console.error('❌ Erro ao buscar tickets:', ticketsError)
      return
    }

    console.log(`\n📋 Últimos ${tickets.length} tickets:`)
    tickets.forEach((ticket, index) => {
      const category = ticket.categories ? 
        (Array.isArray(ticket.categories) ? ticket.categories[0] : ticket.categories) : 
        null
      
      console.log(`\n${index + 1}. #${ticket.ticket_number} - ${ticket.title}`)
      console.log(`   Status: ${ticket.status}`)
      console.log(`   Prioridade: ${ticket.priority}`)
      console.log(`   Contexto: ${ticket.context_id}`)
      console.log(`   Categoria: ${category?.name || 'N/A'}`)
      console.log(`   Criado: ${ticket.created_at}`)
    })

    // 3. Análise por contexto
    console.log('\n📊 Análise por contexto:')
    const { data: contextStats, error: contextError } = await supabase
      .from('tickets')
      .select('context_id, contexts(name, type)')
      .not('context_id', 'is', null)

    if (contextError) {
      console.error('❌ Erro ao analisar por contexto:', contextError)
    } else {
      const contextCount = {}
      contextStats.forEach(ticket => {
        const contextName = ticket.contexts?.name || 'Sem contexto'
        contextCount[contextName] = (contextCount[contextName] || 0) + 1
      })

      Object.entries(contextCount).forEach(([context, count]) => {
        console.log(`   ${context}: ${count} tickets`)
      })
    }

    // 4. Análise por status
    console.log('\n📊 Análise por status:')
    const { data: statusStats, error: statusError } = await supabase
      .from('tickets')
      .select('status')

    if (statusError) {
      console.error('❌ Erro ao analisar por status:', statusError)
    } else {
      const statusCount = {}
      statusStats.forEach(ticket => {
        statusCount[ticket.status] = (statusCount[ticket.status] || 0) + 1
      })

      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`   ${status}: ${count} tickets`)
      })
    }

    // 5. Análise por categoria
    console.log('\n📊 Análise por categoria:')
    const { data: categoryStats, error: categoryError } = await supabase
      .from('tickets')
      .select(`
        categories(
          id,
          name,
          slug
        )
      `)
      .not('category_id', 'is', null)

    if (categoryError) {
      console.error('❌ Erro ao analisar por categoria:', categoryError)
    } else {
      const categoryCount = {}
      categoryStats.forEach(ticket => {
        if (ticket.categories) {
          const category = Array.isArray(ticket.categories) ? ticket.categories[0] : ticket.categories
          if (category) {
            const catName = category.name || 'Sem categoria'
            categoryCount[catName] = (categoryCount[catName] || 0) + 1
          }
        }
      })

      Object.entries(categoryCount).forEach(([category, count]) => {
        console.log(`   ${category}: ${count} tickets`)
      })
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar verificação
verificarTickets()
  .then(() => {
    console.log('\n✅ Verificação concluída!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro na verificação:', error)
    process.exit(1)
  })
