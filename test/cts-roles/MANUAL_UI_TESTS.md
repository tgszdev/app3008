# 🎨 CTS ROLES - Testes Manuais de UI

**Duração:** 8-10 minutos  
**Tipo:** Manual / Interativo  
**Objetivo:** Validar que a UI reflete corretamente as permissões

---

## 📋 CHECKLIST DE EXECUÇÃO

### ✅ **PRÉ-REQUISITOS**
- [ ] Deploy em produção concluído
- [ ] Usuários de teste criados (00-setup-test-users.sql executado)
- [ ] Migration V2.0 aplicada via botão
- [ ] Cache limpo

---

## 👤 TESTE 1: LOGIN COMO ADMIN (2 minutos)

### **Login:**
- Email: `test_admin@test.com`
- Senha: `password`

### **Validações:**

#### **Menu Principal:**
- [ ] Dashboard
- [ ] Chamados
- [ ] Comentários
- [ ] Apontamentos
- [ ] Estatísticas
- [ ] Relatórios
- [ ] Satisfação
- [ ] Base de Conhecimento
- [ ] Organizações ✨
- [ ] SLA ✨
- [ ] Configurações

**Resultado:** [ ] ✅ Todos visíveis | [ ] ❌ Algo faltando

---

#### **Configurações → Gerenciar Perfis:**
- [ ] Modal abre
- [ ] 3 botões no topo:
  - [ ] "Criar Novo Perfil" (roxo)
  - [ ] "Migration V2.0" (verde) ✨
  - [ ] "Limpar Cache" (cinza)
- [ ] Lista de 4+ perfis exibida
- [ ] Botão "Editar" em cada perfil
- [ ] Botão "Deletar" apenas em perfis customizados (não nos do sistema)

**Resultado:** [ ] ✅ Passou | [ ] ❌ Falhou

---

#### **Editar Perfil Admin:**
- [ ] Clicar em "Editar" no perfil Admin
- [ ] Contagem de categorias: **11 categorias**
  - [ ] 1. Tickets (13 permissões)
  - [ ] 2. Base de Conhecimento (5)
  - [ ] 3. Apontamentos (8)
  - [ ] 4. Organizações (5) ✨ NOVA
  - [ ] 5. SLA (5) ✨ NOVA
  - [ ] 6. Satisfação (5) ✨ NOVA
  - [ ] 7. Comentários (4) ✨ NOVA
  - [ ] 8. Relatórios (4) ✨ NOVA
  - [ ] 9. API/Integrações (5) ✨ NOVA
  - [ ] 10. Notificações (2) ✨ NOVA
  - [ ] 11. Sistema (6)

**Resultado:** [ ] ✅ 11 categorias | [ ] ❌ Faltando categorias

---

#### **Validar Tooltips:**
Passar mouse sobre 5 permissões aleatórias:
- [ ] 1. Tooltip aparece
- [ ] 2. Tooltip aparece
- [ ] 3. Tooltip aparece
- [ ] 4. Tooltip aparece
- [ ] 5. Tooltip aparece
- [ ] Textos são descritivos e corretos

**Resultado:** [ ] ✅ Passou | [ ] ❌ Falhou

---

#### **Tickets (Como Admin):**
- [ ] Ver todos os tickets (incluindo internos)
- [ ] Botão "Novo Chamado" visível
- [ ] Ao criar ticket:
  - [ ] Checkbox "Marcar como Interno" ✅ VISÍVEL ✨
- [ ] Pode editar qualquer ticket
- [ ] Botão "Deletar" visível em tickets
- [ ] Dropdown de atribuição funciona
- [ ] Pode fechar tickets
- [ ] Pode alterar criticidade
- [ ] Botão "Exportar" ✅ VISÍVEL ✨
- [ ] Checkbox "Selecionar múltiplos" ✅ VISÍVEL ✨

**Resultado:** [ ] ✅ Todas permissões funcionam | [ ] ❌ Algo bloqueado

---

## 👤 TESTE 2: LOGIN COMO DEVELOPER (2 minutos)

### **Logout + Login:**
- Email: `test_developer@test.com`
- Senha: `password`

### **Validações:**

#### **Menu Principal:**
- [ ] Chamados: ✅ Visível
- [ ] Organizações: ✅ Visível (mas limitado)
- [ ] SLA: ✅ Visível (view only)
- [ ] Configurações: ❌ NÃO tem "Gerenciar Perfis"
- [ ] Relatórios: ✅ Visível
- [ ] API: ❌ NÃO visível

**Resultado:** [ ] ✅ Correto | [ ] ❌ Incorreto

---

