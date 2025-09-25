# 🔧 CORREÇÃO DEFINITIVA RLS

## 🎯 **PROBLEMA IDENTIFICADO:**
```
infinite recursion detected in policy for relation "users"
```

## 📋 **SOLUÇÃO:**

### 1. **Acesse o Supabase Dashboard:**
- URL: https://supabase.com/dashboard
- Projeto: eyfvvximmeqmwdfqzqov

### 2. **Execute o SQL abaixo no SQL Editor:**

```sql
-- CORREÇÃO DEFINITIVA RLS - EVITAR RECURSÃO INFINITA

-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can view users" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can view categories" ON categories;
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can view global categories" ON categories;

-- 2. CRIAR POLÍTICA SIMPLES PARA USERS (SEM RECURSÃO)
CREATE POLICY "Users can view their own data" ON users
FOR SELECT
USING (id = auth.uid());

-- 3. CRIAR POLÍTICA SIMPLES PARA CATEGORIAS
CREATE POLICY "Users can view categories" ON categories
FOR SELECT
USING (
  -- Categorias globais são visíveis para todos
  is_global = true
  OR
  -- Categorias específicas são visíveis para usuários do contexto
  (
    context_id IS NOT NULL 
    AND context_id = (
      SELECT context_id 
      FROM users 
      WHERE id = auth.uid()
    )
  )
);

-- 4. VERIFICAR POLÍTICAS CRIADAS
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
1. Execute o debug: `node debug-completo-categorias.mjs`
2. Verifique os logs do Vercel
3. Verifique o console do navegador
