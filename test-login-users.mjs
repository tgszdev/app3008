#!/usr/bin/env node

console.log('🔍 TESTE: Login dos Usuários')
console.log('=====================================')

const testLogin = async (userEmail, userDescription) => {
  try {
    console.log(`\n👤 Testando login: ${userDescription}`)
    console.log(`📧 Email: ${userEmail}`)
    console.log('─'.repeat(50))
    
    // Simular login via API (isso seria feito via NextAuth)
    console.log('📡 Testando endpoint de login...')
    
    // Verificar se há endpoint de login
    const loginResponse = await fetch('https://www.ithostbr.tech/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userEmail,
        password: 'test123' // Senha de teste
      })
    })
    
    console.log('📊 Status do login:', loginResponse.status)
    
    if (loginResponse.ok) {
      console.log('✅ Login funcionando')
    } else {
      console.log('❌ Login não funcionando:', loginResponse.status)
    }
    
    // Verificar se há endpoint de sessão
    console.log('\n📡 Testando endpoint de sessão...')
    const sessionResponse = await fetch('https://www.ithostbr.tech/api/auth/session')
    
    console.log('📊 Status da sessão:', sessionResponse.status)
    
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json()
      console.log('✅ Sessão encontrada:', !!sessionData.user)
      if (sessionData.user) {
        console.log('👤 Usuário logado:', sessionData.user.email)
      }
    } else {
      console.log('❌ Sessão não encontrada')
    }
    
  } catch (error) {
    console.log('❌ ERRO:', error.message)
  }
}

const testDashboardAccess = async () => {
  try {
    console.log('\n🏠 Testando acesso ao dashboard...')
    console.log('─'.repeat(50))
    
    const response = await fetch('https://www.ithostbr.tech/dashboard')
    
    console.log('📊 Status do dashboard:', response.status)
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const html = await response.text()
      
      if (html.includes('Dashboard')) {
        console.log('✅ Dashboard carregou: "Dashboard" encontrado')
      } else {
        console.log('❌ Dashboard não carregou corretamente')
      }
      
      if (html.includes('login')) {
        console.log('❌ PROBLEMA: Página contém "login" - redirecionamento')
      } else {
        console.log('✅ Não há redirecionamento para login')
      }
      
    } else {
      console.log('❌ ERRO ao acessar dashboard:', response.status)
    }
    
  } catch (error) {
    console.log('❌ ERRO:', error.message)
  }
}

const testNewTicketAccess = async () => {
  try {
    console.log('\n🎫 Testando acesso ao formulário de novo ticket...')
    console.log('─'.repeat(50))
    
    const response = await fetch('https://www.ithostbr.tech/dashboard/tickets/new')
    
    console.log('📊 Status do novo ticket:', response.status)
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const html = await response.text()
      
      if (html.includes('Novo Chamado')) {
        console.log('✅ Formulário carregou: "Novo Chamado" encontrado')
      } else {
        console.log('❌ Formulário não carregou corretamente')
      }
      
      if (html.includes('Nenhuma categoria disponível')) {
        console.log('❌ PROBLEMA: "Nenhuma categoria disponível" encontrado')
      } else {
        console.log('✅ Não há erro de categorias')
      }
      
      if (html.includes('Carregando categorias')) {
        console.log('✅ JavaScript de carregamento encontrado')
      } else {
        console.log('❌ JavaScript de carregamento não encontrado')
      }
      
    } else {
      console.log('❌ ERRO ao acessar formulário:', response.status)
    }
    
  } catch (error) {
    console.log('❌ ERRO:', error.message)
  }
}

// Executar testes
const runTests = async () => {
  // Teste 1: Usuário rodrigues2205@icloud.com
  await testLogin('rodrigues2205@icloud.com', 'Rodrigues (Matrix User)')
  
  // Teste 2: Usuário agro2@agro.com.br
  await testLogin('agro2@agro.com.br', 'Agro2 (Context User)')
  
  // Teste 3: Acesso ao dashboard
  await testDashboardAccess()
  
  // Teste 4: Acesso ao formulário de novo ticket
  await testNewTicketAccess()
  
  console.log('\n🏁 Testes de login concluídos!')
}

runTests()
