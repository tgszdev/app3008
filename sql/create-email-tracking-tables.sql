-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  FASE 1: Tabelas para Tracking de Email                           ║
-- ╚════════════════════════════════════════════════════════════════════╝

-- 1. Adicionar colunas de tracking na tabela email_logs (se não existirem)
ALTER TABLE email_logs 
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_clicked_url TEXT;

-- 2. Criar tabela de engajamento detalhado
CREATE TABLE IF NOT EXISTS email_engagement (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id UUID REFERENCES email_logs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  clicked_url TEXT,
  action_taken VARCHAR(50), -- assumed, replied, snoozed, etc.
  action_taken_at TIMESTAMPTZ,
  user_agent TEXT,
  ip_address INET,
  device_type VARCHAR(20), -- desktop, mobile, tablet
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(email_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_email_engagement_email ON email_engagement(email_id);
CREATE INDEX IF NOT EXISTS idx_email_engagement_user ON email_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_email_engagement_opened ON email_engagement(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_engagement_clicked ON email_engagement(clicked_at DESC);

-- 3. Criar tabela de links clicados
CREATE TABLE IF NOT EXISTS email_link_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id UUID REFERENCES email_logs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  clicked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  ip_address INET
);

CREATE INDEX IF NOT EXISTS idx_email_link_clicks_email ON email_link_clicks(email_id);
CREATE INDEX IF NOT EXISTS idx_email_link_clicks_user ON email_link_clicks(user_id);

-- 4. Criar view para métricas de email
CREATE OR REPLACE VIEW email_metrics AS
SELECT 
  el.id as email_id,
  el.to_email,
  el.subject,
  el.created_at as sent_at,
  el.status,
  el.opened_at,
  el.open_count,
  el.clicked_at,
  el.click_count,
  CASE 
    WHEN el.opened_at IS NOT NULL THEN true 
    ELSE false 
  END as was_opened,
  CASE 
    WHEN el.clicked_at IS NOT NULL THEN true 
    ELSE false 
  END as was_clicked,
  EXTRACT(EPOCH FROM (el.opened_at - el.created_at)) / 60 as minutes_to_open,
  EXTRACT(EPOCH FROM (el.clicked_at - el.opened_at)) / 60 as minutes_to_click,
  ee.action_taken,
  ee.action_taken_at
FROM email_logs el
LEFT JOIN email_engagement ee ON el.id = ee.email_id
WHERE el.status = 'sent';

-- 5. Comentários
COMMENT ON TABLE email_engagement IS 'Rastreamento detalhado de interações com emails';
COMMENT ON TABLE email_link_clicks IS 'Registro de todos os cliques em links de emails';
COMMENT ON VIEW email_metrics IS 'Métricas consolidadas de emails para análise';

-- 6. Verificar resultado
SELECT 
  '✅ TABELAS DE TRACKING CRIADAS' as status,
  COUNT(*) FILTER (WHERE table_name = 'email_engagement') as email_engagement,
  COUNT(*) FILTER (WHERE table_name = 'email_link_clicks') as email_link_clicks
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('email_engagement', 'email_link_clicks');

-- 7. Exemplo de consulta de métricas
/*
-- Taxa de abertura dos últimos 7 dias
SELECT 
  DATE(sent_at) as date,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE was_opened) as total_opened,
  ROUND(COUNT(*) FILTER (WHERE was_opened)::NUMERIC / COUNT(*) * 100, 2) as open_rate,
  ROUND(AVG(minutes_to_open), 1) as avg_minutes_to_open
FROM email_metrics
WHERE sent_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(sent_at)
ORDER BY date DESC;
*/

