# Sistema de Suporte Técnico

## 📋 Visão Geral
**Nome**: Support System  
**Objetivo**: Sistema completo de gestão de chamados técnicos com suporte a PWA  
**Stack**: Next.js 15 + TypeScript + Supabase + Tailwind CSS

## 🌐 URLs de Acesso
- **Produção (Vercel)**: https://app3008-two.vercel.app
- **Login**: `/login`
- **Dashboard**: `/dashboard`
- **Chamados**: `/dashboard/tickets`
- **Gerenciamento de Usuários**: `/dashboard/users`
- **Supabase Dashboard**: https://supabase.com/dashboard/project/eyfvvximmeqmwdfqzqov

## ✅ Funcionalidades Implementadas

### 1. **Dashboard 100% Funcional com Dados Reais**
- ✅ **Estatísticas em Tempo Real do Banco de Dados**:
  - Total de tickets, abertos, em progresso, resolvidos e cancelados
  - Tempo médio de resolução calculado dinamicamente
  - Tendências de crescimento comparando períodos
  - Contagem de usuários ativos
- ✅ **Tickets Recentes**: Lista dos últimos 5 tickets com dados reais
- ✅ **Cards Responsivos**: Layout adaptativo para mobile e desktop
- ✅ **Navegação**: Click nos tickets para abrir detalhes
- ✅ **API de Analytics**: Endpoint para dados analíticos por período
- ✅ **Indicadores Visuais**: Cores e ícones por status e prioridade
- ✅ **Loading States**: Indicadores de carregamento apropriados

### 2. **Autenticação e Autorização**
- ✅ Sistema de login com NextAuth.js v5
- ✅ **3 níveis de acesso com permissões diferenciadas**:
  - **Admin**: Acesso total ao sistema (único que pode excluir tickets)
  - **Analyst**: Gerenciamento de tickets (criar, editar status, atribuir), sem poder excluir ou gerenciar usuários
  - **User**: Criar tickets, adicionar comentários e anexos (sem alteração de status, sem atribuir analistas)
- ✅ **Proteção de rotas com middleware (Edge Runtime)**
- ✅ **Proteção server-side em todas as páginas**
- ✅ **APIs protegidas com verificação de sessão**
- ✅ Sessão JWT persistente
- ✅ **Logout com limpeza completa de cookies**
- ✅ **Redirecionamento automático para login quando não autenticado**
- ✅ **Controle de permissões baseado em role**:
  - Usuários com role "user" não podem atribuir analistas
  - Usuários com role "user" não podem definir data de vencimento (SLA)
  - Usuários com role "user" não podem excluir tickets
  - Usuários com role "user" não podem alterar status de tickets

### 3. **Gerenciamento de Usuários (CRUD Completo)**
- ✅ **Listagem**: Exibição de todos os usuários do banco
- ✅ **Criação**: Adicionar novos usuários com senha criptografada (bcrypt)
- ✅ **Edição**: Atualizar informações do usuário
- ✅ **Exclusão**: Remover usuários (exceto admin principal)
- ✅ **Ativação/Desativação**: Toggle de status do usuário
- ✅ **Filtros**: Por nome, email, perfil e status
- ✅ **Busca**: Sistema de busca em tempo real
- ✅ **Alteração de Senha**: Administradores podem alterar senha de qualquer usuário

### 4. **Integração com Banco de Dados Real**
- ✅ **Supabase PostgreSQL**: Banco de dados hospedado
- ✅ **API Routes**: GET, POST, PATCH, DELETE funcionais
- ✅ **Migrations**: Estrutura de tabelas criada
- ✅ **Seed Data**: 6 usuários de teste inseridos

### 5. **Interface de Usuário**
- ✅ **Dark Mode**: Tema claro/escuro funcional
- ✅ **Responsividade**: Layout adaptativo para mobile/desktop
- ✅ **Componentes Reutilizáveis**: Sistema modular
- ✅ **Feedback Visual**: Toast notifications (react-hot-toast)
- ✅ **Loading States**: Indicadores de carregamento
- ✅ **Modais**: Sistema de modais para criar/editar

