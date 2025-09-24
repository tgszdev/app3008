-- =====================================================
-- CORREÇÃO DA FUNÇÃO: generate_contextual_ticket_number()
-- PROBLEMA: ticket_number (integer) LIKE year_month || '%' (text)
-- SOLUÇÃO: Converter ticket_number para text ou usar operador correto
-- =====================================================

-- 1. VERIFICAR A FUNÇÃO ATUAL
-- =====================================================
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'generate_contextual_ticket_number';

-- 2. CORRIGIR A FUNÇÃO - VERSÃO 1: Converter ticket_number para text
-- =====================================================
CREATE OR REPLACE FUNCTION generate_contextual_ticket_number()
RETURNS INTEGER AS $$
DECLARE
    year_month TEXT;
    next_number INTEGER;
BEGIN
    -- Obter ano e mês atual
    year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
    
    -- Buscar o próximo número para o contexto atual
    SELECT COUNT(*) + 1 INTO next_number
    FROM tickets
    WHERE ticket_number::TEXT LIKE year_month || '%'
    AND context_id IS NULL;
    
    -- Se não há tickets para o contexto atual, começar do 1
    IF next_number IS NULL THEN
        next_number := 1;
    END IF;
    
    -- Retornar o número do ticket formatado
    RETURN (year_month || LPAD(next_number::TEXT, 4, '0'))::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- 3. CORRIGIR A FUNÇÃO - VERSÃO 2: Usar operador correto para integer
-- =====================================================
CREATE OR REPLACE FUNCTION generate_contextual_ticket_number()
RETURNS INTEGER AS $$
DECLARE
    year_month TEXT;
    next_number INTEGER;
    year_month_int INTEGER;
BEGIN
    -- Obter ano e mês atual
    year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
    year_month_int := year_month::INTEGER;
    
    -- Buscar o próximo número para o contexto atual
    SELECT COUNT(*) + 1 INTO next_number
    FROM tickets
    WHERE ticket_number >= year_month_int * 10000
    AND ticket_number < (year_month_int + 1) * 10000
    AND context_id IS NULL;
    
    -- Se não há tickets para o contexto atual, começar do 1
    IF next_number IS NULL THEN
        next_number := 1;
    END IF;
    
    -- Retornar o número do ticket formatado
    RETURN (year_month || LPAD(next_number::TEXT, 4, '0'))::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- 4. CORRIGIR A FUNÇÃO - VERSÃO 3: Simplificar usando MAX
-- =====================================================
CREATE OR REPLACE FUNCTION generate_contextual_ticket_number()
RETURNS INTEGER AS $$
DECLARE
    year_month TEXT;
    next_number INTEGER;
    year_month_int INTEGER;
BEGIN
    -- Obter ano e mês atual
    year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
    year_month_int := year_month::INTEGER;
    
    -- Buscar o próximo número para o contexto atual
    SELECT COALESCE(MAX(ticket_number), year_month_int * 10000 - 1) + 1 INTO next_number
    FROM tickets
    WHERE ticket_number >= year_month_int * 10000
    AND ticket_number < (year_month_int + 1) * 10000
    AND context_id IS NULL;
    
    -- Retornar o número do ticket
    RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- 5. TESTAR A FUNÇÃO CORRIGIDA
-- =====================================================
SELECT generate_contextual_ticket_number();

-- 6. TESTAR INSERÇÃO DE TICKET
-- =====================================================
INSERT INTO tickets (title, description, created_by) 
VALUES ('Teste Função Corrigida', 'Descrição teste', '3b855060-50d4-4eef-abf5-4eec96934159');

-- 7. VERIFICAR SE O TICKET FOI CRIADO
-- =====================================================
SELECT id, title, ticket_number, created_by, created_at 
FROM tickets 
WHERE title = 'Teste Função Corrigida'
ORDER BY created_at DESC 
LIMIT 1;

-- 8. LIMPAR O TICKET DE TESTE
-- =====================================================
DELETE FROM tickets WHERE title = 'Teste Função Corrigida';

-- =====================================================
-- FIM DA CORREÇÃO
-- =====================================================
-- 
-- Execute este script no Supabase Dashboard para:
-- 1. Verificar a função atual
-- 2. Corrigir a função com uma das 3 versões
-- 3. Testar a função corrigida
-- 4. Testar inserção de ticket
-- 
-- A função estava tentando usar LIKE entre integer e text,
-- o que causava o erro "operator does not exist: integer ~~ text".
-- =====================================================
