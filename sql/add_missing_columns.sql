-- Script para adicionar colunas faltantes nas tabelas da Base de Conhecimento
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna display_order na tabela kb_categories se não existir
ALTER TABLE kb_categories 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 999;

-- Adicionar outras colunas que podem estar faltando
ALTER TABLE kb_articles 
ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Atualizar display_order para categorias existentes baseado na ordem de criação
UPDATE kb_categories 
SET display_order = sub.row_number * 10
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number
  FROM kb_categories
) sub
WHERE kb_categories.id = sub.id
AND kb_categories.display_order IS NULL;

-- Verificar estrutura da tabela após alterações
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns
WHERE 
  table_name = 'kb_categories'
ORDER BY 
  ordinal_position;