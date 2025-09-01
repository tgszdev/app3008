# 📧 Guia Completo: Configurar Gmail para Enviar Emails

## 🔐 Método Recomendado: Senha de App do Google

### Passo 1: Ativar Verificação em 2 Etapas

1. Acesse sua conta Google: https://myaccount.google.com
2. Clique em **"Segurança"** no menu lateral
3. Em **"Como fazer login no Google"**, clique em **"Verificação em duas etapas"**
4. Clique em **"Começar"** e siga as instruções
5. Configure seu telefone para receber códigos

### Passo 2: Gerar Senha de App

1. Ainda na página de Segurança: https://myaccount.google.com/security
2. Em **"Como fazer login no Google"**, clique em **"Senhas de app"**
   - Se não aparecer, certifique-se que a verificação em 2 etapas está ativada
3. Selecione o app: **"E-mail"**
4. Selecione o dispositivo: **"Outro (nome personalizado)"**
5. Digite um nome: **"Sistema de Suporte"**
6. Clique em **"Gerar"**
7. **COPIE A SENHA DE 16 CARACTERES** (aparece apenas uma vez!)
   - Exemplo: `abcd efgh ijkl mnop`

### Passo 3: Configurar no Sistema

Adicione ao arquivo `.env.local`:

```env
# Configuração de Email - Gmail com Senha de App
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # Senha de app (sem espaços)
EMAIL_FROM=seu-email@gmail.com
EMAIL_FROM_NAME=Sistema de Suporte Técnico
```

**IMPORTANTE**: Remova os espaços da senha de app! 
- Google mostra: `abcd efgh ijkl mnop`
- Você deve usar: `abcdefghijklmnop`

## 🔧 Alternativa: Gmail com OAuth2 (Mais Complexo)

Se preferir usar OAuth2 (mais seguro para produção):

### Passo 1: Criar Projeto no Google Cloud

1. Acesse: https://console.cloud.google.com
2. Crie um novo projeto ou selecione existente
3. Ative a **Gmail API**:
   - Menu → APIs e Serviços → Biblioteca
   - Pesquise "Gmail API"
   - Clique em "Ativar"

### Passo 2: Criar Credenciais OAuth2

1. Menu → APIs e Serviços → Credenciais
2. Clique em **"Criar credenciais"** → **"ID do cliente OAuth"**
3. Configure a tela de consentimento primeiro se necessário
4. Tipo de aplicativo: **"Aplicativo da Web"**
5. Adicione URI de redirecionamento: `http://localhost:3000/api/auth/callback/google`
6. Copie o **Client ID** e **Client Secret**

### Passo 3: Configurar no Sistema

```env
# Configuração OAuth2 Gmail
EMAIL_SERVICE=gmail-oauth2
GMAIL_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=seu-client-secret
GMAIL_REFRESH_TOKEN=seu-refresh-token
EMAIL_FROM=seu-email@gmail.com
EMAIL_FROM_NAME=Sistema de Suporte Técnico
```

## 📝 Implementação no Código

### 1. Instalar Dependência

```bash
cd /home/user/webapp
npm install nodemailer
```

### 2. Criar/Atualizar arquivo de configuração de email

Crie o arquivo `/src/lib/email-config.ts`:

```typescript
import nodemailer from 'nodemailer'

// Criar transporter baseado na configuração
export function createEmailTransporter() {
  const emailService = process.env.EMAIL_SERVICE || 'smtp'

  if (emailService === 'smtp') {
    // Configuração SMTP (Gmail com senha de app)
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS?.replace(/\s/g, '') // Remove espaços da senha
      }
    })
  }

  throw new Error(`Email service ${emailService} not configured`)
}

// Função para enviar email
export async function sendEmail({
  to,
  subject,
  html,
  text
}: {
  to: string
  subject: string
  html: string
  text: string
}) {
  try {
    const transporter = createEmailTransporter()
    
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text,
      html
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email enviado:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return { success: false, error }
  }
}
```

### 3. Testar Envio de Email

