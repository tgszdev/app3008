#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase (use suas credenciais)
const supabaseUrl = 'https://hbqplzrdkevikmpgmjiq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhicXBsenJka2V2aWttcGdtamlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTQwMzE1OSwiZXhwIjoyMDQwOTc5MTU5fQ.fPqMKHywzwz-Mc0T5RLp36e2RJAjCfvzn1OLKwMdMhY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateRoles() {
  try {
    console.log('🔄 Iniciando migração dos perfis...')
    
    // 1. Buscar todos os perfis existentes
    const { data: roles, error: fetchError } = await supabase
      .from('roles')
      .select('*')
    
    if (fetchError) {
      console.error('❌ Erro ao buscar perfis:', fetchError)
      return
    }
    
    if (!roles || roles.length === 0) {
      console.log('📭 Nenhum perfil encontrado para migrar')
      return
    }
    
    console.log(`📋 Encontrados ${roles.length} perfis para migrar`)
    
    // 2. Migrar cada perfil
    for (const role of roles) {
      console.log(`🔧 Migrando perfil: ${role.display_name} (${role.name})`)
      
      // Verificar se já tem a permissão
      if (role.permissions?.tickets_change_priority !== undefined) {
        console.log(`  ✅ Perfil ${role.display_name} já tem tickets_change_priority`)
        continue
      }
      
      // Definir valor padrão baseado no tipo de perfil
      let canChangePriority = false
      
      // Admin, Developer, Analyst podem alterar prioridade
      if (['admin', 'developer', 'analyst'].includes(role.name)) {
        canChangePriority = true
      }
      
      // Atualizar o perfil
      const updatedPermissions = {
        ...role.permissions,
        tickets_change_priority: canChangePriority
      }
      
      const { error: updateError } = await supabase
        .from('roles')
        .update({
          permissions: updatedPermissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', role.id)
      
      if (updateError) {
        console.error(`  ❌ Erro ao atualizar ${role.display_name}:`, updateError)
      } else {
        console.log(`  ✅ ${role.display_name}: tickets_change_priority = ${canChangePriority}`)
      }
    }
    
    console.log('\n🎉 Migração concluída!')
    console.log('\n📝 Resumo da migração:')
    console.log('✅ Admin: tickets_change_priority = true')
    console.log('✅ Developer: tickets_change_priority = true') 
    console.log('✅ Analyst: tickets_change_priority = true')
    console.log('✅ User e outros: tickets_change_priority = false')
    console.log('\n🔄 Agora recarregue a página de gerenciamento de perfis!')
    
  } catch (error) {
    console.error('💥 Erro durante a migração:', error)
  }
}

// Executar migração
migrateRoles()