### 6. **Gerenciamento de Chamados (Tickets)**
- ✅ **CRUD Completo**: Criar, listar, editar, excluir chamados
- ✅ **Status**: open, in_progress, resolved, closed, **cancelled** (novo)
- ✅ **Prioridades**: low, medium, high, critical
- ✅ **Categorias**: general, hardware, software, network, etc.
- ✅ **Atribuição**: Designar chamados para analistas
- ✅ **Histórico**: Registro de todas as alterações
- ✅ **Filtros**: Por status, prioridade, usuário
- ✅ **Relacionamentos**: Integração com tabela de usuários
- ✅ **Permissões por Perfil**:
  - Admin: Todas as ações incluindo exclusão, cancelamento e reativação de tickets cancelados
  - Analyst: Criar, editar, alterar status (exceto cancelar), atribuir (sem poder excluir ou cancelar)
  - User: Apenas criar, visualizar, comentar e anexar arquivos
- ✅ **Regras de Cancelamento**:
  - Apenas Admin pode cancelar tickets
  - Motivo obrigatório ao cancelar (salvo nos comentários)
  - Apenas Admin pode reativar tickets cancelados
  - Motivo obrigatório ao reativar (salvo nos comentários)
  - **Tickets cancelados são bloqueados**: Apenas Admin pode comentar, anexar arquivos ou fazer alterações

### 7. **Sistema de Notificações Completo**
- ✅ **Push Notifications (PWA)**: Service Worker configurado para notificações push
- ✅ **Email Notifications**: Sistema de templates de email HTML/Text
- ✅ **Configuração de Email via Interface Web**: 
  - Configurar Gmail/SMTP em `/dashboard/settings`
  - Armazenamento seguro com criptografia AES-256-CBC
  - Não requer acesso ao servidor ou variáveis de ambiente
  - Suporte a Gmail com App Passwords
- ✅ **In-app Notifications**: Dropdown de notificações em tempo real
- ✅ **Preferências de Usuário**: Configuração por tipo de notificação
- ✅ **Notificações Automáticas**:
  - Novo ticket criado (admins e responsável)
  - Ticket atribuído (responsável)
  - Mudança de status (criador do ticket)
  - Mudança de prioridade (criador do ticket)
  - Novo comentário (criador e responsável)
  - Menções em comentários (@username)
- ✅ **URLs Contextuais**: Links diretos para tickets/comentários
- ✅ **Página de Notificações**: Lista completa com filtros e busca
- ✅ **Marcar como Lida**: Individual ou em massa
- ✅ **Horário de Silêncio**: Pausar notificações em período específico
- ✅ **Background Sync**: Sincronização de notificações offline
- ✅ **Periodic Sync**: Verificação periódica de novas notificações

### 8. **PWA Support**
- ✅ **Service Worker**: Cache offline e push notifications
- ✅ **Manifest**: Arquivo de manifesto PWA
- ✅ **Offline Page**: Página customizada para modo offline
- ✅ **Instalável**: Pode ser instalado como app
- ✅ **Background Sync**: Sincronização em background
- ✅ **Push API**: Notificações push nativas

### 9. **Sistema de Anexos de Arquivos**
- ✅ **Upload de Arquivos**: Anexar arquivos aos chamados (máx. 10MB)
- ✅ **Tipos Suportados**: Imagens (PNG, JPG, GIF), Documentos (PDF, DOC, DOCX, XLS, XLSX, TXT)
- ✅ **Visualização**: Preview de imagens diretamente na página
- ✅ **Download**: Baixar anexos dos chamados
- ✅ **Integração Supabase Storage**: Armazenamento seguro em bucket dedicado
- ✅ **Validação**: Verificação de tipo e tamanho de arquivo

