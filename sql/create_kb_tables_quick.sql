-- Script rápido para criar as tabelas da Base de Conhecimento
-- Execute este script no Supabase SQL Editor

-- 1. Criar tabela de categorias
CREATE TABLE IF NOT EXISTS kb_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'FileText',
  color VARCHAR(7) DEFAULT '#6366F1',
  display_order INTEGER DEFAULT 999,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Criar tabela de artigos
CREATE TABLE IF NOT EXISTS kb_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  category_id UUID REFERENCES kb_categories(id),
  author_id UUID,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT FALSE,
  is_faq BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP WITH TIME ZONE
);

-- 3. Criar tabela de tags
CREATE TABLE IF NOT EXISTS kb_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Criar tabela de relação artigo-tags
CREATE TABLE IF NOT EXISTS kb_article_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES kb_articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES kb_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(article_id, tag_id)
);

-- 5. Criar tabela de feedback
CREATE TABLE IF NOT EXISTS kb_article_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES kb_articles(id) ON DELETE CASCADE,
  user_id UUID,
  helpful BOOLEAN NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Inserir categorias padrão
INSERT INTO kb_categories (name, slug, description, icon, color, display_order) VALUES
  ('Primeiros Passos', 'primeiros-passos', 'Guias para começar a usar o sistema', 'Rocket', '#6366F1', 1),
  ('Tutoriais', 'tutoriais', 'Tutoriais passo a passo', 'BookOpen', '#8B5CF6', 2),
  ('Solução de Problemas', 'solucao-problemas', 'Resoluções para problemas comuns', 'Wrench', '#EF4444', 3),
  ('FAQ', 'faq', 'Perguntas frequentes', 'HelpCircle', '#F59E0B', 4),
  ('Recursos', 'recursos', 'Recursos e funcionalidades do sistema', 'Lightbulb', '#10B981', 5)
ON CONFLICT (slug) DO NOTHING;

-- 7. Inserir artigo de exemplo
INSERT INTO kb_articles (
  title,
  slug,
  excerpt,
  content,
  category_id,
  status,
  is_featured,
  is_faq
) VALUES (
  'Bem-vindo à Base de Conhecimento',
  'bem-vindo-base-conhecimento',
  'Aprenda a usar a Base de Conhecimento para encontrar soluções e tutoriais.',
  '## Introdução

Bem-vindo à nossa Base de Conhecimento! Aqui você encontrará:

- **Tutoriais** detalhados
- **Soluções** para problemas comuns
- **FAQ** com perguntas frequentes
- **Guias** passo a passo

### Como usar

1. Use a **busca** para encontrar artigos específicos
2. Navegue pelas **categorias** para explorar tópicos
3. Dê **feedback** nos artigos para nos ajudar a melhorar

### Precisa de ajuda?

Se não encontrar o que procura, entre em contato com o suporte.',
  (SELECT id FROM kb_categories WHERE slug = 'primeiros-passos' LIMIT 1),
  'published',
  true,
  false
) ON CONFLICT (slug) DO NOTHING;

-- 8. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_kb_articles_status ON kb_articles(status);
CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON kb_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_slug ON kb_articles(slug);
CREATE INDEX IF NOT EXISTS idx_kb_article_tags_article ON kb_article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_kb_article_tags_tag ON kb_article_tags(tag_id);

-- Pronto! As tabelas foram criadas com sucesso.