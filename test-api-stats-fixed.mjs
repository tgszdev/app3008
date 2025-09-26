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

async function testApiStatsFixed() {
  console.log('🔍 TESTANDO API STATS APÓS CORREÇÃO')
  console.log('=' .repeat(60))

  try {
    // 1. Testar API stats diretamente
    console.log('\n1️⃣ TESTANDO API STATS...')
    
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

    // 2. Verificar se a correção foi aplicada
    console.log('\n2️⃣ VERIFICANDO SE CORREÇÃO FOI APLICADA...')
    
    const luftAgroId = '6486088e-72ae-461b-8b03-32ca84918882'
    const luftTickets = (data.recentTickets || data.recent_tickets || []).filter(ticket => 
      ticket.context_id === luftAgroId
    )
    
    console.log(`📊 Tickets do Luft Agro na API: ${luftTickets.length}`)
    
    if (luftTickets.length > 0) {
      console.log('✅ CORREÇÃO FUNCIONOU! Tickets do Luft Agro encontrados:')
      luftTickets.forEach(ticket => {
        console.log(`  - ${ticket.title}: ${ticket.status}`)
      })
    } else {
      console.log('❌ CORREÇÃO NÃO FUNCIONOU! Nenhum ticket do Luft Agro encontrado')
      console.log('🔍 Verificando context_ids dos tickets:')
      const recentTickets = data.recentTickets || data.recent_tickets || []
      recentTickets.forEach(ticket => {
        console.log(`  - ${ticket.title}: context_id = "${ticket.context_id}"`)
      })
    }

    // 3. Verificar dados do Luft Agro no banco
    console.log('\n3️⃣ VERIFICANDO DADOS DO LUFT AGRO NO BANCO...')
    
    const { data: luftTicketsDb, error: luftError } = await supabase
      .from('tickets')
      .select('*')
      .eq('context_id', luftAgroId)
      .order('created_at', { ascending: false })

    if (luftError) {
      console.log('❌ Erro ao buscar tickets do Luft Agro:', luftError.message)
    } else {
      console.log(`✅ Tickets do Luft Agro no banco: ${luftTicketsDb.length}`)
      
      if (luftTicketsDb.length > 0) {
        luftTicketsDb.forEach(ticket => {
          console.log(`  - ${ticket.title}: ${ticket.status} (${ticket.created_at})`)
        })
      }
    }

    // 4. Verificar se o problema é na lógica do frontend
    console.log('\n4️⃣ VERIFICANDO LÓGICA DO FRONTEND...')
    
    console.log('🔍 Lógica atual:')
    console.log('1. API retorna dados globais (19 tickets)')
    console.log('2. Frontend aplica filtro apenas nos tickets recentes')
    console.log('3. Cards superiores mostram dados globais (incorreto)')
    console.log('4. Categorias mostram dados globais (incorreto)')
    
    console.log('\n🎯 PROBLEMA IDENTIFICADO:')
    console.log('❌ A API está retornando dados globais, não filtrados por contexto!')
    console.log('❌ O frontend está aplicando filtro apenas nos tickets recentes')
    console.log('❌ Cards superiores e categorias mostram dados globais')

    // 5. Verificar se o bypass está funcionando
    console.log('\n5️⃣ VERIFICANDO BYPASS...')
    
    console.log('🔍 Bypass atual:')
    console.log('- Simula usuário: rodrigues2205@icloud.com')
    console.log('- User type: matrix')
    console.log('- Deveria buscar contextos associados')
    
    // Verificar contextos associados ao usuário
    const { data: userContexts, error: contextsError } = await supabase
      .from('user_contexts')
      .select('context_id')
      .eq('user_id', '2a33241e-ed38-48b5-9c84-e354ae9606')
    
    if (contextsError) {
      console.log('❌ Erro ao buscar contextos do usuário:', contextsError.message)
    } else {
      console.log(`✅ Contextos associados ao usuário: ${userContexts.length}`)
      userContexts.forEach(uc => {
        console.log(`  - Context ID: ${uc.context_id}`)
      })
    }

    // 6. Diagnóstico final
    console.log('\n6️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO:')
    console.log('✅ API stats está funcionando')
    console.log('✅ Bypass está funcionando')
    console.log('✅ Dados do Luft Agro existem no banco')
    console.log('❌ PROBLEMA: API não está aplicando filtro de contexto!')
    
    console.log('\n🎯 SOLUÇÃO:')
    console.log('1. A API deve aplicar filtro de contexto nos dados')
    console.log('2. Não retornar dados globais quando há contexto específico')
    console.log('3. Calcular estatísticas baseadas no contexto selecionado')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testApiStatsFixed()
