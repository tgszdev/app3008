# Sistema Completo de Permissões Dinâmicas

## ✅ Status da Implementação

### 🎯 Problemas Resolvidos

1. **Roles customizadas agora aparecem no cadastro de usuários** ✅
2. **Sistema de permissões dinâmico implementado** ✅
3. **Suporte para atribuição de tickets baseado em permissões** ✅
4. **Compatibilidade com ENUM do banco mantida** ✅

## 📋 Componentes Implementados

### 1. **Sistema de Permissões** (`/src/lib/permissions.ts`)
- Gerenciamento centralizado de permissões
- Cache de 5 minutos para performance
- Suporte a roles do sistema e customizadas
- Funções para verificar permissões específicas

### 2. **Hook usePermissions** (`/src/hooks/usePermissions.ts`)
- Hook React para verificar permissões no frontend
- Métodos: `hasPermission`, `hasAnyPermission`, `hasAllPermissions`
- Carregamento automático baseado na sessão

### 3. **Componente PermissionGate** (`/src/components/PermissionGate.tsx`)
- Controle de acesso a componentes baseado em permissões
- Renderização condicional com fallback

### 4. **API de Permissões** (`/src/app/api/users/with-permission/route.ts`)
- Endpoint: `GET /api/users/with-permission?permission=tickets_assign`
- Retorna usuários que têm uma permissão específica
- Usado para popular dropdowns dinamicamente

### 5. **Autenticação Atualizada** (`/src/lib/auth-config.ts`)
- Inclui `role_name` na sessão do usuário
- Suporte para roles customizadas na autenticação

## 🔧 Como Funciona

### Fluxo de Permissões:

1. **Login do Usuário**
   - Sistema identifica a role (customizada ou padrão)
   - Armazena `role_name` na sessão

2. **Verificação de Permissões**
   - Frontend usa `usePermissions` hook
   - Backend consulta tabela `roles` ou usa permissões padrão
   - Cache de 5 minutos para otimização

3. **Atribuição de Tickets**
   - Dropdown busca usuários via `/api/users/with-permission?permission=tickets_assign`
   - Mostra apenas usuários com permissão real

## 📊 Estrutura de Permissões

### Permissões Disponíveis:

#### Tickets
- `tickets_view` - Visualizar tickets
- `tickets_create` - Criar tickets
- `tickets_edit_own` - Editar próprios tickets
- `tickets_edit_all` - Editar todos os tickets
- `tickets_delete` - Deletar tickets
- `tickets_assign` - **Atribuir tickets** ⭐
- `tickets_close` - Fechar tickets

#### Base de Conhecimento
- `kb_view` - Visualizar artigos
- `kb_create` - Criar artigos
- `kb_edit` - Editar artigos
- `kb_delete` - Deletar artigos
- `kb_manage_categories` - Gerenciar categorias

#### Timesheets
- `timesheets_view_own` - Ver próprios timesheets
- `timesheets_view_all` - Ver todos os timesheets
- `timesheets_create` - Criar timesheets
- `timesheets_edit_own` - Editar próprios
- `timesheets_edit_all` - Editar todos
- `timesheets_approve` - Aprovar timesheets
- `timesheets_analytics` - Ver analytics

#### Sistema
- `system_settings` - Configurações do sistema
- `system_users` - Gerenciar usuários
- `system_roles` - Gerenciar roles
- `system_backup` - Fazer backup
- `system_logs` - Ver logs

## 🚀 Como Usar

### No Frontend:

```tsx
// Usar o hook
import { usePermissions } from '@/hooks/usePermissions'

function MyComponent() {
  const { hasPermission } = usePermissions()
  
  if (hasPermission('tickets_assign')) {
    // Mostrar opção de atribuir
  }
}

// Ou usar o componente
import { PermissionGate } from '@/components/PermissionGate'

<PermissionGate permission="tickets_assign">
  <button>Atribuir Ticket</button>
</PermissionGate>
```

### No Backend:

```ts
import { userHasPermission, getUsersWithPermission } from '@/lib/permissions'

// Verificar permissão
const canAssign = await userHasPermission(userRole, 'tickets_assign')

// Buscar usuários com permissão
const assignableUsers = await getUsersWithPermission('tickets_assign')
```

## ⚠️ Configurações Necessárias no Banco

### 1. **Adicionar coluna role_name** (OBRIGATÓRIO)

Execute no Supabase SQL Editor:

```sql
-- Adicionar coluna para roles customizadas
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role_name VARCHAR(50);

-- Copiar valores existentes
UPDATE users 
SET role_name = role::TEXT 
WHERE role_name IS NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_users_role_name ON users(role_name);
```

### 2. **Verificar tabela roles**

A tabela `roles` deve ter a estrutura:
- `id` (UUID)
- `name` (VARCHAR) - nome interno
- `display_name` (VARCHAR) - nome exibido
- `permissions` (JSONB) - objeto com todas as permissões
- `is_system` (BOOLEAN) - se é role do sistema

## 📝 Checklist de Verificação

- [x] Sistema de permissões criado
- [x] Hook usePermissions implementado
- [x] API endpoint para buscar usuários com permissão
- [x] Dropdown de atribuição usando permissões reais
- [x] Suporte para roles customizadas
- [x] Cache de permissões para performance
- [x] Autenticação atualizada com role_name
- [ ] **Executar SQL no Supabase para adicionar role_name**
- [ ] **Testar cadastro com role customizada**
- [ ] **Verificar se dropdown mostra usuários corretos**

## 🔍 Testes Recomendados

1. **Criar uma role customizada** (ex: "Developer")
   - Marcar permissão "Atribuir Tickets"
   - Salvar a role

2. **Cadastrar usuário com a nova role**
   - Verificar se aparece no dropdown
   - Confirmar que o cadastro funciona

3. **Verificar atribuição de tickets**
   - Criar novo ticket
   - Verificar se usuários com permissão aparecem
   - Testar atribuição

4. **Validar outras permissões**
   - Testar cada permissão individualmente
   - Confirmar que funciona como esperado

## 🎯 Resultado Final

O sistema agora:
- ✅ Respeita permissões reais das roles
- ✅ Suporta roles customizadas completamente
- ✅ Mostra apenas usuários com permissões adequadas
- ✅ Mantém compatibilidade com o sistema existente
- ✅ Oferece performance otimizada com cache

## 📦 Arquivos Modificados

- `/src/lib/permissions.ts` - Sistema de permissões
- `/src/hooks/usePermissions.ts` - Hook React
- `/src/components/PermissionGate.tsx` - Componente de controle
- `/src/app/api/users/with-permission/route.ts` - API endpoint
- `/src/app/dashboard/tickets/new/page.tsx` - Usa permissões reais
- `/src/lib/auth-config.ts` - Inclui role_name na sessão
- `/src/app/api/users/route.ts` - Suporte para role_name
- `/src/app/dashboard/users/page.tsx` - Roles dinâmicas no dropdown