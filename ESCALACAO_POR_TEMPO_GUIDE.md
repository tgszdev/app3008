# 🕐 Sistema de Escalação por Tempo - Guia Completo

## 📋 Visão Geral

O sistema de **Escalação por Tempo** permite configurar regras automáticas que executam ações específicas quando tickets não são atendidos dentro de prazos definidos. Este sistema é essencial para garantir que nenhum ticket fique sem atenção por muito tempo.

## 🎯 Funcionalidades Implementadas

### ✅ **Regras de Escalação Padrão**

1. **1h sem atribuição** → Notificar supervisor
2. **4h sem resposta** → Aumentar prioridade  
3. **24h sem resolução** → Escalar para gerência
4. **2h sem atribuição (Crítico)** → Escalação mais rápida

### ✅ **Tipos de Condições de Tempo**

- **`unassigned_time`**: Tempo desde criação se não atribuído
- **`no_response_time`**: Tempo desde último comentário
- **`resolution_time`**: Tempo total desde criação
- **`custom_time`**: Tempo personalizado

### ✅ **Ações Disponíveis**

- **Notificar supervisor**: Envia notificação para analysts e admins
- **Escalar para gerência**: Notifica apenas administradores
- **Aumentar prioridade**: Eleva prioridade do ticket (low → medium → high → critical)
- **Atribuir automaticamente**: Atribui ticket a um usuário disponível
- **Adicionar comentário**: Insere comentário automático no ticket

### ✅ **Configurações Avançadas**

- **Horário comercial**: Executar apenas em dias/horários específicos
- **Repetição**: Configurar repetição de escalação
- **Prioridade de regras**: Ordem de execução das regras
- **Condições específicas**: Filtrar por status, prioridade, categoria

## 🚀 Como Usar

### 1. **Acessar Configurações**

1. Faça login como **administrador**
2. Vá para **Dashboard → Configurações**
3. Clique no card **"Escalação por Tempo"**

### 2. **Criar Nova Regra**

1. Clique em **"Nova Regra"**
2. Preencha as informações básicas:
   - **Nome**: Ex: "Escalação - 1h sem atribuição"
   - **Descrição**: Explicação da regra
   - **Prioridade**: Ordem de execução (1-100)

### 3. **Configurar Tempo**

- **Condição de Tempo**: Escolha o tipo (unassigned_time, no_response_time, etc.)
- **Limite**: Número de tempo
- **Unidade**: Minutos, horas ou dias

### 4. **Definir Condições**

- **Status**: Qual status do ticket (opcional)
- **Prioridade**: Qual prioridade (opcional)
- **Atribuição**: Se deve estar atribuído ou não (opcional)

### 5. **Configurar Ações**

Marque as ações que devem ser executadas:
- ☑️ Notificar supervisor
- ☑️ Escalar para gerência
- ☑️ Aumentar prioridade
- ☑️ Atribuir automaticamente
- ☑️ Adicionar comentário (texto personalizado)

### 6. **Configurar Horário (Opcional)**

- ☑️ **Apenas em horário comercial**
- **Início**: Ex: 08:00
- **Fim**: Ex: 18:00
- **Dias úteis**: Segunda a Sexta

## 📊 Exemplos de Configuração

### **Exemplo 1: Escalação Básica**

```json
{
  "name": "Escalação - 1h sem atribuição",
  "description": "Notifica supervisor quando ticket não é atribuído em 1 hora",
  "time_condition": "unassigned_time",
  "time_threshold": 60,
  "time_unit": "minutes",
  "conditions": {
    "assigned_to": null,
    "status": "open"
  },
  "actions": {
    "notify_supervisor": true,
    "add_comment": "Ticket não atribuído há mais de 1 hora. Supervisor notificado."
  }
}
```

### **Exemplo 2: Escalação Crítica**

```json
{
  "name": "Escalação - 2h sem atribuição (Crítico)",
  "description": "Escalação mais rápida para tickets críticos",
  "time_condition": "unassigned_time",
  "time_threshold": 120,
  "time_unit": "minutes",
  "conditions": {
    "assigned_to": null,
    "status": "open",
    "priority": "critical"
  },
  "actions": {
    "notify_supervisor": true,
    "escalate_to_management": true,
    "add_comment": "Ticket crítico não atribuído há mais de 2 horas. Gerência notificada."
  }
}
```

### **Exemplo 3: Escalação por Resposta**

```json
{
  "name": "Escalação - 4h sem resposta",
  "description": "Aumenta prioridade quando não há resposta em 4 horas",
  "time_condition": "no_response_time",
  "time_threshold": 240,
  "time_unit": "minutes",
  "conditions": {
    "status": "in_progress"
  },
  "actions": {
    "increase_priority": true,
    "add_comment": "Prioridade aumentada devido à falta de resposta há mais de 4 horas."
  }
}
```

