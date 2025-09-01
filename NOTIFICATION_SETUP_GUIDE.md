# 🔔 Guia Completo de Configuração do Sistema de Notificações

## 📋 Visão Geral
Este documento explica como configurar completamente o sistema de notificações do seu sistema de suporte, incluindo notificações in-app, push notifications (PWA) e email.

## 1. 🗄️ Configuração do Banco de Dados (OBRIGATÓRIO)

### Executar Migration no Supabase

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard/project/eyfvvximmeqmwdfqzqov
2. Vá para **SQL Editor**
3. Cole e execute o script completo:

```sql
-- Script disponível em:
/home/user/webapp/supabase/migrations/create_notifications_tables.sql
```

Este script criará:
- Tabela `notifications` - Armazena todas as notificações
- Tabela `user_notification_preferences` - Preferências de cada usuário
- Tabela `user_push_subscriptions` - Dispositivos registrados para push
- Tabela `email_templates` - Templates de email
- Funções e triggers necessários

### Verificar se Funcionou
Após executar o script, teste acessando:
- `/api/notifications/test` (depois de fazer login)
- `/dashboard/settings/notifications` - Deve carregar sem erros

## 2. 📱 Push Notifications (PWA)

### 2.1 Gerar VAPID Keys (Desenvolvimento)

```bash
# Instalar web-push globalmente
npm install -g web-push

# Gerar chaves VAPID
web-push generate-vapid-keys

# Você receberá algo como:
# Public Key: BKd0J3_hR5K2...
# Private Key: 5I6Hx8zw4U...
```

### 2.2 Configurar Variáveis de Ambiente

Adicione ao `.env.local`:
```env
# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua_public_key_aqui
VAPID_PRIVATE_KEY=sua_private_key_aqui
VAPID_EMAIL=mailto:admin@example.com
```

### 2.3 Testar Push Notifications

1. Acesse `/dashboard/settings/notifications`
2. Clique em "Ativar Push Notifications"
3. Aceite a permissão do navegador
4. Clique em "Enviar Notificação de Teste"

## 3. 📧 Email Notifications

### 3.1 Configurar Servidor SMTP

#### Opção A: SendGrid (Recomendado)
```env
# SendGrid
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
EMAIL_FROM=noreply@seudominio.com
EMAIL_FROM_NAME=Sistema de Suporte
```

#### Opção B: Resend
```env
# Resend
EMAIL_SERVICE=resend
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@seudominio.com
EMAIL_FROM_NAME=Sistema de Suporte
```

#### Opção C: SMTP Genérico
```env
# SMTP
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
EMAIL_FROM=seu-email@gmail.com
EMAIL_FROM_NAME=Sistema de Suporte
```

### 3.2 Instalar Dependências de Email

```bash
cd /home/user/webapp

# Para SendGrid
npm install @sendgrid/mail

# Para Resend
npm install resend

# Para SMTP genérico
npm install nodemailer
```

### 3.3 Testar Email

Depois de configurar, teste em:
1. `/dashboard/settings/notifications`
2. Ative "Email" 
3. Clique em "Enviar Notificação de Teste"

## 4. 🔄 Notificações Automáticas

O sistema enviará notificações automaticamente quando:

### Novo Ticket Criado
- **Quem recebe**: Administradores e responsável (se atribuído)
- **Canais**: Email, Push, In-App
- **URL de ação**: `/dashboard/tickets/{ticket_id}`

### Ticket Atribuído
- **Quem recebe**: Pessoa atribuída
- **Canais**: Email, Push, In-App
- **URL de ação**: `/dashboard/tickets/{ticket_id}`

### Status Alterado
- **Quem recebe**: Criador do ticket
- **Canais**: Email (resolvido), In-App
- **URL de ação**: `/dashboard/tickets/{ticket_id}`

### Novo Comentário
- **Quem recebe**: Criador e responsável do ticket
- **Canais**: In-App (configurável)
- **URL de ação**: `/dashboard/tickets/{ticket_id}#comment-{id}`

