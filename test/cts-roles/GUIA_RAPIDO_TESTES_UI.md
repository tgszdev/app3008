# 🎨 GUIA RÁPIDO - Testes Manuais de UI

**Duração:** 8-10 minutos  
**Objetivo:** Validar que a interface reflete corretamente as permissões

---

## ⚡ PRÉ-REQUISITOS (1 minuto)

### **1. Aplicar Migration no Banco** ✅ JÁ FEITO
```bash
✅ Migration aplicada via script
✅ 62 permissões por perfil
✅ Dados validados (96.1%)
```

### **2. URL de Produção**
Abra no navegador:
```
https://app3008-c87r1wnes-thiagosouzas-projects-b3ccec7c.vercel.app
```
*(Use a URL mais recente do seu último deploy)*

### **3. Credenciais de Teste** 📝
**IMPORTANTE:** Como não conseguimos criar usuários de teste via API (RLS), você tem 2 opções:

#### **OPÇÃO A: Usar Usuário Admin Real** ✅ RECOMENDADO
- Use seu login admin normal
- Pule testes de outros perfis por enquanto
- Foque na validação do modal de perfis

#### **OPÇÃO B: Criar Usuários Manualmente no Supabase** (2 min)
```sql
-- Executar no Supabase SQL Editor:

INSERT INTO users (id, email, name, password, role, user_type)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'test_admin@test.com', 'Test Admin',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCy', 'admin', 'matrix'),
  ('00000000-0000-0000-0000-000000000003', 'test_analyst@test.com', 'Test Analyst',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCy', 'analyst', 'matrix'),
  ('00000000-0000-0000-0000-000000000004', 'test_user@test.com', 'Test User',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCy', 'user', 'matrix')
ON CONFLICT (email) DO NOTHING;

-- Senha para todos: password
```

---

## 🧪 TESTES ESSENCIAIS (5 minutos)

### **TESTE 1: VALIDAR MODAL DE PERFIS** (2 min) ⭐ PRINCIPAL

#### **Login como Admin:**
- Email: Seu admin real OU `test_admin@test.com`
- Senha: Sua senha OU `password`

#### **Passo a Passo:**

1. **Ir para:** Configurações → Gerenciar Perfis
   - [ ] Modal abre corretamente

2. **Verificar Botões do Topo:**
   - [ ] "Criar Novo Perfil" (roxo) ✅ Visível
   - [ ] "Migration V2.0" (verde) ✅ Visível 🆕
   - [ ] "Limpar Cache" (cinza) ✅ Visível

3. **Clicar em "Editar" no perfil Admin:**
   - [ ] Modal de edição abre

4. **Contar Categorias de Permissões:**
   ```
   Devem aparecer 11 CATEGORIAS (antes eram 4):
   ```
   - [ ] 1. **Tickets** (13 permissões)
   - [ ] 2. **Base de Conhecimento** (5)
   - [ ] 3. **Apontamentos** (8)
   - [ ] 4. **Organizações** (5) 🆕 NOVA
   - [ ] 5. **SLA** (5) 🆕 NOVA
   - [ ] 6. **Satisfação** (5) 🆕 NOVA
   - [ ] 7. **Comentários** (4) 🆕 NOVA
   - [ ] 8. **Relatórios** (4) 🆕 NOVA
   - [ ] 9. **API/Integrações** (5) 🆕 NOVA
   - [ ] 10. **Notificações** (2) 🆕 NOVA
   - [ ] 11. **Sistema** (6)

5. **Verificar Novas Permissões Específicas:**

   **Dentro da categoria "Tickets":**
   - [ ] ✨ "Criar Tickets Internos" - checkbox visível
   - [ ] ✨ "Alterar Status" - checkbox visível
   - [ ] ✨ "Ver Tickets Internos" - checkbox visível
   - [ ] ✨ "Exportar Tickets" - checkbox visível
   - [ ] ✨ "Ações em Massa" - checkbox visível

   **Categoria "Organizações" (NOVA):**
   - [ ] ✨ "Visualizar Organizações"
   - [ ] ✨ "Criar Organizações"
   - [ ] ✨ "Editar Organizações"
   - [ ] ✨ "Excluir Organizações"
   - [ ] ✨ "Gerenciar Contextos"

   **Categoria "SLA" (NOVA):**
   - [ ] ✨ "Visualizar SLA"
   - [ ] ✨ "Criar SLA"
   - [ ] ✨ "Editar SLA"
   - [ ] ✨ "Excluir SLA"
   - [ ] ✨ "Quebrar SLA"

   **Categoria "API/Integrações" (NOVA):**
   - [ ] ✨ "Acesso à API"
   - [ ] ✨ "Criar Tokens de API"
   - [ ] ✨ "Revogar Tokens"
   - [ ] ✨ "Gerenciar Integrações"
   - [ ] ✨ "Gerenciar Webhooks"

