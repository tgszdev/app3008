-- =====================================================================
-- CONSTRAINT: Usuários 'context' podem ter apenas 1 associação
-- =====================================================================
-- Este script cria uma constraint check para garantir que usuários
-- do tipo 'context' não possam ter mais de 1 associação ativa
-- =====================================================================

-- Primeiro, criar uma função que valida a constraint
CREATE OR REPLACE FUNCTION check_context_user_single_association()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type VARCHAR(50);
  v_association_count INTEGER;
BEGIN
  -- Buscar o tipo do usuário
  SELECT user_type INTO v_user_type
  FROM users
  WHERE id = NEW.user_id;
  
  -- Se é usuário context, verificar quantidade de associações
  IF v_user_type = 'context' THEN
    SELECT COUNT(*) INTO v_association_count
    FROM user_contexts
    WHERE user_id = NEW.user_id;
    
    -- Se já tem 1 ou mais associações, bloquear
    IF v_association_count >= 1 THEN
      RAISE EXCEPTION 'Usuário de cliente único não pode ter mais de 1 associação. Remova a associação existente primeiro.'
        USING ERRCODE = '23514'; -- check_violation
    END IF;
  END IF;
  
  -- Se é matrix ou passou na validação, permitir
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger BEFORE INSERT para validar
DROP TRIGGER IF EXISTS trigger_check_context_single_association ON user_contexts;

CREATE TRIGGER trigger_check_context_single_association
BEFORE INSERT ON user_contexts
FOR EACH ROW
EXECUTE FUNCTION check_context_user_single_association();

-- =====================================================================
-- VALIDAÇÃO
-- =====================================================================

SELECT 
  t.tgname AS trigger_name,
  c.relname AS table_name,
  p.proname AS function_name,
  CASE t.tgenabled
    WHEN 'O' THEN 'Ativo'
    WHEN 'D' THEN 'Desabilitado'
  END AS status,
  pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'user_contexts'
  AND t.tgname = 'trigger_check_context_single_association'
ORDER BY t.tgname;

-- =====================================================================
-- TESTE MANUAL (Opcional - Descomentar para testar)
-- =====================================================================
/*
-- 1. Buscar um usuário context que já tem associação
SELECT u.id, u.email, u.user_type, COUNT(uc.id) as associations
FROM users u
LEFT JOIN user_contexts uc ON uc.user_id = u.id
WHERE u.user_type = 'context'
GROUP BY u.id, u.email, u.user_type
HAVING COUNT(uc.id) = 1
LIMIT 1;
-- Anotar o user_id

-- 2. Buscar um context_id diferente
SELECT id, name FROM contexts WHERE is_active = true LIMIT 2;
-- Anotar um ID diferente do que o usuário já tem

-- 3. Tentar criar segunda associação (DEVE FALHAR!)
INSERT INTO user_contexts (user_id, context_id)
VALUES ('USER_ID_DO_PASSO_1', 'CONTEXT_ID_DIFERENTE');
-- Deve retornar erro: "Usuário de cliente único não pode ter mais de 1 associação"

-- 4. Verificar que usuário ainda tem apenas 1 associação
SELECT COUNT(*) FROM user_contexts WHERE user_id = 'USER_ID_DO_PASSO_1';
-- Deve retornar: 1
*/

-- =====================================================================
-- RESULTADO ESPERADO
-- =====================================================================
-- ✅ Trigger instalado e ativo
-- ✅ Tentativa de criar segunda associação é BLOQUEADA
-- ✅ Mensagem de erro clara é exibida
-- ✅ Usuário context mantém APENAS 1 associação
-- =====================================================================

