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

async function fixTicketWithoutContext() {
  console.log('🔧 CORRIGINDO TICKET SEM CONTEXTO')
  console.log('=' .repeat(60))

  try {
    // 1. Encontrar ticket sem contexto
    console.log('\n1️⃣ ENCONTRANDO TICKET SEM CONTEXTO...')
    
    const { data: noContextTickets, error: noContextError } = await supabase
      .from('tickets')
      .select('*')
      .is('context_id', null)

    if (noContextError) {
      console.log('❌ Erro ao buscar tickets sem contexto:', noContextError.message)
      return
    }

    if (noContextTickets.length === 0) {
      console.log('✅ Nenhum ticket sem contexto encontrado')
      return
    }

    console.log('📊 Tickets sem contexto encontrados:', noContextTickets.length)
    
    noContextTickets.forEach(ticket => {
      console.log(`  - ${ticket.title}: ${ticket.status} (ID: ${ticket.id})`)
    })

    // 2. Associar ticket sem contexto ao Sistema Atual
    console.log('\n2️⃣ ASSOCIANDO TICKET AO SISTEMA ATUAL...')
    
    const sistemaAtualId = 'fa4a4a34-f662-4da1-94d8-b77b5c578d6b'
    
    for (const ticket of noContextTickets) {
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ context_id: sistemaAtualId })
        .eq('id', ticket.id)

      if (updateError) {
        console.log(`❌ Erro ao atualizar ticket ${ticket.id}:`, updateError.message)
      } else {
        console.log(`✅ Ticket ${ticket.id} associado ao Sistema Atual`)
      }
    }

    // 3. Verificar se a correção funcionou
    console.log('\n3️⃣ VERIFICANDO CORREÇÃO...')
    
    const { data: remainingNoContext, error: remainingError } = await supabase
      .from('tickets')
      .select('id, title, context_id')
      .is('context_id', null)

    if (remainingError) {
      console.log('❌ Erro ao verificar tickets restantes:', remainingError.message)
    } else {
      console.log('✅ Tickets sem contexto restantes:', remainingNoContext.length)
      
      if (remainingNoContext.length === 0) {
        console.log('🎉 Todos os tickets agora têm contexto!')
      } else {
        console.log('⚠️ Ainda há tickets sem contexto:')
        remainingNoContext.forEach(ticket => {
          console.log(`  - ${ticket.title} (ID: ${ticket.id})`)
        })
      }
    }

    // 4. Verificar distribuição atualizada
    console.log('\n4️⃣ VERIFICANDO DISTRIBUIÇÃO ATUALIZADA...')
    
    const { data: sistemaAtualTickets, error: sistemaError } = await supabase
      .from('tickets')
      .select('id, title, status')
      .eq('context_id', sistemaAtualId)
      .order('created_at', { ascending: false })

    if (sistemaError) {
      console.log('❌ Erro ao buscar tickets do Sistema Atual:', sistemaError.message)
    } else {
      console.log('✅ Tickets do Sistema Atual:', sistemaAtualTickets.length)
    }

    // 5. Verificar tickets do Luft Agro
    console.log('\n5️⃣ VERIFICANDO TICKETS DO LUFT AGRO...')
    
    const luftAgroId = '6486088e-72ae-461b-8b03-32ca84918882'
    const { data: luftTickets, error: luftError } = await supabase
      .from('tickets')
      .select('id, title, status')
      .eq('context_id', luftAgroId)
      .order('created_at', { ascending: false })

    if (luftError) {
      console.log('❌ Erro ao buscar tickets do Luft Agro:', luftError.message)
    } else {
      console.log('✅ Tickets do Luft Agro:', luftTickets.length)
      
      if (luftTickets.length > 0) {
        luftTickets.forEach(ticket => {
          console.log(`  - ${ticket.title}: ${ticket.status}`)
        })
      }
    }

    console.log('\n🎉 CORREÇÃO CONCLUÍDA!')
    console.log('📊 Agora todos os tickets têm context_id válido')
    console.log('🔧 O filtro deve funcionar corretamente')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

fixTicketWithoutContext()
