# 📋 Guia Detalhado: Como Limpar o Cache de Permissões

## 🎯 Passo a Passo Completo

### 1️⃣ **Acesse o Sistema**
- Abra seu navegador
- Entre no sistema com suas credenciais de **administrador**
- URL: `https://seu-dominio.com` ou `http://localhost:3000` (se local)

### 2️⃣ **Navegue até o Dashboard**
Após fazer login, você estará no Dashboard principal.

### 3️⃣ **Acesse as Configurações**

#### Opção A: Pelo Menu Lateral
1. No menu lateral esquerdo, procure por **"Configurações"** (ícone de engrenagem ⚙️)
2. Clique em **"Configurações"**

#### Opção B: Pela URL Direta
- Acesse diretamente: `https://seu-dominio.com/dashboard/settings`

### 4️⃣ **Localize o Card "Gestão de Perfis"**

Na página de Configurações, você verá vários cards. Procure pelo card:

```
┌─────────────────────────────────────┐
│ 👥 Gestão de Perfis                 │
│                                     │
│ Crie e configure perfis            │
│ personalizados com permissões      │
│ específicas para cada tipo de      │
│ usuário                            │
│                                     │
│ [⚙️ Gerenciar Perfis]              │
└─────────────────────────────────────┘
```

### 5️⃣ **Clique em "Gerenciar Perfis"**
- Clique no botão roxo **"Gerenciar Perfis"**
- Um modal (janela popup) será aberto

### 6️⃣ **No Modal de Gestão de Perfis**

Quando o modal abrir, você verá:

```
┌──────────────────────────────────────────┐
│ Gestão de Perfis de Acesso              │
│ ────────────────────────────────────────│
│                                          │
│ Perfis Customizados                     │
│                                          │
│ [+ Criar Novo Perfil] [🗄️ Limpar Cache] │
│                                          │
│ Lista de Perfis:                        │
│ • admin (Sistema)                       │
│ • analyst (Sistema)                     │
│ • user (Sistema)                        │
│ • n1 (Customizado)                      │
│ • desenvolvedor (Customizado)          │
│                                          │
└──────────────────────────────────────────┘
```

### 7️⃣ **Clique no Botão "Limpar Cache"**

- Localize o botão **"Limpar Cache"** (ícone de banco de dados 🗄️)
- Está ao lado do botão "Criar Novo Perfil"
- Clique nele

### 8️⃣ **Confirmação**

Após clicar, você verá uma notificação:

```
✅ Cache de permissões limpo! 
   Faça logout e login novamente para aplicar as mudanças.
```

### 9️⃣ **Faça Logout e Login**

**IMPORTANTE**: Para que as mudanças tenham efeito completo:

1. Clique no seu **avatar/nome** no canto superior direito
2. Selecione **"Sair"** ou **"Logout"**
3. Faça login novamente com suas credenciais

## 🔍 Localização Visual do Botão

```
Dashboard
    └── Configurações (menu lateral)
            └── Card "Gestão de Perfis"
                    └── Botão "Gerenciar Perfis"
                            └── Modal abre
                                    └── Botão "Limpar Cache" (cinza, com ícone 🗄️)
```

## ❓ Perguntas Frequentes

### Não vejo o botão "Limpar Cache"
- Certifique-se de estar logado como **administrador**
- O botão está dentro do modal de "Gestão de Perfis", não na página principal

### O botão está desabilitado
- Verifique se você tem permissão de administrador
- Tente recarregar a página (F5)

### Cliquei mas nada aconteceu
- Verifique se apareceu a notificação verde de sucesso
- Você DEVE fazer logout e login novamente
- Limpe também o cache do navegador (Ctrl+F5)

## 🛠️ Alternativa: Limpar Cache via API

Se preferir, você pode limpar o cache diretamente via requisição HTTP:

### Com cURL (terminal):
```bash
curl -X POST https://seu-dominio.com/api/admin/clear-cache \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Com JavaScript (console do navegador):
```javascript
fetch('/api/admin/clear-cache', {
  method: 'POST',
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log('Cache limpo!', data))
```

## 📝 Resumo Rápido

1. **Login** como admin
2. **Dashboard** → **Configurações**
3. Card **"Gestão de Perfis"** → Botão **"Gerenciar Perfis"**
4. No modal → Botão **"Limpar Cache"** (cinza, ícone 🗄️)
5. **Logout** e **Login** novamente

## ⚠️ Importante

- O cache de permissões dura 5 minutos por padrão
- Limpar o cache força o sistema a recarregar todas as permissões do banco
- Sempre faça logout/login após limpar o cache
- Se você mudou roles ou permissões, limpe o cache para aplicar imediatamente

---

**Dica**: Se você está com problemas de permissões não sendo aplicadas, a sequência é:
1. Corrigir no banco de dados
2. Limpar cache da aplicação (este guia)
3. Limpar cache do navegador (Ctrl+F5)
4. Fazer logout e login