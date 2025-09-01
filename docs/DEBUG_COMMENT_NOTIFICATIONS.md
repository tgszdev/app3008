# 🐛 Debug: Notificações de Comentários

## Problema Reportado
As notificações por email não estão sendo enviadas quando um comentário é adicionado a um ticket.

## Verificações Implementadas

### 1. Logs Detalhados Adicionados
Adicionei logs em `/api/tickets/comments/route.ts`:
- Log quando inicia o processamento
- Log dos IDs envolvidos (ticket, usuário, comentário)
- Log se vai notificar o criador
- Log se vai notificar o responsável
- Log do resultado de cada notificação

### 2. API de Teste Específica
Criada em `/api/test-comment-notification`:
```bash
POST /api/test-comment-notification
{
  "ticket_id": "opcional-id-do-ticket"
}
```

Esta API:
- Simula um comentário em um ticket
- Verifica preferências de todos os envolvidos
- Tenta enviar notificações
- Retorna análise detalhada

## Como Testar

### Método 1: Teste Direto da API
```bash
curl -X POST https://app3008-two.vercel.app/api/test-comment-notification \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=SEU_TOKEN" \
  -d '{}'
```

### Método 2: Adicionar Comentário Real
1. Acesse um ticket existente
2. Adicione um comentário
3. Verifique os logs do Vercel:
```bash
vercel logs app3008-two.vercel.app --follow | grep "NOTIFICAÇÕES DE COMENTÁRIO"
```

### Método 3: Verificar no Banco de Dados
```sql
-- Ver últimos comentários
SELECT 
    c.id,
    c.content,
    c.created_at,
    t.ticket_number,
    u.name as commenter
FROM ticket_comments c
JOIN tickets t ON c.ticket_id = t.id
JOIN users u ON c.user_id = u.id
ORDER BY c.created_at DESC
LIMIT 5;

-- Ver preferências de notificação
SELECT 
    u.email,
    p.email_enabled,
    p.comment_added->>'email' as comment_email_enabled
FROM users u
JOIN user_notification_preferences p ON u.id = p.user_id;
```

## Possíveis Causas

### 1. Condições para Notificação
O sistema só envia notificação de comentário se:
- ❓ O usuário que comenta NÃO é o criador do ticket
- ❓ O usuário que comenta NÃO é o responsável
- ❓ O destinatário tem email_enabled = true
- ❓ O destinatário tem comment_added.email = true
- ❓ O sistema tem email configurado

### 2. Cenários que NÃO Geram Notificação

#### Cenário A: Auto-comentário
```
Criador: João
Responsável: Maria
Comentando: João
Resultado: Maria recebe notificação, João não (ele mesmo comentou)
```

#### Cenário B: Ticket sem responsável
```
Criador: João
Responsável: (vazio)
Comentando: Maria
Resultado: Apenas João recebe notificação
```

#### Cenário C: Mesmo usuário é criador e responsável
```
Criador: João
Responsável: João
Comentando: Maria
Resultado: João recebe apenas 1 notificação (não duplica)
```

## Checklist de Verificação

### Para o Administrador:
- [ ] Email configurado em `/dashboard/settings`
- [ ] Teste de email funcionando

### Para o Usuário que Deve Receber:
- [ ] Tem preferências criadas (verificar com API de debug)
- [ ] Email global ativado
- [ ] "Novo Comentário" com email ativado
- [ ] Não é o próprio usuário comentando

### Para o Sistema:
- [ ] Ticket tem created_by válido
- [ ] IDs de usuário estão corretos
- [ ] Função createAndSendNotification está retornando true

## Logs para Procurar

Após adicionar um comentário, procure nos logs:

```
=== PROCESSANDO NOTIFICAÇÕES DE COMENTÁRIO ===
Tentando notificar criador do ticket:
Resultado da notificação para criador: ✅ Sucesso
DEBUG: Verificando envio de email
Tentando enviar email para:
✅ Email de notificação enviado com sucesso
```

Se você ver:
```
Criador não notificado porque:
```
Significa que uma das condições não foi atendida.

## SQL para Criar Preferências Manualmente

Se as preferências não existirem:
```sql
-- Criar para um usuário específico
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
) VALUES (
    'USER_ID_AQUI',
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
) ON CONFLICT (user_id) DO UPDATE SET
    comment_added = '{"email": true, "push": false, "in_app": true}'::jsonb;
```

## Próximos Passos

1. **Execute o teste específico**:
   ```
   POST /api/test-comment-notification
   ```

2. **Verifique os logs** após adicionar um comentário real

3. **Confirme as preferências** do usuário que deveria receber

4. **Teste com diferentes usuários** para identificar o padrão

O sistema está com logs detalhados agora. Após executar um teste, os logs mostrarão exatamente onde o processo está falhando.