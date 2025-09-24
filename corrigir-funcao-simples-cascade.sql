-- =====================================================
-- CORREÇÃO SIMPLES COM CASCADE
-- PROBLEMA: cannot drop function because trigger depends on it
-- SOLUÇÃO: Usar DROP ... CASCADE para remover tudo
-- =====================================================

-- 1. REMOVER FUNÇÃO E DEPENDÊNCIAS COM CASCADE
-- =====================================================
DROP FUNCTION IF EXISTS generate_contextual_ticket_number() CASCADE;

-- 2. CRIAR A FUNÇÃO CORRIGIDA
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

-- 3. RECRIAR O TRIGGER
-- =====================================================
CREATE TRIGGER generate_contextual_ticket_number_trigger
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION generate_contextual_ticket_number();

-- 4. TESTAR A FUNÇÃO
-- =====================================================
SELECT generate_contextual_ticket_number();

-- 5. TESTAR INSERÇÃO DE TICKET
-- =====================================================
INSERT INTO tickets (title, description, created_by) 
VALUES ('Teste Função Corrigida', 'Descrição teste', '3b855060-50d4-4eef-abf5-4eec96934159');

-- 6. VERIFICAR SE O TICKET FOI CRIADO
-- =====================================================
SELECT id, title, ticket_number, created_by, created_at 
FROM tickets 
WHERE title = 'Teste Função Corrigida'
ORDER BY created_at DESC 
LIMIT 1;

-- 7. LIMPAR O TICKET DE TESTE
-- =====================================================
DELETE FROM tickets WHERE title = 'Teste Função Corrigida';

-- =====================================================
-- FIM DA CORREÇÃO SIMPLES COM CASCADE
-- =====================================================
-- 
-- Execute este script no Supabase Dashboard para:
-- 1. Remover função e dependências com CASCADE
-- 2. Criar função corrigida
-- 3. Recriar trigger
-- 4. Testar função e inserção de ticket
-- 
-- A função estava tentando usar LIKE entre integer e text,
-- o que causava o erro "operator does not exist: integer ~~ text".
-- =====================================================
