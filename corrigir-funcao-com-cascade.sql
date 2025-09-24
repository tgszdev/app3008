-- =====================================================
-- CORREÇÃO DA FUNÇÃO COM CASCADE
-- PROBLEMA: cannot drop function because other objects depend on it
-- SOLUÇÃO: Usar DROP ... CASCADE para remover dependências
-- =====================================================

-- 1. VERIFICAR A FUNÇÃO E TRIGGER EXISTENTES
-- =====================================================
SELECT 
    proname as function_name,
    proargtypes,
    prorettype,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'generate_contextual_ticket_number';

-- 2. VERIFICAR O TRIGGER DEPENDENTE
-- =====================================================
SELECT 
    tgname as trigger_name,
    tgtype as trigger_type,
    tgenabled as enabled,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgrelid = (SELECT oid FROM pg_class WHERE relname = 'tickets')
AND tgname = 'generate_contextual_ticket_number_trigger';

-- 3. REMOVER A FUNÇÃO E SEUS DEPENDENTES COM CASCADE
-- =====================================================
DROP FUNCTION IF EXISTS generate_contextual_ticket_number() CASCADE;

-- 4. CRIAR A FUNÇÃO CORRIGIDA
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

-- 5. RECRIAR O TRIGGER CORRIGIDO
-- =====================================================
CREATE TRIGGER generate_contextual_ticket_number_trigger
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION generate_contextual_ticket_number();

-- 6. VERIFICAR SE A FUNÇÃO E TRIGGER FORAM CRIADOS CORRETAMENTE
-- =====================================================
SELECT 
    proname as function_name,
    proargtypes,
    prorettype,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'generate_contextual_ticket_number';

SELECT 
    tgname as trigger_name,
    tgtype as trigger_type,
    tgenabled as enabled,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgrelid = (SELECT oid FROM pg_class WHERE relname = 'tickets')
AND tgname = 'generate_contextual_ticket_number_trigger';

-- 7. TESTAR A FUNÇÃO CORRIGIDA
-- =====================================================
SELECT generate_contextual_ticket_number();

-- 8. TESTAR INSERÇÃO DE TICKET
-- =====================================================
INSERT INTO tickets (title, description, created_by) 
VALUES ('Teste Função Corrigida', 'Descrição teste', '3b855060-50d4-4eef-abf5-4eec96934159');

-- 9. VERIFICAR SE O TICKET FOI CRIADO
-- =====================================================
SELECT id, title, ticket_number, created_by, created_at 
FROM tickets 
WHERE title = 'Teste Função Corrigida'
ORDER BY created_at DESC 
LIMIT 1;

-- 10. LIMPAR O TICKET DE TESTE
-- =====================================================
DELETE FROM tickets WHERE title = 'Teste Função Corrigida';

-- =====================================================
-- FIM DA CORREÇÃO COM CASCADE
-- =====================================================
-- 
-- Execute este script no Supabase Dashboard para:
-- 1. Verificar função e trigger existentes
-- 2. Remover função e dependências com CASCADE
-- 3. Criar função corrigida
-- 4. Recriar trigger corrigido
-- 5. Verificar se foram criados corretamente
-- 6. Testar função e inserção de ticket
-- 
-- A função estava tentando usar LIKE entre integer e text,
-- o que causava o erro "operator does not exist: integer ~~ text".
-- =====================================================
