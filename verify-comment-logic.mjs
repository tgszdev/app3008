import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🧪 TESTE: Lógica de Notificação de Comentários\n')

// Buscar um ticket que tenha CRIADOR diferente
const { data: tickets } = await supabase
  .from('tickets')
  .select('id, ticket_number, created_by, assigned_to')
  .neq('created_by', 'e713d744-485f-4289-b248-ea76d9fb54d1') // Não criado por você
  .limit(5)

console.log(`✅ Tickets criados por OUTROS usuários: ${tickets?.length || 0}`)

if (tickets && tickets.length > 0) {
  const ticket = tickets[0]
  console.log(`\n📋 Ticket #${ticket.ticket_number}`)
  console.log(`   Criado por: ${ticket.created_by}`)
  console.log(`   Atribuído a: ${ticket.assigned_to || 'Ninguém'}`)
  
  // Buscar dados do criador
  const { data: creator } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', ticket.created_by)
    .single()
  
  if (creator) {
    console.log(`   Nome criador: ${creator.name} (${creator.email})`)
  }
  
  console.log('\n💡 SUGESTÃO DE TESTE:')
  console.log(`   1. Acesse: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tickets/${ticket.id}`)
  console.log(`   2. Adicione um comentário`)
  console.log(`   3. O criador (${creator?.email}) DEVE receber email`)
} else {
  console.log('\n⚠️ Todos os tickets foram criados por você!')
  console.log('   Crie um ticket com OUTRO usuário e comente nele.')
}

// Verificar se há outros usuários no sistema
console.log('\n👥 Usuários no sistema:')
const { data: users } = await supabase
  .from('users')
  .select('id, name, email, role')
  .limit(5)

users?.forEach(u => {
  const isYou = u.id === 'e713d744-485f-4289-b248-ea76d9fb54d1'
  console.log(`   ${isYou ? '👉' : '  '} ${u.name} (${u.email}) - ${u.role}`)
})

console.log('\n✅ Análise completa!')
