# 🧪 CTS - Complete Test Suite: Sistema de Permissões V2.0

**Data:** 04 de Outubro de 2025  
**Duração Estimada:** 15-20 minutos  
**Tipo:** Teste Meticuloso e Agressivo  
**Cobertura:** Frontend + Backend + Banco de Dados  
**Objetivo:** Validar 100% das 72 permissões implementadas

---

## 📋 ÍNDICE

1. [Preparação do Ambiente](#fase-0-preparação)
2. [Teste de Migration](#fase-1-migration)
3. [Teste de Backend (APIs)](#fase-2-backend)
4. [Teste de Frontend (UI)](#fase-3-frontend)
5. [Teste de Segurança](#fase-4-segurança)
6. [Teste de Integridade](#fase-5-integridade)
7. [Validação Final](#fase-6-validação)

---

## 🎯 FASE 0: PREPARAÇÃO (2 minutos)

### **0.1 Criar Usuários de Teste**

#### **Script SQL:**
```sql
-- Executar no Supabase SQL Editor

-- 1. Criar usuário ADMIN
INSERT INTO users (id, email, name, password, role, user_type, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test_admin@test.com',
  'Test Admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCy', -- senha: password
  'admin',
  'matrix',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- 2. Criar usuário DEVELOPER
INSERT INTO users (id, email, name, password, role, user_type, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'test_developer@test.com',
  'Test Developer',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCy',
  'developer',
  'matrix',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- 3. Criar usuário ANALYST
INSERT INTO users (id, email, name, password, role, user_type, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'test_analyst@test.com',
  'Test Analyst',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCy',
  'analyst',
  'matrix',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- 4. Criar usuário USER
INSERT INTO users (id, email, name, password, role, user_type, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  'test_user@test.com',
  'Test User',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCy',
  'user',
  'matrix',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- 5. Verificar criação
SELECT id, email, name, role, user_type, created_at 
FROM users 
WHERE email LIKE 'test_%@test.com'
ORDER BY role;
```

**✅ Checkpoint:**
- [ ] 4 usuários criados
- [ ] Emails confirmados
- [ ] Roles corretas

---

### **0.2 Verificar Estado Atual dos Perfis**

```sql
-- Verificar quantas permissões cada perfil tem
SELECT 
  name,
  display_name,
  jsonb_object_keys(permissions) as permission_key,
  COUNT(*) OVER (PARTITION BY name) as total_permissions
FROM roles
ORDER BY name, permission_key;

-- Contar permissões por perfil
SELECT 
  name,
  display_name,
  jsonb_object_keys(permissions) as total_keys
FROM roles
GROUP BY name, display_name;
```

**✅ Checkpoint:**
- [ ] Admin tem 72 permissões (ou 24 se não migrado)
- [ ] Developer tem 72 permissões (ou 24 se não migrado)
- [ ] Analyst tem 72 permissões (ou 24 se não migrado)
- [ ] User tem 72 permissões (ou 24 se não migrado)

---

## 🔄 FASE 1: MIGRATION (3 minutos)

### **1.1 Backup Pré-Migration**

```sql
-- Criar backup da tabela roles
CREATE TABLE IF NOT EXISTS roles_backup_pre_v2 AS
SELECT * FROM roles;

-- Verificar backup
SELECT COUNT(*) as total_roles_backup FROM roles_backup_pre_v2;
```

**✅ Checkpoint:**
- [ ] Backup criado
- [ ] Contém 4+ perfis

---

### **1.2 Aplicar Migration via UI**

**Passos:**
1. Login como `test_admin@test.com` / `password`
2. Ir em: **Configurações → Gerenciar Perfis**
3. Observar console do navegador (F12)
4. Verificar log: `[ROLES MIGRATION] Perfis migrados:`
5. Clicar no botão: **🟢 Migration V2.0**
6. Confirmar popup
7. Aguardar mensagens de sucesso
8. Verificar toast: "Migration aplicada com sucesso!"
9. Verificar toast: "Cache limpo!"

**✅ Checkpoint:**
- [ ] Console mostra migration
- [ ] 4 perfis migrados
- [ ] 48 novas permissões adicionadas por perfil
- [ ] Nenhum erro no console
- [ ] Toast de sucesso apareceu

---

### **1.3 Validar Migration no Banco**

```sql
-- 1. Verificar se novas permissões existem
SELECT 
  name,
  display_name,
  permissions->>'tickets_create_internal' as tickets_internal,
  permissions->>'organizations_view' as org_view,
  permissions->>'sla_view' as sla_view,
  permissions->>'satisfaction_view_results' as satisfaction,
  permissions->>'comments_moderate' as comments,
  permissions->>'reports_export' as reports,
  permissions->>'api_access' as api,
  permissions->>'notifications_send_broadcast' as notifications
FROM roles
ORDER BY name;

-- 2. Contar total de permissões por perfil
SELECT 
  name,
  jsonb_object_keys(permissions) as permission,
  COUNT(*) OVER (PARTITION BY name) as total_permissions
FROM roles
GROUP BY name, permissions
ORDER BY name;

-- 3. Verificar valores específicos por perfil
-- ADMIN (deve ter TODAS = true)
SELECT name, COUNT(*) FILTER (WHERE value::text = 'true') as true_count
FROM roles, jsonb_each(permissions)
WHERE name = 'admin'
GROUP BY name;
-- Esperado: 72 (todas true)

-- DEVELOPER (deve ter mix)
SELECT name, COUNT(*) FILTER (WHERE value::text = 'true') as true_count
FROM roles, jsonb_each(permissions)
WHERE name = 'developer'
GROUP BY name;
-- Esperado: ~35 true

-- ANALYST (deve ter mix)
SELECT name, COUNT(*) FILTER (WHERE value::text = 'true') as true_count
FROM roles, jsonb_each(permissions)
WHERE name = 'analyst'
GROUP BY name;
-- Esperado: ~43 true

-- USER (deve ter poucas)
SELECT name, COUNT(*) FILTER (WHERE value::text = 'true') as true_count
FROM roles, jsonb_each(permissions)
WHERE name = 'user'
GROUP BY name;
-- Esperado: ~13 true
```

**✅ Checkpoint:**
- [ ] Admin: 72 permissões, todas true
- [ ] Developer: 72 permissões, ~35 true
- [ ] Analyst: 72 permissões, ~43 true
- [ ] User: 72 permissões, ~13 true
- [ ] Novas permissões presentes (organizations, sla, etc)

---

## 🔌 FASE 2: BACKEND - TESTE DE APIs (5 minutos)

### **2.1 Teste da API de Roles**

#### **2.1.1 GET /api/roles (Como Admin)**

```bash
# Obter token de admin (substituir com token real após login)
curl -X GET 'https://SEU_DOMINIO/api/roles' \
  -H 'Cookie: next-auth.session-token=TOKEN_ADMIN'
```

**✅ Checkpoint:**
- [ ] Status 200
- [ ] Retorna array com 4+ perfis
- [ ] Cada perfil tem 72 permissões
- [ ] JSON válido

---

#### **2.1.2 GET /api/roles (Como User - Deve Falhar)**

```bash
curl -X GET 'https://SEU_DOMINIO/api/roles' \
  -H 'Cookie: next-auth.session-token=TOKEN_USER'
```

**✅ Checkpoint:**
- [ ] Status 403 (Forbidden)
- [ ] Mensagem de erro apropriada
- [ ] Não vaza informações sensíveis

---

#### **2.1.3 PUT /api/roles/:id (Como Admin)**

```bash
# Atualizar permissão específica
curl -X PUT 'https://SEU_DOMINIO/api/roles/ID_DO_PERFIL_CUSTOM' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=TOKEN_ADMIN' \
  -d '{
    "display_name": "Teste Custom",
    "description": "Perfil de teste",
    "permissions": {
      "tickets_view": true,
      "tickets_create": true,
      ...
    }
  }'
```

**✅ Checkpoint:**
- [ ] Status 200
- [ ] Permissões atualizadas
- [ ] Cache limpo automaticamente

---

### **2.2 Teste de Permissões em Ação**

#### **2.2.1 Tickets - Criar Interno (Como Admin)**

```bash
curl -X POST 'https://SEU_DOMINIO/api/tickets' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=TOKEN_ADMIN' \
  -d '{
    "title": "Ticket Interno de Teste",
    "description": "Teste de permissão tickets_create_internal",
    "priority": "high",
    "is_internal": true,
    "created_by": "ID_ADMIN"
  }'
```

**✅ Checkpoint:**
- [ ] Status 201 (criado)
- [ ] Ticket marcado como interno
- [ ] `is_internal: true`

---

#### **2.2.2 Tickets - Criar Interno (Como User - Deve Falhar)**

```bash
curl -X POST 'https://SEU_DOMINIO/api/tickets' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=TOKEN_USER' \
  -d '{
    "title": "Tentativa de Ticket Interno",
    "description": "User não deve conseguir",
    "is_internal": true,
    "created_by": "ID_USER"
  }'
```

**✅ Checkpoint:**
- [ ] Status 403 (Forbidden)
- [ ] Mensagem: "Apenas administradores e analistas podem criar tickets internos"
- [ ] Ticket NÃO foi criado

---

#### **2.2.3 Organizations - Criar (Como Admin)**

```bash
curl -X POST 'https://SEU_DOMINIO/api/organizations' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=TOKEN_ADMIN' \
  -d '{
    "name": "Org Teste Permissões",
    "slug": "org-teste-perm"
  }'
```

**✅ Checkpoint:**
- [ ] Status 201 (se API existir)
- [ ] OU Status 404 (se API não existir ainda - OK)
- [ ] Validação de permissão aplicada

---

#### **2.2.4 Organizations - Criar (Como Developer - Deve Falhar)**

```bash
curl -X POST 'https://SEU_DOMINIO/api/organizations' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=TOKEN_DEVELOPER' \
  -d '{
    "name": "Tentativa Developer",
    "slug": "dev-fail"
  }'
```

**✅ Checkpoint:**
- [ ] Status 403 (se API existir)
- [ ] Developer NÃO pode criar organizações

---

### **2.3 Teste de Cache de Permissões**

#### **2.3.1 Verificar Cache Funcionando**

```bash
# 1. Fazer requisição e medir tempo
time curl 'https://SEU_DOMINIO/api/tickets' \
  -H 'Cookie: next-auth.session-token=TOKEN_ADMIN'

# 2. Fazer segunda requisição (deve ser mais rápida - cache)
time curl 'https://SEU_DOMINIO/api/tickets' \
  -H 'Cookie: next-auth.session-token=TOKEN_ADMIN'
```

**✅ Checkpoint:**
- [ ] Segunda requisição ~2x mais rápida
- [ ] Cache funcionando

---

#### **2.3.2 Limpar Cache**

```bash
curl -X POST 'https://SEU_DOMINIO/api/admin/clear-cache' \
  -H 'Cookie: next-auth.session-token=TOKEN_ADMIN'
```

**✅ Checkpoint:**
- [ ] Status 200
- [ ] Mensagem de sucesso
- [ ] Cache limpo

---

## 🎨 FASE 3: FRONTEND - TESTE DE UI (5 minutos)

### **3.1 Teste como ADMIN**

#### **Login:**
- Email: `test_admin@test.com`
- Senha: `password`

#### **Checklist UI:**

**Menu Principal:**
- [ ] Todos os menus visíveis
- [ ] Não há itens ocultos

**Configurações → Gerenciar Perfis:**
- [ ] Botão "Criar Novo Perfil" visível
- [ ] Botão "Migration V2.0" visível
- [ ] Botão "Limpar Cache" visível
- [ ] Pode editar qualquer perfil
- [ ] Pode deletar perfis customizados (não os do sistema)

**Ao Editar Perfil:**
- [ ] Vê 11 categorias de permissões:
  - [ ] Tickets (13 permissões)
  - [ ] Base de Conhecimento (5)
  - [ ] Apontamentos (8)
  - [ ] Organizações (5) 🆕
  - [ ] SLA (5) 🆕
  - [ ] Satisfação (5) 🆕
  - [ ] Comentários (4) 🆕
  - [ ] Relatórios (4) 🆕
  - [ ] API/Integrações (5) 🆕
  - [ ] Notificações (2) 🆕
  - [ ] Sistema (6)
- [ ] Todas as checkboxes editáveis
- [ ] Tooltips funcionando (hover)
- [ ] Pode salvar mudanças

**Tickets:**
- [ ] Vê todos os tickets (incluindo internos)
- [ ] Botão "Criar Ticket" visível
- [ ] Checkbox "Marcar como Interno" visível
- [ ] Pode editar qualquer ticket
- [ ] Pode deletar tickets
- [ ] Pode atribuir tickets
- [ ] Pode fechar tickets
- [ ] Pode alterar criticidade
- [ ] Pode alterar status
- [ ] Botão "Exportar" visível
- [ ] Checkbox "Selecionar múltiplos" visível (ações em massa)

**Organizações:**
- [ ] Menu "Organizações" visível
- [ ] Pode criar organizações
- [ ] Pode editar organizações
- [ ] Pode deletar organizações
- [ ] Pode gerenciar contextos

---

### **3.2 Teste como DEVELOPER**

#### **Logout + Login:**
- Email: `test_developer@test.com`
- Senha: `password`

#### **Checklist UI:**

**Menu Principal:**
- [ ] Tickets: ✅ Visível
- [ ] Comentários: ✅ Visível
- [ ] Apontamentos: ✅ Visível (se tem registros ou permissão)
- [ ] Analytics: ✅ Visível
- [ ] Base de Conhecimento: ✅ Visível
- [ ] Organizações: ⚠️ VIEW ONLY
- [ ] Configurações: ❌ NÃO visível (exceto perfil próprio)

**Configurações → Gerenciar Perfis:**
- [ ] ❌ NÃO tem acesso (403 ou redirect)

**Tickets:**
- [ ] Vê tickets (incluindo internos)
- [ ] Botão "Criar Ticket" visível
- [ ] Checkbox "Marcar como Interno" ✅ VISÍVEL
- [ ] Pode editar tickets
- [ ] ❌ NÃO pode deletar tickets
- [ ] ✅ Pode atribuir tickets
- [ ] ✅ Pode fechar tickets
- [ ] ✅ Pode alterar criticidade
- [ ] ✅ Pode alterar status
- [ ] ✅ Botão "Exportar" visível
- [ ] ❌ NÃO pode fazer ações em massa

**Organizações:**
- [ ] ✅ Pode visualizar lista
- [ ] ❌ NÃO tem botão "Criar"
- [ ] ❌ NÃO tem botão "Editar"
- [ ] ❌ NÃO tem botão "Deletar"

**SLA:**
- [ ] ✅ Pode visualizar políticas
- [ ] ❌ NÃO pode criar/editar

**Comentários:**
- [ ] ✅ Vê todos os comentários
- [ ] ✅ Botão "Moderar" visível
- [ ] ❌ NÃO pode editar comentários de outros
- [ ] ❌ NÃO pode deletar comentários

**Relatórios:**
- [ ] ✅ Pode visualizar relatórios
- [ ] ✅ Pode exportar
- [ ] ❌ NÃO pode criar personalizados
- [ ] ❌ NÃO pode agendar

---

### **3.3 Teste como ANALYST**

#### **Logout + Login:**
- Email: `test_analyst@test.com`
- Senha: `password`

#### **Checklist UI:**

**Tickets:**
- [ ] ✅ Acesso COMPLETO (13/13 permissões)
- [ ] ✅ Pode criar tickets internos
- [ ] ✅ Pode fazer ações em massa
- [ ] ✅ Pode exportar
- [ ] ✅ Pode alterar tudo

**SLA:**
- [ ] ✅ Pode criar políticas SLA
- [ ] ✅ Pode editar políticas
- [ ] ❌ NÃO pode deletar
- [ ] ❌ NÃO pode quebrar SLA (override)

**Satisfação:**
- [ ] ✅ Pode criar pesquisas
- [ ] ✅ Pode editar pesquisas
- [ ] ❌ NÃO pode deletar pesquisas
- [ ] ✅ Pode ver resultados
- [ ] ✅ Pode exportar dados

**Comentários:**
- [ ] ✅ Vê todos os comentários
- [ ] ❌ NÃO pode editar qualquer um
- [ ] ✅ PODE deletar comentários
- [ ] ✅ Pode moderar

**Relatórios:**
- [ ] ✅ Pode visualizar
- [ ] ✅ Pode exportar
- [ ] ✅ Pode criar personalizados
- [ ] ❌ NÃO pode agendar

**Notificações:**
- [ ] ❌ NÃO pode gerenciar globais
- [ ] ✅ PODE enviar broadcast

---

### **3.4 Teste como USER**

#### **Logout + Login:**
- Email: `test_user@test.com`
- Senha: `password`

#### **Checklist UI:**

**Menu Principal:**
- [ ] Tickets: ✅ Visível (limitado)
- [ ] Base de Conhecimento: ✅ Visível (view only)
- [ ] Apontamentos: ✅ Visível (próprios)
- [ ] Organizações: ❌ NÃO visível
- [ ] SLA: ❌ NÃO visível
- [ ] Relatórios: ❌ NÃO visível
- [ ] Configurações: ⚠️ Apenas perfil próprio

**Tickets:**
- [ ] ✅ Vê tickets (públicos + próprios)
- [ ] ❌ NÃO vê tickets internos (exceto se criou)
- [ ] ✅ Pode criar tickets
- [ ] ❌ Checkbox "Interno" NÃO visível
- [ ] ✅ Pode editar APENAS próprios
- [ ] ❌ NÃO pode editar de outros
- [ ] ❌ NÃO pode deletar
- [ ] ❌ NÃO pode atribuir
- [ ] ❌ NÃO pode fechar
- [ ] ❌ NÃO pode alterar criticidade
- [ ] ❌ NÃO pode alterar status
- [ ] ❌ NÃO pode exportar
- [ ] ❌ NÃO pode fazer ações em massa

**Base de Conhecimento:**
- [ ] ✅ Pode visualizar artigos
- [ ] ❌ NÃO pode criar
- [ ] ❌ NÃO pode editar
- [ ] ❌ NÃO pode deletar

**Apontamentos:**
- [ ] ✅ Vê apenas próprios
- [ ] ❌ NÃO vê de outros
- [ ] ✅ Pode criar
- [ ] ✅ Pode editar próprios
- [ ] ❌ NÃO tem acesso ao analytics

**Todas as Outras Áreas:**
- [ ] ❌ Organizações: Sem acesso
- [ ] ❌ SLA: Sem acesso
- [ ] ❌ Satisfação: Sem acesso
- [ ] ❌ Comentários: Vê apenas próprios
- [ ] ❌ Relatórios: Sem acesso
- [ ] ❌ API: Sem acesso
- [ ] ❌ Notificações: Sem acesso
- [ ] ❌ Sistema: Sem acesso

---

## 🔒 FASE 4: SEGURANÇA - TESTES AGRESSIVOS (3 minutos)

### **4.1 Tentativas de Bypass**

#### **4.1.1 Manipulação de URL (Como User)**

**Testar URLs diretas:**
```
❌ /dashboard/organizations
❌ /dashboard/organizations/create
❌ /dashboard/sla
❌ /dashboard/settings/roles
❌ /dashboard/timesheets/admin
❌ /dashboard/timesheets/analytics
❌ /dashboard/reports/custom
```

**✅ Checkpoint:**
- [ ] Todas retornam 403 ou redirect
- [ ] Nenhuma vaza informação
- [ ] Mensagem de erro apropriada

---

#### **4.1.2 Manipulação de API (Como User)**

```bash
# Tentar criar organização
curl -X POST 'https://SEU_DOMINIO/api/organizations' \
  -H 'Cookie: next-auth.session-token=TOKEN_USER' \
  -d '{"name":"Hack Attempt"}'

# Tentar deletar ticket de outro usuário
curl -X DELETE 'https://SEU_DOMINIO/api/tickets/ID_TICKET_OUTRO_USER' \
  -H 'Cookie: next-auth.session-token=TOKEN_USER'

# Tentar acessar API
curl -X POST 'https://SEU_DOMINIO/api/api-tokens/create' \
  -H 'Cookie: next-auth.session-token=TOKEN_USER'

# Tentar limpar cache
curl -X POST 'https://SEU_DOMINIO/api/admin/clear-cache' \
  -H 'Cookie: next-auth.session-token=TOKEN_USER'
```

**✅ Checkpoint:**
- [ ] Todas retornam 403
- [ ] Nenhuma executa ação
- [ ] Logs de tentativa registrados

---

#### **4.1.3 Manipulação de Session (Como Developer)**

**Tentar elevar privilégios:**
```bash
# Tentar modificar próprio perfil para admin
curl -X PUT 'https://SEU_DOMINIO/api/users/ID_DEVELOPER' \
  -H 'Cookie: next-auth.session-token=TOKEN_DEVELOPER' \
  -d '{"role":"admin"}'

# Tentar editar perfis
curl -X PUT 'https://SEU_DOMINIO/api/roles/ID_ADMIN_ROLE' \
  -H 'Cookie: next-auth.session-token=TOKEN_DEVELOPER' \
  -d '{"permissions":{"system_users":true}}'
```

**✅ Checkpoint:**
- [ ] Todas retornam 403
- [ ] Role não é alterado
- [ ] Permissões não são modificadas

---

### **4.2 Injeção de Permissões**

#### **4.2.1 SQL Injection em Roles**

```bash
# Tentar injeção SQL no nome do perfil
curl -X POST 'https://SEU_DOMINIO/api/roles' \
  -H 'Cookie: next-auth.session-token=TOKEN_ADMIN' \
  -d '{
    "name": "test'; DROP TABLE roles; --",
    "display_name": "Injection Test",
    "permissions": {}
  }'
```

**✅ Checkpoint:**
- [ ] Request bloqueado ou sanitizado
- [ ] Tabela `roles` intacta
- [ ] Erro apropriado retornado

---

#### **4.2.2 XSS em Permissões**

```bash
# Tentar XSS no display_name
curl -X POST 'https://SEU_DOMINIO/api/roles' \
  -H 'Cookie: next-auth.session-token=TOKEN_ADMIN' \
  -d '{
    "name": "xss_test",
    "display_name": "<script>alert(\"XSS\")</script>",
    "permissions": {}
  }'
```

**✅ Checkpoint:**
- [ ] Script não executado na UI
- [ ] HTML escapado/sanitizado
- [ ] Segurança mantida

---

### **4.3 Race Conditions**

#### **4.3.1 Múltiplas Requisições Simultâneas**

```bash
# Executar 10 requisições simultâneas
for i in {1..10}; do
  curl -X POST 'https://SEU_DOMINIO/api/tickets' \
    -H 'Cookie: next-auth.session-token=TOKEN_ADMIN' \
    -d '{"title":"Race Test '$i'","description":"Test","created_by":"ID"}' &
done
wait
```

**✅ Checkpoint:**
- [ ] Todas as requisições processadas
- [ ] Nenhum ticket duplicado
- [ ] Nenhum erro de concorrência
- [ ] IDs únicos gerados

---

## 🔍 FASE 5: INTEGRIDADE DE DADOS (2 minutos)

### **5.1 Validação de Consistência**

```sql
-- 1. Verificar integridade referencial
SELECT 
  u.id,
  u.email,
  u.role,
  r.name as role_exists
FROM users u
LEFT JOIN roles r ON u.role = r.name
WHERE r.name IS NULL;
-- Deve retornar vazio (todos os users têm role válido)

-- 2. Verificar permissões ausentes
SELECT 
  name,
  CASE 
    WHEN permissions ? 'tickets_create_internal' THEN 'OK'
    ELSE 'MISSING'
  END as has_new_permission
FROM roles;
-- Todos devem ter 'OK'

-- 3. Verificar estrutura de permissões
SELECT 
  name,
  jsonb_typeof(permissions) as type,
  jsonb_object_keys(permissions) as keys
FROM roles
WHERE jsonb_typeof(permissions) != 'object';
-- Deve retornar vazio (todas são objects)

-- 4. Verificar valores booleanos
SELECT 
  name,
  key,
  value
FROM roles, jsonb_each(permissions)
WHERE value::text NOT IN ('true', 'false');
-- Deve retornar vazio (todas são boolean)
```

**✅ Checkpoint:**
- [ ] Todas as queries retornam vazio ou correto
- [ ] Integridade mantida
- [ ] Sem dados corrompidos

---

### **5.2 Auditoria de Mudanças**

```sql
-- Verificar se há log de auditoria (se implementado)
SELECT * FROM role_audit_log 
WHERE changed_at > NOW() - INTERVAL '1 hour'
ORDER BY changed_at DESC
LIMIT 10;

-- Se não existir, criar para futuro
-- (Apenas para conhecimento, não executar se não quiser)
```

**✅ Checkpoint:**
- [ ] Logs existem (se implementado)
- [ ] Registram mudanças
- [ ] Contêm informações relevantes

---

## ✅ FASE 6: VALIDAÇÃO FINAL (2 minutos)

### **6.1 Checklist Geral**

**Backend:**
- [ ] Todas as APIs respondem corretamente
- [ ] Validações de permissão funcionam
- [ ] Erros retornam status apropriados (403, 404, etc)
- [ ] Cache funciona
- [ ] Nenhum vazamento de informação

**Frontend:**
- [ ] UI reflete permissões corretamente
- [ ] Admin vê tudo
- [ ] Developer vê permissões técnicas
- [ ] Analyst vê permissões gerenciais
- [ ] User vê apenas básico
- [ ] Tooltips funcionam
- [ ] Botões aparecem/desaparecem conforme permissão

**Segurança:**
- [ ] Nenhum bypass possível
- [ ] SQL Injection bloqueado
- [ ] XSS prevenido
- [ ] Elevação de privilégio impossível
- [ ] Cache de permissões seguro

**Dados:**
- [ ] Migration aplicada corretamente
- [ ] 72 permissões por perfil
- [ ] Valores corretos por tipo
- [ ] Integridade referencial mantida

---

### **6.2 Performance**

```bash
# Teste de carga (10 usuários simultâneos)
ab -n 100 -c 10 -C "next-auth.session-token=TOKEN" \
  https://SEU_DOMINIO/api/tickets

# Teste de latência
for i in {1..10}; do
  time curl -s 'https://SEU_DOMINIO/api/roles' \
    -H 'Cookie: next-auth.session-token=TOKEN_ADMIN' > /dev/null
done
```

**✅ Checkpoint:**
- [ ] Tempo de resposta < 500ms
- [ ] Taxa de erro < 1%
- [ ] Cache melhora performance em ~50%

---

### **6.3 Documentação**

- [ ] `NOVAS_PERMISSOES_IMPLEMENTADAS.md` está correto
- [ ] `ANALISE_COMPLETA_ROLES.md` está atualizado
- [ ] Exemplos de código funcionam
- [ ] Casos de uso documentados

---

## 📊 RELATÓRIO FINAL

### **Métricas de Sucesso:**

| Categoria | Testes | Passou | Falhou | Taxa |
|-----------|--------|--------|--------|------|
| Migration | 10 | ? | ? | ?% |
| Backend | 15 | ? | ? | ?% |
| Frontend | 40 | ? | ? | ?% |
| Segurança | 12 | ? | ? | ?% |
| Integridade | 8 | ? | ? | ?% |
| Performance | 5 | ? | ? | ?% |
| **TOTAL** | **90** | **?** | **?** | **?%** |

---

### **Problemas Encontrados:**

1. [ ] **Problema:** _Descrever_
   - **Severidade:** Crítico/Alto/Médio/Baixo
   - **Impacto:** _Quem afeta_
   - **Solução:** _Como corrigir_

2. [ ] **Problema:** _Descrever_
   - **Severidade:** 
   - **Impacto:** 
   - **Solução:** 

---

### **Conclusão:**

**Status Geral:** ✅ APROVADO / ⚠️ APROVADO COM RESSALVAS / ❌ REPROVADO

**Observações:**
- _Escrever observações finais_
- _Pontos de atenção_
- _Recomendações_

---

**Testado por:** _Seu Nome_  
**Data:** _Data do Teste_  
**Duração:** _Tempo real gasto_  
**Versão:** V2.0  
**Build:** _Build ID_

---

## 🚀 PRÓXIMOS PASSOS

1. [ ] Corrigir problemas encontrados
2. [ ] Implementar melhorias sugeridas
3. [ ] Documentar bugs conhecidos
4. [ ] Planejar próxima release
5. [ ] Comunicar stakeholders

---

**Fim do CTS - Complete Test Suite**

