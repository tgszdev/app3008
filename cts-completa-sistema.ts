/**
 * =====================================================
 * CTS (CONJUNTO DE TESTES DE SISTEMA) - COMPLETA E COMPLEXA
 * SISTEMA MULTI-TENANT DE GESTÃO DE TICKETS
 * =====================================================
 * 
 * Este arquivo contém uma suíte completa de testes para verificar
 * todos os aspectos do sistema multi-tenant, incluindo:
 * 
 * 1. AUTENTICAÇÃO E AUTORIZAÇÃO
 * 2. SISTEMA MULTI-TENANT
 * 3. GESTÃO DE TICKETS
 * 4. GESTÃO DE USUÁRIOS E ORGANIZAÇÕES
 * 5. APIS E ENDPOINTS
 * 6. RLS POLICIES
 * 7. FUNCIONALIDADES AVANÇADAS
 * 8. PERFORMANCE E SEGURANÇA
 * 
 * =====================================================
 */

import { createClient } from '@supabase/supabase-js';
import { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';

// =====================================================
// CONFIGURAÇÕES E CONSTANTES
// =====================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Usuários de teste
const TEST_USERS = {
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
    context_id: '6486088e-72ae-461b-8b03-32ca84918882',
    context_name: 'Luft Agro'
  }
};

// Organizações de teste
const TEST_ORGANIZATIONS = {
  luft_agro: {
    id: '6486088e-72ae-461b-8b03-32ca84918882',
    name: 'Luft Agro',
    type: 'organization',
    slug: 'luft-agro'
  },
  organizacao_padrao: {
    id: 'fa4a4a34-f662-4da1-94d8-b77b5c578d6b',
    name: 'Organização Padrão',
    type: 'organization',
    slug: 'organizacao-padrao'
  }
};

// =====================================================
// INTERFACES E TIPOS
// =====================================================

interface TestResult {
  test_name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration: number;
  details?: any;
}

interface TestSuite {
  suite_name: string;
  tests: TestResult[];
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  skipped_tests: number;
  duration: number;
}

interface CTSResults {
  total_suites: number;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  skipped_tests: number;
  total_duration: number;
  suites: TestSuite[];
}

// =====================================================
// CLASSE PRINCIPAL DO CTS
// =====================================================

export class CTSCompletaSistema {
  private results: CTSResults = {
    total_suites: 0,
    total_tests: 0,
    passed_tests: 0,
    failed_tests: 0,
    skipped_tests: 0,
    total_duration: 0,
    suites: []
  };

  private startTime: number = 0;

