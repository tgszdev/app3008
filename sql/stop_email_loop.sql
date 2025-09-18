-- =====================================================
-- PARAR LOOP DE E-MAILS - SCRIPT SIMPLIFICADO
-- =====================================================
-- Execute este script no Supabase SQL Editor

-- 1. MARCAR TODAS AS NOTIFICAÇÕES COMO PROCESSADAS
UPDATE notifications 
SET is_read = true
WHERE type = 'escalation_email' 
AND is_read = false;

-- 2. VERIFICAR RESULTADO
SELECT 
    COUNT(*) as total_notificacoes,
    SUM(CASE WHEN is_read = true THEN 1 ELSE 0 END) as processadas,
    SUM(CASE WHEN is_read = false THEN 1 ELSE 0 END) as pendentes
FROM notifications 
WHERE type = 'escalation_email';

-- 3. MOSTRAR ÚLTIMAS NOTIFICAÇÕES
SELECT 
    id,
    title,
    is_read,
    created_at
FROM notifications 
WHERE type = 'escalation_email'
ORDER BY created_at DESC
LIMIT 5;

SELECT '✅ Loop de e-mails parado!' as status;
