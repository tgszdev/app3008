# 📋 Instruções para Configurar Regras de Escalação no Supabase

## ⚠️ Erro Encontrado
O erro `escalation_rules_time_condition_check` indica que o campo `time_condition` tem valores restritos.

## 🔍 Primeiro: Verificar Valores Permitidos

Execute este SQL no Supabase para descobrir quais valores são aceitos:

```sql
-- Verificar a definição da constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM 
    pg_constraint
WHERE 
    conname = 'escalation_rules_time_condition_check';
```

## 📁 Arquivos SQL Disponíveis

Criamos 3 versões do SQL de inserção:

### 1. **insert_escalation_rules_fixed.sql**
Usa valores mais prováveis:
- `unassigned_time` (em vez de `unassigned`)
- `no_response_time` (em vez de `no_response`)
- `resolution_time` (em vez de `unresolved`)

### 2. **insert_escalation_rules_custom.sql**
Usa `custom_time` para todas as regras (mais genérico)

### 3. **check_time_condition_constraint.sql**
Script para verificar quais valores são permitidos

## ✅ Como Proceder

### Opção 1: Tentar a versão corrigida
```sql
-- Execute o arquivo: sql/insert_escalation_rules_fixed.sql
```

### Opção 2: Se ainda der erro, usar custom_time
```sql
-- Execute o arquivo: sql/insert_escalation_rules_custom.sql
```

### Opção 3: Verificar e adaptar
1. Execute `check_time_condition_constraint.sql` para ver valores permitidos
2. Adapte o SQL com os valores corretos
3. Execute o SQL adaptado

## 📝 Exemplo de Valores Comuns

Baseado em sistemas similares, os valores podem ser:
- `unassigned_time` - Tempo sem atribuição
- `no_response_time` - Tempo sem resposta
- `resolution_time` - Tempo para resolução
- `custom_time` - Regra customizada

OU

- `created` - Baseado na criação
- `updated` - Baseado na última atualização
- `custom` - Customizado

## 🚀 Após Inserir as Regras

1. **Verifique se foram criadas:**
```sql
SELECT id, name, time_condition, time_threshold, is_active
FROM escalation_rules
ORDER BY priority;
```

2. **Teste a API de escalação:**
```bash
curl -X GET https://www.ithostbr.tech/api/escalation/auto-execute
```

3. **Monitore os logs no Vercel:**
- Acesse Vercel Dashboard > Functions > Logs
- Procure por logs com `[AUTO-ESCALATION]`

## ⚙️ Configuração de Email

Adicione na tabela `system_settings`:
```sql
INSERT INTO system_settings (key, value) VALUES
('email_provider', 'supabase'),  -- ou 'sendgrid', 'resend'
('email_from', 'noreply@ithostbr.tech');
```

## 📊 Monitoramento

Tabelas para verificar:
- `escalation_logs` - Histórico de escalações
- `email_logs` - Emails enviados
- `notifications` - Notificações criadas

---
**Última atualização:** 19/09/2025