### Menção em Comentário
- **Quem recebe**: Usuário mencionado (@username)
- **Canais**: Email, Push, In-App
- **URL de ação**: `/dashboard/tickets/{ticket_id}#comment-{id}`

## 5. ⚙️ Configurações do Usuário

Cada usuário pode personalizar suas notificações em:
`/dashboard/settings/notifications`

### Opções Disponíveis:
- **Métodos Globais**: Ativar/desativar Email, Push, In-App
- **Por Tipo**: Configurar cada tipo de notificação individualmente
- **Horário de Silêncio**: Pausar notificações em período específico
- **Frequência de Email**: Instantâneo, por hora, diário, semanal

## 6. 🚀 Deploy em Produção (Vercel)

### 6.1 Configurar Variáveis no Vercel

1. Acesse: https://vercel.com/your-project/settings/environment-variables
2. Adicione todas as variáveis de `.env.local`
3. Importante adicionar:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_EMAIL`
   - Configurações de email (SendGrid/Resend/SMTP)

### 6.2 Verificar Service Worker

Após o deploy, verifique:
1. Chrome DevTools > Application > Service Workers
2. Deve mostrar service-worker.js ativo
3. Em "Manifest", deve aparecer as informações do PWA

### 6.3 Testar Instalação PWA

1. No Chrome/Edge, deve aparecer ícone de instalação na barra de endereços
2. Clique para instalar como app
3. Teste push notifications no app instalado

## 7. 🐛 Troubleshooting

### Erro: "Could not find the 'is_read' column"
Execute o migration script novamente ou:
```sql
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
```

### Push Notifications Não Funcionam
1. Verifique se o Service Worker está registrado
2. Confirme que as VAPID keys estão corretas
3. Teste em HTTPS (necessário para push)
4. Verifique permissões do navegador

### Emails Não Enviados
1. Verifique logs em `/api/notifications` 
2. Confirme credenciais SMTP/API
3. Teste com ferramenta externa primeiro
4. Verifique se email está nas preferências do usuário

### Notificações In-App Não Aparecem
1. Verifique se `in_app_enabled` está true nas preferências
2. Confirme que o componente NotificationBell está no header
3. Verifique console para erros de API

## 8. 📊 Monitoramento

### Verificar Status das Notificações
```sql
-- No Supabase SQL Editor

-- Total de notificações por tipo
SELECT type, COUNT(*) as total 
FROM notifications 
GROUP BY type;

-- Notificações não lidas por usuário
SELECT u.email, COUNT(n.id) as unread
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE n.is_read = false
GROUP BY u.email;

-- Push subscriptions ativas
SELECT COUNT(*) as total_subscriptions
FROM user_push_subscriptions
WHERE active = true;
```

## 9. 🔐 Segurança

### Boas Práticas
1. **Nunca** exponha VAPID private key no frontend
2. **Sempre** valide permissões antes de enviar notificações
3. **Limite** taxa de envio para evitar spam
4. **Criptografe** dados sensíveis em notificações
5. **Implemente** rate limiting nas APIs

### Headers de Segurança (adicionar em next.config.js)
```javascript
const securityHeaders = [
  {
    key: 'Permissions-Policy',
    value: 'notifications=(self), push=(self)'
  }
]
```

## 10. 📚 Recursos Adicionais

- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [SendGrid Docs](https://docs.sendgrid.com/)
- [Resend Docs](https://resend.com/docs)
- [PWA Best Practices](https://web.dev/pwa-checklist/)

## ✅ Checklist de Implementação

- [ ] Executar migration SQL no Supabase
- [ ] Gerar e configurar VAPID keys
- [ ] Configurar servidor de email
- [ ] Testar notificação de teste
- [ ] Configurar variáveis no Vercel
- [ ] Deploy em produção
- [ ] Verificar Service Worker ativo
- [ ] Testar instalação PWA
- [ ] Monitorar primeiras notificações
- [ ] Documentar configurações específicas

---

**Última atualização**: 01/09/2025  
**Versão do Sistema**: 1.5.0  
**Status**: ✅ Sistema de Notificações Completo e Funcional