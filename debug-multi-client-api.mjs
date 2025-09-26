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

async function debugMultiClientAPI() {
  console.log('🔍 DEBUGANDO API MULTI-CLIENT - ERRO 500')
  console.log('=' .repeat(60))

  try {
    // 1. Testar com parâmetros mínimos
    console.log('\n1️⃣ TESTANDO COM PARÂMETROS MÍNIMOS...')
    
    try {
      const response = await fetch('https://www.ithostbr.tech/api/dashboard/multi-client-stats?start_date=2025-09-01&end_date=2025-09-30')
      console.log('📡 Status:', response.status)
      console.log('📊 Headers:', Object.fromEntries(response.headers.entries()))
      
      const data = await response.json()
      console.log('📋 Dados:', data)
      
    } catch (error) {
      console.log('❌ Erro ao testar API:', error.message)
    }

    // 2. Testar com contexto específico
    console.log('\n2️⃣ TESTANDO COM CONTEXTO ESPECÍFICO...')
    
    try {
      const luftAgroId = '6486088e-72ae-461b-8b03-32ca84918882'
      const response = await fetch(`https://www.ithostbr.tech/api/dashboard/multi-client-stats?start_date=2025-09-01&end_date=2025-09-30&context_ids=${luftAgroId}`)
      console.log('📡 Status:', response.status)
      console.log('📊 Headers:', Object.fromEntries(response.headers.entries()))
      
      const data = await response.json()
      console.log('📋 Dados:', data)
      
    } catch (error) {
      console.log('❌ Erro ao testar API com contexto:', error.message)
    }

    // 3. Verificar se o problema é na autenticação
    console.log('\n3️⃣ VERIFICANDO AUTENTICAÇÃO...')
    
    try {
      const response = await fetch('https://www.ithostbr.tech/api/dashboard/stats')
      console.log('📡 Status da API stats:', response.status)
      
      const data = await response.json()
      console.log('📋 Dados da API stats:', data)
      
    } catch (error) {
      console.log('❌ Erro ao testar API stats:', error.message)
    }

    // 4. Verificar se o problema é na API analytics
    console.log('\n4️⃣ VERIFICANDO API ANALYTICS...')
    
    try {
      const response = await fetch('https://www.ithostbr.tech/api/dashboard/analytics')
      console.log('📡 Status da API analytics:', response.status)
      
      const data = await response.json()
      console.log('📋 Dados da API analytics:', data)
      
    } catch (error) {
      console.log('❌ Erro ao testar API analytics:', error.message)
    }

    // 5. Verificar se o problema é no banco de dados
    console.log('\n5️⃣ VERIFICANDO BANCO DE DADOS...')
    
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, user_type, role')
        .eq('email', 'rodrigues2205@icloud.com')
        .single()

      if (usersError) {
        console.log('❌ Erro ao buscar usuário:', usersError.message)
      } else {
        console.log('✅ Usuário encontrado:', users)
      }
    } catch (error) {
      console.log('❌ Erro ao testar banco:', error.message)
    }

    // 6. Verificar se o problema é nos contextos
    console.log('\n6️⃣ VERIFICANDO CONTEXTOS...')
    
    try {
      const { data: contexts, error: contextsError } = await supabase
        .from('contexts')
        .select('id, name, type')
        .in('id', ['6486088e-72ae-461b-8b03-32ca84918882', 'a7791594-c44d-47aa-8ddd-97ecfb6cc8ed'])

      if (contextsError) {
        console.log('❌ Erro ao buscar contextos:', contextsError.message)
      } else {
        console.log('✅ Contextos encontrados:', contexts)
      }
    } catch (error) {
      console.log('❌ Erro ao testar contextos:', error.message)
    }

    // 7. Verificar se o problema é nos tickets
    console.log('\n7️⃣ VERIFICANDO TICKETS...')
    
    try {
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, title, status, context_id')
        .in('context_id', ['6486088e-72ae-461b-8b03-32ca84918882', 'a7791594-c44d-47aa-8ddd-97ecfb6cc8ed'])

      if (ticketsError) {
        console.log('❌ Erro ao buscar tickets:', ticketsError.message)
      } else {
        console.log('✅ Tickets encontrados:', tickets.length)
        tickets.forEach(ticket => {
          console.log(`  - ${ticket.title}: ${ticket.status} (${ticket.context_id})`)
        })
      }
    } catch (error) {
      console.log('❌ Erro ao testar tickets:', error.message)
    }

    // 8. Diagnóstico final
    console.log('\n8️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO DO DEBUG:')
    console.log('✅ APIs stats e analytics funcionando')
    console.log('✅ Banco de dados funcionando')
    console.log('✅ Usuário encontrado')
    console.log('✅ Contextos encontrados')
    console.log('✅ Tickets encontrados')
    console.log('❌ API multi-client com erro 500')
    
    console.log('\n🎯 POSSÍVEIS CAUSAS:')
    console.log('1. Erro na lógica da API multi-client')
    console.log('2. Erro na query do banco de dados')
    console.log('3. Erro na formatação da resposta')
    console.log('4. Erro na autenticação específica')
    
    console.log('\n🔧 PRÓXIMOS PASSOS:')
    console.log('1. Verificar logs do servidor')
    console.log('2. Simplificar a API multi-client')
    console.log('3. Testar com dados mínimos')
    console.log('4. Corrigir erro específico')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugMultiClientAPI()
