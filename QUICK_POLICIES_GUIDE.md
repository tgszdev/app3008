# Guia Rápido - Configuração de Políticas Storage

## Para o bucket `ticket-attachments`

### 1️⃣ Política de Leitura (SELECT) - Public read access
- **Allowed operation**: SELECT ✅
- **Target roles**: Defaults to all (public) roles if none selected
- **Policy definition**: 
```sql
true
```
- Clique em **Review** e depois **Save**

### 2️⃣ Política de Upload (INSERT) - Authenticated users can upload
- Clique em **New policy** novamente
- **Policy name**: `Authenticated users can upload`
- **Allowed operation**: INSERT ✅
- **Target roles**: authenticated
- **Policy definition**:
```sql
true
```
- Clique em **Review** e depois **Save**

### 3️⃣ Política de Update (UPDATE) - Users can update
- Clique em **New policy** novamente
- **Policy name**: `Users can update`
- **Allowed operation**: UPDATE ✅
- **Target roles**: authenticated
- **Policy definition**:
```sql
auth.uid() IS NOT NULL
```
- Clique em **Review** e depois **Save**

### 4️⃣ Política de Delete (DELETE) - Admins only
- Clique em **New policy** novamente
- **Policy name**: `Admins can delete`
- **Allowed operation**: DELETE ✅
- **Target roles**: authenticated
- **Policy definition**:
```sql
(auth.jwt() ->> 'role') = 'admin'
```
- Clique em **Review** e depois **Save**

## Testando

Após configurar todas as políticas:
1. Faça deploy da aplicação
2. Faça login
3. Abra um ticket
4. Tente visualizar um anexo existente
5. Se funcionar, a imagem abrirá no popup!

## Se não funcionar

Verifique:
- Se o nome do bucket está correto no código (`ticket-attachments`)
- Se as variáveis de ambiente estão configuradas no Vercel
- Se o bucket está configurado como "Public" ou tem as políticas corretas