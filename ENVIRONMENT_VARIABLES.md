# Variáveis de Ambiente - Sistema de Suporte

## ⚠️ IMPORTANTE: Configuração no Vercel

As variáveis de ambiente devem ser configuradas **diretamente no painel da Vercel**, não no arquivo `vercel.json`.

### Como configurar:

1. Acesse o painel da Vercel: https://vercel.com/dashboard
2. Selecione o projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione cada variável abaixo

## 📋 Variáveis Obrigatórias:

### 1. **NEXTAUTH_URL**
- **Descrição**: URL base da aplicação
- **Exemplo Produção**: `https://seu-dominio.vercel.app` ou `https://www.ithostbr.tech`
- **Exemplo Local**: `http://localhost:3000`
- **Importante**: Sem barra final (/)

### 2. **NEXTAUTH_SECRET**
- **Descrição**: Secret para criptografia de sessões
- **Como gerar**: 
  ```bash
  openssl rand -base64 32
  ```
- **Exemplo**: `mQ6HpfHvDCJqTqF2nEGDH+8kSbqUqKcqhWxmbmJj8aE=`

### 3. **SUPABASE_URL**
- **Descrição**: URL do projeto Supabase
- **Onde encontrar**: Painel Supabase → Settings → API
- **Exemplo**: `https://xyzcompany.supabase.co`

### 4. **SUPABASE_ANON_KEY**
- **Descrição**: Chave pública/anônima do Supabase
- **Onde encontrar**: Painel Supabase → Settings → API → Project API keys → anon/public
- **Exemplo**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 5. **SUPABASE_SERVICE_ROLE_KEY**
- **Descrição**: Chave de serviço do Supabase (acesso total)
- **Onde encontrar**: Painel Supabase → Settings → API → Project API keys → service_role
- **Exemplo**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **⚠️ ATENÇÃO**: Nunca exponha esta chave no frontend!

## 🔧 Configuração por Ambiente:

No Vercel, você pode configurar diferentes valores para cada ambiente:

- **Production**: Valores de produção
- **Preview**: Valores para branches de preview
- **Development**: Valores para desenvolvimento local

## ✅ Verificação:

Após configurar, você pode verificar se as variáveis estão corretas:

1. Faça um novo deploy
2. Verifique os logs de build no Vercel
3. Teste o login na aplicação

## 🚨 Erros Comuns:

### "Environment Variable references Secret which does not exist"
- **Causa**: O arquivo `vercel.json` está tentando referenciar secrets com `@`
- **Solução**: Remova as referências do `vercel.json` e configure direto no painel

### "NEXTAUTH_URL is not set"
- **Causa**: Variável não configurada ou com nome errado
- **Solução**: Verifique se o nome está exatamente como `NEXTAUTH_URL` (maiúsculas)

### Erro 500 no login
- **Causa**: Geralmente `NEXTAUTH_SECRET` não configurado
- **Solução**: Gere um novo secret e configure no Vercel

## 📝 Notas:

- As variáveis são case-sensitive (diferenciam maiúsculas/minúsculas)
- Não use aspas ao adicionar os valores no painel da Vercel
- Após adicionar/modificar variáveis, faça um novo deploy para aplicar as mudanças
- Para desenvolvimento local, use um arquivo `.env.local` (não comitar no git)