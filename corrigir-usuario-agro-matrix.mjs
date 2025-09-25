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

async function corrigirUsuarioAgro() {
  console.log('🔧 CORRIGINDO USUÁRIO AGRO PARA MATRIX')
  console.log('=' .repeat(60))

  try {
    // 1. Verificar usuário atual
    console.log('\n1️⃣ VERIFICANDO USUÁRIO ATUAL...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'agro@agro.com.br')
      .single()

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError)
      return
    }

    console.log('✅ Usuário atual:', {
      id: user.id,
      email: user.email,
      user_type: user.user_type,
      context_id: user.context_id,
      role: user.role
    })

    // 2. Verificar contextos associados
    console.log('\n2️⃣ VERIFICANDO CONTEXTOS ASSOCIADOS...')
    const { data: userContexts, error: contextsError } = await supabase
      .from('user_contexts')
      .select(`
        *,
        contexts(id, name, slug, type, is_active)
      `)
      .eq('user_id', user.id)

    if (contextsError) {
      console.error('❌ Erro ao buscar contextos:', contextsError)
      return
    }

    console.log('✅ Contextos associados:', userContexts.length)
    userContexts.forEach(uc => {
      console.log(`  - ${uc.contexts.name} (${uc.contexts.slug}) - Tipo: ${uc.contexts.type}`)
    })

    // 3. Atualizar usuário para matrix
    console.log('\n3️⃣ ATUALIZANDO USUÁRIO PARA MATRIX...')
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        user_type: 'matrix',
        context_id: null, // Usuários matrix não têm contexto fixo
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select('*')
      .single()

    if (updateError) {
      console.error('❌ Erro ao atualizar usuário:', updateError)
      return
    }

    console.log('✅ Usuário atualizado:', {
      id: updatedUser.id,
      email: updatedUser.email,
      user_type: updatedUser.user_type,
      context_id: updatedUser.context_id,
      role: updatedUser.role
    })

    // 4. Verificar se a atualização funcionou
    console.log('\n4️⃣ VERIFICANDO ATUALIZAÇÃO...')
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'agro@agro.com.br')
      .single()

    if (verifyError) {
      console.error('❌ Erro ao verificar usuário:', verifyError)
      return
    }

    console.log('✅ Usuário verificado:', {
      user_type: verifyUser.user_type,
      context_id: verifyUser.context_id
    })

    // 5. Testar categorias com JWT (simulando API)
    console.log('\n5️⃣ TESTANDO CATEGORIAS COM JWT...')
    const jwt = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseAuth = createClient(supabaseUrl, jwt)
    
    // Buscar usuário com JWT
    const { data: userAuth, error: userAuthError } = await supabaseAuth
      .from('users')
      .select('*')
      .eq('email', 'agro@agro.com.br')
      .single()

    if (userAuthError) {
      console.log('❌ RLS bloqueando acesso ao usuário:', userAuthError.message)
    } else {
      console.log('✅ Usuário acessível com JWT:', userAuth.email)
      console.log('✅ Tipo de usuário:', userAuth.user_type)
    }

    // Buscar categorias com JWT baseado no tipo de usuário
    let authCategories = []
    if (userAuth?.user_type === 'matrix') {
      // Usuário matrix: buscar categorias de todos os contextos
      const contextIds = userContexts.map(uc => uc.context_id)
      const { data: matrixCategories, error: matrixError } = await supabaseAuth
        .from('categories')
        .select('*')
        .or(`is_global.eq.true,context_id.in.(${contextIds.join(',')})`)
        .eq('is_active', true)

      if (matrixError) {
        console.log('❌ RLS bloqueando acesso às categorias matrix:', matrixError.message)
      } else {
        authCategories = matrixCategories || []
        console.log('✅ Categorias matrix com JWT:', authCategories.length)
      }
    }

    authCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug}) - Global: ${cat.is_global}`)
    })

    console.log('\n🎯 CORREÇÃO CONCLUÍDA!')
    console.log('=' .repeat(60))
    console.log('📋 RESUMO:')
    console.log(`- Usuário atualizado: ${updatedUser ? '✅' : '❌'}`)
    console.log(`- Tipo alterado para: ${updatedUser?.user_type}`)
    console.log(`- Contextos associados: ${userContexts.length}`)
    console.log(`- Categorias disponíveis: ${authCategories.length}`)

    if (authCategories.length > 3) {
      console.log('\n✅ SUCESSO! Usuário agora deve ver todas as categorias!')
    } else {
      console.log('\n⚠️ Ainda pode haver problema com RLS ou autenticação')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

corrigirUsuarioAgro()
