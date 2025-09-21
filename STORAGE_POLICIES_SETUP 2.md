# Configuração de Políticas do Supabase Storage

## Buckets Existentes
- `TICKET-ATTACHMENTS` - Para anexos de tickets
- `ATTACHMENTS` (Public) - Bucket público alternativo
- `AVATARS` (Public) - Para fotos de perfil

## Políticas Necessárias

### Para o bucket `TICKET-ATTACHMENTS`

#### 1. Política de Leitura (SELECT)
**Nome**: `Public read access`
```sql
true
```
**Descrição**: Permite que qualquer pessoa visualize os anexos

#### 2. Política de Upload (INSERT)
**Nome**: `Authenticated users can upload`
```sql
auth.uid() IS NOT NULL
```
**Descrição**: Permite que usuários autenticados façam upload

#### 3. Política de Update (UPDATE)
**Nome**: `Users can update their own uploads`
```sql
auth.uid() = owner
```
**Descrição**: Permite que usuários atualizem seus próprios uploads

#### 4. Política de Delete (DELETE)
**Nome**: `Admins can delete`
```sql
auth.jwt() ->> 'role' = 'admin'
```
**Descrição**: Apenas administradores podem deletar anexos

### Para o bucket `ATTACHMENTS` (já é público)

Como já está marcado como público, apenas precisamos de:

#### 1. Política de Upload (INSERT)
**Nome**: `Authenticated upload`
```sql
auth.uid() IS NOT NULL
```

### Para o bucket `AVATARS` (já é público)

#### 1. Política de Upload (INSERT)
**Nome**: `Users can upload avatars`
```sql
auth.uid() IS NOT NULL
```

#### 2. Política de Update (UPDATE)
**Nome**: `Users can update their avatar`
```sql
auth.uid()::text = (storage.foldername(name))[1]
```

## Como Configurar no Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, vá em **Storage**
4. Clique na aba **Policies**
5. Para cada bucket, clique em **New policy**
6. Escolha o tipo de operação (SELECT, INSERT, UPDATE, DELETE)
7. Cole a política SQL correspondente
8. Dê um nome descritivo
9. Clique em **Create policy**

## Testando as Políticas

Após configurar, teste:
1. Fazer upload de um arquivo em um ticket
2. Visualizar o anexo (deve abrir no popup)
3. Verificar se outros usuários conseguem ver o anexo
4. Testar exclusão (apenas admin)

## Troubleshooting

### Erro "Bucket not found"
- Verifique se o bucket está criado no Dashboard
- Confirme o nome exato do bucket no código

### Erro "Policy violation"
- Verifique se as políticas estão configuradas corretamente
- Confirme que o usuário está autenticado
- Verifique o token JWT no navegador

### Imagem não abre no popup
- Verifique a URL gerada no console do navegador
- Confirme que o bucket tem política de leitura pública
- Teste acessar a URL diretamente no navegador