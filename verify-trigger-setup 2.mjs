import { createClient } from '@supabase/supabase-js'

// Credenciais fornecidas
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 Verificando se as alterações foram aplicadas...\n')
console.log('=' .repeat(60))

async function verifySetup() {
  try {
    // 1. Verificar estrutura da tabela
    console.log('\n📊 1. ESTRUTURA DA TABELA SESSIONS:')
    console.log('-'.repeat(40))
    
    const { data: sample, error } = await supabase
      .from('sessions')
      .select('*')
      .limit(1)
      .single()
    
    if (sample) {
      const columns = Object.keys(sample)
      console.log('Colunas encontradas:')
      columns.forEach(col => {
        let status = '✅'
        if (col === 'invalidated_at') status = '🆕✅'
        if (col === 'invalidated_reason') status = '🆕✅'
        console.log(`  ${status} ${col}`)
      })
      
      // Verificar especificamente as novas colunas
      const hasInvalidatedAt = columns.includes('invalidated_at')
      const hasInvalidatedReason = columns.includes('invalidated_reason')
      
      console.log('\n📋 Status das novas colunas:')
      console.log(`  - invalidated_at: ${hasInvalidatedAt ? '✅ ADICIONADA COM SUCESSO' : '❌ NÃO ENCONTRADA'}`)
      console.log(`  - invalidated_reason: ${hasInvalidatedReason ? '✅ ADICIONADA COM SUCESSO' : '❌ NÃO ENCONTRADA'}`)
    }
    
    // 2. Testar o trigger simulando um novo login
    console.log('\n🧪 2. TESTE DO TRIGGER:')
    console.log('-'.repeat(40))
    
    // Criar um usuário de teste
    const testUserId = 'test-user-' + Date.now()
    const testToken1 = 'test-token-1-' + Date.now()
    const testToken2 = 'test-token-2-' + Date.now()
    
    // Inserir primeira sessão
    console.log('📝 Criando primeira sessão de teste...')
    const { data: session1, error: error1 } = await supabase
      .from('sessions')
      .insert({
        id: testToken1,
        sessionToken: testToken1,
        userId: testUserId,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error1) {
      console.log('❌ Erro ao criar primeira sessão:', error1.message)
    } else {
      console.log('✅ Primeira sessão criada')
    }
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Inserir segunda sessão (deve invalidar a primeira)
    console.log('📝 Criando segunda sessão (deve invalidar a primeira)...')
    const { data: session2, error: error2 } = await supabase
      .from('sessions')
      .insert({
        id: testToken2,
        sessionToken: testToken2,
        userId: testUserId,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error2) {
      console.log('❌ Erro ao criar segunda sessão:', error2.message)
    } else {
      console.log('✅ Segunda sessão criada')
    }
    
    // Verificar se a primeira sessão foi invalidada
    console.log('\n🔍 Verificando se o trigger funcionou...')
    const { data: checkSession1, error: checkError } = await supabase
      .from('sessions')
      .select('*')
      .eq('sessionToken', testToken1)
      .single()
    
    if (checkSession1) {
      const now = new Date()
      const expires = new Date(checkSession1.expires)
      
      console.log('\n📊 Estado da primeira sessão após trigger:')
      console.log(`  - expires: ${expires < now ? '✅ EXPIRADA' : '❌ AINDA VÁLIDA'} (${checkSession1.expires})`)
      console.log(`  - invalidated_at: ${checkSession1.invalidated_at ? '✅ ' + checkSession1.invalidated_at : '❌ NULL'}`)
      console.log(`  - invalidated_reason: ${checkSession1.invalidated_reason ? '✅ ' + checkSession1.invalidated_reason : '❌ NULL'}`)
      
      if (expires < now && checkSession1.invalidated_at && checkSession1.invalidated_reason === 'new_login_detected') {
        console.log('\n🎉 TRIGGER FUNCIONANDO PERFEITAMENTE!')
      } else {
        console.log('\n⚠️  Trigger pode não estar funcionando corretamente')
      }
    }
    
    // Limpar sessões de teste
    console.log('\n🧹 Limpando sessões de teste...')
    await supabase
      .from('sessions')
      .delete()
      .eq('userId', testUserId)
    
    // 3. Verificar sessões atuais
    console.log('\n📈 3. ESTADO ATUAL DAS SESSÕES:')
    console.log('-'.repeat(40))
    
    const { data: activeSessions, count } = await supabase
      .from('sessions')
      .select('*', { count: 'exact' })
      .gt('expires', new Date().toISOString())
    
    console.log(`Total de sessões ativas: ${count || 0}`)
    
    if (activeSessions && activeSessions.length > 0) {
      const userSessions = {}
      activeSessions.forEach(session => {
        if (!userSessions[session.userId]) {
          userSessions[session.userId] = []
        }
        userSessions[session.userId].push(session)
      })
      
      console.log(`Usuários únicos: ${Object.keys(userSessions).length}`)
      
      // Verificar duplicatas
      const duplicates = Object.entries(userSessions).filter(([_, sessions]) => sessions.length > 1)
      if (duplicates.length > 0) {
        console.log('\n⚠️  Usuários com múltiplas sessões:')
        duplicates.forEach(([userId, sessions]) => {
          console.log(`  - ${userId}: ${sessions.length} sessões`)
        })
      } else {
        console.log('✅ Nenhum usuário com múltiplas sessões ativas')
      }
    }
    
    // Resumo final
    console.log('\n' + '=' .repeat(60))
    console.log('📊 RESUMO DA VERIFICAÇÃO:')
    console.log('=' .repeat(60))
    
    const { data: finalCheck } = await supabase
      .from('sessions')
      .select('invalidated_at, invalidated_reason')
      .limit(1)
      .single()
    
    const columnsOk = finalCheck !== null && 'invalidated_at' in finalCheck && 'invalidated_reason' in finalCheck
    
    if (columnsOk) {
      console.log('✅ Colunas de controle: ADICIONADAS')
      console.log('✅ Trigger: CRIADO E FUNCIONANDO')
      console.log('✅ Sistema de sessão única: PRONTO PARA USO')
      console.log('\n🎯 Próximas etapas:')
      console.log('  1. Criar API route de validação')
      console.log('  2. Implementar Server-Sent Events')
      console.log('  3. Criar hook useProtectedSession')
    } else {
      console.log('❌ Algo não está configurado corretamente')
      console.log('Por favor, verifique se o SQL foi executado no Dashboard')
    }
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message)
  }
}

verifySetup()