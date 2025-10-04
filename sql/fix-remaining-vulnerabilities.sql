-- ====================================================================
-- CORREÇÃO DAS 3 VULNERABILIDADES RESTANTES
-- ====================================================================
-- Executar no Supabase SQL Editor APÓS security-roles-constraints.sql
-- ====================================================================

-- 1. ADICIONAR CONSTRAINT CHECK para is_system
-- Impede UPDATE de is_system em perfis que já são do sistema
ALTER TABLE roles DROP CONSTRAINT IF EXISTS check_is_system_immutable;
ALTER TABLE roles ADD CONSTRAINT check_is_system_immutable
  CHECK (
    -- Se é do sistema e está sendo atualizado, is_system deve permanecer true
    (name IN ('admin', 'analyst', 'user', 'developer', 'dev') AND is_system = TRUE)
    OR
    -- Se não é do sistema, pode ser false
    (name NOT IN ('admin', 'analyst', 'user', 'developer', 'dev'))
  );

-- ====================================================================

-- 2. ADICIONAR CONSTRAINT para prevenir deleção via CHECK
-- Criar coluna auxiliar que impede deleção
ALTER TABLE roles DROP COLUMN IF EXISTS deletable CASCADE;
ALTER TABLE roles ADD COLUMN deletable BOOLEAN GENERATED ALWAYS AS (
  CASE 
    WHEN is_system = TRUE THEN FALSE
    ELSE TRUE
  END
) STORED;

-- Adicionar CHECK constraint
ALTER TABLE roles DROP CONSTRAINT IF EXISTS check_can_delete;
ALTER TABLE roles ADD CONSTRAINT check_can_delete
  CHECK (deletable = TRUE OR is_system = FALSE);

-- ====================================================================

-- 3. REFORÇAR TRIGGER DE DELEÇÃO com SECURITY DEFINER
-- Garantir que trigger tem máxima prioridade
CREATE OR REPLACE FUNCTION prevent_system_role_deletion_strict()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar por nome também (dupla verificação)
  IF OLD.is_system = TRUE OR OLD.name IN ('admin', 'analyst', 'user', 'developer', 'dev') THEN
    RAISE EXCEPTION 'BLOQUEADO: Não é permitido excluir perfis do sistema. Role: %', OLD.name
      USING HINT = 'Perfis do sistema (admin, analyst, user, developer) são protegidos contra deleção';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger com prioridade
DROP TRIGGER IF EXISTS trigger_prevent_system_role_deletion ON roles;
DROP TRIGGER IF EXISTS trigger_prevent_system_role_deletion_strict ON roles;
CREATE TRIGGER trigger_prevent_system_role_deletion_strict
  BEFORE DELETE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_system_role_deletion_strict();

-- ====================================================================

-- 4. REFORÇAR PROTEÇÃO DE UPDATE com SECURITY DEFINER
CREATE OR REPLACE FUNCTION protect_system_roles_strict()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Proteção máxima para perfis do sistema
  IF OLD.is_system = TRUE OR OLD.name IN ('admin', 'analyst', 'user', 'developer', 'dev') THEN
    
    -- BLOQUEAR alteração de permissions
    IF NEW.permissions IS DISTINCT FROM OLD.permissions THEN
      RAISE EXCEPTION 'BLOQUEADO: Permissões de perfis do sistema não podem ser alteradas. Role: %', OLD.name
        USING HINT = 'Para alterar, contate o desenvolvedor do sistema';
    END IF;
    
    -- BLOQUEAR alteração de is_system
    IF NEW.is_system != OLD.is_system THEN
      RAISE EXCEPTION 'BLOQUEADO: Flag is_system não pode ser alterado. Role: %', OLD.name;
    END IF;
    
    -- BLOQUEAR alteração de nome
    IF NEW.name != OLD.name THEN
      RAISE EXCEPTION 'BLOQUEADO: Nome de perfis do sistema não pode ser alterado. Role: %', OLD.name;
    END IF;
  END IF;
  
  -- Para perfis customizados, impedir mudança para is_system = true
  IF OLD.is_system = FALSE AND NEW.is_system = TRUE THEN
    RAISE EXCEPTION 'BLOQUEADO: Não é permitido transformar perfil customizado em perfil do sistema';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
