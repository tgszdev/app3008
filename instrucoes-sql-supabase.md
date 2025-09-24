# 🔧 INSTRUÇÕES PARA EXECUTAR SQL NO SUPABASE

## 📋 **SQL PARA EXECUTAR NO SUPABASE DASHBOARD**

Acesse: https://supabase.com/dashboard/project/eyfvvximmeqmwdfqzqov/sql

### **1. Adicionar Colunas à Tabela Categories**

```sql
-- Adicionar coluna context_id
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS context_id UUID REFERENCES contexts(id) ON DELETE CASCADE;

-- Adicionar coluna is_global
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;

-- Adicionar coluna parent_category_id
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
```

### **2. Criar Índices para Performance**

```sql
-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_categories_context_id ON categories(context_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_global ON categories(is_global);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_category_id);
```

### **3. Atualizar Categorias Existentes**

```sql
-- Atualizar categorias existentes para serem globais
UPDATE categories 
SET is_global = true, context_id = NULL 
WHERE context_id IS NULL;
```

### **4. Criar Funções Úteis**

```sql
-- Função para verificar se categoria pode ser usada em contexto
CREATE OR REPLACE FUNCTION can_use_category_in_context(
  category_id UUID,
  target_context_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Categorias globais podem ser usadas em qualquer contexto
  IF EXISTS (
    SELECT 1 FROM categories 
    WHERE id = category_id AND is_global = true
  ) THEN
    RETURN true;
  END IF;
  
  -- Categorias específicas só podem ser usadas no seu contexto
  IF EXISTS (
    SELECT 1 FROM categories 
    WHERE id = category_id AND context_id = target_context_id
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;
```

### **5. Criar View para Consultas**

```sql
-- View para facilitar consultas
CREATE OR REPLACE VIEW categories_with_context AS
SELECT 
  c.*,
  ctx.name as context_name,
  ctx.type as context_type,
  ctx.slug as context_slug,
  parent.name as parent_category_name
FROM categories c
LEFT JOIN contexts ctx ON c.context_id = ctx.id
LEFT JOIN categories parent ON c.parent_category_id = parent.id;
```

### **6. Configurar RLS (Row Level Security)**

```sql
-- Habilitar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy para usuários matrix (podem ver todas as categorias)
CREATE POLICY "Matrix users can view all categories" ON categories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'matrix'
    )
  );

-- Policy para usuários context (podem ver categorias globais + do seu contexto)
CREATE POLICY "Context users can view global and their context categories" ON categories
  FOR SELECT
  TO authenticated
  USING (
    is_global = true 
    OR context_id = (
      SELECT users.context_id 
      FROM users 
      WHERE users.id = auth.uid()
    )
  );

-- Policy para criação (apenas admins)
CREATE POLICY "Admins can create categories" ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy para atualização (apenas admins)
CREATE POLICY "Admins can update categories" ON categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy para exclusão (apenas admins)
CREATE POLICY "Admins can delete categories" ON categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
```

### **7. Criar Trigger para updated_at**

```sql
-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();
```

## 🎯 **ORDEM DE EXECUÇÃO**

1. **Execute o SQL 1** (Adicionar colunas)
2. **Execute o SQL 2** (Criar índices)
3. **Execute o SQL 3** (Atualizar categorias existentes)
4. **Execute o SQL 4** (Criar funções)
5. **Execute o SQL 5** (Criar view)
6. **Execute o SQL 6** (Configurar RLS)
7. **Execute o SQL 7** (Criar trigger)

## ✅ **VERIFICAÇÃO**

Após executar todos os SQLs, execute este para verificar:

```sql
-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'categories' 
ORDER BY ordinal_position;

-- Verificar categorias existentes
SELECT id, name, is_global, context_id, parent_category_id 
FROM categories 
LIMIT 5;
```

## 🚨 **IMPORTANTE**

- Execute um SQL por vez
- Verifique se não há erros antes de continuar
- Faça backup antes de executar (opcional)
- Teste as APIs após a execução
