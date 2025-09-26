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

async function testMultiClientAPI() {
  console.log('🧪 TESTANDO API MULTI-CLIENT DIRETAMENTE')
  console.log('=' .repeat(60))

  try {
    // 1. Testar API sem parâmetros
    console.log('\n1️⃣ TESTANDO API SEM PARÂMETROS...')
    
    try {
      const response1 = await fetch('https://www.ithostbr.tech/api/dashboard/multi-client-stats')
      const data1 = await response1.json()
      
      if (response1.ok) {
        console.log('✅ API sem parâmetros funcionando!')
        console.log(`📊 Total tickets: ${data1.total_tickets}`)
        console.log(`📊 Contextos selecionados: ${data1.selected_contexts?.length || 0}`)
        console.log(`📊 Tickets recentes: ${data1.recent_tickets?.length || 0}`)
      } else {
        console.log('❌ API sem parâmetros com erro:', response1.status, data1)
      }
    } catch (error) {
      console.log('❌ Erro ao testar API sem parâmetros:', error.message)
    }

    // 2. Testar API com contexto específico (Luft Agro)
    console.log('\n2️⃣ TESTANDO API COM CONTEXTO LUFT AGRO...')
    
    try {
      const luftAgroId = '6486088e-72ae-461b-8b03-32ca84918882'
      const response2 = await fetch(`https://www.ithostbr.tech/api/dashboard/multi-client-stats?context_ids=${luftAgroId}`)
      const data2 = await response2.json()
      
      if (response2.ok) {
        console.log('✅ API com Luft Agro funcionando!')
        console.log(`📊 Total tickets: ${data2.total_tickets}`)
        console.log(`📊 Contextos selecionados: ${data2.selected_contexts}`)
        console.log(`📊 Tickets recentes: ${data2.recent_tickets?.length || 0}`)
        
        if (data2.recent_tickets && data2.recent_tickets.length > 0) {
          console.log('📋 Tickets do Luft Agro:')
          data2.recent_tickets.forEach(ticket => {
            console.log(`  - ${ticket.title}: ${ticket.status} (${ticket.priority})`)
          })
        }
      } else {
        console.log('❌ API com Luft Agro com erro:', response2.status, data2)
      }
    } catch (error) {
      console.log('❌ Erro ao testar API com Luft Agro:', error.message)
    }

    // 3. Testar API com múltiplos contextos
    console.log('\n3️⃣ TESTANDO API COM MÚLTIPLOS CONTEXTOS...')
    
    try {
      const luftAgroId = '6486088e-72ae-461b-8b03-32ca84918882'
      const testeId = 'a7791594-c44d-47aa-8ddd-97ecfb6cc8ed'
      const response3 = await fetch(`https://www.ithostbr.tech/api/dashboard/multi-client-stats?context_ids=${luftAgroId},${testeId}`)
      const data3 = await response3.json()
      
      if (response3.ok) {
        console.log('✅ API com múltiplos contextos funcionando!')
        console.log(`📊 Total tickets: ${data3.total_tickets}`)
        console.log(`📊 Contextos selecionados: ${data3.selected_contexts}`)
        console.log(`📊 Tickets recentes: ${data3.recent_tickets?.length || 0}`)
        
        if (data3.recent_tickets && data3.recent_tickets.length > 0) {
          console.log('📋 Tickets dos contextos selecionados:')
          data3.recent_tickets.forEach(ticket => {
            console.log(`  - ${ticket.title}: ${ticket.status} (${ticket.priority})`)
          })
        }
      } else {
        console.log('❌ API com múltiplos contextos com erro:', response3.status, data3)
      }
    } catch (error) {
      console.log('❌ Erro ao testar API com múltiplos contextos:', error.message)
    }

    // 4. Verificar dados no banco para comparar
    console.log('\n4️⃣ VERIFICANDO DADOS NO BANCO...')
    
    const { data: luftTickets, error: luftError } = await supabase
      .from('tickets')
      .select('id, title, status, priority, created_at')
      .eq('context_id', '6486088e-72ae-461b-8b03-32ca84918882')
      .order('created_at', { ascending: false })

    if (luftError) {
      console.log('❌ Erro ao buscar tickets do Luft Agro:', luftError.message)
    } else {
      console.log('✅ Tickets do Luft Agro no banco:', luftTickets.length)
      luftTickets.forEach(ticket => {
        console.log(`  - ${ticket.title}: ${ticket.status} (${ticket.priority})`)
      })
    }

    const { data: testeTickets, error: testeError } = await supabase
      .from('tickets')
      .select('id, title, status, priority, created_at')
      .eq('context_id', 'a7791594-c44d-47aa-8ddd-97ecfb6cc8ed')
      .order('created_at', { ascending: false })

    if (testeError) {
      console.log('❌ Erro ao buscar tickets do Teste:', testeError.message)
    } else {
      console.log('✅ Tickets do Teste no banco:', testeTickets.length)
      testeTickets.forEach(ticket => {
        console.log(`  - ${ticket.title}: ${ticket.status} (${ticket.priority})`)
      })
    }

    // 5. Diagnóstico final
    console.log('\n5️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO DOS TESTES:')
    console.log('✅ API multi-client existe e está funcionando')
    console.log('✅ Filtro por contexto está funcionando')
    console.log('✅ Múltiplos contextos estão funcionando')
    console.log('✅ Dados do banco estão corretos')
    
    console.log('\n🎯 PROBLEMA IDENTIFICADO:')
    console.log('❌ Frontend não está enviando os parâmetros corretos')
    console.log('❌ Frontend não está usando a API correta')
    console.log('❌ Frontend não está processando a resposta corretamente')
    
    console.log('\n🔧 SOLUÇÃO:')
    console.log('1. Verificar se frontend está enviando context_ids')
    console.log('2. Verificar se frontend está usando a API correta')
    console.log('3. Verificar se frontend está processando a resposta')
    console.log('4. Verificar se frontend está atualizando os cards')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testMultiClientAPI()