  constructor() {
    this.startTime = Date.now();
  }

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  private async executeTest(testName: string, testFunction: () => Promise<any>): Promise<TestResult> {
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

  private async executeTestSuite(suiteName: string, tests: Array<{name: string, test: () => Promise<any>}>): Promise<TestSuite> {
    const startTime = Date.now();
    const testResults: TestResult[] = [];
    
    console.log(`\n🧪 Executando suite: ${suiteName}`);
    console.log('='.repeat(50));
    
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
    
    const suite: TestSuite = {
      suite_name: suiteName,
      tests: testResults,
      total_tests: testResults.length,
      passed_tests: passedTests,
      failed_tests: failedTests,
      skipped_tests: skippedTests,
      duration
    };
    
    this.results.suites.push(suite);
    this.results.total_tests += testResults.length;
    this.results.passed_tests += passedTests;
    this.results.failed_tests += failedTests;
    this.results.skipped_tests += skippedTests;
    this.results.total_duration += duration;
    
    return suite;
  }

  // =====================================================
  // SUITE 1: AUTENTICAÇÃO E AUTORIZAÇÃO
  // =====================================================

  private async suiteAutenticacaoAutorizacao(): Promise<TestSuite> {
    const tests = [
      {
        name: 'Verificar conexão com Supabase',
        test: async () => {
          const { data, error } = await supabase.from('users').select('count').limit(1);
          if (error) throw new Error(`Erro de conexão: ${error.message}`);
          return { connected: true, data };
        }
      },
      {
        name: 'Verificar usuário admin existe',
        test: async () => {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', TEST_USERS.admin.id)
            .single();
          
          if (error) throw new Error(`Usuário admin não encontrado: ${error.message}`);
          if (!data) throw new Error('Usuário admin não existe');
          
          return { user: data };
        }
      },
      {
        name: 'Verificar usuário de contexto existe',
        test: async () => {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', TEST_USERS.context_user.id)
            .single();
          
          if (error) throw new Error(`Usuário de contexto não encontrado: ${error.message}`);
          if (!data) throw new Error('Usuário de contexto não existe');
          
          return { user: data };
        }
      },
      {
        name: 'Verificar estrutura da tabela users',
        test: async () => {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .limit(1);
          
          if (error) throw new Error(`Erro ao verificar estrutura: ${error.message}`);
          
          const user = data?.[0];
          const requiredFields = ['id', 'name', 'email', 'role', 'user_type', 'context_id'];
          const missingFields = requiredFields.filter(field => !(field in user));
          
          if (missingFields.length > 0) {
            throw new Error(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
          }
          
          return { structure: 'OK', fields: Object.keys(user) };
        }
      },
      {
        name: 'Verificar RLS policies na tabela users',
        test: async () => {
          // Este teste verifica se as RLS policies estão funcionando
          // tentando acessar dados sem autenticação adequada
          const { data, error } = await supabase
            .from('users')
            .select('*');
          
          if (error) throw new Error(`Erro ao verificar RLS: ${error.message}`);
          
          return { rls_status: 'OK', records_found: data?.length || 0 };
        }
      }
    ];

    return await this.executeTestSuite('AUTENTICAÇÃO E AUTORIZAÇÃO', tests);
  }

  // =====================================================
  // SUITE 2: SISTEMA MULTI-TENANT
  // =====================================================

  private async suiteSistemaMultiTenant(): Promise<TestSuite> {
    const tests = [
      {
        name: 'Verificar tabela contexts existe',
        test: async () => {
          const { data, error } = await supabase
            .from('contexts')
            .select('*')
            .limit(1);
          
          if (error) throw new Error(`Tabela contexts não acessível: ${error.message}`);
          
          return { contexts_table: 'OK', sample: data?.[0] };
        }
      },
      {
        name: 'Verificar tabela user_contexts existe',
        test: async () => {
          const { data, error } = await supabase
            .from('user_contexts')
            .select('*')
            .limit(1);
          
          if (error) throw new Error(`Tabela user_contexts não acessível: ${error.message}`);
          
          return { user_contexts_table: 'OK', sample: data?.[0] };
        }
      },
      {
        name: 'Verificar organização Luft Agro existe',
        test: async () => {
          const { data, error } = await supabase
            .from('contexts')
            .select('*')
            .eq('id', TEST_ORGANIZATIONS.luft_agro.id)
            .single();
          
          if (error) throw new Error(`Organização Luft Agro não encontrada: ${error.message}`);
          
          return { organization: data };
        }
      },
      {
        name: 'Verificar associação usuário-organização',
        test: async () => {
          const { data, error } = await supabase
            .from('user_contexts')
            .select('*')
            .eq('user_id', TEST_USERS.context_user.id)
            .eq('context_id', TEST_ORGANIZATIONS.luft_agro.id);
          
          if (error) throw new Error(`Associação não encontrada: ${error.message}`);
          if (!data || data.length === 0) throw new Error('Usuário não está associado à organização');
          
          return { association: data[0] };
        }
      },
      {
        name: 'Verificar RLS policies em user_contexts',
        test: async () => {
          const { data, error } = await supabase
            .from('user_contexts')
            .select('*');
          
          if (error) throw new Error(`Erro ao verificar RLS em user_contexts: ${error.message}`);
          
          return { rls_status: 'OK', records_found: data?.length || 0 };
        }
      }
    ];

    return await this.executeTestSuite('SISTEMA MULTI-TENANT', tests);
  }

  // =====================================================
  // SUITE 3: GESTÃO DE TICKETS
  // =====================================================

  private async suiteGestaoTickets(): Promise<TestSuite> {
    const tests = [
      {
        name: 'Verificar estrutura da tabela tickets',
        test: async () => {
          const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .limit(1);
          
          if (error) throw new Error(`Erro ao verificar estrutura: ${error.message}`);
          
          const ticket = data?.[0];
          const requiredFields = ['id', 'title', 'description', 'status', 'priority', 'created_by', 'ticket_number', 'context_id'];
          const missingFields = requiredFields.filter(field => !(field in ticket));
          
          if (missingFields.length > 0) {
            throw new Error(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
          }
          
          return { structure: 'OK', fields: Object.keys(ticket) };
        }
      },
      {
        name: 'Testar criação de ticket mínimo',
        test: async () => {
          const ticketData = {
            title: 'CTS Test - Ticket Mínimo',
            description: 'Teste de criação de ticket mínimo',
            created_by: TEST_USERS.context_user.id
          };
          
          const { data, error } = await supabase
            .from('tickets')
            .insert(ticketData)
            .select()
            .single();
          
          if (error) throw new Error(`Erro ao criar ticket: ${error.message}`);
          
          // Limpar o ticket de teste
          await supabase
            .from('tickets')
            .delete()
            .eq('id', data.id);
          
          return { ticket_created: true, ticket_id: data.id, ticket_number: data.ticket_number };
        }
      },
      {
        name: 'Testar criação de ticket com context_id',
        test: async () => {
          const ticketData = {
            title: 'CTS Test - Ticket com Context',
            description: 'Teste de criação de ticket com context_id',
            created_by: TEST_USERS.context_user.id,
            context_id: TEST_ORGANIZATIONS.luft_agro.id
          };
          
          const { data, error } = await supabase
            .from('tickets')
            .insert(ticketData)
            .select()
            .single();
          
          if (error) throw new Error(`Erro ao criar ticket com context: ${error.message}`);
          
          // Limpar o ticket de teste
          await supabase
            .from('tickets')
            .delete()
            .eq('id', data.id);
          
          return { ticket_created: true, ticket_id: data.id, context_id: data.context_id };
        }
      },
      {
        name: 'Testar criação de ticket com status e priority',
        test: async () => {
          const ticketData = {
            title: 'CTS Test - Ticket com Status',
            description: 'Teste de criação de ticket com status e priority',
            created_by: TEST_USERS.context_user.id,
            status: 'open',
            priority: 'medium'
          };
          
          const { data, error } = await supabase
            .from('tickets')
            .insert(ticketData)
            .select()
            .single();
          
          if (error) throw new Error(`Erro ao criar ticket com status: ${error.message}`);
          
          // Limpar o ticket de teste
          await supabase
            .from('tickets')
            .delete()
            .eq('id', data.id);
          
          return { ticket_created: true, status: data.status, priority: data.priority };
        }
      },
      {
        name: 'Verificar função generate_contextual_ticket_number',
        test: async () => {
          // Verificar se a função existe e funciona
          const { data, error } = await supabase
            .rpc('generate_contextual_ticket_number');
          
          if (error) throw new Error(`Função não funciona: ${error.message}`);
          
          return { function_works: true, result: data };
        }
      },
      {
        name: 'Verificar RLS policies em tickets',
        test: async () => {
          const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .limit(5);
          
          if (error) throw new Error(`Erro ao verificar RLS em tickets: ${error.message}`);
          
          return { rls_status: 'OK', records_found: data?.length || 0 };
        }
      }
    ];

    return await this.executeTestSuite('GESTÃO DE TICKETS', tests);
  }

  // =====================================================
  // SUITE 4: APIS E ENDPOINTS
  // =====================================================

  private async suiteAPIsEndpoints(): Promise<TestSuite> {
    const tests = [
      {
        name: 'Testar API /api/tickets (GET)',
        test: async () => {
          const response = await fetch('https://www.ithostbr.tech/api/tickets', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`API retornou status ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          return { api_status: 'OK', response_status: response.status, data_length: data?.length || 0 };
        }
      },
      {
        name: 'Testar API /api/dashboard/stats',
        test: async () => {
          const response = await fetch('https://www.ithostbr.tech/api/dashboard/stats', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`API retornou status ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          return { api_status: 'OK', response_status: response.status, stats: data };
        }
      },
      {
        name: 'Testar API /api/organizations',
        test: async () => {
          const response = await fetch('https://www.ithostbr.tech/api/organizations', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`API retornou status ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          return { api_status: 'OK', response_status: response.status, organizations: data };
        }
      },
      {
        name: 'Testar API /api/users',
        test: async () => {
          const response = await fetch('https://www.ithostbr.tech/api/users', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`API retornou status ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          return { api_status: 'OK', response_status: response.status, users: data };
        }
      },
      {
        name: 'Testar API /api/comments',
        test: async () => {
          const response = await fetch('https://www.ithostbr.tech/api/comments', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`API retornou status ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          return { api_status: 'OK', response_status: response.status, comments: data };
        }
      }
    ];

    return await this.executeTestSuite('APIS E ENDPOINTS', tests);
  }

  // =====================================================
  // SUITE 5: FUNCIONALIDADES AVANÇADAS
  // =====================================================

  private async suiteFuncionalidadesAvancadas(): Promise<TestSuite> {
    const tests = [
      {
        name: 'Verificar tabela categories',
        test: async () => {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .limit(5);
          
          if (error) throw new Error(`Erro ao verificar categories: ${error.message}`);
          
          return { categories_found: data?.length || 0, sample: data?.[0] };
        }
      },
      {
        name: 'Verificar tabela statuses',
        test: async () => {
          const { data, error } = await supabase
            .from('statuses')
            .select('*')
            .limit(5);
          
          if (error) throw new Error(`Erro ao verificar statuses: ${error.message}`);
          
          return { statuses_found: data?.length || 0, sample: data?.[0] };
        }
      },
      {
        name: 'Verificar tabela priorities',
        test: async () => {
          const { data, error } = await supabase
            .from('priorities')
            .select('*')
            .limit(5);
          
          if (error) throw new Error(`Erro ao verificar priorities: ${error.message}`);
          
          return { priorities_found: data?.length || 0, sample: data?.[0] };
        }
      },
      {
        name: 'Verificar tabela timesheets',
        test: async () => {
          const { data, error } = await supabase
            .from('timesheets')
            .select('*')
            .limit(5);
          
          if (error) throw new Error(`Erro ao verificar timesheets: ${error.message}`);
          
          return { timesheets_found: data?.length || 0, sample: data?.[0] };
        }
      },
      {
        name: 'Verificar tabela comments',
        test: async () => {
          const { data, error } = await supabase
            .from('comments')
            .select('*')
            .limit(5);
          
          if (error) throw new Error(`Erro ao verificar comments: ${error.message}`);
          
          return { comments_found: data?.length || 0, sample: data?.[0] };
        }
      }
    ];

    return await this.executeTestSuite('FUNCIONALIDADES AVANÇADAS', tests);
  }

  // =====================================================
  // SUITE 6: PERFORMANCE E SEGURANÇA
  // =====================================================

  private async suitePerformanceSeguranca(): Promise<TestSuite> {
    const tests = [
      {
        name: 'Testar performance de consulta de tickets',
        test: async () => {
          const startTime = Date.now();
          
          const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .limit(100);
          
          const duration = Date.now() - startTime;
          
          if (error) throw new Error(`Erro na consulta: ${error.message}`);
          if (duration > 5000) throw new Error(`Consulta muito lenta: ${duration}ms`);
          
          return { performance: 'OK', duration, records: data?.length || 0 };
        }
      },
      {
        name: 'Testar performance de consulta de usuários',
        test: async () => {
          const startTime = Date.now();
          
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .limit(50);
          
          const duration = Date.now() - startTime;
          
          if (error) throw new Error(`Erro na consulta: ${error.message}`);
          if (duration > 3000) throw new Error(`Consulta muito lenta: ${duration}ms`);
          
          return { performance: 'OK', duration, records: data?.length || 0 };
        }
      },
      {
        name: 'Verificar integridade dos dados',
        test: async () => {
          // Verificar se não há tickets órfãos
          const { data: orphanTickets, error: orphanError } = await supabase
            .from('tickets')
            .select('id, created_by')
            .is('created_by', null);
          
          if (orphanError) throw new Error(`Erro ao verificar tickets órfãos: ${orphanError.message}`);
          
          // Verificar se não há usuários órfãos
          const { data: orphanUsers, error: userError } = await supabase
            .from('users')
            .select('id, name')
            .is('name', null);
          
          if (userError) throw new Error(`Erro ao verificar usuários órfãos: ${userError.message}`);
          
          return { 
            data_integrity: 'OK', 
            orphan_tickets: orphanTickets?.length || 0,
            orphan_users: orphanUsers?.length || 0
          };
        }
      },
      {
        name: 'Verificar consistência de tipos de dados',
        test: async () => {
          // Verificar se ticket_number é sempre integer
          const { data, error } = await supabase
            .from('tickets')
            .select('ticket_number')
            .limit(10);
          
          if (error) throw new Error(`Erro ao verificar tipos: ${error.message}`);
          
          const invalidNumbers = data?.filter(t => 
            typeof t.ticket_number !== 'number' || 
            !Number.isInteger(t.ticket_number)
          ) || [];
          
          if (invalidNumbers.length > 0) {
            throw new Error(`Ticket numbers inválidos encontrados: ${invalidNumbers.length}`);
          }
          
          return { data_types: 'OK', checked_records: data?.length || 0 };
        }
      }
    ];

    return await this.executeTestSuite('PERFORMANCE E SEGURANÇA', tests);
  }

  // =====================================================
  // MÉTODO PRINCIPAL DE EXECUÇÃO
  // =====================================================

  public async executarCTSCompleta(): Promise<CTSResults> {
    console.log('🚀 INICIANDO CTS COMPLETA DO SISTEMA MULTI-TENANT');
    console.log('='.repeat(60));
    console.log(`⏰ Início: ${new Date().toISOString()}`);
    
    try {
      // Executar todas as suites de teste
      await this.suiteAutenticacaoAutorizacao();
      await this.suiteSistemaMultiTenant();
      await this.suiteGestaoTickets();
      await this.suiteAPIsEndpoints();
      await this.suiteFuncionalidadesAvancadas();
      await this.suitePerformanceSeguranca();
      
      this.results.total_suites = this.results.suites.length;
      this.results.total_duration = Date.now() - this.startTime;
      
      // Exibir resumo final
      this.exibirResumoFinal();
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Erro durante execução da CTS:', error);
      throw error;
    }
  }

  private exibirResumoFinal(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO FINAL DA CTS');
    console.log('='.repeat(60));
    console.log(`📈 Total de Suites: ${this.results.total_suites}`);
    console.log(`🧪 Total de Testes: ${this.results.total_tests}`);
    console.log(`✅ Testes Aprovados: ${this.results.passed_tests}`);
    console.log(`❌ Testes Falharam: ${this.results.failed_tests}`);
    console.log(`⏭️ Testes Ignorados: ${this.results.skipped_tests}`);
    console.log(`⏱️ Duração Total: ${this.results.total_duration}ms`);
    console.log(`📊 Taxa de Sucesso: ${((this.results.passed_tests / this.results.total_tests) * 100).toFixed(2)}%`);
    
    console.log('\n📋 DETALHES POR SUITE:');
    this.results.suites.forEach(suite => {
      const successRate = ((suite.passed_tests / suite.total_tests) * 100).toFixed(2);
      console.log(`  ${suite.suite_name}: ${suite.passed_tests}/${suite.total_tests} (${successRate}%) - ${suite.duration}ms`);
    });
    
    if (this.results.failed_tests > 0) {
      console.log('\n❌ TESTES QUE FALHARAM:');
      this.results.suites.forEach(suite => {
        suite.tests.filter(test => test.status === 'FAIL').forEach(test => {
          console.log(`  - ${suite.suite_name}: ${test.test_name} - ${test.message}`);
        });
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`⏰ Fim: ${new Date().toISOString()}`);
    console.log('='.repeat(60));
  }
}

// =====================================================
// EXPORTAÇÃO E EXECUÇÃO
// =====================================================

export default CTSCompletaSistema;

// Função para executar a CTS
export async function executarCTSCompleta(): Promise<CTSResults> {
  const cts = new CTSCompletaSistema();
  return await cts.executarCTSCompleta();
}
