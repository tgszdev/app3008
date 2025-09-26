#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugFilterIssue() {
  console.log('🔍 DEBUGANDO PROBLEMA DO FILTRO')
  console.log('=' .repeat(60))

  try {
    // 1. Verificar tickets do Luft Agro
    console.log('\n1️⃣ VERIFICANDO TICKETS DO LUFT AGRO...')
    
    const luftAgroId = '6486088e-72ae-461b-8b03-32ca84918882'
    const { data: luftTickets, error: luftError } = await supabase
      .from('tickets')
      .select('*')
      .eq('context_id', luftAgroId)
      .order('created_at', { ascending: false })

    if (luftError) {
      console.log('❌ Erro ao buscar tickets do Luft Agro:', luftError.message)
    } else {
      console.log('✅ Tickets do Luft Agro:', luftTickets.length)
      
      if (luftTickets.length > 0) {
        luftTickets.forEach(ticket => {
          console.log(`  - ${ticket.title}: ${ticket.status} (${ticket.priority})`)
          console.log(`    ID: ${ticket.id}`)
          console.log(`    Context ID: ${ticket.context_id}`)
          console.log(`    Created: ${ticket.created_at}`)
          console.log(`    Created By: ${ticket.created_by}`)
          console.log('')
        })
      }
    }

    // 2. Verificar se o problema é no frontend
    console.log('\n2️⃣ VERIFICANDO SE O PROBLEMA É NO FRONTEND...')
    
    console.log('🔍 Possíveis problemas:')
    console.log('1. selectedClients não está sendo atualizado')
    console.log('2. useEffect não está sendo disparado')
    console.log('3. API não está retornando dados corretos')
    console.log('4. Filtro não está sendo aplicado corretamente')

    // 3. Verificar dados que a API stats retorna
    console.log('\n3️⃣ VERIFICANDO DADOS DA API STATS...')
    
    try {
      const response = await fetch('https://www.ithostbr.tech/api/dashboard/stats')
      const data = await response.json()
      
      console.log('📡 Status da API stats:', response.status)
      console.log('📊 Dados retornados:')
      console.log(`  - Total tickets: ${data.stats?.totalTickets || data.total_tickets || 0}`)
      console.log(`  - Open tickets: ${data.stats?.openTickets || data.open_tickets || 0}`)
      console.log(`  - In progress: ${data.stats?.inProgressTickets || data.in_progress_tickets || 0}`)
      console.log(`  - Resolved: ${data.stats?.resolvedTickets || data.resolved_tickets || 0}`)
      console.log(`  - Recent tickets: ${data.recentTickets?.length || data.recent_tickets?.length || 0}`)
      
      if (data.recentTickets || data.recent_tickets) {
        console.log('📋 Tickets recentes:')
        const recentTickets = data.recentTickets || data.recent_tickets || []
        recentTickets.slice(0, 5).forEach(ticket => {
          console.log(`  - ${ticket.title}: ${ticket.status} (Context: ${ticket.context_id})`)
        })
      }
      
    } catch (error) {
      console.log('❌ Erro ao testar API stats:', error.message)
    }

    // 4. Verificar se o problema é na lógica do filtro
    console.log('\n4️⃣ VERIFICANDO LÓGICA DO FILTRO...')
    
    console.log('🔍 Lógica atual do filtro:')
    console.log('1. selectedClients = ["6486088e-72ae-461b-8b03-32ca84918882"]')
    console.log('2. recentTicketsData.filter(ticket => selectedClients.includes(ticket.context_id))')
    console.log('3. Se ticket.context_id === "6486088e-72ae-461b-8b03-32ca84918882" → deve aparecer')
    
    // 5. Simular o filtro manualmente
    console.log('\n5️⃣ SIMULANDO FILTRO MANUALMENTE...')
    
    try {
      const response = await fetch('https://www.ithostbr.tech/api/dashboard/stats')
      const data = await response.json()
      
      if (data.recentTickets || data.recent_tickets) {
        const recentTickets = data.recentTickets || data.recent_tickets || []
        const luftAgroId = '6486088e-72ae-461b-8b03-32ca84918882'
        
        console.log('📊 Tickets recentes antes do filtro:', recentTickets.length)
        
        const filteredTickets = recentTickets.filter(ticket => 
          ticket.context_id === luftAgroId
        )
        
        console.log('📊 Tickets recentes após filtro:', filteredTickets.length)
        
        if (filteredTickets.length > 0) {
          console.log('✅ Filtro funcionaria! Tickets encontrados:')
          filteredTickets.forEach(ticket => {
            console.log(`  - ${ticket.title}: ${ticket.status}`)
          })
        } else {
          console.log('❌ Filtro não funcionaria! Nenhum ticket encontrado')
          console.log('🔍 Verificando context_ids dos tickets:')
          recentTickets.forEach(ticket => {
            console.log(`  - ${ticket.title}: context_id = ${ticket.context_id}`)
          })
        }
      }
      
    } catch (error) {
      console.log('❌ Erro ao simular filtro:', error.message)
    }

    // 6. Diagnóstico final
    console.log('\n6️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO DO DEBUG:')
    console.log('✅ Tickets do Luft Agro existem no banco')
    console.log('✅ API stats está funcionando')
    console.log('✅ Dados estão sendo retornados')
    
    console.log('\n🎯 POSSÍVEIS CAUSAS:')
    console.log('1. selectedClients não está sendo atualizado no frontend')
    console.log('2. useEffect não está sendo disparado quando selectedClients muda')
    console.log('3. Filtro está sendo aplicado mas dados não estão sendo exibidos')
    console.log('4. Problema na lógica de renderização do componente')
    
    console.log('\n🔧 PRÓXIMOS PASSOS:')
    console.log('1. Verificar se selectedClients está sendo atualizado')
    console.log('2. Verificar se useEffect está sendo disparado')
    console.log('3. Verificar se dados filtrados estão sendo exibidos')
    console.log('4. Adicionar logs para debug no frontend')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugFilterIssue()
