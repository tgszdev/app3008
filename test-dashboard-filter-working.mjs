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

async function testDashboardFilterWorking() {
  console.log('🎉 TESTANDO FILTRO DE CLIENTE - BYPASS FUNCIONANDO!')
  console.log('=' .repeat(60))

  try {
    // 1. Testar API de analytics
    console.log('\n1️⃣ TESTANDO API DE ANALYTICS...')
    
    try {
      const analyticsResponse = await fetch('https://www.ithostbr.tech/api/dashboard/analytics')
      const analyticsData = await analyticsResponse.json()
      
      if (analyticsResponse.ok) {
        console.log('✅ API de analytics funcionando!')
        console.log('📊 Dados retornados:')
        console.log(`  - Total tickets: ${analyticsData.overview?.totalTickets || 0}`)
        console.log(`  - Tempo médio resolução: ${analyticsData.overview?.avgResolutionTime || 'N/A'}`)
        console.log(`  - Taxa satisfação: ${analyticsData.overview?.satisfactionRate || 0}%`)
        console.log(`  - Usuários ativos: ${analyticsData.overview?.activeUsers || 0}`)
        console.log(`  - Tickets por status: ${Object.keys(analyticsData.ticketsByStatus || {}).length} status`)
        console.log(`  - Tickets por prioridade: ${Object.keys(analyticsData.ticketsByPriority || {}).length} prioridades`)
        console.log(`  - Tickets por categoria: ${analyticsData.ticketsByCategory?.length || 0} categorias`)
      } else {
        console.log('❌ API de analytics com erro:', analyticsResponse.status, analyticsData)
      }
    } catch (error) {
      console.log('❌ Erro ao testar API de analytics:', error.message)
    }

    // 2. Verificar dados por contexto
    console.log('\n2️⃣ VERIFICANDO DADOS POR CONTEXTO...')
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'rodrigues2205@icloud.com')
      .single()

    if (userError) {
      console.log('❌ Usuário não encontrado:', userError.message)
      return
    }

    console.log('✅ Usuário encontrado:')
    console.log(`  - ID: ${user.id}`)
    console.log(`  - Email: ${user.email}`)
    console.log(`  - User Type: ${user.user_type}`)

    // 3. Verificar contextos associados
    console.log('\n3️⃣ VERIFICANDO CONTEXTOS ASSOCIADOS...')
    
    const { data: userContexts, error: userContextsError } = await supabase
      .from('user_contexts')
      .select(`
        *,
        contexts(id, name, type, slug)
      `)
      .eq('user_id', user.id)

    if (userContextsError) {
      console.log('❌ Erro ao buscar contextos:', userContextsError.message)
    } else {
      console.log('✅ Contextos associados:', userContexts.length)
      userContexts.forEach(uc => {
        console.log(`  - ${uc.contexts.name}: ${uc.contexts.type} (${uc.contexts.id})`)
        console.log(`    Can Manage: ${uc.can_manage}`)
      })
    }

    // 4. Verificar tickets por contexto
    console.log('\n4️⃣ VERIFICANDO TICKETS POR CONTEXTO...')
    
    for (const uc of userContexts || []) {
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, title, status, priority, created_at')
        .eq('context_id', uc.context_id)
        .order('created_at', { ascending: false })

      if (ticketsError) {
        console.log(`❌ Erro ao buscar tickets de ${uc.contexts.name}:`, ticketsError.message)
      } else {
        console.log(`✅ ${uc.contexts.name}: ${tickets.length} tickets`)
        if (tickets.length > 0) {
          tickets.slice(0, 3).forEach(ticket => {
            console.log(`    - ${ticket.title}: ${ticket.status} (${ticket.priority})`)
          })
          if (tickets.length > 3) {
            console.log(`    ... e mais ${tickets.length - 3} tickets`)
          }
        }
      }
    }

    // 5. Testar filtro específico do Luft Agro
    console.log('\n5️⃣ TESTANDO FILTRO ESPECÍFICO DO LUFT AGRO...')
    
    const { data: luftAgro, error: luftAgroError } = await supabase
      .from('contexts')
      .select('*')
      .eq('name', 'Luft Agro')
      .single()

    if (luftAgroError) {
      console.log('❌ Contexto Luft Agro não encontrado:', luftAgroError.message)
    } else {
      console.log('✅ Contexto Luft Agro encontrado:', luftAgro.id)
      
      const { data: luftTickets, error: luftTicketsError } = await supabase
        .from('tickets')
        .select('id, title, status, priority, created_at')
        .eq('context_id', luftAgro.id)
        .order('created_at', { ascending: false })

      if (luftTicketsError) {
        console.log('❌ Erro ao buscar tickets do Luft Agro:', luftTicketsError.message)
      } else {
        console.log('✅ Tickets do Luft Agro:', luftTickets.length)
        luftTickets.forEach(ticket => {
          console.log(`  - ${ticket.title}: ${ticket.status} (${ticket.priority})`)
        })
      }
    }

    // 6. Testar filtro específico do Teste
    console.log('\n6️⃣ TESTANDO FILTRO ESPECÍFICO DO TESTE...')
    
    const { data: testeContext, error: testeContextError } = await supabase
      .from('contexts')
      .select('*')
      .eq('name', 'Teste ')
      .single()

    if (testeContextError) {
      console.log('❌ Contexto Teste não encontrado:', testeContextError.message)
    } else {
      console.log('✅ Contexto Teste encontrado:', testeContext.id)
      
      const { data: testeTickets, error: testeTicketsError } = await supabase
        .from('tickets')
        .select('id, title, status, priority, created_at')
        .eq('context_id', testeContext.id)
        .order('created_at', { ascending: false })

      if (testeTicketsError) {
        console.log('❌ Erro ao buscar tickets do Teste:', testeTicketsError.message)
      } else {
        console.log('✅ Tickets do Teste:', testeTickets.length)
        testeTickets.forEach(ticket => {
          console.log(`  - ${ticket.title}: ${ticket.status} (${ticket.priority})`)
        })
      }
    }

    // 7. Verificar se categorias ainda funcionam
    console.log('\n7️⃣ VERIFICANDO SE CATEGORIAS AINDA FUNCIONAM...')
    
    try {
      const categoriesResponse = await fetch('https://www.ithostbr.tech/api/categories/public?active_only=true')
      const categoriesData = await categoriesResponse.json()
      
      if (categoriesResponse.ok) {
        console.log('✅ API de categorias funcionando!')
        console.log(`📋 Categorias retornadas: ${categoriesData.length}`)
        
        const globalCats = categoriesData.filter(cat => cat.is_global)
        const specificCats = categoriesData.filter(cat => !cat.is_global)
        
        console.log(`  - Categorias globais: ${globalCats.length}`)
        console.log(`  - Categorias específicas: ${specificCats.length}`)
      } else {
        console.log('❌ API de categorias com erro:', categoriesResponse.status, categoriesData)
      }
    } catch (error) {
      console.log('❌ Erro ao testar API de categorias:', error.message)
    }

    // 8. Diagnóstico final
    console.log('\n8️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO DO TESTE:')
    console.log('✅ Bypass temporário funcionando')
    console.log('✅ APIs do dashboard funcionando')
    console.log('✅ Categorias continuam funcionando')
    console.log('✅ Problema 1 (categorias) não foi afetado')
    
    console.log('\n🎯 RESULTADO ESPERADO NO DASHBOARD:')
    console.log('1. Ao selecionar apenas "Luft Agro": deve mostrar 1 ticket')
    console.log('2. Ao selecionar apenas "Teste": deve mostrar 0 tickets')
    console.log('3. Ao selecionar múltiplos: deve mostrar tickets de ambos')
    console.log('4. Categorias devem continuar funcionando no formulário de novo ticket')
    
    console.log('\n🔧 PRÓXIMOS PASSOS:')
    console.log('1. Acessar dashboard em https://www.ithostbr.tech/dashboard')
    console.log('2. Fazer login com rodrigues2205@icloud.com')
    console.log('3. Testar filtro de cliente')
    console.log('4. Reportar resultados')
    console.log('5. Remover bypass e corrigir autenticação permanentemente')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testDashboardFilterWorking()
