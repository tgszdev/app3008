-- Tabela de categorias da base de conhecimento
CREATE TABLE IF NOT EXISTS kb_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7) DEFAULT '#3b82f6',
  parent_id UUID REFERENCES kb_categories(id) ON DELETE SET NULL,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de artigos da base de conhecimento
CREATE TABLE IF NOT EXISTS kb_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category_id UUID REFERENCES kb_categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  is_faq BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  meta_keywords TEXT[],
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de tags para artigos
CREATE TABLE IF NOT EXISTS kb_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de relacionamento artigos-tags
CREATE TABLE IF NOT EXISTS kb_article_tags (
  article_id UUID REFERENCES kb_articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES kb_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- Tabela de avaliações de artigos
CREATE TABLE IF NOT EXISTS kb_article_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES kb_articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_helpful BOOLEAN NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(article_id, user_id)
);

-- Tabela de artigos relacionados
CREATE TABLE IF NOT EXISTS kb_related_articles (
  article_id UUID REFERENCES kb_articles(id) ON DELETE CASCADE,
  related_article_id UUID REFERENCES kb_articles(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, related_article_id),
  CHECK (article_id != related_article_id)
);

-- Tabela de anexos de artigos
CREATE TABLE IF NOT EXISTS kb_article_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES kb_articles(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON kb_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_author ON kb_articles(author_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_status ON kb_articles(status);
CREATE INDEX IF NOT EXISTS idx_kb_articles_slug ON kb_articles(slug);
CREATE INDEX IF NOT EXISTS idx_kb_articles_faq ON kb_articles(is_faq) WHERE is_faq = true;
CREATE INDEX IF NOT EXISTS idx_kb_articles_featured ON kb_articles(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_kb_article_tags_article ON kb_article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_kb_article_tags_tag ON kb_article_tags(tag_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_kb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kb_categories_updated_at
  BEFORE UPDATE ON kb_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_kb_updated_at();

CREATE TRIGGER kb_articles_updated_at
  BEFORE UPDATE ON kb_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_kb_updated_at();

-- Inserir categorias padrão
INSERT INTO kb_categories (name, slug, description, icon, color, order_index) VALUES
  ('Primeiros Passos', 'primeiros-passos', 'Guias para começar a usar o sistema', 'Rocket', '#10b981', 1),
  ('Tutoriais', 'tutoriais', 'Passo a passo detalhado das funcionalidades', 'BookOpen', '#3b82f6', 2),
  ('Solução de Problemas', 'solucao-problemas', 'Resoluções para problemas comuns', 'Wrench', '#ef4444', 3),
  ('FAQ', 'faq', 'Perguntas frequentes', 'HelpCircle', '#f59e0b', 4),
  ('Boas Práticas', 'boas-praticas', 'Recomendações e dicas de uso', 'Lightbulb', '#8b5cf6', 5),
  ('Segurança', 'seguranca', 'Informações sobre segurança e privacidade', 'Shield', '#06b6d4', 6),
  ('API e Integrações', 'api-integracoes', 'Documentação técnica e APIs', 'Code', '#ec4899', 7),
  ('Atualizações', 'atualizacoes', 'Novidades e mudanças no sistema', 'TrendingUp', '#22c55e', 8)
ON CONFLICT (slug) DO NOTHING;

-- Inserir alguns artigos de exemplo
INSERT INTO kb_articles (title, slug, content, excerpt, category_id, status, is_faq, meta_keywords) 
SELECT 
  'Como criar seu primeiro ticket',
  'como-criar-primeiro-ticket',
  E'# Como criar seu primeiro ticket\n\nCriar um ticket é simples e rápido. Siga os passos abaixo:\n\n## Passo 1: Acesse a página de tickets\nNavegue até **Dashboard > Tickets** no menu lateral.\n\n## Passo 2: Clique em Novo Ticket\nClique no botão "Novo Ticket" no canto superior direito.\n\n## Passo 3: Preencha as informações\n- **Título**: Descreva brevemente o problema\n- **Descrição**: Forneça detalhes sobre a situação\n- **Categoria**: Selecione a categoria apropriada\n- **Prioridade**: Defina a urgência do chamado\n\n## Passo 4: Anexe arquivos (opcional)\nVocê pode anexar imagens ou documentos relevantes.\n\n## Passo 5: Envie o ticket\nClique em "Criar Ticket" para finalizar.',
  'Aprenda como criar seu primeiro ticket de suporte em poucos passos',
  (SELECT id FROM kb_categories WHERE slug = 'primeiros-passos' LIMIT 1),
  'published',
  false,
  ARRAY['ticket', 'criar', 'suporte', 'ajuda']
WHERE NOT EXISTS (SELECT 1 FROM kb_articles WHERE slug = 'como-criar-primeiro-ticket');

INSERT INTO kb_articles (title, slug, content, excerpt, category_id, status, is_faq, meta_keywords) 
SELECT 
  'Como acompanhar o status do meu ticket?',
  'como-acompanhar-status-ticket',
  E'# Como acompanhar o status do seu ticket\n\nVocê pode acompanhar o progresso do seu ticket de várias formas:\n\n## 1. Notificações\n- Receba notificações por email sobre atualizações\n- Veja notificações in-app no sino do header\n- Configure suas preferências em Configurações > Notificações\n\n## 2. Página de Tickets\n- Acesse Dashboard > Tickets\n- Veja o status atual na coluna "Status"\n- Clique no ticket para ver detalhes completos\n\n## 3. Comentários\n- Adicione comentários para se comunicar com a equipe\n- Receba respostas em tempo real\n- Anexe arquivos adicionais se necessário',
  'Saiba como acompanhar e gerenciar seus tickets de suporte',
  (SELECT id FROM kb_categories WHERE slug = 'faq' LIMIT 1),
  'published',
  true,
  ARRAY['status', 'acompanhar', 'ticket', 'notificação']
WHERE NOT EXISTS (SELECT 1 FROM kb_articles WHERE slug = 'como-acompanhar-status-ticket');

INSERT INTO kb_articles (title, slug, content, excerpt, category_id, status, is_faq, meta_keywords) 
SELECT 
  'Quais são os níveis de prioridade?',
  'niveis-prioridade-tickets',
  E'# Níveis de Prioridade dos Tickets\n\n## 🔴 Urgente\n- **Quando usar**: Sistema completamente parado ou problema crítico afetando múltiplos usuários\n- **Tempo de resposta**: Em até 2 horas\n- **Exemplos**: Sistema fora do ar, perda de dados, falha de segurança\n\n## 🟠 Alta\n- **Quando usar**: Funcionalidade importante com problema, mas há alternativa temporária\n- **Tempo de resposta**: Em até 4 horas\n- **Exemplos**: Erro em relatório importante, lentidão severa\n\n## 🟡 Média\n- **Quando usar**: Problema que afeta produtividade mas não é crítico\n- **Tempo de resposta**: Em até 24 horas\n- **Exemplos**: Bug visual, funcionalidade secundária com erro\n\n## 🟢 Baixa\n- **Quando usar**: Melhorias, dúvidas ou problemas menores\n- **Tempo de resposta**: Em até 48 horas\n- **Exemplos**: Sugestões, pequenos ajustes, dúvidas gerais',
  'Entenda os diferentes níveis de prioridade e quando usar cada um',
  (SELECT id FROM kb_categories WHERE slug = 'faq' LIMIT 1),
  'published',
  true,
  ARRAY['prioridade', 'urgente', 'alta', 'média', 'baixa', 'SLA']
WHERE NOT EXISTS (SELECT 1 FROM kb_articles WHERE slug = 'niveis-prioridade-tickets');

-- Inserir algumas tags de exemplo
INSERT INTO kb_tags (name, slug) VALUES
  ('Tickets', 'tickets'),
  ('Usuários', 'usuarios'),
  ('Notificações', 'notificacoes'),
  ('Segurança', 'seguranca'),
  ('Email', 'email'),
  ('Dashboard', 'dashboard'),
  ('Relatórios', 'relatorios'),
  ('API', 'api')
ON CONFLICT (slug) DO NOTHING;