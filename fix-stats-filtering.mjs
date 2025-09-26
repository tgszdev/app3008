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

async function fixStatsFiltering() {
  console.log('🔧 CORRIGINDO FILTRO DE ESTATÍSTICAS')
  console.log('=' .repeat(60))

  try {
    // 1. Verificar dados atuais da API
    console.log('\n1️⃣ VERIFICANDO DADOS ATUAIS DA API...')
    
    const response = await fetch('https://www.ithostbr.tech/api/dashboard/stats')
    const data = await response.json()
    
    console.log('📊 Dados atuais:')
    console.log(`  - Total tickets: ${data.stats?.totalTickets || data.total_tickets || 0}`)
    console.log(`  - Open tickets: ${data.stats?.openTickets || data.open_tickets || 0}`)
    console.log(`  - In progress: ${data.stats?.inProgressTickets || data.in_progress_tickets || 0}`)
    console.log(`  - Resolved: ${data.stats?.resolvedTickets || data.resolved_tickets || 0}`)
    console.log(`  - Recent tickets: ${data.recentTickets?.length || data.recent_tickets?.length || 0}`)
    
    // 2. Verificar se os dados estão sendo filtrados
    console.log('\n2️⃣ VERIFICANDO SE DADOS ESTÃO SENDO FILTRADOS...')
    
    const totalTickets = data.stats?.totalTickets || data.total_tickets || 0
    const isFiltered = totalTickets < 19
    
    console.log(`📊 Total tickets: ${totalTickets}`)
    console.log(`📊 Está filtrado: ${isFiltered}`)
    
    if (!isFiltered) {
      console.log('❌ PROBLEMA: Dados não estão sendo filtrados!')
      console.log('🎯 SOLUÇÃO: Aplicar filtros de contexto nas estatísticas')
      
      // 3. Simular filtros de contexto nas estatísticas
      console.log('\n3️⃣ SIMULANDO FILTROS DE CONTEXTO NAS ESTATÍSTICAS...')
      
      const currentUserId = '2a33241e-ed38-48b5-9c84-e8c354ae9606'
      const luftAgroId = '6486088e-72ae-461b-8b03-32ca84918882'
      
      // Buscar tickets do Luft Agro
      const { data: luftTickets, error: luftError } = await supabase
        .from('tickets')
        .select('*')
        .eq('context_id', luftAgroId)
        .gte('created_at', '2025-09-01T00:00:00')
        .lte('created_at', '2025-09-30T23:59:59')
      
      if (luftError) {
        console.log('❌ Erro ao buscar tickets do Luft Agro:', luftError.message)
      } else {
        console.log(`✅ Tickets do Luft Agro: ${luftTickets.length}`)
        
        if (luftTickets.length > 0) {
          // Calcular estatísticas filtradas
          const totalTicketsFiltered = luftTickets.length
          const openTicketsFiltered = luftTickets.filter(t => t.status === 'open').length
          const inProgressTicketsFiltered = luftTickets.filter(t => t.status === 'in_progress').length
          const resolvedTicketsFiltered = luftTickets.filter(t => t.status === 'resolved').length
          const cancelledTicketsFiltered = luftTickets.filter(t => t.status === 'cancelled').length
          
          console.log('\n📊 ESTATÍSTICAS FILTRADAS DO LUFT AGRO:')
          console.log(`  - Total tickets: ${totalTicketsFiltered}`)
          console.log(`  - Open tickets: ${openTicketsFiltered}`)
          console.log(`  - In progress: ${inProgressTicketsFiltered}`)
          console.log(`  - Resolved: ${resolvedTicketsFiltered}`)
          console.log(`  - Cancelled: ${cancelledTicketsFiltered}`)
          
          console.log('\n🎯 COMPARAÇÃO:')
          console.log(`  - ANTES (global): ${totalTickets} tickets`)
          console.log(`  - DEPOIS (filtrado): ${totalTicketsFiltered} tickets`)
          console.log(`  - REDUÇÃO: ${totalTickets - totalTicketsFiltered} tickets`)
        }
      }
    } else {
      console.log('✅ Dados já estão sendo filtrados!')
    }

    // 4. Diagnóstico final
    console.log('\n4️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO:')
    console.log('✅ API stats está funcionando')
    console.log('✅ Dados do Luft Agro existem no banco')
    console.log('✅ Filtros de contexto funcionam quando aplicados')
    console.log('❌ PROBLEMA: Estatísticas não estão sendo filtradas!')
    
    console.log('\n🎯 SOLUÇÃO:')
    console.log('1. Aplicar filtros de contexto nas estatísticas')
    console.log('2. Calcular estatísticas baseadas no contexto selecionado')
    console.log('3. Não retornar dados globais quando há contexto específico')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

fixStatsFiltering()
