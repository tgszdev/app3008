-- =====================================================
-- CORREÇÃO ROBUSTA DA FUNÇÃO
-- PROBLEMA: cannot change return type of existing function
-- SOLUÇÃO: Verificar e remover função existente, depois criar nova
-- =====================================================

-- 1. VERIFICAR SE A FUNÇÃO EXISTE
-- =====================================================
SELECT 
    proname as function_name,
    proargtypes,
    prorettype,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'generate_contextual_ticket_number';

-- 2. REMOVER A FUNÇÃO EXISTENTE (SE EXISTIR)
-- =====================================================
DROP FUNCTION IF EXISTS generate_contextual_ticket_number();

-- 3. CRIAR A FUNÇÃO CORRIGIDA
-- =====================================================
CREATE FUNCTION generate_contextual_ticket_number()
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

-- 4. VERIFICAR SE A FUNÇÃO FOI CRIADA CORRETAMENTE
-- =====================================================
SELECT 
    proname as function_name,
    proargtypes,
    prorettype,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'generate_contextual_ticket_number';

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
-- FIM DA CORREÇÃO ROBUSTA
-- =====================================================
-- 
-- Execute este script no Supabase Dashboard para:
-- 1. Verificar se a função existe
-- 2. Remover a função existente
-- 3. Criar a função corrigida
-- 4. Verificar se foi criada corretamente
-- 5. Testar a função corrigida
-- 6. Testar inserção de ticket
-- 
-- A função estava tentando usar LIKE entre integer e text,
-- o que causava o erro "operator does not exist: integer ~~ text".
-- =====================================================
