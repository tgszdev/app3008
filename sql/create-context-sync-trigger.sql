-- =====================================================
-- TRIGGER: Sincronizar usuários quando contexto é atualizado
-- =====================================================
-- Quando um contexto (organization/department) é renomeado,
-- atualiza automaticamente todos os usuários associados

-- 1. CRIAR FUNÇÃO QUE ATUALIZA USUÁRIOS
CREATE OR REPLACE FUNCTION sync_users_on_context_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se name ou slug mudaram
  IF (OLD.name IS DISTINCT FROM NEW.name) OR 
     (OLD.slug IS DISTINCT FROM NEW.slug) OR 
     (OLD.type IS DISTINCT FROM NEW.type) THEN
    
    -- Log da ação
    RAISE NOTICE 'Contexto atualizado: % → Sincronizando usuários...', NEW.name;
    
    -- Atualizar todos os usuários vinculados a este contexto
    UPDATE users
    SET 
      context_name = NEW.name,
      context_slug = NEW.slug,
      context_type = NEW.type,
      updated_at = NOW()
    WHERE 
      context_id = NEW.id
      AND user_type = 'context';
    
    -- Log de quantos foram atualizados
    RAISE NOTICE 'Usuários sincronizados: %', (
      SELECT COUNT(*) 
      FROM users 
      WHERE context_id = NEW.id AND user_type = 'context'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. REMOVER TRIGGER ANTIGO (SE EXISTIR)
DROP TRIGGER IF EXISTS trigger_sync_users_on_context_update ON contexts;

-- 3. CRIAR TRIGGER
CREATE TRIGGER trigger_sync_users_on_context_update
AFTER UPDATE ON contexts
FOR EACH ROW
EXECUTE FUNCTION sync_users_on_context_update();

-- 4. CRIAR FUNÇÃO PARA SINCRONIZAR TODOS (MANUTENÇÃO)
CREATE OR REPLACE FUNCTION sync_all_context_users()
RETURNS TABLE(
  user_email TEXT,
  old_name TEXT,
  new_name TEXT,
  status TEXT
) AS $$
DECLARE
  user_record RECORD;
  context_record RECORD;
  updated_count INTEGER := 0;
BEGIN
  -- Percorrer todos os usuários de contexto
  FOR user_record IN 
    SELECT id, email, context_id, context_name, context_slug
    FROM users
    WHERE user_type = 'context' AND context_id IS NOT NULL
  LOOP
    -- Buscar contexto real
    SELECT * INTO context_record
    FROM contexts
    WHERE id = user_record.context_id;
    
    IF FOUND THEN
      -- Verificar se precisa atualizar
      IF (user_record.context_name IS DISTINCT FROM context_record.name) OR
         (user_record.context_slug IS DISTINCT FROM context_record.slug) THEN
        
        -- Atualizar
        UPDATE users
        SET 
          context_name = context_record.name,
          context_slug = context_record.slug,
          context_type = context_record.type,
          updated_at = NOW()
        WHERE id = user_record.id;
        
        updated_count := updated_count + 1;
        
        RETURN QUERY SELECT 
          user_record.email,
          user_record.context_name,
          context_record.name,
          'ATUALIZADO'::TEXT;
      ELSE
        RETURN QUERY SELECT 
          user_record.email,
          user_record.context_name,
          context_record.name,
          'JÁ SINCRONIZADO'::TEXT;
      END IF;
    ELSE
      RETURN QUERY SELECT 
        user_record.email,
        user_record.context_name,
        NULL::TEXT,
        'CONTEXTO NÃO ENCONTRADO'::TEXT;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Total de usuários atualizados: %', updated_count;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- 5. VERIFICAR SE TRIGGER FOI CRIADO
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'trigger_sync_users_on_context_update';

-- 6. EXECUTAR SINCRONIZAÇÃO INICIAL
SELECT * FROM sync_all_context_users();

