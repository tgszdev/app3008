#!/usr/bin/env node

/**
 * Script para testar e diagnosticar o problema com a role N1
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Teste de Diagnóstico da Role N1')
console.log('=' .repeat(50))

// Verificar configuração
console.log('\n📋 Verificando configuração:')
console.log('- SUPABASE_URL:', supabaseUrl ? '✅ Configurado' : '❌ Faltando')
console.log('- ANON_KEY:', supabaseAnonKey ? '✅ Configurado' : '❌ Faltando')
console.log('- SERVICE_KEY:', supabaseServiceKey ? '✅ Configurado' : '❌ Faltando')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ Erro: Configuração do Supabase incompleta!')
  console.error('Configure as variáveis em .env.local')
  process.exit(1)
}

// Criar clientes
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

async function testRoleAccess() {
  console.log('\n🧪 Testando acesso à tabela roles...')
  
  // Teste 1: Com cliente anônimo
  console.log('\n1️⃣ Teste com cliente ANON (sujeito a RLS):')
  try {
    const { data, error } = await supabaseAnon
      .from('roles')
      .select('name, display_name, permissions')
      .eq('name', 'n1')
      .single()
    
    if (error) {
      console.log('❌ Erro com cliente ANON:', error.message)
      console.log('   Código:', error.code)
      console.log('   Detalhes:', error.details)
      
      if (error.code === 'PGRST116') {
        console.log('   ⚠️ Erro 406/PGRST116: Nenhuma linha encontrada (pode ser RLS)')
      }
    } else {
      console.log('✅ Sucesso com cliente ANON!')
      console.log('   Role encontrada:', data?.name)
      console.log('   Display name:', data?.display_name)
    }
  } catch (err) {
    console.error('❌ Erro inesperado:', err)
  }
  
  // Teste 2: Com cliente admin (se disponível)
  if (supabaseAdmin) {
    console.log('\n2️⃣ Teste com cliente ADMIN (ignora RLS):')
    try {
      const { data, error } = await supabaseAdmin
        .from('roles')
        .select('name, display_name, permissions')
        .eq('name', 'n1')
        .single()
      
      if (error) {
        console.log('❌ Erro com cliente ADMIN:', error.message)
        console.log('   Código:', error.code)
        console.log('   Detalhes:', error.details)
      } else {
        console.log('✅ Sucesso com cliente ADMIN!')
        console.log('   Role encontrada:', data?.name)
        console.log('   Display name:', data?.display_name)
        console.log('   Tem permissões?', data?.permissions ? 'Sim' : 'Não')
      }
    } catch (err) {
      console.error('❌ Erro inesperado:', err)
    }
  } else {
    console.log('\n⚠️ Cliente ADMIN não disponível (SERVICE_KEY não configurada)')
  }
  
  // Teste 3: Listar todas as roles
  console.log('\n3️⃣ Listando TODAS as roles (com cliente ANON):')
  try {
    const { data, error } = await supabaseAnon
      .from('roles')
      .select('name, display_name, is_system')
      .order('name')
    
    if (error) {
      console.log('❌ Erro ao listar roles:', error.message)
    } else if (data && data.length > 0) {
      console.log('✅ Roles encontradas:')
      data.forEach(role => {
        console.log(`   - ${role.name} (${role.display_name}) ${role.is_system ? '[SISTEMA]' : '[CUSTOM]'}`)
      })
    } else {
      console.log('⚠️ Nenhuma role encontrada (possível problema de RLS)')
    }
  } catch (err) {
    console.error('❌ Erro inesperado:', err)
  }
  
  // Teste 4: Listar todas as roles com admin
  if (supabaseAdmin) {
    console.log('\n4️⃣ Listando TODAS as roles (com cliente ADMIN):')
    try {
      const { data, error } = await supabaseAdmin
        .from('roles')
        .select('name, display_name, is_system')
        .order('name')
      
      if (error) {
        console.log('❌ Erro ao listar roles:', error.message)
      } else if (data && data.length > 0) {
        console.log('✅ Roles encontradas:')
        data.forEach(role => {
          console.log(`   - ${role.name} (${role.display_name}) ${role.is_system ? '[SISTEMA]' : '[CUSTOM]'}`)
        })
      } else {
        console.log('⚠️ Nenhuma role encontrada no banco')
      }
    } catch (err) {
      console.error('❌ Erro inesperado:', err)
    }
  }
}

// Executar testes
console.log('\n🚀 Iniciando testes...')
testRoleAccess().then(() => {
  console.log('\n' + '=' .repeat(50))
  console.log('✅ Testes concluídos!')
  console.log('\n📝 DIAGNÓSTICO:')
  console.log('Se o cliente ANON falha mas o ADMIN funciona:')
  console.log('  → Problema de RLS (Row Level Security)')
  console.log('  → Execute o script SQL: sql/fix_roles_rls_406.sql')
  console.log('\nSe ambos falham:')
  console.log('  → Verifique se a role n1 realmente existe no banco')
  console.log('  → Verifique as credenciais do Supabase')
  console.log('\nSe o SERVICE_KEY não está configurado:')
  console.log('  → Configure SUPABASE_SERVICE_ROLE_KEY no .env.local')
  console.log('  → Pegue a chave em: Supabase Dashboard > Settings > API')
}).catch(console.error)