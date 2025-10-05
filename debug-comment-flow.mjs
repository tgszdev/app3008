import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 DEBUG COMPLETO: Fluxo de Comentários\n')

// 1. Último comentário criado
console.log('1️⃣ Último comentário criado:')
const { data: lastComment } = await supabase
  .from('ticket_comments')
  .select('*, ticket:tickets(id, ticket_number, title, created_by, assigned_to)')
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

if (lastComment) {
  console.log(`   ID: ${lastComment.id}`)
  console.log(`   Ticket: #${lastComment.ticket.ticket_number}`)
  console.log(`   Criado por: ${lastComment.user_id}`)
  console.log(`   Ticket criado por: ${lastComment.ticket.created_by}`)
  console.log(`   Ticket atribuído a: ${lastComment.ticket.assigned_to || 'Ninguém'}`)
  console.log(`   Timestamp: ${lastComment.created_at}`)
  console.log(`   Interno: ${lastComment.is_internal}`)
  
  // 2. Verificar se notificação foi criada APÓS esse comentário
  console.log('\n2️⃣ Notificações criadas APÓS esse comentário:')
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('type', 'new_comment')
    .gte('created_at', lastComment.created_at)
  
  console.log(`   Total: ${notifications?.length || 0}`)
  if (notifications && notifications.length > 0) {
    notifications.forEach(n => {
      console.log(`   ✅ Para: ${n.user_id} | ${n.title}`)
    })
  } else {
    console.log('   ❌ NENHUMA notificação criada!')
  }
  
  // 3. Verificar preferências do criador do ticket
  if (lastComment.ticket.created_by !== lastComment.user_id) {
    console.log('\n3️⃣ Preferências do CRIADOR do ticket:')
    const { data: prefs } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', lastComment.ticket.created_by)
      .single()
    
    if (prefs) {
      console.log(`   Email habilitado: ${prefs.email_enabled}`)
      console.log(`   Comment_added email: ${prefs.comment_added?.email || false}`)
      console.log(`   Horário silencioso: ${prefs.quiet_hours_enabled}`)
    } else {
      console.log('   ❌ SEM PREFERÊNCIAS CONFIGURADAS!')
    }
  } else {
    console.log('\n3️⃣ Criador do ticket = Quem comentou (não deve notificar)')
  }
  
  // 4. Verificar preferências do responsável
  if (lastComment.ticket.assigned_to && lastComment.ticket.assigned_to !== lastComment.user_id) {
    console.log('\n4️⃣ Preferências do RESPONSÁVEL:')
    const { data: prefs } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', lastComment.ticket.assigned_to)
      .single()
    
    if (prefs) {
      console.log(`   Email habilitado: ${prefs.email_enabled}`)
      console.log(`   Comment_added email: ${prefs.comment_added?.email || false}`)
    } else {
      console.log('   ❌ SEM PREFERÊNCIAS!')
    }
  }
}

console.log('\n✅ Debug completo!')