6. **Testar Tooltips:**
   - [ ] Passar mouse sobre 3 permissões aleatórias
   - [ ] Tooltips aparecem com descrições
   - [ ] Textos são claros e descritivos

7. **Testar Admin - Todas Marcadas:**
   - [ ] TODAS as 62 checkboxes estão ✅ marcadas
   - [ ] Nenhuma está desmarcada

---

### **TESTE 2: PERFIL ANALYST** (1 min)

#### **Editar Perfil Analyst:**

1. **Clicar em "Editar" no perfil Analyst**

2. **Verificar Permissões Específicas:**

   **Tickets:**
   - [ ] ✅ "Criar Tickets Internos" = MARCADO
   - [ ] ✅ "Ações em Massa" = MARCADO
   - [ ] ✅ "Exportar Tickets" = MARCADO

   **Organizations:**
   - [ ] ✅ "Visualizar Organizações" = MARCADO
   - [ ] ❌ "Criar Organizações" = DESMARCADO
   - [ ] ❌ "Editar Organizações" = DESMARCADO
   - [ ] ❌ "Excluir Organizações" = DESMARCADO

   **SLA:**
   - [ ] ✅ "Visualizar SLA" = MARCADO
   - [ ] ✅ "Criar SLA" = MARCADO
   - [ ] ✅ "Editar SLA" = MARCADO
   - [ ] ❌ "Excluir SLA" = DESMARCADO
   - [ ] ❌ "Quebrar SLA" = DESMARCADO

   **API/Integrações:**
   - [ ] ❌ TODAS DESMARCADAS (apenas admin tem acesso)

   **Notifications:**
   - [ ] ❌ "Gerenciar Notificações Globais" = DESMARCADO
   - [ ] ✅ "Enviar Notificações em Massa" = MARCADO

---

### **TESTE 3: PERFIL USER** (1 min)

#### **Editar Perfil User:**

1. **Clicar em "Editar" no perfil User**

2. **Verificar - Deve ter MUITO POUCAS permissões:**

   **Tickets:**
   - [ ] ✅ "Visualizar Tickets" = MARCADO
   - [ ] ✅ "Criar Tickets" = MARCADO
   - [ ] ✅ "Editar Próprios Tickets" = MARCADO
   - [ ] ❌ "Criar Tickets Internos" = DESMARCADO 🆕
   - [ ] ❌ "Exportar Tickets" = DESMARCADO 🆕
   - [ ] ❌ "Ações em Massa" = DESMARCADO 🆕
   - [ ] ❌ Todas as outras = DESMARCADAS

   **Organizations:**
   - [ ] ❌ TODAS DESMARCADAS

   **SLA:**
   - [ ] ❌ TODAS DESMARCADAS

   **Satisfaction:**
   - [ ] ❌ TODAS DESMARCADAS

   **API/Integrações:**
   - [ ] ❌ TODAS DESMARCADAS

   **Notifications:**
   - [ ] ❌ TODAS DESMARCADAS

   **System:**
   - [ ] ❌ TODAS DESMARCADAS

---

### **TESTE 4: BOTÃO MIGRATION V2.0** (1 min) - OPCIONAL

#### **Testar Funcionalidade:**

1. **Clicar em:** Botão verde "Migration V2.0"

2. **Verificar Popup:**
   - [ ] Popup de confirmação aparece
   - [ ] Texto menciona "48 novas permissões"
   - [ ] Botões OK e Cancelar visíveis

3. **Clicar Cancelar** (já aplicamos via script)

---

## 📊 CRITÉRIOS DE APROVAÇÃO

### **✅ APROVADO SE:**
- Vê 11 categorias (antes eram 4)
- Admin tem todas marcadas
- Analyst tem mix correto (view, create, edit mas não delete)
- User tem apenas básicas
- Tooltips funcionam
- Botão Migration V2.0 visível

