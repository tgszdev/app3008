-- Script para corrigir resolved_at para tickets já fechados/resolvidos
-- e implementar trigger para preenchimento automático

-- 1. Atualizar resolved_at para tickets já fechados/resolvidos
UPDATE tickets 
SET resolved_at = updated_at 
WHERE status IN ('Fechado', 'Resolvido') 
AND resolved_at IS NULL;

-- 2. Criar função para calcular tempo de resolução
CREATE OR REPLACE FUNCTION calculate_resolution_time(ticket_id UUID)
RETURNS INTERVAL AS $$
DECLARE
    ticket_record RECORD;
    resolution_time INTERVAL;
BEGIN
    -- Buscar dados do ticket
    SELECT created_at, resolved_at, status 
    INTO ticket_record
    FROM tickets 
    WHERE id = ticket_id;
    
    -- Se não tem resolved_at, retornar NULL
    IF ticket_record.resolved_at IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Calcular diferença
    resolution_time := ticket_record.resolved_at - ticket_record.created_at;
    
    RETURN resolution_time;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar trigger para preencher resolved_at automaticamente
CREATE OR REPLACE FUNCTION set_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o status mudou para "Fechado" ou "Resolvido" e resolved_at é NULL
    IF NEW.status IN ('Fechado', 'Resolvido') AND NEW.resolved_at IS NULL THEN
        NEW.resolved_at := NOW();
    END IF;
    
    -- Se o status mudou de "Fechado"/"Resolvido" para outro status, limpar resolved_at
    IF OLD.status IN ('Fechado', 'Resolvido') AND NEW.status NOT IN ('Fechado', 'Resolvido') THEN
        NEW.resolved_at := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Aplicar trigger
DROP TRIGGER IF EXISTS trigger_set_resolved_at ON tickets;
CREATE TRIGGER trigger_set_resolved_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_resolved_at();

-- 5. Verificar resultados
SELECT 
    COUNT(*) as total_tickets,
    COUNT(resolved_at) as tickets_with_resolved_at,
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_resolution_hours,
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/86400) as avg_resolution_days
FROM tickets 
WHERE resolved_at IS NOT NULL;
