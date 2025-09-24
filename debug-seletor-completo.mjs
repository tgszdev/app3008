import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugSeletorCompleto() {
  console.log('🔍 DEBUG COMPLETO - SELETOR MÚLTIPLO')
  console.log('=' * 60)

  const userId = '2a33241e-ed38-48b5-9c84-e8c354ae9606' // ID do Thiago Rodrigues Souza

  // --- 1. VERIFICAR DADOS DO USUÁRIO ---
  console.log('\n👤 1. DADOS DO USUÁRIO')
  console.log('=' * 30)
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, email, name, role, user_type, context_id, context_name, context_type')
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
  
  // Simular o que o OrganizationContext deveria retornar
  const simulatedAvailableContexts = availableContexts
  const simulatedCurrentContext = simulatedAvailableContexts.length > 0 ? simulatedAvailableContexts[0] : null

  console.log('📊 AvailableContexts que o OrganizationContext deveria retornar:')
  simulatedAvailableContexts.forEach((ctx, index) => {
    console.log(`  ${index + 1}. ${ctx.name} (${ctx.type}) - ID: ${ctx.id}`)
  })

  console.log('📊 CurrentContext que o OrganizationContext deveria retornar:')
  if (simulatedCurrentContext) {
    console.log(`  ${simulatedCurrentContext.name} (${simulatedCurrentContext.type}) - ID: ${simulatedCurrentContext.id}`)
  } else {
    console.log('  Nenhum contexto atual')
  }

  // --- 5. SIMULAR MULTI CLIENT SELECTOR ---
  console.log('\n🎯 5. SIMULANDO MULTI CLIENT SELECTOR')
  console.log('=' * 30)
  
  // Simular o estado inicial do MultiClientSelector
  let selectedClients = []
  console.log('📊 Estado inicial do seletor:')
  console.log(`  selectedClients: ${JSON.stringify(selectedClients)}`)
  console.log(`  availableContexts.length: ${simulatedAvailableContexts.length}`)

  // Simular seleção de Luft Agro
  const luftAgroId = '6486088e-72ae-461b-8b03-32ca84918882'
  console.log('\n🔄 Simulando seleção de Luft Agro...')
  selectedClients = [...selectedClients, luftAgroId]
  console.log(`  selectedClients após seleção: ${JSON.stringify(selectedClients)}`)

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

  const displayText = getSelectedClientsInfo(selectedClients, simulatedAvailableContexts)
  console.log(`📊 Texto que deveria aparecer no botão: "${displayText}"`)

  // --- 6. VERIFICAR PROBLEMAS ESPECÍFICOS ---
  console.log('\n🔍 6. VERIFICANDO PROBLEMAS ESPECÍFICOS')
  console.log('=' * 30)
  
  // Verificar se Luft Agro está nos contextos disponíveis
  const luftAgroInContexts = simulatedAvailableContexts.find(ctx => ctx.id === luftAgroId)
  if (luftAgroInContexts) {
    console.log('✅ Luft Agro está nos contextos disponíveis')
    console.log(`📊 Dados do Luft Agro: ${JSON.stringify(luftAgroInContexts)}`)
  } else {
    console.log('❌ Luft Agro NÃO está nos contextos disponíveis')
  }

  // Verificar se o problema é no OrganizationContext
  console.log('\n🔍 Verificando se OrganizationContext está carregando corretamente...')
  if (simulatedAvailableContexts.length === 0) {
    console.log('❌ PROBLEMA: availableContexts está vazio no OrganizationContext')
    console.log('💡 Solução: Verificar se OrganizationContext está carregando os contextos da sessão')
  } else {
    console.log(`✅ availableContexts tem ${simulatedAvailableContexts.length} contextos`)
  }

  // Verificar se o problema é no MultiClientSelector
  console.log('\n🔍 Verificando se MultiClientSelector está funcionando...')
  if (selectedClients.length === 0) {
    console.log('❌ PROBLEMA: selectedClients está vazio no MultiClientSelector')
    console.log('💡 Solução: Verificar se handleToggleClient está funcionando')
  } else {
    console.log(`✅ selectedClients tem ${selectedClients.length} seleções`)
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
  
  const displayTextMultiple = getSelectedClientsInfo(selectedClients, simulatedAvailableContexts)
  console.log(`📊 Texto que deveria aparecer com múltiplas seleções: "${displayTextMultiple}"`)

  // --- 8. RESUMO DOS PROBLEMAS ---
  console.log('\n📊 RESUMO DOS PROBLEMAS')
  console.log('=' * 60)
  
  console.log(`✅ Usuário encontrado: ${userData.email}`)
  console.log(`✅ user_type: ${userData.user_type}`)
  console.log(`✅ Contextos associados: ${userContexts.length}`)
  console.log(`✅ Contextos ativos: ${availableContexts.length}`)
  console.log(`✅ Luft Agro disponível: ${luftAgroInContexts ? 'Sim' : 'Não'}`)
  
  if (availableContexts.length === 0) {
    console.log('\n❌ PROBLEMA PRINCIPAL: availableContexts está vazio')
    console.log('💡 Solução: Verificar se OrganizationContext está carregando os contextos da sessão')
  } else if (!luftAgroInContexts) {
    console.log('\n❌ PROBLEMA PRINCIPAL: Luft Agro não está nos contextos disponíveis')
    console.log('💡 Solução: Verificar se Luft Agro está ativo e associado ao usuário')
  } else {
    console.log('\n✅ DADOS CORRETOS: Tudo parece estar funcionando no backend')
    console.log('💡 Problema pode estar no frontend:')
    console.log('  - OrganizationContext não está carregando availableContexts')
    console.log('  - MultiClientSelector não está recebendo availableContexts')
    console.log('  - handleToggleClient não está funcionando')
    console.log('  - getSelectedClientsInfo não está funcionando')
  }

  console.log('\n🔧 PRÓXIMOS PASSOS:')
  console.log('1. Verificar se OrganizationContext está carregando availableContexts')
  console.log('2. Verificar se MultiClientSelector está recebendo availableContexts')
  console.log('3. Verificar se handleToggleClient está funcionando')
  console.log('4. Verificar se getSelectedClientsInfo está funcionando')
  console.log('5. Verificar se há conflitos entre estados')
}

debugSeletorCompleto()
