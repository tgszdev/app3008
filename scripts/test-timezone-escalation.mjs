#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Importar funções de data do Brasil
function formatBrazilDateTime(date) {
  const options = {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }
  
  const brazilDate = new Date(date).toLocaleString('pt-BR', options)
  return brazilDate.replace(',', ' às')
}

async function testTimezoneAndEscalation() {
  console.log('🕐 Testando Timezone e Sistema de Escalação\n')
  console.log('=' . repeat(50))
  
  try {
    // 1. Mostrar hora atual em diferentes timezones
    const now = new Date()
    console.log('\n📅 Hora Atual:')
    console.log(`   UTC:              ${now.toISOString()}`)
    console.log(`   Brasil (UTC-3):   ${formatBrazilDateTime(now)}`)
    console.log(`   Unix Timestamp:   ${now.getTime()}`)
    
    // 2. Buscar alguns tickets e mostrar suas datas
    console.log('\n🎫 Tickets Recentes:')
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, title, created_at, status, priority')
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (ticketsError) {
      console.error('❌ Erro ao buscar tickets:', ticketsError)
    } else if (tickets && tickets.length > 0) {
      tickets.forEach(ticket => {
        const createdAt = new Date(ticket.created_at)
        const ageMinutes = Math.floor((now - createdAt) / (1000 * 60))
        const ageHours = Math.floor(ageMinutes / 60)
        
        console.log(`\n   Ticket: ${ticket.title}`)
        console.log(`   ID: ${ticket.id.slice(0, 8)}`)
        console.log(`   Status: ${ticket.status} | Prioridade: ${ticket.priority}`)
        console.log(`   Criado (UTC): ${ticket.created_at}`)
        console.log(`   Criado (Brasil): ${formatBrazilDateTime(ticket.created_at)}`)
        console.log(`   Idade: ${ageHours}h ${ageMinutes % 60}min (${ageMinutes} minutos total)`)
      })
    } else {
      console.log('   Nenhum ticket encontrado')
    }
    
    // 3. Verificar regras de escalação configuradas
    console.log('\n⚙️ Regras de Escalação Configuradas:')
    const { data: rules, error: rulesError } = await supabase
      .from('escalation_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority')
    
    if (rulesError) {
      console.error('❌ Erro ao buscar regras:', rulesError)
    } else if (rules && rules.length > 0) {
      rules.forEach(rule => {
        console.log(`\n   📋 ${rule.name}`)
        console.log(`   Tempo: ${rule.time_threshold} ${rule.time_unit}`)
        console.log(`   Condição: ${rule.time_condition}`)
        console.log(`   Status aplicável: ${JSON.stringify(rule.conditions?.status || 'todos')}`)
        console.log(`   Prioridades: ${JSON.stringify(rule.conditions?.priority || 'todas')}`)
        
        // Mostrar ações configuradas
        const actions = []
        if (rule.actions?.increase_priority) actions.push('Aumentar prioridade')
        if (rule.actions?.notify_supervisor) actions.push('Notificar supervisor')
        if (rule.actions?.escalate_to_management) actions.push('Escalar para gerência')
        if (rule.actions?.send_email_notification) actions.push('Enviar email')
        if (rule.actions?.add_comment) actions.push('Adicionar comentário')
        
        console.log(`   Ações: ${actions.join(', ') || 'Nenhuma'}`)
      })
    } else {
      console.log('   ⚠️ Nenhuma regra de escalação ativa encontrada')
      
      // Criar regras de exemplo
      console.log('\n   📝 Criando regras de escalação de exemplo...')
      
      const exampleRules = [
        {
          name: '1h sem atribuição',
          description: 'Escalar tickets não atribuídos após 1 hora',
          time_threshold: 60,
          time_unit: 'minutes',
          time_condition: 'unassigned',
          priority: 1,
          conditions: {
            status: ['open', 'aberto'],
            assigned_to: null
          },
          actions: {
            increase_priority: true,
            notify_supervisor: true,
            send_email_notification: true,
            add_comment: 'Ticket escalado automaticamente - 1 hora sem atribuição'
          },
          is_active: true
        },
        {
          name: '4h sem resposta',
          description: 'Escalar tickets sem resposta após 4 horas',
          time_threshold: 4,
          time_unit: 'hours',
          time_condition: 'no_response',
          priority: 2,
          conditions: {
            status: ['open', 'aberto', 'in_progress', 'em-progresso']
          },
          actions: {
            increase_priority: true,
            escalate_to_management: true,
            send_email_notification: true,
            add_comment: 'Ticket escalado automaticamente - 4 horas sem resposta'
          },
          is_active: true
        },
        {
          name: '24h sem resolução',
          description: 'Escalar tickets não resolvidos após 24 horas',
          time_threshold: 24,
          time_unit: 'hours',
          time_condition: 'unresolved',
          priority: 3,
          conditions: {
            status: ['open', 'aberto', 'in_progress', 'em-progresso'],
            priority: ['high', 'critical']
          },
          actions: {
            increase_priority: true,
            escalate_to_management: true,
            send_email_notification: true,
            add_comment: 'Ticket escalado automaticamente - 24 horas sem resolução (alta prioridade)'
          },
          is_active: true
        }
      ]
      
      for (const rule of exampleRules) {
        const { error } = await supabase
          .from('escalation_rules')
          .insert(rule)
        
        if (error) {
          console.error(`   ❌ Erro ao criar regra "${rule.name}":`, error.message)
        } else {
          console.log(`   ✅ Regra "${rule.name}" criada com sucesso`)
        }
      }
    }
    
    // 4. Verificar configuração de email
    console.log('\n📧 Configuração de Email:')
    const { data: emailSettings, error: emailSettingsError } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['email_provider', 'email_from'])
    
    if (emailSettingsError) {
      console.log('   ⚠️ Tabela system_settings não configurada')
      console.log('   💡 Execute: node scripts/setup-email-system.mjs')
    } else if (emailSettings && emailSettings.length > 0) {
      emailSettings.forEach(setting => {
        console.log(`   ${setting.key}: ${setting.value || 'não configurado'}`)
      })
    } else {
      console.log('   ⚠️ Configurações de email não encontradas')
    }
    
    // 5. Verificar tickets que precisam de escalação
    console.log('\n🚨 Tickets Candidatos à Escalação:')
    
    if (tickets && tickets.length > 0) {
      let candidatesCount = 0
      
      for (const ticket of tickets) {
        const ageMinutes = Math.floor((now - new Date(ticket.created_at)) / (1000 * 60))
        
        // Verificar se o ticket se qualifica para alguma regra
        if (ticket.status === 'open' || ticket.status === 'aberto') {
          if (ageMinutes >= 60) {
            candidatesCount++
            console.log(`   ⚠️ Ticket "${ticket.title}" - ${ageMinutes} minutos sem atribuição`)
          } else if (ageMinutes >= 240) {
            candidatesCount++
            console.log(`   ⚠️ Ticket "${ticket.title}" - ${Math.floor(ageMinutes/60)} horas sem resposta`)
          }
        }
      }
      
      if (candidatesCount === 0) {
        console.log('   ✅ Nenhum ticket precisa de escalação no momento')
      }
    }
    
    console.log('\n' + '=' . repeat(50))
    console.log('\n✅ Teste concluído!')
    console.log('\n📌 Observações:')
    console.log('1. Todas as datas devem ser exibidas no horário de Brasília (UTC-3)')
    console.log('2. Emails de escalação serão enviados quando os thresholds forem atingidos')
    console.log('3. Configure as credenciais de email na tabela system_settings')
    console.log('4. Execute a escalação periodicamente via cron ou worker')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    process.exit(1)
  }
}

// Executar teste
testTimezoneAndEscalation().catch(console.error)