#### **Tickets (Como Developer):**
- [ ] Vê tickets (incluindo internos) ✅
- [ ] Checkbox "Marcar como Interno" ✅ VISÍVEL ✨
- [ ] Pode editar tickets ✅
- [ ] ❌ Botão "Deletar" NÃO visível
- [ ] ✅ Pode atribuir
- [ ] ✅ Pode fechar
- [ ] ✅ Pode alterar criticidade
- [ ] ✅ Botão "Exportar" VISÍVEL ✨
- [ ] ❌ Checkbox "Ações em massa" NÃO visível ✨

**Resultado:** [ ] ✅ Passou | [ ] ❌ Falhou

---

#### **Organizações (Como Developer):**
- [ ] ✅ Pode visualizar lista
- [ ] ❌ Botão "Criar" NÃO visível
- [ ] ❌ Botão "Editar" NÃO visível
- [ ] ❌ Botão "Deletar" NÃO visível

**Resultado:** [ ] ✅ View only | [ ] ❌ Tem acesso a mais

---

#### **Relatórios (Como Developer):**
- [ ] ✅ Pode visualizar
- [ ] ✅ Botão "Exportar" visível
- [ ] ❌ "Criar Personalizado" NÃO visível
- [ ] ❌ "Agendar" NÃO visível

**Resultado:** [ ] ✅ Correto | [ ] ❌ Incorreto

---

## 👤 TESTE 3: LOGIN COMO ANALYST (2 minutos)

### **Logout + Login:**
- Email: `test_analyst@test.com`
- Senha: `password`

### **Validações:**

#### **Tickets (Como Analyst):**
- [ ] ✅ Acesso COMPLETO (todas as 13 permissões)
- [ ] ✅ Pode criar tickets internos ✨
- [ ] ✅ Pode fazer ações em massa ✨
- [ ] ✅ Pode exportar ✨
- [ ] ✅ Pode deletar? (Verificar se permitido)

**Resultado:** [ ] ✅ Acesso completo | [ ] ❌ Algo bloqueado

---

#### **SLA (Como Analyst):**
- [ ] ✅ Pode visualizar políticas
- [ ] ✅ Botão "Criar SLA" VISÍVEL ✨
- [ ] ✅ Botão "Editar" VISÍVEL ✨
- [ ] ❌ Botão "Deletar" NÃO visível
- [ ] ❌ Opção "Quebrar SLA" NÃO visível

**Resultado:** [ ] ✅ Management access | [ ] ❌ Incorreto

---

#### **Satisfação (Como Analyst):**
- [ ] ✅ Pode ver resultados
- [ ] ✅ Botão "Criar Pesquisa" VISÍVEL ✨
- [ ] ✅ Botão "Editar" VISÍVEL ✨
- [ ] ❌ Botão "Deletar Pesquisa" NÃO visível
- [ ] ✅ Botão "Exportar Dados" VISÍVEL ✨

**Resultado:** [ ] ✅ Passou | [ ] ❌ Falhou

---

#### **Notificações (Como Analyst):**
- [ ] ❌ "Gerenciar Globais" NÃO visível
- [ ] ✅ "Enviar Broadcast" VISÍVEL ✨

**Resultado:** [ ] ✅ Broadcast only | [ ] ❌ Incorreto

---

## 👤 TESTE 4: LOGIN COMO USER (2 minutos)

### **Logout + Login:**
- Email: `test_user@test.com`
- Senha: `password`

### **Validações:**

#### **Menu Principal - Deve ter APENAS:**
- [ ] Dashboard
- [ ] Chamados (limitado)
- [ ] Comentários (próprios)
- [ ] Base de Conhecimento (view)
- [ ] Apontamentos (se tiver registros/permissão)

#### **Menu Principal - NÃO deve ter:**
- [ ] ❌ Organizações
- [ ] ❌ SLA
- [ ] ❌ Relatórios
- [ ] ❌ Satisfação
- [ ] ❌ Configurações (exceto perfil próprio)
- [ ] ❌ API

**Resultado:** [ ] ✅ Menu básico correto | [ ] ❌ Vê coisas que não deveria

---

#### **Tickets (Como User):**
- [ ] ✅ Vê tickets públicos
- [ ] ❌ NÃO vê tickets internos (exceto se criou)
- [ ] ✅ Botão "Novo Chamado" visível
- [ ] ❌ Checkbox "Interno" NÃO visível ✨
- [ ] ✅ Pode editar APENAS próprios tickets
- [ ] ❌ Botão "Editar" NÃO aparece em tickets de outros
- [ ] ❌ Botão "Deletar" NÃO visível
- [ ] ❌ Dropdown "Atribuir" NÃO visível
- [ ] ❌ Botão "Fechar" NÃO visível
- [ ] ❌ Dropdown "Criticidade" NÃO editável
- [ ] ❌ Botão "Exportar" NÃO visível ✨
- [ ] ❌ Checkbox "Ações em massa" NÃO visível ✨

