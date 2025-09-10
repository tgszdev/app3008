# 🎫 Sistema de Suporte - Help Desk

## 📋 Visão Geral

Sistema completo de Help Desk desenvolvido com Next.js 15, TypeScript, Supabase e TailwindCSS. Oferece gerenciamento de tickets, base de conhecimento, controle de timesheets e sistema avançado de permissões.

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

#### 🔐 **Sistema de Permissões**
- ✅ **24 permissões granulares** configuráveis
- ✅ **Roles customizadas** (além de admin, analyst, user)
- ✅ Cache de permissões (5 minutos)
- ✅ Hook `usePermissions` para verificação em componentes
- ✅ Página de teste de permissões (`/dashboard/test-permissions`)
- ✅ Gerenciamento visual de roles e permissões

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

### 🚧 Funcionalidades em Desenvolvimento
- [ ] Integração com Slack/Discord
- [ ] Automação de workflows
- [ ] SLA avançado
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
- custom_roles (roles personalizadas)
- activity_logs (logs de atividades)
```

## 🚀 Como Usar

### Instalação Local
```bash
# Clone o repositório
git clone [seu-repositorio]

# Instale as dependências
cd webapp
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local

# Execute as migrations do banco
npm run db:migrate

# Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
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

- **Versão**: 1.5.5
- **Status**: ✅ Produção
- **Última Atualização**: 10/09/2025
- **Mantenedor**: Sistema automatizado

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença MIT.

---

**Desenvolvido com ❤️ usando Next.js e Supabase**