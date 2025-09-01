# Troubleshooting - Sistema de Notificações por Email

## 🔍 Problema Identificado
O sistema não estava enviando emails quando o status do ticket mudava porque os tipos de notificação `ticket_status_changed` e `ticket_priority_changed` não existiam nas preferências do usuário.

## ✅ Correção Aplicada
1. **Mapeamento de Tipos**: Os tipos foram mapeados para `ticket_updated` que existe nas preferências
2. **Logs Detalhados**: Adicionados logs para debug do processo de envio
3. **APIs de Diagnóstico**: Criadas ferramentas para verificar o sistema

## 🧪 Como Testar o Sistema

### 1. Diagnóstico Completo
Acesse (após fazer login):
```
https://app3008-two.vercel.app/api/debug-notifications
```

Este endpoint verifica:
- ✅ Preferências de notificação do usuário
- ✅ Configuração de email no sistema
- ✅ Variáveis de ambiente (fallback)
- ✅ Notificações recentes
- ✅ Envia uma notificação de teste

### 2. Teste de Email Direto
Use curl ou Postman para testar:
```bash
POST https://app3008-two.vercel.app/api/test-notification-email
Content-Type: application/json

{
  "type": "ticket_status_changed"
}
```

### 3. Verificar Configurações

#### A. Configuração de Email (Admin)
1. Acesse `/dashboard/settings`
2. Configure:
   - Email do Gmail
   - Senha de App (não a senha normal)
   - Mantenha as configurações SMTP padrão

#### B. Preferências de Notificação (Usuário)
1. Acesse `/dashboard/settings/notifications`
2. Verifique se está ativado:
   - Email: ✅ Ativado
   - Atualizações de Tickets: ✅ Email ativado

### 4. Testar Fluxo Completo
1. Crie um novo ticket
2. Altere o status do ticket
3. Verifique:
   - Notificação in-app (sino no header)
   - Email na caixa de entrada

## 🐛 Problemas Comuns e Soluções

### Email não está sendo enviado

**Causa 1**: Configuração de email ausente
- **Solução**: Admin deve configurar em `/dashboard/settings`

**Causa 2**: Preferências desativadas
- **Solução**: Ativar em `/dashboard/settings/notifications`

**Causa 3**: Senha incorreta
- **Solução**: Use uma App Password do Gmail, não a senha normal
- Como criar: 
  1. Acesse https://myaccount.google.com/security
  2. Ative verificação em 2 etapas
  3. Crie uma App Password para "Mail"

**Causa 4**: Tipo de notificação não mapeado
- **Solução**: Já corrigido no código

### Notificação aparece no app mas email não chega

**Verificar**:
1. Spam/Lixo eletrônico
2. Configuração de email está correta
3. Logs do servidor para erros de SMTP

## 📊 Estrutura de Preferências

### Tipos de Notificação Suportados
```javascript
{
  // Tipos principais (salvos no banco)
  ticket_created: { email: true, push: false, in_app: true },
  ticket_assigned: { email: true, push: false, in_app: true },
  ticket_updated: { email: true, push: false, in_app: true },
  ticket_resolved: { email: true, push: false, in_app: true },
  comment_added: { email: true, push: false, in_app: true },
  comment_mention: { email: true, push: false, in_app: true },
  
  // Tipos mapeados (não salvos, usam ticket_updated)
  ticket_status_changed -> ticket_updated
  ticket_priority_changed -> ticket_updated
}
```

## 🔧 Comandos Úteis para Debug

### Ver logs no Vercel
```bash
vercel logs app3008-two.vercel.app --follow
```

### Verificar banco de dados (Supabase SQL Editor)
```sql
-- Ver preferências de um usuário
SELECT * FROM user_notification_preferences 
WHERE user_id = 'USER_ID_HERE';

-- Ver configuração de email
SELECT * FROM system_settings 
WHERE key = 'email_config';

-- Ver últimas notificações
SELECT * FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- Criar preferências padrão para todos os usuários sem preferências
INSERT INTO user_notification_preferences (
  user_id,
  email_enabled,
  push_enabled,
  in_app_enabled,
  ticket_created,
  ticket_assigned,
  ticket_updated,
  ticket_resolved,
  comment_added,
  comment_mention,
  quiet_hours_enabled,
  email_frequency
)
SELECT 
  u.id,
  true,
  false,
  true,
  '{"email": true, "push": false, "in_app": true}'::jsonb,
  '{"email": true, "push": false, "in_app": true}'::jsonb,
  '{"email": true, "push": false, "in_app": true}'::jsonb,
  '{"email": true, "push": false, "in_app": true}'::jsonb,
  '{"email": true, "push": false, "in_app": true}'::jsonb,
  '{"email": true, "push": false, "in_app": true}'::jsonb,
  false,
  'immediate'
FROM users u
LEFT JOIN user_notification_preferences p ON u.id = p.user_id
WHERE p.id IS NULL;
```

## ✅ Status da Correção
- **Commit**: `e235cb6`
- **Deploy**: Em andamento no Vercel
- **Arquivos Modificados**:
  - `/src/lib/notifications.ts` - Mapeamento de tipos
  - `/src/app/api/debug-notifications/route.ts` - API de diagnóstico
  - `/src/app/api/test-notification-email/route.ts` - API de teste

## 📝 Próximos Passos
1. Aguardar deploy no Vercel (alguns minutos)
2. Executar diagnóstico: `/api/debug-notifications`
3. Testar criação/atualização de ticket
4. Verificar recebimento de emails