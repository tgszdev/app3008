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

### 1. **Autenticação e Autorização**
- ✅ Sistema de login com NextAuth.js v5
- ✅ 3 níveis de acesso: Admin, Analyst, User
- ✅ Proteção de rotas com middleware
- ✅ Sessão JWT persistente
- ✅ Logout funcional

### 2. **Gerenciamento de Usuários (CRUD Completo)**
- ✅ **Listagem**: Exibição de todos os usuários do banco
- ✅ **Criação**: Adicionar novos usuários com senha criptografada (bcrypt)
- ✅ **Edição**: Atualizar informações do usuário
- ✅ **Exclusão**: Remover usuários (exceto admin principal)
- ✅ **Ativação/Desativação**: Toggle de status do usuário
- ✅ **Filtros**: Por nome, email, perfil e status
- ✅ **Busca**: Sistema de busca em tempo real
- ✅ **Alteração de Senha**: Administradores podem alterar senha de qualquer usuário

### 3. **Integração com Banco de Dados Real**
- ✅ **Supabase PostgreSQL**: Banco de dados hospedado
- ✅ **API Routes**: GET, POST, PATCH, DELETE funcionais
- ✅ **Migrations**: Estrutura de tabelas criada
- ✅ **Seed Data**: 6 usuários de teste inseridos

### 4. **Interface de Usuário**
- ✅ **Dark Mode**: Tema claro/escuro funcional
- ✅ **Responsividade**: Layout adaptativo para mobile/desktop
- ✅ **Componentes Reutilizáveis**: Sistema modular
- ✅ **Feedback Visual**: Toast notifications (react-hot-toast)
- ✅ **Loading States**: Indicadores de carregamento
- ✅ **Modais**: Sistema de modais para criar/editar

### 5. **Gerenciamento de Chamados (Tickets)**
- ✅ **CRUD Completo**: Criar, listar, editar, excluir chamados
- ✅ **Status**: open, in_progress, resolved, closed
- ✅ **Prioridades**: low, medium, high, critical
- ✅ **Categorias**: general, hardware, software, network, etc.
- ✅ **Atribuição**: Designar chamados para analistas
- ✅ **Histórico**: Registro de todas as alterações
- ✅ **Filtros**: Por status, prioridade, usuário
- ✅ **Relacionamentos**: Integração com tabela de usuários

### 6. **PWA Support**
- ✅ **Service Worker**: Configurado com next-pwa
- ✅ **Manifest**: Arquivo de manifesto PWA
- ✅ **Offline Support**: Cache de assets estáticos
- ✅ **Instalável**: Pode ser instalado como app

### 7. **Sistema de Anexos de Arquivos**
- ✅ **Upload de Arquivos**: Anexar arquivos aos chamados (máx. 10MB)
- ✅ **Tipos Suportados**: Imagens (PNG, JPG, GIF), Documentos (PDF, DOC, DOCX, XLS, XLSX, TXT)
- ✅ **Visualização**: Preview de imagens diretamente na página
- ✅ **Download**: Baixar anexos dos chamados
- ✅ **Integração Supabase Storage**: Armazenamento seguro em bucket dedicado
- ✅ **Validação**: Verificação de tipo e tamanho de arquivo

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

### 4. **Notificações**
- [ ] Push notifications (PWA)
- [ ] Email notifications
- [ ] Notificações in-app
- [ ] Configurações por usuário

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
- **Versão**: 1.2.0
- **Status**: ✅ Em Produção
- **Última Atualização**: 31/08/2025 - 22:30
- **Ambiente**: Vercel + Supabase
- **Banco de Dados**: ✅ Conectado e Funcional
- **Total de Usuários**: 6
- **Total de Chamados**: Sistema pronto com anexos
- **Deploy**: ✅ Atualizado no Vercel

## 🆕 Última Atualização
- **Funcionalidade Adicionada**: Sistema de alteração de senha para administradores
- **Descrição**: Administradores agora podem alterar a senha de qualquer usuário através da página de gerenciamento de usuários
- **Segurança**: Apenas usuários com perfil 'admin' têm acesso a esta funcionalidade
- **Interface**: Modal dedicado com validação de senha e confirmação