Crie um endpoint de teste `/src/app/api/test-email/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-config'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Enviar email de teste
    const result = await sendEmail({
      to: session.user.email, // Envia para o próprio usuário
      subject: 'Teste de Email - Sistema de Suporte',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Teste de Email Funcionando! ✅</h2>
          <p>Olá ${session.user.name},</p>
          <p>Este é um email de teste do Sistema de Suporte Técnico.</p>
          <p>Se você está recebendo este email, significa que a configuração está correta!</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Enviado em: ${new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      `,
      text: `
        Teste de Email Funcionando!
        
        Olá ${session.user.name},
        
        Este é um email de teste do Sistema de Suporte Técnico.
        Se você está recebendo este email, significa que a configuração está correta!
        
        Enviado em: ${new Date().toLocaleString('pt-BR')}
      `
    })

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email enviado com sucesso! Verifique sua caixa de entrada.' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao enviar email. Verifique as configurações.' 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Erro:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}
```

## 🧪 Como Testar

### 1. Via Interface (Recomendado)

1. Faça login no sistema
2. Acesse: `/dashboard/settings/notifications`
3. Ative **"Email"**
4. Clique em **"Enviar Notificação de Teste"**

### 2. Via API (Desenvolvedor)

```bash
# Fazer login primeiro e pegar o cookie de sessão
curl -X POST http://localhost:3000/api/test-email \
  -H "Cookie: seu-cookie-de-sessao"
```

### 3. Via Código (Debug)

```javascript
// No console do navegador (logado)
fetch('/api/test-email', {
  method: 'POST',
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)
```

## ⚠️ Possíveis Problemas e Soluções

### Erro: "Username and Password not accepted"

**Causa**: Usando senha normal ao invés de senha de app
**Solução**: Gerar senha de app seguindo os passos acima

### Erro: "Invalid login: 534-5.7.9"

**Causa**: Acesso menos seguro bloqueado
**Soluções**:
1. Use senha de app (recomendado)
2. Ou ative "Acesso a app menos seguro" (não recomendado):
   - https://myaccount.google.com/lesssecureapps

### Erro: "Connection timeout"

**Causa**: Firewall ou porta bloqueada
**Soluções**:
1. Tente porta 465 com `SMTP_SECURE=true`
2. Ou porta 587 com `SMTP_SECURE=false`
3. Verifique firewall/antivírus

### Emails indo para Spam

**Soluções**:
1. Configure SPF/DKIM no seu domínio
2. Use um email com domínio próprio
3. Evite palavras que ativam filtros de spam
4. Adicione texto alternativo (plain text)

## 🚀 Configuração para Produção (Vercel)

### 1. Adicionar Variáveis no Vercel

1. Acesse: https://vercel.com/[seu-usuario]/[seu-projeto]/settings/environment-variables
2. Adicione cada variável:
   - `EMAIL_SERVICE` = `smtp`
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `SMTP_SECURE` = `false`
   - `SMTP_USER` = `seu-email@gmail.com`
   - `SMTP_PASS` = `suasenhadoapp` (sem espaços!)
   - `EMAIL_FROM` = `seu-email@gmail.com`
   - `EMAIL_FROM_NAME` = `Sistema de Suporte`

### 2. Limites do Gmail

**Limites de envio gratuitos:**
- **500 emails por dia** (conta normal)
- **2000 emails por dia** (Google Workspace)
- **Máximo 500 destinatários** por email

**Para maior volume, considere:**
- SendGrid (100 emails/dia grátis)
- Resend (100 emails/dia grátis)
- Amazon SES (62,000 emails/mês grátis)
- Mailgun (5,000 emails/mês grátis)

## 📋 Checklist de Configuração

- [ ] Ativei verificação em 2 etapas no Google
- [ ] Gerei senha de app de 16 caracteres
- [ ] Adicionei configurações no `.env.local`
- [ ] Removi espaços da senha de app
- [ ] Instalei nodemailer (`npm install nodemailer`)
- [ ] Testei envio de email
- [ ] Email chegou na caixa de entrada
- [ ] Configurei variáveis no Vercel

## 🔒 Dicas de Segurança

1. **NUNCA** commite senhas no git
2. **SEMPRE** use `.env.local` para desenvolvimento
3. **USE** senha de app, não sua senha real
4. **CONFIGURE** variáveis de ambiente no Vercel
5. **MONITORE** uso para não exceder limites
6. **CONSIDERE** serviços profissionais para produção

---

**Última atualização**: 01/09/2025
**Testado com**: Gmail + Senha de App
**Status**: ✅ Funcionando em produção