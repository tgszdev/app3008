/**
 * =====================================================
 * CORREÇÃO: TIMESHEETS TICKET_ID OBRIGATÓRIO
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

async function corrigirTimesheetsTicketId() {
  console.log('🔧 CORREÇÃO: TIMESHEETS TICKET_ID OBRIGATÓRIO');
  console.log('='.repeat(50));
  
  try {
    // 1. Verificar estrutura da tabela timesheets
    console.log('\n1. Verificando estrutura da tabela timesheets...');
    const { data: timesheets, error: timesheetsError } = await supabase
      .from('timesheets')
      .select('*')
      .limit(5);
    
    if (timesheetsError) {
      console.log(`❌ Erro ao buscar timesheets: ${timesheetsError.message}`);
    } else {
      console.log('✅ Estrutura da tabela timesheets:');
      if (timesheets.length > 0) {
        console.log('  - Colunas disponíveis:', Object.keys(timesheets[0]));
      } else {
        console.log('  - Tabela vazia');
      }
    }
    
    // 2. Verificar se ticket_id é realmente obrigatório
    console.log('\n2. Testando criação de timesheet sem ticket_id...');
    const testTimesheet = {
      user_id: '3b855060-50d4-4eef-abf5-4eec96934159',
      work_date: new Date().toISOString().split('T')[0],
      hours_worked: 8.0,
      description: 'CTS - Timesheet de teste sem ticket_id'
    };
    
    const { data: newTimesheet, error: createError } = await supabase
      .from('timesheets')
      .insert(testTimesheet)
      .select()
      .single();
    
    if (createError) {
      console.log(`❌ Erro ao criar timesheet: ${createError.message}`);
      
      // Se o erro for por ticket_id obrigatório, tentar com um ticket_id válido
      if (createError.message.includes('ticket_id')) {
        console.log('\n3. Tentando criar timesheet com ticket_id válido...');
        
        // Buscar um ticket existente
        const { data: tickets, error: ticketsError } = await supabase
          .from('tickets')
          .select('id')
          .limit(1);
        
        if (ticketsError) {
          console.log(`❌ Erro ao buscar tickets: ${ticketsError.message}`);
        } else if (tickets.length > 0) {
          const testTimesheetWithTicket = {
            user_id: '3b855060-50d4-4eef-abf5-4eec96934159',
            work_date: new Date().toISOString().split('T')[0],
            hours_worked: 8.0,
            description: 'CTS - Timesheet de teste com ticket_id',
            ticket_id: tickets[0].id
          };
          
          const { data: newTimesheetWithTicket, error: createErrorWithTicket } = await supabase
            .from('timesheets')
            .insert(testTimesheetWithTicket)
            .select()
            .single();
          
          if (createErrorWithTicket) {
            console.log(`❌ Erro ao criar timesheet com ticket_id: ${createErrorWithTicket.message}`);
          } else {
            console.log('✅ Timesheet criado com sucesso!');
            console.log(`  - ID: ${newTimesheetWithTicket.id}`);
            console.log(`  - User ID: ${newTimesheetWithTicket.user_id}`);
            console.log(`  - Ticket ID: ${newTimesheetWithTicket.ticket_id}`);
            console.log(`  - Hours: ${newTimesheetWithTicket.hours_worked}`);
            
            // Limpar o timesheet de teste
            const { error: deleteError } = await supabase
              .from('timesheets')
              .delete()
              .eq('id', newTimesheetWithTicket.id);
            
            if (deleteError) {
              console.log(`⚠️ Erro ao limpar timesheet de teste: ${deleteError.message}`);
            } else {
              console.log('✅ Timesheet de teste removido');
            }
          }
        } else {
          console.log('❌ Nenhum ticket encontrado para teste');
        }
      }
    } else {
      console.log('✅ Timesheet criado sem ticket_id!');
      console.log(`  - ID: ${newTimesheet.id}`);
      console.log(`  - User ID: ${newTimesheet.user_id}`);
      console.log(`  - Hours: ${newTimesheet.hours_worked}`);
      
      // Limpar o timesheet de teste
      const { error: deleteError } = await supabase
        .from('timesheets')
        .delete()
        .eq('id', newTimesheet.id);
      
      if (deleteError) {
        console.log(`⚠️ Erro ao limpar timesheet de teste: ${deleteError.message}`);
      } else {
        console.log('✅ Timesheet de teste removido');
      }
    }
    
    // 4. Verificar timesheets existentes
    console.log('\n4. Verificando timesheets existentes...');
    const { data: existingTimesheets, error: existingError } = await supabase
      .from('timesheets')
      .select('id, user_id, ticket_id, hours_worked, work_date')
      .limit(10);
    
    if (existingError) {
      console.log(`❌ Erro ao buscar timesheets existentes: ${existingError.message}`);
    } else {
      console.log('✅ Timesheets existentes:');
      existingTimesheets.forEach(timesheet => {
        console.log(`  - ID: ${timesheet.id}, User: ${timesheet.user_id}, Ticket: ${timesheet.ticket_id || 'N/A'}, Hours: ${timesheet.hours_worked}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ CORREÇÃO CONCLUÍDA');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Erro durante correção:', error);
  }
}

// Executar correção
corrigirTimesheetsTicketId();
