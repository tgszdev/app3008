#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🚀 Iniciando deploy no Vercel...\n');

// Verificar se .env.local existe
const envPath = path.join(projectRoot, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Arquivo .env.local não encontrado!');
  console.error('Execute primeiro: npm run setup');
  process.exit(1);
}

// Ler variáveis de ambiente
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#') && line.includes('=')) {
    const [key, ...valueParts] = line.split('=');
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

console.log('📋 Variáveis de ambiente detectadas:');
Object.keys(envVars).forEach(key => {
  if (key.includes('SECRET') || key.includes('KEY')) {
    console.log(`  - ${key}: ****** (oculto)`);
  } else {
    console.log(`  - ${key}: ${envVars[key]}`);
  }
});

console.log('\n📦 Preparando build de produção...');

try {
  // Build do projeto
  console.log('Building...');
  execSync('npm run build', { 
    stdio: 'inherit',
    cwd: projectRoot 
  });
  
  console.log('\n✅ Build concluído com sucesso!');
  console.log('\n📤 Fazendo deploy no Vercel...');
  
  // Deploy com Vercel CLI
  const deployCommand = `npx vercel --prod --yes \
    --env NEXT_PUBLIC_SUPABASE_URL="${envVars.NEXT_PUBLIC_SUPABASE_URL}" \
    --env NEXT_PUBLIC_SUPABASE_ANON_KEY="${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
    --env SUPABASE_SERVICE_ROLE_KEY="${envVars.SUPABASE_SERVICE_ROLE_KEY}" \
    --env NEXTAUTH_URL="https://support-system-tau.vercel.app" \
    --env NEXTAUTH_SECRET="${envVars.NEXTAUTH_SECRET}" \
    --env JWT_SECRET="${envVars.JWT_SECRET}"`;
  
  const result = execSync(deployCommand, {
    cwd: projectRoot,
    encoding: 'utf8'
  });
  
  console.log(result);
  
  // Extrair URL do deploy
  const urlMatch = result.match(/https:\/\/[^\s]+\.vercel\.app/);
  if (urlMatch) {
    console.log('\n✨ Deploy concluído com sucesso!');
    console.log(`🌐 URL de produção: ${urlMatch[0]}`);
    console.log(`\n📝 Próximos passos:`);
    console.log(`1. Acesse: ${urlMatch[0]}/login`);
    console.log(`2. Faça login com: admin@example.com / admin123`);
    console.log(`3. Teste o gerenciamento de usuários em: ${urlMatch[0]}/dashboard/users`);
  }
  
} catch (error) {
  console.error('\n❌ Erro durante o deploy:', error.message);
  process.exit(1);
}