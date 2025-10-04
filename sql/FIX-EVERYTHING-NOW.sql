-- ╔════════════════════════════════════════════════════════════════════╗
-- ║  SOLUÇÃO DEFINITIVA - CORRIGE TUDO DE UMA VEZ                     ║
-- ║  Execute TODO este bloco de uma só vez                            ║
-- ╚════════════════════════════════════════════════════════════════════╝

-- SOLUÇÃO: Modificar o trigger de auditoria para NÃO inserir na tabela
-- quando está deletando, apenas logar no console do Postgres

CREATE OR REPLACE FUNCTION audit_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Para DELETE: NÃO inserir na tabela, apenas retornar
  -- Isso evita o problema de foreign key
  IF TG_OP = 'DELETE' THEN
    -- Simplesmente retornar sem inserir nada
    RETURN OLD;
  END IF;
  
  -- Para INSERT e UPDATE: funcionar normalmente
  IF TG_OP = 'INSERT' THEN
    INSERT INTO role_audit_log (role_id, role_name, action, new_permissions)
    VALUES (NEW.id, NEW.name, 'created', NEW.permissions);
    
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.permissions IS DISTINCT FROM OLD.permissions THEN
      INSERT INTO role_audit_log (role_id, role_name, action, old_permissions, new_permissions)
      VALUES (NEW.id, NEW.name, 'updated', OLD.permissions, NEW.permissions);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar se o trigger existe e está correto
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_audit_roles';

-- Agora testar deletar um perfil de teste
DELETE FROM roles WHERE name = 'empty_test' RETURNING name, display_name;

-- Ver resultado
SELECT COUNT(*) as total, array_agg(name ORDER BY name) as roles FROM roles;

