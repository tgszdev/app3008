#!/usr/bin/env node

/**
 * TESTE DE LOGIN
 * ==============
 * 
 * Este script testa:
 * 1. Login do usuário rodrigues2205@icloud.com
 * 2. Verifica permissões
 * 3. Simula autenticação
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

async function testLogin() {
  console.log('🧪 TESTANDO LOGIN DO USUÁRIO\n')
  
  const userEmail = 'rodrigues2205@icloud.com'
  
  try {
    // 1. Buscar usuário matriz
    log('1. Buscando usuário matriz...', 'step')
    
    const { data: matrixUser, error: matrixError } = await supabase
      .from('matrix_users')
      .select('*')
      .eq('email', userEmail)
      .eq('is_active', true)
      .single()
    
    if (matrixError || !matrixUser) {
      log('❌ Usuário não encontrado ou inativo', 'error')
      return
    }
    
    log(`✅ Usuário encontrado: ${matrixUser.name}`, 'success')
    console.log(`   Role: ${matrixUser.role}`)
    console.log(`   Departamento: ${matrixUser.department}`)
    console.log(`   Ativo: ${matrixUser.is_active ? '✅' : '❌'}`)
    
    // 2. Verificar relacionamentos
    log('\n2. Verificando relacionamentos...', 'step')
    
    const { data: relationships, error: relError } = await supabase
      .from('matrix_user_contexts')
      .select('*, contexts(name, slug, type)')
      .eq('matrix_user_id', matrixUser.id)
    
    if (relError) {
      log(`❌ Erro ao buscar relacionamentos: ${relError.message}`, 'error')
      return
    }
    
    log(`✅ ${relationships?.length || 0} relacionamentos encontrados`, 'success')
    
    if (relationships && relationships.length > 0) {
      console.log('\n🏢 CONTEXTOS DISPONÍVEIS:')
      relationships.forEach((rel, index) => {
        console.log(`${index + 1}. ${rel.contexts?.name} (${rel.contexts?.type})`)
        console.log(`   Slug: ${rel.contexts?.slug}`)
        console.log(`   Pode gerenciar: ${rel.can_manage ? '✅' : '❌'}`)
      })
    }
    
    // 3. Verificar role e permissões
    log('\n3. Verificando role e permissões...', 'step')
    
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('name', matrixUser.role)
      .single()
    
    if (roleError) {
      log(`❌ Erro ao buscar role: ${roleError.message}`, 'error')
      return
    }
    
    if (roleData) {
      log(`✅ Role encontrado: ${roleData.name}`, 'success')
      console.log(`   Descrição: ${roleData.description}`)
      
      // Contar permissões ativas
      const activePermissions = Object.entries(roleData.permissions || {})
        .filter(([key, value]) => value === true)
        .length
      
      console.log(`   Permissões ativas: ${activePermissions}`)
    }
    
    // 4. Simular dados de sessão
    log('\n4. Simulando dados de sessão...', 'step')
    
    const sessionData = {
      user: {
        id: matrixUser.id,
        email: matrixUser.email,
        name: matrixUser.name,
        role: matrixUser.role,
        department: matrixUser.department,
        avatar_url: matrixUser.avatar_url,
        userType: 'matrix',
        permissions: roleData?.permissions || {}
      },
      availableContexts: relationships?.map(rel => ({
        id: rel.contexts.id,
        name: rel.contexts.name,
        slug: rel.contexts.slug,
        type: rel.contexts.type,
        canManage: rel.can_manage
      })) || []
    }
    
    log('✅ Dados de sessão simulados', 'success')
    console.log('\n📋 DADOS DE SESSÃO:')
    console.log(`   Nome: ${sessionData.user.name}`)
    console.log(`   Email: ${sessionData.user.email}`)
    console.log(`   Role: ${sessionData.user.role}`)
    console.log(`   Tipo: ${sessionData.user.userType}`)
    console.log(`   Contextos: ${sessionData.availableContexts.length}`)
    
    // 5. Verificar se tudo está correto
    const hasAdminRole = matrixUser.role === 'admin'
    const hasRelationships = relationships && relationships.length > 0
    const canManageAny = relationships?.some(rel => rel.can_manage) || false
    
    console.log('\n📊 VERIFICAÇÃO FINAL:')
    console.log(`   ✅ Usuário ativo: ${matrixUser.is_active}`)
    console.log(`   ✅ Role admin: ${hasAdminRole ? '✅' : '❌'}`)
    console.log(`   ✅ Tem relacionamentos: ${hasRelationships ? '✅' : '❌'}`)
    console.log(`   ✅ Pode gerenciar: ${canManageAny ? '✅' : '❌'}`)
    
    if (hasAdminRole && hasRelationships && canManageAny) {
      console.log('\n🎉 LOGIN DEVE FUNCIONAR CORRETAMENTE!')
      console.log('✅ Todas as verificações passaram')
      console.log('\n📋 INSTRUÇÕES:')
      console.log('1. Faça logout do sistema')
      console.log('2. Faça login com: rodrigues2205@icloud.com')
      console.log('3. O dashboard deve carregar normalmente')
      console.log('4. Você deve ver o OrganizationSelector')
    } else {
      console.log('\n⚠️ AINDA HÁ PROBLEMAS:')
      if (!hasAdminRole) console.log('❌ Role não é admin')
      if (!hasRelationships) console.log('❌ Sem relacionamentos')
      if (!canManageAny) console.log('❌ Sem permissões de gerenciamento')
    }
    
  } catch (error) {
    log(`Erro crítico: ${error.message}`, 'error')
    console.error(error)
  }
}

// Executar teste
testLogin()
