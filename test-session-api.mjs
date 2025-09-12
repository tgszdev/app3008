console.log('🧪 API de Validação de Sessão Criada\n')
console.log('=' .repeat(60))

console.log('\n✅ API Route criada com sucesso!')
console.log('📍 Arquivo: /src/app/api/session/validate/route.ts')

console.log('\n📋 Endpoints disponíveis:')
console.log('-'.repeat(40))

console.log('\n1️⃣ GET /api/session/validate')
console.log('   Verifica se a sessão atual é válida')
console.log('   Retorna:')
console.log('   - valid: true/false')
console.log('   - reason: motivo se inválida')
console.log('   - expires: data de expiração')

console.log('\n2️⃣ POST /api/session/validate')
console.log('   Invalida manualmente uma sessão')
console.log('   Body: { sessionToken?, reason? }')
console.log('   Retorna:')
console.log('   - success: true/false')
console.log('   - message: mensagem de status')

console.log('\n' + '=' .repeat(60))
console.log('📌 Como testar no navegador:')
console.log('-'.repeat(40))

console.log('\n1. Faça login no sistema')
console.log('2. Abra o console do navegador (F12)')
console.log('3. Execute este código:')
console.log(`
// Verificar se a sessão é válida
fetch('/api/session/validate')
  .then(r => r.json())
  .then(data => {
    if (data.valid) {
      console.log('✅ Sessão válida até:', data.expires)
    } else {
      console.log('❌ Sessão inválida:', data.reason)
    }
  })

// Invalidar a sessão atual (forçar logout)
fetch('/api/session/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ reason: 'teste_manual' })
})
  .then(r => r.json())
  .then(data => console.log('Invalidação:', data))
`)

console.log('\n' + '=' .repeat(60))
console.log('✅ Etapa 2 concluída: API Route de Validação implementada!')