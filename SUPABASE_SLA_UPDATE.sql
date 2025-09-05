-- ============================================
-- SCRIPT DE ATUALIZAÇÃO PARA CAMPOS DE SLA
-- Execute este script APÓS o script principal de SLA
-- ============================================

-- 1. Adicionar campos de rastreamento de tempo na tabela tickets
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tickets_first_response ON tickets(first_response_at);
CREATE INDEX IF NOT EXISTS idx_tickets_resolved ON tickets(resolved_at);

-- 3. Atualizar tickets existentes que já estão resolvidos/fechados
UPDATE tickets 
SET resolved_at = updated_at 
WHERE status IN ('resolved', 'closed') 
AND resolved_at IS NULL;

-- 4. Para tickets com comentários, definir primeira resposta baseada no primeiro comentário
WITH first_comments AS (
  SELECT DISTINCT ON (c.ticket_id) 
    c.ticket_id,
    c.created_at as first_comment_at,
    c.user_id as commenter_id,
    t.created_by as ticket_creator
  FROM comments c
  JOIN tickets t ON t.id = c.ticket_id
  WHERE c.user_id != t.created_by
  ORDER BY c.ticket_id, c.created_at ASC
)
UPDATE tickets t
SET first_response_at = fc.first_comment_at
FROM first_comments fc
WHERE t.id = fc.ticket_id
AND t.first_response_at IS NULL;

-- 5. Criar função para calcular SLA automaticamente em novos tickets
CREATE OR REPLACE FUNCTION auto_create_ticket_sla()
RETURNS TRIGGER AS $$
DECLARE
  sla_config_id UUID;
  first_response_target TIMESTAMPTZ;
  resolution_target TIMESTAMPTZ;
BEGIN
  -- Buscar configuração de SLA aplicável
  SELECT id INTO sla_config_id
  FROM sla_configurations
  WHERE priority = NEW.priority
    AND is_active = true
    AND (category_id = NEW.category_id OR category_id IS NULL)
  ORDER BY category_id DESC NULLS LAST
  LIMIT 1;

  -- Se encontrou configuração, criar registro de SLA
  IF sla_config_id IS NOT NULL THEN
    -- Calcular targets baseados na configuração
    -- (Simplificado - em produção usar a função calculate_business_minutes)
    INSERT INTO ticket_sla (
      ticket_id,
      sla_configuration_id,
      first_response_target,
      resolution_target,
      first_response_status,
      resolution_status
    )
    SELECT
      NEW.id,
      sla_config_id,
      NEW.created_at + (first_response_time || ' minutes')::interval,
      NEW.created_at + (resolution_time || ' minutes')::interval,
      'pending',
      'pending'
    FROM sla_configurations
    WHERE id = sla_config_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para novos tickets
DROP TRIGGER IF EXISTS create_ticket_sla_trigger ON tickets;
CREATE TRIGGER create_ticket_sla_trigger
  AFTER INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_ticket_sla();

-- 7. Criar registros de SLA para tickets existentes
INSERT INTO ticket_sla (
  ticket_id,
  sla_configuration_id,
  first_response_target,
  resolution_target,
  first_response_status,
  resolution_status,
  first_response_at,
  resolved_at
)
SELECT 
  t.id,
  sc.id,
  t.created_at + (sc.first_response_time || ' minutes')::interval,
  t.created_at + (sc.resolution_time || ' minutes')::interval,
  CASE 
    WHEN t.first_response_at IS NULL AND t.status NOT IN ('resolved', 'closed') THEN 'pending'
    WHEN t.first_response_at IS NULL THEN 'breached'
    WHEN t.first_response_at <= (t.created_at + (sc.first_response_time || ' minutes')::interval) THEN 'met'
    ELSE 'breached'
  END,
  CASE 
    WHEN t.resolved_at IS NULL AND t.status NOT IN ('resolved', 'closed') THEN 'pending'
    WHEN t.resolved_at IS NULL THEN 'breached'
    WHEN t.resolved_at <= (t.created_at + (sc.resolution_time || ' minutes')::interval) THEN 'met'
    ELSE 'breached'
  END,
  t.first_response_at,
  t.resolved_at
FROM tickets t
JOIN sla_configurations sc ON sc.priority = t.priority
WHERE sc.is_active = true
  AND (sc.category_id = t.category_id OR sc.category_id IS NULL)
  AND NOT EXISTS (
    SELECT 1 FROM ticket_sla ts WHERE ts.ticket_id = t.id
  )
ORDER BY sc.category_id DESC NULLS LAST;

-- ============================================
-- FIM DO SCRIPT DE ATUALIZAÇÃO
-- ============================================

-- Para verificar os registros criados:
-- SELECT COUNT(*) FROM ticket_sla;
-- SELECT * FROM ticket_sla LIMIT 10;