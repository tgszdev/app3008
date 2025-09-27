import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

async function verificarRemoverTrigger() {
  console.log('🔍 VERIFICANDO E REMOVENDO TRIGGER CONFLITANTE...')
  console.log('=' * 60)
  
  try {
    // 1. Verificar triggers existentes
    console.log('1️⃣ VERIFICANDO TRIGGERS EXISTENTES...')
    
    const { data: triggers, error: triggersError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT trigger_name, event_manipulation, action_statement
          FROM information_schema.triggers 
          WHERE event_object_table = 'tickets'
          ORDER BY trigger_name
        `
      })
    
    if (triggersError) {
      console.error('❌ Erro ao verificar triggers:', triggersError)
      return
    }
    
    console.log('📋 TRIGGERS ENCONTRADOS:')
    for (const trigger of triggers) {
      console.log(`  ${trigger.trigger_name} (${trigger.event_manipulation})`)
      console.log(`    Ação: ${trigger.action_statement}`)
    }
    
    // 2. Verificar se o trigger conflitante ainda existe
    const conflictingTrigger = triggers.find(t => 
      t.trigger_name.includes('contextual') || 
      t.trigger_name.includes('generate_contextual')
    )
    
    if (conflictingTrigger) {
      console.log('\n❌ TRIGGER CONFLITANTE ENCONTRADO:')
      console.log(`  Nome: ${conflictingTrigger.trigger_name}`)
      console.log(`  Evento: ${conflictingTrigger.event_manipulation}`)
      console.log(`  Ação: ${conflictingTrigger.action_statement}`)
      
      // 3. Remover o trigger conflitante
      console.log('\n2️⃣ REMOVENDO TRIGGER CONFLITANTE...')
      
      const { data: dropTrigger, error: dropError } = await supabaseAdmin
        .rpc('exec_sql', {
          sql: `DROP TRIGGER IF EXISTS ${conflictingTrigger.trigger_name} ON tickets;`
        })
      
      if (dropError) {
        console.error('❌ Erro ao remover trigger:', dropError)
        return
      }
      
      console.log('✅ Trigger removido com sucesso!')
      
      // 4. Verificar se a função ainda existe
      console.log('\n3️⃣ VERIFICANDO FUNÇÃO...')
      
      const { data: functions, error: functionsError } = await supabaseAdmin
        .rpc('exec_sql', {
          sql: `
            SELECT routine_name, routine_type
            FROM information_schema.routines 
            WHERE routine_name LIKE '%contextual%' 
            OR routine_name LIKE '%generate_contextual%'
          `
        })
      
      if (functionsError) {
        console.error('❌ Erro ao verificar funções:', functionsError)
        return
      }
      
      if (functions && functions.length > 0) {
        console.log('📋 FUNÇÕES ENCONTRADAS:')
        for (const func of functions) {
          console.log(`  ${func.routine_name} (${func.routine_type})`)
        }
        
        // Remover as funções também
        console.log('\n4️⃣ REMOVENDO FUNÇÕES CONFLITANTES...')
        for (const func of functions) {
          const { data: dropFunction, error: dropFuncError } = await supabaseAdmin
            .rpc('exec_sql', {
              sql: `DROP FUNCTION IF EXISTS ${func.routine_name}();`
            })
          
          if (dropFuncError) {
            console.error(`❌ Erro ao remover função ${func.routine_name}:`, dropFuncError)
          } else {
            console.log(`✅ Função ${func.routine_name} removida!`)
          }
        }
      } else {
        console.log('✅ Nenhuma função conflitante encontrada')
      }
      
    } else {
      console.log('\n✅ NENHUM TRIGGER CONFLITANTE ENCONTRADO')
    }
    
    // 5. Verificar triggers após remoção
    console.log('\n5️⃣ VERIFICANDO TRIGGERS APÓS REMOÇÃO...')
    
    const { data: finalTriggers, error: finalTriggersError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT trigger_name, event_manipulation, action_statement
          FROM information_schema.triggers 
          WHERE event_object_table = 'tickets'
          ORDER BY trigger_name
        `
      })
    
    if (finalTriggersError) {
      console.error('❌ Erro ao verificar triggers finais:', finalTriggersError)
      return
    }
    
    console.log('📋 TRIGGERS FINAIS:')
    for (const trigger of finalTriggers) {
      console.log(`  ${trigger.trigger_name} (${trigger.event_manipulation})`)
    }
    
    // 6. Testar criação de ticket após correção
    console.log('\n6️⃣ TESTANDO CRIAÇÃO DE TICKET APÓS CORREÇÃO...')
    
    const { data: ticketNumber, error: sequenceError } = await supabaseAdmin
      .rpc('get_next_ticket_number')
    
    if (sequenceError) {
      console.error('❌ Erro na sequence:', sequenceError)
      return
    }
    
    console.log(`✅ Sequence funcionando: ${ticketNumber}`)
    
    // Criar ticket de teste
    const testTicketData = {
      title: 'Teste Pós Correção Trigger',
      description: 'Teste após remover trigger conflitante',
      status: 'open',
      priority: 'medium',
      category: 'general',
      created_by: '3b855060-50d4-4eef-abf5-4eec96934159', // agro@agro.com.br
      context_id: '6486088e-72ae-461b-8b03-32ca84918882', // Luft Agro
      ticket_number: ticketNumber,
      is_internal: false
    }
    
    const { data: testTicket, error: testError } = await supabaseAdmin
      .from('tickets')
      .insert(testTicketData)
      .select(`
        *,
        created_by_user:users!tickets_created_by_fkey(id, name, email, context_id),
        context_info:contexts!tickets_context_id_fkey(id, name)
      `)
      .single()
    
    if (testError) {
      console.error('❌ Erro ao criar ticket de teste:', testError)
      return
    }
    
    console.log('✅ Ticket de teste criado:')
    console.log(`  ID: ${testTicket.id}`)
    console.log(`  Ticket Number: ${testTicket.ticket_number}`)
    console.log(`  Título: ${testTicket.title}`)
    console.log(`  Context ID: ${testTicket.context_id}`)
    console.log(`  Context Name: ${testTicket.context_info?.name}`)
    console.log(`  Criador: ${testTicket.created_by_user?.name}`)
    console.log(`  Criador Context: ${testTicket.created_by_user?.context_id}`)
    
    // Verificar se o contexto está correto
    if (testTicket.context_id === testTicket.created_by_user?.context_id) {
      console.log('🎉 SUCESSO: Contexto do ticket = Contexto do criador!')
    } else {
      console.log('❌ PROBLEMA: Contexto do ticket ≠ Contexto do criador')
      console.log(`  Ticket Context: ${testTicket.context_id}`)
      console.log(`  Criador Context: ${testTicket.created_by_user?.context_id}`)
    }
    
    // 7. Resumo final
    console.log('\n7️⃣ RESUMO FINAL:')
    console.log('=' * 60)
    
    if (conflictingTrigger) {
      console.log('✅ Trigger conflitante removido com sucesso!')
    } else {
      console.log('✅ Nenhum trigger conflitante encontrado')
    }
    
    console.log(`✅ Sequence funcionando: ${ticketNumber}`)
    console.log(`✅ Ticket de teste criado: #${testTicket.ticket_number}`)
    
    if (testTicket.context_id === testTicket.created_by_user?.context_id) {
      console.log('🎉 PROBLEMA RESOLVIDO: Tickets agora são criados com contexto correto!')
    } else {
      console.log('❌ PROBLEMA PERSISTE: Ainda há interferência no contexto')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

verificarRemoverTrigger()
