-- ================================================
-- SCRIPT SIMPLIFICADO - TABELA DE HISTÓRICO DE TICKETS
-- ================================================

-- 1. Primeiro, vamos verificar se a tabela já existe e removê-la se necessário
DROP TABLE IF EXISTS ticket_history CASCADE;

-- 2. Criar tabela de histórico de tickets
CREATE TABLE ticket_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  field_changed VARCHAR(50),
  old_value TEXT,
  new_value TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Adicionar foreign keys separadamente
ALTER TABLE ticket_history 
ADD CONSTRAINT fk_ticket_history_ticket_id 
FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE;

ALTER TABLE ticket_history 
ADD CONSTRAINT fk_ticket_history_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 4. Criar índices para performance
CREATE INDEX idx_ticket_history_ticket_id ON ticket_history (ticket_id);
CREATE INDEX idx_ticket_history_user_id ON ticket_history (user_id);
CREATE INDEX idx_ticket_history_action_type ON ticket_history (action_type);
CREATE INDEX idx_ticket_history_created_at ON ticket_history (created_at);
CREATE INDEX idx_ticket_history_field_changed ON ticket_history (field_changed);

-- 5. Habilitar RLS
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;

-- 6. Política para visualização
CREATE POLICY "Users can view ticket history" ON ticket_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tickets t 
    WHERE t.id = ticket_history.ticket_id
    AND (
      -- Admins, devs e analysts podem ver todos os históricos
      auth.jwt() ->> 'role' IN ('admin', 'analyst', 'dev')
      OR
      -- Users podem ver histórico de seus próprios tickets
      (t.created_by = (auth.jwt() ->> 'sub')::uuid)
      OR
      -- Usuários atribuídos podem ver o histórico
      (t.assigned_to = (auth.jwt() ->> 'sub')::uuid)
    )
  )
);

-- 7. Política para inserção (apenas service role)
CREATE POLICY "System can insert ticket history" ON ticket_history
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- 8. Função para registrar mudanças nos tickets
CREATE OR REPLACE FUNCTION log_ticket_changes()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  old_user_name TEXT;
  new_user_name TEXT;
BEGIN
  -- Tentar obter o user_id do contexto da aplicação
  BEGIN
    current_user_id := current_setting('app.current_user_id', true)::uuid;
  EXCEPTION WHEN OTHERS THEN
    current_user_id := COALESCE(NEW.updated_by, NEW.created_by);
  END;

  -- Se ainda não temos user_id, usar o updated_by ou created_by
  IF current_user_id IS NULL THEN
    current_user_id := COALESCE(NEW.updated_by, NEW.created_by);
  END IF;

  -- Registrar mudança de status
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO ticket_history (
      ticket_id, user_id, action_type, field_changed, 
      old_value, new_value, description
    ) VALUES (
      NEW.id,
      current_user_id,
      'status_changed',
      'status',
      OLD.status,
      NEW.status,
      format('Status alterado de "%s" para "%s"', OLD.status, NEW.status)
    );
  END IF;

  -- Registrar mudança de prioridade
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO ticket_history (
      ticket_id, user_id, action_type, field_changed, 
      old_value, new_value, description
    ) VALUES (
      NEW.id,
      current_user_id,
      'priority_changed',
      'priority',
      OLD.priority,
      NEW.priority,
      format('Prioridade alterada de "%s" para "%s"', OLD.priority, NEW.priority)
    );
  END IF;

  -- Registrar mudança de responsável
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    -- Buscar nomes dos usuários para descrição mais amigável
    IF OLD.assigned_to IS NOT NULL THEN
      SELECT name INTO old_user_name FROM users WHERE id = OLD.assigned_to;
    END IF;
    
    IF NEW.assigned_to IS NOT NULL THEN
      SELECT name INTO new_user_name FROM users WHERE id = NEW.assigned_to;
    END IF;

    INSERT INTO ticket_history (
      ticket_id, user_id, action_type, field_changed, 
      old_value, new_value, description, metadata
    ) VALUES (
      NEW.id,
      current_user_id,
      CASE 
        WHEN OLD.assigned_to IS NULL AND NEW.assigned_to IS NOT NULL THEN 'assigned'
        WHEN OLD.assigned_to IS NOT NULL AND NEW.assigned_to IS NULL THEN 'unassigned'
        ELSE 'reassigned'
      END,
      'assigned_to',
      OLD.assigned_to::text,
      NEW.assigned_to::text,
      CASE 
        WHEN OLD.assigned_to IS NULL AND NEW.assigned_to IS NOT NULL THEN 
          format('Ticket atribuído para %s', COALESCE(new_user_name, 'usuário'))
        WHEN OLD.assigned_to IS NOT NULL AND NEW.assigned_to IS NULL THEN 
          format('Ticket desatribuído de %s', COALESCE(old_user_name, 'usuário'))
        ELSE 
          format('Ticket reatribuído de %s para %s', 
            COALESCE(old_user_name, 'usuário'), 
            COALESCE(new_user_name, 'usuário'))
      END,
      jsonb_build_object(
        'old_user_name', old_user_name,
        'new_user_name', new_user_name
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Criar trigger para capturar mudanças
DROP TRIGGER IF EXISTS ticket_changes_trigger ON tickets;
CREATE TRIGGER ticket_changes_trigger
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION log_ticket_changes();

-- 10. Função auxiliar para definir context do usuário
CREATE OR REPLACE FUNCTION set_current_user_context(user_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Comentários informativos
COMMENT ON TABLE ticket_history IS 'Histórico de todas as mudanças nos tickets';
COMMENT ON COLUMN ticket_history.action_type IS 'Tipo: priority_changed, status_changed, assigned, unassigned, reassigned';
COMMENT ON COLUMN ticket_history.field_changed IS 'Campo alterado: priority, status, assigned_to';
COMMENT ON COLUMN ticket_history.metadata IS 'Dados extras em JSON para contexto adicional';

-- Resultado final
SELECT 'Tabela ticket_history criada com sucesso!' as resultado;









