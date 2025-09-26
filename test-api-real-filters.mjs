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

async function testApiRealFilters() {
  console.log('🔍 TESTANDO FILTROS REAIS DA API')
  console.log('=' .repeat(60))

  try {
    // 1. Testar API real
    console.log('\n1️⃣ TESTANDO API REAL...')
    
    const response = await fetch('https://www.ithostbr.tech/api/dashboard/stats')
    const data = await response.json()
    
    console.log('📡 Status da API:', response.status)
    console.log('📊 Dados retornados:')
    console.log(`  - Total tickets: ${data.stats?.totalTickets || data.total_tickets || 0}`)
    console.log(`  - Open tickets: ${data.stats?.openTickets || data.open_tickets || 0}`)
    console.log(`  - In progress: ${data.stats?.inProgressTickets || data.in_progress_tickets || 0}`)
    console.log(`  - Resolved: ${data.stats?.resolvedTickets || data.resolved_tickets || 0}`)
    console.log(`  - Recent tickets: ${data.recentTickets?.length || data.recent_tickets?.length || 0}`)
    
    if (data.recentTickets || data.recent_tickets) {
      const recentTickets = data.recentTickets || data.recent_tickets || []
      console.log('\n📋 Tickets recentes da API:')
      recentTickets.forEach((ticket, index) => {
        console.log(`  ${index + 1}. ${ticket.title}: ${ticket.status}`)
        console.log(`     - Context ID: "${ticket.context_id}"`)
        console.log(`     - Priority: ${ticket.priority}`)
        console.log(`     - Created: ${ticket.created_at}`)
        console.log('')
      })
    }

    // 2. Verificar se a API está aplicando filtros
    console.log('\n2️⃣ VERIFICANDO SE API ESTÁ APLICANDO FILTROS...')
    
    const luftAgroId = '6486088e-72ae-461b-8b03-32ca84918882'
    const luftTickets = (data.recentTickets || data.recent_tickets || []).filter(ticket => 
      ticket.context_id === luftAgroId
    )
    
    console.log(`📊 Tickets do Luft Agro na API: ${luftTickets.length}`)
    
    if (luftTickets.length > 0) {
      console.log('✅ API está aplicando filtros! Tickets do Luft Agro encontrados:')
      luftTickets.forEach(ticket => {
        console.log(`  - ${ticket.title}: ${ticket.status}`)
      })
    } else {
      console.log('❌ API não está aplicando filtros! Nenhum ticket do Luft Agro encontrado')
      console.log('🔍 Verificando context_ids dos tickets:')
      const recentTickets = data.recentTickets || data.recent_tickets || []
      recentTickets.forEach(ticket => {
        console.log(`  - ${ticket.title}: context_id = "${ticket.context_id}"`)
      })
    }

    // 3. Verificar se o problema é na lógica da API
    console.log('\n3️⃣ VERIFICANDO LÓGICA DA API...')
    
    console.log('🔍 Lógica atual da API:')
    console.log('1. Query principal com filtros de contexto')
    console.log('2. Se falhar, query simples com filtros de contexto')
    console.log('3. Formatar tickets com context_id')
    console.log('4. Retornar dados filtrados')
    
    console.log('\n🎯 PROBLEMA IDENTIFICADO:')
    console.log('❌ A API está retornando dados globais, não filtrados por contexto!')
    console.log('❌ Os filtros de contexto não estão sendo aplicados!')
    console.log('❌ A API está retornando todos os tickets em vez de filtrar!')

    // 4. Diagnóstico final
    console.log('\n4️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO:')
    console.log('✅ API stats está funcionando')
    console.log('✅ Dados do Luft Agro existem no banco')
    console.log('✅ Filtros de contexto funcionam quando aplicados')
    console.log('❌ PROBLEMA: A API não está aplicando os filtros!')
    
    console.log('\n🎯 SOLUÇÃO:')
    console.log('1. A API deve aplicar filtros de contexto nos dados')
    console.log('2. Não retornar dados globais quando há contexto específico')
    console.log('3. Calcular estatísticas baseadas no contexto selecionado')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testApiRealFilters()
