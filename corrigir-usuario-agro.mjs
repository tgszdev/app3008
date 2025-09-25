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
  console.log('🔧 CORRIGINDO USUÁRIO AGRO')
  console.log('=' .repeat(50))

  try {
    // 1. Verificar usuário agro atual
    console.log('\n1️⃣ VERIFICANDO USUÁRIO AGRO ATUAL...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'agro@agro.com.br')
      .single()

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError)
      return
    }

    console.log('✅ Usuário encontrado:', {
      id: user.id,
      email: user.email,
      role: user.role,
      user_type: user.user_type,
      is_active: user.is_active
    })

    // 2. Alterar role do usuário para admin temporariamente
    console.log('\n2️⃣ ALTERANDO ROLE DO USUÁRIO PARA ADMIN...')
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Erro ao alterar role:', updateError)
      return
    }

    console.log('✅ Role alterado para admin:', updatedUser.role)

    // 3. Testar autenticação com JWT após alteração
    console.log('\n3️⃣ TESTANDO AUTENTICAÇÃO COM JWT APÓS ALTERAÇÃO...')
    const jwt = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseAuth = createClient(supabaseUrl, jwt)
    
    // Verificar usuário agro com JWT
    const { data: userAuth, error: userAuthError } = await supabaseAuth
      .from('users')
      .select('*')
      .eq('email', 'agro@agro.com.br')
      .single()

    if (userAuthError) {
      console.error('❌ Erro ao buscar usuário com JWT:', userAuthError)
      console.log('🔍 Ainda há problemas de RLS mesmo com role admin')
    } else {
      console.log('✅ Usuário encontrado com JWT:', userAuth.email)
      console.log('✅ Role atual:', userAuth.role)
    }

    // 4. Testar categorias com JWT
    console.log('\n4️⃣ TESTANDO CATEGORIAS COM JWT...')
    const { data: authCategories, error: authError } = await supabaseAuth
      .from('categories')
      .select(`
        *,
        contexts!inner(name, slug, type)
      `)
      .or(`context_id.eq.${user.context_id},is_global.eq.true`)

    if (authError) {
      console.error('❌ Erro na autenticação JWT para categorias:', authError)
    } else {
      console.log('✅ Categorias encontradas com JWT:', authCategories.length)
      authCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.contexts?.name || 'Global'})`)
      })
    }

    // 5. Verificar se o problema foi resolvido
    console.log('\n5️⃣ VERIFICANDO SE O PROBLEMA FOI RESOLVIDO...')
    if (userAuth && authCategories && authCategories.length > 0) {
      console.log('✅ PROBLEMA RESOLVIDO!')
      console.log('✅ Usuário acessível com JWT')
      console.log('✅ Categorias acessíveis com JWT')
      console.log('🎯 As categorias devem aparecer no frontend agora')
    } else if (!userAuth) {
      console.log('❌ PROBLEMA PERSISTE: Usuário ainda não acessível com JWT')
      console.log('🔧 Necessário corrigir políticas RLS no Supabase Dashboard')
    } else if (!authCategories || authCategories.length === 0) {
      console.log('❌ PROBLEMA PERSISTE: Categorias ainda não acessíveis com JWT')
      console.log('🔧 Necessário corrigir políticas RLS no Supabase Dashboard')
    } else {
      console.log('❌ PROBLEMA PERSISTE: Desconhecido')
    }

    // 6. Reverter role para user (opcional)
    console.log('\n6️⃣ REVERTENDO ROLE PARA USER...')
    const { data: revertedUser, error: revertError } = await supabase
      .from('users')
      .update({ role: 'user' })
      .eq('id', user.id)
      .select()
      .single()

    if (revertError) {
      console.error('❌ Erro ao reverter role:', revertError)
    } else {
      console.log('✅ Role revertido para user:', revertedUser.role)
    }

    console.log('\n🎯 CORREÇÃO CONCLUÍDA!')
    console.log('=' .repeat(50))
    console.log('📋 RESUMO:')
    console.log(`- Role alterado para admin: ${updatedUser ? '✅' : '❌'}`)
    console.log(`- Usuário acessível com JWT: ${userAuth ? '✅' : '❌'}`)
    console.log(`- Categorias acessíveis com JWT: ${authCategories?.length || 0}`)
    console.log(`- Role revertido para user: ${revertedUser ? '✅' : '❌'}`)

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

corrigirUsuarioAgro()