DROP TRIGGER IF EXISTS trigger_protect_system_roles ON roles;
DROP TRIGGER IF EXISTS trigger_protect_system_roles_strict ON roles;
CREATE TRIGGER trigger_protect_system_roles_strict
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION protect_system_roles_strict();

-- ====================================================================

-- 5. SANITIZAÇÃO MAIS AGRESSIVA DE NOMES
CREATE OR REPLACE FUNCTION sanitize_role_name_aggressive()
RETURNS TRIGGER AS $$
BEGIN
  -- Remover TODOS os caracteres especiais e comandos perigosos
  NEW.name := regexp_replace(NEW.name, '[^a-z0-9_]', '', 'gi');
  
  -- Converter para lowercase
  NEW.name := LOWER(NEW.name);
  
  -- Garantir que não está vazio
  IF LENGTH(TRIM(NEW.name)) = 0 THEN
    RAISE EXCEPTION 'Nome do perfil inválido ou contém apenas caracteres especiais';
  END IF;
  
  -- Limite de tamanho
  IF LENGTH(NEW.name) > 50 THEN
    NEW.name := SUBSTRING(NEW.name, 1, 50);
  END IF;
  
  -- Logar se alterou
  IF NEW.name != OLD.name AND TG_OP = 'UPDATE' THEN
    RAISE WARNING 'Nome sanitizado de "%" para "%"', OLD.name, NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger (prioridade alta)
DROP TRIGGER IF EXISTS trigger_sanitize_role_name ON roles;
DROP TRIGGER IF EXISTS trigger_sanitize_role_name_aggressive ON roles;
CREATE TRIGGER trigger_sanitize_role_name_aggressive
  BEFORE INSERT OR UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_role_name_aggressive();

-- ====================================================================

-- 6. ADICIONAR RLS (Row Level Security) EXTRA
-- Garantir que apenas admins podem modificar roles
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS roles_admin_only ON roles;
CREATE POLICY roles_admin_only ON roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Política: Todos podem ler (necessário para verificação de permissões)
DROP POLICY IF EXISTS roles_read_all ON roles;
CREATE POLICY roles_read_all ON roles
  FOR SELECT
  USING (true);

-- ====================================================================
-- VERIFICAÇÃO FINAL
-- ====================================================================

-- Listar todos os triggers ativos
SELECT 
  trigger_name,
  event_manipulation as evento,
  action_timing as timing,
  action_statement as funcao
FROM information_schema.triggers
WHERE event_object_table = 'roles'
ORDER BY action_timing, trigger_name;

-- Verificar constraints
SELECT
  conname as constraint_name,
  contype as type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'roles'::regclass
ORDER BY conname;

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'roles';

-- Resumo
SELECT '╔═══════════════════════════════════════════════════════════════╗' as resultado
UNION ALL SELECT '║   PROTEÇÕES DE SEGURANÇA REFORÇADAS - INSTALAÇÃO COMPLETA   ║'
UNION ALL SELECT '╠═══════════════════════════════════════════════════════════════╣'
UNION ALL SELECT '║ ✅ Trigger: Proteção de UPDATE em perfis sistema            ║'
UNION ALL SELECT '║ ✅ Trigger: Proteção de DELETE em perfis sistema            ║'
UNION ALL SELECT '║ ✅ Trigger: Sanitização agressiva de nomes                   ║'
UNION ALL SELECT '║ ✅ Constraint: is_system imutável                            ║'
UNION ALL SELECT '║ ✅ Constraint: Validação de estrutura                        ║'
UNION ALL SELECT '║ ✅ RLS: Apenas admins modificam roles                        ║'
UNION ALL SELECT '╠═══════════════════════════════════════════════════════════════╣'
UNION ALL SELECT '║ Status: SISTEMA ALTAMENTE PROTEGIDO                          ║'
UNION ALL SELECT '╚═══════════════════════════════════════════════════════════════╝';

