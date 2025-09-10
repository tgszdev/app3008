# 📘 Guia de Deploy - Sistema de Suporte

## 🚀 Status Atual

### ✅ Funcionalidades Implementadas
- **Sistema de Permissões Dinâmicas**: 100% funcional
- **Roles Customizadas**: Suporte completo implementado
- **24 Permissões Granulares**: Todas funcionando
- **Cache de Permissões**: 5 minutos para melhor performance
- **Página de Teste**: `/dashboard/test-permissions`

### 🔗 URLs de Acesso
- **Desenvolvimento**: https://3000-i968ax1d7t7cf739vyajj-6532622b.e2b.dev
- **Backup do Projeto**: https://page.gensparksite.com/project_backups/toolu_01U7biSaPjAQ5y6krKCZ8tSo.tar.gz

## 📦 Como Fazer Deploy

### Opção 1: Vercel (Recomendado) ⭐
```bash
# 1. Instale Vercel CLI
npm i -g vercel

# 2. Faça login
vercel login

# 3. Deploy
vercel --prod

# 4. Configure variáveis de ambiente no dashboard Vercel
```

### Opção 2: Netlify
```bash
# 1. Instale Netlify CLI
npm i -g netlify-cli

# 2. Build local
npm run build

# 3. Deploy
netlify deploy --prod --dir=.next
```

### Opção 3: Railway/Render
1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente
3. Deploy automático

### Opção 4: VPS/Cloud Server
```bash
# 1. Clone o projeto
git clone [seu-repo]

# 2. Instale dependências
npm install

# 3. Configure .env.production
cp .env.local .env.production

# 4. Build
NODE_OPTIONS='--max-old-space-size=4096' npm run build

# 5. Inicie com PM2
pm2 start npm --name "support-system" -- start
```

## 🔧 Variáveis de Ambiente Necessárias

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# NextAuth
NEXTAUTH_URL=https://seu-dominio.com
NEXTAUTH_SECRET=

# Email (opcional)
EMAIL_FROM=
EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## 🐛 Problemas Conhecidos e Soluções

### Erro de Memória no Build
```bash
# Aumente a memória disponível
NODE_OPTIONS='--max-old-space-size=4096' npm run build
```

### Build Muito Lento
```bash
# Desabilite temporariamente o PWA
# Comente as linhas do PWA em next.config.mjs
```

### Erro de Permissões
```bash
# Limpe o cache de permissões
# Na aplicação, o cache expira automaticamente após 5 minutos
```

## 📊 Monitoramento

### PM2 Commands
```bash
pm2 list              # Ver status
pm2 logs webapp       # Ver logs
pm2 monit            # Monitor em tempo real
pm2 restart webapp   # Reiniciar
```

### Verificar Saúde da Aplicação
```bash
curl http://localhost:3000/api/health
```

## 🔐 Segurança

### Checklist de Segurança
- [ ] Variáveis de ambiente configuradas
- [ ] HTTPS habilitado
- [ ] Rate limiting configurado
- [ ] CORS configurado corretamente
- [ ] Autenticação funcionando
- [ ] RLS do Supabase ativo

## 📝 Alterações Recentes

### v1.5.5 - Permissões Dinâmicas
- Implementado sistema de permissões baseado em roles customizadas
- Removidas verificações hardcoded de roles
- Adicionado hook `usePermissions`
- Criada página de teste de permissões
- Melhorado sistema de cache

### Arquivos Modificados
- `/src/app/dashboard/tickets/new/page.tsx`
- `/src/app/dashboard/tickets/[id]/page.tsx`
- `/src/hooks/usePermissions.ts`
- `/src/lib/permissions.ts`
- `/src/app/api/users/with-permission/route.ts`

## 🎯 Próximos Passos

1. **Otimização de Performance**
   - Implementar lazy loading
   - Otimizar bundle size
   - Adicionar CDN para assets

2. **Melhorias de UX**
   - Feedback visual para ações
   - Loading states melhorados
   - Animações suaves

3. **Funcionalidades Futuras**
   - Dashboard analytics avançado
   - Exportação de relatórios
   - Integração com Slack/Discord

## 💡 Dicas

- Use `npm run dev` para desenvolvimento local
- Sempre teste permissões em `/dashboard/test-permissions`
- Monitore logs com PM2 em produção
- Faça backups regulares do banco de dados

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs da aplicação
2. Teste as permissões na página de teste
3. Verifique as variáveis de ambiente
4. Consulte a documentação do Supabase/NextAuth

---

**Última atualização**: ${new Date().toISOString()}
**Versão**: 1.5.5
**Status**: ✅ Pronto para Deploy