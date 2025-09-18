-- =====================================================
-- CORRIGIR REGRA DE ESCALAÇÃO - STATUS MISTO
-- =====================================================
-- Execute este script no Supabase SQL Editor

-- 1. VERIFICAR REGRA ATUAL
SELECT 'Verificando regra atual...' as status;
SELECT 
    id,
    name,
    conditions,
    time_threshold,
    time_unit
FROM escalation_rules 
WHERE name = 'Escalação - 1h sem atribuição';

-- 2. ATUALIZAR REGRA PARA ACEITAR AMBOS OS STATUS
UPDATE escalation_rules 
SET conditions = jsonb_set(
    conditions, 
    '{status}', 
    '["aberto", "open", "em-progresso", "in_progress"]'::jsonb
)
WHERE name = 'Escalação - 1h sem atribuição';

-- 3. VERIFICAR ATUALIZAÇÃO
SELECT 'Verificando regra atualizada...' as status;
SELECT 
    id,
    name,
    conditions,
    time_threshold,
    time_unit
FROM escalation_rules 
WHERE name = 'Escalação - 1h sem atribuição';

-- 4. TESTAR COM TICKET ESPECÍFICO
SELECT 'Testando com ticket específico...' as status;
SELECT 
    t.id,
    t.title,
    t.status,
    t.priority,
    t.assigned_to,
    t.created_at,
    EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 60 as minutes_ago
FROM tickets t
WHERE t.id = '659b681f-828e-41fa-a5d9-a1edfb4f2fcd';

SELECT '✅ Regra de escalação corrigida!' as status;
