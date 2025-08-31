# 🔍 INSTRUÇÕES PARA DEBUG DO PROBLEMA DOS TICKETS

## 🐛 Problema Identificado
Quando você cria um ticket, está sendo direcionado para a página de detalhes mas o ticket mostrado não corresponde ao que você criou.

## 📋 Para Diagnosticar o Problema

### 1. Abra o Console do Navegador (F12)
Quando acessar a página de detalhes do ticket, verifique o console do navegador:
- Procure por mensagens que começam com `=== DEBUG`
- Verifique o ID do ticket sendo buscado
- Verifique o título recebido da API

### 2. Teste Manual da API
No navegador, acesse diretamente:
```
https://app3008-two.vercel.app/api/tickets
```

Isso deve retornar a lista de todos os tickets. Verifique se o ticket que você criou está lá.

### 3. Teste um Ticket Específico
Pegue o ID de um ticket da URL (exemplo: `e711fedc-8ed2-4fbf-aaa0-84b91ab0ed57`) e acesse:
```
https://app3008-two.vercel.app/api/tickets/e711fedc-8ed2-4fbf-aaa0-84b91ab0ed57
```

## 🔧 Possíveis Causas e Soluções

### Causa 1: Cache do Navegador
**Solução:**
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Ou abra em uma aba anônima/privada
3. Faça logout e login novamente

### Causa 2: Service Worker do PWA
**Solução:**
1. No Chrome DevTools (F12)
2. Vá para a aba "Application"
3. Clique em "Service Workers" na lateral
4. Clique em "Unregister" em todos os service workers
5. Recarregue a página

### Causa 3: Deploy Desatualizado
**Solução:**
Execute um novo deploy no Vercel:
```bash
cd /home/user/webapp
npm run build
git add .
git commit -m "Fix: ticket details page"
git push origin main
```

### Causa 4: Problema de Autenticação
**Solução:**
1. Faça logout do sistema
2. Faça login novamente
3. Tente criar um novo ticket

## 🎯 Script de Teste no Supabase

Execute este script no SQL Editor para verificar os tickets:

```sql
-- Ver últimos 10 tickets criados
SELECT 
  t.id,
  t.ticket_number,
  t.title,
  t.description,
  t.status,
  t.created_at,
  u.name as created_by_name
FROM tickets t
LEFT JOIN users u ON t.created_by = u.id
ORDER BY t.created_at DESC
LIMIT 10;
```

## 📝 Informações para Relatar

Se o problema persistir, por favor informe:
1. O ID do ticket que você criou (da URL)
2. O título que você digitou
3. O título que aparece na página de detalhes
4. Se aparecem mensagens de erro no console
5. Se a API retorna os dados corretos quando acessada diretamente

## 🔄 Solução Temporária

Enquanto resolvemos o problema definitivamente:
1. Após criar um ticket, volte para a lista de tickets
2. Procure o ticket que você criou na lista
3. Clique no botão de visualizar (ícone do olho)

---

**Arquivo de debug adicionado:** Os logs de debug foram adicionados ao código. Verifique o console do navegador para mais informações.