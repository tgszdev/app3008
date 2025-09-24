import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testAuthContexts() {
  console.log('🔍 TESTE - AUTH CONTEXTS')
  console.log('=' * 40)

  const userId = '2a33241e-ed38-48b5-9c84-e8c354ae9606' // ID do Thiago Rodrigues Souza

  // Simular o que o auth-config.ts faz
  console.log('\n1. Buscando dados do usuário...')
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError) {
    console.error('❌ Erro ao buscar usuário:', userError)
    return
  }

  console.log('✅ Usuário encontrado:', user.email)
  console.log('📊 user_type:', user.user_type)

  // Buscar contextos associados (como no auth-config.ts)
  console.log('\n2. Buscando contextos associados...')
  let availableContexts = []
  if (user.user_type === 'matrix') {
    const { data: userContexts, error: contextsError } = await supabaseAdmin
      .from('user_contexts')
      .select('context_id, contexts(id, name, slug, type)')
      .eq('user_id', user.id)
    
    if (contextsError) {
      console.error('❌ Erro ao buscar contextos:', contextsError)
      return
    }

    console.log('📊 userContexts encontrados:', userContexts.length)
    
    if (userContexts) {
      availableContexts = userContexts
        .filter(uc => uc.contexts) // Filtrar contextos válidos
        .map(uc => ({
          id: uc.contexts.id,
          name: uc.contexts.name,
          slug: uc.contexts.slug,
          type: uc.contexts.type
        }))
    }
  }

  console.log('\n3. AvailableContexts que seriam passados para a sessão:')
  console.log('📊 Total:', availableContexts.length)
  availableContexts.forEach((ctx, index) => {
    console.log(`  ${index + 1}. ${ctx.name} (${ctx.type}) - ID: ${ctx.id}`)
  })

  // Simular o que seria retornado pelo auth-config.ts
  const simulatedUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role_name || user.role,
    userType: user.user_type || 'context',
    contextType: user.context_type,
    context_id: user.context_id,
    context_name: user.context_name,
    context_slug: user.context_slug,
    availableContexts: availableContexts,
  }

  console.log('\n4. Dados que seriam retornados pelo auth-config.ts:')
  console.log('📊 availableContexts no user:', simulatedUser.availableContexts.length)
  console.log('📊 userType:', simulatedUser.userType)
  console.log('📊 contextType:', simulatedUser.contextType)

  console.log('\n5. Simulando o que o OrganizationContext receberia:')
  const sessionContexts = simulatedUser.availableContexts || []
  console.log('📊 sessionContexts.length:', sessionContexts.length)
  
  if (sessionContexts.length > 0) {
    console.log('✅ OrganizationContext deveria receber os contextos:')
    sessionContexts.forEach((ctx, index) => {
      console.log(`  ${index + 1}. ${ctx.name} (${ctx.type})`)
    })
  } else {
    console.log('❌ OrganizationContext não receberia nenhum contexto')
  }

  console.log('\n📊 RESUMO DO TESTE')
  console.log('=' * 40)
  console.log(`✅ Usuário encontrado: ${user.email}`)
  console.log(`✅ user_type: ${user.user_type}`)
  console.log(`✅ Contextos associados: ${availableContexts.length}`)
  console.log(`✅ Contextos que seriam passados para a sessão: ${sessionContexts.length}`)
  
  if (sessionContexts.length === 0) {
    console.log('\n❌ PROBLEMA IDENTIFICADO:')
    console.log('  - availableContexts está vazio na sessão')
    console.log('  - OrganizationContext não consegue carregar os contextos')
    console.log('  - MultiClientSelector não mostra as organizações')
  } else {
    console.log('\n✅ TUDO CORRETO:')
    console.log('  - availableContexts está sendo passado corretamente')
    console.log('  - OrganizationContext deveria carregar os contextos')
    console.log('  - MultiClientSelector deveria mostrar as organizações')
  }
}

testAuthContexts()
