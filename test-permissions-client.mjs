#!/usr/bin/env node

/**
 * Script para testar permissões diretamente no Supabase
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '.env.local') })

// Configuração do Supabase
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODUxODYsImV4cCI6MjA3MjE2MTE4Nn0.ht9a6MmtkfE5hVRmwpfyMcW24a4R7n-9hoW6eYd3K2w'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Lista de todas as 24 permissões
const allPermissions = [
  // Tickets
  'tickets_view', 'tickets_create', 'tickets_edit_own', 'tickets_edit_all',
  'tickets_delete', 'tickets_assign', 'tickets_close',
  
  // Base de Conhecimento
  'kb_view', 'kb_create', 'kb_edit', 'kb_delete', 'kb_manage_categories',
  
  // Apontamentos
  'timesheets_view_own', 'timesheets_view_all', 'timesheets_create',
  'timesheets_edit_own', 'timesheets_edit_all', 'timesheets_approve', 'timesheets_analytics',
  
  // Sistema
  'system_settings', 'system_users', 'system_roles', 'system_backup', 'system_logs'
]

async function testPermissions() {
  console.log('🔍 Teste de Permissões no Supabase')
  console.log('=' .repeat(60))
  
  try {
    // 1. Buscar todas as roles
    console.log('\n📋 Buscando todas as roles...')
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('name, display_name, permissions, is_system')
      .order('name')
    
    if (rolesError) {
      console.error('❌ Erro ao buscar roles:', rolesError)
      return
    }
    
    if (!roles || roles.length === 0) {
      console.log('⚠️ Nenhuma role encontrada no banco')
      return
    }
    
    console.log(`✅ ${roles.length} roles encontradas:`)
    
    // 2. Analisar cada role
    for (const role of roles) {
      console.log('\n' + '─'.repeat(60))
      console.log(`\n🎭 Role: ${role.name} (${role.display_name})`)
      console.log(`   Sistema: ${role.is_system ? 'Sim' : 'Não'}`)
      
      if (!role.permissions) {
        console.log('   ⚠️ Sem permissões configuradas')
        continue
      }
      
      // Contar permissões ativas
      const activePermissions = allPermissions.filter(perm => role.permissions[perm])
      const inactivePermissions = allPermissions.filter(perm => !role.permissions[perm])
      
      console.log(`\n   📊 Estatísticas:`)
      console.log(`   • Total: ${allPermissions.length} permissões`)
      console.log(`   • Ativas: ${activePermissions.length} (${Math.round(activePermissions.length / allPermissions.length * 100)}%)`)
      console.log(`   • Inativas: ${inactivePermissions.length} (${Math.round(inactivePermissions.length / allPermissions.length * 100)}%)`)
      
      // Mostrar permissões por categoria
      console.log(`\n   ✅ Permissões ATIVAS:`)
      
      const categories = {
        'Tickets': activePermissions.filter(p => p.startsWith('tickets_')),
        'Base de Conhecimento': activePermissions.filter(p => p.startsWith('kb_')),
        'Apontamentos': activePermissions.filter(p => p.startsWith('timesheets_')),
        'Sistema': activePermissions.filter(p => p.startsWith('system_'))
      }
      
      for (const [cat, perms] of Object.entries(categories)) {
        if (perms.length > 0) {
          console.log(`      ${cat}: ${perms.join(', ')}`)
        }
      }
      
      // Verificar permissões específicas importantes
      console.log(`\n   🔑 Permissões Chave:`)
      console.log(`      • Atribuir Tickets: ${role.permissions.tickets_assign ? '✅' : '❌'}`)
      console.log(`      • Editar Todos os Tickets: ${role.permissions.tickets_edit_all ? '✅' : '❌'}`)
      console.log(`      • Excluir Tickets: ${role.permissions.tickets_delete ? '✅' : '❌'}`)
      console.log(`      • Gerenciar Usuários: ${role.permissions.system_users ? '✅' : '❌'}`)
      console.log(`      • Gerenciar Perfis: ${role.permissions.system_roles ? '✅' : '❌'}`)
    }
    
    // 3. Verificar especificamente a role N1
    console.log('\n' + '=' .repeat(60))
    console.log('\n🔎 Verificação específica da role N1:')
    
    const n1Role = roles.find(r => r.name === 'n1')
    if (n1Role) {
      console.log('✅ Role N1 encontrada!')
      console.log('\nPermissões configuradas:')
      for (const perm of allPermissions) {
        const status = n1Role.permissions && n1Role.permissions[perm] ? '✅' : '❌'
        console.log(`   ${status} ${perm}`)
      }
    } else {
      console.log('❌ Role N1 não encontrada no banco')
    }
    
    // 4. Verificar políticas RLS
    console.log('\n' + '=' .repeat(60))
    console.log('\n🔒 Status do RLS:')
    
    // Tentar fazer um select simples
    const { count, error: countError } = await supabase
      .from('roles')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.log('❌ Erro ao verificar acesso:', countError.message)
    } else {
      console.log(`✅ Acesso OK - ${count} roles acessíveis`)
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log('✅ Teste concluído!')
}

// Executar teste
testPermissions().catch(console.error)