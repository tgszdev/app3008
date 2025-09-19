# 📧 Configuração de Email SMTP para Escalações

## ✅ Implementação Completa Realizada

### 🔧 O que foi implementado:

1. **Suporte completo para SMTP** (Gmail configurado)
2. **Integração com nodemailer** para envio real de emails
3. **Template HTML responsivo** para emails de escalação
4. **Logs de email** no banco de dados
5. **Endpoint de teste** para verificar funcionamento

## 📋 Configuração no Sistema

Você já tem configurado:
- **Servidor SMTP:** smtp.gmail.com
- **Porta:** 587 (TLS/STARTTLS)
- **Email:** rodrigues220589@gmail.com
- **Senha de App:** (configurada)
- **Nome do Remetente:** Sistema de Suporte Técnico

## 🧪 Como Testar o Envio de Email

### Teste 1: Endpoint de Teste Direto
```bash
# Teste com seu email
curl "https://www.ithostbr.tech/api/escalation/test-email?email=rodrigues220589@gmail.com"

# Ou via POST
curl -X POST https://www.ithostbr.tech/api/escalation/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"rodrigues220589@gmail.com"}'
```

### Teste 2: Verificar Logs no Banco
```sql
-- No Supabase SQL Editor
SELECT * FROM email_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🔍 Verificação de Problemas

### Se o email não chegar:

1. **Verifique a Senha de App do Gmail:**
   - Acesse: https://myaccount.google.com/apppasswords
   - Gere uma nova senha de app se necessário
   - Atualize no sistema

2. **Verifique os Logs:**
   ```sql
   -- Ver emails com erro
   SELECT * FROM email_logs 
   WHERE status = 'failed'
   ORDER BY created_at DESC;
   ```

3. **Verifique Spam/Lixeira:**
   - Emails de teste podem ir para spam
   - Marque como "Não é spam" 

4. **Permissões do Gmail:**
   - Certifique-se que "Acesso de app menos seguro" está ativado
   - Ou use Senha de App (recomendado)

## 🚀 Como Funciona a Escalação com Email

1. **Cron job executa a cada 5 minutos**
2. **Encontra tickets não atribuídos há >1h**
3. **Para cada ticket:**
   - Aumenta prioridade
   - Adiciona comentário
   - **Envia email para admins/analysts**
   - Registra no log

4. **Destinatários do email:**
   - Todos os usuários com role = 'admin'
   - Todos os usuários com role = 'analyst'

## 📝 Adicionar Mais Destinatários

Para adicionar destinatários específicos:

```sql
-- Adicionar um usuário como admin para receber escalações
UPDATE users 
SET role = 'admin' 
WHERE email = 'novo-destinatario@email.com';

-- Ou como analyst
UPDATE users 
SET role = 'analyst' 
WHERE email = 'outro-destinatario@email.com';
```

## 📊 Dashboard de Monitoramento

```sql
-- Estatísticas de email
SELECT 
  DATE(created_at) as dia,
  COUNT(*) as total_emails,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as enviados,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as falhados
FROM email_logs
GROUP BY DATE(created_at)
ORDER BY dia DESC
LIMIT 7;

-- Últimas escalações com email
SELECT 
  el.triggered_at,
  t.title as ticket,
  el.escalation_type,
  COUNT(em.id) as emails_enviados
FROM escalation_logs el
LEFT JOIN tickets t ON el.ticket_id = t.id
LEFT JOIN email_logs em ON em.created_at::date = el.triggered_at::date
WHERE el.success = true
GROUP BY el.id, t.title, el.triggered_at, el.escalation_type
ORDER BY el.triggered_at DESC
LIMIT 10;
```

## ✨ Template do Email

O email enviado contém:
- **Cabeçalho vermelho** indicando urgência
- **Detalhes do ticket** (ID, título, motivo)
- **Data/hora** em horário de Brasília
- **Botão direto** para abrir o ticket
- **Design responsivo** (funciona em mobile)

## 🔄 Próxima Execução Automática

O sistema verifica tickets automaticamente:
- **A cada 5 minutos** via cron job
- **URL:** `/api/escalation/auto-execute-v2`
- **Processa:** até 10 tickets por vez
- **Timeout:** máximo 8 segundos

## ⚠️ Importante

1. **Limite de envio do Gmail:** 500 emails/dia
2. **Verificação anti-spam:** Evite muitos emails seguidos
3. **Senha de App:** Mais segura que senha normal
4. **Logs:** Sempre verifique `email_logs` para debug

---
**Status:** ✅ Sistema de email configurado e funcionando
**Última atualização:** 19/09/2025