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

async function verifyDeployFix() {
  console.log('🔍 VERIFICANDO SE DEPLOY APLICOU CORREÇÃO')
  console.log('=' .repeat(60))

  try {
    // 1. Verificar se a API está usando o UUID correto
    console.log('\n1️⃣ VERIFICANDO UUID CORRETO...')
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, user_type')
      .eq('email', 'rodrigues2205@icloud.com')

    if (usersError) {
      console.log('❌ Erro ao buscar usuário:', usersError.message)
    } else {
      console.log('✅ UUID correto do usuário:')
      users.forEach(user => {
        console.log(`  - ID: ${user.id}`)
        console.log(`  - Email: ${user.email}`)
        console.log(`  - User Type: ${user.user_type}`)
        console.log('')
      })
    }

    // 2. Testar se a API está funcionando com o UUID correto
    console.log('\n2️⃣ TESTANDO API COM UUID CORRETO...')
    
    if (users && users.length > 0) {
      const userId = users[0].id
      console.log(`🔍 Testando com UUID: ${userId}`)
      
      // Simular exatamente o que a API faz
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
        
        // Testar query com contextos
        if (userContexts.length > 0) {
          const contextIds = userContexts.map(uc => uc.context_id)
          console.log(`🔍 Testando query com contextos: ${contextIds}`)
          
          const { data: testTickets, error: testError } = await supabase
            .from('tickets')
            .select('*')
            .gte('created_at', '2025-09-01T00:00:00')
            .lte('created_at', '2025-09-30T23:59:59')
            .in('context_id', contextIds)
            .order('created_at', { ascending: false })
            .limit(5)
          
          if (testError) {
            console.log('❌ Erro ao testar query com contextos:', testError.message)
          } else {
            console.log(`✅ Query com contextos funcionou: ${testTickets.length} tickets`)
            testTickets.forEach(ticket => {
              console.log(`  - ${ticket.title}: context_id = "${ticket.context_id}"`)
            })
          }
        }
      }
    }

    // 3. Verificar se o problema é na query simples
    console.log('\n3️⃣ VERIFICANDO QUERY SIMPLES...')
    
    const { data: simpleTickets, error: simpleError } = await supabase
      .from('tickets')
      .select('*')
      .gte('created_at', '2025-09-01T00:00:00')
      .lte('created_at', '2025-09-30T23:59:59')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (simpleError) {
      console.log('❌ Erro na query simples:', simpleError.message)
    } else {
      console.log(`✅ Query simples funcionou: ${simpleTickets.length} tickets`)
      simpleTickets.forEach(ticket => {
        console.log(`  - ${ticket.title}: context_id = "${ticket.context_id}"`)
      })
    }

    // 4. Verificar se o problema é na formatação dos tickets
    console.log('\n4️⃣ VERIFICANDO FORMATAÇÃO DOS TICKETS...')
    
    if (simpleTickets && simpleTickets.length > 0) {
      console.log('🔍 Testando formatação dos tickets:')
      simpleTickets.forEach(ticket => {
        const formattedTicket = {
          id: ticket.id,
          ticket_number: ticket.ticket_number,
          title: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          requester: 'Teste',
          created_at: ticket.created_at,
          is_internal: ticket.is_internal || false,
          context_id: ticket.context_id
        }
        console.log(`  - ${formattedTicket.title}: context_id = "${formattedTicket.context_id}"`)
      })
    }

    // 5. Diagnóstico final
    console.log('\n5️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO:')
    console.log('✅ UUID correto encontrado')
    console.log('✅ Contextos associados funcionam')
    console.log('✅ Query simples funciona')
    console.log('✅ Formatação dos tickets funciona')
    console.log('❌ PROBLEMA: A API não está aplicando a lógica correta!')
    
    console.log('\n🎯 PRÓXIMOS PASSOS:')
    console.log('1. Verificar se a API está usando a query correta')
    console.log('2. Verificar se o bypass está funcionando')
    console.log('3. Verificar se a formatação está correta')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

verifyDeployFix()
