import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase com service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createValidTickets() {
  console.log('🎫 CRIANDO TICKETS VÁLIDOS')
  console.log('=========================')
  
  try {
    // 1. Buscar contextos existentes
    const { data: contexts } = await supabase
      .from('contexts')
      .select('id, name')
      .order('name')
    
    console.log('🏢 Contextos disponíveis:', contexts?.map(c => c.name))
    
    // 2. Buscar usuários existentes
    const { data: users } = await supabase
      .from('users')
      .select('id, email, name')
      .limit(5)
    
    console.log('👤 Usuários disponíveis:', users?.map(u => u.email))
    
    // 3. Criar tickets válidos
    if (contexts && users && contexts.length > 0 && users.length > 0) {
      const simasContext = contexts.find(c => c.name.includes('Simas'))
      const luftContext = contexts.find(c => c.name.includes('Luft'))
      const testUser = users[0]
      
      if (simasContext && testUser) {
        console.log(`\n🎫 Criando tickets para ${simasContext.name}:`)
        
        const simasTickets = [
          {
            title: 'Problema no sistema de login',
            description: 'Usuários não conseguem fazer login no sistema',
            status: 'open',
            priority: 'high',
            context_id: simasContext.id,
            created_by: testUser.id,
            ticket_number: 1001
          },
          {
            title: 'Relatório de vendas não carrega',
            description: 'O relatório de vendas está com erro ao carregar',
            status: 'in_progress',
            priority: 'medium',
            context_id: simasContext.id,
            created_by: testUser.id,
            ticket_number: 1002
          },
          {
            title: 'Backup automático falhando',
            description: 'O backup automático não está funcionando',
            status: 'resolved',
            priority: 'critical',
            context_id: simasContext.id,
            created_by: testUser.id,
            ticket_number: 1003
          },
          {
            title: 'Interface mobile com problemas',
            description: 'A interface mobile está com layout quebrado',
            status: 'open',
            priority: 'medium',
            context_id: simasContext.id,
            created_by: testUser.id,
            ticket_number: 1004
          },
          {
            title: 'Integração com API externa',
            description: 'Problema na integração com API de pagamentos',
            status: 'in_progress',
            priority: 'high',
            context_id: simasContext.id,
            created_by: testUser.id,
            ticket_number: 1005
          },
          {
            title: 'Relatório de estoque',
            description: 'Relatório de estoque com dados incorretos',
            status: 'resolved',
            priority: 'low',
            context_id: simasContext.id,
            created_by: testUser.id,
            ticket_number: 1006
          }
        ]
        
        const { data: insertedTickets, error: ticketError } = await supabase
          .from('tickets')
          .insert(simasTickets)
          .select()
        
        if (ticketError) {
          console.log('❌ Erro ao criar tickets:', ticketError)
        } else {
          console.log(`✅ ${insertedTickets?.length || 0} tickets criados para ${simasContext.name}`)
          insertedTickets?.forEach(ticket => {
            console.log(`  - #${ticket.ticket_number}: ${ticket.title} (${ticket.status})`)
          })
        }
      }
      
      if (luftContext && testUser) {
        console.log(`\n🎫 Criando tickets para ${luftContext.name}:`)
        
        const luftTickets = [
          {
            title: 'Sistema de gestão agrícola',
            description: 'Problema no sistema de gestão de cultivos',
            status: 'open',
            priority: 'high',
            context_id: luftContext.id,
            created_by: testUser.id,
            ticket_number: 2001
          },
          {
            title: 'Relatório de produtividade',
            description: 'Relatório de produtividade com dados incorretos',
            status: 'in_progress',
            priority: 'medium',
            context_id: luftContext.id,
            created_by: testUser.id,
            ticket_number: 2002
          },
          {
            title: 'Integração com sensores',
            description: 'Problema na integração com sensores de campo',
            status: 'resolved',
            priority: 'critical',
            context_id: luftContext.id,
            created_by: testUser.id,
            ticket_number: 2003
          }
        ]
        
        const { data: insertedLuftTickets, error: luftTicketError } = await supabase
          .from('tickets')
          .insert(luftTickets)
          .select()
        
        if (luftTicketError) {
          console.log('❌ Erro ao criar tickets do Luft:', luftTicketError)
        } else {
          console.log(`✅ ${insertedLuftTickets?.length || 0} tickets criados para ${luftContext.name}`)
          insertedLuftTickets?.forEach(ticket => {
            console.log(`  - #${ticket.ticket_number}: ${ticket.title} (${ticket.status})`)
          })
        }
      }
    }
    
    // 4. Verificar dados finais
    console.log('\n✅ VERIFICAÇÃO FINAL:')
    
    const { data: allTickets } = await supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        title,
        status,
        contexts(name)
      `)
      .order('created_at', { ascending: false })
    
    console.log(`🎫 Total de tickets: ${allTickets?.length || 0}`)
    allTickets?.forEach(ticket => {
      console.log(`  - #${ticket.ticket_number}: ${ticket.title} (${ticket.status}) - ${ticket.contexts?.name}`)
    })
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar criação de tickets
createValidTickets()
