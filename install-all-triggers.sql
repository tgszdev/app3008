-- =====================================================================
-- INSTALAÇÃO COMPLETA DE TRIGGERS - SISTEMA MULTI-TENANT
-- =====================================================================
-- Execute este arquivo COMPLETO no SQL Editor do Supabase Dashboard
-- URL: https://supabase.com/dashboard → Seu Projeto → SQL Editor
-- =====================================================================

-- =====================================================================
-- TRIGGER 1: Sincronizar quando CONTEXTO é RENOMEADO
-- =====================================================================

CREATE OR REPLACE FUNCTION sync_users_on_context_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET 
    context_name = NEW.name::VARCHAR(255),
    context_slug = NEW.slug::VARCHAR(255),
    context_type = NEW.type::VARCHAR(50),
    updated_at = NOW()
  WHERE context_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_users_on_context_update ON contexts;

CREATE TRIGGER trigger_sync_users_on_context_update
AFTER UPDATE ON contexts
FOR EACH ROW
WHEN (OLD.name IS DISTINCT FROM NEW.name OR 
      OLD.slug IS DISTINCT FROM NEW.slug OR
      OLD.type IS DISTINCT FROM NEW.type)
EXECUTE FUNCTION sync_users_on_context_update();

-- =====================================================================
-- TRIGGER 2: Sincronizar quando ASSOCIAÇÃO é CRIADA (INSERT)
-- =====================================================================

CREATE OR REPLACE FUNCTION sync_user_on_context_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_context_name VARCHAR(255);
  v_context_slug VARCHAR(255);
  v_context_type VARCHAR(50);
BEGIN
  -- Buscar dados do contexto
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_user_on_context_insert ON user_contexts;

CREATE TRIGGER trigger_sync_user_on_context_insert
AFTER INSERT ON user_contexts
FOR EACH ROW
EXECUTE FUNCTION sync_user_on_context_insert();

-- =====================================================================
-- TRIGGER 3: Sincronizar quando ASSOCIAÇÃO é REMOVIDA (DELETE)
-- =====================================================================

CREATE OR REPLACE FUNCTION sync_user_on_context_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_remaining_count INTEGER;
  v_first_context_id UUID;
  v_context_name VARCHAR(255);
  v_context_slug VARCHAR(255);
  v_context_type VARCHAR(50);
BEGIN
  -- Contar associações restantes
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_user_on_context_delete ON user_contexts;

CREATE TRIGGER trigger_sync_user_on_context_delete
AFTER DELETE ON user_contexts
FOR EACH ROW
EXECUTE FUNCTION sync_user_on_context_delete();

-- =====================================================================
-- VALIDAÇÃO DOS TRIGGERS INSTALADOS
-- =====================================================================

SELECT 
  t.tgname AS trigger_name,
  c.relname AS table_name,
  p.proname AS function_name,
  CASE t.tgenabled
    WHEN 'O' THEN 'Ativo'
    WHEN 'D' THEN 'Desabilitado'
    ELSE 'Outro'
  END AS status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
  AND t.tgname LIKE 'trigger_sync%'
ORDER BY c.relname, t.tgname;

-- =====================================================================
-- RESULTADO ESPERADO:
-- =====================================================================
-- trigger_sync_user_on_context_delete  | user_contexts | sync_user_on_context_delete  | Ativo
-- trigger_sync_user_on_context_insert  | user_contexts | sync_user_on_context_insert  | Ativo
-- trigger_sync_users_on_context_update | contexts      | sync_users_on_context_update | Ativo
-- =====================================================================

-- =====================================================================
-- TESTE MANUAL (Opcional - Descomentar para testar)
-- =====================================================================
/*
-- 1. Criar usuário de teste
INSERT INTO users (email, name, user_type, is_active)
VALUES ('teste-trigger@test.com', 'Teste Trigger', 'context', true)
RETURNING id;
-- Anotar o ID retornado

-- 2. Buscar um context_id válido
SELECT id, name FROM contexts WHERE is_active = true LIMIT 1;
-- Anotar o ID

-- 3. Criar associação (deve sincronizar automaticamente)
INSERT INTO user_contexts (user_id, context_id)
VALUES ('USER_ID_DO_PASSO_1', 'CONTEXT_ID_DO_PASSO_2');

-- 4. Verificar se users table foi atualizada
SELECT id, email, context_id, context_name, context_slug
FROM users 
WHERE id = 'USER_ID_DO_PASSO_1';
-- Deve mostrar context_id, context_name, context_slug preenchidos!

-- 5. Deletar associação (deve limpar automaticamente)
DELETE FROM user_contexts 
WHERE user_id = 'USER_ID_DO_PASSO_1';

-- 6. Verificar se users table foi limpa
SELECT id, email, context_id, context_name, context_slug
FROM users 
WHERE id = 'USER_ID_DO_PASSO_1';
-- Deve mostrar context_id = NULL, context_name = NULL, context_slug = NULL!

-- 7. Limpar usuário de teste
DELETE FROM users WHERE id = 'USER_ID_DO_PASSO_1';
*/

