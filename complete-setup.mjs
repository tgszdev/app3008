#!/usr/bin/env node

/**
 * SETUP COMPLETO MULTI-TENANT
 * ===========================
 * 
 * Este script executa:
 * 1. Cria as tabelas multi-tenant
 * 2. Migra usuários existentes
 * 3. Configura relacionamentos
 * 4. Testa a implementação
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' })

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

function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const icons = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    step: '🔄'
  }
  console.log(`${icons[type]} [${timestamp}] ${message}`)
}

async function createTables() {
  log('Criando tabelas multi-tenant...', 'step')
  
  // Como não podemos executar SQL diretamente via API,
  // vamos mostrar as instruções
  console.log('\n📋 INSTRUÇÕES PARA CRIAR TABELAS:')
  console.log('1. Acesse: https://supabase.com/dashboard/project/eyfvvximmeqmwdfqzqov')
  console.log('2. Vá em SQL Editor')
  console.log('3. Execute o conteúdo do arquivo: multi-tenant-hybrid-schema.sql')
  console.log('4. Pressione Enter para continuar após executar...')
  
  // Aguardar confirmação do usuário
  return new Promise((resolve) => {
    process.stdin.once('data', () => {
      resolve(true)
    })
  })
}

async function testTables() {
  log('Testando tabelas criadas...', 'step')
  
  const tables = ['contexts', 'matrix_users', 'context_users', 'matrix_user_contexts']
  const results = {}
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1)
      if (error) {
        results[table] = false
        log(`❌ Tabela ${table} não existe`, 'error')
      } else {
        results[table] = true
        log(`✅ Tabela ${table} existe`, 'success')
      }
    } catch (err) {
      results[table] = false
      log(`❌ Erro ao testar ${table}: ${err.message}`, 'error')
    }
  }
  
  return results
}

async function completeSetup() {
  console.log('🚀 INICIANDO SETUP COMPLETO MULTI-TENANT\n')
  
  try {
    // 1. Criar tabelas
    await createTables()
    
    // 2. Testar tabelas
    const tableResults = await testTables()
    
    const allTablesExist = Object.values(tableResults).every(exists => exists)
    
    if (!allTablesExist) {
      log('❌ Nem todas as tabelas foram criadas. Execute o SQL no Supabase Dashboard primeiro.', 'error')
      return
    }
    
    // 3. Executar migração
    log('Executando migração de usuários...', 'step')
    
    // Importar e executar a migração
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    try {
      const { stdout, stderr } = await execAsync('node migrate-existing-users.mjs')
      console.log(stdout)
      if (stderr) console.error(stderr)
    } catch (error) {
      log(`Erro na migração: ${error.message}`, 'error')
    }
    
    // 4. Teste final
    log('Executando teste final...', 'step')
    
    try {
      const { stdout, stderr } = await execAsync('node analyze-database.mjs')
      console.log(stdout)
      if (stderr) console.error(stderr)
    } catch (error) {
      log(`Erro no teste: ${error.message}`, 'error')
    }
    
    console.log('\n🎉 SETUP COMPLETO FINALIZADO!')
    
  } catch (error) {
    log(`Erro crítico: ${error.message}`, 'error')
    console.error(error)
  }
}

// Executar setup completo
completeSetup()
