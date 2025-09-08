# 📊 Sistema de Apontamento de Horas - Guia Completo

## 📋 Visão Geral

O sistema de apontamento de horas foi implementado com as seguintes funcionalidades principais:

### 1. **Apontamento de Horas** (`/dashboard/timesheets`)
- Usuários podem registrar horas trabalhadas em tickets atribuídos a eles
- Visualização de tickets com status de aprovação
- Adição, edição e exclusão de apontamentos pendentes
- Visualização de motivos de recusa

### 2. **Administração de Apontamentos** (`/dashboard/timesheets/admin`)
- Aprovação ou recusa de apontamentos pendentes
- Obrigatoriedade de informar motivo ao recusar
- Visualização filtrada por status (pendente, aprovado, recusado)
- Interface com cards destacando apontamentos pendentes

### 3. **Analytics de Apontamentos** (`/dashboard/timesheets/analytics`)
- Dashboards com métricas e gráficos
- Filtros por período, usuário, departamento
- Agrupamentos por usuário, ticket, data ou departamento
- Exportação de dados detalhados

### 4. **Configuração de Permissões** (`/dashboard/settings`)
- Card dedicado para gerenciar permissões de apontamento
- Controle de quem pode fazer apontamentos
- Controle de quem pode aprovar apontamentos
- Atualização em massa por departamento ou perfil

## 🚀 Configuração Inicial

### 1. Executar Migração no Supabase

Execute o arquivo `SUPABASE_TIMESHEET_MIGRATION.sql` no Supabase SQL Editor:

```sql
-- O arquivo contém:
-- - Criação das tabelas: timesheets, timesheet_permissions, timesheet_history
-- - Criação de índices para performance
-- - Views para estatísticas
-- - Funções para cálculos de horas
-- - Triggers para atualização automática de timestamps
-- - Permissões iniciais para admin e agents
```

### 2. Configurar Permissões Iniciais

Após executar a migração, acesse **Settings → Permissões de Apontamento** para:

1. **Adicionar usuários individualmente**:
   - Selecione o usuário
   - Marque as permissões desejadas

2. **Configurar em massa**:
   - Por departamento
   - Por perfil (admin, agent, user)

## 📝 Fluxo de Trabalho

### Para Usuários:

1. **Acessar Apontamento de Horas**:
   - Menu lateral → "Apontamento de Horas"
   - Visualizar tickets atribuídos

2. **Adicionar Apontamento**:
   - Clicar no card do ticket ou botão "Adicionar Apontamento"
   - Preencher:
     - Data do trabalho
     - Horas trabalhadas (0.5 a 24 horas)
     - Descrição detalhada da atividade
   - Salvar

3. **Gerenciar Apontamentos**:
   - **Editar**: Apenas apontamentos pendentes
   - **Excluir**: Apenas apontamentos pendentes
   - **Visualizar**: Status e motivos de recusa

### Para Aprovadores:

1. **Acessar Admin. Apontamentos**:
   - Menu lateral → "Admin. Apontamentos"
   - Cards destacam tickets com apontamentos pendentes

2. **Revisar Apontamentos**:
   - Clicar no card do ticket
   - Visualizar detalhes de cada apontamento
   - Ver informações do colaborador

3. **Aprovar ou Recusar**:
   - **Aprovar**: Clique em "Aprovar"
   - **Recusar**: 
     - Clique em "Recusar"
     - Informe obrigatoriamente o motivo
     - Confirmar recusa

## 📊 Analytics e Relatórios

### Métricas Disponíveis:

1. **Cards de Resumo**:
   - Total de horas
   - Taxa de aprovação
   - Tickets ativos
   - Colaboradores ativos

2. **Gráficos**:
   - **Pizza**: Distribuição por status
   - **Barras**: Top 10 por categoria
   - **Linha**: Evolução temporal (quando agrupado por data)

3. **Tabela Detalhada**:
   - Exportável
   - Ordenável
   - Com totalizadores

### Filtros:

- **Período**: Seleção de intervalo de datas
- **Agrupamento**: Usuário, Ticket, Data, Departamento
- **Usuário**: Específico (admin pode ver todos)

## 🔒 Regras de Negócio

### Permissões:

1. **can_submit_timesheet**:
   - Permite criar apontamentos
   - Permite editar/excluir próprios apontamentos pendentes

2. **can_approve_timesheet**:
   - Permite aprovar/recusar apontamentos
   - Permite visualizar todos os apontamentos
   - Acesso ao painel de administração

### Validações:

- Usuário só pode apontar em tickets atribuídos a ele
- Horas: mínimo 0.5, máximo 24 por apontamento
- Descrição obrigatória
- Motivo obrigatório ao recusar
- Apenas apontamentos pendentes podem ser editados/excluídos

### Status:

- **pending**: Aguardando aprovação
- **approved**: Aprovado
- **rejected**: Recusado (com motivo)

## 🛠️ Estrutura Técnica

### Tabelas do Banco:

```sql
timesheets              -- Apontamentos de horas
timesheet_permissions   -- Permissões por usuário
timesheet_history      -- Histórico de ações
timesheet_statistics   -- View com estatísticas
```

### APIs Disponíveis:

```typescript
GET    /api/timesheets              -- Listar apontamentos
POST   /api/timesheets              -- Criar apontamento
PATCH  /api/timesheets/[id]        -- Atualizar/Aprovar/Recusar
DELETE /api/timesheets/[id]        -- Excluir apontamento

GET    /api/timesheets/permissions -- Listar permissões
POST   /api/timesheets/permissions -- Criar/Atualizar permissões
DELETE /api/timesheets/permissions -- Remover permissões

GET    /api/timesheets/statistics  -- Obter estatísticas
```

### Componentes:

- `TimesheetPermissionsModal`: Modal de gerenciamento de permissões
- `DatePickerWithRange`: Seletor de período para analytics
- Páginas completas com interface responsiva

## 📌 Próximos Passos Recomendados

1. **Notificações**:
   - Notificar usuário quando apontamento for aprovado/recusado
   - Alertar aprovadores sobre apontamentos pendentes

2. **Exportação**:
   - Gerar relatórios em PDF
   - Exportar para Excel

3. **Integrações**:
   - Integrar com folha de pagamento
   - Sincronizar com sistemas externos

4. **Melhorias**:
   - Templates de atividades recorrentes
   - Apontamento em lote
   - Timer integrado para tracking em tempo real

## 🎯 Benefícios do Sistema

1. **Controle de Produtividade**: Visibilidade clara das horas trabalhadas
2. **Gestão de Projetos**: Acompanhamento de esforço por ticket
3. **Compliance**: Registro formal e auditável
4. **Analytics**: Dados para tomada de decisão
5. **Transparência**: Feedback claro sobre aprovações/recusas

## ⚠️ Importante

- Execute a migração SQL antes de usar o sistema
- Configure as permissões antes de liberar para usuários
- Oriente a equipe sobre o fluxo de aprovação
- Estabeleça políticas claras de apontamento

---

**Sistema de Apontamento de Horas** - Versão 1.0
Desenvolvido para controle eficiente de horas trabalhadas com aprovação hierárquica.