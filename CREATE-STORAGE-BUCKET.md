# 📦 Criar Bucket de Imagens no Supabase Storage

## 🎯 Execute no SQL Editor do Supabase

```sql
-- 1. Criar bucket público para imagens de tickets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-images',
  'ticket-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Política: Qualquer usuário autenticado pode fazer upload
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ticket-images' 
  AND auth.uid() IS NOT NULL
);

-- 3. Política: Todos podem visualizar imagens (bucket público)
CREATE POLICY "Todos podem visualizar imagens"
ON storage.objects FOR SELECT
USING (bucket_id = 'ticket-images');

-- 4. Política: Usuários podem deletar suas próprias imagens
CREATE POLICY "Usuários podem deletar suas imagens"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ticket-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## ✅ Verificar se funcionou

```sql
SELECT * FROM storage.buckets WHERE id = 'ticket-images';
```

Você deve ver:
- `id`: ticket-images
- `name`: ticket-images
- `public`: true
- `file_size_limit`: 5242880

## 🔐 Políticas de Segurança (RLS)

As políticas criadas garantem:
1. ✅ Apenas usuários autenticados podem fazer upload
2. ✅ Todos podem visualizar (bucket público)
3. ✅ Usuários só podem deletar suas próprias imagens
4. ✅ Organização por pastas (user_id/nome-arquivo)

## 📝 Notas

- As imagens são salvas em: `{user_id}/{timestamp}-{random}.webp`
- Limite de 5MB por imagem
- Formatos: JPEG, PNG, WebP, GIF
- CDN automático do Supabase habilitado

