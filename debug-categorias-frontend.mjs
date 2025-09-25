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

async function debugCategoriasFrontend() {
  console.log('🔍 DIAGNÓSTICO COMPLETO - CATEGORIAS FRONTEND')
  console.log('=' .repeat(60))

  try {
    // 1. Verificar usuário agro
    console.log('\n1️⃣ VERIFICANDO USUÁRIO AGRO...')
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
      user_type: user.user_type,
      context_id: user.context_id
    })

    // 2. Verificar context_id do usuário
    console.log('\n2️⃣ VERIFICANDO CONTEXT_ID DO USUÁRIO...')
    if (!user.context_id) {
      console.error('❌ Usuário não tem context_id!')
      return
    }

    // 3. Verificar contexto Luft Agro
    console.log('\n3️⃣ VERIFICANDO CONTEXTO LUFT AGRO...')
    const { data: context, error: contextError } = await supabase
      .from('contexts')
      .select('*')
      .eq('id', user.context_id)
      .single()

    if (contextError) {
      console.error('❌ Erro ao buscar contexto:', contextError)
      return
    }

    console.log('✅ Contexto encontrado:', {
      id: context.id,
      name: context.name,
      slug: context.slug,
      type: context.type,
      is_active: context.is_active
    })

    // 4. Verificar categorias específicas do contexto
    console.log('\n4️⃣ VERIFICANDO CATEGORIAS ESPECÍFICAS...')
    const { data: specificCategories, error: specificError } = await supabase
      .from('categories')
      .select('*')
      .eq('context_id', user.context_id)
      .eq('is_global', false)

    if (specificError) {
      console.error('❌ Erro ao buscar categorias específicas:', specificError)
      return
    }

    console.log('✅ Categorias específicas encontradas:', specificCategories.length)
    specificCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug})`)
    })

    // 5. Verificar categorias globais
    console.log('\n5️⃣ VERIFICANDO CATEGORIAS GLOBAIS...')
    const { data: globalCategories, error: globalError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_global', true)

    if (globalError) {
      console.error('❌ Erro ao buscar categorias globais:', globalError)
      return
    }

    console.log('✅ Categorias globais encontradas:', globalCategories.length)
    globalCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug})`)
    })

    // 6. Simular query da API
    console.log('\n6️⃣ SIMULANDO QUERY DA API...')
    const allCategories = [...specificCategories, ...globalCategories]
    console.log('✅ Total de categorias disponíveis:', allCategories.length)

    // 7. Verificar se há tickets com essas categorias
    console.log('\n7️⃣ VERIFICANDO TICKETS COM CATEGORIAS...')
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, title, category_id')
      .eq('context_id', user.context_id)
      .not('category_id', 'is', null)

    if (ticketsError) {
      console.error('❌ Erro ao buscar tickets:', ticketsError)
      return
    }

    console.log('✅ Tickets com categorias encontrados:', tickets.length)
    tickets.forEach(ticket => {
      console.log(`  - ${ticket.title} (categoria: ${ticket.category_id})`)
    })

    // 8. Verificar se há problemas de RLS
    console.log('\n8️⃣ VERIFICANDO RLS POLICIES...')
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'categories')

    if (policiesError) {
      console.log('⚠️ Não foi possível verificar políticas RLS')
    } else {
      console.log('✅ Políticas RLS encontradas:', policies.length)
    }

    // 9. Testar query direta como o usuário
    console.log('\n9️⃣ TESTANDO QUERY DIRETA COMO USUÁRIO...')
    const { data: testCategories, error: testError } = await supabase
      .from('categories')
      .select(`
        *,
        contexts!inner(name, slug, type)
      `)
      .or(`context_id.eq.${user.context_id},is_global.eq.true`)

    if (testError) {
      console.error('❌ Erro na query de teste:', testError)
      return
    }

    console.log('✅ Query de teste retornou:', testCategories.length, 'categorias')
    testCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.contexts?.name || 'Global'})`)
    })

    // 10. Verificar se há problemas de sessão
    console.log('\n🔟 VERIFICANDO SESSÕES ATIVAS...')
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('expires', new Date().toISOString())

    if (sessionsError) {
      console.error('❌ Erro ao buscar sessões:', sessionsError)
      return
    }

    console.log('✅ Sessões ativas encontradas:', sessions.length)
    sessions.forEach(session => {
      console.log(`  - Sessão: ${session.id} (expira: ${session.expires})`)
    })

    console.log('\n🎯 DIAGNÓSTICO CONCLUÍDO!')
    console.log('=' .repeat(60))

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugCategoriasFrontend()
