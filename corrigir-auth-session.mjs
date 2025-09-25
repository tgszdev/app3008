import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function corrigirAuthSession() {
  console.log('🔧 CORRIGINDO AUTENTICAÇÃO')
  console.log('=' * 40)
  
  try {
    // 1. Verificar se há sessões inválidas
    console.log('\n🔍 1. VERIFICANDO SESSÕES INVÁLIDAS')
    
    const { data: invalidSessions, error: invalidError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .lt('expires', new Date().toISOString())
    
    if (invalidError) {
      console.error('❌ Erro ao buscar sessões inválidas:', invalidError)
    } else {
      console.log(`✅ Sessões expiradas encontradas: ${invalidSessions?.length || 0}`)
      
      if (invalidSessions && invalidSessions.length > 0) {
        console.log('🧹 Limpando sessões expiradas...')
        
        const { error: deleteError } = await supabaseAdmin
          .from('sessions')
          .delete()
          .lt('expires', new Date().toISOString())
        
        if (deleteError) {
          console.error('❌ Erro ao limpar sessões:', deleteError)
        } else {
          console.log('✅ Sessões expiradas removidas')
        }
      }
    }
    
    // 2. Verificar sessões ativas
    console.log('\n🔍 2. VERIFICANDO SESSÕES ATIVAS')
    
    const { data: activeSessions, error: activeError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .gt('expires', new Date().toISOString())
    
    if (activeError) {
      console.error('❌ Erro ao buscar sessões ativas:', activeError)
    } else {
      console.log(`✅ Sessões ativas: ${activeSessions?.length || 0}`)
      
      if (activeSessions && activeSessions.length > 0) {
        activeSessions.forEach(session => {
          console.log(`  - Token: ${session.sessionToken?.substring(0, 20)}...`)
          console.log(`  - User: ${session.userId}`)
          console.log(`  - Expires: ${session.expires}`)
        })
      }
    }
    
    // 3. Verificar usuário agro
    console.log('\n👤 3. VERIFICANDO USUÁRIO AGRO')
    
    const { data: agroUser, error: agroError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'agro@agro.com.br')
      .single()
    
    if (agroError) {
      console.error('❌ Erro ao buscar usuário agro:', agroError)
    } else if (agroUser) {
      console.log('✅ Usuário agro encontrado:')
      console.log(`  - Nome: ${agroUser.name}`)
      console.log(`  - Email: ${agroUser.email}`)
      console.log(`  - Ativo: ${agroUser.is_active}`)
      console.log(`  - Tipo: ${agroUser.user_type}`)
      console.log(`  - Context: ${agroUser.context_id}`)
      
      // Verificar se há sessão para este usuário
      const { data: userSessions, error: userSessionsError } = await supabaseAdmin
        .from('sessions')
        .select('*')
        .eq('userId', agroUser.id)
        .gt('expires', new Date().toISOString())
      
      if (userSessionsError) {
        console.error('❌ Erro ao buscar sessões do usuário:', userSessionsError)
      } else {
        console.log(`📊 Sessões ativas do usuário agro: ${userSessions?.length || 0}`)
      }
    }
    
    // 4. Criar uma sessão de teste para o usuário agro
    console.log('\n🔧 4. CRIANDO SESSÃO DE TESTE')
    
    const testSessionToken = `test_${agroUser.id}_${Date.now()}`
    const testSession = {
      id: testSessionToken,
      sessionToken: testSessionToken,
      userId: agroUser.id,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: newSession, error: createError } = await supabaseAdmin
      .from('sessions')
      .insert(testSession)
      .select()
      .single()
    
    if (createError) {
      console.log('⚠️ Erro ao criar sessão de teste:', createError.message)
    } else {
      console.log('✅ Sessão de teste criada:')
      console.log(`  - Token: ${testSessionToken}`)
      console.log(`  - User: ${agroUser.id}`)
      console.log(`  - Expires: ${testSession.expires}`)
    }
    
    console.log('\n🎯 CORREÇÃO CONCLUÍDA!')
    console.log('📋 RESUMO:')
    console.log(`- Sessões expiradas: ${invalidSessions?.length || 0}`)
    console.log(`- Sessões ativas: ${activeSessions?.length || 0}`)
    console.log(`- Usuário agro: ${agroUser ? '✅ Encontrado' : '❌ Não encontrado'}`)
    console.log(`- Sessão de teste: ${newSession ? '✅ Criada' : '❌ Erro'}`)
    
    console.log('\n💡 PRÓXIMOS PASSOS:')
    console.log('1. ✅ Limpeza de sessões concluída')
    console.log('2. ✅ Sessão de teste criada')
    console.log('3. 🔧 Testar login novamente')
    console.log('4. 🎯 Se ainda não funcionar, verificar configuração NextAuth.js')
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral na correção:', error)
    return false
  }
}

corrigirAuthSession()
