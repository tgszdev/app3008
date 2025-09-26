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

async function fixUserContextSync() {
  console.log('🔧 CORRIGINDO SINCRONIZAÇÃO USUÁRIO-CONTEXTO')
  console.log('=' .repeat(60))

  try {
    // 1. Buscar usuário simas@simas.com.br
    console.log('\n1️⃣ BUSCANDO USUÁRIO SIMAS@SIMAS.COM.BR...')
    
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

    // 2. Buscar contexto "Simas Log"
    console.log('\n2️⃣ BUSCANDO CONTEXTO "SIMAS LOG"...')
    
    const { data: simasLog, error: simasLogError } = await supabase
      .from('contexts')
      .select('*')
      .eq('name', 'Simas Log')
      .single()

    if (simasLogError) {
      console.log('❌ Contexto "Simas Log" não encontrado:', simasLogError.message)
      return
    }

    console.log('✅ Contexto encontrado:')
    console.log(`  - ID: ${simasLog.id}`)
    console.log(`  - Nome: ${simasLog.name}`)
    console.log(`  - Tipo: ${simasLog.type}`)

    // 3. Verificar associação user_contexts
    console.log('\n3️⃣ VERIFICANDO ASSOCIAÇÃO USER_CONTEXTS...')
    
    const { data: userContexts, error: userContextsError } = await supabase
      .from('user_contexts')
      .select('*')
      .eq('user_id', user.id)
      .eq('context_id', simasLog.id)

    if (userContextsError) {
      console.log('❌ Erro ao buscar associação:', userContextsError.message)
      return
    }

    if (userContexts.length === 0) {
      console.log('❌ Associação user_contexts não encontrada')
      console.log('🔧 Criando associação user_contexts...')
      
      const { data: newUserContext, error: newUserContextError } = await supabase
        .from('user_contexts')
        .insert({
          user_id: user.id,
          context_id: simasLog.id,
          can_manage: false
        })
        .select()

      if (newUserContextError) {
        console.log('❌ Erro ao criar associação:', newUserContextError.message)
        return
      }

      console.log('✅ Associação user_contexts criada')
    } else {
      console.log('✅ Associação user_contexts já existe')
    }

    // 4. Atualizar context_id do usuário
    console.log('\n4️⃣ ATUALIZANDO CONTEXT_ID DO USUÁRIO...')
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ context_id: simasLog.id })
      .eq('id', user.id)

    if (updateError) {
      console.log('❌ Erro ao atualizar context_id:', updateError.message)
      return
    }

    console.log('✅ Context_id do usuário atualizado para:', simasLog.id)

    // 5. Verificar se a atualização foi aplicada
    console.log('\n5️⃣ VERIFICANDO ATUALIZAÇÃO...')
    
    const { data: updatedUser, error: updatedUserError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'simas@simas.com.br')
      .single()

    if (updatedUserError) {
      console.log('❌ Erro ao verificar usuário atualizado:', updatedUserError.message)
    } else {
      console.log('✅ Usuário atualizado:')
      console.log(`  - Email: ${updatedUser.email}`)
      console.log(`  - User Type: ${updatedUser.user_type}`)
      console.log(`  - Context ID: ${updatedUser.context_id}`)
      console.log(`  - Role: ${updatedUser.role}`)
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

    // 7. Testar API de categorias
    console.log('\n7️⃣ TESTANDO API DE CATEGORIAS...')
    
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

    // 8. Diagnóstico final
    console.log('\n8️⃣ DIAGNÓSTICO FINAL...')
    
    console.log('📊 RESUMO DAS CORREÇÕES:')
    console.log(`  - Usuário: ${updatedUser.email}`)
    console.log(`  - User Type: ${updatedUser.user_type}`)
    console.log(`  - Context ID: ${updatedUser.context_id}`)
    console.log(`  - Contexto: ${simasLog.name}`)
    console.log(`  - Categorias globais: ${globalCats?.length || 0}`)
    console.log(`  - Categorias específicas: ${contextCats?.length || 0}`)

    if (updatedUser.context_id === simasLog.id) {
      console.log('\n✅ SINCRONIZAÇÃO CORRIGIDA!')
      console.log('O usuário agora tem o context_id correto e as categorias devem aparecer.')
    } else {
      console.log('\n❌ SINCRONIZAÇÃO AINDA COM PROBLEMA!')
      console.log('Verificar se a atualização foi aplicada corretamente.')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

fixUserContextSync()