### 10. **Gerenciamento de Categorias**
- ✅ **CRUD Completo de Categorias**: Criar, listar, editar e excluir
- ✅ **Campos Personalizáveis**: Nome, descrição, ícone e cor
- ✅ **Ordenação**: Sistema de ordenação com setas up/down
- ✅ **Status**: Ativar/desativar categorias
- ✅ **Validações**: Não permite excluir categorias com tickets
- ✅ **Slug Automático**: Geração automática de URL amigável
- ✅ **Migração de Dados**: Script SQL para migrar categorias existentes
- ✅ **Interface Admin**: Página exclusiva para administradores
- ✅ **API RESTful**: Endpoints completos em `/api/categories`
- ✅ **10 Categorias Padrão**: Geral, Hardware, Software, Rede, etc.
- ✅ **Upload de Arquivos**: Anexar arquivos aos chamados (máx. 10MB)
- ✅ **Tipos Suportados**: Imagens (PNG, JPG, GIF), Documentos (PDF, DOC, DOCX, XLS, XLSX, TXT)
- ✅ **Visualização**: Preview de imagens diretamente na página
- ✅ **Download**: Baixar anexos dos chamados
- ✅ **Integração Supabase Storage**: Armazenamento seguro em bucket dedicado
- ✅ **Validação**: Verificação de tipo e tamanho de arquivo

## 📈 APIs Disponíveis

### Dashboard e Analytics

### `/api/dashboard/stats`
- **Método**: GET
- **Descrição**: Retorna estatísticas em tempo real do sistema
- **Resposta**: 
  - Contadores de tickets por status
  - Tempo médio de resolução
  - Tendências de crescimento
  - Tickets recentes
  - Usuários ativos

### `/api/dashboard/analytics`
- **Método**: GET
- **Parâmetros**: `?period=7days|30days|90days|1year`
- **Descrição**: Retorna dados analíticos para gráficos
- **Resposta**:
  - Tickets por dia
  - Distribuição por status
  - Distribuição por prioridade
  - Top performers (analistas)
  - Métricas de desempenho

### `/api/categories`
- **GET**: Lista todas as categorias (com filtro `?active_only=true`)
- **POST**: Cria nova categoria (admin only)
- **PUT**: Atualiza categoria (admin only)
- **DELETE**: Exclui categoria (admin only, `?id=uuid`)

### `/api/notifications`
- **GET**: Lista notificações do usuário (`?unread=true&limit=20&offset=0`)
- **POST**: Cria nova notificação
- **PATCH**: Marca como lida (`notification_id` ou `mark_all=true`)
- **DELETE**: Remove notificação (`?id=uuid`)

### `/api/notifications/preferences`
- **GET**: Busca preferências de notificação do usuário
- **PATCH**: Atualiza preferências

### `/api/notifications/subscribe`
- **POST**: Registra push subscription
- **DELETE**: Remove push subscription (`?endpoint=url`)
- **GET**: Lista push subscriptions ativas

### `/api/notifications/check`
- **GET**: Verifica novas notificações não lidas

### `/api/notifications/test`
- **POST**: Envia notificação de teste

### `/api/settings/email`
- **GET**: Busca configurações de email (admin only)
- **POST**: Salva configurações de email (admin only)

### `/api/test-email`
- **GET**: Verifica status da configuração de email
- **POST**: Envia email de teste para o usuário logado

## 📊 Estrutura de Dados

