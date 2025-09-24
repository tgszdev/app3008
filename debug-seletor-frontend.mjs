import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugSeletorFrontend() {
  console.log('🔍 DEBUG FRONTEND - SELETOR MÚLTIPLO')
  console.log('=' * 60)

  const userId = '2a33241e-ed38-48b5-9c84-e8c354ae9606' // ID do Thiago Rodrigues Souza

  // --- 1. VERIFICAR DADOS DO USUÁRIO ---
  console.log('\n👤 1. DADOS DO USUÁRIO')
  console.log('=' * 30)
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, email, name, role, user_type, context_id, context_name, context_slug, context_type')
    .eq('id', userId)
    .single()

  if (userError) {
    console.error('❌ Erro ao buscar dados do usuário:', userError)
    return
  }

  console.log('📊 Dados do usuário:', userData)

  // --- 2. VERIFICAR CONTEXTOS ASSOCIADOS ---
  console.log('\n🏢 2. CONTEXTOS ASSOCIADOS')
  console.log('=' * 30)
  const { data: userContexts, error: userContextsError } = await supabaseAdmin
    .from('user_contexts')
    .select('context_id, contexts(id, name, slug, type, is_active)')
    .eq('user_id', userId)

  if (userContextsError) {
    console.error('❌ Erro ao buscar contextos associados:', userContextsError)
    return
  }

  console.log(`📊 Total de contextos associados: ${userContexts.length}`)
  userContexts.forEach((uc, index) => {
    if (uc.contexts) {
      console.log(`  ${index + 1}. ${uc.contexts.name} (${uc.contexts.type}) - Ativo: ${uc.contexts.is_active} - ID: ${uc.context_id}`)
    } else {
      console.log(`  ${index + 1}. ❌ Contexto órfão (ID: ${uc.context_id})`)
    }
  })

  // --- 3. SIMULAR AUTH-CONFIG.TS ---
  console.log('\n🔄 3. SIMULANDO AUTH-CONFIG.TS')
  console.log('=' * 30)
  
  const availableContexts = userContexts
    .filter(uc => uc.contexts && uc.contexts.is_active)
    .map(uc => ({
      id: uc.contexts.id,
      name: uc.contexts.name,
      slug: uc.contexts.slug,
      type: uc.contexts.type
    }))

  console.log('📊 AvailableContexts que seriam passados para a sessão:')
  console.log(`📊 Total: ${availableContexts.length}`)
  availableContexts.forEach((ctx, index) => {
    console.log(`  ${index + 1}. ${ctx.name} (${ctx.type}) - ID: ${ctx.id}`)
  })

  // --- 4. SIMULAR ORGANIZATION CONTEXT ---
  console.log('\n🔄 4. SIMULANDO ORGANIZATION CONTEXT')
  console.log('=' * 30)
  
  // Simular o que o OrganizationContext deveria fazer
  const sessionContexts = availableContexts // Simular sessionContexts
  const isMatrixUser = userData.user_type === 'matrix'
  
  console.log('📊 sessionContexts (da sessão):', sessionContexts.length)
  console.log('📊 isMatrixUser:', isMatrixUser)
  
  if (isMatrixUser) {
    console.log('✅ Usuário matrix - deveria carregar contextos da sessão')
    console.log('📊 Contextos que o OrganizationContext deveria carregar:')
    sessionContexts.forEach((ctx, index) => {
      console.log(`  ${index + 1}. ${ctx.name} (${ctx.type}) - ID: ${ctx.id}`)
    })
  }

  // --- 5. SIMULAR MULTI CLIENT SELECTOR ---
  console.log('\n🎯 5. SIMULANDO MULTI CLIENT SELECTOR')
  console.log('=' * 30)
  
  // Simular o que o MultiClientSelector deveria receber
  const availableContextsForSelector = sessionContexts
  
  console.log('📊 availableContexts que o MultiClientSelector deveria receber:')
  console.log(`📊 Total: ${availableContextsForSelector.length}`)
  availableContextsForSelector.forEach((ctx, index) => {
    console.log(`  ${index + 1}. ${ctx.name} (${ctx.type}) - ID: ${ctx.id}`)
  })

  // Simular estado inicial do seletor
  let selectedClients = []
  console.log('\n📊 Estado inicial do seletor:')
  console.log(`  selectedClients: ${JSON.stringify(selectedClients)}`)
  console.log(`  availableContexts.length: ${availableContextsForSelector.length}`)

  // Simular getSelectedClientsInfo
  const getSelectedClientsInfo = (selectedClients, availableContexts) => {
    if (selectedClients.length === 0) {
      return "Selecionar clientes..."
    }
    
    if (selectedClients.length === availableContexts.length) {
      return "Todos os clientes"
    }
    
    if (selectedClients.length === 1) {
      const selected = availableContexts.find(c => c.id === selectedClients[0])
      return selected?.name || "Cliente selecionado"
    }
    
    return `${selectedClients.length} clientes selecionados`
  }

  // Testar seleção de Luft Agro
  const luftAgroId = '6486088e-72ae-461b-8b03-32ca84918882'
  console.log('\n🔄 Testando seleção de Luft Agro...')
  selectedClients = [luftAgroId]
  
  const displayText = getSelectedClientsInfo(selectedClients, availableContextsForSelector)
  console.log(`📊 Texto que deveria aparecer no botão: "${displayText}"`)
  
  // Verificar se Luft Agro está nos contextos disponíveis
  const luftAgroInContexts = availableContextsForSelector.find(ctx => ctx.id === luftAgroId)
  if (luftAgroInContexts) {
    console.log('✅ Luft Agro está nos contextos disponíveis')
    console.log(`📊 Dados do Luft Agro: ${JSON.stringify(luftAgroInContexts)}`)
  } else {
    console.log('❌ Luft Agro NÃO está nos contextos disponíveis')
  }

  // --- 6. VERIFICAR PROBLEMAS ESPECÍFICOS ---
  console.log('\n🔍 6. VERIFICANDO PROBLEMAS ESPECÍFICOS')
  console.log('=' * 30)
  
  // Verificar se o problema é no auth-config.ts
  if (availableContexts.length === 0) {
    console.log('❌ PROBLEMA: availableContexts está vazio no auth-config.ts')
    console.log('💡 Solução: Verificar se auth-config.ts está buscando contextos corretamente')
  } else {
    console.log(`✅ auth-config.ts está funcionando - ${availableContexts.length} contextos`)
  }

  // Verificar se o problema é no OrganizationContext
  if (sessionContexts.length === 0) {
    console.log('❌ PROBLEMA: sessionContexts está vazio no OrganizationContext')
    console.log('💡 Solução: Verificar se OrganizationContext está recebendo availableContexts da sessão')
  } else {
    console.log(`✅ OrganizationContext deveria funcionar - ${sessionContexts.length} contextos`)
  }

  // Verificar se o problema é no MultiClientSelector
  if (availableContextsForSelector.length === 0) {
    console.log('❌ PROBLEMA: availableContexts está vazio no MultiClientSelector')
    console.log('💡 Solução: Verificar se MultiClientSelector está recebendo availableContexts do OrganizationContext')
  } else {
    console.log(`✅ MultiClientSelector deveria funcionar - ${availableContextsForSelector.length} contextos`)
  }

  // --- 7. TESTAR SELEÇÃO MÚLTIPLA ---
  console.log('\n🎯 7. TESTANDO SELEÇÃO MÚLTIPLA')
  console.log('=' * 30)
  
  // Simular seleção de múltiplos clientes
  const sistemaAtualId = 'fa4a4a34-f662-4da1-94d8-b77b5c578d6b'
  const organizacaoPadraoId = 'a7791594-c44d-47aa-8ddd-97ecfb6cc8ed'
  
  console.log('🔄 Simulando seleção múltipla...')
  selectedClients = [luftAgroId, sistemaAtualId, organizacaoPadraoId]
  console.log(`  selectedClients após seleção múltipla: ${JSON.stringify(selectedClients)}`)
  
  const displayTextMultiple = getSelectedClientsInfo(selectedClients, availableContextsForSelector)
  console.log(`📊 Texto que deveria aparecer com múltiplas seleções: "${displayTextMultiple}"`)

  // --- 8. VERIFICAR SE HÁ PROBLEMA NO FRONTEND ---
  console.log('\n🔍 8. VERIFICANDO PROBLEMAS NO FRONTEND')
  console.log('=' * 30)
  
  console.log('🔍 Possíveis problemas no frontend:')
  console.log('1. OrganizationContext não está carregando availableContexts da sessão')
  console.log('2. MultiClientSelector não está recebendo availableContexts')
  console.log('3. handleToggleClient não está funcionando')
  console.log('4. getSelectedClientsInfo não está funcionando')
  console.log('5. Há conflitos entre estados')
  console.log('6. O componente está sendo re-renderizado e perdendo estado')
  console.log('7. Há problemas com o useEffect que está resetando o estado')

  // --- 9. RESUMO DOS PROBLEMAS ---
  console.log('\n📊 RESUMO DOS PROBLEMAS')
  console.log('=' * 60)
  
  console.log(`✅ Usuário encontrado: ${userData.email}`)
  console.log(`✅ user_type: ${userData.user_type}`)
  console.log(`✅ Contextos no auth-config: ${availableContexts.length}`)
  console.log(`✅ Contextos no OrganizationContext: ${sessionContexts.length}`)
  console.log(`✅ Contextos no MultiClientSelector: ${availableContextsForSelector.length}`)
  console.log(`✅ Luft Agro disponível: ${luftAgroInContexts ? 'Sim' : 'Não'}`)
  
  if (availableContexts.length === 0) {
    console.log('\n❌ PROBLEMA PRINCIPAL: auth-config.ts não está carregando contextos')
    console.log('💡 Solução: Verificar se auth-config.ts está buscando user_contexts corretamente')
  } else if (sessionContexts.length === 0) {
    console.log('\n❌ PROBLEMA PRINCIPAL: OrganizationContext não está recebendo contextos da sessão')
    console.log('💡 Solução: Verificar se OrganizationContext está carregando sessionContexts')
  } else if (availableContextsForSelector.length === 0) {
    console.log('\n❌ PROBLEMA PRINCIPAL: MultiClientSelector não está recebendo contextos')
    console.log('💡 Solução: Verificar se MultiClientSelector está recebendo availableContexts do OrganizationContext')
  } else {
    console.log('\n✅ DADOS CORRETOS: Tudo parece estar funcionando no backend')
    console.log('💡 Problema está no frontend:')
    console.log('  - OrganizationContext não está carregando availableContexts')
    console.log('  - MultiClientSelector não está recebendo availableContexts')
    console.log('  - handleToggleClient não está funcionando')
    console.log('  - getSelectedClientsInfo não está funcionando')
    console.log('  - Há conflitos entre estados')
    console.log('  - O componente está sendo re-renderizado e perdendo estado')
  }

  console.log('\n🔧 PRÓXIMOS PASSOS:')
  console.log('1. Verificar se OrganizationContext está carregando availableContexts')
  console.log('2. Verificar se MultiClientSelector está recebendo availableContexts')
  console.log('3. Verificar se handleToggleClient está funcionando')
  console.log('4. Verificar se getSelectedClientsInfo está funcionando')
  console.log('5. Verificar se há conflitos entre estados')
  console.log('6. Verificar se o componente está sendo re-renderizado')
  console.log('7. Verificar se há problemas com o useEffect')
}

debugSeletorFrontend()
