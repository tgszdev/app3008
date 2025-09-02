-- Script para corrigir permissões das tabelas da Base de Conhecimento
-- Execute este script no Supabase SQL Editor

-- OPÇÃO 1: Desabilitar RLS (mais simples, menos seguro)
-- Descomente as linhas abaixo se quiser desabilitar RLS completamente
ALTER TABLE kb_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE kb_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE kb_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE kb_article_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE kb_article_feedback DISABLE ROW LEVEL SECURITY;

-- OPÇÃO 2: Criar políticas RLS (mais seguro, recomendado para produção)
-- Comente a OPÇÃO 1 e descomente as linhas abaixo para usar RLS com políticas

-- -- Habilitar RLS
-- ALTER TABLE kb_categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE kb_articles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE kb_tags ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE kb_article_tags ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE kb_article_feedback ENABLE ROW LEVEL SECURITY;

-- -- Políticas para kb_categories
-- -- Todos podem ver categorias
-- CREATE POLICY "Categorias são públicas para leitura" ON kb_categories
--   FOR SELECT USING (true);

-- -- Apenas service role pode inserir/atualizar/deletar (usado pela API)
-- CREATE POLICY "Service role pode gerenciar categorias" ON kb_categories
--   FOR ALL USING (auth.role() = 'service_role');

-- -- Políticas para kb_articles
-- -- Todos podem ver artigos publicados
-- CREATE POLICY "Artigos publicados são públicos" ON kb_articles
--   FOR SELECT USING (status = 'published' OR auth.role() = 'service_role');

-- -- Service role pode gerenciar artigos
-- CREATE POLICY "Service role pode gerenciar artigos" ON kb_articles
--   FOR ALL USING (auth.role() = 'service_role');

-- -- Políticas para kb_tags
-- CREATE POLICY "Tags são públicas para leitura" ON kb_tags
--   FOR SELECT USING (true);

-- CREATE POLICY "Service role pode gerenciar tags" ON kb_tags
--   FOR ALL USING (auth.role() = 'service_role');

-- -- Políticas para kb_article_tags
-- CREATE POLICY "Article tags são públicas para leitura" ON kb_article_tags
--   FOR SELECT USING (true);

-- CREATE POLICY "Service role pode gerenciar article tags" ON kb_article_tags
--   FOR ALL USING (auth.role() = 'service_role');

-- -- Políticas para kb_article_feedback
-- CREATE POLICY "Feedback é público para leitura" ON kb_article_feedback
--   FOR SELECT USING (true);

-- CREATE POLICY "Service role pode gerenciar feedback" ON kb_article_feedback
--   FOR ALL USING (auth.role() = 'service_role');

-- Verificar status do RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM 
  pg_tables
WHERE 
  tablename LIKE 'kb_%'
ORDER BY 
  tablename;