### Tabela: `users`
```sql
- id: UUID (PK)
- email: TEXT (unique)
- name: TEXT
- password_hash: TEXT
- role: TEXT (admin|analyst|user)
- department: TEXT
- phone: TEXT
- is_active: BOOLEAN
- last_login: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Tabela: `tickets`
```sql
- id: UUID (PK)
- ticket_number: SERIAL (unique)
- title: TEXT
- description: TEXT
- status: TEXT (open|in_progress|resolved|closed)
- priority: TEXT (low|medium|high|critical)
- category: TEXT
- created_by: UUID (FK users)
- assigned_to: UUID (FK users)
- resolution_notes: TEXT
- resolved_at: TIMESTAMP
- closed_at: TIMESTAMP
- due_date: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Tabela: `ticket_comments`
```sql
- id: UUID (PK)
- ticket_id: UUID (FK tickets)
- user_id: UUID (FK users)
- content: TEXT
- is_internal: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Tabela: `categories`
```sql
- id: UUID (PK)
- name: VARCHAR(100) (unique)
- slug: VARCHAR(100) (unique)
- description: TEXT
- icon: VARCHAR(50)
- color: VARCHAR(7)
- is_active: BOOLEAN
- display_order: INTEGER
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- created_by: UUID (FK users)
- updated_by: UUID (FK users)
```

### Tabela: `notifications`
```sql
- id: UUID (PK)
- user_id: UUID (FK users)
- title: VARCHAR(255)
- message: TEXT
- type: VARCHAR(50)
- severity: VARCHAR(20) (info|warning|error|success)
- data: JSONB
- is_read: BOOLEAN
- read_at: TIMESTAMP
- created_at: TIMESTAMP
- expires_at: TIMESTAMP
- action_url: TEXT
```

### Tabela: `user_notification_preferences`
```sql
- id: UUID (PK)
- user_id: UUID (FK users, unique)
- email_enabled: BOOLEAN
- push_enabled: BOOLEAN
- in_app_enabled: BOOLEAN
- ticket_created: JSONB
- ticket_assigned: JSONB
- ticket_updated: JSONB
- ticket_resolved: JSONB
- comment_added: JSONB
- comment_mention: JSONB
- quiet_hours_enabled: BOOLEAN
- quiet_hours_start: TIME
- quiet_hours_end: TIME
- email_frequency: VARCHAR(20)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Tabela: `user_push_subscriptions`
```sql
- id: UUID (PK)
- user_id: UUID (FK users)
- endpoint: TEXT
- keys: JSONB (p256dh, auth)
- device_info: JSONB
- active: BOOLEAN
- created_at: TIMESTAMP
- last_used: TIMESTAMP
```

### Tabela: `email_templates`
```sql
- id: UUID (PK)
- name: VARCHAR(100) (unique)
- subject: VARCHAR(255)
- html_body: TEXT
- text_body: TEXT
- variables: JSONB
- active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Tabela: `system_settings`
```sql
- id: UUID (PK)
- key: VARCHAR(100) (unique)
- value: JSONB
- description: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- updated_by: UUID (FK users)
```

## 🔐 Credenciais de Teste
```
Admin:
  Email: admin@example.com
  Senha: admin123

Analistas:
  Email: analyst1@example.com / analyst2@example.com
  Senha: analyst123

Usuários:
  Email: user1@example.com / user2@example.com / user3@example.com
  Senha: user123
```

## 🚨 CONFIGURAÇÃO DO SISTEMA DE NOTIFICAÇÕES

### Erro: "Could not find the 'action_url' column"

Se você receber este erro ao tentar enviar notificações de teste, execute um dos scripts SQL abaixo no Supabase:

#### Opção 1: Adicionar colunas faltantes (recomendado)
```sql
-- Execute o script em:
/home/user/webapp/supabase/migrations/fix_notifications_columns.sql
```

#### Opção 2: Recriar tabela completa (se a opção 1 não funcionar)
```sql
-- Execute o script em:
/home/user/webapp/supabase/migrations/recreate_notifications_table.sql
```

### Verificar se funcionou:
Acesse: `/api/notifications/test` após fazer login

## 🚨 CORREÇÃO DO ERRO DE RELACIONAMENTO

### Erro Atual:
```
Could not find a relationship between 'tickets' and 'users' in the schema cache
```

### Solução Rápida:
1. Acesse o SQL Editor do Supabase
2. Execute o script: `/home/user/webapp/supabase/fix-relationships.sql`
3. Teste criando um novo chamado

**Instruções detalhadas em:** `/home/user/webapp/SOLUCAO_RAPIDA_ERRO_TICKETS.md`

## 🚀 Como Executar

### Desenvolvimento Local:
```bash
# Instalar dependências
npm install

