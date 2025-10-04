# 🔍 PLANO DE TESTE COMPLETO - SISTEMA MULTI-TENANT

**Data**: 2025-10-04  
**Objetivo**: Validar segurança e funcionalidade do sistema de contextos (multi-tenant)  
**Tempo estimado**: 15-20 minutos  

---

## 📋 ESCOPO DO TESTE

### Tipos de Usuários
1. **Usuário Context (Cliente Único)**: `agro2@agro.com.br` → Cliente 03
2. **Usuário Matrix (Multi-Cliente)**: `thiago@thiago.com` → Acesso a múltiplos clientes
3. **Usuário Admin**: Acesso total ao sistema

### Áreas Críticas
1. **Banco de Dados**: Sincronização de `context_id`, `context_name`, `context_slug`
2. **APIs Backend**: Validação de contexto em todas as rotas
3. **Frontend**: Filtros e exibição de dados por contexto
4. **Segurança**: Isolamento de dados entre clientes

---

## 🧪 TESTES A EXECUTAR

### FASE 1: VALIDAÇÃO DE BANCO DE DADOS (5 min)

#### Teste 1.1: Consistência de Dados dos Usuários
- [ ] Verificar se `users.context_id` está sincronizado com `user_contexts`
- [ ] Verificar se `context_name`, `context_slug`, `context_type` estão corretos
- [ ] Identificar usuários com dados dessincrônos
- [ ] Validar todos os usuários ativos

#### Teste 1.2: Integridade dos Tickets
- [ ] Verificar se todos os tickets têm `context_id` válido
- [ ] Validar se `context_id` aponta para contextos existentes
- [ ] Verificar distribuição de tickets por contexto
- [ ] Identificar tickets órfãos (sem contexto)

#### Teste 1.3: Associações User-Context
- [ ] Validar todas as associações em `user_contexts`
- [ ] Verificar se usuários context têm exatamente 1 associação
- [ ] Verificar se usuários matrix têm múltiplas associações
- [ ] Identificar associações inválidas

---

### FASE 2: VALIDAÇÃO DE APIs (5 min)

#### Teste 2.1: API `/api/tickets` (GET - Listar)
- [ ] Usuário context vê apenas tickets do seu contexto
- [ ] Usuário matrix vê tickets dos contextos associados
- [ ] Filtro por `context_ids` funciona corretamente
- [ ] Tickets internos são filtrados para usuários comuns

#### Teste 2.2: API `/api/tickets/[id]` (GET - Detalhes)
- [ ] Usuário context: Acesso negado a ticket de outro contexto (403)
- [ ] Usuário context: Acesso permitido a ticket do seu contexto (200)
- [ ] Usuário matrix: Acesso negado a ticket sem associação (403)
- [ ] Usuário matrix: Acesso permitido a ticket com associação (200)

#### Teste 2.3: API `/api/tickets` (POST - Criar)
- [ ] Usuário context cria ticket automaticamente no seu contexto
- [ ] Usuário matrix pode especificar contexto na criação
- [ ] `context_id` é validado corretamente
- [ ] Ticket criado aparece apenas para usuários autorizados

#### Teste 2.4: API `/api/tickets` (PUT/PATCH - Atualizar)
- [ ] Usuário context não pode editar ticket de outro contexto
- [ ] Validação de contexto antes da atualização
- [ ] Logs de alteração registram contexto correto

#### Teste 2.5: API `/api/tickets` (DELETE - Excluir)
- [ ] Usuário context não pode excluir ticket de outro contexto
- [ ] Validação de contexto antes da exclusão

#### Teste 2.6: API `/api/comments` (Comentários)
- [ ] Usuário vê apenas comentários de tickets do seu contexto
- [ ] Comentários internos são filtrados corretamente
- [ ] Criação de comentário valida contexto do ticket

#### Teste 2.7: API `/api/dashboard/multi-client-analytics`
- [ ] Retorna dados apenas dos contextos associados
- [ ] Para usuário context, usa `context_id` do banco (não da sessão)
- [ ] Para usuário matrix, valida cada `context_id` solicitado

#### Teste 2.8: API `/api/dashboard/stats`
- [ ] Estatísticas filtradas por contexto correto
- [ ] Contadores respeitam isolamento de dados

---

### FASE 3: VALIDAÇÃO DE FRONTEND (3 min)

#### Teste 3.1: Página `/dashboard/tickets`
- [ ] Usuário context: Tickets carregam automaticamente (sem seletor)
- [ ] Usuário matrix: Precisa selecionar clientes para ver tickets
- [ ] Filtros funcionam corretamente por contexto
- [ ] Contadores de status são precisos por contexto

#### Teste 3.2: Página `/dashboard/tickets/[id]`
- [ ] Redirecionamento ou erro ao acessar ticket não autorizado
- [ ] Exibição correta para tickets autorizados
- [ ] Informações do contexto exibidas corretamente

#### Teste 3.3: Dashboard Principal
- [ ] Widgets carregam dados do contexto correto
- [ ] Seletor de clientes funciona para matrix
- [ ] Analytics respeitam contexto selecionado

#### Teste 3.4: Página de Comentários
- [ ] Lista apenas comentários de tickets autorizados
- [ ] Filtros funcionam por contexto

---

### FASE 4: TESTES DE SEGURANÇA (2 min)

#### Teste 4.1: Tentativas de Acesso Não Autorizado
- [ ] URL direta para ticket de outro contexto → 403
- [ ] Manipulação de `context_ids` via URL → Validação
- [ ] Cookie/sessão de outro contexto → Bloqueio

#### Teste 4.2: Mudança de Contexto via UI
- [ ] Alteração de associação reflete imediatamente no banco
- [ ] Após mudança, usuário vê dados corretos após relogin
- [ ] Sessão antiga não permite acesso a contextos antigos

#### Teste 4.3: Isolamento de Dados
- [ ] Usuário Cliente 01 não vê dados do Cliente 02
- [ ] Usuário Cliente 01 não vê dados do Cliente 03
- [ ] Busca/filtros não vazam dados entre contextos

---

## 📊 CRITÉRIOS DE SUCESSO

### ✅ Aprovação Total
- Todos os testes passam
- Nenhuma falha de segurança detectada
- Dados sincronizados corretamente

### ⚠️ Aprovação com Ressalvas
- 1-3 falhas menores não críticas
- Problemas de UX sem impacto de segurança

### ❌ Reprovação
- Qualquer falha de segurança (acesso não autorizado)
- Mais de 3 falhas de funcionalidade
- Dados dessincrônos críticos

---

## 🐛 REGISTRO DE BUGS

Formato:
```
[PRIORIDADE] Área - Descrição
Status: [ABERTO/CORRIGIDO]
Teste: #X.X
```

---

## 📝 OBSERVAÇÕES

- Todos os testes serão executados contra o banco de produção
- Scripts de validação preservam dados (somente leitura)
- Testes de escrita serão feitos com dados de teste

