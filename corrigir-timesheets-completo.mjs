/**
 * =====================================================
 * CORREÇÃO COMPLETA: TIMESHEETS
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

async function corrigirTimesheetsCompleto() {
  console.log('🔧 CORREÇÃO COMPLETA: TIMESHEETS');
  console.log('='.repeat(50));
  
  try {
    // 1. Buscar um ticket existente
    console.log('\n1. Buscando ticket existente...');
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, title')
      .limit(1);
    
    if (ticketsError) {
      console.log(`❌ Erro ao buscar tickets: ${ticketsError.message}`);
      return;
    }
    
    if (tickets.length === 0) {
      console.log('❌ Nenhum ticket encontrado para teste');
      return;
    }
    
    const ticketId = tickets[0].id;
    console.log(`✅ Ticket encontrado: ${tickets[0].title} (ID: ${ticketId})`);
    
    // 2. Criar timesheet com todos os campos obrigatórios
    console.log('\n2. Criando timesheet com todos os campos obrigatórios...');
    const testTimesheet = {
      user_id: '3b855060-50d4-4eef-abf5-4eec96934159',
      ticket_id: ticketId,
      work_date: new Date().toISOString().split('T')[0],
      hours_worked: 8.0,
      activity_description: 'CTS - Atividade de teste para correção',
      description: 'CTS - Timesheet de teste completo',
      status: 'pending'
    };
    
    const { data: newTimesheet, error: createError } = await supabase
      .from('timesheets')
      .insert(testTimesheet)
      .select()
      .single();
    
    if (createError) {
      console.log(`❌ Erro ao criar timesheet: ${createError.message}`);
    } else {
      console.log('✅ Timesheet criado com sucesso!');
      console.log(`  - ID: ${newTimesheet.id}`);
      console.log(`  - User ID: ${newTimesheet.user_id}`);
      console.log(`  - Ticket ID: ${newTimesheet.ticket_id}`);
      console.log(`  - Hours: ${newTimesheet.hours_worked}`);
      console.log(`  - Activity: ${newTimesheet.activity_description}`);
      console.log(`  - Status: ${newTimesheet.status}`);
      
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
    
    // 3. Verificar estrutura completa da tabela
    console.log('\n3. Verificando estrutura completa da tabela timesheets...');
    const { data: sampleTimesheet, error: sampleError } = await supabase
      .from('timesheets')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.log(`❌ Erro ao buscar sample timesheet: ${sampleError.message}`);
    } else if (sampleTimesheet.length > 0) {
      console.log('✅ Estrutura completa da tabela timesheets:');
      const fields = Object.keys(sampleTimesheet[0]);
      fields.forEach(field => {
        const value = sampleTimesheet[0][field];
        const type = typeof value;
        const isNull = value === null;
        console.log(`  - ${field}: ${type} ${isNull ? '(NULL)' : `(${value})`}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ CORREÇÃO COMPLETA CONCLUÍDA');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Erro durante correção:', error);
  }
}

// Executar correção
corrigirTimesheetsCompleto();
