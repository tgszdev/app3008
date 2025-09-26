import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODUxODYsImV4cCI6MjA3MjE2MTE4Nn0.ht9a6MmtkfE5hVRmwpfyMcW24a4R7n-9hoW6eYd3K2w'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testTicketCreation() {
  console.log('🧪 TESTE: Criação de tickets para análise')
  console.log('=' .repeat(60))
  
  try {
    // 1. VERIFICAR USUÁRIOS
    console.log('\n📊 1. VERIFICANDO USUÁRIOS:')
    console.log('-'.repeat(40))
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, user_type, context_id')
      .in('email', ['agro@agro.com.br', 'simas@simas.com.br'])
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError)
      return
    }
    
    console.log(`📊 Usuários encontrados: ${users?.length || 0}`)
    if (users && users.length > 0) {
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} - ${user.name} - Tipo: ${user.user_type} - Context: ${user.context_id}`)
      })
    }
    
    // 2. VERIFICAR CATEGORIAS
    console.log('\n📊 2. VERIFICANDO CATEGORIAS:')
    console.log('-'.repeat(40))
    
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, is_active, is_global, context_id')
      .eq('is_active', true)
    
    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias:', categoriesError)
      return
    }
    
    console.log(`📊 Categorias encontradas: ${categories?.length || 0}`)
    if (categories && categories.length > 0) {
      categories.forEach((category, index) => {
        console.log(`  ${index + 1}. ${category.name} - Global: ${category.is_global} - Context: ${category.context_id}`)
      })
    }
    
    // 3. VERIFICAR TICKETS EXISTENTES
    console.log('\n📊 3. VERIFICANDO TICKETS EXISTENTES:')
    console.log('-'.repeat(40))
    
    const { data: existingTickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, ticket_number, title, created_at, context_id')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (ticketsError) {
      console.error('❌ Erro ao buscar tickets:', ticketsError)
      return
    }
    
    console.log(`📊 Tickets existentes: ${existingTickets?.length || 0}`)
    if (existingTickets && existingTickets.length > 0) {
      existingTickets.forEach((ticket, index) => {
        console.log(`  ${index + 1}. #${ticket.ticket_number} - ${ticket.title} - ${ticket.created_at}`)
      })
    }
    
    // 4. TESTAR CRIAÇÃO DE TICKET VIA API
    console.log('\n🧪 4. TESTANDO CRIAÇÃO DE TICKET VIA API:')
    console.log('-'.repeat(40))
    
    if (users && users.length > 0 && categories && categories.length > 0) {
      const user = users[0] // Usar primeiro usuário
      const category = categories[0] // Usar primeira categoria
      
      const testTicketData = {
        title: `Teste Ticket ${Date.now()}`,
        description: 'Ticket de teste para análise do problema',
        priority: 'medium',
        category_id: category.id,
        created_by: user.id,
        is_internal: false,
        context_id: user.context_id
      }
      
      console.log('📤 Enviando dados do ticket:', testTicketData)
      
      const response = await fetch('https://www.ithostbr.tech/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testTicketData)
      })
      
      console.log(`📊 Status da resposta: ${response.status}`)
      
      if (response.ok) {
        const newTicket = await response.json()
        console.log('✅ Ticket criado com sucesso!')
        console.log(`🎫 Ticket ID: ${newTicket.id}`)
        console.log(`🎫 Ticket Number: #${newTicket.ticket_number}`)
        console.log(`🎫 Título: ${newTicket.title}`)
        console.log(`🎫 Context: ${newTicket.context_id}`)
        
        // 5. VERIFICAR SE O TICKET FOI CRIADO NO BANCO
        console.log('\n📊 5. VERIFICANDO TICKET NO BANCO:')
        console.log('-'.repeat(40))
        
        const { data: createdTicket, error: createdError } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', newTicket.id)
          .single()
        
        if (createdError) {
          console.error('❌ Erro ao buscar ticket criado:', createdError)
        } else {
          console.log('✅ Ticket encontrado no banco!')
          console.log(`🎫 Ticket Number: #${createdTicket.ticket_number}`)
          console.log(`🎫 Status: ${createdTicket.status}`)
          console.log(`🎫 Context: ${createdTicket.context_id}`)
        }
        
      } else {
        const errorData = await response.json()
        console.error('❌ Erro ao criar ticket:', errorData)
      }
    } else {
      console.log('❌ Não foi possível testar - usuários ou categorias não encontrados')
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testTicketCreation()