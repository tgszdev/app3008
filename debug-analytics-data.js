#!/usr/bin/env node

const http = require('http');

console.log('🔍 Debug: Analisando dados dos gráficos na página Analytics\n');

// Função para fazer requisição HTTP
function makeRequest(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Analytics-Debug',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// Testes
async function runTests() {
  console.log('1️⃣ Verificando se o servidor está rodando...');
  
  try {
    const homeResponse = await makeRequest('/');
    if (homeResponse.status === 200 || homeResponse.status === 307) {
      console.log('✅ Servidor está rodando\n');
    } else {
      console.log('❌ Servidor retornou status:', homeResponse.status);
      return;
    }
  } catch (error) {
    console.log('❌ Erro ao conectar ao servidor:', error.message);
    console.log('💡 Certifique-se de que o servidor está rodando na porta 3000');
    return;
  }

  console.log('2️⃣ Testando API /api/dashboard/analytics...');
  
  try {
    const analyticsResponse = await makeRequest('/api/dashboard/analytics?range=30days');
    
    console.log('📊 Status:', analyticsResponse.status);
    console.log('📊 Content-Type:', analyticsResponse.headers['content-type']);
    
    if (analyticsResponse.status === 200) {
      console.log('✅ API Analytics respondeu com sucesso');
      
      const data = analyticsResponse.data;
      console.log('\n📈 Dados retornados:');
      console.log('- overview:', data.overview ? '✅ Presente' : '❌ Ausente');
      console.log('- ticketsByStatus:', data.ticketsByStatus ? '✅ Presente' : '❌ Ausente');
      console.log('- ticketsByStatusDetailed:', data.ticketsByStatusDetailed ? '✅ Presente' : '❌ Ausente');
      console.log('- ticketsByPriority:', data.ticketsByPriority ? '✅ Presente' : '❌ Ausente');
      console.log('- ticketsByCategory:', data.ticketsByCategory ? '✅ Presente' : '❌ Ausente');
      console.log('- ticketsTrend:', data.ticketsTrend ? '✅ Presente' : '❌ Ausente');
      console.log('- peakHours:', data.peakHours ? '✅ Presente' : '❌ Ausente');
      console.log('- userActivity:', data.userActivity ? '✅ Presente' : '❌ Ausente');
      console.log('- performanceMetrics:', data.performanceMetrics ? '✅ Presente' : '❌ Ausente');
      
      if (data.overview) {
        console.log('\n📊 Overview detalhado:');
        console.log('- totalTickets:', data.overview.totalTickets);
        console.log('- avgResolutionTime:', data.overview.avgResolutionTime);
        console.log('- satisfactionRate:', data.overview.satisfactionRate);
        console.log('- activeUsers:', data.overview.activeUsers);
      }
      
      if (data.ticketsTrend && data.ticketsTrend.length > 0) {
        console.log('\n📈 Tickets Trend (primeiros 3):');
        data.ticketsTrend.slice(0, 3).forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.date}: ${item.count} tickets`);
        });
      } else {
        console.log('⚠️  Tickets Trend vazio ou ausente');
      }
      
    } else if (analyticsResponse.status === 401) {
      console.log('⚠️  Não autenticado (esperado sem login)');
    } else {
      console.log('❌ Status inesperado:', analyticsResponse.status);
      console.log('Resposta:', analyticsResponse.data);
    }
    
  } catch (error) {
    console.log('❌ Erro ao testar API Analytics:', error.message);
  }

  console.log('\n3️⃣ Testando API /api/dashboard/multi-client-analytics...');
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const multiClientResponse = await makeRequest(
      `/api/dashboard/multi-client-analytics?start_date=${thirtyDaysAgo}&end_date=${today}&context_ids=test`
    );
    
    console.log('📊 Status:', multiClientResponse.status);
    console.log('📊 Content-Type:', multiClientResponse.headers['content-type']);
    
    if (multiClientResponse.status === 200) {
      console.log('✅ API Multi-client respondeu com sucesso');
      
      const data = multiClientResponse.data;
      console.log('\n📈 Dados retornados:');
      console.log('- clients:', data.clients ? '✅ Presente' : '❌ Ausente');
      console.log('- consolidated:', data.consolidated ? '✅ Presente' : '❌ Ausente');
      
      if (data.consolidated) {
        console.log('\n📊 Consolidated detalhado:');
        console.log('- total_tickets:', data.consolidated.total_tickets);
        console.log('- avg_resolution_time:', data.consolidated.avg_resolution_time);
        console.log('- status_distribution:', data.consolidated.status_distribution ? '✅ Presente' : '❌ Ausente');
        console.log('- priority_distribution:', data.consolidated.priority_distribution ? '✅ Presente' : '❌ Ausente');
        console.log('- category_distribution:', data.consolidated.category_distribution ? '✅ Presente' : '❌ Ausente');
        console.log('- tickets_trend:', data.consolidated.tickets_trend ? '✅ Presente' : '❌ Ausente');
      }
      
    } else if (multiClientResponse.status === 401) {
      console.log('⚠️  Não autenticado (esperado sem login)');
    } else {
      console.log('❌ Status inesperado:', multiClientResponse.status);
      console.log('Resposta:', multiClientResponse.data);
    }
    
  } catch (error) {
    console.log('❌ Erro ao testar API Multi-client:', error.message);
  }

  console.log('\n4️⃣ Análise da lógica de carregamento:');
  console.log('📋 Problemas potenciais identificados:');
  console.log('1. Usuários Matrix: só carregam dados se selectedClients.length > 0');
  console.log('2. Usuários Context: carregam dados automaticamente');
  console.log('3. APIs podem estar retornando dados vazios');
  console.log('4. Lógica de isMultiClient pode estar incorreta');
  console.log('5. Dados podem não estar sendo mapeados corretamente para os gráficos');

  console.log('\n🎯 Próximos passos:');
  console.log('1. Verificar se o usuário está logado');
  console.log('2. Verificar se selectedClients está sendo carregado do localStorage');
  console.log('3. Verificar se as APIs estão retornando dados válidos');
  console.log('4. Verificar se os dados estão sendo mapeados corretamente');
  console.log('5. Adicionar logs de debug na página');
}

// Executar testes
runTests().catch(console.error);
