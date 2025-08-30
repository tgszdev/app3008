# 🔐 Guia Completo - Configuração das Credenciais

## 📍 Passo a Passo Visual no Supabase

### 1. Acessar as API Settings

```
Dashboard Supabase → Seu Projeto → Settings (⚙️) → API
```

### 2. Localizar e Copiar as 3 Credenciais

Na página de API Settings, você verá:

```
┌─────────────────────────────────────────────────────────┐
│ Configuration                                          │
├─────────────────────────────────────────────────────────┤
│ Project URL                                            │
│ https://xxxxxxxxxxx.supabase.co                        │
│ [Copy] ← Clique para copiar                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Project API keys                                       │
├─────────────────────────────────────────────────────────┤
│ anon public                                            │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...   │
│ [Copy] ← Clique para copiar                           │
├─────────────────────────────────────────────────────────┤
│ service_role secret [Reveal] ← Clique para mostrar    │
│ •••••••••••••••••••••••••••••••••••••••••••••••       │
│ [Copy] ← Aparece após clicar em Reveal                │
└─────────────────────────────────────────────────────────┘
```

## 📝 Configurar o .env.local

### Passo 1: Renomear o arquivo exemplo
```bash
# No terminal, na pasta do projeto
cp .env.local.example .env.local
```

### Passo 2: Editar o arquivo .env.local

Abra o arquivo `.env.local` e substitua os valores:

```env
# EXEMPLO DE COMO DEVE FICAR (com valores fictícios):

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MjM4NjQwMDAsImV4cCI6MTkzOTQ0MDAwMH0.1234567890abcdefghijklmnopqrstuvwxyz
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYyMzg2NDAwMCwiZXhwIjoxOTM5NDQwMDAwfQ.0987654321zyxwvutsrqponmlkjihgfedcba

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=gR7xK9mP3nQ5vT8yB2fL6jW4hN1sA0dC
JWT_SECRET=gR7xK9mP3nQ5vT8yB2fL6jW4hN1sA0dC
```

## 🔑 Gerar o NEXTAUTH_SECRET

### Opção 1: Usando OpenSSL (Linux/Mac/Windows com Git Bash)
```bash
openssl rand -base64 32
```

### Opção 2: Usando Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Opção 3: Gerador Online
Acesse: https://generate-secret.vercel.app/32

## ✅ Verificar se Está Correto

### 1. As chaves devem ter estas características:

- **NEXT_PUBLIC_SUPABASE_URL**: 
  - Começa com `https://`
  - Termina com `.supabase.co`
  - Tem cerca de 35-45 caracteres

- **NEXT_PUBLIC_SUPABASE_ANON_KEY**:
  - Começa com `eyJ`
  - Tem cerca de 200-300 caracteres
  - É uma string longa sem espaços

- **SUPABASE_SERVICE_ROLE_KEY**:
  - Também começa com `eyJ`
  - Tem cerca de 200-300 caracteres
  - É DIFERENTE da anon_key

- **NEXTAUTH_SECRET**:
  - Tem pelo menos 32 caracteres
  - É uma string aleatória

## 🚨 Checklist de Segurança

- [ ] O arquivo `.env.local` está no `.gitignore`? ✅ (já está)
- [ ] NUNCA commitar o `.env.local` no Git
- [ ] NUNCA expor a `SUPABASE_SERVICE_ROLE_KEY` no frontend
- [ ] Usar senhas fortes e diferentes para produção

## 🧪 Testar a Conexão

Após configurar, teste rodando:

```bash
npm run dev
```

Acesse http://localhost:3000 e tente fazer login.

Se der erro de conexão com Supabase, verifique:
1. As credenciais estão corretas?
2. O projeto Supabase está ativo?
3. O schema SQL foi executado com sucesso?

## 📤 Para Deploy no Vercel

Quando for fazer deploy, você precisará adicionar estas mesmas variáveis no Vercel:

1. Vá em: Settings → Environment Variables
2. Adicione cada variável uma por uma
3. Para produção, mude `NEXTAUTH_URL` para `https://seu-app.vercel.app`

## 🆘 Problemas Comuns

### "Invalid API key"
→ Verifique se copiou a chave completa, sem espaços extras

### "relation 'users' does not exist"
→ Execute o script SQL novamente no Supabase SQL Editor

### "NEXTAUTH_SECRET is not set"
→ Certifique-se de que gerou e adicionou o secret

### "Failed to fetch"
→ Verifique se a URL do Supabase está correta

---

💡 **Dica**: Guarde uma cópia segura das credenciais em um gerenciador de senhas!