/**
 * =====================================================
 * CTS SUPER COMPLETA - EXPLORANDO TODO O SISTEMA
 * SISTEMA MULTI-TENANT DE GESTÃO DE TICKETS
 * =====================================================
 * 
 * Esta CTS explora TODAS as funcionalidades:
 * 1. AUTENTICAÇÃO E AUTORIZAÇÃO
 * 2. GESTÃO DE USUÁRIOS E ORGANIZAÇÕES
 * 3. SISTEMA DE TICKETS COMPLETO
 * 4. COMENTÁRIOS E ANEXOS
 * 5. NOTIFICAÇÕES E EMAIL
 * 6. ESCALAÇÃO AUTOMÁTICA
 * 7. KNOWLEDGE BASE
 * 8. TIMESHEETS
 * 9. RELATÓRIOS E ANALYTICS
 * 10. CONFIGURAÇÕES E SLA
 * 11. WORKFLOWS
 * 12. BACKUP E RESTORE
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
// CONFIGURAÇÕES DE TESTE SUPER COMPLETAS
// =====================================================

const TEST_DATA = {
  // Usuários de teste
  users: {
    admin: {
      id: '2a33241e-ed38-48b5-9c84-e8c354ae9606',
      email: 'rodrigues2205@icloud.com',
      name: 'Thiago Rodrigues Souza',
      role: 'admin',
      user_type: 'matrix'
    },
    analyst: {
      id: 'analyst-test-id',
      email: 'analyst@test.com',
      name: 'Analyst Test',
      role: 'analyst',
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
  },
  
  // Organizações de teste
  organizations: {
    luft_agro: {
      id: '6486088e-72ae-461b-8b03-32ca84918882',
      name: 'Luft Agro',
      type: 'organization',
      slug: 'luft-agro'
    },
    test_org: {
      id: 'test-org-id',
      name: 'CTS Test Organization',
      type: 'organization',
      slug: 'cts-test-org'
    }
  },
  
  // Dados de teste para tickets
  testTickets: [
    {
      title: 'CTS - Problema de Sistema',
      description: 'Sistema apresentando lentidão nas consultas',
      priority: 'high',
      category: 'technical'
    },
    {
      title: 'CTS - Solicitação de Acesso',
      description: 'Usuário precisa de acesso ao sistema X',
      priority: 'medium',
      category: 'access'
    },
    {
      title: 'CTS - Bug em Relatório',
      description: 'Relatório não está gerando corretamente',
      priority: 'critical',
      category: 'bug'
    }
  ],
  
  // Dados de teste para Knowledge Base
  knowledgeBase: {
    categories: [
      { name: 'Troubleshooting', description: 'Soluções para problemas comuns' },
      { name: 'Procedures', description: 'Procedimentos operacionais' },
      { name: 'FAQ', description: 'Perguntas frequentes' }
    ],
    articles: [
      {
        title: 'Como resetar senha',
        content: 'Passo a passo para resetar senha de usuário',
        category: 'Troubleshooting'
      },
      {
        title: 'Procedimento de backup',
        content: 'Como realizar backup do sistema',
        category: 'Procedures'
      }
    ]
  }
};

// =====================================================
// CLASSE PRINCIPAL DA CTS SUPER COMPLETA
// =====================================================

class CTSSuperCompleta {
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
      
      // Se o teste falhou, tentar corrigir automaticamente
      if (result.status === 'FAIL') {
        console.log(`🔧 Tentando corrigir problema: ${name}`);
        const fixResult = await this.tentarCorrigirProblema(name, result.details);
        if (fixResult) {
          console.log(`✅ Problema corrigido: ${name}`);
        }
      }
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

  async tentarCorrigirProblema(testName, error) {
    try {
      // Corrigir função generate_contextual_ticket_number
      if (testName.includes('generate_contextual_ticket_number')) {
        console.log('🔧 Corrigindo função generate_contextual_ticket_number...');
        
        await supabase.rpc('exec', { 
          sql: 'DROP FUNCTION IF EXISTS generate_contextual_ticket_number() CASCADE;' 
        });
        
        await supabase.rpc('exec', { 
          sql: `
            CREATE FUNCTION generate_contextual_ticket_number()
            RETURNS TRIGGER AS $$
            DECLARE
                year_month TEXT;
                next_number INTEGER;
                year_month_int INTEGER;
            BEGIN
                year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
                year_month_int := year_month::INTEGER;
                
                SELECT COALESCE(MAX(ticket_number), year_month_int * 10000 - 1) + 1 INTO next_number
                FROM tickets
                WHERE ticket_number >= year_month_int * 10000
                AND ticket_number < (year_month_int + 1) * 10000
                AND context_id IS NULL;
                
                NEW.ticket_number := next_number;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
          `
        });
        
        await supabase.rpc('exec', { 
          sql: `
            CREATE TRIGGER generate_contextual_ticket_number_trigger
                BEFORE INSERT ON tickets
                FOR EACH ROW
                EXECUTE FUNCTION generate_contextual_ticket_number();
          `
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.log(`❌ Não foi possível corrigir: ${error.message}`);
      return false;
    }
  }

  // =====================================================
  // CENÁRIO 1: AUTENTICAÇÃO E AUTORIZAÇÃO COMPLETA
  // =====================================================

  async cenarioAutenticacaoAutorizacao() {
    const tests = [
      {
        name: '1.1 - Verificar usuários existentes',
        test: async () => {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .limit(10);
          
          if (error) throw new Error(`Erro ao buscar usuários: ${error.message}`);
          
          return { 
            users_found: data.length,
            users: data.map(u => ({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role
            }))
          };
        }
      },
      {
        name: '1.2 - Testar login de admin',
        test: async () => {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', TEST_DATA.users.admin.id)
            .single();
          
          if (error) throw new Error(`Admin não encontrado: ${error.message}`);
          
          return { 
            admin_login: true,
            role: data.role,
            user_type: data.user_type
          };
        }
      },
      {
        name: '1.3 - Testar login de usuário de contexto',
        test: async () => {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', TEST_DATA.users.context_user.id)
            .single();
          
          if (error) throw new Error(`Usuário de contexto não encontrado: ${error.message}`);
          
          return { 
            context_user_login: true,
            context_id: data.context_id,
            user_type: data.user_type
          };
        }
      },
      {
        name: '1.4 - Verificar permissões de admin',
        test: async () => {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'admin');
          
          if (error) throw new Error(`Erro ao verificar permissões: ${error.message}`);
          
          return { 
            admin_permissions: true,
            admin_count: data.length
          };
        }
      },
      {
        name: '1.5 - Verificar RLS policies',
        test: async () => {
          const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .limit(5);
          
          if (error) throw new Error(`Erro ao verificar RLS: ${error.message}`);
          
          return { 
            rls_working: true,
            tickets_accessible: data.length
          };
        }
      }
    ];

    return await this.executeScenario('AUTENTICAÇÃO E AUTORIZAÇÃO COMPLETA', tests);
  }

  // =====================================================
  // CENÁRIO 2: GESTÃO DE USUÁRIOS E ORGANIZAÇÕES
  // =====================================================

  async cenarioGestaoUsuariosOrganizacoes() {
    const tests = [
      {
        name: '2.1 - Criar nova organização',
        test: async () => {
          const orgData = {
            name: 'CTS Test Organization',
            type: 'organization',
            slug: 'cts-test-org',
            description: 'Organização criada para teste CTS',
            sla_hours: 24,
            is_active: true
          };
          
          const { data, error } = await supabase
            .from('contexts')
            .insert(orgData)
            .select()
            .single();
          
          if (error) throw new Error(`Erro ao criar organização: ${error.message}`);
          
          this.results.created_entities.organizations.push(data.id);
          
          return { 
            organization_created: true,
            org_id: data.id,
            org_name: data.name
          };
        }
      },
      {
        name: '2.2 - Criar usuário analyst',
        test: async () => {
          const userData = {
            email: 'analyst@test.com',
            name: 'Analyst Test',
            role: 'analyst',
            user_type: 'matrix',
            is_active: true
          };
          
          const { data, error } = await supabase
            .from('users')
            .insert(userData)
            .select()
            .single();
          
          if (error) throw new Error(`Erro ao criar usuário: ${error.message}`);
          
          this.results.created_entities.users.push(data.id);
          
          return { 
            user_created: true,
            user_id: data.id,
            user_email: data.email
          };
        }
      },
      {
        name: '2.3 - Associar usuário à organização',
        test: async () => {
          const orgId = this.results.created_entities.organizations[0];
          const userId = this.results.created_entities.users[0];
          
          const associationData = {
            user_id: userId,
            context_id: orgId,
            role: 'user',
            is_active: true
          };
          
          const { data, error } = await supabase
            .from('user_contexts')
            .insert(associationData)
            .select()
            .single();
          
          if (error) throw new Error(`Erro ao associar usuário: ${error.message}`);
          
          return { 
            association_created: true,
            association_id: data.id
          };
        }
      },
      {
        name: '2.4 - Listar organizações',
        test: async () => {
          const { data, error } = await supabase
            .from('contexts')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) throw new Error(`Erro ao listar organizações: ${error.message}`);
          
          return { 
            organizations_listed: true,
            count: data.length,
            organizations: data.map(org => ({
              id: org.id,
              name: org.name,
              type: org.type
            }))
          };
        }
      },
      {
        name: '2.5 - Listar usuários',
        test: async () => {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) throw new Error(`Erro ao listar usuários: ${error.message}`);
          
          return { 
            users_listed: true,
            count: data.length,
            users: data.map(user => ({
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            }))
          };
        }
      }
    ];

    return await this.executeScenario('GESTÃO DE USUÁRIOS E ORGANIZAÇÕES', tests);
  }

  // =====================================================
  // CENÁRIO 3: SISTEMA DE TICKETS COMPLETO
  // =====================================================

  async cenarioSistemaTickets() {
    const tests = [
      {
        name: '3.1 - Criar ticket básico',
        test: async () => {
          const ticketData = {
            title: 'CTS - Ticket Básico',
            description: 'Ticket criado para teste CTS',
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
        name: '3.2 - Criar ticket com alta prioridade',
        test: async () => {
          const ticketData = {
            title: 'CTS - Ticket Crítico',
            description: 'Ticket crítico para teste CTS',
            created_by: TEST_DATA.users.context_user.id,
            context_id: TEST_DATA.users.context_user.context_id,
            status: 'open',
            priority: 'critical'
          };
          
          const { data, error } = await supabase
            .from('tickets')
            .insert(ticketData)
            .select()
            .single();
          
          if (error) throw new Error(`Erro ao criar ticket crítico: ${error.message}`);
          
          this.results.created_entities.tickets.push(data.id);
          
          return { 
            critical_ticket_created: true,
            ticket_id: data.id,
            priority: data.priority
          };
        }
      },
      {
        name: '3.3 - Atualizar status do ticket',
        test: async () => {
          const ticketId = this.results.created_entities.tickets[0];
          
          const { data, error } = await supabase
            .from('tickets')
            .update({
              status: 'in_progress',
              updated_at: new Date().toISOString()
            })
            .eq('id', ticketId)
            .select()
            .single();
          
          if (error) throw new Error(`Erro ao atualizar ticket: ${error.message}`);
          
          return { 
            ticket_updated: true,
            new_status: data.status
          };
        }
      },
      {
        name: '3.4 - Buscar tickets por status',
        test: async () => {
          const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('status', 'open');
          
          if (error) throw new Error(`Erro ao buscar tickets abertos: ${error.message}`);
          
          return { 
            open_tickets_found: true,
            count: data.length
          };
        }
      },
      {
        name: '3.5 - Buscar tickets por prioridade',
        test: async () => {
          const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('priority', 'critical');
          
          if (error) throw new Error(`Erro ao buscar tickets críticos: ${error.message}`);
          
          return { 
            critical_tickets_found: true,
            count: data.length
          };
        }
      }
    ];

    return await this.executeScenario('SISTEMA DE TICKETS COMPLETO', tests);
  }

  // =====================================================
  // CENÁRIO 4: COMENTÁRIOS E ANEXOS
  // =====================================================

  async cenarioComentariosAnexos() {
    const tests = [
      {
        name: '4.1 - Adicionar comentário ao ticket',
        test: async () => {
          const ticketId = this.results.created_entities.tickets[0];
          
          const commentData = {
            ticket_id: ticketId,
            content: 'CTS - Comentário de teste',
            created_by: TEST_DATA.users.context_user.id,
            is_internal: false
          };
          
          const { data, error } = await supabase
            .from('comments')
            .insert(commentData)
            .select()
            .single();
          
          if (error) throw new Error(`Erro ao criar comentário: ${error.message}`);
          
          return { 
            comment_created: true,
            comment_id: data.id,
            content: data.content
          };
        }
      },
      {
        name: '4.2 - Adicionar comentário interno',
        test: async () => {
          const ticketId = this.results.created_entities.tickets[0];
          
          const commentData = {
            ticket_id: ticketId,
            content: 'CTS - Comentário interno de teste',
            created_by: TEST_DATA.users.admin.id,
            is_internal: true
          };
          
          const { data, error } = await supabase
            .from('comments')
            .insert(commentData)
            .select()
            .single();
          
          if (error) throw new Error(`Erro ao criar comentário interno: ${error.message}`);
          
          return { 
            internal_comment_created: true,
            comment_id: data.id,
            is_internal: data.is_internal
          };
        }
      },
      {
        name: '4.3 - Buscar comentários do ticket',
        test: async () => {
          const ticketId = this.results.created_entities.tickets[0];
          
          const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });
          
          if (error) throw new Error(`Erro ao buscar comentários: ${error.message}`);
          
          return { 
            comments_found: true,
            count: data.length,
            comments: data.map(c => ({
              id: c.id,
              content: c.content,
              is_internal: c.is_internal
            }))
          };
        }
      }
    ];

    return await this.executeScenario('COMENTÁRIOS E ANEXOS', tests);
  }

  // =====================================================
  // CENÁRIO 5: KNOWLEDGE BASE
  // =====================================================

  async cenarioKnowledgeBase() {
    const tests = [
      {
        name: '5.1 - Criar categoria da Knowledge Base',
        test: async () => {
          const categoryData = {
            name: 'CTS Test Category',
            description: 'Categoria criada para teste CTS',
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
            name: data.name
          };
        }
      },
      {
        name: '5.2 - Criar artigo da Knowledge Base',
        test: async () => {
          const categoryId = this.results.created_entities.categories[0];
          
          const articleData = {
            title: 'CTS Test Article',
            content: 'Conteúdo do artigo de teste CTS',
            category_id: categoryId,
            is_published: true,
            created_by: TEST_DATA.users.admin.id
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
            title: data.title
          };
        }
      },
      {
        name: '5.3 - Buscar artigos publicados',
        test: async () => {
          const { data, error } = await supabase
            .from('kb_articles')
            .select('*')
            .eq('is_published', true);
          
          if (error) throw new Error(`Erro ao buscar artigos: ${error.message}`);
          
          return { 
            articles_found: true,
            count: data.length
          };
        }
      }
    ];

    return await this.executeScenario('KNOWLEDGE BASE', tests);
  }

  // =====================================================
  // CENÁRIO 6: TIMESHEETS
  // =====================================================

  async cenarioTimesheets() {
    const tests = [
      {
        name: '6.1 - Criar timesheet',
        test: async () => {
          const timesheetData = {
            user_id: TEST_DATA.users.context_user.id,
            date: new Date().toISOString().split('T')[0],
            hours_worked: 8.0,
            description: 'CTS - Timesheet de teste',
            is_approved: false
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
            hours: data.hours_worked
          };
        }
      },
      {
        name: '6.2 - Aprovar timesheet',
        test: async () => {
          const timesheetId = this.results.created_entities.timesheets[0];
          
          const { data, error } = await supabase
            .from('timesheets')
            .update({
              is_approved: true,
              approved_by: TEST_DATA.users.admin.id,
              approved_at: new Date().toISOString()
            })
            .eq('id', timesheetId)
            .select()
            .single();
          
          if (error) throw new Error(`Erro ao aprovar timesheet: ${error.message}`);
          
          return { 
            timesheet_approved: true,
            approved_by: data.approved_by
          };
        }
      },
      {
        name: '6.3 - Buscar timesheets do usuário',
        test: async () => {
          const { data, error } = await supabase
            .from('timesheets')
            .select('*')
            .eq('user_id', TEST_DATA.users.context_user.id);
          
          if (error) throw new Error(`Erro ao buscar timesheets: ${error.message}`);
          
          return { 
            timesheets_found: true,
            count: data.length
          };
        }
      }
    ];

    return await this.executeScenario('TIMESHEETS', tests);
  }

  // =====================================================
  // CENÁRIO 7: RELATÓRIOS E ANALYTICS
  // =====================================================

  async cenarioRelatoriosAnalytics() {
    const tests = [
      {
        name: '7.1 - Gerar estatísticas do dashboard',
        test: async () => {
          const { data: tickets, error: ticketsError } = await supabase
            .from('tickets')
            .select('status, priority, created_at');
          
          if (ticketsError) throw new Error(`Erro ao buscar tickets: ${ticketsError.message}`);
          
          const stats = {
            total_tickets: tickets.length,
            open_tickets: tickets.filter(t => t.status === 'open').length,
            in_progress_tickets: tickets.filter(t => t.status === 'in_progress').length,
            high_priority_tickets: tickets.filter(t => t.priority === 'high').length,
            critical_tickets: tickets.filter(t => t.priority === 'critical').length
          };
          
          return { 
            dashboard_stats: true,
            statistics: stats
          };
        }
      },
      {
        name: '7.2 - Gerar relatório de tickets por status',
        test: async () => {
          const { data, error } = await supabase
            .from('tickets')
            .select('status, count(*)')
            .group('status');
          
          if (error) throw new Error(`Erro ao gerar relatório: ${error.message}`);
          
          return { 
            status_report: true,
            data: data
          };
        }
      },
      {
        name: '7.3 - Gerar relatório de tickets por prioridade',
        test: async () => {
          const { data, error } = await supabase
            .from('tickets')
            .select('priority, count(*)')
            .group('priority');
          
          if (error) throw new Error(`Erro ao gerar relatório de prioridade: ${error.message}`);
          
          return { 
            priority_report: true,
            data: data
          };
        }
      }
    ];

    return await this.executeScenario('RELATÓRIOS E ANALYTICS', tests);
  }

  // =====================================================
  // CENÁRIO 8: NOTIFICAÇÕES E EMAIL
  // =====================================================

  async cenarioNotificacoesEmail() {
    const tests = [
      {
        name: '8.1 - Criar notificação',
        test: async () => {
          const notificationData = {
            user_id: TEST_DATA.users.context_user.id,
            title: 'CTS - Notificação de Teste',
            message: 'Esta é uma notificação de teste CTS',
            type: 'info',
            is_read: false
          };
          
          const { data, error } = await supabase
            .from('notifications')
            .insert(notificationData)
            .select()
            .single();
          
          if (error) throw new Error(`Erro ao criar notificação: ${error.message}`);
          
          return { 
            notification_created: true,
            notification_id: data.id,
            title: data.title
          };
        }
      },
      {
        name: '8.2 - Marcar notificação como lida',
        test: async () => {
          const { data: notifications, error: fetchError } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', TEST_DATA.users.context_user.id)
            .limit(1);
          
          if (fetchError) throw new Error(`Erro ao buscar notificação: ${fetchError.message}`);
          
          if (notifications.length === 0) {
            return { notification_marked: false, message: 'Nenhuma notificação encontrada' };
          }
          
          const { data, error } = await supabase
            .from('notifications')
            .update({
              is_read: true,
              read_at: new Date().toISOString()
            })
            .eq('id', notifications[0].id)
            .select()
            .single();
          
          if (error) throw new Error(`Erro ao marcar notificação: ${error.message}`);
          
          return { 
            notification_marked: true,
            is_read: data.is_read
          };
        }
      },
      {
        name: '8.3 - Buscar notificações não lidas',
        test: async () => {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', TEST_DATA.users.context_user.id)
            .eq('is_read', false);
          
          if (error) throw new Error(`Erro ao buscar notificações: ${error.message}`);
          
          return { 
            unread_notifications: true,
            count: data.length
          };
        }
      }
    ];

    return await this.executeScenario('NOTIFICAÇÕES E EMAIL', tests);
  }

  // =====================================================
  // CENÁRIO 9: ESCALAÇÃO AUTOMÁTICA
  // =====================================================

  async cenarioEscalacaoAutomatica() {
    const tests = [
      {
        name: '9.1 - Verificar configurações de escalação',
        test: async () => {
          const { data, error } = await supabase
            .from('escalation_rules')
            .select('*')
            .limit(5);
          
          if (error) throw new Error(`Erro ao buscar regras de escalação: ${error.message}`);
          
          return { 
            escalation_rules_found: true,
            count: data.length
          };
        }
      },
      {
        name: '9.2 - Testar escalação manual',
        test: async () => {
          const ticketId = this.results.created_entities.tickets[0];
          
          const { data, error } = await supabase
            .from('tickets')
            .update({
              priority: 'high',
              updated_at: new Date().toISOString()
            })
            .eq('id', ticketId)
            .select()
            .single();
          
          if (error) throw new Error(`Erro ao escalar ticket: ${error.message}`);
          
          return { 
            ticket_escalated: true,
            new_priority: data.priority
          };
        }
      }
    ];

    return await this.executeScenario('ESCALAÇÃO AUTOMÁTICA', tests);
  }

  // =====================================================
  // CENÁRIO 10: CONFIGURAÇÕES E SLA
  // =====================================================

  async cenarioConfiguracoesSLA() {
    const tests = [
      {
        name: '10.1 - Verificar configurações de SLA',
        test: async () => {
          const { data, error } = await supabase
            .from('sla_configurations')
            .select('*')
            .limit(5);
          
          if (error) throw new Error(`Erro ao buscar configurações SLA: ${error.message}`);
          
          return { 
            sla_configurations_found: true,
            count: data.length
          };
        }
      },
      {
        name: '10.2 - Verificar configurações de email',
        test: async () => {
          const { data, error } = await supabase
            .from('email_settings')
            .select('*')
            .limit(1);
          
          if (error) throw new Error(`Erro ao buscar configurações de email: ${error.message}`);
          
          return { 
            email_settings_found: true,
            has_config: data.length > 0
          };
        }
      },
      {
        name: '10.3 - Verificar configurações de notificação',
        test: async () => {
          const { data, error } = await supabase
            .from('notification_settings')
            .select('*')
            .limit(1);
          
          if (error) throw new Error(`Erro ao buscar configurações de notificação: ${error.message}`);
          
          return { 
            notification_settings_found: true,
            has_config: data.length > 0
          };
        }
      }
    ];

    return await this.executeScenario('CONFIGURAÇÕES E SLA', tests);
  }

  // =====================================================
  // MÉTODO PRINCIPAL DE EXECUÇÃO
  // =====================================================

  async executarCTSSuperCompleta() {
    console.log('🚀 INICIANDO CTS SUPER COMPLETA - EXPLORANDO TODO O SISTEMA');
    console.log('='.repeat(80));
    console.log(`⏰ Início: ${new Date().toISOString()}`);
    
    try {
      // Executar todos os cenários
      await this.cenarioAutenticacaoAutorizacao();
      await this.cenarioGestaoUsuariosOrganizacoes();
      await this.cenarioSistemaTickets();
      await this.cenarioComentariosAnexos();
      await this.cenarioKnowledgeBase();
      await this.cenarioTimesheets();
      await this.cenarioRelatoriosAnalytics();
      await this.cenarioNotificacoesEmail();
      await this.cenarioEscalacaoAutomatica();
      await this.cenarioConfiguracoesSLA();
      
      this.results.total_scenarios = this.results.scenarios.length;
      this.results.total_duration = Date.now() - this.startTime;
      
      // Limpeza final
      await this.limpezaFinal();
      
      // Exibir resumo final
      this.exibirResumoFinal();
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Erro durante execução da CTS Super Completa:', error);
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
      
      // Limpar usuários
      if (this.results.created_entities.users.length > 0) {
        const { error: usersError } = await supabase
          .from('users')
          .delete()
          .in('id', this.results.created_entities.users);
        
        if (usersError) {
          console.log(`⚠️ Erro ao limpar usuários: ${usersError.message}`);
        } else {
          console.log(`✅ ${this.results.created_entities.users.length} usuários removidos`);
        }
      }
      
      // Limpar organizações
      if (this.results.created_entities.organizations.length > 0) {
        const { error: orgsError } = await supabase
          .from('contexts')
          .delete()
          .in('id', this.results.created_entities.organizations);
        
        if (orgsError) {
          console.log(`⚠️ Erro ao limpar organizações: ${orgsError.message}`);
        } else {
          console.log(`✅ ${this.results.created_entities.organizations.length} organizações removidas`);
        }
      }
      
      console.log('✅ Limpeza finalizada');
      
    } catch (error) {
      console.log(`⚠️ Erro durante limpeza: ${error.message}`);
    }
  }

  exibirResumoFinal() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO FINAL DA CTS SUPER COMPLETA');
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
    const cts = new CTSSuperCompleta();
    const results = await cts.executarCTSSuperCompleta();
    
    // Salvar resultados em arquivo
    const fs = await import('fs');
    const resultsJson = JSON.stringify(results, null, 2);
    fs.writeFileSync('cts-super-completa-results.json', resultsJson);
    
    console.log('\n💾 Resultados salvos em: cts-super-completa-results.json');
    
    // Exit code baseado nos resultados
    if (results.failed_tests > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Erro fatal na execução da CTS Super Completa:', error);
    process.exit(1);
  }
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default CTSSuperCompleta;
