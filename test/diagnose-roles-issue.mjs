#!/usr/bin/env node
/**
 * DIAGNÓSTICO: Por que perfis estão mockados?
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

console.log('╔════════════════════════════════════════════════════════════════╗')
console.log('║          DIAGNÓSTICO: Perfis Mockados                         ║')
console.log('╚════════════════════════════════════════════════════════════════╝\n')

async function diagnose() {
  console.log('1️⃣ Verificando se tabela "roles" existe...\n')
  
  try {
    const { data, error, count } = await supabase
      .from('roles')
      .select('*', { count: 'exact' })
    
    if (error) {
      if (error.code === '42P01') {
        console.log('❌ PROBLEMA ENCONTRADO: Tabela "roles" NÃO EXISTE!')
        console.log('\n📋 SOLUÇÃO: Execute este SQL no Supabase:\n')
        console.log('```sql')
        console.log(`CREATE TABLE IF NOT EXISTS roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir perfis padrão
INSERT INTO roles (name, display_name, description, permissions, is_system)
VALUES
  ('admin', 'Administrador', 'Acesso total ao sistema', '{}', true),
  ('dev', 'Desenvolvedor', 'Desenvolvimento e correções', '{}', true),
  ('analyst', 'Analista', 'Gerenciamento de tickets', '{}', true),
  ('user', 'Usuário', 'Acesso básico', '{}', true)
ON CONFLICT (name) DO NOTHING;
`)
        console.log('```\n')
        return
      }
      
      console.log('❌ ERRO ao buscar perfis:', error.message)
      console.log('Detalhes:', error)
      return
    }
    
    if (!data || data.length === 0) {
      console.log('⚠️  Tabela existe mas está VAZIA!')
      console.log('\n📋 SOLUÇÃO: Execute este SQL no Supabase:\n')
      console.log('```sql')
      console.log(`INSERT INTO roles (name, display_name, description, permissions, is_system)
VALUES
  ('admin', 'Administrador', 'Acesso total ao sistema', '{}', true),
  ('dev', 'Desenvolvedor', 'Desenvolvimento e correções', '{}', true),
  ('analyst', 'Analista', 'Gerenciamento de tickets', '{}', true),
  ('user', 'Usuário', 'Acesso básico', '{}', true)
ON CONFLICT (name) DO NOTHING;
`)
      console.log('```\n')
      return
    }
    
    console.log(`✅ Tabela "roles" existe e tem ${count} perfis!\n`)
    
    console.log('2️⃣ Perfis encontrados no banco:\n')
    data.forEach((role, i) => {
      console.log(`${i + 1}. ${role.display_name} (${role.name})`)
      console.log(`   ID: ${role.id}`)
      console.log(`   Sistema: ${role.is_system ? 'Sim' : 'Não'}`)
      console.log(`   Permissões: ${Object.keys(role.permissions).length} configuradas`)
      console.log('')
    })
    
    console.log('3️⃣ Verificando API /api/roles...\n')
    
    try {
      const apiResponse = await fetch(`${SUPABASE_URL.replace('/rest/v1', '')}/api/roles`, {
        headers: {
          'Cookie': `next-auth.session-token=test` // Mock para teste
        }
      })
      
      console.log(`   Status: ${apiResponse.status} ${apiResponse.statusText}`)
      
      if (!apiResponse.ok) {
        console.log('   ❌ API retornou erro!')
        const text = await apiResponse.text()
        console.log('   Resposta:', text.substring(0, 200))
      } else {
        const apiData = await apiResponse.json()
        console.log(`   ✅ API retornou ${apiData.length} perfis`)
      }
    } catch (apiError) {
      console.log('   ⚠️  Não foi possível testar API (normal em dev local)')
    }
    
    console.log('\n' + '='.repeat(70))
    console.log('✅ DIAGNÓSTICO COMPLETO')
    console.log('='.repeat(70))
    console.log('\nCONCLUSÃO:')
    console.log(`- Perfis no banco: ${count}`)
    console.log('- Problema: Frontend usa dados mockados quando API falha')
    console.log('- Solução: Corrigir API para retornar dados do banco')
    console.log('')
    
  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error)
  }
}

diagnose()

