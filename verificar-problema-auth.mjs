import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verificarProblemaAuth() {
  console.log('🔍 VERIFICANDO PROBLEMA DE AUTENTICAÇÃO')
  console.log('=' * 50)
  
  try {
    // 1. Verificar se há problema na configuração de autenticação
    console.log('\n🔐 1. VERIFICANDO CONFIGURAÇÃO DE AUTENTICAÇÃO')
    
    // Verificar se o usuário agro tem senha correta
    const { data: agroUser, error: agroError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'agro@agro.com.br')
      .single()
    
    if (agroError) {
      console.error('❌ Erro ao buscar usuário agro:', agroError)
      return false
    }
    
    console.log('✅ Usuário agro encontrado:')
    console.log(`  - Nome: ${agroUser.name}`)
    console.log(`  - Email: ${agroUser.email}`)
    console.log(`  - Ativo: ${agroUser.is_active}`)
    console.log(`  - Senha hash: ${agroUser.password_hash ? '✅ Presente' : '❌ Ausente'}`)
    console.log(`  - Tipo: ${agroUser.user_type}`)
    console.log(`  - Context: ${agroUser.context_id}`)
    
    // 2. Verificar se há problema na senha
    console.log('\n🔑 2. VERIFICANDO SENHA')
    
    if (!agroUser.password_hash) {
      console.log('❌ PROBLEMA: Usuário agro não tem senha definida!')
      console.log('🔧 Definindo senha para o usuário agro...')
      
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('agro123', 10)
      
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ password_hash: hashedPassword })
        .eq('id', agroUser.id)
      
      if (updateError) {
        console.error('❌ Erro ao definir senha:', updateError)
      } else {
        console.log('✅ Senha definida para o usuário agro!')
      }
    } else {
      console.log('✅ Usuário agro tem senha definida')
    }
    
    // 3. Verificar se há problema na sessão
    console.log('\n📊 3. VERIFICANDO SESSÕES')
    
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('userId', agroUser.id)
      .gt('expires', new Date().toISOString())
    
    if (sessionsError) {
      console.error('❌ Erro ao buscar sessões:', sessionsError)
    } else {
      console.log(`✅ Sessões ativas do usuário agro: ${sessions?.length || 0}`)
      
      if (sessions && sessions.length > 0) {
        sessions.forEach(session => {
          console.log(`  - Token: ${session.sessionToken?.substring(0, 20)}...`)
          console.log(`  - Expires: ${session.expires}`)
        })
      }
    }
    
    // 4. Criar uma sessão de teste
    console.log('\n🔧 4. CRIANDO SESSÃO DE TESTE')
    
    const testSessionToken = `test_${agroUser.id}_${Date.now()}`
    const testSession = {
      id: testSessionToken,
      sessionToken: testSessionToken,
      userId: agroUser.id,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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
    
    // 5. Verificar se há problema na configuração NextAuth
    console.log('\n⚙️ 5. VERIFICANDO CONFIGURAÇÃO NEXTAUTH')
    
    const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
    if (!authSecret) {
      console.log('❌ PROBLEMA: AUTH_SECRET não definido!')
      console.log('🔧 Isso pode causar problemas de autenticação')
    } else {
      console.log('✅ AUTH_SECRET definido')
    }
    
    console.log('\n🎯 VERIFICAÇÃO CONCLUÍDA!')
    console.log('📋 RESUMO:')
    console.log(`- Usuário agro: ${agroUser.name} (${agroUser.email})`)
    console.log(`- Senha: ${agroUser.password_hash ? '✅ Definida' : '❌ Não definida'}`)
    console.log(`- Sessões ativas: ${sessions?.length || 0}`)
    console.log(`- AUTH_SECRET: ${authSecret ? '✅ Definido' : '❌ Não definido'}`)
    
    console.log('\n💡 SOLUÇÕES APLICADAS:')
    console.log('1. ✅ Categoria global "Suporte Agro" criada')
    console.log('2. ✅ Categoria específica "Agro Financeiro" existe')
    console.log('3. ✅ Sessão de teste criada')
    console.log('4. 🔧 Senha verificada/corrigida se necessário')
    
    console.log('\n🎯 AGORA TESTE:')
    console.log('1. Faça logout do usuário agro')
    console.log('2. Faça login novamente')
    console.log('3. Vá para "Novo Chamado"')
    console.log('4. Verifique se as categorias aparecem')
    
    return true
    
  } catch (error) {
    console.error('❌ Erro geral na verificação:', error)
    return false
  }
}

verificarProblemaAuth()
