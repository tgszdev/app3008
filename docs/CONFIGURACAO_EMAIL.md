# 📧 Configuração do Sistema de Email para Escalação Automática

## 🎯 Objetivo
O sistema está configurado para enviar emails automaticamente quando tickets atingem os seguintes limites de tempo:
- **1 hora** sem atribuição → Notifica supervisores
- **4 horas** sem resposta → Aumenta prioridade e notifica
- **24 horas** sem resolução (alta prioridade) → Escala para gerência

## ⚙️ Como Configurar

### 1. Configurar Credenciais de Email

O sistema suporta 4 provedores de email. Configure **APENAS UM** deles:

#### Opção A: SendGrid (Recomendado para produção)
```env
# .env.local ou variáveis de ambiente no Vercel
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=tickets@seudominio.com
```

#### Opção B: SMTP (Gmail, Outlook, etc)
```env
# Para Gmail:
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=seuemail@gmail.com
EMAIL_SERVER_PASSWORD=sua-senha-de-app
EMAIL_FROM=seuemail@gmail.com

# Para Outlook:
EMAIL_SERVER_HOST=smtp-mail.outlook.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=seuemail@outlook.com
EMAIL_SERVER_PASSWORD=sua-senha
EMAIL_FROM=seuemail@outlook.com
```

**⚠️ Para Gmail:** Use uma [senha de app](https://support.google.com/mail/answer/185833?hl=pt-BR) em vez da senha normal.

#### Opção C: Resend
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=tickets@seudominio.com
```

#### Opção D: Supabase (se configurado)
```env
# Já configurado automaticamente se você tem Supabase
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 2. Executar SQL para Criar Regras de Escalação

```bash
# No terminal, execute:
npx supabase db push < sql/insert_escalation_rules.sql

# Ou no painel do Supabase:
# 1. Vá para SQL Editor
# 2. Cole o conteúdo de sql/insert_escalation_rules.sql
# 3. Execute
```

### 3. Verificar Configuração no Banco

Execute esta query para verificar as configurações:

```sql
-- Verificar regras de escalação
SELECT name, time_threshold, time_unit, is_active 
FROM escalation_rules 
WHERE is_active = true;

-- Verificar configurações de email
SELECT * FROM system_settings 
WHERE key LIKE 'email_%';
```

### 4. Testar Envio de Email

Acesse: `/dashboard/settings/email-test` para testar o envio.

Ou use curl:
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "seu-email@gmail.com"}'
```

## 🚀 Como Funciona

### Fluxo de Escalação Automática

1. **Cron Job** executa a cada **3 minutos** (configurado em `vercel.json`)
2. **Verifica todos os tickets** com status `open` ou `in_progress`
3. **Para cada ticket**, verifica se atende às regras:
   - Tempo desde criação
   - Status atual
   - Se já foi atribuído
   - Prioridade
4. **Se atender uma regra**:
   - Envia email para destinatários configurados
   - Adiciona comentário automático no ticket
   - Aumenta prioridade (se configurado)
   - Cria notificação no sistema

### Destinatários dos Emails

- **Supervisores**: Usuários com role `analyst` ou `admin`
- **Gerência**: Apenas usuários com role `admin`
- **Personalizado**: IDs específicos configurados nas regras

## 📊 Monitoramento

### Verificar Logs de Email
```sql
-- Ver últimos emails enviados
SELECT 
  created_at AT TIME ZONE 'America/Sao_Paulo' as data_envio,
  recipient,
  subject,
  status,
  error
FROM email_logs 
ORDER BY created_at DESC 
LIMIT 20;
```

### Verificar Logs de Escalação
```sql
-- Ver últimas escalações executadas
SELECT 
  el.triggered_at AT TIME ZONE 'America/Sao_Paulo' as data_escalacao,
  er.name as regra,
  t.title as ticket,
  el.success,
  el.action_details
FROM escalation_logs el
JOIN escalation_rules er ON el.rule_id = er.id
JOIN tickets t ON el.ticket_id = t.id
ORDER BY el.triggered_at DESC
LIMIT 20;
```

## 🔧 Troubleshooting

### Emails não estão sendo enviados?

1. **Verificar credenciais**:
   ```bash
   # No console do navegador (F12):
   fetch('/api/email/test-config').then(r => r.json()).then(console.log)
   ```

2. **Verificar se o cron está rodando**:
   - Vercel Dashboard → Functions → Logs
   - Procure por execuções de `/api/escalation/auto-execute`

3. **Verificar regras ativas**:
   ```sql
   SELECT * FROM escalation_rules WHERE is_active = true;
   ```

4. **Logs de erro**:
   ```sql
   SELECT * FROM email_logs 
   WHERE status = 'failed' 
   ORDER BY created_at DESC;
   ```

### Escalação não está ocorrendo?

1. **Verificar tempo do ticket**:
   ```sql
   -- Tickets que deveriam ser escalados
   SELECT 
     id,
     title,
     created_at AT TIME ZONE 'America/Sao_Paulo' as criado_em,
     EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutos_desde_criacao,
     status,
     assigned_to
   FROM tickets
   WHERE status IN ('open', 'aberto')
     AND assigned_to IS NULL
     AND created_at < NOW() - INTERVAL '1 hour';
   ```

2. **Forçar execução manual**:
   ```bash
   curl -X POST http://localhost:3000/api/escalation/auto-execute
   ```

## 📝 Personalização das Regras

Para modificar os tempos de escalação, edite o arquivo `sql/insert_escalation_rules.sql` e reexecute no banco.

### Exemplos de Personalização:

**Mudar para 30 minutos sem atribuição:**
```sql
UPDATE escalation_rules 
SET time_threshold = 30
WHERE name = 'Ticket não atribuído (1 hora)';
```

**Adicionar destinatários específicos:**
```sql
UPDATE escalation_rules 
SET actions = jsonb_set(
  actions,
  '{send_email_notification,recipients}',
  '["user-id-1", "user-id-2"]'::jsonb
)
WHERE name = 'Ticket não atribuído (1 hora)';
```

## ✅ Checklist de Configuração

- [ ] Configurar credenciais de email em `.env.local`
- [ ] Executar SQL para inserir regras de escalação
- [ ] Testar envio de email
- [ ] Verificar que o cron job está ativo no Vercel
- [ ] Criar um ticket de teste e aguardar escalação
- [ ] Verificar logs de email e escalação

## 🆘 Suporte

Se precisar de ajuda:
1. Verifique os logs no Supabase
2. Verifique os logs de função no Vercel
3. Use o modo debug alterando `console.log` para `console.error` em `/lib/escalation-engine-simple.ts`