**Resultado:** [ ] ✅ Apenas básico | [ ] ❌ Tem mais acesso que deveria

---

#### **Base de Conhecimento (Como User):**
- [ ] ✅ Pode visualizar artigos
- [ ] ❌ Botão "Criar Artigo" NÃO visível
- [ ] ❌ Botão "Editar" NÃO visível
- [ ] ❌ Botão "Deletar" NÃO visível

**Resultado:** [ ] ✅ View only | [ ] ❌ Tem edição

---

#### **Tentar Acessar URLs Diretamente (Como User):**
Digitar na barra de endereços:

- [ ] `/dashboard/organizations` → Deve dar 403 ou redirect
- [ ] `/dashboard/sla` → Deve dar 403 ou redirect
- [ ] `/dashboard/settings/roles` → Deve dar 403 ou redirect
- [ ] `/dashboard/timesheets/admin` → Deve dar 403 ou redirect
- [ ] `/dashboard/reports/custom` → Deve dar 403 ou redirect

**Resultado:** [ ] ✅ Todas bloqueadas | [ ] ❌ Conseguiu acessar algo

---

## 🔒 TESTE 5: SEGURANÇA - TENTATIVAS DE BYPASS (2 minutos)

### **Como User - Tentar Console Hacks:**

Abrir Console (F12) e tentar:

```javascript
// 1. Tentar chamar API diretamente
fetch('/api/organizations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Hack Attempt' })
})
.then(r => r.json())
.then(console.log)
```
**Resultado:** [ ] ✅ Status 403 | [ ] ❌ Criou organização

```javascript
// 2. Tentar deletar ticket de outro usuário
fetch('/api/tickets/ALGUM_ID_EXISTENTE', {
  method: 'DELETE'
})
.then(r => r.json())
.then(console.log)
```
**Resultado:** [ ] ✅ Status 403 | [ ] ❌ Deletou

```javascript
// 3. Tentar acessar roles
fetch('/api/roles')
.then(r => r.json())
.then(console.log)
```
**Resultado:** [ ] ✅ Status 403 | [ ] ❌ Retornou dados

---

### **Como Developer - Tentar Elevar Privilégios:**

Login como: `test_developer@test.com`

```javascript
// 1. Tentar criar organização
fetch('/api/organizations', {
  method: 'POST',
  body: JSON.stringify({ name: 'Dev Attempt' }),
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(console.log)
```
**Resultado:** [ ] ✅ Status 403 | [ ] ❌ Criou

```javascript
// 2. Tentar modificar próprio perfil
fetch('/api/users/ID_DO_DEVELOPER', {
  method: 'PUT',
  body: JSON.stringify({ role: 'admin' }),
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(console.log)
```
**Resultado:** [ ] ✅ Status 403 ou não altera | [ ] ❌ Virou admin

---

## 📊 RESUMO DOS TESTES MANUAIS

| Perfil | Testes | Passou | Falhou | Taxa |
|--------|--------|--------|--------|------|
| Admin | 15 | ? | ? | ?% |
| Developer | 12 | ? | ? | ?% |
| Analyst | 10 | ? | ? | ?% |
| User | 13 | ? | ? | ?% |
| Segurança | 5 | ? | ? | ?% |
| **TOTAL** | **55** | **?** | **?** | **?%** |

---

## ✅ CRITÉRIOS DE APROVAÇÃO

### **✅ APROVADO SE:**
- ≥ 90% dos testes passam
- Admin vê TUDO
- User vê APENAS básico
- Nenhum bypass de segurança funciona

### **⚠️ APROVADO COM RESSALVAS SE:**
- 75-89% dos testes passam
- Apenas problemas cosméticos
- Sem impacto de segurança

### **❌ REPROVADO SE:**
- < 75% dos testes passam
- User consegue acessar áreas restritas
- Bypass de segurança funciona
- UI não reflete permissões

---

## 📝 ANOTAÇÕES

### **Problemas Encontrados:**

1. **Problema:** _Descrever aqui_
   - **Severidade:** [ ] Crítico [ ] Alto [ ] Médio [ ] Baixo
   - **Perfil Afetado:** 
   - **Como Reproduzir:**

2. **Problema:** _Descrever aqui_
   - **Severidade:** [ ] Crítico [ ] Alto [ ] Médio [ ] Baixo
   - **Perfil Afetado:**
   - **Como Reproduzir:**

---

## 🎯 CONCLUSÃO

**Status Geral:** [ ] ✅ APROVADO | [ ] ⚠️ RESSALVAS | [ ] ❌ REPROVADO

**Taxa de Sucesso:** ____%

**Observações Finais:**
_Escrever aqui observações gerais, pontos de atenção, etc._

---

**Testado por:** _______________  
**Data:** _______________  
**Duração Real:** _____ minutos  
**Build Testado:** _______________

