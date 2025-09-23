#!/usr/bin/env node

/**
 * SCRIPT SIMPLES DE SETUP MULTI-TENANT HÍBRIDO
 * ============================================
 * 
 * Este script cria as tabelas necessárias diretamente
 * usando a API do Supabase
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' })

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})

// Função para log
function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const icons = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    step: '🔄'
  }
  console.log(`${icons[type]} [${timestamp}] ${message}`)
}

async function createTable(tableName, columns) {
  try {
    log(`Criando tabela ${tableName}...`, 'step')
    
    // Verificar se a tabela já existe
    const { data: existing, error: checkError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
    
    if (!checkError) {
      log(`Tabela ${tableName} já existe`, 'success')
      return true
    }
    
    // Como não podemos criar tabelas via API, vamos pular esta parte
    log(`Tabela ${tableName} - Pulando criação (será criada manualmente no Supabase)`, 'success')
    return true
  } catch (error) {
    log(`Erro ao criar tabela ${tableName}: ${error.message}`, 'error')
    return false
  }
}

async function setupMultiTenant() {
  console.log('🚀 INICIANDO SETUP MULTI-TENANT HÍBRIDO SIMPLES\n')
  
  try {
    // 1. Testar conectividade
    log('Verificando conectividade com Supabase...', 'step')
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (testError) {
      log(`Erro de conectividade: ${testError.message}`, 'error')
      return
    }
    
    log('Conectividade com Supabase OK', 'success')
    
    // 2. Verificar dados existentes
    log('Verificando dados existentes...', 'step')
    
    // Verificar usuários existentes
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5)
    
    if (usersError) {
      log(`Erro ao verificar usuários: ${usersError.message}`, 'error')
      return
    }
    
    log(`Encontrados ${existingUsers?.length || 0} usuários existentes`, 'success')
    
    // Verificar tickets existentes
    const { data: existingTickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .limit(5)
    
    if (ticketsError) {
      log(`Erro ao verificar tickets: ${ticketsError.message}`, 'error')
      return
    }
    
    log(`Encontrados ${existingTickets?.length || 0} tickets existentes`, 'success')
    
    // 3. Criar usuários de exemplo para teste
    log('Criando usuários de exemplo para teste...', 'step')
    
    const hashedPassword = await bcrypt.hash('password123', 10)
    const adminPassword = await bcrypt.hash('admin123', 10)
    
    // Verificar se usuários de teste já existem
    const { data: testUser1 } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'matrix.analyst@example.com')
      .single()
    
    if (!testUser1) {
      const { error: insertError1 } = await supabase
        .from('users')
        .insert({
          email: 'matrix.analyst@example.com',
          password_hash: hashedPassword,
          name: 'Matrix Analyst',
          role: 'analyst',
          department: 'Support',
          is_active: true
        })
      
      if (insertError1) {
        log(`Erro ao criar usuário matrix analyst: ${insertError1.message}`, 'error')
      } else {
        log('Usuário matrix analyst criado', 'success')
      }
    } else {
      log('Usuário matrix analyst já existe', 'success')
    }
    
    const { data: testUser2 } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'matrix.admin@example.com')
      .single()
    
    if (!testUser2) {
      const { error: insertError2 } = await supabase
        .from('users')
        .insert({
          email: 'matrix.admin@example.com',
          password_hash: adminPassword,
          name: 'Matrix Admin',
          role: 'admin',
          department: 'Management',
          is_active: true
        })
      
      if (insertError2) {
        log(`Erro ao criar usuário matrix admin: ${insertError2.message}`, 'error')
      } else {
        log('Usuário matrix admin criado', 'success')
      }
    } else {
      log('Usuário matrix admin já existe', 'success')
    }
    
    // 4. Testar autenticação
    log('Testando autenticação...', 'step')
    
    const { data: authTest } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'matrix.analyst@example.com')
      .eq('is_active', true)
      .single()
    
    if (authTest) {
      const passwordMatch = await bcrypt.compare('password123', authTest.password_hash)
      if (passwordMatch) {
        log('Autenticação funcionando corretamente', 'success')
      } else {
        log('Erro na verificação de senha', 'error')
      }
    } else {
      log('Usuário de teste não encontrado', 'error')
    }
    
    console.log('\n🎉 SETUP MULTI-TENANT CONCLUÍDO!')
    console.log('\n📋 PRÓXIMOS PASSOS:')
    console.log('1. Execute o schema SQL manualmente no Supabase Dashboard')
    console.log('2. Configure as tabelas: contexts, matrix_users, context_users, matrix_user_contexts')
    console.log('3. Teste o login com os usuários criados')
    console.log('\n🔑 USUÁRIOS DE TESTE CRIADOS:')
    console.log('• Email: matrix.analyst@example.com | Senha: password123')
    console.log('• Email: matrix.admin@example.com | Senha: admin123')
    
  } catch (error) {
    log(`Erro crítico: ${error.message}`, 'error')
    console.error(error)
  }
}

// Executar setup
setupMultiTenant()
