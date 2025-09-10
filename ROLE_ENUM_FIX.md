# Correção do Erro de ENUM para Roles Customizadas

## 🚨 Problema Identificado
Erro ao cadastrar usuário com role customizada (ex: "dev"):
```
invalid input value for enum user_role: "dev"
```

## 🔍 Causa do Problema
A tabela `users` no Supabase usa um tipo ENUM `user_role` que só aceita valores predefinidos:
- `admin`
- `analyst`  
- `user`

Quando tentamos inserir uma role customizada como "dev", o PostgreSQL rejeita porque não está no ENUM.

## ✅ Solução Implementada

### 1. **Solução Temporária (Já Aplicada no Código)**
Modificamos a API `/api/users/route.ts` para:
- Mapear roles customizadas para `'user'` no campo ENUM
- Armazenar a role real em um novo campo `role_name`
- Retornar sempre `role_name` quando disponível

```typescript
// Ao criar usuário:
const systemRoles = ['admin', 'analyst', 'user']
const enumRole = systemRoles.includes(role) ? role : 'user'

// Inserir no banco:
role: enumRole,        // 'user' para roles customizadas
role_name: role,       // 'dev' (role real)
```

### 2. **Alteração Necessária no Banco de Dados**

#### Opção A: Adicionar coluna `role_name` (RECOMENDADO - Menos invasivo)
Execute este SQL no Supabase:

```sql
-- Adicionar coluna para roles customizadas
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role_name VARCHAR(50);

-- Copiar valores existentes
UPDATE users 
SET role_name = role::TEXT 
WHERE role_name IS NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_users_role_name ON users(role_name);
```

#### Opção B: Migrar de ENUM para VARCHAR (Mais definitivo)
Execute o arquivo `/sql/migrate_role_to_varchar.sql` se preferir eliminar o ENUM completamente.

## 📋 Passos para Aplicar a Correção

### 1. **No Supabase Dashboard:**
1. Acesse seu projeto no Supabase
2. Vá para o SQL Editor
3. Execute o script da **Opção A** acima
4. Confirme que a coluna foi criada

### 2. **Testar a Solução:**
1. Tente cadastrar um usuário com role customizada (ex: "dev")
2. Verifique se o cadastro foi bem-sucedido
3. Confirme que o usuário aparece com a role correta na listagem

## 🔄 Como Funciona Após a Correção

1. **Cadastro de Usuário com Role Customizada:**
   - Frontend envia: `{ role: "dev" }`
   - API salva: `{ role: "user", role_name: "dev" }`
   - Listagem mostra: `"dev"` (usa role_name)

2. **Cadastro de Usuário com Role Padrão:**
   - Frontend envia: `{ role: "admin" }`
   - API salva: `{ role: "admin", role_name: "admin" }`
   - Listagem mostra: `"admin"`

## 📊 Estrutura Final da Tabela

| Campo | Tipo | Descrição |
|-------|------|-----------|
| role | ENUM('admin','analyst','user') | Compatibilidade com ENUM |
| role_name | VARCHAR(50) | Role real incluindo customizadas |

## 🎯 Benefícios

1. **Compatibilidade Total:** Não quebra código existente
2. **Suporte a Roles Customizadas:** Aceita qualquer role criada
3. **Performance:** Índices garantem consultas rápidas
4. **Reversível:** Pode voltar atrás se necessário

## ⚠️ Importante

- **Sempre execute o SQL no Supabase** antes de testar
- O código já está preparado para funcionar com ou sem a coluna `role_name`
- Se a coluna não existir, roles customizadas serão mapeadas para "user"

## 🚀 Próximos Passos

1. Execute o SQL no Supabase
2. Teste o cadastro com role customizada
3. Confirme que tudo funciona
4. (Opcional) Considere migração completa para VARCHAR no futuro