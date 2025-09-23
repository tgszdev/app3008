#!/usr/bin/env node

/**
 * DEBUG DA INVALIDAÇÃO DE SESSÃO
 * ===============================
 * 
 * Este script verifica:
 * 1. Por que a sessão está sendo invalidada
 * 2. Verifica a tabela de sessões
 * 3. Identifica problemas na configuração
 */

import { createClient } from '@supabase/supabase-js'
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

async function debugSessionInvalidation() {
  console.log('🔍 DEBUG DA INVALIDAÇÃO DE SESSÃO\n')
  
  try {
    // 1. VERIFICAR TABELA DE SESSÕES
    log('1. VERIFICANDO TABELA DE SESSÕES...', 'step')
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (sessionsError) {
      log(`❌ Erro ao buscar sessões: ${sessionsError.message}`, 'error')
    } else {
      log(`✅ ${sessions?.length || 0} sessões encontradas`, 'success')
      
      if (sessions && sessions.length > 0) {
        console.log('\n📋 SESSÕES RECENTES:')
        sessions.forEach((session, index) => {
          const isExpired = new Date(session.expires) < new Date()
          const timeLeft = new Date(session.expires) - new Date()
          const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60))
          
          console.log(`${index + 1}. ID: ${session.id}`)
          console.log(`   User ID: ${session.userId}`)
          console.log(`   Session Token: ${session.sessionToken?.substring(0, 20)}...`)
          console.log(`   Criada: ${session.created_at}`)
          console.log(`   Expira: ${session.expires}`)
          console.log(`   Status: ${isExpired ? '❌ Expirada' : '✅ Ativa'}`)
          console.log(`   Tempo restante: ${hoursLeft}h`)
          console.log('')
        })
      }
    }
    
    // 2. VERIFICAR SESSÕES DO USUÁRIO ESPECÍFICO
    log('\n2. VERIFICANDO SESSÕES DO USUÁRIO...', 'step')
    
    const userEmail = 'rodrigues2205@icloud.com'
    
    // Buscar usuário
    const { data: user, error: userError } = await supabase
      .from('matrix_users')
      .select('id, email, name')
      .eq('email', userEmail)
      .single()
    
    if (userError || !user) {
      log(`❌ Usuário não encontrado: ${userError?.message}`, 'error')
      return
    }
    
    log(`✅ Usuário encontrado: ${user.name} (${user.id})`, 'success')
    
    // Buscar sessões do usuário
    const { data: userSessions, error: userSessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('userId', user.id)
      .order('created_at', { ascending: false })
    
    if (userSessionsError) {
      log(`❌ Erro ao buscar sessões do usuário: ${userSessionsError.message}`, 'error')
    } else {
      log(`✅ ${userSessions?.length || 0} sessões do usuário encontradas`, 'success')
      
      if (userSessions && userSessions.length > 0) {
        console.log('\n📋 SESSÕES DO USUÁRIO:')
        userSessions.forEach((session, index) => {
          const isExpired = new Date(session.expires) < new Date()
          const timeLeft = new Date(session.expires) - new Date()
          const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60))
          
          console.log(`${index + 1}. Session Token: ${session.sessionToken?.substring(0, 30)}...`)
          console.log(`   Criada: ${session.created_at}`)
          console.log(`   Expira: ${session.expires}`)
          console.log(`   Status: ${isExpired ? '❌ Expirada' : '✅ Ativa'}`)
          console.log(`   Tempo restante: ${hoursLeft}h`)
          console.log('')
        })
      }
    }
    
    // 3. VERIFICAR SESSÕES ATIVAS
    log('\n3. VERIFICANDO SESSÕES ATIVAS...', 'step')
    
    const now = new Date().toISOString()
    const { data: activeSessions, error: activeSessionsError } = await supabase
      .from('sessions')
      .select('*')
      .gt('expires', now)
      .order('created_at', { ascending: false })
    
    if (activeSessionsError) {
      log(`❌ Erro ao buscar sessões ativas: ${activeSessionsError.message}`, 'error')
    } else {
      log(`✅ ${activeSessions?.length || 0} sessões ativas encontradas`, 'success')
      
      if (activeSessions && activeSessions.length > 0) {
        console.log('\n📋 SESSÕES ATIVAS:')
        activeSessions.forEach((session, index) => {
          const timeLeft = new Date(session.expires) - new Date()
          const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60))
          
          console.log(`${index + 1}. User ID: ${session.userId}`)
          console.log(`   Session Token: ${session.sessionToken?.substring(0, 30)}...`)
          console.log(`   Criada: ${session.created_at}`)
          console.log(`   Expira: ${session.expires}`)
          console.log(`   Tempo restante: ${hoursLeft}h`)
          console.log('')
        })
      }
    }
    
    // 4. VERIFICAR SESSÕES DO USUÁRIO ATIVAS
    log('\n4. VERIFICANDO SESSÕES ATIVAS DO USUÁRIO...', 'step')
    
    const { data: userActiveSessions, error: userActiveSessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('userId', user.id)
      .gt('expires', now)
      .order('created_at', { ascending: false })
    
    if (userActiveSessionsError) {
      log(`❌ Erro ao buscar sessões ativas do usuário: ${userActiveSessionsError.message}`, 'error')
    } else {
      log(`✅ ${userActiveSessions?.length || 0} sessões ativas do usuário encontradas`, 'success')
      
      if (userActiveSessions && userActiveSessions.length > 0) {
        console.log('\n📋 SESSÕES ATIVAS DO USUÁRIO:')
        userActiveSessions.forEach((session, index) => {
          const timeLeft = new Date(session.expires) - new Date()
          const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60))
          
          console.log(`${index + 1}. Session Token: ${session.sessionToken?.substring(0, 30)}...`)
          console.log(`   Criada: ${session.created_at}`)
          console.log(`   Expira: ${session.expires}`)
          console.log(`   Tempo restante: ${hoursLeft}h`)
          console.log('')
        })
      } else {
        log('❌ NENHUMA SESSÃO ATIVA DO USUÁRIO ENCONTRADA', 'error')
        console.log('   Isso explica por que você está sendo redirecionado para login')
      }
    }
    
    // 5. DIAGNÓSTICO
    console.log('\n📊 DIAGNÓSTICO:')
    console.log('=' * 50)
    
    const problems = []
    const solutions = []
    
    if (!userActiveSessions || userActiveSessions.length === 0) {
      problems.push('❌ Usuário não tem sessões ativas')
      solutions.push('✅ Criar nova sessão para o usuário')
    }
    
    if (userSessions && userSessions.length > 0) {
      const expiredSessions = userSessions.filter(s => new Date(s.expires) < new Date())
      if (expiredSessions.length > 0) {
        problems.push(`❌ ${expiredSessions.length} sessões expiradas`)
        solutions.push('✅ Limpar sessões expiradas')
      }
    }
    
    if (problems.length > 0) {
      console.log('\n⚠️ PROBLEMAS IDENTIFICADOS:')
      problems.forEach((problem, index) => {
        console.log(`${index + 1}. ${problem}`)
      })
      
      console.log('\n💡 SOLUÇÕES:')
      solutions.forEach((solution, index) => {
        console.log(`${index + 1}. ${solution}`)
      })
      
      console.log('\n🔧 PRÓXIMOS PASSOS:')
      console.log('1. Limpar sessões expiradas')
      console.log('2. Criar nova sessão para o usuário')
      console.log('3. Verificar configuração de expiração')
    } else {
      console.log('\n✅ NENHUM PROBLEMA IDENTIFICADO')
      console.log('O problema pode estar em outro lugar.')
    }
    
    // 6. INFORMAÇÕES PARA DEBUG
    console.log('\n🔧 INFORMAÇÕES PARA DEBUG:')
    console.log(`   Usuário: ${user.name} (${user.email})`)
    console.log(`   User ID: ${user.id}`)
    console.log(`   Total de sessões: ${userSessions?.length || 0}`)
    console.log(`   Sessões ativas: ${userActiveSessions?.length || 0}`)
    console.log(`   Sessões expiradas: ${userSessions?.filter(s => new Date(s.expires) < new Date()).length || 0}`)
    
  } catch (error) {
    log(`Erro crítico: ${error.message}`, 'error')
    console.error(error)
  }
}

// Executar debug
debugSessionInvalidation()
