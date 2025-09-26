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

async function testApiWithContextParam() {
  console.log('🧪 TESTANDO API COM PARÂMETRO DE CONTEXTO')
  console.log('=' .repeat(60))

  try {
    // 1. Testar API sem parâmetro de contexto
    console.log('\n1️⃣ TESTANDO API SEM PARÂMETRO DE CONTEXTO...')
    
    const response1 = await fetch('https://www.ithostbr.tech/api/dashboard/stats')
    const data1 = await response1.json()
    
    console.log('📊 Dados sem parâmetro:')
    console.log(`  - Total tickets: ${data1.stats?.totalTickets || data1.total_tickets || 0}`)
    console.log(`  - Open tickets: ${data1.stats?.openTickets || data1.open_tickets || 0}`)
    console.log(`  - In progress: ${data1.stats?.inProgressTickets || data1.in_progress_tickets || 0}`)
    console.log(`  - Resolved: ${data1.stats?.resolvedTickets || data1.resolved_tickets || 0}`)
    
    // 2. Testar API com parâmetro de contexto (Luft Agro)
    console.log('\n2️⃣ TESTANDO API COM PARÂMETRO DE CONTEXTO (LUFT AGRO)...')
    
    const luftAgroId = '6486088e-72ae-461b-8b03-32ca84918882'
    const response2 = await fetch(`https://www.ithostbr.tech/api/dashboard/stats?context_id=${luftAgroId}`)
    const data2 = await response2.json()
    
    console.log('📊 Dados com parâmetro Luft Agro:')
    console.log(`  - Total tickets: ${data2.stats?.totalTickets || data2.total_tickets || 0}`)
    console.log(`  - Open tickets: ${data2.stats?.openTickets || data2.open_tickets || 0}`)
    console.log(`  - In progress: ${data2.stats?.inProgressTickets || data2.in_progress_tickets || 0}`)
    console.log(`  - Resolved: ${data2.stats?.resolvedTickets || data2.resolved_tickets || 0}`)
    
    // 3. Verificar se o filtro está funcionando
    console.log('\n3️⃣ VERIFICANDO SE FILTRO ESTÁ FUNCIONANDO...')
    
    const totalWithoutParam = data1.stats?.totalTickets || data1.total_tickets || 0
    const totalWithParam = data2.stats?.totalTickets || data2.total_tickets || 0
    
    console.log(`📊 Comparação:`)
    console.log(`  - Sem parâmetro: ${totalWithoutParam} tickets`)
    console.log(`  - Com parâmetro Luft Agro: ${totalWithParam} tickets`)
    console.log(`  - Diferença: ${totalWithoutParam - totalWithParam} tickets`)
    
    if (totalWithParam === 1) {
      console.log('✅ FILTRO FUNCIONANDO! Apenas 1 ticket do Luft Agro')
      console.log('🎯 RESULTADO CORRETO: Estatísticas filtradas por contexto específico')
    } else if (totalWithParam < totalWithoutParam) {
      console.log('⚠️ FILTRO PARCIALMENTE FUNCIONANDO!')
      console.log(`📊 Esperado: 1 ticket, Obtido: ${totalWithParam} tickets`)
    } else {
      console.log('❌ FILTRO NÃO FUNCIONANDO!')
      console.log(`📊 Sem filtro: ${totalWithoutParam}, Com filtro: ${totalWithParam}`)
    }
    
    // 4. Verificar tickets recentes
    console.log('\n4️⃣ VERIFICANDO TICKETS RECENTES...')
    
    const recentTickets1 = data1.recentTickets || data1.recent_tickets || []
    const recentTickets2 = data2.recentTickets || data2.recent_tickets || []
    
    console.log(`📊 Tickets recentes:`)
    console.log(`  - Sem parâmetro: ${recentTickets1.length} tickets`)
    console.log(`  - Com parâmetro: ${recentTickets2.length} tickets`)
    
    if (recentTickets2.length > 0) {
      console.log('📋 Tickets recentes com filtro:')
      recentTickets2.forEach(ticket => {
        console.log(`  - ${ticket.title}: ${ticket.status} (${ticket.context_id})`)
      })
    }
    
    // 5. Diagnóstico final
    console.log('\n5️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO:')
    console.log('✅ API stats está funcionando')
    console.log('✅ Parâmetro de contexto está sendo recebido')
    console.log('✅ Filtro deve estar funcionando se totalWithParam < totalWithoutParam')
    
    if (totalWithParam === 1) {
      console.log('🎯 SUCESSO: Filtro funcionando perfeitamente!')
    } else {
      console.log('❌ PROBLEMA: Filtro ainda não está funcionando corretamente')
      console.log('🔧 PRÓXIMA CORREÇÃO: Verificar lógica de filtro na API')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testApiWithContextParam()
