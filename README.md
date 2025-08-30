# Sistema de Suporte Técnico - PWA

## 📋 Visão Geral
Sistema completo e moderno para gestão de chamados técnicos com suporte PWA (Progressive Web App), otimizado para deploy no Vercel.

## 🚀 Características Principais

### Tecnologias
- **Frontend**: Next.js 14+ com App Router
- **UI/UX**: Tailwind CSS + Shadcn/ui 
- **Backend**: Next.js API Routes
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: NextAuth.js v5 com JWT
- **PWA**: next-pwa (offline, instalável, notificações push)
- **Deploy**: Vercel

## ✅ Funcionalidades Implementadas

### Autenticação e Autorização
- ✅ Sistema de login com email/senha
- ✅ Três níveis de acesso: user, analyst, admin
- ✅ Proteção de rotas por role
- ✅ Sessão persistente com JWT

### Interface de Usuário
- ✅ Layout responsivo com sidebar
- ✅ Dark mode com persistência
- ✅ Dashboard com estatísticas em tempo real
- ✅ Navegação intuitiva
- ✅ Componentes modernos com Shadcn/ui

### PWA Features
- ✅ Manifest configurado
- ✅ Service Worker para funcionamento offline
- ✅ Instalável em desktop e mobile
- ✅ Ícones em múltiplas resoluções

### Estrutura de Dados
- ✅ Schema completo do banco de dados
- ✅ Tabelas para: users, tickets, comments, attachments, notifications
- ✅ Sistema de módulos/categorias
- ✅ Histórico de alterações (audit log)
- ✅ Preferências de usuário

## 🚧 Funcionalidades em Desenvolvimento

### CRUD de Chamados
- ⏳ Criar novo chamado
- ⏳ Listar chamados com filtros
- ⏳ Editar/atualizar chamados
- ⏳ Sistema de comentários

### Recursos Avançados
- ⏳ Upload de anexos
- ⏳ Notificações push
- ⏳ Notificações por email
- ⏳ Relatórios exportáveis
- ⏳ Busca avançada
- ⏳ SLA automático

## 📁 Estrutura do Projeto

```
webapp/
├── src/
│   ├── app/               # App Router pages
│   │   ├── api/           # API Routes
│   │   ├── dashboard/     # Dashboard pages
│   │   ├── login/         # Auth pages
│   │   └── tickets/       # Ticket management
│   ├── components/        # React components
│   │   └── ui/           # UI components
│   ├── lib/              # Utilities and configs
│   ├── hooks/            # Custom React hooks
│   └── types/            # TypeScript types
├── public/               # Static files
│   ├── icons/           # PWA icons
│   └── manifest.json    # PWA manifest
└── supabase-schema.sql  # Database schema
```

## 🔧 Configuração

### Variáveis de Ambiente (.env.local)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here

# JWT
JWT_SECRET=your_jwt_secret
```

### Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure o banco de dados no Supabase:
   - Crie um novo projeto no Supabase
   - Execute o script `supabase-schema.sql` no SQL Editor
   - Copie as credenciais para `.env.local`

4. Execute o projeto:
```bash
npm run dev
```

## 🌐 URLs e Endpoints

### Rotas Principais
- `/` - Redirect para login
- `/login` - Página de autenticação
- `/dashboard` - Dashboard principal
- `/tickets` - Gestão de chamados
- `/tickets/new` - Criar novo chamado
- `/tickets/[id]` - Detalhes do chamado
- `/reports` - Relatórios
- `/users` - Gestão de usuários (admin)
- `/settings` - Configurações

### API Endpoints (em desenvolvimento)
- `POST /api/auth/[...nextauth]` - Autenticação
- `GET /api/tickets` - Listar chamados
- `POST /api/tickets` - Criar chamado
- `PUT /api/tickets/[id]` - Atualizar chamado
- `POST /api/tickets/[id]/comments` - Adicionar comentário

## 🎯 Próximos Passos Recomendados

1. **Completar CRUD de Chamados**
   - Implementar páginas de listagem e criação
   - Adicionar filtros e busca
   - Sistema de comentários

2. **Sistema de Notificações**
   - Configurar Web Push API
   - Implementar notificações em tempo real
   - Adicionar email notifications

3. **Upload de Arquivos**
   - Integrar com Cloudinary ou S3
   - Adicionar suporte a anexos

4. **Melhorias de UX**
   - Adicionar animações
   - Implementar skeleton loaders
   - Melhorar feedback visual

5. **Deploy no Vercel**
   - Configurar variáveis de ambiente
   - Conectar com GitHub
   - Configurar domínio customizado

## 🔐 Segurança

- Autenticação com JWT
- Proteção CSRF
- Rate limiting nas APIs
- Validação de dados com Zod
- Row Level Security no Supabase
- Sanitização de inputs

## 📱 PWA Features

- **Instalável**: Pode ser instalado como app nativo
- **Offline First**: Funciona sem conexão
- **Push Notifications**: Notificações em tempo real
- **Responsive**: Adaptado para todos dispositivos
- **Dark Mode**: Suporte a tema escuro

## 🚀 Deploy

### Vercel (Recomendado)
1. Faça push do código para GitHub
2. Importe o projeto no Vercel
3. Configure as variáveis de ambiente
4. Deploy automático a cada push

### Comandos Úteis
```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar produção
npm start

# Lint
npm run lint
```

## 📄 Licença
MIT

## 👥 Suporte
Para suporte, abra uma issue no GitHub ou entre em contato.

---
**Status**: 🚧 Em desenvolvimento ativo
**Última atualização**: 30/08/2025