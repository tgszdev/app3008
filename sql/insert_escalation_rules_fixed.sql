-- ==============================================
-- INSERIR REGRAS DE ESCALAÇÃO AUTOMÁTICA (VERSÃO CORRIGIDA)
-- ==============================================
-- Regras para enviar emails automáticos quando:
-- 1. Ticket não atribuído após 1 hora
-- 2. Ticket sem resposta após 4 horas
-- 3. Ticket não resolvido após 24 horas
-- ==============================================

-- Limpar regras existentes para evitar duplicação
DELETE FROM escalation_rules WHERE name IN (
  'Ticket não atribuído (1 hora)',
  'Ticket sem resposta (4 horas)',
  'Ticket não resolvido (24 horas)'
);

-- 1. REGRA: Ticket não atribuído após 1 hora
INSERT INTO escalation_rules (
  name,
  description,
  time_threshold,
  time_unit,
  time_condition,
  conditions,
  actions,
  priority,
  is_active,
  created_at
) VALUES (
  'Ticket não atribuído (1 hora)',
  'Escala tickets que não foram atribuídos a ninguém após 1 hora da criação',
  60, -- 60 minutos = 1 hora
  'minutes',
  'unassigned_time', -- Mudado de 'unassigned' para 'unassigned_time'
  jsonb_build_object(
    'status', ARRAY['open', 'aberto'],
    'assigned_to', NULL
  ),
  jsonb_build_object(
    'increase_priority', true,
    'notify_supervisor', true,
    'send_email_notification', jsonb_build_object(
      'enabled', true,
      'template', 'unassigned_ticket',
      'recipients', ARRAY[]::text[]
    ),
    'add_comment', '⚠️ ESCALAÇÃO AUTOMÁTICA: Ticket não atribuído há mais de 1 hora. Notificando supervisores.'
  ),
  1,
  true,
  now()
);

-- 2. REGRA: Ticket sem resposta após 4 horas
INSERT INTO escalation_rules (
  name,
  description,
  time_threshold,
  time_unit,
  time_condition,
  conditions,
  actions,
  priority,
  is_active,
  created_at
) VALUES (
  'Ticket sem resposta (4 horas)',
  'Escala tickets que não receberam resposta após 4 horas',
  240, -- 240 minutos = 4 horas
  'minutes',
  'no_response_time', -- Mudado de 'no_response' para 'no_response_time'
  jsonb_build_object(
    'status', ARRAY['open', 'aberto', 'in_progress', 'em-progresso']
  ),
  jsonb_build_object(
    'increase_priority', true,
    'notify_supervisor', true,
    'escalate_to_management', false,
    'send_email_notification', jsonb_build_object(
      'enabled', true,
      'template', 'no_response_ticket',
      'recipients', ARRAY[]::text[]
    ),
    'add_comment', '⚠️ ESCALAÇÃO AUTOMÁTICA: Ticket sem resposta há mais de 4 horas. Prioridade aumentada e supervisores notificados.'
  ),
  2,
  true,
  now()
);

-- 3. REGRA: Ticket não resolvido após 24 horas
INSERT INTO escalation_rules (
  name,
  description,
  time_threshold,
  time_unit,
  time_condition,
  conditions,
  actions,
  priority,
  is_active,
  created_at
) VALUES (
  'Ticket não resolvido (24 horas)',
  'Escala tickets críticos não resolvidos após 24 horas',
  1440, -- 1440 minutos = 24 horas
  'minutes',
  'resolution_time', -- Mudado de 'unresolved' para 'resolution_time'
  jsonb_build_object(
    'status', ARRAY['open', 'aberto', 'in_progress', 'em-progresso'],
    'priority', ARRAY['high', 'critical']
  ),
  jsonb_build_object(
    'increase_priority', true,
    'escalate_to_management', true,
    'send_email_notification', jsonb_build_object(
      'enabled', true,
      'template', 'unresolved_critical_ticket',
      'recipients', ARRAY[]::text[]
    ),
    'add_comment', '🚨 ESCALAÇÃO CRÍTICA: Ticket de alta prioridade não resolvido há mais de 24 horas. Gerência notificada.'
  ),
  3,
  true,
  now()
);

-- Verificar regras inseridas
SELECT 
  id,
  name,
  description,
  time_threshold,
  time_unit,
  time_condition,
  is_active
FROM escalation_rules
WHERE is_active = true
ORDER BY priority;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Regras de escalação inseridas com sucesso:';
  RAISE NOTICE '1. Ticket não atribuído (1 hora) - Notifica supervisores';
  RAISE NOTICE '2. Ticket sem resposta (4 horas) - Aumenta prioridade e notifica';
  RAISE NOTICE '3. Ticket não resolvido (24 horas) - Escala para gerência';
  RAISE NOTICE '';
  RAISE NOTICE 'As regras serão executadas automaticamente a cada 3 minutos pelo cron job.';
END $$;