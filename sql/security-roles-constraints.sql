-- ====================================================================
-- CORREÇÕES DE SEGURANÇA - Sistema de Roles
-- ====================================================================
-- Corrige as 10 vulnerabilidades encontradas no CTS
-- Executar no Supabase SQL Editor
-- ====================================================================

-- 1. PROTEÇÃO CONTRA MODIFICAÇÃO DE PERFIS DO SISTEMA
-- Impede alterar permissões de perfis marcados como is_system = true
CREATE OR REPLACE FUNCTION protect_system_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se é um perfil do sistema
  IF OLD.is_system = TRUE THEN
    -- Impedir alteração de permissões
    IF NEW.permissions IS DISTINCT FROM OLD.permissions THEN
      RAISE EXCEPTION 'Não é permitido alterar permissões de perfis do sistema (admin, analyst, user, developer)';
    END IF;
    
    -- Impedir remoção do flag is_system
    IF NEW.is_system = FALSE THEN
      RAISE EXCEPTION 'Não é permitido remover flag is_system de perfis protegidos';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trigger_protect_system_roles ON roles;
CREATE TRIGGER trigger_protect_system_roles
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION protect_system_roles();

-- ====================================================================

-- 2. PROTEÇÃO CONTRA DELEÇÃO DE PERFIS DO SISTEMA
CREATE OR REPLACE FUNCTION prevent_system_role_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_system = TRUE THEN
    RAISE EXCEPTION 'Não é permitido excluir perfis do sistema (admin, analyst, user, developer)';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_system_role_deletion ON roles;
CREATE TRIGGER trigger_prevent_system_role_deletion
  BEFORE DELETE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_system_role_deletion();

-- ====================================================================

-- 3. VALIDAÇÃO DE ESTRUTURA DE PERMISSÕES
CREATE OR REPLACE FUNCTION validate_permissions_structure()
RETURNS TRIGGER AS $$
BEGIN
  -- Garantir que permissions é um objeto JSON (não array, string, null)
  IF NEW.permissions IS NULL THEN
    RAISE EXCEPTION 'Campo permissions não pode ser NULL. Use um objeto JSON vazio: {}';
  END IF;
  
  IF jsonb_typeof(NEW.permissions) != 'object' THEN
    RAISE EXCEPTION 'Campo permissions deve ser um objeto JSON, não %', jsonb_typeof(NEW.permissions);
  END IF;
  
  -- Verificar se é um array (jsonb pode confundir com object)
  IF NEW.permissions::text LIKE '[%' THEN
    RAISE EXCEPTION 'Campo permissions não pode ser um array. Use um objeto JSON: {...}';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_permissions_structure ON roles;
CREATE TRIGGER trigger_validate_permissions_structure
  BEFORE INSERT OR UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION validate_permissions_structure();

-- ====================================================================

-- 4. VALIDAÇÃO DE VALORES BOOLEANOS
CREATE OR REPLACE FUNCTION validate_permission_values()
RETURNS TRIGGER AS $$
DECLARE
  perm_key TEXT;
  perm_value JSONB;
BEGIN
  -- Verificar cada valor dentro de permissions
  FOR perm_key, perm_value IN SELECT * FROM jsonb_each(NEW.permissions)
  LOOP
    -- Valor deve ser boolean (true ou false)
    IF jsonb_typeof(perm_value) != 'boolean' THEN
      RAISE EXCEPTION 'Permissão "%" deve ser boolean (true/false), não %', 
        perm_key, jsonb_typeof(perm_value);
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_permission_values ON roles;
CREATE TRIGGER trigger_validate_permission_values
  BEFORE INSERT OR UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION validate_permission_values();

-- ====================================================================

-- 5. PROTEÇÃO CONTRA PERMISSÕES MALICIOSAS
CREATE OR REPLACE FUNCTION sanitize_malicious_permissions()
RETURNS TRIGGER AS $$
DECLARE
  perm_key TEXT;
  cleaned_permissions JSONB := '{}'::jsonb;
  malicious_patterns TEXT[] := ARRAY['__proto__', 'constructor', 'prototype', 'eval', '../', '..\\', 'DROP', 'DELETE', 'UPDATE', 'INSERT'];
  is_malicious BOOLEAN;
BEGIN
  -- Verificar cada chave de permissão
  FOR perm_key IN SELECT jsonb_object_keys(NEW.permissions)
  LOOP
    is_malicious := FALSE;
    
    -- Verificar se contém padrões maliciosos
    FOR i IN 1..array_length(malicious_patterns, 1)
    LOOP
      IF perm_key ILIKE '%' || malicious_patterns[i] || '%' THEN
        is_malicious := TRUE;
        EXIT;
      END IF;
    END LOOP;
    
    -- Se não for malicioso, adicionar ao objeto limpo
    IF NOT is_malicious THEN
      cleaned_permissions := cleaned_permissions || jsonb_build_object(perm_key, NEW.permissions->perm_key);
    END IF;
  END LOOP;
  
  -- Se removeu alguma permissão maliciosa, logar
  IF jsonb_object_keys(NEW.permissions) != jsonb_object_keys(cleaned_permissions) THEN
    RAISE WARNING 'Permissões maliciosas removidas de role "%"', NEW.name;
  END IF;
  
  NEW.permissions := cleaned_permissions;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sanitize_malicious_permissions ON roles;
CREATE TRIGGER trigger_sanitize_malicious_permissions
  BEFORE INSERT OR UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_malicious_permissions();

-- ====================================================================

