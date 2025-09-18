-- Corrigir regra "Escalação - 1h sem atribuição" para aceitar múltiplos valores
-- e garantir funcionamento automático perfeito

UPDATE escalation_rules 
SET 
  conditions = jsonb_set(
    jsonb_set(
      conditions, 
      '{status}', 
      '["aberto", "open"]'::jsonb
    ),
    '{priority}',
    '["critical", "high"]'::jsonb
  ),
  updated_at = NOW()
WHERE name = 'Escalação - 1h sem atribuição';

-- Verificar se a atualização foi aplicada
SELECT 
  name,
  time_threshold,
  time_unit,
  conditions,
  actions->'send_email_notification' as send_email,
  actions->'notify_supervisor' as notify_supervisor
FROM escalation_rules 
WHERE name = 'Escalação - 1h sem atribuição';
