# 🔧 Correção do Erro de Banco de Dados

## ❌ Erro Encontrado
```sql
ERROR: 42703: column timesheet_permissions.can_approve does not exist
```

## ✅ Solução

### 1. Execute o Script de Correção no Supabase

Acesse o editor SQL do Supabase e execute:

```sql
-- Adicionar colunas faltantes na tabela timesheet_permissions
ALTER TABLE timesheet_permissions 
ADD COLUMN IF NOT EXISTS can_submit BOOLEAN DEFAULT true;

ALTER TABLE timesheet_permissions 
ADD COLUMN IF NOT EXISTS can_approve BOOLEAN DEFAULT false;

-- Atualizar permissões existentes baseado no role do usuário
UPDATE timesheet_permissions tp
SET 
  can_submit = true,
  can_approve = CASE 
    WHEN u.role = 'admin' THEN true 
    ELSE false 
  END
FROM users u
WHERE tp.user_id = u.id;

-- Inserir permissões para usuários que ainda não têm
INSERT INTO timesheet_permissions (user_id, can_submit, can_approve)
SELECT 
  u.id,
  true,
  CASE WHEN u.role = 'admin' THEN true ELSE false END
FROM users u
LEFT JOIN timesheet_permissions tp ON u.id = tp.user_id
WHERE tp.id IS NULL;
```

### 2. Verificar a Estrutura

Após executar, verifique se as colunas foram criadas:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'timesheet_permissions'
ORDER BY ordinal_position;
```

Deve retornar:
- id
- user_id
- can_submit
- can_approve
- created_at
- updated_at

## 📋 Scripts Disponíveis

1. **Criação Completa**: `/sql/create_timesheets_tables.sql`
2. **Correção de Colunas**: `/sql/fix_timesheet_permissions.sql`

## ⚠️ Ordem de Execução

1. Se a tabela não existe, execute primeiro: `create_timesheets_tables.sql`
2. Se a tabela existe mas faltam colunas, execute: `fix_timesheet_permissions.sql`

## ✅ Após a Correção

O sistema de apontamentos deve funcionar normalmente:
- Usuários podem adicionar apontamentos
- Admins podem aprovar/rejeitar
- Permissões funcionam corretamente