### **❌ REPROVADO SE:**
- Vê apenas 4 categorias antigas
- Novas permissões não aparecem
- Admin não tem todas marcadas
- Tooltips não funcionam

---

## ✅ RESULTADO ESPERADO

Ao completar os 4 testes acima, você deve ter:

```
✅ TESTE 1: Modal de Perfis - 11 categorias visíveis
✅ TESTE 2: Analyst - Mix correto de permissões
✅ TESTE 3: User - Apenas básicas
✅ TESTE 4: Botão Migration funcionando

Taxa de Sucesso: 100%
Status: ✅ APROVADO
```

---

## 🚨 SE ALGO NÃO FUNCIONAR

### **Problema: Não vê 11 categorias**
**Solução:**
1. Fazer **Ctrl + Shift + R** (hard refresh)
2. Limpar cache do browser
3. Tentar em aba anônima
4. Verificar se migration foi aplicada (já foi ✅)

### **Problema: Não tem botão Migration V2.0**
**Solução:**
1. Verificar se está logado como **admin**
2. Hard refresh (Ctrl + Shift + R)
3. Verificar se build foi deployado (última em produção)

### **Problema: Tooltips não aparecem**
**Solução:**
- Passar mouse mais devagar
- Aguardar ~500ms
- Verificar console do browser (F12) por erros

---

## 🎯 TEMPO ESTIMADO POR TESTE

| Teste | Tempo | Essencial? |
|-------|-------|-----------|
| **1. Modal de Perfis** | 2 min | ⭐ SIM |
| **2. Perfil Analyst** | 1 min | ⚠️ Recomendado |
| **3. Perfil User** | 1 min | ⚠️ Recomendado |
| **4. Botão Migration** | 1 min | ❌ Opcional |
| **TOTAL** | **5 min** | - |

---

## ✅ CHECKLIST SIMPLIFICADO

```
🔲 1. Login como admin
🔲 2. Ir em: Configurações → Gerenciar Perfis
🔲 3. Contar categorias: Deve ter 11 (não 4)
🔲 4. Editar Admin: Todas as 62 checkboxes marcadas?
🔲 5. Editar Analyst: Mix correto?
🔲 6. Editar User: Só básicas?
🔲 7. Tooltips funcionam?
🔲 8. Tudo OK? ✅ APROVADO!
```

---

## 📝 ANOTAR RESULTADOS

### **Resultado do Teste:**

**TESTE 1 - Modal de Perfis:**
- Categorias vistas: ____ (esperado: 11)
- Status: [ ] ✅ Passou | [ ] ❌ Falhou

**TESTE 2 - Perfil Analyst:**
- Organizations_view: [ ] ✅ Marcado | [ ] ❌ Desmarcado
- Organizations_create: [ ] ❌ Desmarcado | [ ] ✅ Marcado (erro!)
- SLA_create: [ ] ✅ Marcado | [ ] ❌ Desmarcado
- Status: [ ] ✅ Passou | [ ] ❌ Falhou

**TESTE 3 - Perfil User:**
- Todas restritas: [ ] ✅ Sim | [ ] ❌ Não
- Apenas básicas marcadas: [ ] ✅ Sim | [ ] ❌ Não
- Status: [ ] ✅ Passou | [ ] ❌ Falhou

**TESTE 4 - Tooltips:**
- Funcionam: [ ] ✅ Sim | [ ] ❌ Não

---

**RESULTADO FINAL:**
- [ ] ✅ APROVADO (todos passaram)
- [ ] ⚠️ APROVADO COM RESSALVAS (1-2 problemas menores)
- [ ] ❌ REPROVADO (problemas graves)

---

**Testado por:** _______________  
**Data/Hora:** _______________  
**Tempo Real:** _____ minutos

---

## 🎯 APÓS COMPLETAR

Se todos os testes passarem, você terá validado:

✅ **Testes Automatizados:** 96.1% (123/128) ✅  
✅ **Testes Manuais UI:** __% (a preencher)  
✅ **Taxa Geral:** __% 

**Meta:** ≥ 85% para aprovação final

---

**💡 DICA:** Foque no TESTE 1 (Modal de Perfis). Se vir as 11 categorias com todas as novas permissões, pode considerar **APROVADO**! 🎉

