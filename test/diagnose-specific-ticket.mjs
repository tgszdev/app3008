#!/usr/bin/env node
/**
 * DIAGNÓSTICO: Ticket específico a1f75a3a-683f-4686-b36c-b537c1cf7e77
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const TICKET_ID = 'a1f75a3a-683f-4686-b36c-b537c1cf7e77'

console.log('╔════════════════════════════════════════════════════════════════╗')
console.log('║     DIAGNÓSTICO: Ticket Específico                            ║')
console.log('╚════════════════════════════════════════════════════════════════╝\n')

async function diagnose() {
  // 1. Buscar ticket
  console.log(`🔍 Buscando ticket ${TICKET_ID}...\n`)
  
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      *,
      created_by_user:created_by(id, name, email),
      assigned_to_user:assigned_to(id, name, email)
    `)
    .eq('id', TICKET_ID)
    .single()
  
  if (error || !ticket) {
    console.log('❌ Ticket não encontrado!')
    console.log('Erro:', error?.message)
    return
  }
  
  console.log('✅ TICKET ENCONTRADO:\n')
  console.log(`   ID: ${ticket.id}`)
  console.log(`   Número: #${ticket.ticket_number}`)
  console.log(`   Título: ${ticket.title}`)
  console.log(`   Status: "${ticket.status}"  ← CRUCIAL!`)
  console.log(`   Prioridade: ${ticket.priority}`)
  console.log(`   Criado por: ${ticket.created_by_user?.name} (${ticket.created_by_user?.email})`)
  console.log(`   Criado por ID: ${ticket.created_by_user?.id}`)
  console.log(`   Criado em: ${new Date(ticket.created_at).toLocaleString('pt-BR')}`)
  
  // 2. Verificar status
  console.log('\n\n2️⃣ VERIFICAÇÃO DE STATUS:\n')
  
  const statusChecks = {
    'Exatamente "resolved"': ticket.status === 'resolved',
    'Exatamente "Resolvido"': ticket.status === 'Resolvido',
    'Lowercase é "resolved"': ticket.status?.toLowerCase() === 'resolved',
    'Lowercase é "resolvido"': ticket.status?.toLowerCase() === 'resolvido',
    'Contém "resolv"': ticket.status?.toLowerCase().includes('resolv')
  }
  
  for (const [check, result] of Object.entries(statusChecks)) {
    const icon = result ? '✅' : '❌'
    console.log(`${icon} ${check}: ${result}`)
  }
  
  const isResolved = ticket.status && (
    ticket.status.toLowerCase() === 'resolved' || 
    ticket.status.toLowerCase() === 'resolvido' ||
    ticket.status === 'Resolvido'
  )
  
  console.log(`\n📊 Resultado Final: isResolved = ${isResolved}`)
  
  if (!isResolved) {
    console.log('\n🚨 PROBLEMA: Status não corresponde a "resolvido"!')
    console.log(`   Status atual: "${ticket.status}"`)
    console.log('   Para avaliação aparecer, status deve ser um de:')
    console.log('   - "resolved"')
    console.log('   - "Resolvido"')
    console.log('   - "resolvido"')
  }
  
  // 3. Verificar usuário
  console.log('\n\n3️⃣ VERIFICAÇÃO DE USUÁRIO:\n')
  
  // Simular usuário logado (você precisa estar logado com o criador)
  console.log(`   Criador do ticket: ${ticket.created_by_user?.email}`)
  console.log(`   ID do criador: ${ticket.created_by_user?.id}`)
  console.log('')
  console.log('   ⚠️  Para avaliação aparecer, você deve estar logado como:')
  console.log(`   📧 ${ticket.created_by_user?.email}`)
  
  // 4. Verificar se já tem avaliação
  console.log('\n\n4️⃣ VERIFICAÇÃO DE AVALIAÇÃO EXISTENTE:\n')
  
  const { data: rating } = await supabase
    .from('ticket_ratings')
    .select('*')
    .eq('ticket_id', TICKET_ID)
    .single()
  
  if (rating) {
    console.log('✅ Ticket JÁ TEM avaliação:')
    console.log(`   Rating: ${rating.rating}/5 estrelas`)
    console.log(`   Comentário: ${rating.comment || 'Nenhum'}`)
    console.log(`   Avaliado em: ${new Date(rating.created_at).toLocaleString('pt-BR')}`)
  } else {
    console.log('❌ Ticket ainda NÃO foi avaliado')
  }
  
  // CONCLUSÃO
  console.log('\n\n' + '='.repeat(70))
  console.log('📋 CONCLUSÃO:')
  console.log('='.repeat(70) + '\n')
  
  if (!isResolved) {
    console.log('❌ PROBLEMA ENCONTRADO: Status não é "resolvido"')
    console.log(`   Status atual: "${ticket.status}"`)
    console.log(`   Ação: Mudar status para "Resolvido" para testar`)
  } else if (rating) {
    console.log('✅ Ticket resolvido e JÁ avaliado')
    console.log('   Componente mostra avaliação existente')
  } else {
    console.log('✅ Ticket está resolvido mas ainda não foi avaliado')
    console.log('   Componente DEVE aparecer se você for o criador')
    console.log(`   Login necessário: ${ticket.created_by_user?.email}`)
  }
  
  console.log('\n📝 CHECKLIST PARA AVALIAÇÃO APARECER:\n')
  console.log(`   ${isResolved ? '✅' : '❌'} Status é "resolvido" (qualquer variação)`)
  console.log(`   ❓ Usuário logado é ${ticket.created_by_user?.email}`)
  console.log(`   ${!rating ? '✅' : '⚠️'} Ticket ${rating ? 'JÁ foi' : 'ainda não foi'} avaliado`)
  console.log('')
}

diagnose()

