# 🎫 Sistema de Suporte - Help Desk

## 📋 Visão Geral

Sistema completo de Help Desk desenvolvido com Next.js 15, TypeScript, Supabase e TailwindCSS. Oferece gerenciamento de tickets com **escalação automática por email**, base de conhecimento, controle de timesheets e sistema avançado de permissões. **100% funcional** com timezone Brasil (America/Sao_Paulo) configurado.

## ✨ Funcionalidades Principais

### ✅ Funcionalidades Implementadas

#### 🎟️ **Sistema de Tickets**
- ✅ Criação, edição e exclusão de tickets
- ✅ Atribuição de responsáveis com permissões dinâmicas
- ✅ Sistema de prioridades (Baixa, Média, Alta, Crítica)
- ✅ Status personalizados
- ✅ Categorização de tickets
- ✅ Upload de anexos
- ✅ Tickets internos (visíveis apenas para staff)
- ✅ Sistema de comentários
- ✅ Histórico de alterações
- ✅ **NOVO: Escalação automática por email** (1h sem atribuição, 4h sem resposta, 24h sem resolução)
- ✅ **NOVO: Timezone Brasil** (America/Sao_Paulo) em todas as datas
- ✅ **NOVO: Cron jobs** executando a cada 3 minutos no Vercel

#### 🔐 **Sistema de Permissões**
- ✅ **24 permissões granulares** configuráveis
- ✅ **Roles customizadas** (além de admin, analyst, user)
- ✅ Cache de permissões (5 minutos) com limpeza automática
- ✅ Hook `usePermissions` para verificação em componentes
- ✅ Página de teste de permissões (`/dashboard/test-permissions`)
- ✅ Gerenciamento visual de roles e permissões
- ✅ **Botão "Limpar Cache"** no gerenciamento de roles
- ✅ **Debug logging** para rastreamento de permissões
- ✅ **Correção aplicada**: Botão excluir agora aparece corretamente para roles customizadas

#### 👥 **Gerenciamento de Usuários**
- ✅ Cadastro e autenticação via NextAuth
- ✅ Login com email/senha e Google OAuth
- ✅ Perfis de usuário personalizáveis
- ✅ Atribuição de roles dinâmicas
- ✅ Upload de avatar

#### 📚 **Base de Conhecimento**
- ✅ Criação e edição de artigos
- ✅ Categorização de conteúdo
- ✅ Sistema de busca
- ✅ Controle de visibilidade

#### ⏰ **Timesheets**
- ✅ Registro de horas trabalhadas
- ✅ Aprovação de timesheets
- ✅ Relatórios e analytics
- ✅ Exportação de dados

#### 📊 **Dashboard e Analytics**
- ✅ Visão geral de tickets
- ✅ Métricas de desempenho
- ✅ Gráficos interativos
- ✅ Relatórios customizáveis

#### 📧 **Sistema de Email e Escalação**
- ✅ Envio automático de emails para escalação
- ✅ Suporte a múltiplos provedores (SendGrid, SMTP, Resend, Supabase)
- ✅ Templates de email personalizáveis
- ✅ Logs de envio e rastreamento
- ✅ Regras de escalação configuráveis via SQL

### 🚧 Funcionalidades em Desenvolvimento
- [ ] Integração com Slack/Discord
- [ ] Automação de workflows avançada
- [ ] SLA com múltiplos níveis
- [ ] Chat em tempo real
- [ ] App mobile

## 🌐 URLs de Acesso

