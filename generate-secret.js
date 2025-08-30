#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔐 Gerador de Credenciais para o Sistema de Suporte\n');
console.log('Este script vai ajudar você a configurar o arquivo .env.local\n');

// Gerar secrets aleatórios
const nextAuthSecret = crypto.randomBytes(32).toString('base64');
const jwtSecret = crypto.randomBytes(32).toString('base64');

console.log('📝 Secrets gerados automaticamente:');
console.log('─'.repeat(50));
console.log(`NEXTAUTH_SECRET=${nextAuthSecret}`);
console.log(`JWT_SECRET=${jwtSecret}`);
console.log('─'.repeat(50));

console.log('\n📋 Agora vamos configurar as credenciais do Supabase...\n');

const questions = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    question: 'Cole a Project URL do Supabase (https://xxxxx.supabase.co): ',
    validate: (value) => value.startsWith('https://') && value.includes('.supabase.co')
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    question: 'Cole a Anon/Public Key (eyJhbGc...): ',
    validate: (value) => value.startsWith('eyJ') && value.length > 100
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    question: 'Cole a Service Role Key (eyJhbGc...): ',
    validate: (value) => value.startsWith('eyJ') && value.length > 100
  }
];

const credentials = {
  NEXTAUTH_URL: 'http://localhost:3000',
  NEXTAUTH_SECRET: nextAuthSecret,
  JWT_SECRET: jwtSecret
};

let currentQuestion = 0;

function askQuestion() {
  if (currentQuestion < questions.length) {
    const q = questions[currentQuestion];
    rl.question(q.question, (answer) => {
      const trimmedAnswer = answer.trim();
      
      if (!trimmedAnswer) {
        console.log('❌ Valor não pode estar vazio. Tente novamente.\n');
        askQuestion();
        return;
      }
      
      if (!q.validate(trimmedAnswer)) {
        console.log('❌ Formato inválido. Verifique o valor e tente novamente.\n');
        askQuestion();
        return;
      }
      
      credentials[q.key] = trimmedAnswer;
      console.log('✅ OK!\n');
      currentQuestion++;
      askQuestion();
    });
  } else {
    saveCredentials();
  }
}

function saveCredentials() {
  const envContent = `# ================================================
# SUPABASE - Configurações do Banco de Dados
# ================================================

NEXT_PUBLIC_SUPABASE_URL=${credentials.NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${credentials.NEXT_PUBLIC_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${credentials.SUPABASE_SERVICE_ROLE_KEY}

# ================================================
# NEXTAUTH - Configurações de Autenticação
# ================================================

NEXTAUTH_URL=${credentials.NEXTAUTH_URL}
NEXTAUTH_SECRET=${credentials.NEXTAUTH_SECRET}

# ================================================
# JWT - Token de Autenticação
# ================================================

JWT_SECRET=${credentials.JWT_SECRET}

# ================================================
# CONFIGURAÇÕES OPCIONAIS (configurar depois)
# ================================================

# Email Service (opcional)
EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=

# Push Notifications (opcional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Upload Service (opcional)
UPLOAD_URL=
UPLOAD_API_KEY=
UPLOAD_API_SECRET=
`;

  const envPath = path.join(__dirname, '.env.local');
  
  // Fazer backup se já existir
  if (fs.existsSync(envPath)) {
    const backupPath = path.join(__dirname, `.env.local.backup.${Date.now()}`);
    fs.copyFileSync(envPath, backupPath);
    console.log(`\n📦 Backup criado: ${backupPath}`);
  }
  
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Arquivo .env.local criado com sucesso!');
  console.log('\n🚀 Próximos passos:');
  console.log('1. Execute: npm run dev');
  console.log('2. Acesse: http://localhost:3000');
  console.log('3. Faça login com: admin@example.com / admin123');
  console.log('\n💡 Lembre-se de atualizar a senha do admin após o primeiro login!');
  
  rl.close();
}

// Iniciar o processo
console.log('Digite ou cole os valores quando solicitado:\n');
askQuestion();