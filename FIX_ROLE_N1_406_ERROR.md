# 🔧 Guia de Correção do Erro 406 na Role N1

## 📋 Problema Identificado

O sistema está retornando erro **406 (Not Acceptable)** ao tentar buscar a role "n1" do banco de dados, mesmo que ela exista. Isso é causado por políticas de RLS (Row Level Security) no Supabase.

### Erro Específico:
```
GET https://xxx.supabase.co/rest/v1/roles?select=permissions&name=eq.n1 406 (Not Acceptable)
code: 'PGRST116'
message: 'Cannot coerce the result to a single JSON object'
details: 'The result contains 0 rows'
```

## 🎯 Causa Raiz

1. **RLS (Row Level Security)** está habilitado na tabela `roles`
2. As políticas atuais estão **bloqueando** a leitura de roles customizadas
3. O cliente está usando a chave **anon** que é afetada por RLS
4. A **service_role key** não está configurada ou não está sendo usada corretamente

## ✅ Soluções (Execute na Ordem)

### Solução 1: Desabilitar RLS Temporariamente (Mais Rápida)

Execute no **Supabase SQL Editor**:

```sql
-- Desabilitar RLS na tabela roles
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;

-- Verificar se funcionou
SELECT name, display_name FROM public.roles WHERE name = 'n1';
```

**⚠️ Nota:** Esta é uma solução temporária. RLS é importante para segurança.

### Solução 2: Corrigir as Políticas RLS (Recomendada)

Execute o script completo no **Supabase SQL Editor**:

```sql
-- Limpar políticas antigas
DROP POLICY IF EXISTS "Roles podem ser lidas por usuários autenticados" ON public.roles;
DROP POLICY IF EXISTS "Apenas admins podem modificar roles" ON public.roles;
DROP POLICY IF EXISTS "roles_select_policy" ON public.roles;
DROP POLICY IF EXISTS "permitir_leitura_roles" ON public.roles;
DROP POLICY IF EXISTS "permitir_modificacao_roles_admin" ON public.roles;

-- Criar política permissiva para leitura
CREATE POLICY "allow_public_read_roles" 
ON public.roles 
FOR SELECT 
USING (true);  -- Permite que TODOS leiam (necessário para o sistema)

-- Criar política para admin gerenciar
CREATE POLICY "allow_admin_manage_roles" 
ON public.roles 
FOR INSERT, UPDATE, DELETE
USING (
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE role = 'admin'
  )
);

-- Re-habilitar RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
```

### Solução 3: Configurar Service Role Key

1. **Obter a Service Role Key** no Supabase:
   - Vá para: **Supabase Dashboard** → **Settings** → **API**
   - Copie a **service_role key** (secret)

2. **Adicionar ao `.env.local`**:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...sua_chave_aqui
```

3. **Reiniciar a aplicação**:
```bash
npm run dev
```

## 🧪 Como Testar

### Teste 1: Via Script de Diagnóstico

```bash
# Execute o script de teste
node test-role-n1.mjs
```

Este script irá:
- Testar com cliente ANON (sujeito a RLS)
- Testar com cliente ADMIN (ignora RLS)
- Listar todas as roles disponíveis
- Mostrar diagnóstico completo

### Teste 2: Via SQL no Supabase

```sql
-- Verificar se RLS está ativo
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'roles';

-- Testar acesso direto
SELECT * FROM public.roles WHERE name = 'n1';

-- Ver todas as políticas
SELECT * FROM pg_policies WHERE tablename = 'roles';
```

### Teste 3: Na Aplicação

1. Faça login como usuário com role "n1"
2. Abra o Console do navegador (F12)
3. Verifique se ainda aparece o erro 406
4. Tente criar um ticket ou acessar funcionalidades

## 📝 Verificação Final

Execute este SQL para confirmar que tudo está funcionando:

```sql
-- Verificação completa
WITH role_check AS (
  SELECT 
    name,
    display_name,
    is_system,
    CASE 
      WHEN permissions IS NOT NULL THEN 'Configuradas'
      ELSE 'Vazias'
    END as status_permissions
  FROM public.roles
  WHERE name = 'n1'
),
rls_check AS (
  SELECT 
    rowsecurity as rls_enabled
  FROM pg_tables 
  WHERE tablename = 'roles'
),
policy_check AS (
  SELECT COUNT(*) as total_policies
  FROM pg_policies 
  WHERE tablename = 'roles'
)
SELECT 
  r.*,
  rl.rls_enabled,
  p.total_policies
FROM role_check r
CROSS JOIN rls_check rl
CROSS JOIN policy_check p;
```

## 🚨 Se Ainda Não Funcionar

1. **Verifique as credenciais** no `.env.local`
2. **Limpe o cache** do navegador e da aplicação
3. **Execute** o botão "Limpar Cache" no modal de gerenciamento de roles
4. **Considere recriar** a role n1:

```sql
-- Deletar e recriar a role
DELETE FROM public.roles WHERE name = 'n1';

INSERT INTO public.roles (name, display_name, permissions, is_system) 
VALUES (
  'n1',
  'Nível 1',
  '{
    "tickets_view": true,
    "tickets_create": true,
    "tickets_edit_own": true,
    "tickets_edit_all": false,
    "tickets_delete": false,
    "tickets_assign": true,
    "tickets_close": false,
    "kb_view": true,
    "kb_create": false,
    "kb_edit": false,
    "kb_delete": false,
    "kb_manage_categories": false,
    "timesheets_view_own": true,
    "timesheets_view_all": false,
    "timesheets_create": true,
    "timesheets_edit_own": true,
    "timesheets_edit_all": false,
    "timesheets_approve": false,
    "timesheets_analytics": false,
    "system_settings": false,
    "system_users": false,
    "system_roles": false,
    "system_backup": false,
    "system_logs": false
  }'::jsonb,
  false
);
```

## 💡 Dica Importante

Para evitar problemas futuros com RLS:
- Sempre use `supabaseAdmin` (com service_role key) para operações administrativas
- Use `supabase` (com anon key) apenas para operações do usuário
- Mantenha as políticas RLS simples e bem documentadas

## 📞 Suporte

Se o problema persistir após seguir todos os passos:
1. Verifique os logs do Supabase Dashboard
2. Confirme que a tabela `roles` existe e tem a estrutura correta
3. Verifique se há conflitos com outras políticas ou triggers