-- =====================================================
-- CORREÇÃO SIMPLES DA FUNÇÃO DE TRIGGER
-- PROBLEMA: function must return type trigger
-- SOLUÇÃO: Criar função de trigger correta
-- =====================================================

-- 1. REMOVER FUNÇÃO E DEPENDÊNCIAS
-- =====================================================
DROP FUNCTION IF EXISTS generate_contextual_ticket_number() CASCADE;

-- 2. CRIAR FUNÇÃO DE TRIGGER CORRIGIDA
-- =====================================================
CREATE FUNCTION generate_contextual_ticket_number()
RETURNS TRIGGER AS $$
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
    
    -- Definir o número do ticket no NEW
    NEW.ticket_number := next_number;
    
    -- Retornar NEW (obrigatório em funções de trigger)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. RECRIAR O TRIGGER
-- =====================================================
CREATE TRIGGER generate_contextual_ticket_number_trigger
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION generate_contextual_ticket_number();

-- 4. TESTAR INSERÇÃO DE TICKET
-- =====================================================
INSERT INTO tickets (title, description, created_by) 
VALUES ('Teste Função Trigger Corrigida', 'Descrição teste', '3b855060-50d4-4eef-abf5-4eec96934159');

-- 5. VERIFICAR SE O TICKET FOI CRIADO
-- =====================================================
SELECT id, title, ticket_number, created_by, created_at 
FROM tickets 
WHERE title = 'Teste Função Trigger Corrigida'
ORDER BY created_at DESC 
LIMIT 1;

-- 6. LIMPAR O TICKET DE TESTE
-- =====================================================
DELETE FROM tickets WHERE title = 'Teste Função Trigger Corrigida';

-- =====================================================
-- FIM DA CORREÇÃO SIMPLES
-- =====================================================
-- 
-- Execute este script no Supabase Dashboard para:
-- 1. Remover função e dependências
-- 2. Criar função de trigger corrigida
-- 3. Recriar trigger
-- 4. Testar inserção de ticket
-- 
-- A função estava tentando usar LIKE entre integer e text,
-- o que causava o erro "operator does not exist: integer ~~ text".
-- Agora é uma função de trigger que retorna TRIGGER.
-- =====================================================
