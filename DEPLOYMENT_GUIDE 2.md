# 📋 GUIA DE IMPLANTAÇÃO - SISTEMA DE SESSÃO ÚNICA

## ✅ Status Atual

### Etapa 1: Configuração do Banco de Dados (CONCLUÍDA ✅)
- Script SQL executado no Supabase
- Tabelas criadas: sessions, accounts, users, verification_tokens
- Trigger configurado para invalidar sessões antigas
- Sistema pronto para uso

### Etapa 2: Código Atualizado (CONCLUÍDA ✅)
- NextAuth configurado com SupabaseAdapter
- Estratégia mudada de JWT para database sessions
- API de verificação criada em `/api/verify-session-setup`
- Código enviado para o GitHub com sucesso

## 🚀 Próximos Passos no Vercel

### Passo 1: Verificar Status do Banco de Dados
1. Acesse o Supabase SQL Editor
2. Cole e execute o script `sql/check_database_status.sql`
3. Verifique se todos os itens mostram "✅"

### Passo 2: Configurar Variável de Ambiente no Vercel
1. Acesse seu projeto no Vercel Dashboard
2. Vá em **Settings → Environment Variables**
3. Adicione a seguinte variável:
   ```
   Nome: SUPABASE_SERVICE_ROLE_KEY
   Valor: [Copie de Supabase → Settings → API → service_role key]
   ```
4. Certifique-se que já existem:
   - `NEXT_PUBLIC_SUPABASE_URL` ✅
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
   - `ENABLE_SINGLE_SESSION=true` ✅
   - `NEXTAUTH_SECRET` ✅

### Passo 3: Deploy Automático
O Vercel detectará automaticamente o push no GitHub e fará o deploy.

### Passo 4: Verificar Funcionamento
Após o deploy completar:

1. **Teste via API de Verificação:**
   ```
   https://seu-app.vercel.app/api/verify-session-setup
   ```
   
2. **Teste Manual:**
   - Faça login no aplicativo
   - Abra outro navegador (ou aba privada)
   - Faça login com o mesmo usuário
   - Volte ao primeiro navegador e atualize
   - Você deve ser deslogado automaticamente

## 🔍 Como o Sistema Funciona

### Fluxo de Sessão Única:
1. **Usuário faz login** → NextAuth cria sessão no banco
2. **Trigger PostgreSQL ativado** → Invalida sessões antigas do mesmo usuário
3. **Apenas nova sessão permanece** → Usuário anterior é deslogado
4. **Verificação em cada request** → NextAuth valida sessão no banco

### Características:
- ✅ **100% automático** - Sem necessidade de código adicional
- ✅ **Atômico** - Garantido pelo PostgreSQL
- ✅ **Seguro** - Usa service_role key do Supabase
- ✅ **Performático** - Índices otimizados no banco

## 🐛 Troubleshooting

### Se o sistema não estiver funcionando:

1. **Verifique o banco de dados:**
   ```sql
   -- Execute no Supabase SQL Editor
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_enforce_single_session';
   ```

2. **Verifique as variáveis de ambiente no Vercel:**
   - Todas devem estar configuradas
   - Especialmente `SUPABASE_SERVICE_ROLE_KEY`

3. **Verifique os logs do Vercel:**
   - Functions → Logs
   - Procure por erros de autenticação

4. **Teste o trigger manualmente:**
   - Use a seção comentada em `sql/check_database_status.sql`

## 📊 Monitoramento

### Query para ver sessões ativas:
```sql
SELECT 
    s."userId",
    u.email,
    s."sessionToken",
    s.expires,
    s."createdAt"
FROM public.sessions s
LEFT JOIN public.users u ON s."userId" = u.id
WHERE s.expires > NOW()
ORDER BY s."createdAt" DESC;
```

### Query para limpar sessões expiradas:
```sql
DELETE FROM public.sessions 
WHERE expires < NOW();
```

## ✨ Resultado Esperado

Após a configuração completa:
- ✅ Login único por usuário funcionando
- ✅ Logout automático em dispositivos anteriores
- ✅ Sem alteração visual no aplicativo
- ✅ Performance mantida
- ✅ Segurança aprimorada

## 📝 Notas Importantes

1. **Não é necessário servidor local** - Tudo funciona via Vercel
2. **Deploy automático** - Push no GitHub dispara deploy
3. **Banco gerenciado** - Supabase cuida da infraestrutura
4. **Sem downtime** - Sistema funciona durante a migração