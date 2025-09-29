import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugTicketsAPI() {
  console.log('🔍 DEBUG: Testando API de tickets...')
  
  try {
    // 1. Buscar tickets com informações do usuário criador
    console.log('\n📋 1. Buscando tickets com informações do usuário criador...')
    const { data: ticketsWithUsers, error: ticketsError } = await supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        title,
        status,
        priority,
        created_at,
        created_by,
        assigned_to,
        context_id,
        created_by_user:users!tickets_created_by_fkey(id, name, email),
        assigned_to_user:users!tickets_assigned_to_fkey(id, name, email)
      `)
      .limit(5)

    if (ticketsError) {
      console.error('❌ Erro ao buscar tickets:', ticketsError)
    } else {
      console.log('✅ Tickets encontrados:', ticketsWithUsers?.length || 0)
      ticketsWithUsers?.forEach(ticket => {
        console.log(`  - #${ticket.ticket_number}: ${ticket.title}`)
        console.log(`    Status: ${ticket.status}`)
        console.log(`    Prioridade: ${ticket.priority}`)
        console.log(`    Criado por: ${ticket.created_by_user?.name || 'N/A'} (${ticket.created_by_user?.email || 'N/A'})`)
        console.log(`    Atribuído a: ${ticket.assigned_to_user?.name || 'N/A'}`)
        console.log('')
      })
    }

    // 2. Buscar status disponíveis
    console.log('\n📊 2. Buscando status disponíveis...')
    const { data: statuses, error: statusError } = await supabase
      .from('ticket_statuses')
      .select('id, name, slug, color, order_index')
      .order('order_index', { ascending: true })

    if (statusError) {
      console.error('❌ Erro ao buscar status:', statusError)
    } else {
      console.log('✅ Status encontrados:', statuses?.length || 0)
      statuses?.forEach(status => {
        console.log(`  - ${status.name} (${status.slug}): ${status.color} - ordem: ${status.order_index}`)
      })
    }

    // 3. Verificar mapeamento de status
    console.log('\n🎯 3. Verificando mapeamento de status...')
    const uniqueStatuses = [...new Set(ticketsWithUsers?.map(t => t.status) || [])]
    console.log('Status únicos dos tickets:', uniqueStatuses)
    
    uniqueStatuses.forEach(ticketStatus => {
      const matchingStatus = statuses?.find(s => s.slug === ticketStatus)
      if (matchingStatus) {
        console.log(`  ✅ ${ticketStatus} -> ${matchingStatus.name} (${matchingStatus.color})`)
      } else {
        console.log(`  ❌ ${ticketStatus} -> NÃO ENCONTRADO na tabela de status`)
      }
    })

    // 4. Testar API multi-client-analytics
    console.log('\n🌐 4. Testando API multi-client-analytics...')
    
    // Buscar contextos disponíveis
    const { data: contexts, error: contextsError } = await supabase
      .from('contexts')
      .select('id, name, type, slug')
      .limit(3)

    if (contextsError) {
      console.error('❌ Erro ao buscar contextos:', contextsError)
    } else {
      console.log('✅ Contextos encontrados:', contexts?.length || 0)
      contexts?.forEach(context => {
        console.log(`  - ${context.name} (${context.id})`)
      })
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugTicketsAPI()
