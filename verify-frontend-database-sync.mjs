#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyFrontendDatabaseSync() {
  console.log('🔍 VERIFICAÇÃO: FRONTEND → BANCO DE DADOS')
  console.log('=' .repeat(60))

  try {
    // 1. Verificar usuário simas@simas.com.br
    console.log('\n1️⃣ VERIFICANDO USUÁRIO SIMAS@SIMAS.COM.BR...')
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'simas@simas.com.br')
      .single()

    if (userError) {
      console.log('❌ Usuário não encontrado:', userError.message)
      return
    }

    console.log('✅ Usuário encontrado:')
    console.log(`  - ID: ${user.id}`)
    console.log(`  - Email: ${user.email}`)
    console.log(`  - User Type: ${user.user_type}`)
    console.log(`  - Context ID: ${user.context_id || 'null'}`)
    console.log(`  - Role: ${user.role}`)
    console.log(`  - Is Active: ${user.is_active}`)

    // 2. Verificar contexto "Simas Log"
    console.log('\n2️⃣ VERIFICANDO CONTEXTO "SIMAS LOG"...')
    
    const { data: simasLog, error: simasLogError } = await supabase
      .from('contexts')
      .select('*')
      .eq('name', 'Simas Log')
      .single()

    if (simasLogError) {
      console.log('❌ Contexto "Simas Log" não encontrado:', simasLogError.message)
    } else {
      console.log('✅ Contexto "Simas Log" encontrado:')
      console.log(`  - ID: ${simasLog.id}`)
      console.log(`  - Nome: ${simasLog.name}`)
      console.log(`  - Tipo: ${simasLog.type}`)
      console.log(`  - Ativo: ${simasLog.is_active}`)
    }

    // 3. Verificar associações user_contexts
    console.log('\n3️⃣ VERIFICANDO ASSOCIAÇÕES USER_CONTEXTS...')
    
    const { data: userContexts, error: userContextsError } = await supabase
      .from('user_contexts')
      .select('*')
      .eq('user_id', user.id)

    if (userContextsError) {
      console.log('❌ Erro ao buscar associações:', userContextsError.message)
    } else {
      console.log('✅ Associações encontradas:', userContexts.length)
      userContexts.forEach(uc => {
        console.log(`  - Context ID: ${uc.context_id}`)
        console.log(`  - Can Manage: ${uc.can_manage}`)
        console.log(`  - Created: ${uc.created_at}`)
      })
    }

    // 4. Verificar se o usuário está associado ao contexto correto
    console.log('\n4️⃣ VERIFICANDO ASSOCIAÇÃO USUÁRIO-CONTEXTO...')
    
    if (user.context_id === simasLog.id) {
      console.log('✅ Usuário tem context_id correto')
    } else {
      console.log('❌ Usuário NÃO tem context_id correto')
      console.log(`  - Atual: ${user.context_id || 'null'}`)
      console.log(`  - Esperado: ${simasLog.id}`)
    }

    // 5. Verificar se há associação na tabela user_contexts
    console.log('\n5️⃣ VERIFICANDO ASSOCIAÇÃO USER_CONTEXTS...')
    
    if (userContexts && userContexts.length > 0) {
      const simasLogAssociation = userContexts.find(uc => uc.context_id === simasLog.id)
      
      if (simasLogAssociation) {
        console.log('✅ Usuário está associado ao contexto "Simas Log" na tabela user_contexts')
        console.log(`  - Context ID: ${simasLogAssociation.context_id}`)
        console.log(`  - Can Manage: ${simasLogAssociation.can_manage}`)
      } else {
        console.log('❌ Usuário NÃO está associado ao contexto "Simas Log" na tabela user_contexts')
        console.log('🔧 SOLUÇÃO: Criar associação user_contexts')
      }
    } else {
      console.log('❌ Usuário não tem nenhuma associação user_contexts')
      console.log('🔧 SOLUÇÃO: Criar associação user_contexts')
    }

    // 6. Verificar categorias que devem aparecer
    console.log('\n6️⃣ VERIFICANDO CATEGORIAS QUE DEVEM APARECER...')
    
    // Categorias globais
    const { data: globalCats, error: globalCatsError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_global', true)
      .eq('is_active', true)

    if (globalCatsError) {
      console.log('❌ Erro ao buscar categorias globais:', globalCatsError.message)
    } else {
      console.log('✅ Categorias globais:', globalCats.length)
      globalCats.forEach(cat => {
        console.log(`  - ${cat.name}`)
      })
    }

    // Categorias específicas do contexto
    const { data: contextCats, error: contextCatsError } = await supabase
      .from('categories')
      .select('*')
      .eq('context_id', simasLog.id)
      .eq('is_active', true)

    if (contextCatsError) {
      console.log('❌ Erro ao buscar categorias do contexto:', contextCatsError.message)
    } else {
      console.log('✅ Categorias específicas do contexto:', contextCats.length)
      contextCats.forEach(cat => {
        console.log(`  - ${cat.name}`)
      })
    }

    // 7. Verificar se categoria "Emergência" foi alterada corretamente
    console.log('\n7️⃣ VERIFICANDO CATEGORIA "EMERGÊNCIA"...')
    
    const { data: emergencia, error: emergenciaError } = await supabase
      .from('categories')
      .select('*')
      .eq('name', 'Emergência')
      .single()

    if (emergenciaError) {
      console.log('❌ Categoria "Emergência" não encontrada:', emergenciaError.message)
    } else {
      console.log('✅ Categoria "Emergência" encontrada:')
      console.log(`  - ID: ${emergencia.id}`)
      console.log(`  - Nome: ${emergencia.name}`)
      console.log(`  - Is Global: ${emergencia.is_global}`)
      console.log(`  - Context ID: ${emergencia.context_id || 'null'}`)
      console.log(`  - Is Active: ${emergencia.is_active}`)
      
      if (emergencia.context_id === simasLog.id) {
        console.log('✅ Categoria "Emergência" está no contexto correto')
      } else {
        console.log('❌ Categoria "Emergência" NÃO está no contexto correto')
        console.log(`  - Atual: ${emergencia.context_id}`)
        console.log(`  - Esperado: ${simasLog.id}`)
      }
    }

    // 8. Verificar categoria "simas categoria especifica"
    console.log('\n8️⃣ VERIFICANDO CATEGORIA "SIMAS CATEGORIA ESPECIFICA"...')
    
    const { data: simasCat, error: simasCatError } = await supabase
      .from('categories')
      .select('*')
      .eq('name', 'simas categoria especifica')
      .single()

    if (simasCatError) {
      console.log('❌ Categoria "simas categoria especifica" não encontrada:', simasCatError.message)
    } else {
      console.log('✅ Categoria "simas categoria especifica" encontrada:')
      console.log(`  - ID: ${simasCat.id}`)
      console.log(`  - Nome: ${simasCat.name}`)
      console.log(`  - Is Global: ${simasCat.is_global}`)
      console.log(`  - Context ID: ${simasCat.context_id || 'null'}`)
      console.log(`  - Is Active: ${simasCat.is_active}`)
      
      if (simasCat.context_id === simasLog.id) {
        console.log('✅ Categoria "simas categoria especifica" está no contexto correto')
      } else {
        console.log('❌ Categoria "simas categoria especifica" NÃO está no contexto correto')
        console.log(`  - Atual: ${simasCat.context_id}`)
        console.log(`  - Esperado: ${simasLog.id}`)
      }
    }

    // 9. Verificar se a API está funcionando corretamente
    console.log('\n9️⃣ VERIFICANDO API DE CATEGORIAS...')
    
    try {
      const response = await fetch('https://www.ithostbr.tech/api/categories/public?active_only=true')
      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ API funcionando:', data.length, 'categorias')
        
        // Filtrar categorias que devem aparecer para o usuário
        const expectedCategories = data.filter(cat => 
          cat.is_global || cat.context_id === simasLog.id
        )
        
        console.log('📋 Categorias que devem aparecer para o usuário:', expectedCategories.length)
        expectedCategories.forEach(cat => {
          console.log(`  - ${cat.name}: ${cat.is_global ? 'Global' : 'Específica'}`)
        })
        
        // Verificar se as categorias esperadas estão presentes
        const emergenciaInAPI = data.find(cat => cat.name === 'Emergência')
        const simasCatInAPI = data.find(cat => cat.name === 'simas categoria especifica')
        
        if (emergenciaInAPI) {
          console.log('✅ Categoria "Emergência" está na API')
        } else {
          console.log('❌ Categoria "Emergência" NÃO está na API')
        }
        
        if (simasCatInAPI) {
          console.log('✅ Categoria "simas categoria especifica" está na API')
        } else {
          console.log('❌ Categoria "simas categoria especifica" NÃO está na API')
        }
      } else {
        console.log('❌ API com erro:', response.status, data)
      }
    } catch (error) {
      console.log('❌ Erro ao testar API:', error.message)
    }

    // 10. Diagnóstico final
    console.log('\n🔟 DIAGNÓSTICO FINAL...')
    
    const issues = []
    const solutions = []
    
    if (!user.context_id) {
      issues.push('❌ Usuário não tem context_id')
      solutions.push('🔧 Atualizar context_id do usuário para o ID do contexto "Simas Log"')
    }
    
    if (user.context_id !== simasLog.id) {
      issues.push('❌ Usuário tem context_id incorreto')
      solutions.push('🔧 Corrigir context_id do usuário')
    }
    
    if (!userContexts || userContexts.length === 0) {
      issues.push('❌ Usuário não tem associações user_contexts')
      solutions.push('🔧 Criar associação user_contexts')
    }
    
    if (emergencia && emergencia.context_id !== simasLog.id) {
      issues.push('❌ Categoria "Emergência" não está no contexto correto')
      solutions.push('🔧 Mover categoria "Emergência" para o contexto "Simas Log"')
    }
    
    if (!simasCat) {
      issues.push('❌ Categoria "simas categoria especifica" não encontrada')
      solutions.push('🔧 Verificar se a categoria foi criada corretamente')
    }

    console.log('📊 RESUMO:')
    console.log(`  - Usuário: ${user.email}`)
    console.log(`  - User Type: ${user.user_type}`)
    console.log(`  - Context ID: ${user.context_id || 'null'}`)
    console.log(`  - Contexto Esperado: ${simasLog.id}`)
    console.log(`  - Associações: ${userContexts?.length || 0}`)
    console.log(`  - Categorias globais: ${globalCats?.length || 0}`)
    console.log(`  - Categorias específicas: ${contextCats?.length || 0}`)

    if (issues.length > 0) {
      console.log('\n🚨 PROBLEMAS IDENTIFICADOS:')
      issues.forEach(issue => console.log(`  ${issue}`))
      
      console.log('\n🔧 SOLUÇÕES NECESSÁRIAS:')
      solutions.forEach(solution => console.log(`  ${solution}`))
      
      console.log('\n⚠️ CONCLUSÃO:')
      console.log('As operações do frontend NÃO estão sendo refletidas corretamente no banco de dados!')
      console.log('É necessário corrigir as associações e contextos para que o sistema funcione.')
    } else {
      console.log('\n✅ ESTRUTURA OK')
      console.log('As operações do frontend estão sendo refletidas corretamente no banco de dados!')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

verifyFrontendDatabaseSync()
