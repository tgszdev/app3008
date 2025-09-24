-- =====================================================
-- CORREÇÃO: TICKET NUMBER DUPLICADO
-- =====================================================
-- 
-- Problema: duplicate key value violates unique constraint "tickets_ticket_number_key"
-- Solução: Verificar e corrigir a função generate_contextual_ticket_number()
-- 
-- =====================================================

-- 1. Verificar a função atual
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname = 'generate_contextual_ticket_number';

-- 2. Verificar tickets existentes com números duplicados
SELECT 
    ticket_number, 
    COUNT(*) as count
FROM tickets 
GROUP BY ticket_number 
HAVING COUNT(*) > 1
ORDER BY ticket_number;

-- 3. Verificar a sequência atual
SELECT 
    ticket_number,
    created_at,
    title
FROM tickets 
ORDER BY ticket_number DESC 
LIMIT 10;

-- 4. Corrigir a função para evitar duplicatas
DROP FUNCTION IF EXISTS generate_contextual_ticket_number() CASCADE;

CREATE FUNCTION generate_contextual_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
    year_month TEXT;
    next_number INTEGER;
    year_month_int INTEGER;
    max_number INTEGER;
BEGIN
    -- Obter ano e mês atual
    year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
    year_month_int := year_month::INTEGER;
    
    -- Encontrar o próximo número disponível
    SELECT COALESCE(MAX(ticket_number), year_month_int * 10000 - 1) + 1 
    INTO next_number
    FROM tickets
    WHERE ticket_number >= year_month_int * 10000
    AND ticket_number < (year_month_int + 1) * 10000;
    
    -- Verificar se o número já existe (dupla verificação)
    WHILE EXISTS (SELECT 1 FROM tickets WHERE ticket_number = next_number) LOOP
        next_number := next_number + 1;
    END LOOP;
    
    NEW.ticket_number := next_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Recriar o trigger
CREATE TRIGGER generate_contextual_ticket_number_trigger
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION generate_contextual_ticket_number();

-- 6. Testar a função
INSERT INTO tickets (
    title, 
    description, 
    created_by, 
    context_id, 
    status, 
    priority
) VALUES (
    'Teste Função Corrigida',
    'Teste da função generate_contextual_ticket_number corrigida',
    '2a33241e-ed38-48b5-9c84-e8c354ae9606',
    '6486088e-72ae-461b-8b03-32ca84918882',
    'open',
    'medium'
);

-- 7. Verificar se o ticket foi criado corretamente
SELECT 
    id,
    ticket_number,
    title,
    created_at
FROM tickets 
WHERE title = 'Teste Função Corrigida'
ORDER BY created_at DESC 
LIMIT 1;

-- 8. Limpar o ticket de teste
DELETE FROM tickets WHERE title = 'Teste Função Corrigida';
