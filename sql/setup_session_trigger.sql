
-- ================================================
-- Script de Configuração de Sessão Única
-- ================================================


-- Adicionar coluna invalidated_at se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' 
    AND column_name = 'invalidated_at'
  ) THEN
    ALTER TABLE sessions 
    ADD COLUMN invalidated_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Adicionar coluna invalidated_reason se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' 
    AND column_name = 'invalidated_reason'
  ) THEN
    ALTER TABLE sessions 
    ADD COLUMN invalidated_reason TEXT;
  END IF;
END $$;



CREATE OR REPLACE FUNCTION invalidate_old_sessions()
RETURNS TRIGGER AS $$
BEGIN
  -- Log para debug
  RAISE NOTICE 'Invalidating old sessions for user: %', NEW."userId";
  
  -- Invalida todas as sessões antigas do mesmo usuário
  UPDATE sessions 
  SET 
    expires = CURRENT_TIMESTAMP - INTERVAL '1 second',
    invalidated_at = CURRENT_TIMESTAMP,
    invalidated_reason = 'new_login_detected'
  WHERE 
    "userId" = NEW."userId"
    AND "sessionToken" != NEW."sessionToken"
    AND expires > CURRENT_TIMESTAMP;
  
  -- Retorna o novo registro
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;



-- Remove trigger se existir
DROP TRIGGER IF EXISTS on_new_session ON sessions;

-- Cria novo trigger
CREATE TRIGGER on_new_session
AFTER INSERT ON sessions
FOR EACH ROW
EXECUTE FUNCTION invalidate_old_sessions();


-- Verificar resultado

-- Verificar se as colunas foram adicionadas
SELECT 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  table_name = 'sessions' 
  AND column_name IN ('invalidated_at', 'invalidated_reason');

