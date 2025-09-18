-- =====================================================
-- CORREÇÃO DA REGRA DE ESCALAÇÃO
-- =====================================================
-- Corrigir a regra "Escalação - 1h sem atribuição" para funcionar corretamente

-- 1. Corrigir a regra "Escalação - 1h sem atribuição"
UPDATE escalation_rules 
SET 
    time_threshold = 60,  -- 60 minutos = 1 hora
    actions = jsonb_build_object(
        'add_comment', 'Ticket não atribuído há mais de 1 hora. Supervisor notificado.',
        'send_email_notification', true,
        'notify_supervisor', jsonb_build_object(
            'recipients', jsonb_build_array('2a33241e-ed38-48b5-9c84-e8c354ae9606')
        )
    )
WHERE id = 'ef3c711f-bb78-4624-99a4-aa025790811c';

-- 2. Verificar se a correção foi aplicada
SELECT 
    id,
    name,
    time_threshold,
    time_unit,
    conditions,
    actions
FROM escalation_rules 
WHERE id = 'ef3c711f-bb78-4624-99a4-aa025790811c';

-- 3. Corrigir outras regras para usar status em português
UPDATE escalation_rules 
SET conditions = jsonb_set(
    conditions, 
    '{status}', 
    '"aberto"'::jsonb
)
WHERE id = 'ca5d4cfb-6a53-44f2-92b7-a07344636208' 
AND conditions->>'status' = 'open';

UPDATE escalation_rules 
SET conditions = jsonb_set(
    conditions, 
    '{status}', 
    '"em-progresso"'::jsonb
)
WHERE id IN ('c9595e97-9457-4740-8770-c7ede99a494a', '8451d89c-31d2-4f48-9bee-a121daacd64e')
AND conditions->>'status' = 'in_progress';

-- 4. Verificar todas as regras corrigidas
SELECT 
    id,
    name,
    time_threshold,
    time_unit,
    conditions,
    actions
FROM escalation_rules 
WHERE is_active = true
ORDER BY priority ASC;
