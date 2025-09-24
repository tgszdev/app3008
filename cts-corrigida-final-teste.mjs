/**
 * =====================================================
 * CTS CORRIGIDA FINAL - TESTE DE TODAS AS CORREÇÕES
 * =====================================================
 * 
 * Correções implementadas:
 * 1. ✅ Ticket number duplicado - RESOLVIDO
 * 2. ✅ KB Articles slug obrigatório - RESOLVIDO  
 * 3. ✅ Timesheets ticket_id obrigatório - RESOLVIDO
 * 4. ✅ Relatórios SQL - RESOLVIDO
 * 
 * =====================================================
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// =====================================================
// CONFIGURAÇÕES DE TESTE CORRIGIDAS
// =====================================================

const TEST_DATA = {
  users: {
    admin: {
      id: '2a33241e-ed38-48b5-9c84-e8c354ae9606',
      email: 'rodrigues2205@icloud.com',
      name: 'Thiago Rodrigues Souza',
      role: 'admin',
      user_type: 'matrix'
    },
    context_user: {
      id: '3b855060-50d4-4eef-abf5-4eec96934159',
      email: 'agro@agro.com.br',
      name: 'agro user',
      role: 'user',
      user_type: 'context',
      context_id: '6486088e-72ae-461b-8b03-32ca84918882'
    }
  }
};

// =====================================================
// CLASSE PRINCIPAL DA CTS CORRIGIDA FINAL
// =====================================================

class CTSCorrigidaFinalTeste {
  constructor() {
    this.results = {
      total_scenarios: 0,
      total_tests: 0,
      passed_tests: 0,
      failed_tests: 0,
      skipped_tests: 0,
      total_duration: 0,
      scenarios: [],
      created_entities: {
        tickets: [],
        users: [],
        organizations: [],
        categories: [],
        articles: [],
        timesheets: []
      }
    };
    this.startTime = Date.now();
  }

  async executeTest(testName, testFunction) {
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      return {
        test_name: testName,
        status: 'PASS',
        message: 'Teste executado com sucesso',
        duration,
        details: result
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        test_name: testName,
        status: 'FAIL',
        message: `Erro: ${error instanceof Error ? error.message : String(error)}`,
        duration,
        details: error
      };
    }
  }

  async executeScenario(scenarioName, tests) {
    const startTime = Date.now();
    const testResults = [];
    
    console.log(`\n🎭 Executando cenário: ${scenarioName}`);
    console.log('='.repeat(60));
    
    for (const { name, test } of tests) {
      console.log(`⚡ Executando: ${name}`);
      const result = await this.executeTest(name, test);
      testResults.push(result);
      
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      console.log(`${statusIcon} ${name}: ${result.message} (${result.duration}ms)`);
    }
    
    const duration = Date.now() - startTime;
    const passedTests = testResults.filter(t => t.status === 'PASS').length;
    const failedTests = testResults.filter(t => t.status === 'FAIL').length;
    const skippedTests = testResults.filter(t => t.status === 'SKIP').length;
    
    const scenario = {
      scenario_name: scenarioName,
      tests: testResults,
      total_tests: testResults.length,
      passed_tests: passedTests,
      failed_tests: failedTests,
      skipped_tests: skippedTests,
      duration
    };
    
    this.results.scenarios.push(scenario);
    this.results.total_tests += testResults.length;
    this.results.passed_tests += passedTests;
    this.results.failed_tests += failedTests;
    this.results.skipped_tests += skippedTests;
    this.results.total_duration += duration;
    
    return scenario;
  }

  // =====================================================
  // CENÁRIO 1: TESTE DE TICKETS (CORREÇÃO 1)
  // =====================================================

  async cenarioTesteTickets() {
    const tests = [
      {
        name: '1.1 - Criar ticket básico (sem duplicata)',
        test: async () => {
          const ticketData = {
            title: 'CTS Corrigida - Ticket Básico',
            description: 'Ticket criado para teste CTS corrigida',
            created_by: TEST_DATA.users.context_user.id,
            context_id: TEST_DATA.users.context_user.context_id,
            status: 'open',
            priority: 'medium'
          };
          
          const { data, error } = await supabase
            .from('tickets')
            .insert(ticketData)
            .select()
            .single();
          
          if (error) throw new Error(`Erro ao criar ticket: ${error.message}`);
          
          this.results.created_entities.tickets.push(data.id);
          
          return { 
            ticket_created: true,
            ticket_id: data.id,
            ticket_number: data.ticket_number
          };
        }
      },
      {
        name: '1.2 - Criar ticket com prioridade diferente (sem duplicata)',
        test: async () => {
          const ticketData = {
            title: 'CTS Corrigida - Ticket Alta Prioridade',
            description: 'Ticket de alta prioridade para teste CTS corrigida',
            created_by: TEST_DATA.users.context_user.id,
            context_id: TEST_DATA.users.context_user.context_id,
            status: 'open',
            priority: 'high'
          };
          
          const { data, error } = await supabase
            .from('tickets')
            .insert(ticketData)
            .select()
            .single();
          
          if (error) throw new Error(`Erro ao criar ticket: ${error.message}`);
          
          this.results.created_entities.tickets.push(data.id);
          
          return { 
            high_priority_ticket_created: true,
            ticket_id: data.id,
            priority: data.priority
          };
        }
      }
    ];

    return await this.executeScenario('TESTE DE TICKETS (CORREÇÃO 1)', tests);
  }

  // =====================================================
  // CENÁRIO 2: TESTE DE KB ARTICLES (CORREÇÃO 2)
  // =====================================================

  async cenarioTesteKbArticles() {
    const tests = [
      {
        name: '2.1 - Criar categoria KB (com slug)',
        test: async () => {
          const categoryData = {
            name: 'CTS Corrigida Category',
            slug: 'cts-corrigida-category',
            description: 'Categoria criada para teste CTS corrigida',
            is_active: true
          };
          
          const { data, error } = await supabase
            .from('kb_categories')
            .insert(categoryData)
            .select()
            .single();
          
          if (error) throw new Error(`Erro ao criar categoria: ${error.message}`);
          
          this.results.created_entities.categories.push(data.id);
          
          return { 
            category_created: true,
            category_id: data.id,
            name: data.name,
            slug: data.slug
          };
        }
      },
      {
        name: '2.2 - Criar artigo KB (com slug)',
        test: async () => {
          const categoryId = this.results.created_entities.categories[0];
          
          const articleData = {
            title: 'CTS Corrigida Article',
            content: 'Conteúdo do artigo de teste CTS corrigida',
            slug: 'cts-corrigida-article',
            category_id: categoryId
          };
          
          const { data, error } = await supabase
            .from('kb_articles')
            .insert(articleData)
            .select()
            .single();
          
          if (error) throw new Error(`Erro ao criar artigo: ${error.message}`);
          
          this.results.created_entities.articles.push(data.id);
          
          return { 
            article_created: true,
            article_id: data.id,
            title: data.title,
            slug: data.slug
          };
        }
      }
    ];

    return await this.executeScenario('TESTE DE KB ARTICLES (CORREÇÃO 2)', tests);
  }

  // =====================================================
  // CENÁRIO 3: TESTE DE TIMESHEETS (CORREÇÃO 3)
  // =====================================================

  async cenarioTesteTimesheets() {
    const tests = [
      {
        name: '3.1 - Criar timesheet (com ticket_id e activity_description)',
        test: async () => {
          const ticketId = this.results.created_entities.tickets[0];
          
          const timesheetData = {
            user_id: TEST_DATA.users.context_user.id,
            ticket_id: ticketId,
            work_date: new Date().toISOString().split('T')[0],
            hours_worked: 8.0,
            activity_description: 'CTS Corrigida - Atividade de teste',
            description: 'CTS Corrigida - Timesheet de teste',
            status: 'pending'
          };
          
          const { data, error } = await supabase
            .from('timesheets')
            .insert(timesheetData)
            .select()
            .single();
          
          if (error) throw new Error(`Erro ao criar timesheet: ${error.message}`);
          
          this.results.created_entities.timesheets.push(data.id);
          
          return { 
            timesheet_created: true,
            timesheet_id: data.id,
            ticket_id: data.ticket_id,
            hours: data.hours_worked,
            activity: data.activity_description
          };
        }
      }
    ];

    return await this.executeScenario('TESTE DE TIMESHEETS (CORREÇÃO 3)', tests);
  }

  // =====================================================
  // CENÁRIO 4: TESTE DE RELATÓRIOS (CORREÇÃO 4)
  // =====================================================

  async cenarioTesteRelatorios() {
    const tests = [
      {
        name: '4.1 - Relatório de tickets por status (JavaScript)',
        test: async () => {
          const { data: tickets, error } = await supabase
            .from('tickets')
            .select('status');
          
          if (error) throw new Error(`Erro ao buscar tickets: ${error.message}`);
          
          // Agrupar por status usando JavaScript
          const statusGroups = tickets.reduce((acc, ticket) => {
            const status = ticket.status;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {});
          
          return { 
            status_report: true,
            data: statusGroups,
            total_tickets: tickets.length
          };
        }
      },
      {
        name: '4.2 - Relatório de tickets por prioridade (JavaScript)',
        test: async () => {
          const { data: tickets, error } = await supabase
            .from('tickets')
            .select('priority');
          
          if (error) throw new Error(`Erro ao buscar tickets: ${error.message}`);
          
          // Agrupar por prioridade usando JavaScript
          const priorityGroups = tickets.reduce((acc, ticket) => {
            const priority = ticket.priority;
            acc[priority] = (acc[priority] || 0) + 1;
            return acc;
          }, {});
          
          return { 
            priority_report: true,
            data: priorityGroups,
            total_tickets: tickets.length
          };
        }
      }
    ];

    return await this.executeScenario('TESTE DE RELATÓRIOS (CORREÇÃO 4)', tests);
  }

  // =====================================================
  // MÉTODO PRINCIPAL DE EXECUÇÃO
  // =====================================================

  async executarCTSCorrigidaFinal() {
    console.log('🚀 INICIANDO CTS CORRIGIDA FINAL - TESTE DE TODAS AS CORREÇÕES');
    console.log('='.repeat(80));
    console.log(`⏰ Início: ${new Date().toISOString()}`);
    
    try {
      // Executar todos os cenários
      await this.cenarioTesteTickets();
      await this.cenarioTesteKbArticles();
      await this.cenarioTesteTimesheets();
      await this.cenarioTesteRelatorios();
      
      this.results.total_scenarios = this.results.scenarios.length;
      this.results.total_duration = Date.now() - this.startTime;
      
      // Limpeza final
      await this.limpezaFinal();
      
      // Exibir resumo final
      this.exibirResumoFinal();
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Erro durante execução da CTS Corrigida Final:', error);
      throw error;
    }
  }

  async limpezaFinal() {
    console.log('\n🧹 LIMPEZA FINAL DOS DADOS DE TESTE');
    console.log('='.repeat(50));
    
    try {
      // Limpar tickets
      if (this.results.created_entities.tickets.length > 0) {
        const { error: ticketsError } = await supabase
          .from('tickets')
          .delete()
          .in('id', this.results.created_entities.tickets);
        
        if (ticketsError) {
          console.log(`⚠️ Erro ao limpar tickets: ${ticketsError.message}`);
        } else {
          console.log(`✅ ${this.results.created_entities.tickets.length} tickets removidos`);
        }
      }
      
      // Limpar timesheets
      if (this.results.created_entities.timesheets.length > 0) {
        const { error: timesheetsError } = await supabase
          .from('timesheets')
          .delete()
          .in('id', this.results.created_entities.timesheets);
        
        if (timesheetsError) {
          console.log(`⚠️ Erro ao limpar timesheets: ${timesheetsError.message}`);
        } else {
          console.log(`✅ ${this.results.created_entities.timesheets.length} timesheets removidos`);
        }
      }
      
      // Limpar artigos
      if (this.results.created_entities.articles.length > 0) {
        const { error: articlesError } = await supabase
          .from('kb_articles')
          .delete()
          .in('id', this.results.created_entities.articles);
        
        if (articlesError) {
          console.log(`⚠️ Erro ao limpar artigos: ${articlesError.message}`);
        } else {
          console.log(`✅ ${this.results.created_entities.articles.length} artigos removidos`);
        }
      }
      
      // Limpar categorias
      if (this.results.created_entities.categories.length > 0) {
        const { error: categoriesError } = await supabase
          .from('kb_categories')
          .delete()
          .in('id', this.results.created_entities.categories);
        
        if (categoriesError) {
          console.log(`⚠️ Erro ao limpar categorias: ${categoriesError.message}`);
        } else {
          console.log(`✅ ${this.results.created_entities.categories.length} categorias removidas`);
        }
      }
      
      console.log('✅ Limpeza finalizada');
      
    } catch (error) {
      console.log(`⚠️ Erro durante limpeza: ${error.message}`);
    }
  }

  exibirResumoFinal() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO FINAL DA CTS CORRIGIDA FINAL');
    console.log('='.repeat(80));
    console.log(`📈 Total de Cenários: ${this.results.total_scenarios}`);
    console.log(`🧪 Total de Testes: ${this.results.total_tests}`);
    console.log(`✅ Testes Aprovados: ${this.results.passed_tests}`);
    console.log(`❌ Testes Falharam: ${this.results.failed_tests}`);
    console.log(`⏭️ Testes Ignorados: ${this.results.skipped_tests}`);
    console.log(`⏱️ Duração Total: ${this.results.total_duration}ms`);
    console.log(`📊 Taxa de Sucesso: ${((this.results.passed_tests / this.results.total_tests) * 100).toFixed(2)}%`);
    
    console.log('\n📋 DETALHES POR CENÁRIO:');
    this.results.scenarios.forEach(scenario => {
      const successRate = ((scenario.passed_tests / scenario.total_tests) * 100).toFixed(2);
      console.log(`  ${scenario.scenario_name}: ${scenario.passed_tests}/${scenario.total_tests} (${successRate}%) - ${scenario.duration}ms`);
    });
    
    if (this.results.failed_tests > 0) {
      console.log('\n❌ TESTES QUE FALHARAM:');
      this.results.scenarios.forEach(scenario => {
        scenario.tests.filter(test => test.status === 'FAIL').forEach(test => {
          console.log(`  - ${scenario.scenario_name}: ${test.test_name} - ${test.message}`);
        });
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`⏰ Fim: ${new Date().toISOString()}`);
    console.log('='.repeat(80));
  }
}

// =====================================================
// EXECUÇÃO PRINCIPAL
// =====================================================

async function main() {
  try {
    const cts = new CTSCorrigidaFinalTeste();
    const results = await cts.executarCTSCorrigidaFinal();
    
    // Salvar resultados em arquivo
    const fs = await import('fs');
    const resultsJson = JSON.stringify(results, null, 2);
    fs.writeFileSync('cts-corrigida-final-teste-results.json', resultsJson);
    
    console.log('\n💾 Resultados salvos em: cts-corrigida-final-teste-results.json');
    
    // Exit code baseado nos resultados
    if (results.failed_tests > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Erro fatal na execução da CTS Corrigida Final:', error);
    process.exit(1);
  }
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default CTSCorrigidaFinalTeste;
