-- ⚠️ CORREÇÃO URGENTE: DATAS FUTURAS NO SISTEMA
-- Este script corrige tickets criados com ano 2025 (erro de sistema)

-- 1. VERIFICAR tickets com datas futuras
SELECT 
    id,
    ticket_number,
    title,
    created_at,
    updated_at,
    EXTRACT(YEAR FROM created_at) as ano_criacao
FROM tickets
WHERE EXTRACT(YEAR FROM created_at) = 2025
ORDER BY created_at DESC;

-- 2. CORRIGIR TODAS AS DATAS DE 2025 PARA 2024
-- Subtrai 1 ano de todas as datas erradas

-- Corrigir tabela tickets
UPDATE tickets 
SET 
    created_at = created_at - INTERVAL '1 year',
    updated_at = updated_at - INTERVAL '1 year'
WHERE EXTRACT(YEAR FROM created_at) = 2025;

-- Corrigir resolved_at se existir
UPDATE tickets 
SET resolved_at = resolved_at - INTERVAL '1 year'
WHERE resolved_at IS NOT NULL 
  AND EXTRACT(YEAR FROM resolved_at) = 2025;

-- Corrigir closed_at se existir
UPDATE tickets 
SET closed_at = closed_at - INTERVAL '1 year'
WHERE closed_at IS NOT NULL 
  AND EXTRACT(YEAR FROM closed_at) = 2025;

-- Corrigir first_response_at se existir
UPDATE tickets 
SET first_response_at = first_response_at - INTERVAL '1 year'
WHERE first_response_at IS NOT NULL 
  AND EXTRACT(YEAR FROM first_response_at) = 2025;

-- Corrigir rated_at se existir
UPDATE tickets 
SET rated_at = rated_at - INTERVAL '1 year'
WHERE rated_at IS NOT NULL 
  AND EXTRACT(YEAR FROM rated_at) = 2025;

-- 3. CORRIGIR COMENTÁRIOS
UPDATE comments 
SET 
    created_at = created_at - INTERVAL '1 year',
    updated_at = updated_at - INTERVAL '1 year'
WHERE EXTRACT(YEAR FROM created_at) = 2025;

-- 4. CORRIGIR NOTIFICAÇÕES
UPDATE notifications 
SET 
    created_at = created_at - INTERVAL '1 year',
    read_at = CASE 
        WHEN read_at IS NOT NULL AND EXTRACT(YEAR FROM read_at) = 2025 
        THEN read_at - INTERVAL '1 year'
        ELSE read_at
    END
WHERE EXTRACT(YEAR FROM created_at) = 2025;

-- 5. CORRIGIR LOGS DE ATIVIDADES
UPDATE activity_logs 
SET created_at = created_at - INTERVAL '1 year'
WHERE EXTRACT(YEAR FROM created_at) = 2025;

-- 6. CORRIGIR LOGS DE ESCALAÇÃO
UPDATE escalation_logs 
SET triggered_at = triggered_at - INTERVAL '1 year'
WHERE EXTRACT(YEAR FROM triggered_at) = 2025;

-- 7. CORRIGIR ATTACHMENTS
UPDATE attachments 
SET 
    created_at = created_at - INTERVAL '1 year',
    updated_at = updated_at - INTERVAL '1 year'
WHERE EXTRACT(YEAR FROM created_at) = 2025;

-- 8. VERIFICAR RESULTADO
SELECT 
    'Tickets corrigidos:' as tabela,
    COUNT(*) as total
FROM tickets
WHERE EXTRACT(YEAR FROM created_at) = 2024
  AND created_at >= '2024-09-18'::date

UNION ALL

SELECT 
    'Tickets ainda com problema:' as tabela,
    COUNT(*) as total
FROM tickets
WHERE EXTRACT(YEAR FROM created_at) = 2025;

-- MENSAGEM FINAL
DO $$
BEGIN
    RAISE NOTICE '✅ Datas corrigidas de 2025 para 2024!';
    RAISE NOTICE 'Todas as tabelas foram atualizadas.';
END $$;