- **Desenvolvimento**: https://3000-i968ax1d7t7cf739vyajj-6532622b.e2b.dev
- **Produção**: _(aguardando deploy)_
- **Backup do Projeto**: [Download](https://page.gensparksite.com/project_backups/toolu_01U7biSaPjAQ5y6krKCZ8tSo.tar.gz)

## 🏗️ Arquitetura

### Stack Tecnológico
- **Frontend**: Next.js 15.5.2 (App Router)
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: NextAuth v5
- **Styling**: TailwindCSS
- **State**: React Hooks + Context
- **Cache**: In-memory com TTL
- **Deploy**: Vercel/Netlify/Railway

### Estrutura de Dados
```sql
-- Principais tabelas
- users (gerenciado pelo Supabase Auth)
- profiles (dados adicionais do usuário)
- tickets (chamados de suporte)
- ticket_comments (comentários)
- ticket_attachments (anexos)
- categories (categorias de tickets)
- kb_articles (base de conhecimento)
- kb_categories (categorias da KB)
- timesheets (registro de horas)
- roles (perfis customizados com permissões)
- activity_logs (logs de atividades)
```

## 🚀 Como Usar

### Instalação Local
```bash
# Clone o repositório
git clone https://github.com/tgszdev/app3008.git

# Instale as dependências
cd webapp
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# IMPORTANTE: Configure as credenciais de email em .env.local

# Execute as migrations do banco
npm run db:migrate

# Configure as regras de escalação automática
npx supabase db push < sql/insert_escalation_rules.sql

# Inicie o servidor de desenvolvimento
npm run dev
```

### ⚡ Configuração Rápida de Email
```bash
# Para Gmail - adicione em .env.local:
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=seu-email@gmail.com
EMAIL_SERVER_PASSWORD=sua-senha-de-app  # Use senha de app, não a senha normal
EMAIL_FROM=seu-email@gmail.com
```

### Variáveis de Ambiente
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# NextAuth
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Email (configure apenas UM provedor)
# Opção 1: SendGrid
SENDGRID_API_KEY=

# Opção 2: SMTP
EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=

# Opção 3: Resend
RESEND_API_KEY=

# Email From (para todos os provedores)
EMAIL_FROM=
```

## 📖 Guia do Usuário

### Para Usuários Comuns
1. Faça login com seu email/senha ou Google
2. Crie um novo ticket em "Novo Chamado"
3. Acompanhe o status em "Meus Chamados"
4. Consulte a base de conhecimento para soluções

### Para Analistas/Admin
1. Acesse o dashboard para visão geral
2. Gerencie tickets em "Todos os Chamados"
3. Atribua responsáveis (requer permissão `tickets_assign`)
4. Crie artigos na base de conhecimento
5. Gerencie usuários e permissões

### Testando Permissões
1. Acesse `/dashboard/test-permissions`
2. Verifique suas permissões atuais
3. Teste funcionalidades baseadas em permissões

## 🔧 Comandos Úteis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run start        # Iniciar produção
npm run lint         # Verificar código
npm run test         # Executar testes
pm2 start webapp     # Iniciar com PM2
pm2 logs webapp      # Ver logs
```

## 📈 Status do Projeto

- **Versão**: 1.6.0
- **Status**: ✅ Produção - 100% Funcional
- **Última Atualização**: 18/09/2025
- **GitHub**: https://github.com/tgszdev/app3008
- **URL de Desenvolvimento**: https://3000-i968ax1d7t7cf739vyajj-6532622b.e2b.dev
- **Backup**: https://page.gensparksite.com/project_backups/toolu_01WULLFFS16LGgcFQgK6DcxA.tar.gz

## 🔧 Resolução de Problemas

### Emails de escalação não estão sendo enviados
1. Configure as credenciais de email em `.env.local`
2. Execute o SQL em `sql/insert_escalation_rules.sql` no Supabase
3. Verifique logs em: `SELECT * FROM email_logs ORDER BY created_at DESC`
4. Consulte a documentação completa em `docs/CONFIGURACAO_EMAIL.md`

### Datas aparecem como "Data Inválida" ou "N/A"
- Problema corrigido na versão 1.6.0
- Todas as datas agora usam timezone America/Sao_Paulo
- Se persistir, verifique o formato da data no banco

### Permissões não funcionam após criar/editar roles
1. Acesse **Configurações > Gerenciar Perfis**
2. Clique em **"Limpar Cache"**
3. Faça **logout** e **login** novamente
4. As novas permissões serão aplicadas

### Botão de ação não aparece mesmo com permissão
1. Abra o **Console do Navegador** (F12)
2. Verifique os logs de debug de permissões
3. Confirme que a permissão está `true`
4. Se persistir, limpe o cache do navegador

### Como verificar minhas permissões
- Acesse `/dashboard/test-permissions` para ver todas as suas permissões atuais
- O sistema mostra quais permissões você tem e quais não tem

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença MIT.

---

**Desenvolvido com ❤️ usando Next.js e Supabase**# Deploy automatizado configurado
