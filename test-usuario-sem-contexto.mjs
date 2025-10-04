import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testUsuarioSemContexto() {
  const email = 'agro2@agro.com.br'
  
  console.log('\n🧪 TESTE: Usuário SEM Contexto (Desassociado)')
  console.log('═'.repeat(80))
  console.log(`Usuário: ${email}`)
  console.log('═'.repeat(80))
  
  // 1. Verificar estado no banco
  const { data: user } = await supabase
    .from('users')
    .select('id, email, user_type, context_id, context_name')
    .eq('email', email)
    .single()
  
  if (!user) {
    console.log('\n❌ Usuário não encontrado!\n')
    return
  }
  
  console.log('\n📊 ESTADO NO BANCO:')
  console.log('─'.repeat(80))
  console.log('User Type:', user.user_type)
  console.log('Context ID:', user.context_id || '✅ NULL (correto)')
  console.log('Context Name:', user.context_name || '✅ NULL (correto)')
  
  // 2. Verificar associações
  const { count: assocCount } = await supabase
    .from('user_contexts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
  
  console.log('Associações:', assocCount, assocCount === 0 ? '✅ (correto - sem associações)' : '❌ (inconsistente)')
  
  // 3. Simular o que a API faria
  console.log('\n📡 SIMULAÇÃO DA API:')
  console.log('─'.repeat(80))
  
  const userContextId = user.context_id
  const userType = user.user_type
  
  console.log('API detectaria:')
  console.log('  userType:', userType)
  console.log('  userContextId:', userContextId || 'NULL')
  
  if (userType === 'context') {
    if (userContextId) {
      console.log('\n📊 API aplicaria filtro:')
      console.log('  query.eq("context_id", userContextId)')
      
      // Simular busca
      const { count } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('context_id', userContextId)
      
      console.log(`  Resultado: ${count} tickets`)
    } else {
      console.log('\n🚫 API aplicaria filtro de BLOQUEIO:')
      console.log('  query.eq("id", "00000000-0000-0000-0000-000000000000")')
      console.log('  Resultado: 0 tickets (correto)')
      
      // Verificar se isso realmente retorna vazio
      const { count } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('id', '00000000-0000-0000-0000-000000000000')
      
      if (count === 0) {
        console.log('  ✅ CONFIRMADO: Filtro retorna vazio')
      } else {
        console.log('  ❌ ERRO: Filtro retornou', count, 'tickets!')
      }
    }
  }
  
  // 4. RESULTADO FINAL
  console.log('\n═'.repeat(80))
  console.log('📋 RESULTADO DO TESTE')
  console.log('═'.repeat(80))
  
  if (assocCount === 0 && user.context_id === null) {
    console.log('\n✅ BANCO: Correto (sem associações, context_id NULL)')
  } else if (assocCount === 0 && user.context_id !== null) {
    console.log('\n❌ BANCO: Incorreto (sem associações, mas context_id ainda preenchido)')
    console.log('   └─ Trigger DELETE não funcionou!')
  } else if (assocCount > 0 && user.context_id === null) {
    console.log('\n❌ BANCO: Incorreto (tem associações, mas context_id NULL)')
    console.log('   └─ Trigger INSERT não funcionou!')
  }
  
  if (userType === 'context' && !userContextId) {
    console.log('✅ API: Bloqueará corretamente (filtro impossível aplicado)')
    console.log('\n🎯 COMPORTAMENTO ESPERADO NO FRONTEND:')
    console.log('   1. Usuário faz login')
    console.log('   2. APIs retornam VAZIO (0 tickets, 0 comentários, etc)')
    console.log('   3. Dashboard mostra mensagem "Nenhum dado encontrado"')
    console.log('   4. ✅ Usuário NÃO vê dados de nenhum cliente')
  } else if (userType === 'context' && userContextId) {
    console.log('✅ API: Filtrará pelo context_id do banco')
    console.log(`   └─ Usuário verá tickets do contexto: ${user.context_name}`)
  }
  
  console.log('\n═'.repeat(80) + '\n')
}

testUsuarioSemContexto()

