#!/usr/bin/env node

/**
 * Script para diagnosticar o problema dos responsáveis nos tickets
 */

import axios from 'axios'

const BASE_URL = 'https://www.ithostbr.tech'

async function testAPI(endpoint, description) {
  console.log(`\n🔍 Testando: ${description}`)
  console.log(`📡 Endpoint: ${endpoint}`)
  
  try {
    const response = await axios.get(endpoint, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DiagnosticTool/1.0)'
      }
    })
    
    console.log(`✅ Status: ${response.status}`)
    console.log(`📊 Dados retornados:`, typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data)
    
    if (Array.isArray(response.data)) {
      console.log(`📈 Número de itens: ${response.data.length}`)
    }
    
    return response.data
  } catch (error) {
    console.log(`❌ Erro: ${error.response?.status || 'Network Error'}`)
    console.log(`❌ Mensagem: ${error.response?.data?.error || error.message}`)
    return null
  }
}

async function runDiagnostic() {
  console.log('🚀 DIAGNÓSTICO: Problema dos Responsáveis nos Tickets')
  console.log('=' * 60)
  
  // 1. Testar API de usuários padrão
  await testAPI(`${BASE_URL}/api/users`, 'API de Usuários (padrão)')
  
  // 2. Testar API de usuários com permissão
  await testAPI(`${BASE_URL}/api/users/with-permission?permission=tickets_assign`, 'API de Usuários com Permissão tickets_assign')
  
  // 3. Testar outras permissões
  await testAPI(`${BASE_URL}/api/users/with-permission?permission=tickets_view`, 'API de Usuários com Permissão tickets_view')
  
  // 4. Testar API de roles
  await testAPI(`${BASE_URL}/api/roles`, 'API de Roles/Permissões')
  
  // 5. Testar API de tickets
  await testAPI(`${BASE_URL}/api/tickets`, 'API de Tickets')
  
  console.log('\n📋 RESUMO DO DIAGNÓSTICO:')
  console.log('=' * 40)
  console.log('1. Se /api/users retornar dados → Problema nas permissões')
  console.log('2. Se /api/users falhar → Problema na configuração do banco')
  console.log('3. Se /api/users/with-permission retornar [] → Problema na lógica de filtro')
  console.log('4. Se /api/roles falhar → Problema na tabela de roles')
  console.log('\n💡 POSSÍVEIS SOLUÇÕES:')
  console.log('🔧 Verificar variáveis de ambiente do Supabase')
  console.log('🔧 Verificar estrutura das tabelas users e roles')
  console.log('🔧 Verificar função getUsersWithPermission')
  console.log('🔧 Verificar se há usuários com role admin/analyst')
}

// Executar diagnóstico
runDiagnostic().catch(console.error)

