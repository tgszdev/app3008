#!/usr/bin/env node

// Script para testar escalação manualmente
import { createClient } from '@supabase/supabase-js'
import { executeEscalationForTicket } from './src/lib/escalation-engine.js'

// Configurações do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas')
  console.log('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testEscalation() {
  console.log('🧪 Testando sistema de escalação...\n')

  try {
    // 1. Verificar se existem regras de escalação
    console.log('1️⃣ Verificando regras de escalação...')
    const { data: rules, error: rulesError } = await supabase
      .from('escalation_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (rulesError) {
      console.error('❌ Erro ao buscar regras:', rulesError.message)
      return
    }

    console.log(`✅ Encontradas ${rules?.length || 0} regras de escalação ativas`)
    
    if (rules && rules.length > 0) {
      rules.forEach((rule, index) => {
        console.log(`   ${index + 1}. ${rule.name} (${rule.time_threshold} ${rule.time_unit})`)
        console.log(`      Condições: ${JSON.stringify(rule.conditions)}`)
        console.log(`      Ações: ${JSON.stringify(rule.actions)}`)
      })
    } else {
      console.log('⚠️ Nenhuma regra de escalação encontrada!')
      console.log('   Crie regras em /dashboard/settings → Escalação por Tempo')
      return
    }

    // 2. Buscar tickets que podem precisar de escalação
    console.log('\n2️⃣ Buscando tickets para teste...')
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email),
        assigned_to_user:users!tickets_assigned_to_fkey(id, name, email),
        category_info:categories!tickets_category_id_fkey(id, name, slug)
      `)
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: true })
      .limit(5)

    if (ticketsError) {
      console.error('❌ Erro ao buscar tickets:', ticketsError.message)
      return
    }

    console.log(`✅ Encontrados ${tickets?.length || 0} tickets para teste`)
    
    if (!tickets || tickets.length === 0) {
      console.log('⚠️ Nenhum ticket encontrado para teste!')
      return
    }

    // 3. Testar escalação em cada ticket
    console.log('\n3️⃣ Testando escalação em cada ticket...')
    
    for (const ticket of tickets) {
      console.log(`\n🎫 Testando ticket #${ticket.id}:`)
      console.log(`   Título: ${ticket.title}`)
      console.log(`   Status: ${ticket.status}`)
      console.log(`   Prioridade: ${ticket.priority}`)
      console.log(`   Criado em: ${new Date(ticket.created_at).toLocaleString('pt-BR')}`)
      console.log(`   Atribuído para: ${ticket.assigned_to_user?.name || 'Não atribuído'}`)
      
      // Calcular tempo decorrido
      const now = new Date()
      const createdAt = new Date(ticket.created_at)
      const timeElapsed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60)) // em minutos
      console.log(`   Tempo decorrido: ${timeElapsed} minutos (${Math.floor(timeElapsed / 60)}h ${timeElapsed % 60}m)`)

      try {
        console.log(`   🚨 Executando escalação...`)
        const result = await executeEscalationForTicket(ticket.id, true) // forceExecution = true
        
        if (result.success) {
          console.log(`   ✅ Escalação executada com sucesso!`)
          if (result.executedRules && result.executedRules.length > 0) {
            console.log(`   📋 Regras executadas: ${result.executedRules.length}`)
            result.executedRules.forEach(rule => {
              console.log(`      - ${rule.name}`)
            })
          } else {
            console.log(`   ℹ️ Nenhuma regra foi executada (condições não atendidas)`)
          }
        } else {
          console.log(`   ❌ Falha na escalação: ${result.error}`)
        }
      } catch (error) {
        console.log(`   ❌ Erro ao executar escalação: ${error.message}`)
      }
    }

    // 4. Verificar logs de escalação
    console.log('\n4️⃣ Verificando logs de escalação...')
    const { data: logs, error: logsError } = await supabase
      .from('escalation_logs')
      .select('*')
      .order('triggered_at', { ascending: false })
      .limit(10)

    if (logsError) {
      console.log('⚠️ Erro ao buscar logs:', logsError.message)
    } else {
      console.log(`✅ Encontrados ${logs?.length || 0} logs de escalação`)
      if (logs && logs.length > 0) {
        logs.forEach((log, index) => {
          console.log(`   ${index + 1}. ${log.escalation_type} - ${log.success ? '✅' : '❌'} - ${new Date(log.triggered_at).toLocaleString('pt-BR')}`)
        })
      }
    }

    console.log('\n🎉 Teste de escalação concluído!')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar teste
testEscalation()
  .then(() => {
    console.log('\n✅ Script concluído')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Erro fatal:', error.message)
    process.exit(1)
  })
