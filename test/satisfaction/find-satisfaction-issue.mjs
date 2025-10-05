#!/usr/bin/env node
/**
 * DIAGNÓSTICO ESPECÍFICO: Por que avaliação não aparece
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

console.log('╔════════════════════════════════════════════════════════════════╗')
console.log('║     DIAGNÓSTICO: Por que avaliação não aparece?               ║')
console.log('╚════════════════════════════════════════════════════════════════╝\n')

async function diagnose() {
  // 1. Verificar statuses disponíveis no banco
  console.log('1️⃣ Verificando statuses customizados no banco...\n')
  
  const { data: statuses } = await supabase
    .from('ticket_statuses')
    .select('*')
    .order('order_index')
  
  if (statuses && statuses.length > 0) {
    console.log('✅ Statuses customizados encontrados:\n')
    statuses.forEach((s, i) => {
      console.log(`${i + 1}. ${s.label} (slug: "${s.slug}")`)
      console.log(`   is_final: ${s.is_final}`)
      console.log(`   is_resolution: ${s.is_resolution || false}`)
      console.log('')
    })
    
    // Verificar se tem status "resolved"
    const hasResolved = statuses.some(s => s.slug === 'resolved')
    if (hasResolved) {
      console.log('✅ Status "resolved" EXISTE nos statuses customizados')
    } else {
      console.log('❌ Status "resolved" NÃO EXISTE nos statuses customizados!')
      console.log('⚠️  PROBLEMA: Código usa "resolved" mas banco não tem!\n')
      
      const finalStatuses = statuses.filter(s => s.is_final)
      if (finalStatuses.length > 0) {
        console.log('ℹ️  Statuses finais encontrados:')
        finalStatuses.forEach(s => {
          console.log(`   - ${s.label} (slug: "${s.slug}")`)
        })
      }
    }
  } else {
    console.log('⚠️  Nenhum status customizado encontrado. Sistema usa statuses padrão:\n')
    console.log('   - open')
    console.log('   - in_progress')
    console.log('   - resolved  ← Este é usado para mostrar avaliação')
    console.log('   - closed')
    console.log('   - cancelled')
  }
  
  // 2. Verificar tickets com status resolved
  console.log('\n2️⃣ Verificando tickets com status "resolved"...\n')
  
  const { data: resolvedTickets, count } = await supabase
    .from('tickets')
    .select('id, ticket_number, title, status', { count: 'exact' })
    .eq('status', 'resolved')
    .limit(5)
  
  console.log(`Total de tickets "resolved": ${count || 0}`)
  
  if (resolvedTickets && resolvedTickets.length > 0) {
    console.log('\nExemplos:')
    resolvedTickets.forEach(t => {
      console.log(`   #${t.ticket_number} - ${t.title} (status: "${t.status}")`)
    })
  }
  
  // 3. Verificar tickets finalizados (outros status)
  console.log('\n3️⃣ Verificando tickets finalizados (qualquer status final)...\n')
  
  const finalStatuses = ['resolved', 'closed', 'finalizado', 'concluído', 'resolvido']
  
  for (const status of finalStatuses) {
    const { count } = await supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('status', status)
    
    if (count && count > 0) {
      console.log(`   ${status}: ${count} tickets`)
    }
  }
  
  // 4. Verificar condição exata do código
  console.log('\n4️⃣ Verificando condição no código...\n')
  console.log('📝 Código atual (linha 1121):')
  console.log(`   {ticket.status === 'resolved' && ticket.created_by_user?.id === session?.user?.id && (`)
  console.log('')
  console.log('⚠️  CONDIÇÕES para mostrar avaliação:')
  console.log('   1. ticket.status === "resolved"  ← Deve ser EXATAMENTE "resolved"')
  console.log('   2. ticket.created_by_user?.id === session?.user?.id  ← Apenas criador')
  console.log('')
  
  // 5. Verificar se modal é mostrado ao fechar
  console.log('5️⃣ Verificando modal de avaliação ao fechar...\n')
  console.log('📝 Código (linha 330-334):')
  console.log(`   if (newStatus === 'resolved' && ticket?.created_by_user?.id === session?.user?.id) {`)
  console.log(`     setTimeout(() => { setShowRatingModal(true) }, 1000)`)
  console.log(`   }`)
  console.log('')
  console.log('✅ Modal DEVE aparecer 1 segundo após mudar status para "resolved"')
  
  console.log('\n\n' + '='.repeat(70))
  console.log('📋 CONCLUSÃO:')
  console.log('='.repeat(70) + '\n')
  
  console.log('Possíveis causas da avaliação não aparecer:\n')
  console.log('1. ❓ Status do ticket NÃO é "resolved" (é outro slug customizado)')
  console.log('2. ❓ Usuário logado NÃO é o criador do ticket')
  console.log('3. ❓ Modal abre mas está invisível (z-index, CSS)')
  console.log('4. ❓ Componente TicketRating tem algum erro ao renderizar')
  console.log('')
  console.log('🔍 PRÓXIMOS PASSOS:')
  console.log('1. Verificar qual status EXATO é usado ao fechar ticket')
  console.log('2. Confirmar se usuário logado é o criador do ticket')
  console.log('3. Abrir console do navegador e procurar erros')
  console.log('4. Verificar se modal está renderizado mas oculto')
  console.log('')
}

diagnose()

