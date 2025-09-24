/**
 * =====================================================
 * CORREÇÃO: RELATÓRIOS SQL
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

async function corrigirSqlReports() {
  console.log('🔧 CORREÇÃO: RELATÓRIOS SQL');
  console.log('='.repeat(50));
  
  try {
    // 1. Testar relatório de tickets por status (usando JavaScript)
    console.log('\n1. Testando relatório de tickets por status...');
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('status, priority');
    
    if (ticketsError) {
      console.log(`❌ Erro ao buscar tickets: ${ticketsError.message}`);
    } else {
      // Agrupar por status usando JavaScript
      const statusGroups = tickets.reduce((acc, ticket) => {
        const status = ticket.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('✅ Relatório de tickets por status:');
      Object.entries(statusGroups).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count} tickets`);
      });
    }
    
    // 2. Testar relatório de tickets por prioridade (usando JavaScript)
    console.log('\n2. Testando relatório de tickets por prioridade...');
    if (tickets && !ticketsError) {
      // Agrupar por prioridade usando JavaScript
      const priorityGroups = tickets.reduce((acc, ticket) => {
        const priority = ticket.priority;
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {});
      
      console.log('✅ Relatório de tickets por prioridade:');
      Object.entries(priorityGroups).forEach(([priority, count]) => {
        console.log(`  - ${priority}: ${count} tickets`);
      });
    }
    
    // 3. Testar relatório de tickets por mês (usando JavaScript)
    console.log('\n3. Testando relatório de tickets por mês...');
    const { data: ticketsWithDate, error: ticketsWithDateError } = await supabase
      .from('tickets')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (ticketsWithDateError) {
      console.log(`❌ Erro ao buscar tickets com data: ${ticketsWithDateError.message}`);
    } else {
      // Agrupar por mês usando JavaScript
      const monthGroups = ticketsWithDate.reduce((acc, ticket) => {
        const date = new Date(ticket.created_at);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});
      
      console.log('✅ Relatório de tickets por mês:');
      Object.entries(monthGroups).forEach(([month, count]) => {
        console.log(`  - ${month}: ${count} tickets`);
      });
    }
    
    // 4. Testar relatório de usuários mais ativos
    console.log('\n4. Testando relatório de usuários mais ativos...');
    const { data: ticketsByUser, error: ticketsByUserError } = await supabase
      .from('tickets')
      .select('created_by')
      .limit(50);
    
    if (ticketsByUserError) {
      console.log(`❌ Erro ao buscar tickets por usuário: ${ticketsByUserError.message}`);
    } else {
      // Agrupar por usuário usando JavaScript
      const userGroups = ticketsByUser.reduce((acc, ticket) => {
        const userId = ticket.created_by;
        acc[userId] = (acc[userId] || 0) + 1;
        return acc;
      }, {});
      
      console.log('✅ Relatório de usuários mais ativos:');
      Object.entries(userGroups)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([userId, count]) => {
          console.log(`  - ${userId}: ${count} tickets`);
        });
    }
    
    // 5. Testar relatório de performance (tempo médio de resolução)
    console.log('\n5. Testando relatório de performance...');
    const { data: resolvedTickets, error: resolvedTicketsError } = await supabase
      .from('tickets')
      .select('created_at, updated_at, status')
      .eq('status', 'closed')
      .limit(20);
    
    if (resolvedTicketsError) {
      console.log(`❌ Erro ao buscar tickets resolvidos: ${resolvedTicketsError.message}`);
    } else {
      // Calcular tempo médio de resolução
      const resolutionTimes = resolvedTickets.map(ticket => {
        const created = new Date(ticket.created_at);
        const updated = new Date(ticket.updated_at);
        return updated.getTime() - created.getTime();
      });
      
      const avgResolutionTime = resolutionTimes.reduce((acc, time) => acc + time, 0) / resolutionTimes.length;
      const avgHours = avgResolutionTime / (1000 * 60 * 60);
      
      console.log('✅ Relatório de performance:');
      console.log(`  - Tickets resolvidos: ${resolvedTickets.length}`);
      console.log(`  - Tempo médio de resolução: ${avgHours.toFixed(2)} horas`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ CORREÇÃO CONCLUÍDA');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Erro durante correção:', error);
  }
}

// Executar correção
corrigirSqlReports();
