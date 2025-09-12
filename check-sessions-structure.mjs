import { createClient } from '@supabase/supabase-js'

// Credenciais fornecidas
const supabaseUrl = 'https://eyfvvximmeqmwdfqzqov.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZnZ2eGltbWVxbXdkZnF6cW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4NTE4NiwiZXhwIjoyMDcyMTYxMTg2fQ.uSItau5HKn79j6-dyFE_kyHEbGk7wrq64zrIVYxsVkw'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 Verificando estrutura da tabela sessions...\n')

try {
  // 1. Verificar estrutura da tabela sessions
  const { data: columns, error: columnsError } = await supabase
    .rpc('get_table_columns', { table_name: 'sessions' })
    .single()

  if (columnsError) {
    // Tentar método alternativo
    console.log('Tentando método alternativo para obter estrutura...')
    
    // Buscar uma sessão para ver a estrutura
    const { data: sample, error: sampleError } = await supabase
      .from('sessions')
      .select('*')
      .limit(1)
    
    if (sample && sample.length > 0) {
      console.log('📊 Estrutura da tabela sessions (baseado em amostra):')
      console.log('Colunas:', Object.keys(sample[0]))
      console.log('\nAmostra de dados:')
      console.log(JSON.stringify(sample[0], null, 2))
    } else {
      console.log('Tabela sessions existe mas está vazia ou não acessível')
    }
  }

  // 2. Verificar se já existem triggers
  const { data: triggers, error: triggersError } = await supabase
    .rpc('get_triggers', { table_name: 'sessions' })

  if (!triggersError && triggers) {
    console.log('\n🔧 Triggers existentes na tabela sessions:')
    console.log(triggers)
  } else {
    console.log('\n🔧 Nenhum trigger encontrado ou não foi possível verificar')
  }

  // 3. Verificar quantas sessões ativas existem
  const { data: activeSessions, count } = await supabase
    .from('sessions')
    .select('*', { count: 'exact' })
    .gt('expires', new Date().toISOString())

  console.log(`\n📈 Estatísticas:`)
  console.log(`- Total de sessões ativas: ${count || 0}`)
  
  if (activeSessions && activeSessions.length > 0) {
    // Agrupar por usuário
    const sessionsByUser = {}
    activeSessions.forEach(session => {
      if (!sessionsByUser[session.userId]) {
        sessionsByUser[session.userId] = []
      }
      sessionsByUser[session.userId].push(session)
    })
    
    console.log(`- Usuários únicos com sessões ativas: ${Object.keys(sessionsByUser).length}`)
    
    // Verificar se há usuários com múltiplas sessões
    const multipleSessionUsers = Object.entries(sessionsByUser)
      .filter(([_, sessions]) => sessions.length > 1)
    
    if (multipleSessionUsers.length > 0) {
      console.log(`\n⚠️  ATENÇÃO: ${multipleSessionUsers.length} usuário(s) com múltiplas sessões ativas:`)
      multipleSessionUsers.forEach(([userId, sessions]) => {
        console.log(`  - User ${userId}: ${sessions.length} sessões`)
      })
    }
  }

  // 4. Verificar estrutura exata da tabela
  console.log('\n📋 Verificando estrutura detalhada da tabela...')
  const { data: tableInfo, error: tableError } = await supabase
    .from('sessions')
    .select('*')
    .limit(0)

  // Testar inserção para ver campos obrigatórios
  console.log('\n✅ Tabela sessions está acessível e operacional')
  
  // 5. Verificar se há colunas adicionais necessárias
  const { data: testData } = await supabase
    .from('sessions')
    .select('*')
    .limit(1)
    .single()
  
  if (testData) {
    const hasInvalidatedAt = 'invalidated_at' in testData
    const hasInvalidatedReason = 'invalidated_reason' in testData
    
    console.log('\n📊 Colunas para invalidação:')
    console.log(`- invalidated_at: ${hasInvalidatedAt ? '✅ Existe' : '❌ Não existe'}`)
    console.log(`- invalidated_reason: ${hasInvalidatedReason ? '✅ Existe' : '❌ Não existe'}`)
    
    if (!hasInvalidatedAt || !hasInvalidatedReason) {
      console.log('\n⚠️  Será necessário adicionar colunas para rastreamento de invalidação')
    }
  }

} catch (error) {
  console.error('❌ Erro ao verificar banco:', error.message)
}

console.log('\n🏁 Verificação concluída!')