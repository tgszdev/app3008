-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  CRIAR PERFIS DE SISTEMA - SEM TRIGGERS                           ║
-- ╚════════════════════════════════════════════════════════════════════╝

-- 1. Desabilitar trigger problemático
DROP TRIGGER IF EXISTS trigger_sanitize_malicious_permissions ON roles;

-- 2. Inserir/atualizar perfis de sistema
INSERT INTO roles (name, display_name, description, permissions, is_system)
VALUES 
  ('admin', 'Administrador', 'Acesso total ao sistema', '{"tickets_view": true, "tickets_create": true}', true),
  ('dev', 'Desenvolvedor', 'Desenvolvimento e correções', '{"tickets_view": true, "tickets_create": true}', true),
  ('analyst', 'Analista', 'Gerenciamento de tickets', '{"tickets_view": true, "tickets_create": true}', true),
  ('user', 'Usuário', 'Acesso básico', '{"tickets_view": true, "tickets_create": true}', true)
ON CONFLICT (name) DO UPDATE
SET 
  is_system = EXCLUDED.is_system,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- 3. Recriar trigger (sem a comparação problemática)
CREATE OR REPLACE FUNCTION sanitize_malicious_permissions()
RETURNS TRIGGER AS $$
DECLARE
  perm_key TEXT;
  cleaned_permissions JSONB := NEW.permissions;
BEGIN
  -- Remover chaves maliciosas
  FOR perm_key IN SELECT jsonb_object_keys(NEW.permissions)
  LOOP
    IF perm_key IN ('__proto__', 'constructor', 'prototype') THEN
      cleaned_permissions := cleaned_permissions - perm_key;
    END IF;
  END LOOP;
  
  -- Aplicar limpeza
  NEW.permissions := cleaned_permissions;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sanitize_malicious_permissions
  BEFORE INSERT OR UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_malicious_permissions();

-- 4. Ver resultado
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_system = true) as system_roles,
  COUNT(*) FILTER (WHERE is_system = false) as custom_roles,
  array_agg(name ORDER BY name) as all_roles
FROM roles;

-- 5. Listar todos os perfis
SELECT name, display_name, is_system FROM roles ORDER BY name;