## 🔧 Execução Automática

### **Opção 1: Via API (Recomendado)**

```bash
# Executar escalação para um ticket específico
curl -X POST http://localhost:3000/api/escalation/execute \
  -H "Content-Type: application/json" \
  -d '{"ticket_id": "uuid-do-ticket"}'

# Executar escalação para todos os tickets
curl -X PUT http://localhost:3000/api/escalation/execute \
  -H "Content-Type: application/json" \
  -d '{"limit": 100, "status_filter": ["open", "in_progress"]}'
```

### **Opção 2: Via Script (Cron Job)**

```bash
# Executar a cada 15 minutos
*/15 * * * * cd /path/to/app3008 && node scripts/execute-escalations.js

# Executar a cada hora
0 * * * * cd /path/to/app3008 && node scripts/execute-escalations.js
```

### **Opção 3: Integração com Tickets**

O sistema já está integrado com a criação e atualização de tickets, executando automaticamente as regras de escalação quando necessário.

## 📈 Monitoramento

### **Logs de Escalação**

Todos os logs são salvos na tabela `escalation_logs` com:
- **Regra executada**
- **Ticket afetado**
- **Tipo de escalação**
- **Tempo decorrido**
- **Ações executadas**
- **Status de sucesso/erro**

### **Consultar Logs**

```sql
-- Ver logs de escalação dos últimos 7 dias
SELECT 
  el.*,
  er.name as rule_name,
  t.title as ticket_title
FROM escalation_logs el
JOIN escalation_rules er ON el.rule_id = er.id
JOIN tickets t ON el.ticket_id = t.id
WHERE el.triggered_at >= NOW() - INTERVAL '7 days'
ORDER BY el.triggered_at DESC;
```

## ⚙️ Configuração do Banco de Dados

### **1. Executar Script SQL**

```bash
# Execute o script de criação das tabelas
psql -d your_database -f sql/create_escalation_rules.sql
```

### **2. Verificar Tabelas Criadas**

```sql
-- Verificar se as tabelas foram criadas
\dt escalation_*

-- Verificar regras padrão
SELECT * FROM escalation_rules ORDER BY priority;
```

## 🚨 Troubleshooting

### **Problema: Escalação não executa**

**Soluções:**
1. Verificar se as regras estão ativas (`is_active = true`)
2. Verificar se o horário comercial está configurado corretamente
3. Verificar se as condições da regra estão sendo atendidas
4. Verificar logs de erro na tabela `escalation_logs`

### **Problema: Notificações não são enviadas**

**Soluções:**
1. Verificar configuração de email no sistema
2. Verificar se os usuários têm preferências de notificação habilitadas
3. Verificar logs de notificação

### **Problema: Script não executa**

**Soluções:**
1. Verificar variáveis de ambiente do Supabase
2. Verificar permissões de execução do script
3. Verificar logs de erro do cron job

## 📚 Estrutura de Arquivos

```
app3008/
├── sql/
│   └── create_escalation_rules.sql          # Script de criação das tabelas
├── src/
│   ├── app/api/escalation/
│   │   ├── route.ts                         # API para listar/criar regras
│   │   ├── [id]/route.ts                    # API para editar/deletar regras
│   │   └── execute/route.ts                 # API para executar escalações
│   ├── lib/
│   │   └── escalation-engine.ts             # Motor de execução de escalação
│   └── components/
│       └── EscalationManagementModal.tsx    # Interface de configuração
├── scripts/
│   └── execute-escalations.js               # Script para execução via cron
└── ESCALACAO_POR_TEMPO_GUIDE.md            # Este guia
```

## 🎉 Benefícios

### **Para o Negócio**
- ✅ **Garantia de SLA**: Tickets não ficam sem atenção
- ✅ **Melhoria na qualidade**: Escalação automática para gerência
- ✅ **Transparência**: Logs completos de todas as escalações
- ✅ **Flexibilidade**: Regras configuráveis por necessidade

### **Para a Equipe**
- ✅ **Automação**: Menos trabalho manual de monitoramento
- ✅ **Notificações**: Alertas automáticos para supervisores
- ✅ **Priorização**: Aumento automático de prioridade
- ✅ **Atribuição**: Distribuição automática de tickets

### **Para os Clientes**
- ✅ **Resposta mais rápida**: Tickets críticos são priorizados
- ✅ **Melhor atendimento**: Escalação para níveis superiores
- ✅ **Transparência**: Comentários automáticos explicando ações

---

## 🚀 Próximos Passos

1. **Configure as regras padrão** no sistema
2. **Teste com tickets de exemplo** para validar funcionamento
3. **Configure execução automática** via cron job
4. **Monitore os logs** para ajustar regras conforme necessário
5. **Treine a equipe** sobre o sistema de escalação

**O sistema está pronto para uso! 🎯**
