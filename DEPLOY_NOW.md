# 🚀 DEPLOY IMEDIATO - Sistema de Suporte

## ⚡ Deploy Rápido (Sem Build Local)

### Opção 1: Deploy via Vercel (MAIS FÁCIL) ✨

1. **Acesse**: https://vercel.com
2. **Faça login** com sua conta GitHub
3. **Importe o projeto**:
   - URL: `https://github.com/tgszdev/app3008`
   - Clique em "Import"
4. **Configure as variáveis de ambiente**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=sua_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_service
   NEXTAUTH_URL=https://seu-app.vercel.app
   NEXTAUTH_SECRET=gerar_com_openssl_rand_base64_32
   ```
5. **Clique em "Deploy"**
6. **Aguarde** - Vercel fará o build automaticamente!

### Opção 2: Deploy via Netlify 🌐

1. **Acesse**: https://app.netlify.com
2. **Faça login** com GitHub
3. **New site from Git**
4. **Conecte o repositório**: `tgszdev/app3008`
5. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. **Environment variables** (mesmo do Vercel)
7. **Deploy site**

### Opção 3: Deploy via Railway 🚂

1. **Acesse**: https://railway.app
2. **Login com GitHub**
3. **New Project** → **Deploy from GitHub repo**
4. **Selecione**: `tgszdev/app3008`
5. **Add variables** (mesmas do Vercel)
6. **Deploy**

## 📱 Aplicação Rodando Agora

**URL Atual (Desenvolvimento)**: https://3000-i968ax1d7t7cf739vyajj-6532622b.e2b.dev

✅ **Status**: Online e Funcional
✅ **Permissões**: 100% Implementadas
✅ **Roles Customizadas**: Funcionando

## 💾 Backup Completo

**Download**: https://page.gensparksite.com/project_backups/toolu_01U7biSaPjAQ5y6krKCZ8tSo.tar.gz

### Como usar o backup:
```bash
# 1. Baixe o arquivo
wget https://page.gensparksite.com/project_backups/toolu_01U7biSaPjAQ5y6krKCZ8tSo.tar.gz

# 2. Extraia
tar -xzf toolu_01U7biSaPjAQ5y6krKCZ8tSo.tar.gz

# 3. Entre na pasta
cd home/user/webapp

# 4. Instale dependências
npm install

# 5. Configure .env.local
cp .env.example .env.local
# Edite com suas variáveis

# 6. Execute
npm run dev
```

## 🔥 Deploy Manual (Seu Servidor)

```bash
# 1. Clone o repositório
git clone https://github.com/tgszdev/app3008.git
cd app3008

# 2. Instale dependências
npm install

# 3. Configure ambiente
cp .env.example .env.production
nano .env.production  # adicione suas variáveis

# 4. Build (se tiver memória suficiente)
NODE_OPTIONS='--max-old-space-size=4096' npm run build

# 5. Inicie com PM2
pm2 start npm --name "support-system" -- start
pm2 save
pm2 startup

# 6. Configure Nginx (opcional)
sudo nano /etc/nginx/sites-available/support-system
```

### Nginx Config:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## ⚠️ Problemas Comuns

### Erro de Memória no Build
```bash
# Use mais memória
NODE_OPTIONS='--max-old-space-size=8192' npm run build

# Ou desabilite temporariamente o PWA
# Comente as linhas do PWA em next.config.mjs
```

### Erro de Autenticação
- Verifique NEXTAUTH_URL
- Gere novo NEXTAUTH_SECRET
- Configure OAuth callbacks

### Banco de Dados
- Verifique conexão Supabase
- Confirme RLS policies
- Teste com Supabase Dashboard

## 📞 Suporte Rápido

1. **Teste a aplicação atual**: https://3000-i968ax1d7t7cf739vyajj-6532622b.e2b.dev
2. **Verifique permissões**: `/dashboard/test-permissions`
3. **Consulte logs**: `pm2 logs webapp`
4. **Use o backup** se necessário

## ✅ Checklist Final

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados Supabase conectado
- [ ] NextAuth configurado
- [ ] Domínio configurado (se aplicável)
- [ ] HTTPS habilitado
- [ ] Backup salvo

---

**🎉 Sucesso!** Seu sistema está pronto para produção com todas as permissões funcionando!