#!/usr/bin/env node

import https from 'https';

console.log('🔍 Verificando deploy do commit c3e834b...\n');

// Aguardar 90 segundos para o deploy
console.log('⏳ Aguardando 90 segundos para o deploy completar...');
await new Promise(resolve => setTimeout(resolve, 90000));

// Verificar endpoints que NÃO deveriam existir
const checkEndpoints = [
  { url: '/api/auth/debug-login', shouldExist: false },
  { url: '/api/fix-admin', shouldExist: false },
  { url: '/api/debug-users', shouldExist: false },
  { url: '/DEPLOY_VERIFICATION.md', shouldExist: true }
];

console.log('\n📡 Verificando endpoints...\n');

for (const endpoint of checkEndpoints) {
  await new Promise((resolve) => {
    https.get(`https://www.ithostbr.tech${endpoint.url}`, (res) => {
      const exists = res.statusCode !== 404;
      const correct = exists === endpoint.shouldExist;
      
      console.log(`${endpoint.url}:`);
      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Deveria existir: ${endpoint.shouldExist ? 'SIM' : 'NÃO'}`);
      console.log(`  Resultado: ${correct ? '✅ CORRETO' : '❌ INCORRETO'}`);
      console.log('');
      
      resolve();
    }).on('error', () => {
      console.log(`${endpoint.url}: ❌ Erro de conexão`);
      resolve();
    });
  });
}

// Verificar sistema
console.log('📊 Verificando status do sistema...\n');

await new Promise((resolve) => {
  https.get('https://www.ithostbr.tech/api/system-status', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const status = JSON.parse(data);
        console.log(`Timestamp: ${status.timestamp}`);
        console.log(`Sistema operacional: ${status.status.operational ? '✅' : '❌'}`);
        console.log(`Sessão única: ${status.system.singleSessionEnabled ? '✅ Habilitada' : '❌ Desabilitada'}`);
      } catch (e) {
        console.log('❌ Erro ao parsear status');
      }
      resolve();
    });
  }).on('error', () => {
    console.log('❌ Erro ao verificar status');
    resolve();
  });
});

console.log('\n' + '='.repeat(50));
console.log('📋 VERIFICAÇÃO COMPLETA');
console.log('='.repeat(50));
console.log('\nO deploy deve estar no commit c3e834b');
console.log('Todos os endpoints de debug devem retornar 404');
console.log('='.repeat(50));