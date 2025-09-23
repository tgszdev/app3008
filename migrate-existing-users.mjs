#!/usr/bin/env node

/**
 * MIGRAÇÃO DE USUÁRIOS EXISTENTES PARA MULTI-TENANT
 * =================================================
 * 
 * Este script:
 * 1. Migra usuários admin/analyst existentes para matrix_users
 * 2. Migra usuários user existentes para context_users
 * 3. Cria contexto padrão para usuários migrados
 * 4. Preserva todos os dados existentes
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
    warning: '⚠️',
    step: '🔄'
  }
  console.log(`${icons[type]} [${timestamp}] ${message}`)
}

async function migrateUsers() {
  console.log('🚀 INICIANDO MIGRAÇÃO DE USUÁRIOS EXISTENTES\n')
  
  try {
    // 1. Buscar todos os usuários existentes
    log('1. Buscando usuários existentes...', 'step')
    
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (usersError) {
      log(`Erro ao buscar usuários: ${usersError.message}`, 'error')
      return
    }
    
    log(`Encontrados ${existingUsers?.length || 0} usuários para migração`, 'success')
    
    if (!existingUsers || existingUsers.length === 0) {
      log('Nenhum usuário encontrado para migração', 'warning')
      return
    }
    
    // 2. Verificar se as tabelas multi-tenant existem
    log('2. Verificando tabelas multi-tenant...', 'step')
    
    const { data: contextsCheck } = await supabase.from('contexts').select('id').limit(1)
    const { data: matrixUsersCheck } = await supabase.from('matrix_users').select('id').limit(1)
    const { data: contextUsersCheck } = await supabase.from('context_users').select('id').limit(1)
    
    if (!contextsCheck) {
      log('❌ Tabela contexts não existe. Execute o schema multi-tenant primeiro!', 'error')
      console.log('\n📋 INSTRUÇÕES:')
      console.log('1. Acesse o Supabase Dashboard')
      console.log('2. Vá em SQL Editor')
      console.log('3. Execute o conteúdo do arquivo: multi-tenant-hybrid-schema.sql')
      console.log('4. Execute este script novamente')
      return
    }
    
    log('✅ Tabelas multi-tenant existem', 'success')
    
    // 3. Criar contexto padrão se não existir
    log('3. Verificando contexto padrão...', 'step')
    
    let defaultContextId = null
    const { data: defaultContext } = await supabase
      .from('contexts')
      .select('id')
      .eq('slug', 'default-organization')
      .single()
    
    if (defaultContext) {
      defaultContextId = defaultContext.id
      log('✅ Contexto padrão já existe', 'success')
    } else {
      // Criar contexto padrão
      const { data: newContext, error: contextError } = await supabase
        .from('contexts')
        .insert({
          name: 'Organização Padrão',
          slug: 'default-organization',
          type: 'organization',
          settings: { description: 'Contexto padrão para usuários migrados' },
          sla_hours: 24,
          is_active: true
        })
        .select('id')
        .single()
      
      if (contextError) {
        log(`Erro ao criar contexto padrão: ${contextError.message}`, 'error')
        return
      }
      
      defaultContextId = newContext.id
      log('✅ Contexto padrão criado', 'success')
    }
    
    // 4. Migrar usuários
    log('4. Iniciando migração de usuários...', 'step')
    
    let matrixUsersCreated = 0
    let contextUsersCreated = 0
    let errors = 0
    
    for (const user of existingUsers) {
      try {
        // Verificar se já foi migrado
        const { data: existingMatrix } = await supabase
          .from('matrix_users')
          .select('id')
          .eq('email', user.email)
          .single()
        
        const { data: existingContext } = await supabase
          .from('context_users')
          .select('id')
          .eq('email', user.email)
          .single()
        
        if (existingMatrix || existingContext) {
          log(`Usuário ${user.email} já foi migrado`, 'info')
          continue
        }
        
        // Decidir tipo de usuário baseado no role
        const isMatrixUser = ['admin', 'analyst', 'developer', 'dev', 'n2'].includes(user.role)
        
        if (isMatrixUser) {
          // Migrar para matrix_users
          const { error: insertError } = await supabase
            .from('matrix_users')
            .insert({
              id: user.id, // Manter ID original
              email: user.email,
              password_hash: user.password_hash,
              name: user.name,
              role: user.role,
              department: user.department,
              phone: user.phone,
              avatar_url: user.avatar_url,
              is_active: user.is_active,
              last_login: user.last_login,
              created_at: user.created_at,
              updated_at: user.updated_at
            })
          
          if (insertError) {
            log(`Erro ao migrar ${user.email} para matrix_users: ${insertError.message}`, 'error')
            errors++
          } else {
            log(`✅ ${user.email} migrado para matrix_users`, 'success')
            matrixUsersCreated++
          }
        } else {
          // Migrar para context_users
          const { error: insertError } = await supabase
            .from('context_users')
            .insert({
              id: user.id, // Manter ID original
              context_id: defaultContextId,
              email: user.email,
              password_hash: user.password_hash,
              name: user.name,
              role: user.role,
              department: user.department,
              phone: user.phone,
              avatar_url: user.avatar_url,
              is_active: user.is_active,
              last_login: user.last_login,
              created_at: user.created_at,
              updated_at: user.updated_at
            })
          
          if (insertError) {
            log(`Erro ao migrar ${user.email} para context_users: ${insertError.message}`, 'error')
            errors++
          } else {
            log(`✅ ${user.email} migrado para context_users`, 'success')
            contextUsersCreated++
          }
        }
      } catch (error) {
        log(`Erro ao processar usuário ${user.email}: ${error.message}`, 'error')
        errors++
      }
    }
    
    // 5. Atribuir matrix users ao contexto padrão
    if (matrixUsersCreated > 0) {
      log('5. Atribuindo usuários matriz ao contexto padrão...', 'step')
      
      const { data: matrixUsers } = await supabase
        .from('matrix_users')
        .select('id')
      
      if (matrixUsers) {
        const assignments = matrixUsers.map(mu => ({
          matrix_user_id: mu.id,
          context_id: defaultContextId,
          can_manage: false
        }))
        
        const { error: assignmentError } = await supabase
          .from('matrix_user_contexts')
          .insert(assignments)
        
        if (assignmentError) {
          log(`Erro ao atribuir usuários matriz: ${assignmentError.message}`, 'error')
        } else {
          log(`✅ ${matrixUsers.length} usuários matriz atribuídos ao contexto`, 'success')
        }
      }
    }
    
    // 6. Relatório final
    console.log('\n📊 RELATÓRIO DE MIGRAÇÃO:')
    console.log('=' * 50)
    console.log(`✅ Usuários matriz criados: ${matrixUsersCreated}`)
    console.log(`✅ Usuários contexto criados: ${contextUsersCreated}`)
    console.log(`❌ Erros encontrados: ${errors}`)
    console.log(`📋 Total processado: ${existingUsers.length}`)
    
    if (errors === 0) {
      console.log('\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!')
      console.log('\n📋 PRÓXIMOS PASSOS:')
      console.log('1. Teste o login com os usuários migrados')
      console.log('2. Verifique se o dashboard está funcionando')
      console.log('3. Teste a troca de contexto (se aplicável)')
    } else {
      console.log('\n⚠️ MIGRAÇÃO CONCLUÍDA COM ALGUNS ERROS')
      console.log('Verifique os logs acima para detalhes dos erros')
    }
    
  } catch (error) {
    log(`Erro crítico na migração: ${error.message}`, 'error')
    console.error(error)
  }
}

// Executar migração
migrateUsers()