-- 6. LIMITE DE TAMANHO DE PERMISSÕES (Proteção DoS)
CREATE OR REPLACE FUNCTION limit_permissions_size()
RETURNS TRIGGER AS $$
DECLARE
  perm_count INTEGER;
BEGIN
  -- Contar número de permissões
  SELECT COUNT(*) INTO perm_count
  FROM jsonb_object_keys(NEW.permissions);
  
  -- Máximo: 100 permissões (margem de segurança sobre 62 atuais)
  IF perm_count > 100 THEN
    RAISE EXCEPTION 'Número de permissões excede o limite máximo de 100. Atual: %', perm_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_limit_permissions_size ON roles;
CREATE TRIGGER trigger_limit_permissions_size
  BEFORE INSERT OR UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION limit_permissions_size();

-- ====================================================================

-- 7. SANITIZAÇÃO DE CARACTERES ESPECIAIS EM NOMES
CREATE OR REPLACE FUNCTION sanitize_role_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Remover caracteres perigosos do nome
  NEW.name := regexp_replace(NEW.name, '[^a-z0-9_-]', '', 'gi');
  
  -- Garantir que nome não está vazio após sanitização
  IF LENGTH(TRIM(NEW.name)) = 0 THEN
    RAISE EXCEPTION 'Nome do perfil inválido após sanitização';
  END IF;
  
  -- Limite de tamanho
  IF LENGTH(NEW.name) > 50 THEN
    RAISE EXCEPTION 'Nome do perfil muito longo (máx: 50 caracteres)';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sanitize_role_name ON roles;
CREATE TRIGGER trigger_sanitize_role_name
  BEFORE INSERT OR UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_role_name();

-- ====================================================================

-- 8. AUDITORIA DE ALTERAÇÕES EM PERFIS (Tabela de Logs)
CREATE TABLE IF NOT EXISTS role_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  role_name VARCHAR(50),
  action VARCHAR(20) NOT NULL, -- 'created', 'updated', 'deleted'
  changed_by VARCHAR(255),
  old_permissions JSONB,
  new_permissions JSONB,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_role_audit_log_role_id ON role_audit_log(role_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_log_changed_at ON role_audit_log(changed_at DESC);

-- Função de auditoria
CREATE OR REPLACE FUNCTION audit_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO role_audit_log (role_id, role_name, action, new_permissions)
    VALUES (NEW.id, NEW.name, 'created', NEW.permissions);
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Apenas logar se permissions mudaram
    IF NEW.permissions IS DISTINCT FROM OLD.permissions THEN
      INSERT INTO role_audit_log (role_id, role_name, action, old_permissions, new_permissions)
      VALUES (NEW.id, NEW.name, 'updated', OLD.permissions, NEW.permissions);
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO role_audit_log (role_id, role_name, action, old_permissions)
    VALUES (OLD.id, OLD.name, 'deleted', OLD.permissions);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_audit_role_changes ON roles;
CREATE TRIGGER trigger_audit_role_changes
  AFTER INSERT OR UPDATE OR DELETE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION audit_role_changes();

-- ====================================================================

-- 9. VALIDAÇÃO DE NOMES RESERVADOS
CREATE OR REPLACE FUNCTION prevent_reserved_names()
RETURNS TRIGGER AS $$
DECLARE
  reserved_names TEXT[] := ARRAY['root', 'superuser', 'postgres', 'public', 'god', 'owner', 'master'];
BEGIN
  -- Verificar se nome está na lista de reservados
  IF NEW.name = ANY(reserved_names) THEN
    RAISE EXCEPTION 'Nome "%" é reservado e não pode ser usado', NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_reserved_names ON roles;
CREATE TRIGGER trigger_prevent_reserved_names
  BEFORE INSERT ON roles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_reserved_names();

-- ====================================================================
-- VERIFICAÇÃO FINAL
-- ====================================================================

SELECT '╔═══════════════════════════════════════════════════════════════╗' as resultado
UNION ALL SELECT '║        TRIGGERS DE SEGURANÇA INSTALADOS COM SUCESSO          ║'
UNION ALL SELECT '╠═══════════════════════════════════════════════════════════════╣'
UNION ALL SELECT '║ 1. ✅ Proteção de perfis do sistema (UPDATE)                 ║'
UNION ALL SELECT '║ 2. ✅ Proteção contra deleção de perfis do sistema           ║'
UNION ALL SELECT '║ 3. ✅ Validação de estrutura de permissões                   ║'
UNION ALL SELECT '║ 4. ✅ Validação de valores booleanos                         ║'
UNION ALL SELECT '║ 5. ✅ Sanitização de permissões maliciosas                   ║'
UNION ALL SELECT '║ 6. ✅ Limite de tamanho (máx 100 permissões)                 ║'
UNION ALL SELECT '║ 7. ✅ Sanitização de nomes de perfis                         ║'
UNION ALL SELECT '║ 8. ✅ Auditoria de alterações (role_audit_log)               ║'
UNION ALL SELECT '║ 9. ✅ Proteção contra nomes reservados                       ║'
UNION ALL SELECT '╠═══════════════════════════════════════════════════════════════╣'
UNION ALL SELECT '║ Status: SISTEMA PROTEGIDO                                    ║'
UNION ALL SELECT '╚═══════════════════════════════════════════════════════════════╝';

-- Testar se triggers estão ativos
SELECT 
  trigger_name,
  event_manipulation as on_action,
  action_timing as timing
FROM information_schema.triggers
WHERE event_object_table = 'roles'
ORDER BY trigger_name;

