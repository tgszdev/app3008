-- =====================================================================
-- TRIGGERS PARA SINCRONIZAÇÃO AUTOMÁTICA user_contexts <-> users
-- =====================================================================
-- Este arquivo cria triggers para garantir sincronização mesmo quando
-- operações são feitas diretamente no banco (bypassing API)
-- =====================================================================

-- 1. Função para sincronizar APÓS INSERT em user_contexts
CREATE OR REPLACE FUNCTION sync_user_on_context_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Buscar dados do contexto
  DECLARE
    v_context_name VARCHAR(255);
    v_context_slug VARCHAR(255);
    v_context_type VARCHAR(50);
  BEGIN
    SELECT name, slug, type 
    INTO v_context_name, v_context_slug, v_context_type
    FROM contexts 
    WHERE id = NEW.context_id;
    
    -- Atualizar users table
    UPDATE users
    SET 
      context_id = NEW.context_id,
      context_name = v_context_name,
      context_slug = v_context_slug,
      context_type = v_context_type,
      updated_at = NOW()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para INSERT
DROP TRIGGER IF EXISTS trigger_sync_user_on_context_insert ON user_contexts;

CREATE TRIGGER trigger_sync_user_on_context_insert
AFTER INSERT ON user_contexts
FOR EACH ROW
EXECUTE FUNCTION sync_user_on_context_insert();

-- =====================================================================

-- 2. Função para sincronizar APÓS DELETE em user_contexts
CREATE OR REPLACE FUNCTION sync_user_on_context_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se o usuário ainda tem outras associações
  DECLARE
    v_remaining_count INTEGER;
    v_first_context_id UUID;
    v_context_name VARCHAR(255);
    v_context_slug VARCHAR(255);
    v_context_type VARCHAR(50);
  BEGIN
    SELECT COUNT(*) 
    INTO v_remaining_count
    FROM user_contexts 
    WHERE user_id = OLD.user_id;
    
    IF v_remaining_count = 0 THEN
      -- Sem mais associações: limpar users table
      UPDATE users
      SET 
        context_id = NULL,
        context_name = NULL,
        context_slug = NULL,
        context_type = NULL,
        updated_at = NOW()
      WHERE id = OLD.user_id;
    ELSE
      -- Ainda tem associações: usar a primeira (mais recente)
      SELECT context_id 
      INTO v_first_context_id
      FROM user_contexts 
      WHERE user_id = OLD.user_id 
      ORDER BY created_at DESC 
      LIMIT 1;
      
      -- Buscar dados do contexto
      SELECT name, slug, type 
      INTO v_context_name, v_context_slug, v_context_type
      FROM contexts 
      WHERE id = v_first_context_id;
      
      -- Atualizar users table
      UPDATE users
      SET 
        context_id = v_first_context_id,
        context_name = v_context_name,
        context_slug = v_context_slug,
        context_type = v_context_type,
        updated_at = NOW()
      WHERE id = OLD.user_id;
    END IF;
    
    RETURN OLD;
  END;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para DELETE
DROP TRIGGER IF EXISTS trigger_sync_user_on_context_delete ON user_contexts;

CREATE TRIGGER trigger_sync_user_on_context_delete
AFTER DELETE ON user_contexts
FOR EACH ROW
EXECUTE FUNCTION sync_user_on_context_delete();

-- =====================================================================
-- VALIDAÇÃO
-- =====================================================================

-- Listar triggers criados
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  proname AS function_name,
  tgenabled AS enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'user_contexts'::regclass
  AND tgname LIKE 'trigger_sync_user%'
ORDER BY tgname;

-- Teste rápido (comentado - descomentar para testar)
/*
-- Buscar um usuário para teste
SELECT id, email, context_id, context_name FROM users WHERE email LIKE '%agro%' LIMIT 1;

-- Testar INSERT (substitua os IDs)
INSERT INTO user_contexts (user_id, context_id) 
VALUES ('USER_ID_AQUI', 'CONTEXT_ID_AQUI');

-- Verificar sincronização
SELECT id, email, context_id, context_name, context_slug FROM users WHERE id = 'USER_ID_AQUI';

-- Testar DELETE
DELETE FROM user_contexts WHERE user_id = 'USER_ID_AQUI' AND context_id = 'CONTEXT_ID_AQUI';

-- Verificar limpeza
SELECT id, email, context_id, context_name, context_slug FROM users WHERE id = 'USER_ID_AQUI';
*/