# Verificar banco de dados
npm run db:check

# Popular banco com dados de teste
npm run db:seed

# Build da aplicação
npm run build

# Iniciar servidor
npm run start
# ou com PM2
pm2 start ecosystem.config.cjs
```

### Scripts Disponíveis:
- `npm run dev` - Modo desenvolvimento
- `npm run build` - Build de produção
- `npm run start` - Iniciar em produção
- `npm run db:check` - Verificar status do banco
- `npm run db:seed` - Popular banco com dados de teste
- `npm run db:setup` - Configurar banco de dados

### 6. **Gestão de Chamados (CRUD Completo)**
- ✅ **Listagem**: Visualização de todos os chamados
- ✅ **Criação**: Novo chamado com título, descrição, prioridade
- ✅ **Edição**: Atualizar status e informações
- ✅ **Exclusão**: Remover chamados
- ✅ **Filtros**: Por status e prioridade
- ✅ **Busca**: Por título, número ou solicitante
- ✅ **Atribuição**: Designar para analistas/admin
- ✅ **Prioridades**: Baixa, Média, Alta, Crítica
- ✅ **Status**: Aberto, Em Andamento, Resolvido, Fechado
- ✅ **Categorias**: Geral, Técnico, Financeiro, Bug, etc
- ✅ **Histórico**: Registro de todas as alterações

## 🔄 Funcionalidades Pendentes

### 1. **Página de Detalhes do Ticket**
- [ ] Visualização completa do chamado
- [ ] Timeline de atividades
- [ ] Edição inline de campos

### 2. **Sistema de Comentários**
- [ ] Adicionar comentários aos chamados
- [ ] Respostas aninhadas
- [ ] Menções a usuários
- [ ] Formatação rich text

### 3. **Upload de Arquivos**
- [ ] Anexar arquivos aos chamados
- [ ] Preview de imagens
- [ ] Limite de tamanho
- [ ] Integração com Supabase Storage

### 4. **Notificações** ✅ IMPLEMENTADO
- ✅ Push notifications (PWA) via Service Worker
- ✅ Email notifications com templates HTML
- ✅ Notificações in-app com sino no header
- ✅ Configurações por usuário com página dedicada
- ✅ Preferências granulares por tipo de notificação
- ✅ Horário de silêncio configurável
- ✅ Notificações de teste para validar configurações

### 5. **Analytics e Relatórios**
- [ ] Dashboard com métricas
- [ ] Gráficos de desempenho
- [ ] Exportação para PDF/Excel
- [ ] Relatórios customizados

### 6. **Melhorias de UX**
- [ ] Onboarding para novos usuários
- [ ] Tour guiado
- [ ] Atalhos de teclado
- [ ] Pesquisa global

## 💻 Tecnologias Utilizadas
- **Frontend**: Next.js 15, React 19, TypeScript
- **Estilização**: Tailwind CSS, CSS Modules
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: NextAuth.js v5
- **State Management**: Zustand
- **Formulários**: React Hook Form + Zod
- **PWA**: next-pwa
- **Deploy**: Preparado para Vercel

## 📝 Notas de Desenvolvimento
- Sistema configurado com ES Modules (type: "module")
- PM2 para gerenciamento de processos
- Todas as senhas são hasheadas com bcrypt
- Row Level Security (RLS) configurado no Supabase
- Service Role Key usado para operações administrativas

## 🎯 Próximos Passos Recomendados
1. **Implementar CRUD de Chamados**: Criar estrutura de tabelas e APIs
2. **Sistema de Comentários**: Adicionar funcionalidade de discussão
3. **Upload de Arquivos**: Configurar Supabase Storage
4. **Notificações Push**: Implementar Web Push API
5. **Deploy no Vercel**: Configurar variáveis de ambiente e deploy

## 📊 Status do Projeto
- **Versão**: 1.5.0
- **Status**: ✅ Em Produção
- **Última Atualização**: 01/09/2025 - 16:00
- **Ambiente**: Vercel + Supabase
- **Banco de Dados**: ✅ Conectado e Funcional
- **Total de Usuários**: 6
- **Total de Chamados**: Sistema pronto com anexos
- **Sistema de Notificações**: ✅ Completo (In-App, Push, Email)
- **Deploy**: ✅ Atualizado no Vercel

## 🆕 Últimas Atualizações

### v1.5.1 - Configuração de Email via Interface Web (01/09/2025)
- **📧 Configuração de Email no Dashboard**:
  - Nova página em `/dashboard/settings` para configurar SMTP
  - Suporte completo para Gmail com App Passwords
  - Armazenamento seguro com criptografia AES-256-CBC
  - Não requer mais variáveis de ambiente no servidor
- **🔄 Sistema Dinâmico de Configuração**:
  - Busca configuração primeiro no banco de dados
  - Fallback para variáveis de ambiente se necessário
  - Cache de 5 minutos para melhor performance
- **🔐 Segurança Aprimorada**:
  - Senhas de email criptografadas no banco
  - Apenas administradores podem configurar email
  - Validação e teste de configuração antes de salvar
- **📝 Documentação**:
  - Novo guia em `/docs/EMAIL_CONFIGURATION.md`
  - Instruções para criar App Password no Gmail
  - Troubleshooting e soluções para problemas comuns

### v1.5.0 - Sistema Completo de Notificações (01/09/2025)
- **🔔 Notificações In-App**: Sino interativo no header com dropdown de notificações
- **📱 Push Notifications**: Suporte completo para PWA via Service Worker
- **📧 Email Notifications**: Templates HTML responsivos para diferentes eventos
- **⚙️ Configurações Personalizadas**:
  - Página dedicada em `/dashboard/settings/notifications`
  - Controle granular por tipo de notificação
  - Ativar/desativar por método (email, push, in-app)
  - Horário de silêncio configurável
- **🗄️ Banco de Dados**:
  - Tabelas para notificações, preferências e push subscriptions
  - Sistema de templates de email
  - Triggers automáticos para novos usuários
- **🚀 APIs Completas**:
  - CRUD de notificações
  - Gerenciamento de preferências
  - Push subscription management
- **📨 Integração de Email**:
  - Suporte para Resend e SendGrid
  - Templates para ticket criado, atribuído e resolvido
  - Fallback para log em desenvolvimento

### v1.4.0 - Permissões por Perfil em Tickets
- **🔒 Restrições para Usuários (role: user)**:
  - Não podem excluir tickets
  - Não podem alterar status de tickets  
  - Não podem atribuir responsável aos tickets
- **👥 Permissões Completas (admin/analyst)**:
  - Podem excluir tickets
  - Podem alterar status
  - Podem atribuir responsável
- **💬 Interface Adaptativa**:
  - Botões são exibidos/ocultados baseado no perfil
  - Mensagem informativa para usuários sobre suas limitações
  - Usuários ainda podem adicionar comentários e anexos

### v1.3.0 - Proteção Completa de Rotas
- **🔒 Middleware de Autenticação**: Implementado middleware que bloqueia acesso a rotas protegidas sem login
- **🚫 Proteção Server-Side**: Todas as páginas do dashboard agora verificam autenticação no servidor
- **🔐 APIs Protegidas**: Todas as APIs agora exigem autenticação válida
- **👥 Controle de Acesso por Perfil**: Páginas de admin (Usuários, Configurações) só acessíveis para administradores
- **↩️ Redirecionamento Automático**: Usuários não autenticados são redirecionados para /login
- **🚪 Logout Melhorado**: Limpeza completa de sessão e redirecionamento garantido para /login

### v1.2.0 - Alteração de Senha
- **Funcionalidade Adicionada**: Sistema de alteração de senha para administradores
- **Descrição**: Administradores agora podem alterar a senha de qualquer usuário
- **Interface**: Modal dedicado com validação de senha e confirmação