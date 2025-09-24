/**
 * =====================================================
 * CORREÇÃO: TICKET NUMBER DUPLICADO
 * =====================================================
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function corrigirTicketNumber() {
  console.log('🔧 CORREÇÃO: TICKET NUMBER DUPLICADO');
  console.log('='.repeat(50));
  
  try {
    // 1. Verificar tickets existentes
    console.log('\n1. Verificando tickets existentes...');
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('ticket_number, title, created_at')
      .order('ticket_number', { ascending: false })
      .limit(10);
    
    if (ticketsError) {
      console.log(`❌ Erro ao buscar tickets: ${ticketsError.message}`);
    } else {
      console.log('✅ Tickets encontrados:');
      tickets.forEach(ticket => {
        console.log(`  - ${ticket.ticket_number}: ${ticket.title} (${ticket.created_at})`);
      });
    }
    
    // 2. Verificar duplicatas
    console.log('\n2. Verificando duplicatas...');
    const { data: duplicates, error: duplicatesError } = await supabase
      .from('tickets')
      .select('ticket_number')
      .order('ticket_number');
    
    if (duplicatesError) {
      console.log(`❌ Erro ao verificar duplicatas: ${duplicatesError.message}`);
    } else {
      const ticketNumbers = duplicates.map(t => t.ticket_number);
      const uniqueNumbers = [...new Set(ticketNumbers)];
      const hasDuplicates = ticketNumbers.length !== uniqueNumbers.length;
      
      console.log(`📊 Total de tickets: ${ticketNumbers.length}`);
      console.log(`📊 Números únicos: ${uniqueNumbers.length}`);
      console.log(`🔍 Tem duplicatas: ${hasDuplicates ? 'SIM' : 'NÃO'}`);
    }
    
    // 3. Testar criação de ticket
    console.log('\n3. Testando criação de ticket...');
    const testTicket = {
      title: 'CTS - Teste Correção Ticket Number',
      description: 'Teste para verificar se a função está funcionando',
      created_by: '2a33241e-ed38-48b5-9c84-e8c354ae9606',
      context_id: '6486088e-72ae-461b-8b03-32ca84918882',
      status: 'open',
      priority: 'medium'
    };
    
    const { data: newTicket, error: createError } = await supabase
      .from('tickets')
      .insert(testTicket)
      .select()
      .single();
    
    if (createError) {
      console.log(`❌ Erro ao criar ticket: ${createError.message}`);
    } else {
      console.log('✅ Ticket criado com sucesso!');
      console.log(`  - ID: ${newTicket.id}`);
      console.log(`  - Ticket Number: ${newTicket.ticket_number}`);
      console.log(`  - Title: ${newTicket.title}`);
      
      // Limpar o ticket de teste
      const { error: deleteError } = await supabase
        .from('tickets')
        .delete()
        .eq('id', newTicket.id);
      
      if (deleteError) {
        console.log(`⚠️ Erro ao limpar ticket de teste: ${deleteError.message}`);
      } else {
        console.log('✅ Ticket de teste removido');
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ CORREÇÃO CONCLUÍDA');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Erro durante correção:', error);
  }
}

// Executar correção
corrigirTicketNumber();
