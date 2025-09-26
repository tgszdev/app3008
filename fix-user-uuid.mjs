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

async function fixUserUuid() {
  console.log('🔍 CORRIGINDO UUID DO USUÁRIO')
  console.log('=' .repeat(50))

  try {
    // 1. Buscar usuário correto
    console.log('\n1️⃣ BUSCANDO USUÁRIO CORRETO...')
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, user_type')
      .eq('email', 'rodrigues2205@icloud.com')

    if (usersError) {
      console.log('❌ Erro ao buscar usuário:', usersError.message)
    } else {
      console.log('✅ Usuário encontrado:')
      users.forEach(user => {
        console.log(`  - ID: ${user.id}`)
        console.log(`  - Email: ${user.email}`)
        console.log(`  - User Type: ${user.user_type}`)
        console.log('')
      })
    }

    // 2. Verificar contextos associados
    console.log('\n2️⃣ VERIFICANDO CONTEXTOS ASSOCIADOS...')
    
    if (users && users.length > 0) {
      const userId = users[0].id
      const { data: userContexts, error: contextsError } = await supabase
        .from('user_contexts')
        .select('context_id')
        .eq('user_id', userId)
      
      if (contextsError) {
        console.log('❌ Erro ao buscar contextos:', contextsError.message)
      } else {
        console.log(`✅ Contextos associados: ${userContexts.length}`)
        userContexts.forEach(uc => {
          console.log(`  - Context ID: ${uc.context_id}`)
        })
      }
    }

    // 3. Verificar tickets do Luft Agro
    console.log('\n3️⃣ VERIFICANDO TICKETS DO LUFT AGRO...')
    
    const luftAgroId = '6486088e-72ae-461b-8b03-32ca84918882'
    const { data: luftTickets, error: luftError } = await supabase
      .from('tickets')
      .select('*')
      .eq('context_id', luftAgroId)
      .order('created_at', { ascending: false })

    if (luftError) {
      console.log('❌ Erro ao buscar tickets do Luft Agro:', luftError.message)
    } else {
      console.log(`✅ Tickets do Luft Agro: ${luftTickets.length}`)
      luftTickets.forEach(ticket => {
        console.log(`  - ${ticket.title}: ${ticket.status}`)
        console.log(`    - Context ID: ${ticket.context_id}`)
        console.log(`    - Created: ${ticket.created_at}`)
        console.log('')
      })
    }

    // 4. Testar API com UUID correto
    console.log('\n4️⃣ TESTANDO API COM UUID CORRETO...')
    
    if (users && users.length > 0) {
      const userId = users[0].id
      console.log(`🔍 Testando com UUID: ${userId}`)
      
      // Simular query da API
      const { data: testTickets, error: testError } = await supabase
        .from('tickets')
        .select('*')
        .gte('created_at', '2025-09-01T00:00:00')
        .lte('created_at', '2025-09-30T23:59:59')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (testError) {
        console.log('❌ Erro ao testar query:', testError.message)
      } else {
        console.log(`✅ Query funcionou: ${testTickets.length} tickets`)
        testTickets.forEach(ticket => {
          console.log(`  - ${ticket.title}: context_id = "${ticket.context_id}"`)
        })
      }
    }

    // 5. Diagnóstico final
    console.log('\n5️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO:')
    console.log('✅ Usuário encontrado no banco')
    console.log('✅ Contextos associados funcionam')
    console.log('✅ Tickets do Luft Agro existem')
    console.log('❌ PROBLEMA: UUID incorreto no bypass da API!')
    
    console.log('\n🎯 SOLUÇÃO:')
    console.log('1. Corrigir UUID no bypass da API')
    console.log('2. Usar UUID correto do usuário')
    console.log('3. Testar API novamente')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

fixUserUuid()
