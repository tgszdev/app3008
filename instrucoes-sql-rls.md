# 🔧 INSTRUÇÕES PARA CORRIGIR RLS

## 🎯 **PROBLEMA IDENTIFICADO:**
O frontend não consegue acessar os dados do usuário devido a políticas RLS restritivas na tabela `users`.

## 📋 **SOLUÇÃO:**

### 1. **Acesse o Supabase Dashboard:**
- URL: https://supabase.com/dashboard
- Projeto: eyfvvximmeqmwdfqzqov

### 2. **Execute o SQL abaixo no SQL Editor:**

```sql
-- Corrigir políticas RLS para users
-- Permitir que usuários possam ver seus próprios dados

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can view users" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Criar nova política para users
CREATE POLICY "Users can view their own data" ON users
FOR SELECT
USING (
  -- Usuários podem ver seus próprios dados
  id = auth.uid()
  OR
  -- Usuários matrix podem ver todos os usuários
  (
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'matrix'
    )
  )
);

-- Corrigir políticas RLS para categorias
-- Permitir que usuários context vejam suas categorias específicas + globais

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view categories" ON categories;
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can view global categories" ON categories;

-- Criar nova política para categorias
CREATE POLICY "Users can view categories" ON categories
FOR SELECT
USING (
  -- Categorias globais são visíveis para todos
  is_global = true
  OR
  -- Categorias específicas são visíveis para usuários do contexto
  (
    context_id IS NOT NULL 
    AND context_id IN (
      SELECT context_id 
      FROM users 
      WHERE id = auth.uid()
    )
  )
  OR
  -- Usuários matrix podem ver todas as categorias
  (
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'matrix'
    )
  )
);

-- Verificar se as políticas foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('users', 'categories')
ORDER BY tablename, policyname;
```

### 3. **Teste a correção:**
Após executar o SQL, teste no frontend:
1. Faça logout
2. Faça login novamente
3. Vá para "Novo Chamado"
4. Verifique se as categorias aparecem

## 🎯 **RESULTADO ESPERADO:**
O usuário `agro@agro.com.br` deveria ver:
- **Suporte Agro** (Luft Agro)
- **Agro Financeiro** (Luft Agro)

## 📋 **SE AINDA NÃO FUNCIONAR:**
1. Verifique os logs do Vercel
2. Verifique o console do navegador
3. Execute o script de teste: `node debug-categorias-frontend.mjs`
